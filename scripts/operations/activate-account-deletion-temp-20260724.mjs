#!/usr/bin/env node

import {
  appendFile,
  chmod,
  chown,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const SOURCE_DIR = "/var/www/fanmind";
const APP_ENV_FILE = `${SOURCE_DIR}/.env.production`;
const BACKUP_ENV_FILE = "/etc/fanmind-backup/worker.env";
const PROCESSOR_PATH = "/usr/local/lib/fanmind-ops/process-account-deletion.mjs";
const BACKUP_VERIFIER_PATH = "/usr/local/lib/fanmind-ops/verify-backup-artifact.mjs";
const MIGRATION_PATH = `${SOURCE_DIR}/supabase/migrations/20260724103000_account_deletion_requests.sql`;
const EXPECTED_RELEASE = String(process.env.EXPECTED_RELEASE ?? "").trim();
const RUN_ID = String(process.env.GITHUB_RUN_ID ?? "").trim();
const REPORT_PATH = process.argv[2] ? resolve(process.argv[2]) : "";
const SAFE_ERROR_CODES = new Set([
  "activation_configuration_invalid",
  "release_timeout",
  "health_invalid",
  "production_config_missing",
  "production_config_mismatch",
  "account_deletion_env_update_failed",
  "backup_worker_unavailable",
  "backup_enqueue_failed",
  "backup_timeout",
  "backup_failed",
  "backup_run_invalid",
  "backup_path_invalid",
  "backup_verification_failed",
  "migration_failed",
  "schema_verification_failed",
  "processor_install_invalid",
  "automatic_processor_detected",
  "synthetic_user_create_failed",
  "synthetic_login_failed",
  "synthetic_request_create_failed",
  "unique_index_not_enforced",
  "status_api_failed",
  "cancel_api_failed",
  "cancel_cleanup_failed",
  "processor_dry_run_failed",
  "processor_dry_run_invalid",
  "dry_run_side_effect_detected",
  "synthetic_cleanup_failed",
  "public_route_failed",
  "unauthenticated_api_boundary_failed",
]);

let syntheticUserId = null;
let syntheticRequestIds = [];
let appConfig = null;
let backupConfig = null;

function sleep(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

async function emit(key, value) {
  const line = `${key}=${value}`;
  process.stdout.write(`${line}\n`);
  await appendFile(REPORT_PATH, `${line}\n`, { mode: 0o600 });
}

function parseEnvText(source) {
  const values = {};
  for (const rawLine of String(source).split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator <= 0) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

function requireValue(values, key, minimumLength = 1) {
  const value = String(values[key] ?? "").trim();
  if (value.length < minimumLength || /[\r\n\0]/u.test(value)) {
    throw new Error("production_config_missing");
  }
  return value;
}

function normalizeSupabaseUrl(value) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("production_config_missing");
  }
  if (parsed.protocol !== "https:" || !parsed.hostname.endsWith(".supabase.co")) {
    throw new Error("production_config_missing");
  }
  return parsed.toString().replace(/\/$/u, "");
}

function sameSecret(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && timingSafeEqual(a, b);
}

function run(binary, args, options = {}) {
  const result = spawnSync(binary, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: options.timeout ?? 120_000,
    env: options.env ?? process.env,
    cwd: options.cwd,
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    throw new Error(options.errorCode ?? "activation_configuration_invalid");
  }
  return String(result.stdout ?? "").trim();
}

async function fetchJson(url, init = {}, errorCode = "activation_configuration_invalid") {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    signal: AbortSignal.timeout(init.timeoutMs ?? 20_000),
  }).catch(() => null);
  if (!response) throw new Error(errorCode);
  const payload = await response.json().catch(() => null);
  return { response, payload };
}

function serviceHeaders(config, prefer) {
  return {
    apikey: config.serviceKey,
    Authorization: `Bearer ${config.serviceKey}`,
    "Content-Type": "application/json",
    ...(prefer ? { Prefer: prefer } : {}),
  };
}

async function serviceRows(config, table, query, errorCode) {
  const { response, payload } = await fetchJson(
    `${config.supabaseUrl}/rest/v1/${table}?${query}`,
    { headers: serviceHeaders(config) },
    errorCode,
  );
  if (!response.ok || !Array.isArray(payload)) throw new Error(errorCode);
  return payload;
}

