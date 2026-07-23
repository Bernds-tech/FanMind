#!/usr/bin/env node

import { createHash, randomBytes } from 'node:crypto';
import { createReadStream } from 'node:fs';
import {
  access,
  appendFile,
  chmod,
  chown,
  readFile,
  readdir,
  rename,
  stat,
  writeFile,
} from 'node:fs/promises';
import { basename, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const SAFE_ERRORS = new Set([
  'configuration_missing',
  'foundation_release_timeout',
  'foundation_health_failed',
  'backup_worker_inactive',
  'backup_enqueue_failed',
  'backup_job_failed',
  'backup_timeout',
  'backup_checksum_invalid',
  'psql_missing',
  'migration_failed',
  'privileges_invalid',
  'postgrest_schema_timeout',
  'rpc_call_failed',
  'atomicity_failed',
  'anon_execute_allowed',
  'probe_cleanup_failed',
  'secret_install_failed',
  'post_migration_health_failed',
]);

const workspace = process.env.GITHUB_WORKSPACE || '';
const expectedRelease = process.env.EXPECTED_RELEASE || '';
const runId = process.env.GITHUB_RUN_ID || `${Date.now()}`;
const reportPath = process.argv[2] || '';
const migrationPath = join(
  workspace,
  'supabase/migrations/20260723102000_shared_rate_limits.sql',
);
const backupRoot = '/var/backups/fanmind';
const workerEnvPath = '/etc/fanmind-backup/worker.env';
const appEnvPath = '/var/www/fanmind/.env.production';

function parseEnv(text) {
  const values = new Map();
  for (const rawLine of String(text).split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const separator = line.indexOf('=');
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      value.length >= 2
      && ((value.startsWith('"') && value.endsWith('"'))
        || (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }
    values.set(key, value);
  }
  return values;
}

function required(config, name) {
  const value = config.get(name) || '';
  if (!value) throw new Error('configuration_missing');
  return value;
}

async function emit(key, value) {
  const line = `${key}=${value}`;
  process.stdout.write(`${line}\n`);
  await appendFile(reportPath, `${line}\n`, { mode: 0o644 });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function execText(binary, args, options = {}) {
  const result = spawnSync(binary, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    timeout: options.timeout ?? 30000,
    env: options.env ?? process.env,
  });
  if (result.error || result.status !== 0) return null;
  return String(result.stdout || '').trim();
}

async function fetchJson(url, init = {}) {
  const response = await fetch(url, {
    ...init,
    signal: init.signal ?? AbortSignal.timeout(15000),
  });
  const payload = await response.json().catch(() => null);
  return { response, payload };
}

async function waitForFoundationRelease() {
  for (let attempt = 1; attempt <= 80; attempt += 1) {
    const version = await fetchJson('https://fanmind.ch/api/version').catch(() => null);
    const liveRelease = version?.response.ok
      && typeof version.payload?.releaseCommit === 'string'
      ? version.payload.releaseCommit
      : '';
    const serverHead = execText('/usr/bin/git', ['-C', '/var/www/fanmind', 'rev-parse', 'HEAD']);
    const originMain = execText('/usr/bin/git', ['-C', '/var/www/fanmind', 'rev-parse', 'origin/main']);

    if (
      liveRelease === expectedRelease
      && serverHead === expectedRelease
      && originMain === expectedRelease
    ) {
      const health = await fetchJson('https://fanmind.ch/api/health').catch(() => null);
      const components = health?.payload?.components
        && typeof health.payload.components === 'object'
        ? Object.values(health.payload.components)
        : [];
      const healthy = health?.response.ok
        && health.payload?.status === 'healthy'
        && components.every(component => component?.status === 'healthy');
      if (healthy) {
        await emit('FOUNDATION_RELEASE_SYNC', 'ok');
        await emit('FOUNDATION_PUBLIC_HEALTH', 'healthy');
        return;
      }
    }
    await sleep(10000);
  }
  throw new Error('foundation_release_timeout');
}

async function ensureWorkerActive() {
  const active = execText('/usr/bin/systemctl', [
    'is-active',
    'fanmind-backup-worker.service',
  ]);
  if (active !== 'active') throw new Error('backup_worker_inactive');
}

async function enqueueUniqueDatabaseBackup(workerConfig) {
  const url = required(workerConfig, 'NEXT_PUBLIC_SUPABASE_URL').replace(/\/$/, '');
  const key = required(workerConfig, 'SUPABASE_SERVICE_ROLE_KEY');
  const idempotency = `migration:shared-rate-limit:${runId}`;
  const result = await fetchJson(`${url}/rest/v1/admin_operation_jobs`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      job_type: 'backup_database',
      status: 'queued',
      severity: 'info',
      requested_at: new Date().toISOString(),
      title: 'Pre-migration database backup',
      summary: 'Guarded backup before the additive shared rate limit migration.',
      idempotency_key: idempotency,
      priority: 10,
      metadata: { source: 'shared_rate_limit_migration' },
    }),
  }).catch(() => null);
  if (!result?.response.ok) throw new Error('backup_enqueue_failed');
  const row = Array.isArray(result.payload) ? result.payload[0] : result.payload;
  if (!row || typeof row.id !== 'string') throw new Error('backup_enqueue_failed');
  await emit('PRE_MIGRATION_DATABASE_BACKUP_ENQUEUED', 'yes');
  return { id: row.id, idempotency, url, key };
}

