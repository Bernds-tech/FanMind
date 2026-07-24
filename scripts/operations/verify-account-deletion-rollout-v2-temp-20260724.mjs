#!/usr/bin/env node

import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { appendFile, chmod, readFile, stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const SOURCE_DIR = "/var/www/fanmind";
const APP_ENV_FILE = `${SOURCE_DIR}/.env.production`;
const BACKUP_ENV_FILE = "/etc/fanmind-backup/worker.env";
const PROCESSOR_PATH = "/usr/local/lib/fanmind-ops/process-account-deletion.mjs";
const EXPECTED_RELEASE = String(process.env.EXPECTED_RELEASE ?? "").trim();
const REPORT_PATH = process.argv[2] ? resolve(process.argv[2]) : "";
const RUN_ID = String(process.env.GITHUB_RUN_ID ?? "").trim();
const SYNTHETIC_EMAIL_PATTERN = "fanmind-account-deletion-%@example.invalid";
const SAFE_ERRORS = new Set([
  "configuration_invalid",
  "release_timeout",
  "health_invalid",
  "production_config_invalid",
  "schema_invalid",
  "postgrest_schema_timeout",
  "stale_cleanup_failed",
  "synthetic_user_create_failed",
  "synthetic_login_failed",
  "synthetic_request_create_failed",
  "status_api_failed",
  "cancel_api_failed",
  "cancel_cleanup_failed",
  "unique_index_not_enforced",
  "processor_install_invalid",
  "processor_dry_run_failed",
  "processor_dry_run_invalid",
  "dry_run_side_effect_detected",
  "synthetic_cleanup_failed",
  "public_route_failed",
  "unauthenticated_api_boundary_failed",
]);

let appConfig = null;
let dbConfig = null;
let syntheticUserId = null;
const syntheticRequestIds = new Set();

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
    throw new Error("production_config_invalid");
  }
  return value;
}

function normalizeSupabaseUrl(value) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("production_config_invalid");
  }
  if (parsed.protocol !== "https:" || !parsed.hostname.endsWith(".supabase.co")) {
    throw new Error("production_config_invalid");
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
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    throw new Error(options.errorCode ?? "configuration_invalid");
  }
  return String(result.stdout ?? "").trim();
}

async function fetchJson(url, init = {}, errorCode = "configuration_invalid") {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  }).catch(() => null);
  if (!response) throw new Error(errorCode);
  const payload = await response.json().catch(() => null);
  return { response, payload };
}

function serviceHeaders(prefer) {
  return {
    apikey: appConfig.serviceKey,
    Authorization: `Bearer ${appConfig.serviceKey}`,
    "Content-Type": "application/json",
    ...(prefer ? { Prefer: prefer } : {}),
  };
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
        const health = await fetchJson(
          "https://fanmind.ch/api/health",
          {},
          "health_invalid",
        );
        const checks = Array.isArray(health.payload?.checks)
          ? health.payload.checks
          : [];
        if (
          !health.response.ok ||
          health.payload?.status !== "healthy" ||
          checks.length < 7 ||
          !checks.every((check) => check?.status === "healthy")
        ) {
          throw new Error("health_invalid");
        }
        await emit("RELEASE_SYNC", "ok");
        await emit("PUBLIC_REQUIRED_HEALTHY_COUNT", checks.length);
        return;
      }
    } catch {
      // Retry without exposing response bodies or command output.
    }
    await sleep(10_000);
  }
  throw new Error("release_timeout");
}

async function loadProductionConfig() {
  const [appText, backupText] = await Promise.all([
    readFile(APP_ENV_FILE, "utf8"),
    readFile(BACKUP_ENV_FILE, "utf8"),
  ]).catch(() => {
    throw new Error("production_config_invalid");
  });
  const appEnv = parseEnvText(appText);
  const backupEnv = parseEnvText(backupText);
  const appUrl = normalizeSupabaseUrl(
    requireValue(appEnv, "NEXT_PUBLIC_SUPABASE_URL", 12),
  );
  const backupUrl = normalizeSupabaseUrl(
    requireValue(backupEnv, "NEXT_PUBLIC_SUPABASE_URL", 12),
  );
  const appKey = requireValue(appEnv, "SUPABASE_SERVICE_ROLE_KEY", 20);
  const backupKey = requireValue(backupEnv, "SUPABASE_SERVICE_ROLE_KEY", 20);
  if (appUrl !== backupUrl || !sameSecret(appKey, backupKey)) {
    throw new Error("production_config_invalid");
  }
  if (
    appEnv.FANMIND_ACCOUNT_DELETION_EXECUTION_ENABLED !== "false" ||
    String(appEnv.FANMIND_ACCOUNT_DELETION_HASH_SECRET ?? "").length < 32
  ) {
    throw new Error("production_config_invalid");
  }
  appConfig = {
    env: appEnv,
    supabaseUrl: appUrl,
    serviceKey: appKey,
    anonKey: requireValue(appEnv, "NEXT_PUBLIC_SUPABASE_ANON_KEY", 20),
  };
  dbConfig = backupEnv;
  await emit("PRODUCTION_CONFIG_BOUNDARY", "matched");
  await emit("ACCOUNT_DELETION_EXECUTION_GATE", "disabled");
  await emit("ACCOUNT_DELETION_HASH_SECRET", "present");
}