async function serviceInsert(config, table, body, errorCode) {
  const { response, payload } = await fetchJson(
    `${config.supabaseUrl}/rest/v1/${table}`,
    {
      method: "POST",
      headers: serviceHeaders(config, "return=representation"),
      body: JSON.stringify(body),
    },
    errorCode,
  );
  if (!response.ok || !Array.isArray(payload) || !payload.length) {
    throw new Error(errorCode);
  }
  return payload[0];
}

async function serviceDelete(config, table, query, errorCode) {
  const { response, payload } = await fetchJson(
    `${config.supabaseUrl}/rest/v1/${table}?${query}`,
    {
      method: "DELETE",
      headers: serviceHeaders(config, "return=representation"),
    },
    errorCode,
  );
  if (!response.ok || !Array.isArray(payload)) throw new Error(errorCode);
  return payload;
}

async function waitForExactRelease() {
  run("/usr/bin/git", ["-C", SOURCE_DIR, "fetch", "--prune", "origin", "main"], {
    errorCode: "release_timeout",
  });
  for (let attempt = 1; attempt <= 120; attempt += 1) {
    try {
      const version = await fetchJson(
        "https://fanmind.ch/api/version",
        {},
        "release_timeout",
      );
      const liveRelease =
        version.response.ok && typeof version.payload?.releaseCommit === "string"
          ? version.payload.releaseCommit
          : "";
      const serverHead = run("/usr/bin/git", ["-C", SOURCE_DIR, "rev-parse", "HEAD"], {
        errorCode: "release_timeout",
      });
      const originMain = run(
        "/usr/bin/git",
        ["-C", SOURCE_DIR, "rev-parse", "origin/main"],
        { errorCode: "release_timeout" },
      );
      if (
        liveRelease === EXPECTED_RELEASE &&
        serverHead === EXPECTED_RELEASE &&
        originMain === EXPECTED_RELEASE
      ) {
        const healthResponse = await fetchJson(
          "https://fanmind.ch/api/health",
          {},
          "health_invalid",
        );
        if (!healthResponse.response.ok || !healthResponse.payload) {
          throw new Error("health_invalid");
        }
        const policy = await import(
          `${pathToFileURL(`${SOURCE_DIR}/scripts/public-health-policy.mjs`).href}?activation=${Date.now()}`
        );
        const evaluation = policy.evaluatePublicHealth(healthResponse.payload);
        const required = policy.REQUIRED_PUBLIC_HEALTH_COMPONENTS;
        const checks = Array.isArray(healthResponse.payload.checks)
          ? healthResponse.payload.checks
          : [];
        const allRequiredHealthy = required.every((component) =>
          checks.some(
            (check) =>
              check?.component === component && check?.status === "healthy",
          ),
        );
        if (
          healthResponse.payload.status !== "healthy" ||
          !evaluation.ok ||
          required.length !== 7 ||
          !allRequiredHealthy
        ) {
          throw new Error("health_invalid");
        }
        await emit("RELEASE_SYNC", "ok");
        await emit("PUBLIC_REQUIRED_HEALTHY_COUNT", 7);
        return;
      }
    } catch {
      // Retry without exposing response bodies, paths, or command output.
    }
    if (attempt % 12 === 0) {
      run("/usr/bin/git", ["-C", SOURCE_DIR, "fetch", "--prune", "origin", "main"], {
        errorCode: "release_timeout",
      });
    }
    await sleep(10_000);
  }
  throw new Error("release_timeout");
}

async function loadAndValidateProductionConfig() {
  const [appText, backupText] = await Promise.all([
    readFile(APP_ENV_FILE, "utf8"),
    readFile(BACKUP_ENV_FILE, "utf8"),
  ]).catch(() => {
    throw new Error("production_config_missing");
  });
  const appEnv = parseEnvText(appText);
  const workerEnv = parseEnvText(backupText);
  const appUrl = normalizeSupabaseUrl(
    requireValue(appEnv, "NEXT_PUBLIC_SUPABASE_URL", 12),
  );
  const workerUrl = normalizeSupabaseUrl(
    requireValue(workerEnv, "NEXT_PUBLIC_SUPABASE_URL", 12),
  );
  const appServiceKey = requireValue(appEnv, "SUPABASE_SERVICE_ROLE_KEY", 20);
  const workerServiceKey = requireValue(
    workerEnv,
    "SUPABASE_SERVICE_ROLE_KEY",
    20,
  );
  if (appUrl !== workerUrl || !sameSecret(appServiceKey, workerServiceKey)) {
    throw new Error("production_config_mismatch");
  }
  appConfig = {
    env: appEnv,
    supabaseUrl: appUrl,
    serviceKey: appServiceKey,
    anonKey: requireValue(appEnv, "NEXT_PUBLIC_SUPABASE_ANON_KEY", 20),
  };
  backupConfig = {
    env: workerEnv,
    supabaseUrl: workerUrl,
    serviceKey: workerServiceKey,
    root: resolve(requireValue(workerEnv, "FANMIND_BACKUP_ROOT", 2)),
  };
  await emit("PRODUCTION_CONFIG_BOUNDARY", "matched");
}

