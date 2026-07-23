#!/usr/bin/env node

import { createHmac, randomBytes } from 'node:crypto';
import { readFile, readdir, writeFile, appendFile, chmod, access } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const SAFE_ERRORS = new Set([
  'configuration_missing',
  'release_timeout',
  'health_failed',
  'core_route_failed',
  'deployed_source_invalid',
  'psql_missing',
  'database_query_failed',
  'direct_rpc_failed',
  'direct_rpc_contract_failed',
  'anon_rpc_allowed',
  'inquiry_precondition_failed',
  'inquiry_status_contract_failed',
  'inquiry_side_effect_detected',
  'probe_cleanup_failed',
]);

const expectedRelease = process.env.EXPECTED_RELEASE || '';
const reportPath = process.argv[2] || '';
const sourceRoot = '/var/www/fanmind';
const appEnvPath = `${sourceRoot}/.env.production`;
const workerEnvPath = '/etc/fanmind-backup/worker.env';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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

async function fetchJson(url, init = {}) {
  const response = await fetch(url, {
    ...init,
    signal: init.signal ?? AbortSignal.timeout(15000),
  });
  const payload = await response.json().catch(() => null);
  return { response, payload };
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

async function evaluateHealth() {
  const result = await fetchJson('https://fanmind.ch/api/health').catch(() => null);
  if (!result?.response.ok || !result.payload) throw new Error('health_failed');
  const module = await import(
    `${pathToFileURL(`${sourceRoot}/scripts/public-health-policy.mjs`).href}?verify=${Date.now()}`
  );
  const evaluation = module.evaluatePublicHealth(result.payload);
  const checks = Array.isArray(result.payload.checks) ? result.payload.checks : [];
  const shared = checks.find(check => check?.component === 'shared_rate_limit_config');
  if (!evaluation.ok || shared?.status !== 'healthy') throw new Error('health_failed');
  return {
    requiredCount: module.REQUIRED_PUBLIC_HEALTH_COMPONENTS.length,
    sharedStatus: shared.status,
  };
}

async function waitForRelease() {
  for (let attempt = 1; attempt <= 80; attempt += 1) {
    const version = await fetchJson('https://fanmind.ch/api/version').catch(() => null);
    const live = version?.response.ok
      && typeof version.payload?.releaseCommit === 'string'
      ? version.payload.releaseCommit
      : '';
    const serverHead = execText('/usr/bin/git', ['-C', sourceRoot, 'rev-parse', 'HEAD']);
    const originMain = execText('/usr/bin/git', ['-C', sourceRoot, 'rev-parse', 'origin/main']);
    if (live === expectedRelease && serverHead === expectedRelease && originMain === expectedRelease) {
      const health = await evaluateHealth().catch(() => null);
      if (health) {
        await emit('RELEASE_SYNC', 'ok');
        await emit('PUBLIC_REQUIRED_HEALTHY_COUNT', health.requiredCount);
        await emit('SHARED_RATE_LIMIT_CONFIG', health.sharedStatus);
        return;
      }
    }
    await sleep(10000);
  }
  throw new Error('release_timeout');
}

async function verifyCoreRoutes() {
  const routes = ['/', '/login', '/register', '/api/version', '/api/health'];
  for (const route of routes) {
    const response = await fetch(`https://fanmind.ch${route}`, {
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    }).catch(() => null);
    if (!response?.ok) throw new Error('core_route_failed');
  }
  await emit('PUBLIC_CORE_ROUTES', 'healthy');
}

async function walkFiles(root) {
  const result = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) result.push(...await walkFiles(path));
    else if (entry.isFile() && /\.(?:ts|tsx|js|mjs)$/u.test(entry.name)) result.push(path);
  }
  return result;
}

