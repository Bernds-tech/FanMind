#!/usr/bin/env node
import { createHash, randomBytes } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { access, constants, mkdir, mkdtemp, open, readFile, rename, rm, stat, unlink, writeFile } from 'node:fs/promises';
import { hostname, tmpdir } from 'node:os';
import { join, basename, dirname } from 'node:path';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const VERSION = 'phase5-backup-worker-4';
const JOBS = new Set(['backup_server_config','backup_database','backup_storage','backup_full']);
const STORAGE_PAGE_SIZE = Math.min(Math.max(Number(process.env.FANMIND_STORAGE_BACKUP_PAGE_SIZE || 1000), 1), 1000);
const WORKER_ID = process.env.FANMIND_BACKUP_WORKER_ID || `fanmind-backup-${hostname() || 'worker'}-${process.pid}`;
const DEFAULT_BACKUP_POLL_MS = 30000;
const DEFAULT_BACKUP_HEARTBEAT_MS = 300000;
let stopping = false;
process.on('SIGTERM', () => { stopping = true; log('info', 'sigterm_received'); });
process.on('SIGINT', () => { stopping = true; log('info', 'sigint_received'); });

function required(name) { const value = process.env[name]; if (!value) throw new Error(`${name}_missing`); return value; }
function requireSupabaseUrl() { return required('NEXT_PUBLIC_SUPABASE_URL').replace(/\/$/,''); }
function requireServiceKey() { return required('SUPABASE_SERVICE_ROLE_KEY'); }
function log(level, event, meta = {}) { console.log(JSON.stringify({ ts:new Date().toISOString(), level, event, worker_id:WORKER_ID, ...redact(meta) })); }
function redact(value) { return JSON.parse(JSON.stringify(value, (k, v) => /key|secret|password|token|pgpass|authorization|dump/i.test(k) ? '[redacted]' : v)); }
function restUrl(table, query='') { return `${requireSupabaseUrl()}/rest/v1/${table}${query}`; }
function headers(extra={}) { const key = requireServiceKey(); return { apikey:key, Authorization:`Bearer ${key}`, 'Content-Type':'application/json', Prefer:'return=representation', ...extra }; }
async function api(path, init={}) { const r = await fetch(path, { ...init, headers: headers(init.headers || {}) }); if (!r.ok) throw new Error(`supabase_${r.status}`); return r.status === 204 ? null : r.json(); }
async function rpc(name, body) { return api(`${requireSupabaseUrl()}/rest/v1/rpc/${name}`, { method:'POST', body:JSON.stringify(body) }); }
function run(bin, args, opts={}) { return new Promise((resolvePromise, reject) => { const p = spawn(bin, args, { shell:false, stdio:['ignore','pipe','pipe'], env:{...process.env, ...(opts.env || {})}, cwd:opts.cwd }); p.stderr.on('data', () => {}); p.on('close', code => code === 0 ? resolvePromise() : reject(new Error(`${basename(bin)}_exit_${code}`))); }); }
async function sha256(file) { const h = createHash('sha256'); await new Promise((res, rej) => createReadStream(file).on('data', d=>h.update(d)).on('error', rej).on('end', res)); return h.digest('hex'); }
async function size(file) { return (await stat(file)).size; }
function backupRoot() { return process.env.FANMIND_BACKUP_ROOT || '/var/backups/fanmind'; }
let fsHooks = { rename };
function __setBackupWorkerTestHooks(hooks = {}) { fsHooks = { rename, ...hooks }; }
async function pathExists(file) { try { await access(file, constants.F_OK); return true; } catch { return false; } }
async function assertNoFinalCollision(...files) { for (const file of files) { if (await pathExists(file)) throw new Error('backup_destination_exists'); } }
async function copyToPrivateTemp(source, target) {
  const handle = await open(target, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY, 0o600);
  await new Promise((resolve, reject) => {
    const input = createReadStream(source);
    const output = createWriteStream(null, { fd: handle.fd, autoClose:false, mode:0o600 });
    let settled = false;
    const done = (error) => {
      if (settled) return;
      settled = true;
      input.destroy();
      output.destroy();
      if (error) reject(error);
      else resolve();
    };
    input.on('error', done);
    output.on('error', done);
    output.on('finish', () => done());
    input.pipe(output);
  }).finally(() => handle.close().catch(error => { if (error?.code !== 'EBADF') throw error; }));
}
async function existsReadable(file) { await access(file, constants.R_OK); return file; }
async function insert(table, row) { return (await api(restUrl(table), { method:'POST', body:JSON.stringify(row) }))[0]; }
async function patch(table, id, row) { return api(restUrl(table, `?id=eq.${encodeURIComponent(id)}`), { method:'PATCH', body:JSON.stringify(row) }); }
async function notify(severity, title, message, source, technical_reference) { await insert('admin_notifications', { category:severity, severity, title, message, source, technical_reference, metadata:{ worker_id:WORKER_ID } }).catch(e => log('warn','notification_failed',{error:e.message})); }
async function audit(action, outcome, metadata={}) { await insert('operations_audit_log', { action, outcome, target_table:'admin_operation_jobs', severity: outcome === 'success' ? 'info' : 'warning', metadata }).catch(()=>{}); }
async function heartbeat(status='healthy') { await insert('system_health_events', { component:'backup_worker', status, severity:status==='healthy'?'info':'warning', summary:`Backup worker heartbeat: ${status}`, technical_reference:WORKER_ID, metadata:{ version:VERSION } }).catch(()=>{}); }
function parsePositiveInt(value, fallback) { const parsed = Number(value); return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback; }
function backupPollMs() { return parsePositiveInt(process.env.FANMIND_BACKUP_POLL_MS, DEFAULT_BACKUP_POLL_MS); }
function backupHeartbeatMs() { return parsePositiveInt(process.env.FANMIND_BACKUP_HEARTBEAT_MS, DEFAULT_BACKUP_HEARTBEAT_MS); }
function sleep(ms) { return new Promise(r=>setTimeout(r, ms)); }
function firstClaimResponseRow(response) { return Array.isArray(response) ? response[0] : response; }
function normalizeClaimedJob(response) { const job = firstClaimResponseRow(response); if (!job || typeof job !== 'object') return null; if (typeof job.id !== 'string' || job.id.trim() === '') return null; if (typeof job.job_type !== 'string') return null; if (!JOBS.has(job.job_type)) return null; return job; }
function isUnsupportedClaimedJob(response) { const job = firstClaimResponseRow(response); return Boolean(job && typeof job === 'object' && typeof job.id === 'string' && job.id.trim() !== '' && typeof job.job_type === 'string' && !JOBS.has(job.job_type)); }

