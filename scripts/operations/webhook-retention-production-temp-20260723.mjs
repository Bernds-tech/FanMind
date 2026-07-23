#!/usr/bin/env node

import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import {
  access,
  appendFile,
  chmod,
  copyFile,
  mkdir,
  readFile,
  readdir,
  stat,
  writeFile,
} from "node:fs/promises";
import { basename, join } from "node:path";
import { spawnSync } from "node:child_process";

const EXPECTED_RELEASE = process.env.EXPECTED_RELEASE ?? "";
const RUN_ID = process.env.GITHUB_RUN_ID ?? `${Date.now()}`;
const WORKSPACE = process.env.GITHUB_WORKSPACE ?? "";
const REPORT_PATH = process.argv[2] ?? "";
const APP_ROOT = "/var/www/fanmind";
const APP_ENV_PATH = `${APP_ROOT}/.env.production`;
const BACKUP_ENV_PATH = "/etc/fanmind-backup/worker.env";
const BACKUP_ROOT = "/var/backups/fanmind";
const HOST_BACKUP_ROOT = "/var/backups/fanmind-host-config";
const MIGRATION_PATH = `${WORKSPACE}/supabase/migrations/20260723184500_webhook_diagnostic_retention.sql`;
const SAFE_FAILURES = new Set([
  "configuration_missing",
  "release_timeout",
  "public_health_failed",
  "backup_worker_inactive",
  "backup_enqueue_failed",
  "backup_timeout",
  "backup_checksum_invalid",
  "psql_missing",
  "migration_failed",
  "schema_contract_invalid",
  "privilege_contract_invalid",
  "preexisting_expired_diagnostics_present",
  "optional_server_error_table_present",
  "minimized_insert_failed",
  "raw_diagnostic_constraint_not_enforced",
  "retention_dry_run_failed",
  "retention_execute_failed",
  "probe_cleanup_failed",
  "timer_activation_failed",
  "host_log_policy_failed",
  "webhook_boundary_failed",
  "webhook_boundary_side_effect",
  "post_rollout_health_failed",
]);

function parseEnv(text) {
  const values = new Map();
  for (const rawLine of String(text).split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const separator = line.indexOf("=");
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }
    values.set(key, value);
  }
  return values;
}

