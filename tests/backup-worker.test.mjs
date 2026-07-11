import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, stat, readdir, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, basename } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://supabase.test';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test';
process.env.FANMIND_BACKUP_PUBLIC_KEY_FILE = '/tmp/fanmind-test-recipient.txt';
process.env.FANMIND_AGE_BIN = '/tmp/fanmind-test-age.sh';
process.env.FANMIND_PG_DUMP_BIN = '/tmp/fanmind-test-pgdump.sh';
process.env.FANMIND_PG_RESTORE_BIN = '/tmp/fanmind-test-pgrestore.sh';
process.env.FANMIND_BACKUP_PGPASSFILE = '/tmp/fanmind-test-pgpass';
process.env.FANMIND_BACKUP_DB_HOST = 'db.test';
process.env.FANMIND_BACKUP_DB_USER = 'postgres';
process.env.FANMIND_BACKUP_DB_NAME = 'postgres';
process.env.FANMIND_STORAGE_BACKUP_PAGE_SIZE = '2';

await writeFile('/tmp/fanmind-test-recipient.txt', 'age1test');
await writeFile('/tmp/fanmind-test-pgpass', 'localhost:*:*:*:x');
await writeFile('/tmp/fanmind-test-age.sh', '#!/usr/bin/env bash\nout=""\nwhile [[ $# -gt 0 ]]; do if [[ "$1" == "-o" ]]; then out="$2"; shift 2; else last="$1"; shift; fi; done\nprintf "AGE-ENCRYPTED\\n" > "$out"\ncat "$last" >> "$out"\n', { mode:0o755 });
await writeFile('/tmp/fanmind-test-pgdump.sh', '#!/usr/bin/env bash\nfor ((i=1;i<=$#;i++)); do if [[ "${!i}" == "--file" ]]; then j=$((i+1)); printf "PGDUMP" > "${!j}"; fi; done\n', { mode:0o755 });
await writeFile('/tmp/fanmind-test-pgrestore.sh', '#!/usr/bin/env bash\nexit 0\n', { mode:0o755 });

const execFileAsync = promisify(execFile);

const worker = await import('../scripts/operations/backup-worker.mjs');
const workerSource = await readFile(new URL('../scripts/operations/backup-worker.mjs', import.meta.url), 'utf8');
const releaseEnvHelper = new URL('../scripts/operations/write-backup-release-env.sh', import.meta.url);
const backupWorkerUnit = await readFile(new URL('../ops/systemd/fanmind-backup-worker.service', import.meta.url), 'utf8');
const deployWorkflow = await readFile(new URL('../.github/workflows/deploy-fanmind.yml', import.meta.url), 'utf8');

async function makePlacedPairFixture(tmp, name = 'artifact.dump.age', payload = 'payload') {
  const src = join(tmp, 'src');
  const root = join(tmp, 'dest');
  await import('node:fs/promises').then(fs => fs.mkdir(src, { recursive:true, mode:0o700 }));
  process.env.FANMIND_BACKUP_ROOT = root;
  const artifact = join(src, name);
  await writeFile(artifact, payload, { mode:0o600 });
  const sha = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload));
  const checksum = [...new Uint8Array(sha)].map(b => b.toString(16).padStart(2, '0')).join('');
  const checksumPath = `${artifact}.sha256`;
  await writeFile(checksumPath, `${checksum}  ${basename(artifact)}\n`, { mode:0o600 });
  return { root, result:{ path:artifact, checksum_path:checksumPath, sha256:checksum, size_bytes:payload.length, manifest:{ backup_type:'database' } } };
}

async function listRoot(root) {
  try { return (await readdir(root)).sort(); } catch { return []; }
}

const migration = await readFile(new URL('../supabase/migrations/20260711161500_disable_verify_backup_until_safe_validation.sql', import.meta.url), 'utf8');