async function queryBackupJob(job) {
  const result = await fetchJson(
    `${job.url}/rest/v1/admin_operation_jobs?id=eq.${encodeURIComponent(job.id)}&select=status`,
    {
      headers: {
        apikey: job.key,
        Authorization: `Bearer ${job.key}`,
      },
    },
  ).catch(() => null);
  if (!result?.response.ok) return null;
  const row = Array.isArray(result.payload) ? result.payload[0] : result.payload;
  return typeof row?.status === 'string' ? row.status : null;
}

async function findFreshDatabasePair(startedAtMs) {
  const entries = await readdir(backupRoot, { withFileTypes: true });
  const candidates = [];
  for (const entry of entries) {
    if (!entry.isFile() || !/^fanmind-database-\d{13}\.dump\.age$/.test(entry.name)) continue;
    const artifactPath = join(backupRoot, entry.name);
    const checksumPath = `${artifactPath}.sha256`;
    const metadata = await stat(artifactPath);
    if (metadata.mtimeMs <= startedAtMs) continue;
    try {
      const checksumMetadata = await stat(checksumPath);
      if (checksumMetadata.isFile()) {
        candidates.push({ artifactPath, checksumPath, metadata });
      }
    } catch {
      // Pair is not complete yet.
    }
  }
  candidates.sort((a, b) => b.metadata.mtimeMs - a.metadata.mtimeMs);
  return candidates[0] || null;
}

async function sha256(file) {
  const hash = createHash('sha256');
  await new Promise((resolve, reject) => {
    createReadStream(file)
      .on('data', chunk => hash.update(chunk))
      .on('error', reject)
      .on('end', resolve);
  });
  return hash.digest('hex');
}

async function waitForFreshBackup(job, startedAtMs) {
  for (let attempt = 1; attempt <= 120; attempt += 1) {
    const status = await queryBackupJob(job);
    if (status === 'failed' || status === 'cancelled') {
      throw new Error('backup_job_failed');
    }
    const pair = await findFreshDatabasePair(startedAtMs);
    if (pair) {
      const line = (await readFile(pair.checksumPath, 'utf8')).trim();
      const match = line.match(/^([0-9a-f]{64})\s+\*?(.+)$/i);
      if (!match || basename(match[2]) !== basename(pair.artifactPath)) {
        throw new Error('backup_checksum_invalid');
      }
      const actual = await sha256(pair.artifactPath);
      if (actual !== match[1].toLowerCase()) {
        throw new Error('backup_checksum_invalid');
      }
      await emit('PRE_MIGRATION_DATABASE_BACKUP_PAIR', 'complete');
      await emit('PRE_MIGRATION_DATABASE_BACKUP_CHECKSUM', 'ok');
      await emit('PRE_MIGRATION_DATABASE_BACKUP_SIZE_BYTES', pair.metadata.size);
      return;
    }
    await sleep(5000);
  }
  throw new Error('backup_timeout');
}