async function encryptedFinalize(clearFile, type, manifest) { const recipientFile = required('FANMIND_BACKUP_PUBLIC_KEY_FILE'); const encrypted = `${clearFile}.age`; await run(process.env.FANMIND_AGE_BIN || 'age', ['-R', recipientFile, '-o', encrypted, clearFile]); await rm(clearFile, { force:true }); const checksum = await sha256(encrypted); const checksumFile = `${encrypted}.sha256`; await writeFile(checksumFile, `${checksum}  ${basename(encrypted)}\n`, { mode:0o600 }); const s = await size(encrypted); return { path:encrypted, checksum_path:checksumFile, sha256:checksum, size_bytes:s, manifest:{...manifest, encrypted:true, format_version:1, worker_version:VERSION, backup_type:type} }; }
async function tarValidate(file) { await run('tar', ['-tzf', file]); }
async function createServerConfig(tmp) { const out = join(tmp, `fanmind-server-config-${Date.now()}.tar.gz`); const pm2Dump = process.env.FANMIND_PM2_DUMP_FILE || '/home/ubuntu/.pm2/dump.pm2'; try { await existsReadable(pm2Dump); } catch { throw new Error('pm2_dump_file_unreadable'); } const paths = ['/var/www/fanmind/.env.production', pm2Dump, '/etc/nginx','/etc/systemd/system','/etc/fanmind-backup']; await run('tar', ['--ignore-failed-read','--warning=no-file-changed','-czf', out, ...paths]); await tarValidate(out); return encryptedFinalize(out, 'server_config', { included:['env_production','pm2_dump','nginx','systemd_units','sensitive_encrypted_config'], sensitive_encrypted_config:true }); }
async function createDatabase(tmp) { const out = join(tmp, `fanmind-database-${Date.now()}.dump`); const env = { PGPASSFILE: required('FANMIND_BACKUP_PGPASSFILE') }; const args = ['--format=custom','--no-owner','--no-privileges','--file',out,'--host',required('FANMIND_BACKUP_DB_HOST'),'--port',process.env.FANMIND_BACKUP_DB_PORT || '5432','--username',required('FANMIND_BACKUP_DB_USER'),required('FANMIND_BACKUP_DB_NAME')]; await run(process.env.FANMIND_PG_DUMP_BIN || '/usr/lib/postgresql/17/bin/pg_dump', args, { env }); await run(process.env.FANMIND_PG_RESTORE_BIN || '/usr/lib/postgresql/17/bin/pg_restore', ['--list', out], { env }); return encryptedFinalize(out, 'database', { pg_format:'custom', validated_with:'pg_restore --list' }); }
async function listStorage(prefix='', offset=0) { const body = { prefix, limit:STORAGE_PAGE_SIZE, offset, sortBy:{ column:'name', order:'asc' } }; const rows = await api(`${requireSupabaseUrl()}/storage/v1/object/list/fanmind-assets`, { method:'POST', body:JSON.stringify(body), headers:{ Authorization:`Bearer ${requireServiceKey()}`, apikey:requireServiceKey() } }); return rows || []; }
async function walkStorage(prefix='', acc=[], seen=new Set()) { for (let offset=0, guard=0;; offset += STORAGE_PAGE_SIZE, guard++) { if (guard > 10000) throw new Error('storage_pagination_guard_exceeded'); const page = (await listStorage(prefix, offset)).filter(item => item.name !== '.emptyFolderPlaceholder'); for (const item of page) { const path = prefix ? `${prefix}/${item.name}` : item.name; const isFolder = !item.id && !item.metadata?.size; if (isFolder) await walkStorage(path, acc, seen); else { if (seen.has(path)) throw new Error('storage_duplicate_object_path'); seen.add(path); acc.push({ path, ...item }); } } if (page.length < STORAGE_PAGE_SIZE) break; } return acc; }
async function createStorage(tmp) { const root = join(tmp, 'storage'); await mkdir(root, { recursive:true, mode:0o700 }); const objects = await walkStorage(); const files=[]; for (const obj of objects) { const r = await fetch(`${requireSupabaseUrl()}/storage/v1/object/fanmind-assets/${encodeURI(obj.path)}`, { headers:{ Authorization:`Bearer ${requireServiceKey()}`, apikey:requireServiceKey() } }); if (!r.ok) throw new Error('storage_download_failed'); const target = join(root, obj.path); await mkdir(dirname(target), { recursive:true, mode:0o700 }); await new Promise((res, rej) => { const w = createWriteStream(target, { mode:0o600 }); if (!r.body?.pipeTo) { rej(new Error('stream_unavailable')); return; } r.body.pipeTo(new WritableStream({ write(c){ w.write(Buffer.from(c)); }, close(){ w.end(); res(); }, abort:rej })).catch(rej); }); files.push({ path:obj.path, size:await size(target), content_type:obj.metadata?.mimetype || null, created_at:obj.created_at, updated_at:obj.updated_at, sha256:await sha256(target) }); }
 if (files.length !== objects.length) throw new Error('storage_object_count_mismatch'); const manifest = { bucket:'fanmind-assets', listed_object_count:objects.length, downloaded_object_count:files.length, object_count:files.length, total_size_bytes:files.reduce((a,f)=>a+f.size,0), files }; await writeFile(join(root,'manifest.json'), JSON.stringify(manifest,null,2), { mode:0o600 }); const out = join(tmp, `fanmind-storage-${Date.now()}.tar.gz`); await run('tar', ['-czf', out, '-C', root, '.']); await tarValidate(out); return encryptedFinalize(out, 'storage', manifest); }