function required(values, name) {
  const value = String(values.get(name) ?? "").trim();
  if (!value) throw new Error("configuration_missing");
  return value;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function emit(key, value) {
  const safeKey = String(key).replace(/[^A-Z0-9_]/gu, "_");
  const safeValue = String(value).replace(/[\r\n]/gu, "_").slice(0, 256);
  const line = `${safeKey}=${safeValue}`;
  process.stdout.write(`${line}\n`);
  await appendFile(REPORT_PATH, `${line}\n`, { mode: 0o600 });
}

function run(binary, args, options = {}) {
  return spawnSync(binary, args, {
    encoding: "utf8",
    stdio: options.stdio ?? ["ignore", "pipe", "ignore"],
    timeout: options.timeout ?? 60_000,
    env: options.env ?? process.env,
    cwd: options.cwd,
  });
}

function runOk(binary, args, options = {}) {
  const result = run(binary, args, options);
  return !result.error && result.status === 0;
}

function runText(binary, args, options = {}) {
  const result = run(binary, args, options);
  if (result.error || result.status !== 0) return null;
  return String(result.stdout ?? "").trim();
}

async function fetchJson(url, init = {}) {
  const response = await fetch(url, {
    ...init,
    signal: init.signal ?? AbortSignal.timeout(15_000),
  });
  const payload = await response.json().catch(() => null);
  return { response, payload };
}

async function checkPublicHealth() {
  const result = await fetchJson("https://fanmind.ch/api/health").catch(() => null);
  const checks = Array.isArray(result?.payload?.checks) ? result.payload.checks : [];
  const requiredComponents = new Set([
    "application",
    "supabase_config",
    "supabase_database",
    "supabase_storage",
    "stripe_config",
    "openai_config",
    "shared_rate_limit_config",
  ]);
  const healthy = result?.response.ok === true &&
    checks.filter((check) => requiredComponents.has(check?.component)).length ===
      requiredComponents.size &&
    checks
      .filter((check) => requiredComponents.has(check?.component))
      .every((check) => check.status === "healthy");
  if (!healthy) throw new Error("public_health_failed");
  return requiredComponents.size;
}

async function waitForRelease() {
  for (let attempt = 1; attempt <= 90; attempt += 1) {
    const version = await fetchJson("https://fanmind.ch/api/version").catch(() => null);
    const liveRelease =
      version?.response.ok && typeof version.payload?.releaseCommit === "string"
        ? version.payload.releaseCommit
        : "";
    const serverHead = runText("/usr/bin/git", ["-C", APP_ROOT, "rev-parse", "HEAD"]);
    const originMain = runText("/usr/bin/git", [
      "-C",
      APP_ROOT,
      "rev-parse",
      "origin/main",
    ]);
    if (
      liveRelease === EXPECTED_RELEASE &&
      serverHead === EXPECTED_RELEASE &&
      originMain === EXPECTED_RELEASE
    ) {
      const healthyCount = await checkPublicHealth().catch(() => 0);
      if (healthyCount === 7) {
        await emit("RELEASE_SYNC", "ok");
        await emit("PUBLIC_REQUIRED_HEALTHY_COUNT", healthyCount);
        return;
      }
    }
    await sleep(10_000);
  }
  throw new Error("release_timeout");
}

async function sha256(file) {
  const hash = createHash("sha256");
  await new Promise((resolve, reject) => {
    createReadStream(file)
      .on("data", (chunk) => hash.update(chunk))
      .on("error", reject)
      .on("end", resolve);
  });
  return hash.digest("hex");
}

async function findFreshDatabaseBackup(startedAtMs) {
  const entries = await readdir(BACKUP_ROOT, { withFileTypes: true });
  const pairs = [];
  for (const entry of entries) {
    if (
      !entry.isFile() ||
      !/^fanmind-database-\d{13}\.dump\.age$/u.test(entry.name)
    ) {
      continue;
    }
    const artifact = join(BACKUP_ROOT, entry.name);
    const checksum = `${artifact}.sha256`;
    const artifactStat = await stat(artifact);
    if (artifactStat.mtimeMs <= startedAtMs) continue;
    try {
      const checksumStat = await stat(checksum);
      if (checksumStat.isFile()) pairs.push({ artifact, checksum, artifactStat });
    } catch {
      // The worker may still be finalizing the pair.
    }
  }
  pairs.sort((left, right) => right.artifactStat.mtimeMs - left.artifactStat.mtimeMs);
  return pairs[0] ?? null;
}

async function enqueueFreshDatabaseBackup(workerConfig) {
  if (
    !runOk("/usr/bin/systemctl", [
      "is-active",
      "--quiet",
      "fanmind-backup-worker.service",
    ])
  ) {
    throw new Error("backup_worker_inactive");
  }

  const baseUrl = required(workerConfig, "NEXT_PUBLIC_SUPABASE_URL").replace(/\/$/u, "");
  const serviceKey = required(workerConfig, "SUPABASE_SERVICE_ROLE_KEY");
  const startedAtMs = Date.now();
  const idempotencyKey = `webhook-retention-rollout:${RUN_ID}`;
  const result = await fetchJson(`${baseUrl}/rest/v1/admin_operation_jobs`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      job_type: "backup_database",
      status: "queued",
      severity: "info",
      requested_at: new Date().toISOString(),
      title: "Pre-migration database backup",
      summary: "Guarded backup before webhook diagnostic retention rollout.",
      idempotency_key: idempotencyKey,
      priority: 10,
      metadata: { source: "webhook_retention_rollout" },
    }),
  }).catch(() => null);
  if (!result?.response.ok) throw new Error("backup_enqueue_failed");
  await emit("PRE_MIGRATION_DATABASE_BACKUP_ENQUEUED", "yes");

  for (let attempt = 1; attempt <= 120; attempt += 1) {
    const pair = await findFreshDatabaseBackup(startedAtMs);
    if (pair) {
      const checksumLine = (await readFile(pair.checksum, "utf8")).trim();
      const match = checksumLine.match(/^([0-9a-f]{64})\s+\*?(.+)$/iu);
      if (!match || basename(match[2]) !== basename(pair.artifact)) {
        throw new Error("backup_checksum_invalid");
      }
      const actual = await sha256(pair.artifact);
      if (actual !== match[1].toLowerCase()) {
        throw new Error("backup_checksum_invalid");
      }
      await emit("PRE_MIGRATION_DATABASE_BACKUP_PAIR", "complete");
      await emit("PRE_MIGRATION_DATABASE_BACKUP_CHECKSUM", "ok");
      await emit("PRE_MIGRATION_DATABASE_BACKUP_SIZE_BYTES", pair.artifactStat.size);
      return;
    }
    await sleep(5_000);
  }
  throw new Error("backup_timeout");
}