function psqlArgs() {
  return [
    "-X",
    "-q",
    "-v",
    "ON_ERROR_STOP=1",
    "--host",
    requireValue(dbConfig, "FANMIND_BACKUP_DB_HOST", 2),
    "--port",
    String(dbConfig.FANMIND_BACKUP_DB_PORT || "5432"),
    "--username",
    requireValue(dbConfig, "FANMIND_BACKUP_DB_USER", 1),
    "--dbname",
    requireValue(dbConfig, "FANMIND_BACKUP_DB_NAME", 1),
  ];
}

function psqlEnv() {
  return {
    ...process.env,
    PGPASSFILE: requireValue(dbConfig, "FANMIND_BACKUP_PGPASSFILE", 2),
  };
}

function psqlScalar(sql, errorCode = "schema_invalid") {
  return run(
    "/usr/lib/postgresql/17/bin/psql",
    [...psqlArgs(), "-tA", "-c", sql],
    { env: psqlEnv(), timeout: 120_000, errorCode },
  );
}

async function verifySchemaAndReloadPostgrest() {
  const result = psqlScalar(`
    select concat_ws('|',
      to_regclass('public.account_deletion_requests') is not null,
      c.relrowsecurity,
      (select count(*) = 0 from pg_policies where schemaname = 'public' and tablename = 'account_deletion_requests'),
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
  if (result !== Array(13).fill("t").join("|")) {
    throw new Error("schema_invalid");
  }
  psqlScalar("select pg_notify('pgrst', 'reload schema');");
  await emit("ACCOUNT_DELETION_SCHEMA", "verified");

  for (let attempt = 1; attempt <= 45; attempt += 1) {
    const { response, payload } = await fetchJson(
      `${appConfig.supabaseUrl}/rest/v1/account_deletion_requests?select=id&limit=1`,
      { headers: serviceHeaders() },
      "postgrest_schema_timeout",
    );
    if (response.ok && Array.isArray(payload)) {
      await emit("ACCOUNT_DELETION_POSTGREST_SCHEMA", "ready");
      return;
    }
    await sleep(2_000);
  }
  throw new Error("postgrest_schema_timeout");
}

async function adminDeleteUser(userId) {
  const response = await fetch(
    `${appConfig.supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(userId)}`,
    {
      method: "DELETE",
      headers: serviceHeaders(),
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
      headers: serviceHeaders(),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    },
  ).catch(() => null);
  if (!response) throw new Error("synthetic_cleanup_failed");
  if (response.status === 404) return false;
  if (!response.ok) throw new Error("synthetic_cleanup_failed");
  return true;
}

async function cleanStaleSyntheticData() {
  psqlScalar(`
    delete from public.account_deletion_requests
    where notification_email like '${SYNTHETIC_EMAIL_PATTERN}';
  `, "stale_cleanup_failed");
  const ids = psqlScalar(`
    select id::text
    from auth.users
    where email like '${SYNTHETIC_EMAIL_PATTERN}'
      and coalesce(raw_user_meta_data->>'fanmind_synthetic', 'false') = 'true'
      and raw_user_meta_data->>'purpose' = 'account_deletion_activation';
  `, "stale_cleanup_failed")
    .split(/\r?\n/u)
    .map((value) => value.trim())
    .filter((value) => /^[0-9a-f-]{36}$/u.test(value));
  for (const id of ids) {
    await adminDeleteUser(id);
  }
  const remaining = psqlScalar(`
    select concat_ws('|',
      (select count(*) from public.account_deletion_requests where notification_email like '${SYNTHETIC_EMAIL_PATTERN}'),
      (select count(*) from auth.users where email like '${SYNTHETIC_EMAIL_PATTERN}' and coalesce(raw_user_meta_data->>'fanmind_synthetic', 'false') = 'true' and raw_user_meta_data->>'purpose' = 'account_deletion_activation')
    );
  `, "stale_cleanup_failed");
  if (remaining !== "0|0") throw new Error("stale_cleanup_failed");
  await emit("STALE_SYNTHETIC_CLEANUP", "complete");
}

async function adminCreateSyntheticUser(email, password) {
  const { response, payload } = await fetchJson(
    `${appConfig.supabaseUrl}/auth/v1/admin/users`,
    {
      method: "POST",
      headers: serviceHeaders(),
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

async function serviceInsertRequest(requestId, email) {
  syntheticRequestIds.add(requestId);
  const { response, payload } = await fetchJson(
    `${appConfig.supabaseUrl}/rest/v1/account_deletion_requests`,
    {
      method: "POST",
      headers: serviceHeaders("return=representation"),
      body: JSON.stringify({
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
      }),
    },
    "synthetic_request_create_failed",
  );
  if (!response.ok || !Array.isArray(payload) || payload[0]?.id !== requestId) {
    throw new Error("synthetic_request_create_failed");
  }
}

async function serviceDeleteRequest(requestId) {
  const { response, payload } = await fetchJson(
    `${appConfig.supabaseUrl}/rest/v1/account_deletion_requests?id=eq.${encodeURIComponent(requestId)}&select=id`,
    {
      method: "DELETE",
      headers: serviceHeaders("return=representation"),
    },
    "synthetic_cleanup_failed",
  );
  if (!response.ok || !Array.isArray(payload)) {
    throw new Error("synthetic_cleanup_failed");
  }
  syntheticRequestIds.delete(requestId);
}

async function testSyntheticLifecycle() {
  const email = `fanmind-account-deletion-${RUN_ID}-${randomBytes(5).toString("hex")}@example.invalid`;
  const password = randomBytes(32).toString("base64url");
  syntheticUserId = await adminCreateSyntheticUser(email, password);
  const accessToken = await passwordLogin(email, password);
  await emit("SYNTHETIC_AUTH_USER_CREATED", "yes");

  const firstRequestId = randomUUID();
  await serviceInsertRequest(firstRequestId, email);
  const status = await fetchJson(
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
    !status.response.ok ||
    status.payload?.request?.status !== "pending" ||
    status.payload?.request?.id !== firstRequestId
  ) {
    throw new Error("status_api_failed");
  }
  await emit("SYNTHETIC_STATUS_API", "passed");

  const cancelled = await fetchJson(
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
    !cancelled.response.ok ||
    cancelled.payload?.request?.status !== "none"
  ) {
    throw new Error("cancel_api_failed");
  }
  const cancelledCount = psqlScalar(`
    select count(*) from public.account_deletion_requests
    where id = '${firstRequestId}'::uuid;
  `, "cancel_cleanup_failed");
  if (cancelledCount !== "0") throw new Error("cancel_cleanup_failed");
  syntheticRequestIds.delete(firstRequestId);
  await emit("SYNTHETIC_CANCEL_API", "passed");
  await emit("SYNTHETIC_CANCELLED_ROW_RETAINED", "no");

  const secondRequestId = randomUUID();
  await serviceInsertRequest(secondRequestId, email);
  const duplicate = await fetch(
    `${appConfig.supabaseUrl}/rest/v1/account_deletion_requests`,
    {
      method: "POST",
      headers: serviceHeaders("return=minimal"),
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
  if (!duplicate || duplicate.status !== 409) {
    throw new Error("unique_index_not_enforced");
  }
  await emit("SYNTHETIC_ACTIVE_REQUEST_UNIQUENESS", "passed");

  const processorStat = await stat(PROCESSOR_PATH).catch(() => null);
  const processorSource = await readFile(PROCESSOR_PATH, "utf8").catch(() => "");
  if (
    !processorStat ||
    processorStat.uid !== 0 ||
    (processorStat.mode & 0o777) !== 0o750 ||
    !processorSource.includes("FANMIND_ACCOUNT_DELETION_EXECUTION_ENABLED") ||
    !processorSource.includes('const resume = hasFlag("--resume")')
  ) {
    throw new Error("processor_install_invalid");
  }
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
  const requestState = psqlScalar(`
    select concat_ws('|', status, user_id is not null)
    from public.account_deletion_requests
    where id = '${secondRequestId}'::uuid;
  `, "dry_run_side_effect_detected");
  if (requestState !== "pending|t" || !(await authUserExists(syntheticUserId))) {
    throw new Error("dry_run_side_effect_detected");
  }
  await emit("SYNTHETIC_PROCESSOR_DRY_RUN", "passed");
  await emit("SYNTHETIC_DESTRUCTIVE_PROCESSOR_EXECUTED", "no");

  await serviceDeleteRequest(secondRequestId);
  await adminDeleteUser(syntheticUserId);
  if (await authUserExists(syntheticUserId)) {
    throw new Error("synthetic_cleanup_failed");
  }
  syntheticUserId = null;
  await emit("SYNTHETIC_TEST_DATA_REMAINING", 0);
}

async function verifyPublicBoundaries() {
  for (const route of [
    "/",
    "/login",
    "/register",
    "/forgot-password",
    "/account-deletion",
    "/api/version",
    "/api/health",
  ]) {
    const response = await fetch(`https://fanmind.ch${route}`, {
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    }).catch(() => null);
    if (!response?.ok) throw new Error("public_route_failed");
  }
  const unauthenticated = await fetch(
    "https://fanmind.ch/api/account-deletion",
    {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    },
  ).catch(() => null);
  if (!unauthenticated || unauthenticated.status !== 401) {
    throw new Error("unauthenticated_api_boundary_failed");
  }
  await emit("PUBLIC_CORE_AND_DELETION_ROUTES", "healthy");
  await emit("ACCOUNT_DELETION_UNAUTHENTICATED_API", "401");
}