async function upsertAccountDeletionEnv() {
  const fileStat = await stat(APP_ENV_FILE).catch(() => null);
  if (!fileStat) throw new Error("account_deletion_env_update_failed");
  const source = await readFile(APP_ENV_FILE, "utf8");
  const lines = source.split(/\r?\n/u);
  const current = parseEnvText(source);
  const existingSecret = String(
    current.FANMIND_ACCOUNT_DELETION_HASH_SECRET ?? "",
  ).trim();
  const generated = existingSecret.length < 32;
  const secret = generated ? randomBytes(48).toString("hex") : existingSecret;
  const replacements = new Map([
    ["FANMIND_ACCOUNT_DELETION_EXECUTION_ENABLED", "false"],
    ["FANMIND_ACCOUNT_DELETION_HASH_SECRET", secret],
  ]);
  const seen = new Set();
  const updated = [];
  for (const line of lines) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=/u);
    if (!match || !replacements.has(match[1])) {
      updated.push(line);
      continue;
    }
    if (seen.has(match[1])) continue;
    updated.push(`${match[1]}=${replacements.get(match[1])}`);
    seen.add(match[1]);
  }
  for (const [key, value] of replacements) {
    if (!seen.has(key)) updated.push(`${key}=${value}`);
  }
  const normalized = `${updated.join("\n").replace(/\n+$/u, "")}\n`;
  const temporary = join(
    dirname(APP_ENV_FILE),
    `.env.production.account-deletion-${process.pid}-${Date.now()}.tmp`,
  );
  try {
    await writeFile(temporary, normalized, { mode: 0o600, flag: "wx" });
    await chmod(temporary, fileStat.mode & 0o777);
    await chown(temporary, fileStat.uid, fileStat.gid);
    await rename(temporary, APP_ENV_FILE);
  } catch {
    await rm(temporary, { force: true }).catch(() => {});
    throw new Error("account_deletion_env_update_failed");
  }
  const verified = parseEnvText(await readFile(APP_ENV_FILE, "utf8"));
  if (
    verified.FANMIND_ACCOUNT_DELETION_EXECUTION_ENABLED !== "false" ||
    String(verified.FANMIND_ACCOUNT_DELETION_HASH_SECRET ?? "").length < 32
  ) {
    throw new Error("account_deletion_env_update_failed");
  }
  appConfig.env = verified;
  await emit("ACCOUNT_DELETION_EXECUTION_GATE", "disabled");
  await emit(
    "ACCOUNT_DELETION_HASH_SECRET_STATE",
    generated ? "generated" : "preserved",
  );
}

async function assertBackupWorkerAvailable() {
  const active = spawnSync(
    "/usr/bin/systemctl",
    ["is-active", "--quiet", "fanmind-backup-worker.service"],
    { stdio: "ignore", timeout: 15_000 },
  );
  if (active.status !== 0) throw new Error("backup_worker_unavailable");
  await emit("BACKUP_WORKER_STATUS", "active");
}