const serviceRoleGrantMigration = await readFile(new URL('../supabase/migrations/20260711170000_grant_backup_worker_rpc_service_role.sql', import.meta.url), 'utf8');
const rpcPermissionProof = await readFile(new URL('./backup-worker-rpc-permissions.sql', import.meta.url), 'utf8');



test('backup release env helper writes one root-only release commit line atomically', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'fanmind-release-env-'));
  const target = join(tmp, 'release.env');
  const first = '0123456789abcdef0123456789abcdef01234567';
  const second = 'fedcba9876543210fedcba9876543210fedcba98';

  const firstRun = await execFileAsync('bash', [releaseEnvHelper.pathname, first, target]);
  assert.match(firstRun.stdout, /Backup release commit recorded: 0123456789ab/);
  assert.equal(await readFile(target, 'utf8'), `FANMIND_RELEASE_COMMIT=${first}\n`);
  assert.equal((await stat(target)).mode & 0o777, 0o600);
  assert.deepEqual((await readdir(tmp)).filter(name => name.includes('.tmp.')), []);

  await execFileAsync('bash', [releaseEnvHelper.pathname, second, target]);
  assert.equal(await readFile(target, 'utf8'), `FANMIND_RELEASE_COMMIT=${second}\n`);
  assert.deepEqual((await readdir(tmp)).filter(name => name.includes('.tmp.')), []);
});

test('backup release env helper rejects invalid release commit values without temp files', async () => {
  const invalidValues = ['', 'abc1234', 'ABCDEF0123456789ABCDEF0123456789ABCDEF01', '0123456789abcdef0123456789abcdef01234567x', '0123456789abcdef0123456789abcdef0123456;', '0123456789abcdef0123\n456789abcdef01234567'];

  for (const value of invalidValues) {
    const tmp = await mkdtemp(join(tmpdir(), 'fanmind-release-env-bad-'));
    const target = join(tmp, 'release.env');
    await assert.rejects(() => execFileAsync('bash', [releaseEnvHelper.pathname, value, target]), /release commit must be a full 40-character lowercase git SHA/);
    await assert.rejects(() => access(target), /ENOENT/);
    assert.deepEqual((await readdir(tmp)).filter(name => name.includes('.tmp.')), []);
  }
});

test('systemd unit loads optional release env after required worker env and keeps hardening', () => {
  const workerEnvIndex = backupWorkerUnit.indexOf('EnvironmentFile=/etc/fanmind-backup/worker.env');
  const releaseEnvIndex = backupWorkerUnit.indexOf('EnvironmentFile=-/etc/fanmind-backup/release.env');
  assert.ok(workerEnvIndex >= 0);
  assert.ok(releaseEnvIndex > workerEnvIndex);
  assert.match(backupWorkerUnit, /PrivateTmp=true/);
  assert.match(backupWorkerUnit, /ProtectSystem=strict/);
  assert.match(backupWorkerUnit, /NoNewPrivileges=true/);
});