async function findPsql() {
  for (const candidate of ['/usr/bin/psql', '/usr/lib/postgresql/17/bin/psql']) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Continue.
    }
  }
  throw new Error('psql_missing');
}

function databaseArgs(config) {
  return [
    '--host', required(config, 'FANMIND_BACKUP_DB_HOST'),
    '--port', config.get('FANMIND_BACKUP_DB_PORT') || '5432',
    '--username', required(config, 'FANMIND_BACKUP_DB_USER'),
    '--dbname', required(config, 'FANMIND_BACKUP_DB_NAME'),
    '-v', 'ON_ERROR_STOP=1',
  ];
}

function databaseEnv(config) {
  return {
    ...process.env,
    PGPASSFILE: required(config, 'FANMIND_BACKUP_PGPASSFILE'),
  };
}

function psqlQuery(psql, config, sql) {
  const result = spawnSync(
    psql,
    [...databaseArgs(config), '-Atc', sql],
    {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 30000,
      env: databaseEnv(config),
    },
  );
  if (result.error || result.status !== 0) throw new Error('migration_failed');
  return String(result.stdout || '').trim();
}

async function applyMigration(psql, dbConfig) {
  await access(migrationPath);
  const result = spawnSync(
    psql,
    [...databaseArgs(dbConfig), '-f', migrationPath],
    {
      encoding: 'utf8',
      stdio: ['ignore', 'ignore', 'ignore'],
      timeout: 120000,
      env: databaseEnv(dbConfig),
    },
  );
  if (result.error || result.status !== 0) throw new Error('migration_failed');
  await emit('SHARED_RATE_LIMIT_MIGRATION', 'applied');
}

async function verifyPrivileges(psql, dbConfig) {
  const payload = psqlQuery(psql, dbConfig, `
    select json_build_object(
      'table_exists', to_regclass('public.shared_rate_limit_buckets') is not null,
      'rls_enabled', coalesce((
        select c.relrowsecurity
          from pg_class c
          join pg_namespace n on n.oid = c.relnamespace
         where n.nspname = 'public'
           and c.relname = 'shared_rate_limit_buckets'
      ), false),
      'service_consume', has_function_privilege('service_role', 'public.consume_shared_rate_limit(text,text,integer,integer)', 'EXECUTE'),
      'anon_consume', has_function_privilege('anon', 'public.consume_shared_rate_limit(text,text,integer,integer)', 'EXECUTE'),
      'authenticated_consume', has_function_privilege('authenticated', 'public.consume_shared_rate_limit(text,text,integer,integer)', 'EXECUTE'),
      'service_cleanup', has_function_privilege('service_role', 'public.cleanup_shared_rate_limit_buckets(integer)', 'EXECUTE'),
      'anon_table_select', has_table_privilege('anon', 'public.shared_rate_limit_buckets', 'SELECT'),
      'authenticated_table_select', has_table_privilege('authenticated', 'public.shared_rate_limit_buckets', 'SELECT')
    )::text;
  `);
  const value = JSON.parse(payload);
  const ok = value.table_exists === true
    && value.rls_enabled === true
    && value.service_consume === true
    && value.anon_consume === false
    && value.authenticated_consume === false
    && value.service_cleanup === true
    && value.anon_table_select === false
    && value.authenticated_table_select === false;
  if (!ok) throw new Error('privileges_invalid');
  await emit('SHARED_RATE_LIMIT_TABLE', 'present');
  await emit('SHARED_RATE_LIMIT_RLS', 'enabled');
  await emit('SHARED_RATE_LIMIT_SERVICE_ROLE', 'allowed');
  await emit('SHARED_RATE_LIMIT_PUBLIC_ROLES', 'denied');
}