async function findPsql() {
  for (const candidate of ["/usr/bin/psql", "/usr/lib/postgresql/17/bin/psql"]) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Continue.
    }
  }
  throw new Error("psql_missing");
}

function databaseArgs(config) {
  return [
    "--host",
    required(config, "FANMIND_BACKUP_DB_HOST"),
    "--port",
    String(config.get("FANMIND_BACKUP_DB_PORT") ?? "5432"),
    "--username",
    required(config, "FANMIND_BACKUP_DB_USER"),
    "--dbname",
    required(config, "FANMIND_BACKUP_DB_NAME"),
    "-v",
    "ON_ERROR_STOP=1",
  ];
}

function databaseEnv(config) {
  return {
    ...process.env,
    PGPASSFILE: required(config, "FANMIND_BACKUP_PGPASSFILE"),
  };
}

function psqlQuery(psql, config, sql) {
  const result = run(
    psql,
    [...databaseArgs(config), "-Atc", sql],
    {
      timeout: 60_000,
      env: databaseEnv(config),
      stdio: ["ignore", "pipe", "ignore"],
    },
  );
  if (result.error || result.status !== 0) throw new Error("migration_failed");
  return String(result.stdout ?? "").trim();
}

function applyMigration(psql, config) {
  const result = run(
    psql,
    [...databaseArgs(config), "-f", MIGRATION_PATH],
    {
      timeout: 120_000,
      env: databaseEnv(config),
      stdio: ["ignore", "ignore", "ignore"],
    },
  );
  if (result.error || result.status !== 0) throw new Error("migration_failed");
}