test('deployment workflow records deployed commit only after successful healthcheck without starting inactive backup worker', () => {
  const indexOfRequired = (needle) => {
    const index = deployWorkflow.indexOf(needle);
    assert.notEqual(index, -1, `Missing workflow command: ${needle}`);
    return index;
  };

  const resetIndex = indexOfRequired('git reset --hard origin/main');
  const releaseCommitIndex = indexOfRequired('RELEASE_COMMIT="$(git rev-parse HEAD)"');
  const commitValidationIndex = indexOfRequired('^[0-9a-f]{40}$');
  const helperInstallIndex = indexOfRequired('sudo install -o root -g root -m 0755 scripts/operations/write-backup-release-env.sh /usr/local/lib/fanmind-ops/write-backup-release-env.sh');
  const unitInstallIndex = indexOfRequired('sudo install -o root -g root -m 0644 ops/systemd/fanmind-backup-worker.service /etc/systemd/system/fanmind-backup-worker.service');
  const daemonReloadIndex = indexOfRequired('sudo systemctl daemon-reload');
  const npmCiIndex = indexOfRequired('npm ci --no-audit --no-fund');
  const buildIndex = indexOfRequired('npm run build');
  const pm2RestartIndex = indexOfRequired('pm2 restart fanmind --update-env');
  const nginxIndex = indexOfRequired('sudo nginx -t');
  const healthcheckIndex = indexOfRequired('Health check passed.');
  const releaseWriteIndex = indexOfRequired('sudo /usr/local/lib/fanmind-ops/write-backup-release-env.sh "$RELEASE_COMMIT"');
  const workerActiveCheckIndex = indexOfRequired('sudo systemctl is-active --quiet fanmind-backup-worker.service');
  const workerRestartIndex = indexOfRequired('sudo systemctl restart fanmind-backup-worker.service');
  const inactiveWorkerMessageIndex = indexOfRequired('Backup worker is not active; not starting it.');

  assert.ok(resetIndex < releaseCommitIndex, 'git rev-parse HEAD stays immediately after reset and before build steps');
  assert.ok(releaseCommitIndex < commitValidationIndex, 'release commit is validated after it is read');
  assert.ok(commitValidationIndex < helperInstallIndex, 'helper install follows release commit validation');
  assert.ok(helperInstallIndex < unitInstallIndex);
  assert.ok(unitInstallIndex < daemonReloadIndex);
  assert.ok(daemonReloadIndex < npmCiIndex);
  assert.ok(releaseWriteIndex > healthcheckIndex, 'release.env is written only after the external healthcheck succeeds');
  assert.ok(releaseWriteIndex > npmCiIndex, 'release.env is not written before npm ci');
  assert.ok(releaseWriteIndex > buildIndex, 'release.env is not written before npm run build');
  assert.ok(releaseWriteIndex > pm2RestartIndex, 'release.env is not written before pm2 restart');
  assert.ok(releaseWriteIndex > nginxIndex, 'release.env is not written before nginx -t');
  assert.ok(releaseWriteIndex < workerActiveCheckIndex, 'worker restart check happens after release.env is written');
  assert.ok(workerActiveCheckIndex < workerRestartIndex, 'active worker is restarted only after the active check');
  assert.ok(workerRestartIndex < inactiveWorkerMessageIndex, 'inactive-worker branch logs instead of starting the worker');

  assert.match(deployWorkflow, /systemctl is-active --quiet fanmind-backup-worker\.service[\s\S]*systemctl restart fanmind-backup-worker\.service/);
  assert.match(deployWorkflow, /Backup worker is not active; not starting it\./);
  assert.doesNotMatch(deployWorkflow, /systemctl enable/);
  assert.doesNotMatch(deployWorkflow, /systemctl start fanmind-backup-worker\.service/);
});

test('verify_backup is blocked in worker and migration follow-up', () => {
  assert.equal(worker.JOBS.has('verify_backup'), false);
  assert.doesNotMatch(migration.match(/job_type in \(([^)]*)\)/)?.[1] ?? '', /verify_backup/);
  assert.match(migration, /verify_backup disabled/);
});

test('encrypted artifact and sha256 move together and validate after move', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'fanmind-unit-'));
  const root = join(tmp, 'dest');
  process.env.FANMIND_BACKUP_ROOT = root;
  const clear = join(tmp, 'artifact.txt');
  await writeFile(clear, 'payload');
  const result = await worker.encryptedFinalize(clear, 'database', {});
  assert.ok(result.checksum_path.endsWith('.age.sha256'));
  const moved = await worker.moveAndValidate(result);
  assert.equal(basename(moved.checksumFinal), `${basename(moved.final)}.sha256`);
  assert.equal((await stat(moved.final)).isFile(), true);
  assert.equal((await stat(moved.checksumFinal)).isFile(), true);
  assert.match(await readFile(moved.checksumFinal, 'utf8'), new RegExp(result.sha256));
});


