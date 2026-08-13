#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import {
  closeSync,
  constants,
  existsSync,
  fstatSync,
  mkdtempSync,
  openSync,
  readSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  MIGRATION_ID as AI_TIER_MIGRATION_ID,
  POSTFLIGHT_SQL as AI_TIER_POSTFLIGHT_SQL,
} from "./ai-tier-entitlement-migration-runner.mjs";
import * as metaContentMigrationControl from "./meta-content-migration-runner.mjs";
import {
  MIGRATION_ID as MOBILE_PUSH_MIGRATION_ID,
  POSTFLIGHT_SQL as MOBILE_PUSH_POSTFLIGHT_SQL,
} from "./mobile-push-registration-migration-runner.mjs";
import { POSTFLIGHT_SQL as META_CATCHUP_POSTFLIGHT_SQL } from "./meta-catchup-queue-migration-runner.mjs";
import {
  POSTFLIGHT_SQL as META_CONTINUATION_POSTFLIGHT_SQL,
  STATE_SQL as META_CONTINUATION_STATE_SQL,
} from "./meta-conversation-continuation-migration-runner.mjs";
import {
  deriveStagingDatabaseRolloutActions,
  evaluateStagingDatabaseRolloutStateEnvironment,
} from "../../src/lib/stagingDatabaseRolloutStatePolicy.mjs";

const MAX_PASSFILE_BYTES = 64 * 1024;
const OPTIONAL_TRIGGER_RUNNER = resolve(
  process.cwd(),
  "scripts/operations/trigger-function-hardening-migration-runner.mjs",
);

const OFFLINE_CONTROLS = Object.freeze([
  Object.freeze({
    path: resolve(
      process.cwd(),
      "scripts/operations/ai-tier-entitlement-migration-runner.mjs",
    ),
    arguments: ["--check"],
  }),
  Object.freeze({
    path: resolve(
      process.cwd(),
      "scripts/operations/mobile-push-registration-migration-runner.mjs",
    ),
    arguments: ["--check"],
  }),
  Object.freeze({
    path: resolve(
      process.cwd(),
      "scripts/operations/meta-content-migration-runner.mjs",
    ),
    arguments: ["--check"],
  }),
  Object.freeze({
    path: resolve(
      process.cwd(),
      "scripts/operations/meta-catchup-queue-migration-runner.mjs",
    ),
    arguments: ["--check"],
  }),
  Object.freeze({
    path: resolve(
      process.cwd(),
      "scripts/operations/meta-conversation-continuation-migration-runner.mjs",
    ),
    arguments: ["--check"],
  }),
]);

function fail(code) {
  throw new Error(`STAGING_DATABASE_ROLLOUT_STATE_ERROR=${code}`);
}

function modeFromArguments(argumentsList) {
  const known = new Set(["--check", "--run"]);
  if (argumentsList.some((argument) => !known.has(argument))) {
    fail("argument_invalid");
  }
  const selected = argumentsList.filter((argument) => known.has(argument));
  if (selected.length > 1) fail("mode_ambiguous");
  return selected[0] ?? "--check";
}

function migrationVersion(migrationId) {
  const match = /^(\d{14})_[a-z0-9_]+$/u.exec(migrationId);
  if (!match) fail("migration_id_invalid");
  return match[1];
}