async function enqueueFreshDatabaseBackup() {
  const idempotencyKey = `manual:account-deletion-migration:${RUN_ID}`;
  const existing = await serviceRows(
    backupConfig,
    "admin_operation_jobs",
    new URLSearchParams({
      select: "id,status,result_reference,error_code,requested_at",
      idempotency_key: `eq.${idempotencyKey}`,
      limit: "1",
    }).toString(),
    "backup_enqueue_failed",
  );
  let job = existing[0] ?? null;
  if (!job) {
    job = await serviceInsert(
      backupConfig,
      "admin_operation_jobs",
      {
        job_type: "backup_database",
        status: "queued",
        severity: "info",
        requested_at: new Date().toISOString(),
        title: "Controlled account deletion migration backup",
        summary:
          "Fresh encrypted database backup requested before additive account deletion migration.",
        idempotency_key: idempotencyKey,
        priority: 20,
        metadata: {
          source: "github_actions_account_deletion_activation",
          destructive_action: false,
        },
      },
      "backup_enqueue_failed",
    );
  }
  const jobId = String(job.id ?? "");
  if (!jobId) throw new Error("backup_enqueue_failed");
  await emit("DATABASE_BACKUP_REQUESTED", "yes");

  for (let attempt = 1; attempt <= 240; attempt += 1) {
    const rows = await serviceRows(
      backupConfig,
      "admin_operation_jobs",
      new URLSearchParams({
        select: "id,status,result_reference,error_code,requested_at,finished_at",
        id: `eq.${jobId}`,
        limit: "1",
      }).toString(),
      "backup_failed",
    );
    job = rows[0] ?? null;
    if (!job) throw new Error("backup_failed");
    if (job.status === "succeeded") break;
    if (["failed", "cancelled", "blocked"].includes(job.status)) {
      throw new Error("backup_failed");
    }
    if (attempt === 240) throw new Error("backup_timeout");
    await sleep(5_000);
  }

  const runId = String(job.result_reference ?? "");
  if (!runId) throw new Error("backup_run_invalid");
  const runs = await serviceRows(
    backupConfig,
    "backup_runs",
    new URLSearchParams({
      select:
        "id,backup_type,status,validation_status,offsite_status,storage_reference,checksum_reference,sha256,size_bytes,finished_at,job_id",
      id: `eq.${runId}`,
      job_id: `eq.${jobId}`,
      limit: "1",
    }).toString(),
    "backup_run_invalid",
  );
  const runRow = runs[0];
  if (
    !runRow ||
    runRow.backup_type !== "database" ||
    runRow.validation_status !== "passed" ||
    !["succeeded", "degraded", "offsite_pending"].includes(runRow.status) ||
    typeof runRow.storage_reference !== "string" ||
    typeof runRow.checksum_reference !== "string" ||
    !/^[0-9a-f]{64}$/u.test(String(runRow.sha256 ?? "")) ||
    !Number.isInteger(Number(runRow.size_bytes)) ||
    Number(runRow.size_bytes) <= 0
  ) {
    throw new Error("backup_run_invalid");
  }
  const finishedAt = new Date(runRow.finished_at);
  if (
    Number.isNaN(finishedAt.getTime()) ||
    Date.now() - finishedAt.getTime() > 45 * 60 * 1000
  ) {
    throw new Error("backup_run_invalid");
  }
  if (
    backupConfig.env.FANMIND_BACKUP_OFFSITE_ENABLED === "true" &&
    runRow.offsite_status !== "uploaded"
  ) {
    throw new Error("backup_failed");
  }

  const root = await realpath(backupConfig.root);
  const artifact = await realpath(resolve(runRow.storage_reference));
  const checksum = await realpath(resolve(runRow.checksum_reference));
  const artifactRelative = relative(root, artifact);
  const checksumRelative = relative(root, checksum);
  if (
    !artifactRelative ||
    artifactRelative.startsWith("..") ||
    !checksumRelative ||
    checksumRelative.startsWith("..") ||
    checksum !== `${artifact}.sha256` ||
    !/^fanmind-database-.*\.dump\.age$/u.test(basename(artifact))
  ) {
    throw new Error("backup_path_invalid");
  }
  const verifierOutput = run(
    "/usr/bin/node",
    [
      BACKUP_VERIFIER_PATH,
      "--artifact",
      artifact,
      "--checksum",
      checksum,
      "--type",
      "database",
      "--json",
    ],
    { timeout: 180_000, errorCode: "backup_verification_failed" },
  );
  let verification;
  try {
    verification = JSON.parse(verifierOutput);
  } catch {
    throw new Error("backup_verification_failed");
  }
  if (
    verification?.ok !== true ||
    verification?.mode !== "checksum_only" ||
    verification?.backupType !== "database" ||
    verification?.checksum !== runRow.sha256 ||
    Number(verification?.sizeBytes) !== Number(runRow.size_bytes)
  ) {
    throw new Error("backup_verification_failed");
  }
  await emit("DATABASE_BACKUP_ENCRYPTED", "yes");
  await emit("DATABASE_BACKUP_CHECKSUM_ONLY", "passed");
  await emit("DATABASE_BACKUP_SIZE_BYTES", Number(runRow.size_bytes));
  await emit(
    "DATABASE_BACKUP_OFFSITE",
    runRow.offsite_status === "uploaded" ? "uploaded" : "not_required",
  );
}