async function createFull(tmp) { const fullDir = join(tmp, `fanmind-full-${Date.now()}`); await mkdir(fullDir, { recursive:true, mode:0o700 }); const parts=[]; for (const part of [await createServerConfig(tmp), await createDatabase(tmp), await createStorage(tmp)]) { const dest = join(fullDir, basename(part.path)); const sumDest = `${dest}.sha256`; await rename(part.path, dest); await rename(part.checksum_path, sumDest); parts.push({ ...part, path:dest, checksum_path:sumDest }); }
 const manifest = { created_at:new Date().toISOString(), production_commit:process.env.FANMIND_RELEASE_COMMIT || process.env.GITHUB_SHA || 'unknown', worker_version:VERSION, parts:parts.map(p=>({ file:basename(p.path), checksum_file:basename(p.checksum_path), sha256:p.sha256, size_bytes:p.size_bytes, manifest:p.manifest })) }; await writeFile(join(fullDir,'manifest.json'), JSON.stringify(manifest,null,2), { mode:0o600 }); const clear = join(tmp, `fanmind-full-${Date.now()}.tar.gz`); await run('tar', ['-czf', clear, '-C', fullDir, '.']); await tarValidate(clear); return encryptedFinalize(clear, 'full', manifest); }
async function placeBackupPair(result) {
  const root = backupRoot();
  await mkdir(root, { recursive:true, mode:0o700 });
  const final = join(root, basename(result.path));
  const checksumFinal = `${final}.sha256`;
  await assertNoFinalCollision(final, checksumFinal);

  const nonce = randomBytes(12).toString('hex');
  const tempArtifact = join(root, `.${basename(result.path)}.${nonce}.part`);
  const tempChecksum = join(root, `.${basename(result.checksum_path)}.${nonce}.part`);
  let checksumRenamed = false;
  let artifactRenamed = false;
  try {
    await copyToPrivateTemp(result.path, tempArtifact);
    await copyToPrivateTemp(result.checksum_path, tempChecksum);
    await existsReadable(tempArtifact);
    await existsReadable(tempChecksum);
    const actual = await sha256(tempArtifact);
    const expected = (await readFile(tempChecksum, 'utf8')).trim().split(/\s+/)[0];
    if (actual !== result.sha256 || actual !== expected) throw new Error('sha256_mismatch_after_copy');
    await assertNoFinalCollision(final, checksumFinal);
    await fsHooks.rename(tempChecksum, checksumFinal);
    checksumRenamed = true;
    await fsHooks.rename(tempArtifact, final);
    artifactRenamed = true;
    await existsReadable(final);
    await existsReadable(checksumFinal);
    await unlink(result.checksum_path);
    await unlink(result.path);
    return { final, checksumFinal };
  } catch (error) {
    await rm(tempArtifact, { force:true }).catch(()=>{});
    await rm(tempChecksum, { force:true }).catch(()=>{});
    if (checksumRenamed) await rm(checksumFinal, { force:true }).catch(()=>{});
    if (artifactRenamed) await rm(final, { force:true }).catch(()=>{});
    throw error;
  }
}
async function moveAndValidate(result) { return placeBackupPair(result); }
async function offsite(file) {
  if (process.env.FANMIND_BACKUP_OFFSITE_ENABLED !== 'true') return { status:'not_configured' };
  const remote = required('FANMIND_BACKUP_RCLONE_REMOTE');
  const remotePath = process.env.FANMIND_BACKUP_REMOTE_PATH || 'fanmind';
  const config = process.env.FANMIND_BACKUP_RCLONE_CONFIG;
  const rcloneBin = process.env.FANMIND_RCLONE_BIN || 'rclone';
  const reference = `${remote}:${remotePath}/${basename(file)}`;
  const mkArgs = (src) => [...(config ? ['--config', config] : []), 'copyto', src, `${remote}:${remotePath}/${basename(src)}`];

  await run(process.env.FANMIND_RCLONE_BIN || 'rclone', mkArgs(file));

  try {
    await run(process.env.FANMIND_RCLONE_BIN || 'rclone', mkArgs(`${file}.sha256`));
  } catch (error) {
    const cleanupArgs = [...(config ? ['--config', config] : []), 'deletefile', reference];
    try {
      await run(rcloneBin, cleanupArgs);
    } catch (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        'offsite_checksum_upload_failed_cleanup_failed',
      );
    }
    throw error;
  }

  return {
    status:'uploaded',
    reference,
    checksum_reference:`${remote}:${remotePath}/${basename(file)}.sha256`,
  };
}
async function handle(job) { if (!JOBS.has(job.job_type)) throw new Error('job_type_not_allowed'); await patch('admin_operation_jobs', job.id, { status:'running', started_at:new Date().toISOString(), lease_until:new Date(Date.now()+900000).toISOString() }); const tmp = await mkdtemp(join(tmpdir(), 'fanmind-backup-')); try { const start = Date.now(); let result; if (job.job_type === 'backup_server_config') result = await createServerConfig(tmp); else if (job.job_type === 'backup_database') result = await createDatabase(tmp); else if (job.job_type === 'backup_storage') result = await createStorage(tmp); else result = await createFull(tmp); const { final, checksumFinal } = await moveAndValidate(result); const off = await offsite(final).catch(e => ({ status:'failed', error:e.message })); const status = off.status === 'not_configured' ? 'offsite_pending' : off.status === 'failed' ? 'degraded' : 'succeeded'; const runRow = await insert('backup_runs', { backup_type: result.manifest.backup_type, status, severity: status === 'succeeded' ? 'info':'warning', finished_at:new Date().toISOString(), storage_reference:final, checksum_reference:checksumFinal, sha256:result.sha256, size_bytes:result.size_bytes, validation_status:'passed', offsite_status:off.status, offsite_reference:off.reference || null, job_id:job.id, worker_id:WORKER_ID, duration_ms:Date.now()-start, manifest:{...result.manifest, checksum_reference:checksumFinal, offsite_checksum_reference:off.checksum_reference || null} }); await patch('admin_operation_jobs', job.id, { status:'succeeded', finished_at:new Date().toISOString(), result_reference:runRow.id, lease_until:null }); await notify(status === 'succeeded' ? 'info':'warning', status === 'succeeded' ? 'Backup erfolgreich' : 'Backup lokal erfolgreich, Offsite ausstehend', `${job.job_type} wurde verarbeitet.`, 'backup_worker', runRow.id); await audit(job.job_type, 'success', { backup_run_id:runRow.id, offsite_status:off.status }); } finally { await rm(tmp, { recursive:true, force:true }); } }
async function loop() { log('info','worker_start',{version:VERSION}); let lastHeartbeatAt = 0; while (!stopping) { const now = Date.now(); if (now - lastHeartbeatAt >= backupHeartbeatMs()) { await heartbeat(); lastHeartbeatAt = now; } const claimResponse = await rpc('claim_admin_backup_job', { p_worker_id:WORKER_ID, p_lease_seconds:900 }).catch(e => { log('warn','claim_failed',{error:e.message}); return null; }); const job = normalizeClaimedJob(claimResponse); if (!job) { if (isUnsupportedClaimedJob(claimResponse)) { const unsupportedJob = firstClaimResponseRow(claimResponse); const msg = 'job_type_not_allowed'; await patch('admin_operation_jobs', unsupportedJob.id, { status:'failed', finished_at:new Date().toISOString(), error_code:'job', error_message:msg, lease_until:null }).catch(()=>{}); log('warn','job_rejected',{job_id:unsupportedJob.id, job_type:unsupportedJob.job_type, error:msg}); } await sleep(backupPollMs()); continue; } log('info','job_claimed',{job_id:job.id, job_type:job.job_type}); try { await handle(job); } catch(e) { const msg = e instanceof Error ? e.message.replace(/[^a-zA-Z0-9_.:-]/g,'_').slice(0,160) : 'unknown_error'; await patch('admin_operation_jobs', job.id, { status:'failed', finished_at:new Date().toISOString(), error_code:msg.split('_')[0] || 'backup_failed', error_message:msg, lease_until:null }).catch(()=>{}); await notify('critical','Backup fehlgeschlagen', `${job.job_type} ist fehlgeschlagen.`, 'backup_worker', job.id); await audit(job.job_type, 'failure', { error_code:msg }); log('error','job_failed',{job_id:job.id,error:msg}); } } log('info','worker_stop'); }
export { encryptedFinalize, createFull, createStorage, walkStorage, listStorage, placeBackupPair, moveAndValidate, offsite, createServerConfig, normalizeClaimedJob, backupPollMs, backupHeartbeatMs, __setBackupWorkerTestHooks, JOBS };
if (import.meta.url === pathToFileURL(process.argv[1]).href) loop().catch(e => { log('error','fatal',{error:e.message}); process.exit(2); });
