import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const monitor = await import("../scripts/operations/operations-monitor.mjs");
const source = await readFile(new URL("../scripts/operations/operations-monitor.mjs", import.meta.url), "utf8");
const service = await readFile(new URL("../ops/systemd/fanmind-operations-monitor.service", import.meta.url), "utf8");
const timer = await readFile(new URL("../ops/systemd/fanmind-operations-monitor.timer", import.meta.url), "utf8");
const migration = await readFile(new URL("../supabase/migrations/20260718190000_operations_monitor_components.sql", import.meta.url), "utf8");

test("operations monitor remains disabled unless explicitly enabled", () => {
  assert.equal(monitor.monitorEnabled({}), false);
  assert.equal(monitor.monitorEnabled({ FANMIND_OPERATIONS_MONITOR_ENABLED: "false" }), false);
  assert.equal(monitor.monitorEnabled({ FANMIND_OPERATIONS_MONITOR_ENABLED: "true" }), true);
});

test("disk and memory thresholds distinguish normal, warning and critical states", () => {
  assert.deepEqual(monitor.classifyPercent(50, 80, 90), { status: "healthy", severity: "info" });
  assert.deepEqual(monitor.classifyPercent(85, 80, 90), { status: "degraded", severity: "warning" });
  assert.deepEqual(monitor.classifyPercent(95, 80, 90), { status: "unavailable", severity: "critical" });
});

test("SSL and backup-age thresholds escalate only at configured boundaries", () => {
  assert.deepEqual(monitor.classifyRemainingDays(45, 30, 7), { status: "healthy", severity: "info" });
  assert.deepEqual(monitor.classifyRemainingDays(20, 30, 7), { status: "degraded", severity: "warning" });
  assert.deepEqual(monitor.classifyRemainingDays(3, 30, 7), { status: "unavailable", severity: "critical" });
  assert.deepEqual(monitor.classifyAgeHours(12, 36), { status: "healthy", severity: "info" });
  assert.deepEqual(monitor.classifyAgeHours(40, 36), { status: "degraded", severity: "warning" });
  assert.deepEqual(monitor.classifyAgeHours(80, 36), { status: "unavailable", severity: "critical" });
});

test("backup freshness reports all required backup types without file paths", () => {
  const now = Date.parse("2026-07-18T12:00:00.000Z");
  const rows = [
    { backup_type: "database", finished_at: "2026-07-18T06:00:00.000Z" },
    { backup_type: "storage", finished_at: "2026-07-18T05:00:00.000Z" },
    { backup_type: "server_config", finished_at: "2026-07-18T04:00:00.000Z" },
    { backup_type: "full", finished_at: "2026-07-15T12:00:00.000Z" },
  ];
  const result = monitor.classifyBackupFreshness(rows, now, {});
  assert.equal(result.status, "healthy");
  assert.match(result.summary, /database/);
  assert.match(result.summary, /storage/);
  assert.match(result.summary, /server_config/);
  assert.match(result.summary, /full/);
  assert.doesNotMatch(result.summary, /\/var\/|storage_reference|checksum_reference/);
});

test("notification transition opens once, escalates, resolves and avoids duplicate email storms", () => {
  assert.deepEqual(
    monitor.notificationTransition({ previousStatus: "healthy", currentStatus: "degraded", hasActiveNotification: false }),
    { event: "degraded", notification: "open", sendEmail: false },
  );
  assert.deepEqual(
    monitor.notificationTransition({ previousStatus: "degraded", currentStatus: "degraded", hasActiveNotification: true, activeSeverity: "warning" }),
    { event: "steady", notification: "none", sendEmail: false },
  );
  assert.deepEqual(
    monitor.notificationTransition({ previousStatus: "degraded", currentStatus: "unavailable", hasActiveNotification: true, activeSeverity: "warning" }),
    { event: "escalated", notification: "reopen", sendEmail: true },
  );
  assert.deepEqual(
    monitor.notificationTransition({ previousStatus: "unavailable", currentStatus: "healthy", hasActiveNotification: true, activeSeverity: "critical" }),
    { event: "recovered", notification: "resolve", sendEmail: true },
  );
});

test("operations email is fail-closed and recipients are validated", () => {
  assert.deepEqual(monitor.operationsEmailConfig({}), { enabled: false, reason: "disabled", recipients: [] });
  const incomplete = monitor.operationsEmailConfig({ FANMIND_OPERATIONS_EMAIL_ENABLED: "true", FANMIND_ADMIN_EMAILS: "admin@example.com" });
  assert.equal(incomplete.enabled, false);
  assert.equal(incomplete.reason, "incomplete");
  const configured = monitor.operationsEmailConfig({
    FANMIND_OPERATIONS_EMAIL_ENABLED: "true",
    FANMIND_ADMIN_EMAILS: "Admin@Example.com,invalid,admin@example.com,second@example.com",
    RESEND_API_KEY: "test-only",
    FANMIND_NOTIFICATION_FROM: "FanMind <noreply@fanmind.ch>",
  });
  assert.equal(configured.enabled, true);
  assert.deepEqual(configured.recipients, ["admin@example.com", "second@example.com"]);
});

test("PM2 parsing accepts only the configured online app", () => {
  const online = monitor.parsePm2Status(JSON.stringify([{ name: "fanmind", pm2_env: { status: "online" } }]));
  assert.deepEqual(online, { status: "healthy", processStatus: "online" });
  const stopped = monitor.parsePm2Status(JSON.stringify([{ name: "fanmind", pm2_env: { status: "stopped" } }]));
  assert.deepEqual(stopped, { status: "unavailable", processStatus: "stopped" });
  assert.deepEqual(monitor.parsePm2Status("invalid"), { status: "unknown", processStatus: "unreadable" });
});

test("monitor source never reads customer content tables or logs environment values", () => {
  assert.doesNotMatch(source, /rest\(["'](?:contacts|messages|contact_memories|ai_generations|workspace_members)/);
  assert.doesNotMatch(source, /console\.log\([^\n]*(?:process\.env|RESEND_API_KEY|SUPABASE_SERVICE_ROLE_KEY)/);
  assert.match(source, /metadata: \{ component:/);
  assert.match(source, /Operations Center: https:\/\/fanmind\.ch\/admin\/operations/);
});

test("systemd monitor is hardened and timer stays opt-in", () => {
  assert.match(service, /User=ubuntu/);
  assert.match(service, /NoNewPrivileges=true/);
  assert.match(service, /PrivateTmp=true/);
  assert.match(service, /ProtectSystem=strict/);
  assert.match(service, /ProtectHome=read-only/);
  assert.match(service, /RestrictAddressFamilies=AF_UNIX AF_INET AF_INET6/);
  assert.match(timer, /OnUnitActiveSec=10min/);
  assert.doesNotMatch(service, /FANMIND_OPERATIONS_MONITOR_ENABLED=true/);
});

test("migration allows only metadata components and keeps monitor notifications indexed", () => {
  for (const component of ["host_disk", "host_memory", "ssl_certificate", "backup_freshness", "operations_monitor"]) {
    assert.match(migration, new RegExp(`'${component}'`));
  }
  assert.match(migration, /admin_notifications_active_monitor_idx/);
  assert.doesNotMatch(migration, /(?:alter|insert|update|delete)\s+(?:table\s+)?public\.(?:contacts|messages|contact_memories|ai_generations|workspace_members)/i);
});