function verifyOfflineControls() {
  const controls = [...OFFLINE_CONTROLS];
  if (existsSync(OPTIONAL_TRIGGER_RUNNER)) {
    controls.push(
      Object.freeze({ path: OPTIONAL_TRIGGER_RUNNER, arguments: ["--check"] }),
    );
  }
  for (const control of controls) {
    const result = spawnSync(process.execPath, [control.path, ...control.arguments], {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    if (result.error || result.status !== 0) fail("offline_control_failed");
  }
  console.log("STAGING_DATABASE_ROLLOUT_STATE_CONTROLS=verified");
}

function ledgerManagedMetaMigrations(migrations) {
  if (!Array.isArray(migrations)) fail("migration_manifest_invalid");
  const normalizedMigrations =
    migrations.length === 2 &&
    migrations.every((migration) => migration?.stage === undefined)
      ? migrations.map((migration) => ({ ...migration, stage: "foundation" }))
      : migrations;
  const foundationMigrations = normalizedMigrations.filter(
    (migration) => migration?.stage === "foundation",
  );
  if (
    foundationMigrations.length !== 2 ||
    foundationMigrations.some(
      (migration) => typeof migration.id !== "string",
    )
  ) {
    fail("migration_manifest_invalid");
  }
  return foundationMigrations;
}

function ledgerSql({
  metaMigrations = metaContentMigrationControl.MIGRATIONS,
} = {}) {
  const ledgerMetaMigrations = ledgerManagedMetaMigrations(metaMigrations);
  const migrationIds = [
    AI_TIER_MIGRATION_ID,
    MOBILE_PUSH_MIGRATION_ID,
    ...ledgerMetaMigrations.map((migration) => migration.id),
  ];
  const versions = migrationIds.map((migrationId) =>
    migrationVersion(migrationId),
  );
  if (versions.length !== 4 || new Set(versions).size !== 4) {
    fail("migration_manifest_invalid");
  }
  const flags = migrationIds.map(
    (migrationId, index) => String.raw`case when count(*) filter (
      where version = '${versions[index]}'
        or name in (
          '${migrationId}',
          '${migrationId.replace(/^\d{14}_/u, "")}'
        )
    ) = 1 then '1' else '0' end`,
  );
  return String.raw`
\set ON_ERROR_STOP on
begin;
set transaction read only;
select concat(
  'STAGING_DATABASE_LEDGER=',
  ${flags.join(", ':', ")}
)
from supabase_migrations.schema_migrations;
rollback;
`;
}

const LEDGER_STATE_SQL = String.raw`
\set ON_ERROR_STOP on
begin;
set transaction read only;
select 'STAGING_DATABASE_LEDGER_OBJECT=' ||
  case when to_regclass('supabase_migrations.schema_migrations') is null
    then 'absent' else 'present' end;
rollback;
`;

const AI_TIER_STATE_SQL = String.raw`
\set ON_ERROR_STOP on
begin;
set transaction read only;
select 'STAGING_DATABASE_AI_TIER_OBJECT=' ||
  case when to_regclass('public.workspace_ai_tier_entitlements') is null
    then 'absent' else 'present' end;
rollback;
`;

const MOBILE_PUSH_STATE_SQL = String.raw`
\set ON_ERROR_STOP on
begin;
set transaction read only;
select 'STAGING_DATABASE_MOBILE_PUSH_OBJECT=' ||
  case when to_regclass('public.mobile_push_registrations') is null
    then 'absent' else 'present' end;
rollback;
`;

const META_CATCHUP_STATE_SQL = String.raw`
\set ON_ERROR_STOP on
begin;
set transaction read only;
select 'STAGING_DATABASE_META_CATCHUP_OBJECT=' ||
  case when to_regclass('public.meta_conversation_catchup_jobs') is null
    then 'absent' else 'present' end;
rollback;
`;

const TRIGGER_HARDENING_STATE_SQL = String.raw`
\set ON_ERROR_STOP on
begin;
set transaction read only;
select 'STAGING_DATABASE_TRIGGER_OBJECT=' ||
  case
    when (
      select count(*)
      from pg_proc
      where oid in (
        to_regprocedure('public.set_social_connections_updated_at()'),
        to_regprocedure('public.set_referral_updated_at()'),
        to_regprocedure('public.set_demo_start_session_updated_at()')
      )
        and pronargs = 0
        and prorettype = 'trigger'::regtype
    ) <> 3 then 'invalid'
    when to_regprocedure(
      'public.trim_conversation_messages_to_latest_50()'
    ) is not null
      and not exists (
        select 1
        from pg_proc
        where oid = to_regprocedure(
          'public.trim_conversation_messages_to_latest_50()'
        )
          and pronargs = 0
          and prorettype = 'trigger'::regtype
          and prosecdef
      ) then 'invalid'
    else 'pending'
  end;
rollback;
`;

function privatePassfileSnapshot(environment) {
  const sourcePath = environment.PGPASSFILE?.trim();
  if (!sourcePath || !isAbsolute(sourcePath)) fail("passfile_missing");

  let sourceDescriptor;
  let snapshotDirectory;
  let content;
  try {
    sourceDescriptor = openSync(
      sourcePath,
      constants.O_RDONLY | constants.O_NOFOLLOW,
    );
    const opened = fstatSync(sourceDescriptor);
    if (
      !opened.isFile() ||
      (opened.mode & 0o777) !== 0o600 ||
      opened.size < 1 ||
      opened.size > MAX_PASSFILE_BYTES ||
      (typeof process.getuid === "function" && opened.uid !== process.getuid())
    ) {
      fail("passfile_invalid");
    }

    content = Buffer.alloc(opened.size);
    let offset = 0;
    while (offset < content.length) {
      const bytesRead = readSync(
        sourceDescriptor,
        content,
        offset,
        content.length - offset,
        offset,
      );
      if (bytesRead === 0) fail("passfile_read_failed");
      offset += bytesRead;
    }
    const settled = fstatSync(sourceDescriptor);
    if (
      settled.dev !== opened.dev ||
      settled.ino !== opened.ino ||
      settled.size !== opened.size ||
      settled.mtimeMs !== opened.mtimeMs ||
      settled.ctimeMs !== opened.ctimeMs
    ) {
      fail("passfile_changed");
    }

    snapshotDirectory = mkdtempSync(
      join(tmpdir(), "fanmind-staging-rollout-state-"),
    );
    const snapshotPath = join(snapshotDirectory, "pgpass");
    writeFileSync(snapshotPath, content, { mode: 0o600, flag: "wx" });
    return { snapshotDirectory, snapshotPath };
  } catch (error) {
    if (snapshotDirectory) {
      rmSync(snapshotDirectory, { recursive: true, force: true });
    }
    if (
      error instanceof Error &&
      error.message.startsWith("STAGING_DATABASE_ROLLOUT_STATE_ERROR=")
    ) {
      throw error;
    }
    fail("passfile_read_failed");
  } finally {
    content?.fill(0);
    if (sourceDescriptor !== undefined) closeSync(sourceDescriptor);
  }
}

function psqlEnvironment(environment, passfilePath) {
  const safeEnvironment = { ...environment, PGPASSFILE: passfilePath };
  for (const key of [
    "DATABASE_URL",
    "POSTGRES_URL",
    "SUPABASE_DB_URL",
    "PGPASSWORD",
    "PGHOSTADDR",
    "PGSERVICE",
    "PGSERVICEFILE",
    "PGSYSCONFDIR",
    "PGSSLCERT",
    "PGSSLKEY",
    "PGSSLPASSWORD",
    "PGSSLCRL",
    "PGSSLCRLDIR",
  ]) {
    delete safeEnvironment[key];
  }
  safeEnvironment.PGCONNECT_TIMEOUT = "10";
  safeEnvironment.PGSSLMODE = "verify-full";
  return safeEnvironment;
}

function runPsql(sql, environment, passfilePath) {
  return spawnSync(
    "psql",
    [
      "--no-password",
      "--no-psqlrc",
      "--quiet",
      "--tuples-only",
      "--no-align",
      "--set=ON_ERROR_STOP=1",
      "--set=VERBOSITY=verbose",
      "--set=SHOW_CONTEXT=never",
    ],
    {
      env: psqlEnvironment(environment, passfilePath),
      input: sql,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    },
  );
}

function psqlFailureCategory(result) {
  if (result?.error?.code === "ENOENT") return "client_unavailable";
  if (result?.error) return "client_execution_failed";

  const diagnostic = String(result?.stderr ?? "").toLowerCase();
  const patterns = [
    ["tenant_or_user_not_found", /tenant or user not found/u],
    ["password_authentication_failed", /password authentication failed/u],
    ["password_unavailable", /no password supplied/u],
    ["access_rule_rejected", /no pg_hba\.conf entry/u],
    ["tls_verification_failed", /certificate verify failed|root certificate file/u],
    ["dns_resolution_failed", /could not translate host name|name or service not known/u],
    ["connection_timeout", /connection timed out|timeout expired/u],
    ["network_unreachable", /network is unreachable|no route to host/u],
    ["connection_refused", /connection refused/u],
    ["connection_closed", /server closed the connection unexpectedly/u],
    ["permission_denied", /permission denied/u],
    ["object_absent", /does not exist/u],
    ["sql_syntax_invalid", /syntax error/u],
    ["transaction_aborted", /current transaction is aborted/u],
    ["write_blocked", /read-only transaction/u],
    ["tls_transport_failed", /ssl syscall error|ssl error/u],
  ];
  for (const [category, pattern] of patterns) {
    if (pattern.test(diagnostic)) return category;
  }

  const sqlState = /\b(?:error|fatal):\s+([0-9a-z]{5}):/u.exec(
    diagnostic,
  )?.[1];
  return sqlState ? `sqlstate_${sqlState}` : "unclassified";
}

function ensurePsqlAvailable() {
  const result = spawnSync("psql", ["--version"], {
    encoding: "utf8",
    stdio: ["ignore", "ignore", "ignore"],
  });
  if (result.error || result.status !== 0) fail("psql_unavailable");
}

function successfulProbe(sql, environment, passfilePath, marker) {
  const result = runPsql(sql, environment, passfilePath);
  return Boolean(
    !result.error && result.status === 0 && result.stdout.includes(marker),
  );
}

function requiredProbe(sql, environment, passfilePath, probeName) {
  const result = runPsql(sql, environment, passfilePath);
  if (result.error || result.status !== 0) {
    console.error(
      `STAGING_DATABASE_ROLLOUT_STATE_PROBE_FAILURE=${probeName}:${psqlFailureCategory(result)}`,
    );
    fail("database_probe_failed");
  }
  return result.stdout.trim();
}

function parseLedger(output) {
  const match = /STAGING_DATABASE_LEDGER=([01]):([01]):([01]):([01])/u.exec(
    output,
  );
  if (!match) fail("ledger_probe_invalid");
  return Object.freeze({
    aiTier: match[1] === "1",
    mobilePush: match[2] === "1",
    metaFoundation: match[3] === "1",
    metaHistory: match[4] === "1",
  });
}

function tableObjectState({
  stateSql,
  stateMarker,
  postflightSql,
  postflightMarker,
  environment,
  passfilePath,
}) {
  const state = requiredProbe(
    stateSql,
    environment,
    passfilePath,
    `${stateMarker.toLowerCase()}_state`,
  );
  if (state.includes(`${stateMarker}=absent`)) return "absent";
  if (!state.includes(`${stateMarker}=present`)) return "invalid";
  return successfulProbe(
    postflightSql,
    environment,
    passfilePath,
    postflightMarker,
  )
    ? "current"
    : "invalid";
}

function metaObjectState(environment, passfilePath) {
  const state = requiredProbe(
    metaContentMigrationControl.STATE_SQL,
    environment,
    passfilePath,
    "meta_content_state",
  );
  if (state.includes("META_CONTENT_MIGRATION_STATE=absent")) return "absent";
  if (state.includes("META_CONTENT_MIGRATION_STATE=foundation")) {
    const foundationPostflightSql =
      metaContentMigrationControl.FOUNDATION_POSTFLIGHT_SQL;
    if (typeof foundationPostflightSql !== "string") return "invalid";
    return successfulProbe(
      foundationPostflightSql,
      environment,
      passfilePath,
      "META_CONTENT_FOUNDATION_POSTFLIGHT=PASS",
    )
      ? "foundation"
      : "invalid";
  }
  if (!state.includes("META_CONTENT_MIGRATION_STATE=installed")) {
    return "invalid";
  }
  return successfulProbe(
    metaContentMigrationControl.POSTFLIGHT_SQL,
    environment,
    passfilePath,
    "META_CONTENT_MIGRATION_POSTFLIGHT=PASS",
  )
    ? "current"
    : "invalid";
}

async function triggerObjectState(environment, passfilePath) {
  if (!existsSync(OPTIONAL_TRIGGER_RUNNER)) return "unavailable";
  const controlModule = await import(
    pathToFileURL(OPTIONAL_TRIGGER_RUNNER).href
  );
  if (typeof controlModule.POSTFLIGHT_SQL !== "string") return "invalid";
  const state = requiredProbe(
    TRIGGER_HARDENING_STATE_SQL,
    environment,
    passfilePath,
    "trigger_hardening_state",
  );
  if (state.includes("STAGING_DATABASE_TRIGGER_OBJECT=invalid")) {
    return "invalid";
  }
  if (!state.includes("STAGING_DATABASE_TRIGGER_OBJECT=pending")) {
    return "invalid";
  }
  return successfulProbe(
    controlModule.POSTFLIGHT_SQL,
    environment,
    passfilePath,
    "TRIGGER_FUNCTION_HARDENING_POSTFLIGHT=PASS",
  )
    ? "current"
    : "pending";
}

async function inspectDatabase(environment) {
  const evaluation = evaluateStagingDatabaseRolloutStateEnvironment(environment);
  if (!evaluation.ok) fail("environment_invalid");
  ensurePsqlAvailable();

  const { snapshotDirectory, snapshotPath } =
    privatePassfileSnapshot(environment);
  try {
    const ledgerState = requiredProbe(
      LEDGER_STATE_SQL,
      environment,
      snapshotPath,
      "ledger_object",
    );
    const ledger = ledgerState.includes("STAGING_DATABASE_LEDGER_OBJECT=absent")
      ? Object.freeze({
          aiTier: false,
          mobilePush: false,
          metaFoundation: false,
          metaHistory: false,
        })
      : ledgerState.includes("STAGING_DATABASE_LEDGER_OBJECT=present")
        ? parseLedger(
            requiredProbe(
              ledgerSql(),
              environment,
              snapshotPath,
              "ledger_rows",
            ),
          )
        : fail("ledger_probe_invalid");
    const objects = Object.freeze({
      aiTier: tableObjectState({
        stateSql: AI_TIER_STATE_SQL,
        stateMarker: "STAGING_DATABASE_AI_TIER_OBJECT",
        postflightSql: AI_TIER_POSTFLIGHT_SQL,
        postflightMarker: "AI_TIER_ENTITLEMENT_MIGRATION_POSTFLIGHT=PASS",
        environment,
        passfilePath: snapshotPath,
      }),
      mobilePush: tableObjectState({
        stateSql: MOBILE_PUSH_STATE_SQL,
        stateMarker: "STAGING_DATABASE_MOBILE_PUSH_OBJECT",
        postflightSql: MOBILE_PUSH_POSTFLIGHT_SQL,
        postflightMarker:
          "MOBILE_PUSH_REGISTRATION_MIGRATION_POSTFLIGHT=PASS",
        environment,
        passfilePath: snapshotPath,
      }),
      metaContent: metaObjectState(environment, snapshotPath),
      metaCatchup: tableObjectState({
        stateSql: META_CATCHUP_STATE_SQL,
        stateMarker: "STAGING_DATABASE_META_CATCHUP_OBJECT",
        postflightSql: META_CATCHUP_POSTFLIGHT_SQL,
        postflightMarker: "META_CATCHUP_QUEUE_POSTFLIGHT=PASS",
        environment,
        passfilePath: snapshotPath,
      }),
      metaContinuation: tableObjectState({
        stateSql: META_CONTINUATION_STATE_SQL,
        stateMarker: "META_CONVERSATION_CONTINUATION_STATE",
        postflightSql: META_CONTINUATION_POSTFLIGHT_SQL,
        postflightMarker: "META_CONVERSATION_CONTINUATION_POSTFLIGHT=PASS",
        environment,
        passfilePath: snapshotPath,
      }),
      triggerHardening: await triggerObjectState(environment, snapshotPath),
    });
    return deriveStagingDatabaseRolloutActions({ ledger, objects });
  } finally {
    rmSync(snapshotDirectory, { recursive: true, force: true });
  }
}

async function main() {
  const mode = modeFromArguments(process.argv.slice(2));
  verifyOfflineControls();
  if (mode === "--check") {
    console.log("STAGING_DATABASE_ROLLOUT_STATE_MODE=check");
    console.log("STAGING_DATABASE_ROLLOUT_STATE_READY=YES");
    return;
  }

  const result = await inspectDatabase(process.env);
  console.log("STAGING_DATABASE_ROLLOUT_STATE_MODE=read_only");
  console.log(`STAGING_DATABASE_ROLLOUT_AI_TIER=${result.actions.aiTier}`);
  console.log(
    `STAGING_DATABASE_ROLLOUT_MOBILE_PUSH=${result.actions.mobilePush}`,
  );
  console.log(
    `STAGING_DATABASE_ROLLOUT_META_CONTENT=${result.actions.metaContent}`,
  );
  console.log(
    `STAGING_DATABASE_ROLLOUT_META_CATCHUP=${result.actions.metaCatchup}`,
  );
  console.log(
    `STAGING_DATABASE_ROLLOUT_META_CONTINUATION=${result.actions.metaContinuation}`,
  );
  console.log(
    `STAGING_DATABASE_ROLLOUT_TRIGGER_HARDENING=${result.actions.triggerHardening}`,
  );
  console.log("STAGING_DATABASE_ROLLOUT_GENERIC_MIGRATION=disabled");
  console.log("SECRETS_WURDEN_NICHT_AUSGEGEBEN=true");
  console.log(
    `STAGING_DATABASE_ROLLOUT_STATE=${result.blocked ? "BLOCKED" : "PASS"}`,
  );
  if (result.blocked) process.exitCode = 1;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  main().catch((error) => {
    if (
      error instanceof Error &&
      /^STAGING_DATABASE_ROLLOUT_STATE_ERROR=[a-z0-9_]+$/u.test(
        error.message,
      )
    ) {
      console.error(error.message);
    } else {
      console.error("STAGING_DATABASE_ROLLOUT_STATE_ERROR=unexpected_failure");
    }
    console.error("SECRETS_WURDEN_NICHT_AUSGEGEBEN=true");
    process.exitCode = 1;
  });
}

export {
  AI_TIER_STATE_SQL,
  LEDGER_STATE_SQL,
  META_CATCHUP_STATE_SQL,
  META_CONTINUATION_STATE_SQL,
  MOBILE_PUSH_STATE_SQL,
  TRIGGER_HARDENING_STATE_SQL,
  ledgerManagedMetaMigrations,
  ledgerSql,
  psqlFailureCategory,
};