async function cleanupSyntheticData() {
  let clean = true;
  for (const requestId of [...syntheticRequestIds]) {
    try {
      await serviceDeleteRequest(requestId);
    } catch {
      clean = false;
    }
  }
  if (syntheticUserId) {
    try {
      await adminDeleteUser(syntheticUserId);
      syntheticUserId = null;
    } catch {
      clean = false;
    }
  }
  try {
    await cleanStaleSyntheticData();
  } catch {
    clean = false;
  }
  return clean;
}

async function main() {
  if (
    !REPORT_PATH ||
    !/^[0-9a-f]{40}$/u.test(EXPECTED_RELEASE) ||
    !/^[0-9]+$/u.test(RUN_ID)
  ) {
    throw new Error("configuration_invalid");
  }
  await writeFile(REPORT_PATH, "", { mode: 0o600, flag: "wx" }).catch(async (error) => {
    if (error?.code !== "EEXIST") throw error;
    await writeFile(REPORT_PATH, "", { mode: 0o600 });
  });
  await emit("VERIFICATION_UTC", new Date().toISOString());
  await emit("EXPECTED_RELEASE", EXPECTED_RELEASE);
  await waitForExactRelease();
  await loadProductionConfig();
  await verifySchemaAndReloadPostgrest();
  await cleanStaleSyntheticData();
  await testSyntheticLifecycle();
  await verifyPublicBoundaries();
  await emit("CUSTOMER_ACCOUNT_DELETION_EXECUTED", "no");
  await emit("ACCOUNT_DELETION_ROLLOUT_VERIFICATION_RESULT", "success");
  await chmod(REPORT_PATH, 0o600);
}

main().catch(async (error) => {
  const cleanupComplete = await cleanupSyntheticData().catch(() => false);
  const code = SAFE_ERRORS.has(error?.message)
    ? error.message
    : "account_deletion_rollout_verification_failed";
  try {
    await emit(
      "SYNTHETIC_FAILURE_CLEANUP",
      cleanupComplete ? "complete" : "incomplete",
    );
    await emit("ACCOUNT_DELETION_ROLLOUT_VERIFICATION_RESULT", "failed");
    await emit("ACCOUNT_DELETION_ROLLOUT_VERIFICATION_REASON", code);
    await chmod(REPORT_PATH, 0o600);
  } catch {
    // Keep failure output bounded if the report cannot be written.
  }
  process.stderr.write("account_deletion_rollout_verification_failed\n");
  process.exit(1);
});

export { main };

if (
  process.argv[1] &&
  import.meta.url !== pathToFileURL(process.argv[1]).href
) {
  // Imported for review only; no side effects.
}
