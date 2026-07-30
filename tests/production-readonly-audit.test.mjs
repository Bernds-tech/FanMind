import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import test from "node:test";

import { verifyProductionAuditOutput } from "../scripts/operations/verify-production-audit-output.mjs";

const auditScriptPath = "scripts/operations/read-only-production-audit.sh";
const execFileAsync = promisify(execFile);
const expectedCommit = "a".repeat(40);

async function readAuditScript() {
  return readFile(auditScriptPath, "utf8");
}

function validAuditOutput(overrides = {}) {
  const values = {
    SERVER_HEAD: expectedCommit,
    ORIGIN_MAIN: expectedCommit,
    LIVE_RELEASE: expectedCommit,
    LIVE_ENVIRONMENT: "production",
    LIVE_RUNTIME_ENVIRONMENT: "production",
    LIVE_HEALTH: "healthy",
    PM2_STATUS: "online",
    PM2_RESTARTS: "12",
    PM2_UNSTABLE_RESTARTS: "0",
    PM2_UPTIME_SECONDS: "7200",
    NGINX_CONFIG: "ok",
    LOCAL_LOGIN_HTTP: "200",
    PUBLIC_LOGIN_HTTP: "200",
    ROOT_DISK_USED_PERCENT: "41",
    MEMORY_AVAILABLE_KIB: "2048000",
    REBOOT_REQUIRED: "false",
    FANMIND_SYSTEMD_UNIT_COUNT: "17",
    BACKUP_ROOT: "available",
    BACKUP_COMPLETE_PAIR_COUNT: "7",
    BACKUP_ORPHAN_PAIR_COUNT: "0",
    BACKUP_VERIFY_OK: "true",
    BACKUP_VERIFY_MODE: "checksum_only",
    BACKUP_VERIFY_TYPE: "full",
    BACKUP_VERIFY_SIZE_BYTES: "5000000",
    OFFSITE_ENABLED: "true",
    OFFSITE_STATUS: "reachable",
    OFFSITE_COMPLETE_PAIR_COUNT: "38",
    OFFSITE_ORPHAN_PAIR_COUNT: "0",
    OFFSITE_LATEST_FULL: "fanmind-full-redacted.tar.gz.age",
    BACKUP_WORKER_STRUCTURED_EVENT_COUNT: "40",
    BACKUP_WORKER_24H_FAILURE_EVENT_COUNT: "0",
    BACKUP_WORKER_24H_FAILURE_FREE: "true",
    AUDIT_RESULT: "success",
    ...overrides,
  };
  const health = [
    "application",
    "supabase_config",
    "supabase_database",
    "supabase_storage",
    "stripe_config",
    "openai_config",
    "shared_rate_limit_config",
    "email_config",
  ].map((component) => `HEALTH_COMPONENT=${component}:healthy`);
  const backups = [
    ["database", "12.50"],
    ["storage", "11.25"],
    ["server_config", "10.75"],
    ["full", "120.00"],
  ].map(
    ([type, age]) =>
      `BACKUP_LATEST=${type}|file=fanmind-${type}-redacted.age|age_hours=${age}|size_bytes=1000|pair=complete`,
  );
  return [
    "AUDIT_UTC=2026-07-30T12:00:00Z",
    `SERVER_HEAD=${values.SERVER_HEAD}`,
    `ORIGIN_MAIN=${values.ORIGIN_MAIN}`,
    `LIVE_RELEASE=${values.LIVE_RELEASE}`,
    `LIVE_ENVIRONMENT=${values.LIVE_ENVIRONMENT}`,
    `LIVE_RUNTIME_ENVIRONMENT=${values.LIVE_RUNTIME_ENVIRONMENT}`,
    `LIVE_HEALTH=${values.LIVE_HEALTH}`,
    ...health,
    `PM2_STATUS=${values.PM2_STATUS}`,
    `PM2_RESTARTS=${values.PM2_RESTARTS}`,
    `PM2_UNSTABLE_RESTARTS=${values.PM2_UNSTABLE_RESTARTS}`,
    `PM2_UPTIME_SECONDS=${values.PM2_UPTIME_SECONDS}`,
    "PM2_CWD=/var/www/fanmind-current",
    "PM2_EXEC_MODE=cluster_mode",
    "PM2_MEMORY_BYTES=100000000",
    `NGINX_CONFIG=${values.NGINX_CONFIG}`,
    `LOCAL_LOGIN_HTTP=${values.LOCAL_LOGIN_HTTP}`,
    `PUBLIC_LOGIN_HTTP=${values.PUBLIC_LOGIN_HTTP}`,
    `ROOT_DISK_USED_PERCENT=${values.ROOT_DISK_USED_PERCENT}`,
    `MEMORY_AVAILABLE_KIB=${values.MEMORY_AVAILABLE_KIB}`,
    `REBOOT_REQUIRED=${values.REBOOT_REQUIRED}`,
    `FANMIND_SYSTEMD_UNIT_COUNT=${values.FANMIND_SYSTEMD_UNIT_COUNT}`,
    `BACKUP_ROOT=${values.BACKUP_ROOT}`,
    `BACKUP_COMPLETE_PAIR_COUNT=${values.BACKUP_COMPLETE_PAIR_COUNT}`,
    `BACKUP_ORPHAN_PAIR_COUNT=${values.BACKUP_ORPHAN_PAIR_COUNT}`,
    ...backups,
    "LATEST_FULL_BACKUP=fanmind-full-redacted.tar.gz.age",
    `BACKUP_VERIFY_OK=${values.BACKUP_VERIFY_OK}`,
    `BACKUP_VERIFY_MODE=${values.BACKUP_VERIFY_MODE}`,
    `BACKUP_VERIFY_TYPE=${values.BACKUP_VERIFY_TYPE}`,
    "BACKUP_VERIFY_ARTIFACT=fanmind-full-redacted.tar.gz.age",
    `BACKUP_VERIFY_SIZE_BYTES=${values.BACKUP_VERIFY_SIZE_BYTES}`,
    `OFFSITE_ENABLED=${values.OFFSITE_ENABLED}`,
    `OFFSITE_STATUS=${values.OFFSITE_STATUS}`,
    "OFFSITE_RELEVANT_OBJECT_COUNT=76",
    `OFFSITE_COMPLETE_PAIR_COUNT=${values.OFFSITE_COMPLETE_PAIR_COUNT}`,
    `OFFSITE_ORPHAN_PAIR_COUNT=${values.OFFSITE_ORPHAN_PAIR_COUNT}`,
    `OFFSITE_LATEST_FULL=${values.OFFSITE_LATEST_FULL}`,
    `BACKUP_WORKER_STRUCTURED_EVENT_COUNT=${values.BACKUP_WORKER_STRUCTURED_EVENT_COUNT}`,
    `BACKUP_WORKER_24H_FAILURE_EVENT_COUNT=${values.BACKUP_WORKER_24H_FAILURE_EVENT_COUNT}`,
    `BACKUP_WORKER_24H_FAILURE_FREE=${values.BACKUP_WORKER_24H_FAILURE_FREE}`,
    `AUDIT_RESULT=${values.AUDIT_RESULT}`,
    "",
  ].join("\n");
}