function psqlBaseArgs() {
  return [
    "-X",
    "-q",
    "-v",
    "ON_ERROR_STOP=1",
    "--host",
    requireValue(backupConfig.env, "FANMIND_BACKUP_DB_HOST", 2),
    "--port",
    String(backupConfig.env.FANMIND_BACKUP_DB_PORT || "5432"),
    "--username",
    requireValue(backupConfig.env, "FANMIND_BACKUP_DB_USER", 1),
    "--dbname",
    requireValue(backupConfig.env, "FANMIND_BACKUP_DB_NAME", 1),
  ];
}

function psqlEnv() {
  return {
    ...process.env,
    PGPASSFILE: requireValue(
      backupConfig.env,
      "FANMIND_BACKUP_PGPASSFILE",
      2,
    ),
  };
}

function psqlScalar(sql, errorCode = "schema_verification_failed") {
  return run(
    "/usr/lib/postgresql/17/bin/psql",
    [...psqlBaseArgs(), "-tA", "-c", sql],
    { env: psqlEnv(), timeout: 120_000, errorCode },
  );
}

async function applyAndVerifyMigration() {
  run(
    "/usr/lib/postgresql/17/bin/psql",
    [...psqlBaseArgs(), "-f", MIGRATION_PATH],
    { env: psqlEnv(), timeout: 180_000, errorCode: "migration_failed" },
  );
  await emit("ACCOUNT_DELETION_MIGRATION", "applied");
  const result = psqlScalar(`
    select concat_ws('|',
      to_regclass('public.account_deletion_requests') is not null,
      c.relrowsecurity,
      (select count(*) = 0 from pg_policies where schemaname = 'public' and tablename = 'account_deletion_requests'),
      not has_table_privilege('public', 'public.account_deletion_requests', 'select'),
      not has_table_privilege('anon', 'public.account_deletion_requests', 'select'),
      not has_table_privilege('authenticated', 'public.account_deletion_requests', 'select'),
      has_table_privilege('service_role', 'public.account_deletion_requests', 'select'),
      has_table_privilege('service_role', 'public.account_deletion_requests', 'insert'),
      has_table_privilege('service_role', 'public.account_deletion_requests', 'update'),
      has_table_privilege('service_role', 'public.account_deletion_requests', 'delete'),
      exists(select 1 from pg_indexes where schemaname = 'public' and indexname = 'account_deletion_requests_one_active_per_user_idx'),
      exists(select 1 from pg_trigger where tgname = 'account_deletion_requests_set_updated_at' and not tgisinternal),
      (select count(*) = 0 from pg_constraint where conrelid = 'public.account_deletion_requests'::regclass and contype = 'f'),
      exists(select 1 from pg_constraint where conrelid = 'public.account_deletion_requests'::regclass and conname = 'account_deletion_deadline_check')
    )
    from pg_class c
    where c.oid = 'public.account_deletion_requests'::regclass;
  `);
  const expected = Array(14).fill("t").join("|");
  if (result !== expected) throw new Error("schema_verification_failed");
  await emit("ACCOUNT_DELETION_TABLE_PRESENT", "yes");
  await emit("ACCOUNT_DELETION_RLS", "enabled");
  await emit("ACCOUNT_DELETION_CLIENT_POLICIES", 0);
  await emit("ACCOUNT_DELETION_PUBLIC_PRIVILEGES", "revoked");
  await emit("ACCOUNT_DELETION_SERVICE_ROLE_CRUD", "granted");
  await emit("ACCOUNT_DELETION_ACTIVE_UNIQUE_INDEX", "present");
  await emit("ACCOUNT_DELETION_AUTH_FOREIGN_KEY", "absent_by_design");
}