test('cross-device rename failure is avoided by copy/verify/finalize placement', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'fanmind-cross-device-'));
  const { root, result } = await makePlacedPairFixture(tmp, 'fanmind-database-test.dump.age', 'database-payload');
  worker.__setBackupWorkerTestHooks({ rename: async (from, to) => {
    if (!from.startsWith(root) || !to.startsWith(root)) {
      throw Object.assign(new Error('EXDEV: cross-device link not permitted'), { code:'EXDEV' });
    }
    return (await import('node:fs/promises')).rename(from, to);
  }});
  const placed = await worker.moveAndValidate(result);
  worker.__setBackupWorkerTestHooks();
  assert.equal(await readFile(placed.final, 'utf8'), 'database-payload');
  assert.match(await readFile(placed.checksumFinal, 'utf8'), new RegExp(result.sha256));
});

test('successful copy keeps exact destination content and sha256', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'fanmind-copy-ok-'));
  const { result } = await makePlacedPairFixture(tmp, 'ok.dump.age', 'exact-payload');
  const placed = await worker.placeBackupPair(result);
  assert.equal(await readFile(placed.final, 'utf8'), 'exact-payload');
  assert.equal((await readFile(placed.checksumFinal, 'utf8')).trim().split(/\s+/)[0], result.sha256);
});

test('checksum mismatch cleans temporary destination files', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'fanmind-copy-bad-sha-'));
  const { root, result } = await makePlacedPairFixture(tmp, 'bad.dump.age', 'payload');
  result.sha256 = '0'.repeat(64);
  await assert.rejects(() => worker.placeBackupPair(result), /sha256_mismatch_after_copy/);
  assert.deepEqual(await listRoot(root), []);
});

test('copy failure on checksum file leaves no final age artifact', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'fanmind-second-copy-fails-'));
  const { root, result } = await makePlacedPairFixture(tmp, 'second.dump.age', 'payload');
  result.checksum_path = join(tmp, 'missing.sha256');
  await assert.rejects(() => worker.placeBackupPair(result), /ENOENT/);
  assert.equal((await listRoot(root)).some(name => name.endsWith('.age')), false);
});

test('final rename failure cleans misleading finalized files', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'fanmind-final-rename-fails-'));
  const { root, result } = await makePlacedPairFixture(tmp, 'rename.dump.age', 'payload');
  let count = 0;
  worker.__setBackupWorkerTestHooks({ rename: async (from, to) => {
    count += 1;
    if (count === 2) throw Object.assign(new Error('rename_failed'), { code:'EIO' });
    return (await import('node:fs/promises')).rename(from, to);
  }});
  await assert.rejects(() => worker.placeBackupPair(result), /rename_failed/);
  worker.__setBackupWorkerTestHooks();
  assert.deepEqual(await listRoot(root), []);
});

test('existing final destination is not silently overwritten', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'fanmind-collision-'));
  const { root, result } = await makePlacedPairFixture(tmp, 'collision.dump.age', 'payload');
  await import('node:fs/promises').then(fs => fs.mkdir(root, { recursive:true, mode:0o700 }));
  await writeFile(join(root, basename(result.path)), 'existing', { mode:0o600 });
  await assert.rejects(() => worker.placeBackupPair(result), /backup_destination_exists/);
  assert.equal(await readFile(join(root, basename(result.path)), 'utf8'), 'existing');
});

test('successful placement removes encrypted source pair only after finalization', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'fanmind-source-remove-'));
  const { result } = await makePlacedPairFixture(tmp, 'remove.dump.age', 'payload');
  const source = result.path;
  const checksumSource = result.checksum_path;
  const placed = await worker.placeBackupPair(result);
  await assert.rejects(() => access(source), /ENOENT/);
  await assert.rejects(() => access(checksumSource), /ENOENT/);
  assert.equal(basename(placed.checksumFinal), `${basename(placed.final)}.sha256`);
});