async function verifyMigration(psql, config) {
  const contract = JSON.parse(
    psqlQuery(
      psql,
      config,
      `select json_build_object(
        'table_exists', to_regclass('public.meta_webhook_events') is not null,
        'constraint_exists', exists (
          select 1 from pg_constraint
           where conname = 'meta_webhook_events_minimized_diagnostic_check'
             and conrelid = 'public.meta_webhook_events'::regclass
        ),
        'constraint_validated', coalesce((
          select convalidated from pg_constraint
           where conname = 'meta_webhook_events_minimized_diagnostic_check'
             and conrelid = 'public.meta_webhook_events'::regclass
        ), false),
        'meta_service_execute', has_function_privilege('service_role', 'public.manage_meta_webhook_event_retention(integer,integer,boolean)', 'EXECUTE'),
        'meta_anon_execute', has_function_privilege('anon', 'public.manage_meta_webhook_event_retention(integer,integer,boolean)', 'EXECUTE'),
        'meta_authenticated_execute', has_function_privilege('authenticated', 'public.manage_meta_webhook_event_retention(integer,integer,boolean)', 'EXECUTE'),
        'server_service_execute', has_function_privilege('service_role', 'public.manage_server_error_event_retention(integer,integer,boolean)', 'EXECUTE'),
        'server_anon_execute', has_function_privilege('anon', 'public.manage_server_error_event_retention(integer,integer,boolean)', 'EXECUTE'),
        'server_table_present', to_regclass('public.server_error_events') is not null
      )::text;`,
    ),
  );

  if (
    contract.table_exists !== true ||
    contract.constraint_exists !== true ||
    contract.constraint_validated !== false
  ) {
    throw new Error("schema_contract_invalid");
  }
  if (
    contract.meta_service_execute !== true ||
    contract.meta_anon_execute !== false ||
    contract.meta_authenticated_execute !== false ||
    contract.server_service_execute !== true ||
    contract.server_anon_execute !== false
  ) {
    throw new Error("privilege_contract_invalid");
  }
  if (contract.server_table_present === true) {
    throw new Error("optional_server_error_table_present");
  }

  const expiredBefore = Number(
    psqlQuery(
      psql,
      config,
      "select count(*) from public.meta_webhook_events where created_at < clock_timestamp() - interval '30 days';",
    ),
  );
  if (expiredBefore !== 0) {
    throw new Error("preexisting_expired_diagnostics_present");
  }

  await emit("WEBHOOK_RETENTION_MIGRATION", "applied");
  await emit("WEBHOOK_DIAGNOSTIC_CONSTRAINT", "enforcing_new_rows_not_validated_historical");
  await emit("WEBHOOK_RETENTION_SERVICE_ROLE", "allowed");
  await emit("WEBHOOK_RETENTION_PUBLIC_ROLES", "denied");
  await emit("PREEXISTING_EXPIRED_DIAGNOSTICS", expiredBefore);
  await emit("SERVER_ERROR_TABLE_PRESENT", contract.server_table_present);
}

function createSyntheticDiagnostic(psql, config) {
  psqlQuery(
    psql,
    config,
    `delete from public.meta_webhook_events
      where status = 'retention_probe'
        and raw_payload @> '{"probe":true}'::jsonb;`,
  );

  psqlQuery(
    psql,
    config,
    `insert into public.meta_webhook_events (
      workspace_id,
      social_connection_id,
      platform,
      source,
      event_type,
      page_id,
      sender_id,
      recipient_id,
      text,
      message_text,
      raw_payload,
      status,
      error_reason,
      message_id,
      received_at,
      created_at
    ) values (
      (select id from public.workspaces order by created_at asc, id asc limit 1),
      null,
      'facebook',
      'meta_webhook',
      'unknown',
      null,
      null,
      null,
      null,
      null,
      '{"schema_version":1,"probe":true,"provider_shape":{"event":"[string_present]"}}'::jsonb,
      'retention_probe',
      null,
      null,
      clock_timestamp() - interval '31 days',
      clock_timestamp() - interval '31 days'
    );`,
  );

  const probeCount = Number(
    psqlQuery(
      psql,
      config,
      `select count(*) from public.meta_webhook_events
        where status = 'retention_probe'
          and raw_payload @> '{"probe":true}'::jsonb;`,
    ),
  );
  if (probeCount !== 1) throw new Error("minimized_insert_failed");

  const invalidResult = run(
    psql,
    [
      ...databaseArgs(config),
      "-Atc",
      `do $$
       declare
         v_rejected boolean := false;
       begin
         begin
           insert into public.meta_webhook_events (
             workspace_id, platform, source, event_type, page_id,
             raw_payload, status, received_at, created_at
           ) values (
             (select id from public.workspaces order by created_at asc, id asc limit 1),
             'facebook', 'meta_webhook', 'unknown', 'forbidden_raw_identifier',
             '{"schema_version":1,"probe":true}'::jsonb,
             'retention_probe', clock_timestamp(), clock_timestamp()
           );
         exception when check_violation then
           v_rejected := true;
         end;
         if not v_rejected then
           raise exception 'raw_diagnostic_constraint_not_enforced';
         end if;
       end $$;`,
    ],
    {
      timeout: 60_000,
      env: databaseEnv(config),
      stdio: ["ignore", "ignore", "ignore"],
    },
  );
  if (invalidResult.error || invalidResult.status !== 0) {
    throw new Error("raw_diagnostic_constraint_not_enforced");
  }
}