async function verifyProcessorInstallation() {
  const [processorStat, processorSource, sourceProcessor] = await Promise.all([
    stat(PROCESSOR_PATH),
    readFile(PROCESSOR_PATH, "utf8"),
    readFile(`${SOURCE_DIR}/scripts/operations/process-account-deletion.mjs`, "utf8"),
  ]).catch(() => {
    throw new Error("processor_install_invalid");
  });
  if (
    processorStat.uid !== 0 ||
    (processorStat.mode & 0o777) !== 0o750 ||
    processorSource !== sourceProcessor ||
    !processorSource.includes("FANMIND_ACCOUNT_DELETION_EXECUTION_ENABLED") ||
    !processorSource.includes('const resume = hasFlag("--resume")') ||
    !processorSource.includes('execute = false')
  ) {
    throw new Error("processor_install_invalid");
  }
  const unitRoots = ["/etc/systemd/system", "/usr/lib/systemd/system"];
  for (const root of unitRoots) {
    const entries = await readdir(root).catch(() => []);
    if (entries.some((entry) => /account.*deletion.*\.(?:service|timer)$/iu.test(entry))) {
      throw new Error("automatic_processor_detected");
    }
  }
  await emit("ACCOUNT_DELETION_PROCESSOR_OWNER", "root");
  await emit("ACCOUNT_DELETION_PROCESSOR_MODE", "0750");
  await emit("ACCOUNT_DELETION_AUTOMATIC_TIMER", "absent");
  await emit("ACCOUNT_DELETION_PROCESSOR_DEFAULT", "dry_run");
}

async function adminCreateSyntheticUser(email, password) {
  const { response, payload } = await fetchJson(
    `${appConfig.supabaseUrl}/auth/v1/admin/users`,
    {
      method: "POST",
      headers: serviceHeaders(appConfig),
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          fanmind_synthetic: true,
          purpose: "account_deletion_activation",
        },
      }),
    },
    "synthetic_user_create_failed",
  );
  const user = payload?.user ?? payload;
  if (!response.ok || typeof user?.id !== "string") {
    throw new Error("synthetic_user_create_failed");
  }
  return user.id;
}

async function adminDeleteSyntheticUser(userId) {
  const response = await fetch(
    `${appConfig.supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(userId)}`,
    {
      method: "DELETE",
      headers: serviceHeaders(appConfig),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    },
  ).catch(() => null);
  if (!response || (!response.ok && response.status !== 404)) {
    throw new Error("synthetic_cleanup_failed");
  }
}

async function authUserExists(userId) {
  const response = await fetch(
    `${appConfig.supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(userId)}`,
    {
      headers: serviceHeaders(appConfig),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    },
  ).catch(() => null);
  if (!response) throw new Error("synthetic_cleanup_failed");
  if (response.status === 404) return false;
  if (!response.ok) throw new Error("synthetic_cleanup_failed");
  return true;
}