test('storage pagination walks multiple pages, nested folders and ignores placeholders', async () => {
  const listCalls = [];
  global.fetch = async (url, init={}) => {
    if (String(url).includes('/object/list/')) {
      const body = JSON.parse(init.body);
      listCalls.push(body);
      const key = `${body.prefix}:${body.offset}`;
      const pages = {
        ':0': [{ name:'a.txt', id:'1', metadata:{ size:1 } }, { name:'folder', metadata:{} }],
        ':2': [{ name:'.emptyFolderPlaceholder', id:'empty', metadata:{ size:0 } }],
        'folder:0': [{ name:'b.txt', id:'2', metadata:{ size:1 } }, { name:'deep', metadata:{} }],
        'folder:2': [{ name:'odd name.txt', id:'3', metadata:{ size:1 } }],
        'folder:4': [],
        'folder/deep:0': [{ name:'c.txt', id:'4', metadata:{ size:1 } }],
        'folder/deep:2': [],
      };
      return { ok:true, json: async () => pages[key] ?? [] };
    }
    return { ok:true, body: new Response('x').body };
  };
  const objects = await worker.walkStorage();
  assert.deepEqual(objects.map(o => o.path).sort(), ['a.txt','folder/b.txt','folder/deep/c.txt','folder/odd name.txt']);
  assert.ok(listCalls.some(c => c.offset === 2));
});

test('storage duplicate object paths fail the backup', async () => {
  global.fetch = async (url) => {
    if (String(url).includes('/object/list/')) return { ok:true, json: async () => [{ name:'dup.txt', id:'1', metadata:{ size:1 } }, { name:'dup.txt', id:'2', metadata:{ size:1 } }] };
    return { ok:true, body: new Response('x').body };
  };
  await assert.rejects(() => worker.walkStorage('', [], new Set()), /storage_duplicate_object_path/);
});

test('full backup artifact contains encrypted parts and central manifest before cleanup', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'fanmind-full-'));
  const pm2 = join(tmp, 'dump.pm2');
  process.env.FANMIND_PM2_DUMP_FILE = pm2;
  await writeFile(pm2, 'module.exports = {}');
  global.fetch = async (url) => {
    if (String(url).includes('/object/list/')) return { ok:true, json: async () => [] };
    return { ok:true, body: new Response('x').body };
  };
  const previousReleaseCommit = process.env.FANMIND_RELEASE_COMMIT;
  const previousGithubSha = process.env.GITHUB_SHA;
  process.env.FANMIND_RELEASE_COMMIT = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  process.env.GITHUB_SHA = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
  const result = await worker.createFull(tmp);
  if (previousReleaseCommit === undefined) delete process.env.FANMIND_RELEASE_COMMIT;
  else process.env.FANMIND_RELEASE_COMMIT = previousReleaseCommit;
  if (previousGithubSha === undefined) delete process.env.GITHUB_SHA;
  else process.env.GITHUB_SHA = previousGithubSha;
  assert.equal(result.manifest.production_commit, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  assert.ok(result.path.endsWith('.tar.gz.age'));
  assert.ok(result.checksum_path.endsWith('.age.sha256'));
  assert.equal(result.manifest.parts.length, 3);
  for (const part of result.manifest.parts) {
    assert.match(part.file, /\.age$/);
    assert.match(part.checksum_file, /\.age\.sha256$/);
    assert.ok(part.sha256);
  }
});



test('full backup manifest keeps controlled unknown fallback when no release commit exists', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'fanmind-full-no-release-'));
  const pm2 = join(tmp, 'dump.pm2');
  const previousReleaseCommit = process.env.FANMIND_RELEASE_COMMIT;
  const previousGithubSha = process.env.GITHUB_SHA;
  delete process.env.FANMIND_RELEASE_COMMIT;
  delete process.env.GITHUB_SHA;
  process.env.FANMIND_PM2_DUMP_FILE = pm2;
  await writeFile(pm2, 'module.exports = {}');
  global.fetch = async (url) => {
    if (String(url).includes('/object/list/')) return { ok:true, json: async () => [] };
    return { ok:true, body: new Response('x').body };
  };
  const result = await worker.createFull(tmp);
  if (previousReleaseCommit === undefined) delete process.env.FANMIND_RELEASE_COMMIT;
  else process.env.FANMIND_RELEASE_COMMIT = previousReleaseCommit;
  if (previousGithubSha === undefined) delete process.env.GITHUB_SHA;
  else process.env.GITHUB_SHA = previousGithubSha;
  assert.equal(result.manifest.production_commit, 'unknown');
});