async function runRetentionWorker(execute) {
  const args = [
    `${APP_ROOT}/scripts/operations/webhook-diagnostic-retention.mjs`,
    ...(execute ? ["--execute"] : []),
  ];
  const result = run("/usr/bin/node", args, {
    timeout: 60_000,
    env: {
      ...process.env,
      FANMIND_ENV_FILE: APP_ENV_PATH,
    },
    stdio: ["ignore", "pipe", "ignore"],
    cwd: APP_ROOT,
  });
  if (result.error || result.status !== 0) {
    throw new Error(execute ? "retention_execute_failed" : "retention_dry_run_failed");
  }
  const values = new Map();
  for (const line of String(result.stdout ?? "").split(/\r?\n/u)) {
    const separator = line.indexOf("=");
    if (separator <= 0) continue;
    values.set(line.slice(0, separator), line.slice(separator + 1));
  }
  const candidateCount = Number(values.get("META_DIAGNOSTIC_CANDIDATES") ?? -1);
  const deletedCount = Number(values.get("META_DIAGNOSTIC_DELETED") ?? -1);
  const serverTable = values.get("SERVER_ERROR_TABLE_PRESENT");
  if (!execute && (candidateCount !== 1 || deletedCount !== 0)) {
    throw new Error("retention_dry_run_failed");
  }
  if (execute && (candidateCount !== 1 || deletedCount !== 1)) {
    throw new Error("retention_execute_failed");
  }
  if (serverTable !== "false") {
    throw new Error("optional_server_error_table_present");
  }
  await emit(
    execute ? "WEBHOOK_RETENTION_EXECUTE_DELETED" : "WEBHOOK_RETENTION_DRY_RUN_CANDIDATES",
    execute ? deletedCount : candidateCount,
  );
}

async function verifyProbeRemoved(psql, config) {
  const probeCount = Number(
    psqlQuery(
      psql,
      config,
      `select count(*) from public.meta_webhook_events
        where status = 'retention_probe'
          and raw_payload @> '{"probe":true}'::jsonb;`,
    ),
  );
  if (probeCount !== 0) throw new Error("probe_cleanup_failed");
  await emit("WEBHOOK_RETENTION_PROBE_ROWS", probeCount);
}

async function activateTimer() {
  if (
    !runOk("/usr/bin/systemctl", [
      "enable",
      "--now",
      "fanmind-webhook-retention.timer",
    ])
  ) {
    throw new Error("timer_activation_failed");
  }
  if (
    !runOk("/usr/bin/systemctl", [
      "start",
      "fanmind-webhook-retention.service",
    ]) ||
    !runOk("/usr/bin/systemctl", [
      "is-enabled",
      "--quiet",
      "fanmind-webhook-retention.timer",
    ]) ||
    !runOk("/usr/bin/systemctl", [
      "is-active",
      "--quiet",
      "fanmind-webhook-retention.timer",
    ])
  ) {
    throw new Error("timer_activation_failed");
  }
  await emit("WEBHOOK_RETENTION_TIMER", "enabled_active");
  await emit("WEBHOOK_RETENTION_SERVICE_LAST_RUN", "success");
}

async function backupHostFile(source, label) {
  await mkdir(HOST_BACKUP_ROOT, { recursive: true, mode: 0o700 });
  try {
    await access(source);
    await copyFile(source, join(HOST_BACKUP_ROOT, `${label}-${RUN_ID}.bak`));
    await chmod(join(HOST_BACKUP_ROOT, `${label}-${RUN_ID}.bak`), 0o600);
    return "present_backed_up";
  } catch {
    return "absent";
  }
}