async function passwordLogin(email, password) {
  const { response, payload } = await fetchJson(
    `${appConfig.supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        apikey: appConfig.anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    },
    "synthetic_login_failed",
  );
  if (!response.ok || typeof payload?.access_token !== "string") {
    throw new Error("synthetic_login_failed");
  }
  return payload.access_token;
}

async function insertSyntheticRequest(requestId, email) {
  syntheticRequestIds.push(requestId);
  return serviceInsert(
    appConfig,
    "account_deletion_requests",
    {
      id: requestId,
      user_id: syntheticUserId,
      workspace_id: null,
      notification_email: email,
      request_source: "mobile",
      confirmation_version: "v1",
      status: "pending",
      requires_ownership_transfer: false,
      requires_subscription_resolution: false,
      requested_at: new Date().toISOString(),
      processing_deadline_at: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    },
    "synthetic_request_create_failed",
  );
}

async function testSyntheticRequestLifecycle() {
  const email = `fanmind-account-deletion-${RUN_ID}-${randomBytes(5).toString("hex")}@example.invalid`;
  const password = randomBytes(32).toString("base64url");
  syntheticUserId = await adminCreateSyntheticUser(email, password);
  const accessToken = await passwordLogin(email, password);
  await emit("SYNTHETIC_AUTH_USER_CREATED", "yes");

  const firstRequestId = randomUUID();
  await insertSyntheticRequest(firstRequestId, email);
  const statusResponse = await fetchJson(
    "https://fanmind.ch/api/account-deletion",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "X-FanMind-Client": "mobile",
      },
    },
    "status_api_failed",
  );
  if (
    !statusResponse.response.ok ||
    statusResponse.payload?.request?.status !== "pending" ||
    statusResponse.payload?.request?.id !== firstRequestId
  ) {
    throw new Error("status_api_failed");
  }
  await emit("SYNTHETIC_STATUS_API", "passed");

  const cancelResponse = await fetchJson(
    "https://fanmind.ch/api/account-deletion",
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-FanMind-Client": "mobile",
      },
      body: JSON.stringify({
        requestId: firstRequestId,
        confirmation: "LÖSCHANFRAGE ABBRECHEN",
      }),
    },
    "cancel_api_failed",
  );
  if (
    !cancelResponse.response.ok ||
    cancelResponse.payload?.request?.status !== "none"
  ) {
    throw new Error("cancel_api_failed");
  }
  const cancelledRows = await serviceRows(
    appConfig,
    "account_deletion_requests",
    new URLSearchParams({ select: "id", id: `eq.${firstRequestId}` }).toString(),
    "cancel_cleanup_failed",
  );
  if (cancelledRows.length !== 0) throw new Error("cancel_cleanup_failed");
  syntheticRequestIds = syntheticRequestIds.filter((id) => id !== firstRequestId);
  await emit("SYNTHETIC_CANCEL_API", "passed");
  await emit("SYNTHETIC_CANCELLED_ROW_RETAINED", "no");

  const secondRequestId = randomUUID();
  await insertSyntheticRequest(secondRequestId, email);
  const duplicateResponse = await fetch(
    `${appConfig.supabaseUrl}/rest/v1/account_deletion_requests`,
    {
      method: "POST",
      headers: serviceHeaders(appConfig, "return=minimal"),
      body: JSON.stringify({
        id: randomUUID(),
        user_id: syntheticUserId,
        notification_email: email,
        request_source: "mobile",
        confirmation_version: "v1",
        status: "pending",
        requested_at: new Date().toISOString(),
        processing_deadline_at: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    },
  ).catch(() => null);
  if (!duplicateResponse || duplicateResponse.status !== 409) {
    throw new Error("unique_index_not_enforced");
  }
  await emit("SYNTHETIC_ACTIVE_REQUEST_UNIQUENESS", "passed");

  const processorOutput = run(
    "/usr/bin/node",
    [
      PROCESSOR_PATH,
      "--env-file",
      APP_ENV_FILE,
      "--request-id",
      secondRequestId,
    ],
    { timeout: 120_000, errorCode: "processor_dry_run_failed" },
  );
  const expectedLines = new Set([
    "ACCOUNT_DELETION_MODE=dry_run",
    "ACCOUNT_DELETION_REQUEST_STATUS=pending",
    "ACCOUNT_DELETION_RESUME=false",
    "ACCOUNT_DELETION_OWNED_WORKSPACE_COUNT=0",
    "ACCOUNT_DELETION_OTHER_MEMBER_COUNT=0",
    "ACCOUNT_DELETION_SUBSCRIPTION_BLOCKED=false",
    "ACCOUNT_DELETION_ELIGIBLE=true",
    "ACCOUNT_DELETION_RESULT=dry_run_success",
  ]);
  const outputLines = processorOutput.split(/\r?\n/u).filter(Boolean);
  if (
    outputLines.length !== expectedLines.size ||
    outputLines.some((line) => !expectedLines.has(line)) ||
    processorOutput.includes(email) ||
    processorOutput.includes(syntheticUserId) ||
    processorOutput.includes(secondRequestId) ||
    processorOutput.includes(appConfig.serviceKey)
  ) {
    throw new Error("processor_dry_run_invalid");
  }
  const [requestRows, userStillExists] = await Promise.all([
    serviceRows(
      appConfig,
      "account_deletion_requests",
      new URLSearchParams({
        select: "id,status",
        id: `eq.${secondRequestId}`,
      }).toString(),
      "dry_run_side_effect_detected",
    ),
    authUserExists(syntheticUserId),
  ]);
  if (
    requestRows.length !== 1 ||
    requestRows[0].status !== "pending" ||
    !userStillExists
  ) {
    throw new Error("dry_run_side_effect_detected");
  }
  await emit("SYNTHETIC_PROCESSOR_DRY_RUN", "passed");
  await emit("SYNTHETIC_DESTRUCTIVE_PROCESSOR_EXECUTED", "no");

  await serviceDelete(
    appConfig,
    "account_deletion_requests",
    new URLSearchParams({ id: `eq.${secondRequestId}` }).toString(),
    "synthetic_cleanup_failed",
  );
  syntheticRequestIds = syntheticRequestIds.filter((id) => id !== secondRequestId);
  await adminDeleteSyntheticUser(syntheticUserId);
  if (await authUserExists(syntheticUserId)) {
    throw new Error("synthetic_cleanup_failed");
  }
  syntheticUserId = null;
  await emit("SYNTHETIC_TEST_DATA_REMAINING", 0);
}

async function verifyPublicBoundaries() {
  const routes = [
    "/",
    "/login",
    "/register",
    "/forgot-password",
    "/account-deletion",
    "/api/version",
    "/api/health",
  ];
  for (const route of routes) {
    const response = await fetch(`https://fanmind.ch${route}`, {
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    }).catch(() => null);
    if (!response?.ok) throw new Error("public_route_failed");
    if (route === "/account-deletion") {
      const body = await response.text();
      if (
        !body.includes("FanMind-Account vollständig löschen") ||
        !body.includes("settings%2Faccount-deletion")
      ) {
        throw new Error("public_route_failed");
      }
    }
  }
  const unauthenticated = await fetch(
    "https://fanmind.ch/api/account-deletion",
    {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    },
  ).catch(() => null);
  if (!unauthenticated || unauthenticated.status !== 401) {
    throw new Error("unauthenticated_api_boundary_failed");
  }
  await emit("PUBLIC_CORE_ROUTES", "healthy");
  await emit("ACCOUNT_DELETION_PUBLIC_RESOURCE", "healthy");
  await emit("ACCOUNT_DELETION_UNAUTHENTICATED_API", "401");
}

