import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, basename } from 'node:path';

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

const worker = await import('../scripts/operations/backup-worker.mjs');
const workerSource = await readFile(new URL('../scripts/operations/backup-worker.mjs', import.meta.url), 'utf8');
const migration = await readFile(new URL('../supabase/migrations/20260711161500_disable_verify_backup_until_safe_validation.sql', import.meta.url), 'utf8');

const serviceRoleGrantMigration = await readFile(new URL('../supabase/migrations/20260711170000_grant_backup_worker_rpc_service_role.sql', import.meta.url), 'utf8');
const rpcPermissionProof = await readFile(new URL('./backup-worker-rpc-permissions.sql', import.meta.url), 'utf8');

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
  const result = await worker.createFull(tmp);
  assert.ok(result.path.endsWith('.tar.gz.age'));
  assert.ok(result.checksum_path.endsWith('.age.sha256'));
  assert.equal(result.manifest.parts.length, 3);
  for (const part of result.manifest.parts) {
    assert.match(part.file, /\.age$/);
    assert.match(part.checksum_file, /\.age\.sha256$/);
    assert.ok(part.sha256);
  }
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
