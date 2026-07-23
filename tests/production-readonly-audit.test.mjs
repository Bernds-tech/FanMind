import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import test from "node:test";
import { readFile } from "node:fs/promises";

const auditScriptPath = "scripts/operations/read-only-production-audit.sh";
const execFileAsync = promisify(execFile);

async function readAuditScript() {
  return readFile(auditScriptPath, "utf8");
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

test("production audit uses stable timer properties instead of localized timer columns", async () => {
  const source = await readAuditScript();

  assert.match(source, /systemctl show "\$unit" --property=NextElapseUSecRealtime --value/u);
  assert.match(source, /systemctl show "\$unit" --property=LastTriggerUSec --value/u);
  assert.match(source, /SYSTEMD_TIMER=%s\|next=%s\|last=%s/u);
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