test('missing PM2 dump path fails with data-sparse error', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'fanmind-pm2-'));
  process.env.FANMIND_PM2_DUMP_FILE = join(tmp, 'missing.pm2');
  await assert.rejects(() => worker.createServerConfig(tmp), /pm2_dump_file_unreadable/);
});



test('claim migration keeps one active backup job and lease expiry retry semantics', async () => {
  const baseMigration = await readFile(new URL('../supabase/migrations/20260711143000_phase_5_backup_worker.sql', import.meta.url), 'utf8');
  assert.match(baseMigration, /for update skip locked/i);
  assert.match(baseMigration, /lease_until <= now\(\)/i);
  assert.match(baseMigration, /attempt_count = j\.attempt_count \+ 1/i);
  assert.match(baseMigration, /where job_type in \('backup_server_config','backup_database','backup_storage','backup_full','verify_backup'\)/);
  assert.match(migration, /where job_type in \('backup_server_config','backup_database','backup_storage','backup_full'\)/);
});

test('offsite source treats artifact and checksum uploads as required transfer pair', () => {
  assert.match(workerSource, /await run\(process\.env\.FANMIND_RCLONE_BIN \|\| 'rclone', mkArgs\(file\)\)/);
  assert.match(workerSource, /await run\(process\.env\.FANMIND_RCLONE_BIN \|\| 'rclone', mkArgs\(`\$\{file\}\.sha256`\)\)/);
  assert.match(workerSource, /checksum_reference:`\$\{remote}:\$\{remotePath}\/\$\{basename\(file\)}\.sha256`/);
});

test('worker source keeps checksum offsite upload and no root pm2 path', () => {
  assert.match(workerSource, /copyto.*`\$\{file\}\.sha256`/s);
  assert.doesNotMatch(workerSource, /\/root\/\.pm2\/dump\.pm2/);
  assert.match(workerSource, /sensitive_encrypted_config/);
});


test('service_role follow-up migration grants only the server-side worker role', () => {
  assert.match(serviceRoleGrantMigration, /to_regprocedure\('public\.claim_admin_backup_job\(text, integer\)'\) is null/i);
  assert.match(serviceRoleGrantMigration, /raise exception 'required function public\.claim_admin_backup_job\(text, integer\) does not exist'/i);
  assert.match(serviceRoleGrantMigration, /revoke all on function public\.claim_admin_backup_job\(text, integer\) from public, anon, authenticated;/i);
  assert.match(serviceRoleGrantMigration, /grant execute on function public\.claim_admin_backup_job\(text, integer\) to service_role;/i);
  assert.doesNotMatch(serviceRoleGrantMigration, /grant execute on function public\.claim_admin_backup_job\(text, integer\) to (public|anon|authenticated)/i);
  assert.doesNotMatch(serviceRoleGrantMigration, /alter table|update public\.|insert into public\.|delete from public\./i);
});