test("production audit is valid bash", async () => {
  await execFileAsync("bash", ["-n", auditScriptPath]);
});

test("production audit exposes only read-only runtime and backup checks", async () => {
  const source = await readAuditScript();

  assert.match(source, /^#!\/usr\/bin\/env bash\nset -euo pipefail/u);
  assert.match(source, /verify-backup-artifact\.mjs/u);
  assert.match(source, /--artifact "\$latest_full" --json/u);
  assert.match(source, /BACKUP_VERIFY_MODE/u);
  assert.match(source, /BACKUP_VERIFY_TYPE/u);
  assert.match(
    source,
    /sudo -n "\$rclone_bin" --config "\$config" lsf "\$\{remote\}:\$\{remote_path\}" --files-only --recursive/u,
  );
  assert.match(source, /journalctl -u fanmind-backup-worker\.service/u);
  assert.match(source, /pm2 jlist \| PM2_APP_NAME="\$PM2_APP_NAME" node -e/u);
  assert.match(source, /read_config_value\(\)/u);
  assert.match(source, /LIVE_RUNTIME_ENVIRONMENT/u);

  assert.doesNotMatch(source, /--identity\b/u);
  assert.doesNotMatch(source, /\bage\s+(?:--decrypt|-d)\b/u);
  assert.doesNotMatch(source, /\bpg_restore\b|\bpsql\b/u);
  assert.doesNotMatch(
    source,
    /\brclone\s+(?:copy|copyto|sync|move|moveto|delete|deletefile|purge)\b/u,
  );
  assert.doesNotMatch(
    source,
    /\bsystemctl\s+(?:start|restart|stop|enable|disable|daemon-reload|mask|unmask)\b/u,
  );
  assert.doesNotMatch(
    source,
    /\bpm2\s+(?:start|restart|reload|stop|delete|save|startup|unstartup)\b/u,
  );
  assert.doesNotMatch(source, /\bgit\s+(?:reset|checkout|pull|push|clean)\b/u);
  assert.doesNotMatch(source, /curl[^\n]*\s-X\s*(?:POST|PUT|PATCH|DELETE)\b/iu);
  assert.doesNotMatch(source, /\bsource\s+["']?\$?env_file\b/u);
  assert.doesNotMatch(source, /\bcat\s+[^\n]*worker\.env/u);
  assert.doesNotMatch(source, /sudo\s+-n\s+bash\b/u);
  assert.doesNotMatch(source, /BACKUP_VERIFY_CHECKSUM/u);
});

test("production audit output verifier accepts one complete redacted pass", () => {
  const result = verifyProductionAuditOutput(
    validAuditOutput(),
    expectedCommit,
  );

  assert.equal(result.releaseCommit, expectedCommit);
  assert.equal(result.healthComponentCount, 8);
  assert.equal(result.pm2Restarts, 12);
  assert.equal(result.backupCompletePairCount, 7);
  assert.equal(result.offsiteCompletePairCount, 38);
});

test("production audit output verifier fails closed on drift and degraded safeguards", () => {
  assert.throws(
    () =>
      verifyProductionAuditOutput(
        validAuditOutput({ LIVE_RELEASE: "b".repeat(40) }),
        expectedCommit,
      ),
    /production_audit_release_drift/u,
  );
  assert.throws(
    () =>
      verifyProductionAuditOutput(
        validAuditOutput({ LIVE_RUNTIME_ENVIRONMENT: "staging" }),
        expectedCommit,
      ),
    /production_audit_runtime_environment_invalid/u,
  );
  assert.throws(
    () =>
      verifyProductionAuditOutput(
        validAuditOutput({ OFFSITE_ORPHAN_PAIR_COUNT: "1" }),
        expectedCommit,
      ),
    /production_audit_offsite_orphans_present/u,
  );
  assert.throws(
    () =>
      verifyProductionAuditOutput(
        validAuditOutput({ BACKUP_WORKER_24H_FAILURE_EVENT_COUNT: "1" }),
        expectedCommit,
      ),
    /production_audit_backup_worker_failures_present/u,
  );
});

test("permanent Production audit runs installed root-owned code only", async () => {
  const [workflow, deploy, manifest, runbook] = await Promise.all([
    readFile(".github/workflows/production-readonly-audit.yml", "utf8"),
    readFile(".github/workflows/deploy-fanmind.yml", "utf8"),
    readFile("package.json", "utf8"),
    readFile("docs/operations/READ_ONLY_PRODUCTION_AUDIT.md", "utf8"),
  ]);

  assert.match(workflow, /workflow_run:[\s\S]*Deploy FanMind/u);
  assert.match(workflow, /schedule:[\s\S]*17 4 \* \* \*/u);
  assert.match(workflow, /github\.ref == 'refs\/heads\/main'/u);
  assert.match(workflow, /run-read-only-production-audit/u);
  assert.match(workflow, /runs-on: \[self-hosted, fanmind-prod, exoscale, linux, x64\]/u);
  assert.match(workflow, /environment: production/u);
  assert.match(
    workflow,
    /^\s+\/usr\/local\/lib\/fanmind-ops\/read-only-production-audit\.sh \\/mu,
  );
  assert.match(
    workflow,
    /\/usr\/local\/lib\/fanmind-ops\/verify-production-audit-output\.mjs/u,
  );
  assert.match(workflow, /trap 'rm -f "\$AUDIT_OUTPUT"' EXIT/u);
  assert.doesNotMatch(workflow, /actions\/checkout|upload-artifact/u);
  assert.doesNotMatch(
    workflow,
    /sudo -n \/usr\/local\/lib\/fanmind-ops\/read-only-production-audit\.sh/u,
  );

  assert.match(
    deploy,
    /sudo install -o root -g root -m 0755 scripts\/operations\/read-only-production-audit\.sh \/usr\/local\/lib\/fanmind-ops\/read-only-production-audit\.sh/u,
  );
  assert.match(
    deploy,
    /sudo install -o root -g root -m 0755 scripts\/operations\/verify-production-audit-output\.mjs \/usr\/local\/lib\/fanmind-ops\/verify-production-audit-output\.mjs/u,
  );
  assert.match(deploy, /scripts\/public-health-policy\.mjs \/usr\/local\/lib\/public-health-policy\.mjs/u);

  const parsed = JSON.parse(manifest);
  assert.equal(
    parsed.scripts["production:audit:verify"],
    "node scripts/operations/verify-production-audit-output.mjs",
  );
  assert.match(runbook, /checkt keinen Repository-Code aus/u);
  assert.match(runbook, /kein Audit-Artefakt hochgeladen/u);
});

test("production audit uses stable timer properties instead of localized timer columns", async () => {
  const source = await readAuditScript();

  assert.match(source, /systemctl show "\$unit" --property=NextElapseUSecRealtime --value/u);
  assert.match(source, /systemctl show "\$unit" --property=NextElapseUSecMonotonic --value/u);
  assert.match(source, /systemctl show "\$unit" --property=LastTriggerUSec --value/u);
  assert.match(
    source,
    /SYSTEMD_TIMER=%s\|next_realtime=%s\|next_monotonic=%s\|last=%s/u,
  );
  assert.doesNotMatch(source, /systemctl list-timers/u);
});

test("production audit reports backup worker events by bounded time window without raw failures", async () => {
  const source = await readAuditScript();

  assert.match(source, /\{ name: '24h', since:/u);
  assert.match(source, /\{ name: '14d', since:/u);
  assert.match(source, /BACKUP_WORKER_WINDOW=\$\{window\.name\}/u);
  assert.match(source, /BACKUP_WORKER_EVENT=\$\{window\.name\}\|\$\{event\}:/u);
  assert.match(source, /BACKUP_WORKER_24H_FAILURE_EVENT_COUNT/u);
  assert.match(source, /BACKUP_WORKER_24H_FAILURE_FREE/u);

  assert.doesNotMatch(source, /payload\.job_id/u);
  assert.doesNotMatch(source, /payload\.error/u);
  assert.doesNotMatch(source, /error_message/u);
});

test("production audit never logs backup configuration values or raw PM2 payloads", async () => {
  const source = await readAuditScript();

  assert.match(source, /OFFSITE_ENABLED/u);
  assert.match(source, /OFFSITE_STATUS/u);
  assert.match(source, /OFFSITE_COMPLETE_PAIR_COUNT/u);
  assert.match(source, /BACKUP_WORKER_EVENT/u);

  assert.doesNotMatch(source, /echo\s+.*FANMIND_BACKUP_RCLONE_REMOTE/u);
  assert.doesNotMatch(source, /echo\s+.*SUPABASE_SERVICE_ROLE_KEY/u);
  assert.doesNotMatch(source, /echo\s+.*DATABASE_URL/u);
  assert.doesNotMatch(source, /console\.log\([^\n]*JSON\.stringify\(rows/u);
  assert.doesNotMatch(source, /console\.log\([^\n]*processRow\.pm2_env/u);
});