async function callRateLimit(endpoint, key, body) {
  return fetchJson(endpoint, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });
}

async function verifyAtomicity(psql, dbConfig, appConfig) {
  const baseUrl = required(appConfig, 'NEXT_PUBLIC_SUPABASE_URL').replace(/\/$/, '');
  const serviceKey = required(appConfig, 'SUPABASE_SERVICE_ROLE_KEY');
  const anonKey = required(appConfig, 'NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const endpoint = `${baseUrl}/rest/v1/rpc/consume_shared_rate_limit`;
  const probeHash = randomBytes(32).toString('hex');
  const body = {
    p_scope: 'migration_probe',
    p_subject_hash: probeHash,
    p_window_seconds: 60,
    p_max_requests: 10,
  };
  let probeCreated = false;

  try {
    let first = null;
    for (let attempt = 1; attempt <= 30; attempt += 1) {
      const candidate = await callRateLimit(endpoint, serviceKey, body).catch(() => null);
      if (candidate?.response.ok) {
        first = candidate;
        break;
      }
      await sleep(2000);
    }
    if (!first) throw new Error('postgrest_schema_timeout');
    probeCreated = true;

    const rest = await Promise.all(
      Array.from({ length: 24 }, () => callRateLimit(endpoint, serviceKey, body)),
    );
    const all = [first, ...rest];
    if (all.some(result => !result.response.ok)) throw new Error('rpc_call_failed');
    const rows = all.map(result => Array.isArray(result.payload) ? result.payload[0] : result.payload);
    const allowedCount = rows.filter(row => row?.allowed === true).length;
    const counts = rows.map(row => Number(row?.current_count));
    const uniqueCounts = new Set(counts);
    const resets = new Set(rows.map(row => String(row?.reset_at || '')));
    if (
      allowedCount !== 10
      || counts.some(value => !Number.isInteger(value) || value < 1)
      || Math.max(...counts) !== 25
      || uniqueCounts.size !== 25
      || resets.size !== 1
    ) {
      throw new Error('atomicity_failed');
    }

    const anonymous = await callRateLimit(endpoint, anonKey, {
      ...body,
      p_subject_hash: randomBytes(32).toString('hex'),
    });
    if (anonymous.response.ok) throw new Error('anon_execute_allowed');

    await emit('SHARED_RATE_LIMIT_PARALLEL_CALLS', 25);
    await emit('SHARED_RATE_LIMIT_ALLOWED_CALLS', 10);
    await emit('SHARED_RATE_LIMIT_MAX_COUNT', 25);
    await emit('SHARED_RATE_LIMIT_LOST_INCREMENTS', 0);
    await emit('SHARED_RATE_LIMIT_ANON_RPC', 'denied');
  } finally {
    if (probeCreated && /^[0-9a-f]{64}$/.test(probeHash)) {
      psqlQuery(
        psql,
        dbConfig,
        `delete from public.shared_rate_limit_buckets where scope = 'migration_probe' and subject_hash = '${probeHash}';`,
      );
    }
  }

  const remaining = Number(psqlQuery(
    psql,
    dbConfig,
    "select count(*) from public.shared_rate_limit_buckets where scope = 'migration_probe';",
  ));
  if (remaining !== 0) throw new Error('probe_cleanup_failed');
  await emit('SHARED_RATE_LIMIT_PROBE_ROWS', 0);
}

async function installSecret() {
  const metadata = await stat(appEnvPath);
  const source = await readFile(appEnvPath, 'utf8');
  const lines = source.split(/\r?\n/);
  const matches = lines.filter(line => /^\s*FANMIND_SHARED_RATE_LIMIT_SECRET\s*=/.test(line));
  const current = matches.length === 1
    ? matches[0]
      .slice(matches[0].indexOf('=') + 1)
      .trim()
      .replace(/^(["'])(.*)\1$/, '$2')
    : '';

  if (matches.length === 1 && current.length >= 32 && !/replace|placeholder|example/i.test(current)) {
    await emit('SHARED_RATE_LIMIT_SECRET', 'preserved');
    return;
  }

  const retained = lines.filter(line => !/^\s*FANMIND_SHARED_RATE_LIMIT_SECRET\s*=/.test(line));
  while (retained.length && retained.at(-1) === '') retained.pop();
  const secret = randomBytes(48).toString('base64url');
  const updated = `${retained.join('\n')}\nFANMIND_SHARED_RATE_LIMIT_SECRET=${secret}\n`;
  const temporary = `${appEnvPath}.shared-rate-limit-${process.pid}.tmp`;
  try {
    await writeFile(temporary, updated, { mode: metadata.mode & 0o777 });
    await chmod(temporary, metadata.mode & 0o777);
    await chown(temporary, metadata.uid, metadata.gid);
    await rename(temporary, appEnvPath);
  } catch {
    throw new Error('secret_install_failed');
  }
  await emit('SHARED_RATE_LIMIT_SECRET', 'created');
}

async function verifyPostMigrationHealth() {
  const version = await fetchJson('https://fanmind.ch/api/version').catch(() => null);
  const health = await fetchJson('https://fanmind.ch/api/health').catch(() => null);
  const components = health?.payload?.components
    && typeof health.payload.components === 'object'
    ? Object.values(health.payload.components)
    : [];
  const ok = version?.response.ok
    && version.payload?.releaseCommit === expectedRelease
    && health?.response.ok
    && health.payload?.status === 'healthy'
    && components.every(component => component?.status === 'healthy');
  if (!ok) throw new Error('post_migration_health_failed');
  await emit('POST_MIGRATION_PUBLIC_HEALTH', 'healthy');
}

async function main() {
  if (!workspace || !reportPath || !/^[0-9a-f]{40}$/.test(expectedRelease)) {
    throw new Error('configuration_missing');
  }
  await writeFile(reportPath, '', { mode: 0o644 });
  await emit('MIGRATION_AUDIT_UTC', new Date().toISOString());
  await emit('EXPECTED_RELEASE', expectedRelease);

  await waitForFoundationRelease();
  await ensureWorkerActive();

  const workerConfig = parseEnv(await readFile(workerEnvPath, 'utf8'));
  const appConfig = parseEnv(await readFile(appEnvPath, 'utf8'));
  const backupStartedAt = Date.now();
  const job = await enqueueUniqueDatabaseBackup(workerConfig);
  await waitForFreshBackup(job, backupStartedAt);

  const psql = await findPsql();
  await applyMigration(psql, workerConfig);
  await verifyPrivileges(psql, workerConfig);
  await verifyAtomicity(psql, workerConfig, appConfig);
  await installSecret();
  await verifyPostMigrationHealth();
  await emit('SHARED_RATE_LIMIT_PHASE_A_RESULT', 'success');
  await chmod(reportPath, 0o644);
}

main().catch(async error => {
  const code = SAFE_ERRORS.has(error?.message)
    ? error.message
    : 'shared_rate_limit_phase_a_failed';
  try {
    if (reportPath) {
      await emit('SHARED_RATE_LIMIT_PHASE_A_RESULT', 'failed');
      await emit('SHARED_RATE_LIMIT_PHASE_A_REASON', code);
      await chmod(reportPath, 0o644);
    }
  } catch {
    // Keep failure output bounded even if the report cannot be written.
  }
  process.stderr.write('shared_rate_limit_phase_a_failed\n');
  process.exit(1);
});