async function installHostLogPolicies() {
  const pm2Previous = await backupHostFile(
    "/etc/logrotate.d/fanmind-pm2",
    "fanmind-pm2",
  );
  const journaldPrevious = await backupHostFile(
    "/etc/systemd/journald.conf.d/90-fanmind-retention.conf",
    "journald-fanmind",
  );

  await mkdir("/etc/systemd/journald.conf.d", {
    recursive: true,
    mode: 0o755,
  });
  const pm2Copy = run("/usr/bin/install", [
    "-o",
    "root",
    "-g",
    "root",
    "-m",
    "0644",
    `${APP_ROOT}/ops/logrotate/fanmind-pm2`,
    "/etc/logrotate.d/fanmind-pm2",
  ]);
  const journaldCopy = run("/usr/bin/install", [
    "-o",
    "root",
    "-g",
    "root",
    "-m",
    "0644",
    `${APP_ROOT}/ops/systemd/journald-fanmind.conf`,
    "/etc/systemd/journald.conf.d/90-fanmind-retention.conf",
  ]);
  if (
    pm2Copy.error ||
    pm2Copy.status !== 0 ||
    journaldCopy.error ||
    journaldCopy.status !== 0
  ) {
    throw new Error("host_log_policy_failed");
  }

  const logrotateBinary = ["/usr/sbin/logrotate", "/usr/bin/logrotate"].find(
    (candidate) => runOk("/usr/bin/test", ["-x", candidate]),
  );
  if (
    !logrotateBinary ||
    !runOk(logrotateBinary, ["--debug", "/etc/logrotate.d/fanmind-pm2"], {
      timeout: 60_000,
      stdio: ["ignore", "ignore", "ignore"],
    })
  ) {
    throw new Error("host_log_policy_failed");
  }

  const effective = runText("/usr/bin/systemd-analyze", [
    "cat-config",
    "systemd/journald.conf",
  ]);
  if (
    !effective ||
    !effective.includes("SystemMaxUse=512M") ||
    !effective.includes("RuntimeMaxUse=128M") ||
    !effective.includes("MaxRetentionSec=14day") ||
    !effective.includes("Compress=yes")
  ) {
    throw new Error("host_log_policy_failed");
  }
  if (
    !runOk("/usr/bin/systemctl", ["restart", "systemd-journald.service"]) ||
    !runOk("/usr/bin/systemctl", [
      "is-active",
      "--quiet",
      "systemd-journald.service",
    ])
  ) {
    throw new Error("host_log_policy_failed");
  }

  await emit("PM2_LOGROTATE_PREVIOUS", pm2Previous);
  await emit("PM2_LOGROTATE_POLICY", "installed_valid");
  await emit("JOURNALD_POLICY_PREVIOUS", journaldPrevious);
  await emit("JOURNALD_RETENTION_POLICY", "installed_active");
}