test('documented SQL proof checks RPC privileges and service-role claim path without secrets', () => {
  assert.match(rpcPermissionProof, /has_schema_privilege\('service_role', 'public', 'USAGE'\)/i);
  assert.match(rpcPermissionProof, /has_function_privilege\('service_role', 'public\.claim_admin_backup_job\(text, integer\)', 'EXECUTE'\)/i);
  assert.match(rpcPermissionProof, /not has_function_privilege\('anon', 'public\.claim_admin_backup_job\(text, integer\)', 'EXECUTE'\)/i);
  assert.match(rpcPermissionProof, /not has_function_privilege\('authenticated', 'public\.claim_admin_backup_job\(text, integer\)', 'EXECUTE'\)/i);
  assert.match(rpcPermissionProof, /not has_function_privilege\('public', 'public\.claim_admin_backup_job\(text, integer\)', 'EXECUTE'\)/i);
  assert.match(rpcPermissionProof, /set local role service_role;/i);
  assert.match(rpcPermissionProof, /public\.claim_admin_backup_job\('rpc-permission-fixture-worker', 900\)/i);
  assert.match(rpcPermissionProof, /'claimed'/i);
  assert.doesNotMatch(rpcPermissionProof, /SUPABASE_SERVICE_ROLE_KEY|service-role-test|Bearer\s+[A-Za-z0-9._-]+|apikey\s*[:=]|password\s*[:=]|secret\s*[:=]/i);
});

test('claim response normalization treats nullish and empty responses as no job', () => {
  assert.equal(worker.normalizeClaimedJob(null), null);
  assert.equal(worker.normalizeClaimedJob(undefined), null);
  assert.equal(worker.normalizeClaimedJob([]), null);
});

test('claim response normalization treats empty composite rows as no job', () => {
  assert.equal(worker.normalizeClaimedJob([{ id: null, job_type: null }]), null);
  assert.equal(worker.normalizeClaimedJob({ id: null, job_type: null }), null);
});

test('claim response normalization accepts a valid direct job object', () => {
  const job = { id: 'job-1', job_type: 'backup_database', extra: 'kept' };
  assert.equal(worker.normalizeClaimedJob(job), job);
});

test('claim response normalization accepts a valid single-row array job', () => {
  const job = { id: 'job-2', job_type: 'backup_storage' };
  assert.equal(worker.normalizeClaimedJob([job]), job);
});

test('claim response normalization rejects unsupported job types as not executable', () => {
  assert.equal(worker.normalizeClaimedJob({ id: 'job-3', job_type: 'verify_backup' }), null);
  assert.equal(worker.normalizeClaimedJob([{ id: 'job-4', job_type: 'not_allowed' }]), null);
});

test('no-job path uses the configured backup poll sleep interval', () => {
  const previous = process.env.FANMIND_BACKUP_POLL_MS;
  process.env.FANMIND_BACKUP_POLL_MS = '1234';
  assert.equal(worker.backupPollMs(), 1234);
  process.env.FANMIND_BACKUP_POLL_MS = '0';
  assert.equal(worker.backupPollMs(), 30000);
  if (previous === undefined) delete process.env.FANMIND_BACKUP_POLL_MS;
  else process.env.FANMIND_BACKUP_POLL_MS = previous;
});

test('heartbeat interval is decoupled from the job poll interval and configurable', () => {
  const previousHeartbeat = process.env.FANMIND_BACKUP_HEARTBEAT_MS;
  const previousPoll = process.env.FANMIND_BACKUP_POLL_MS;
  delete process.env.FANMIND_BACKUP_HEARTBEAT_MS;
  delete process.env.FANMIND_BACKUP_POLL_MS;
  assert.equal(worker.backupPollMs(), 30000);
  assert.equal(worker.backupHeartbeatMs(), 300000);
  process.env.FANMIND_BACKUP_POLL_MS = '30000';
  process.env.FANMIND_BACKUP_HEARTBEAT_MS = '600000';
  assert.equal(worker.backupPollMs(), 30000);
  assert.equal(worker.backupHeartbeatMs(), 600000);
  if (previousHeartbeat === undefined) delete process.env.FANMIND_BACKUP_HEARTBEAT_MS;
  else process.env.FANMIND_BACKUP_HEARTBEAT_MS = previousHeartbeat;
  if (previousPoll === undefined) delete process.env.FANMIND_BACKUP_POLL_MS;
  else process.env.FANMIND_BACKUP_POLL_MS = previousPoll;
});