async function verifyDeployedSource() {
  const rateLimit = await readFile(`${sourceRoot}/src/lib/rateLimit.ts`, 'utf8');
  const ai = await readFile(`${sourceRoot}/src/app/api/ai/reply-suggestions/route.ts`, 'utf8');
  const inquiry = await readFile(`${sourceRoot}/src/app/api/inquiries/route.ts`, 'utf8');
  const allFiles = await walkFiles(`${sourceRoot}/src`);
  let legacyUseCount = 0;
  for (const file of allFiles) {
    const source = await readFile(file, 'utf8');
    if (/\bcheckRateLimit\b/u.test(source)) legacyUseCount += 1;
  }

  const ok = !/new Map/u.test(rateLimit)
    && legacyUseCount === 0
    && /scope: "ai_reply_user_ip"/u.test(ai)
    && /await consumeSharedRateLimit/u.test(ai)
    && /scope: "inquiry_ip"/u.test(inquiry)
    && /await consumeSharedRateLimit/u.test(inquiry)
    && ai.indexOf('await consumeSharedRateLimit') < ai.indexOf('fetch(OPENAI_RESPONSES_URL')
    && inquiry.indexOf('await consumeSharedRateLimit')
      < inquiry.indexOf('const { inquiry, error } = await createPilotInquiry');
  if (!ok) throw new Error('deployed_source_invalid');

  await emit('DEPLOYED_PROCESS_LOCAL_BUCKETS', 'absent');
  await emit('DEPLOYED_LEGACY_RATE_LIMIT_USES', legacyUseCount);
  await emit('DEPLOYED_AI_SHARED_LIMIT', 'present');
  await emit('DEPLOYED_INQUIRY_SHARED_LIMIT', 'present');
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
  if (result.error || result.status !== 0) throw new Error('database_query_failed');
  return String(result.stdout || '').trim();
}

function scopedHash(secret, scope, subject) {
  return createHmac('sha256', secret)
    .update(`fanmind-shared-rate-limit:v1:${scope}:${subject}`)
    .digest('hex');
}