async function cleanupSyntheticData() {
  let clean = true;
  if (appConfig && syntheticRequestIds.length) {
    for (const requestId of syntheticRequestIds) {
      try {
        await serviceDelete(
          appConfig,
          "account_deletion_requests",
          new URLSearchParams({ id: `eq.${requestId}` }).toString(),
          "synthetic_cleanup_failed",
        );
      } catch {
        clean = false;
      }
    }
    syntheticRequestIds = [];
  }
  if (appConfig && syntheticUserId) {
    try {
      await adminDeleteSyntheticUser(syntheticUserId);
      syntheticUserId = null;
    } catch {
      clean = false;
    }
  }
  return clean;
}

async function main() {
  if (
    !REPORT_PATH ||
    !/^[0-9a-f]{40}$/u.test(EXPECTED_RELEASE) ||
    !/^[0-9]+$/u.test(RUN_ID)
  ) {
    throw new Error("activation_configuration_invalid");
  }
  await writeFile(REPORT_PATH, "", { mode: 0o600 });
  await emit("ACTIVATION_UTC", new Date().toISOString());
  await emit("EXPECTED_RELEASE", EXPECTED_RELEASE);
  await waitForExactRelease();
  await loadAndValidateProductionConfig();
  await upsertAccountDeletionEnv();
  await assertBackupWorkerAvailable();
  await enqueueFreshDatabaseBackup();
  await applyAndVerifyMigration();
  await verifyProcessorInstallation();
  await testSyntheticRequestLifecycle();
  await verifyPublicBoundaries();
  await emit("CUSTOMER_ACCOUNT_DELETION_EXECUTED", "no");
  await emit("ACCOUNT_DELETION_ACTIVATION_RESULT", "success");
  await chmod(REPORT_PATH, 0o644);
}

main().catch(async (error) => {
  const cleanupOk = await cleanupSyntheticData().catch(() => false);
  const code = SAFE_ERROR_CODES.has(error?.message)
    ? error.message
    : "activation_configuration_invalid";
  try {
    if (REPORT_PATH) {
      await appendFile(
        REPORT_PATH,
        `SYNTHETIC_FAILURE_CLEANUP=${cleanupOk ? "complete" : "incomplete"}\n`,
        { mode: 0o600 },
      );
      await appendFile(
        REPORT_PATH,
        `ACCOUNT_DELETION_ACTIVATION_RESULT=failed\nACCOUNT_DELETION_ACTIVATION_REASON=${code}\n`,
        { mode: 0o600 },
      );
      await chmod(REPORT_PATH, 0o644).catch(() => {});
    }
  } catch {
    // Keep failure output bounded if the report itself is unavailable.
  }
  process.stderr.write("account_deletion_activation_failed\n");
  process.exit(1);
});