async function verifyWebhookBoundaries(psql, config) {
  const before = Number(
    psqlQuery(psql, config, "select count(*) from public.meta_webhook_events;"),
  );
  const zeroSignature = `sha256=${"0".repeat(64)}`;
  const metaPost = await fetch("https://fanmind.ch/api/webhooks/meta", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Hub-Signature-256": zeroSignature,
    },
    body: "{}",
    signal: AbortSignal.timeout(15_000),
  }).catch(() => null);
  const metaVerify = await fetch(
    "https://fanmind.ch/api/webhooks/meta?hub.mode=subscribe&hub.verify_token=invalid&hub.challenge=1",
    { signal: AbortSignal.timeout(15_000) },
  ).catch(() => null);
  const telegramPost = await fetch(
    "https://fanmind.ch/api/integrations/telegram/webhook",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Telegram-Bot-Api-Secret-Token": "invalid",
      },
      body: "{}",
      signal: AbortSignal.timeout(15_000),
    },
  ).catch(() => null);
  if (
    metaPost?.status !== 403 ||
    metaVerify?.status !== 403 ||
    telegramPost?.status !== 401
  ) {
    throw new Error("webhook_boundary_failed");
  }
  await Promise.all([
    metaPost.arrayBuffer().catch(() => null),
    metaVerify.arrayBuffer().catch(() => null),
    telegramPost.arrayBuffer().catch(() => null),
  ]);
  const after = Number(
    psqlQuery(psql, config, "select count(*) from public.meta_webhook_events;"),
  );
  if (after !== before) throw new Error("webhook_boundary_side_effect");
  await emit("META_INVALID_SIGNATURE_STATUS", metaPost.status);
  await emit("META_INVALID_VERIFY_TOKEN_STATUS", metaVerify.status);
  await emit("TELEGRAM_INVALID_SECRET_STATUS", telegramPost.status);
  await emit("INVALID_WEBHOOK_DIAGNOSTIC_SIDE_EFFECT", "none");
}

async function verifyCoreRoutesAndHealth() {
  for (const route of ["/", "/login", "/register", "/api/version", "/api/health"]) {
    const response = await fetch(`https://fanmind.ch${route}`, {
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    }).catch(() => null);
    if (!response?.ok) throw new Error("post_rollout_health_failed");
    await response.arrayBuffer().catch(() => null);
  }
  const version = await fetchJson("https://fanmind.ch/api/version").catch(() => null);
  if (version?.payload?.releaseCommit !== EXPECTED_RELEASE) {
    throw new Error("post_rollout_health_failed");
  }
  const healthyCount = await checkPublicHealth();
  await emit("POST_ROLLOUT_PUBLIC_REQUIRED_HEALTHY_COUNT", healthyCount);
  await emit("PUBLIC_CORE_ROUTES", "healthy");
}

async function main() {
  if (
    !REPORT_PATH ||
    !WORKSPACE ||
    !/^[0-9a-f]{40}$/u.test(EXPECTED_RELEASE)
  ) {
    throw new Error("configuration_missing");
  }
  await writeFile(REPORT_PATH, "", { mode: 0o600 });
  await emit("ROLLOUT_UTC", new Date().toISOString());
  await emit("EXPECTED_RELEASE", EXPECTED_RELEASE);

  await waitForRelease();
  const workerConfig = parseEnv(await readFile(BACKUP_ENV_PATH, "utf8"));
  await enqueueFreshDatabaseBackup(workerConfig);
  const psql = await findPsql();
  applyMigration(psql, workerConfig);
  await verifyMigration(psql, workerConfig);
  createSyntheticDiagnostic(psql, workerConfig);
  await emit("MINIMIZED_DIAGNOSTIC_INSERT", "accepted");
  await emit("RAW_DIAGNOSTIC_INSERT", "rejected");
  await runRetentionWorker(false);
  await runRetentionWorker(true);
  await verifyProbeRemoved(psql, workerConfig);
  await activateTimer();
  await installHostLogPolicies();
  await verifyWebhookBoundaries(psql, workerConfig);
  await verifyCoreRoutesAndHealth();
  await emit("WEBHOOK_RETENTION_PRODUCTION_RESULT", "success");
  await chmod(REPORT_PATH, 0o600);
}

main().catch(async (error) => {
  const code =
    error instanceof Error && SAFE_FAILURES.has(error.message)
      ? error.message
      : "webhook_retention_rollout_failed";
  try {
    if (REPORT_PATH) {
      await emit("WEBHOOK_RETENTION_PRODUCTION_RESULT", "failed");
      await emit("WEBHOOK_RETENTION_PRODUCTION_REASON", code);
      await chmod(REPORT_PATH, 0o600);
    }
  } catch {
    // Keep failure output bounded if the report itself cannot be updated.
  }
  process.stderr.write("webhook_retention_rollout_failed\n");
  process.exit(1);
});