async function callRpc(baseUrl, key, body) {
  return fetchJson(`${baseUrl}/rest/v1/rpc/consume_shared_rate_limit`, {
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

async function queryInquiryRows(baseUrl, key, source) {
  const url = new URL(`${baseUrl}/rest/v1/pilot_inquiries`);
  url.searchParams.set('select', 'id');
  url.searchParams.set('source', `eq.${source}`);
  const result = await fetchJson(url, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  }).catch(() => null);
  if (!result?.response.ok || !Array.isArray(result.payload)) {
    throw new Error('inquiry_precondition_failed');
  }
  return result.payload.length;
}

async function verifySharedRuntime() {
  const appConfig = parseEnv(await readFile(appEnvPath, 'utf8'));
  const dbConfig = parseEnv(await readFile(workerEnvPath, 'utf8'));
  const baseUrl = required(appConfig, 'NEXT_PUBLIC_SUPABASE_URL').replace(/\/$/, '');
  const serviceKey = required(appConfig, 'SUPABASE_SERVICE_ROLE_KEY');
  const anonKey = required(appConfig, 'NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const secret = required(appConfig, 'FANMIND_SHARED_RATE_LIMIT_SECRET');
  if (secret.length < 32) throw new Error('configuration_missing');
  const psql = await findPsql();

  const directScope = 'activation_probe';
  const directSubject = `run:${process.env.GITHUB_RUN_ID || Date.now()}`;
  const directHash = scopedHash(secret, directScope, directSubject);
  const anonymousHash = scopedHash(secret, 'inquiry_ip', 'anonymous');
  const safeDelete = (scope, hash) => {
    if (!/^[a-z][a-z0-9_.:-]{0,63}$/u.test(scope) || !/^[0-9a-f]{64}$/u.test(hash)) {
      throw new Error('probe_cleanup_failed');
    }
    psqlQuery(
      psql,
      dbConfig,
      `delete from public.shared_rate_limit_buckets where scope = '${scope}' and subject_hash = '${hash}';`,
    );
  };

  safeDelete(directScope, directHash);
  safeDelete('inquiry_ip', anonymousHash);

  try {
    const directBody = {
      p_scope: directScope,
      p_subject_hash: directHash,
      p_window_seconds: 60,
      p_max_requests: 1,
    };
    const first = await callRpc(baseUrl, serviceKey, directBody).catch(() => null);
    const second = await callRpc(baseUrl, serviceKey, directBody).catch(() => null);
    if (!first?.response.ok || !second?.response.ok) throw new Error('direct_rpc_failed');
    const firstRow = Array.isArray(first.payload) ? first.payload[0] : first.payload;
    const secondRow = Array.isArray(second.payload) ? second.payload[0] : second.payload;
    if (
      firstRow?.allowed !== true
      || Number(firstRow?.current_count) !== 1
      || secondRow?.allowed !== false
      || Number(secondRow?.current_count) !== 2
    ) {
      throw new Error('direct_rpc_contract_failed');
    }
    const anonymous = await callRpc(baseUrl, anonKey, {
      ...directBody,
      p_subject_hash: randomBytes(32).toString('hex'),
    });
    if (anonymous.response.ok) throw new Error('anon_rpc_allowed');
    await emit('DIRECT_SHARED_RPC', 'healthy');
    await emit('DIRECT_SHARED_RPC_ANON', 'denied');

    const seconds = Math.floor(Date.now() / 1000);
    const untilBoundary = 600 - (seconds % 600);
    if (untilBoundary <= 8) await sleep((untilBoundary + 1) * 1000);

    safeDelete('inquiry_ip', anonymousHash);
    const source = `shared_limit_verification_${process.env.GITHUB_RUN_ID || Date.now()}`;
    const before = await queryInquiryRows(baseUrl, serviceKey, source);
    if (before !== 0) throw new Error('inquiry_precondition_failed');

    const statuses = [];
    for (let index = 0; index < 6; index += 1) {
      const response = await fetch('http://127.0.0.1:3000/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invalid',
          name: 'Shared limit verification',
          message: 'Invalid synthetic payload; must never be persisted.',
          source,
        }),
        signal: AbortSignal.timeout(10000),
      });
      statuses.push(response.status);
      await response.arrayBuffer();
    }

    if (
      statuses.length !== 6
      || statuses.slice(0, 5).some(status => status !== 400)
      || statuses[5] !== 429
    ) {
      throw new Error('inquiry_status_contract_failed');
    }
    const after = await queryInquiryRows(baseUrl, serviceKey, source);
    if (after !== 0) throw new Error('inquiry_side_effect_detected');

    await emit('INQUIRY_SHARED_LIMIT_FIRST_FIVE', 'validation_400');
    await emit('INQUIRY_SHARED_LIMIT_SIXTH', 'rate_limited_429');
    await emit('INQUIRY_PERSISTED_ROWS', 0);
    await emit('INQUIRY_NOTIFICATION_SIDE_EFFECT', 'not_reached');
  } finally {
    safeDelete(directScope, directHash);
    safeDelete('inquiry_ip', anonymousHash);
  }

  const remaining = Number(psqlQuery(
    psql,
    dbConfig,
    "select count(*) from public.shared_rate_limit_buckets where scope in ('activation_probe') or (scope = 'inquiry_ip' and subject_hash = '" + anonymousHash + "');",
  ));
  if (remaining !== 0) throw new Error('probe_cleanup_failed');
  await emit('SHARED_RATE_LIMIT_VERIFICATION_ROWS', 0);
}

async function main() {
  if (!reportPath || !/^[0-9a-f]{40}$/u.test(expectedRelease)) {
    throw new Error('configuration_missing');
  }
  await writeFile(reportPath, '', { mode: 0o644 });
  await emit('VERIFICATION_UTC', new Date().toISOString());
  await emit('EXPECTED_RELEASE', expectedRelease);

  await waitForRelease();
  await verifyCoreRoutes();
  await verifyDeployedSource();
  await verifySharedRuntime();
  const health = await evaluateHealth();
  await emit('POST_VERIFICATION_PUBLIC_HEALTH', 'healthy');
  await emit('POST_VERIFICATION_REQUIRED_COUNT', health.requiredCount);
  await emit('SHARED_RATE_LIMIT_ACTIVATION_RESULT', 'success');
  await chmod(reportPath, 0o644);
}

main().catch(async error => {
  const code = SAFE_ERRORS.has(error?.message)
    ? error.message
    : 'shared_rate_limit_activation_verification_failed';
  try {
    if (reportPath) {
      await emit('SHARED_RATE_LIMIT_ACTIVATION_RESULT', 'failed');
      await emit('SHARED_RATE_LIMIT_ACTIVATION_REASON', code);
      await chmod(reportPath, 0o644);
    }
  } catch {
    // Keep failure output bounded.
  }
  process.stderr.write('shared_rate_limit_activation_verification_failed\n');
  process.exit(1);
});
