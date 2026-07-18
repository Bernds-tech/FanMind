#!/usr/bin/env node
import { statfs } from "node:fs/promises";
import { freemem, totalmem, uptime } from "node:os";
import { spawn } from "node:child_process";
import tls from "node:tls";
import { pathToFileURL } from "node:url";

const VERSION = "fanmind-operations-monitor-1";
const SOURCE = "operations_monitor";
const ACTIVE_NOTIFICATION_STATUSES = "open,read,acknowledged";
const STATUS_RANK = { healthy: 0, unknown: 1, degraded: 2, unavailable: 3 };
const COMPONENT_LABELS = {
  application: "FanMind-Anwendung",
  pm2: "FanMind-Prozess",
  host_disk: "Server-Speicherplatz",
  host_memory: "Server-Arbeitsspeicher",
  ssl_certificate: "TLS-Zertifikat",
  backup_freshness: "Backup-Aktualität",
  backup_worker: "Backup-Worker",
};

function log(level, event, meta = {}) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), level, event, version: VERSION, ...redact(meta) }));
}

function redact(value) {
  return JSON.parse(JSON.stringify(value, (key, item) =>
    /key|secret|password|token|authorization|cookie|content|message_body|prompt/i.test(key)
      ? "[redacted]"
      : item,
  ));
}

function monitorEnabled(env = process.env) {
  return env.FANMIND_OPERATIONS_MONITOR_ENABLED === "true";
}

function positiveNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function clampText(value, max = 500) {
  return String(value ?? "").replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function statusSeverity(status) {
  if (status === "unavailable") return "critical";
  if (status === "degraded" || status === "unknown") return "warning";
  return "info";
}

function classifyPercent(value, warning, critical) {
  if (!Number.isFinite(value)) return { status: "unknown", severity: "warning" };
  if (value >= critical) return { status: "unavailable", severity: "critical" };
  if (value >= warning) return { status: "degraded", severity: "warning" };
  return { status: "healthy", severity: "info" };
}

function classifyRemainingDays(days, warningDays, criticalDays) {
  if (!Number.isFinite(days)) return { status: "unknown", severity: "warning" };
  if (days <= criticalDays) return { status: "unavailable", severity: "critical" };
  if (days <= warningDays) return { status: "degraded", severity: "warning" };
  return { status: "healthy", severity: "info" };
}

function classifyAgeHours(ageHours, maximumHours) {
  if (!Number.isFinite(ageHours) || ageHours < 0) return { status: "unknown", severity: "warning" };
  if (ageHours > maximumHours * 2) return { status: "unavailable", severity: "critical" };
  if (ageHours > maximumHours) return { status: "degraded", severity: "warning" };
  return { status: "healthy", severity: "info" };
}

function notificationTransition({ previousStatus, currentStatus, hasActiveNotification, activeSeverity }) {
  const previous = previousStatus ?? "unknown";
  const currentRank = STATUS_RANK[currentStatus] ?? STATUS_RANK.unknown;
  const previousRank = STATUS_RANK[previous] ?? STATUS_RANK.unknown;
  if (currentStatus === "healthy") {
    return {
      event: previous !== "healthy" ? "recovered" : "steady",
      notification: hasActiveNotification ? "resolve" : "none",
      sendEmail: hasActiveNotification && activeSeverity === "critical",
    };
  }
  if (!hasActiveNotification) {
    return {
      event: "degraded",
      notification: "open",
      sendEmail: currentStatus === "unavailable",
    };
  }
  if (currentRank > previousRank || (currentStatus === "unavailable" && activeSeverity !== "critical")) {
    return {
      event: "escalated",
      notification: "reopen",
      sendEmail: currentStatus === "unavailable",
    };
  }
  return { event: "steady", notification: "none", sendEmail: false };
}

function adminEmailRecipients(env = process.env) {
  const values = String(env.FANMIND_ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
  return [...new Set(values)].slice(0, 20);
}

function operationsEmailConfig(env = process.env) {
  if (env.FANMIND_OPERATIONS_EMAIL_ENABLED !== "true") {
    return { enabled: false, reason: "disabled", recipients: [] };
  }
  const recipients = adminEmailRecipients(env);
  if (!env.RESEND_API_KEY || recipients.length === 0) {
    return { enabled: false, reason: "incomplete", recipients };
  }
  return {
    enabled: true,
    reason: null,
    recipients,
    from: env.FANMIND_NOTIFICATION_FROM || "FanMind <noreply@fanmind.ch>",
  };
}

function supabaseConfig(env = process.env) {
  const url = String(env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("operations_monitor_supabase_config_missing");
  return { url, key };
}

function restHeaders(env = process.env, extra = {}) {
  const { key } = supabaseConfig(env);
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
    ...extra,
  };
}

async function rest(table, query = "", init = {}, env = process.env) {
  const { url } = supabaseConfig(env);
  const response = await fetch(`${url}/rest/v1/${table}${query}`, {
    ...init,
    headers: restHeaders(env, init.headers ?? {}),
    cache: "no-store",
    signal: init.signal ?? AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`operations_store_${response.status}`);
  if (response.status === 204) return null;
  return response.json();
}

function check(component, status, summary, metadata = {}) {
  return {
    component,
    status,
    severity: statusSeverity(status),
    summary: clampText(summary),
    checkedAt: new Date().toISOString(),
    metadata,
  };
}

async function checkApplication(env = process.env, fetchImpl = fetch) {
  const baseUrl = env.FANMIND_OPERATIONS_MONITOR_BASE_URL || "https://fanmind.ch";
  const started = Date.now();
  try {
    const response = await fetchImpl(`${baseUrl.replace(/\/$/, "")}/api/health`, {
      cache: "no-store",
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });
    const payload = await response.json().catch(() => null);
    const reported = payload?.status;
    const status = response.status === 200 && reported === "healthy"
      ? "healthy"
      : response.status >= 500
        ? "unavailable"
        : "degraded";
    return check(
      "application",
      status,
      status === "healthy" ? "FanMind antwortet normal." : `FanMind-Healthcheck meldet ${response.status}.`,
      { http_status: response.status, latency_ms: Date.now() - started },
    );
  } catch {
    return check("application", "unavailable", "FanMind-Healthcheck ist nicht erreichbar.", { latency_ms: Date.now() - started });
  }
}

async function checkDisk(env = process.env, statfsImpl = statfs) {
  try {
    const data = await statfsImpl(env.FANMIND_OPERATIONS_DISK_PATH || "/");
    const total = Number(data.blocks) * Number(data.bsize);
    const available = Number(data.bavail) * Number(data.bsize);
    const usedPercent = total > 0 ? ((total - available) / total) * 100 : Number.NaN;
    const warning = positiveNumber(env.FANMIND_OPERATIONS_DISK_WARNING_PERCENT, 80);
    const critical = positiveNumber(env.FANMIND_OPERATIONS_DISK_CRITICAL_PERCENT, 90);
    const state = classifyPercent(usedPercent, warning, critical);
    return check("host_disk", state.status, `Server-Speicherplatz ist zu ${usedPercent.toFixed(1)} % belegt.`, { used_percent: Number(usedPercent.toFixed(1)) });
  } catch {
    return check("host_disk", "unknown", "Server-Speicherplatz konnte nicht geprüft werden.");
  }
}

function checkMemory(env = process.env, memory = { total: totalmem(), free: freemem() }) {
  const usedPercent = memory.total > 0 ? ((memory.total - memory.free) / memory.total) * 100 : Number.NaN;
  const warning = positiveNumber(env.FANMIND_OPERATIONS_MEMORY_WARNING_PERCENT, 85);
  const critical = positiveNumber(env.FANMIND_OPERATIONS_MEMORY_CRITICAL_PERCENT, 95);
  const state = classifyPercent(usedPercent, warning, critical);
  return check("host_memory", state.status, `Server-Arbeitsspeicher ist zu ${usedPercent.toFixed(1)} % belegt.`, {
    used_percent: Number(usedPercent.toFixed(1)),
    host_uptime_seconds: Math.round(uptime()),
  });
}

function runCommand(command, args, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { shell: false, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("command_timeout"));
    }, timeoutMs);
    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", () => {});
    child.on("error", (error) => { clearTimeout(timer); reject(error); });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(stdout);
      else reject(new Error(`command_exit_${code}`));
    });
  });
}

function parsePm2Status(output, appName = "fanmind") {
  try {
    const rows = JSON.parse(output);
    const item = Array.isArray(rows) ? rows.find((row) => row?.name === appName) : null;
    if (!item) return { status: "unavailable", processStatus: "missing" };
    const processStatus = String(item?.pm2_env?.status ?? "unknown");
    return { status: processStatus === "online" ? "healthy" : "unavailable", processStatus };
  } catch {
    return { status: "unknown", processStatus: "unreadable" };
  }
}

async function checkPm2(env = process.env, commandRunner = runCommand) {
  try {
    const output = await commandRunner(env.FANMIND_PM2_BIN || "pm2", ["jlist"]);
    const parsed = parsePm2Status(output, env.FANMIND_PM2_APP_NAME || "fanmind");
    return check("pm2", parsed.status, parsed.status === "healthy" ? "FanMind-Prozess ist online." : `FanMind-Prozessstatus: ${parsed.processStatus}.`, { process_status: parsed.processStatus });
  } catch {
    return check("pm2", "unavailable", "FanMind-Prozessstatus konnte nicht gelesen werden.");
  }
}

function tlsCertificate(hostname, port = 443, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const socket = tls.connect({ host: hostname, port, servername: hostname, rejectUnauthorized: true });
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error("tls_timeout"));
    }, timeoutMs);
    socket.once("secureConnect", () => {
      clearTimeout(timer);
      const certificate = socket.getPeerCertificate();
      socket.end();
      resolve(certificate);
    });
    socket.once("error", (error) => { clearTimeout(timer); reject(error); });
  });
}

async function checkSsl(env = process.env, certificateLoader = tlsCertificate) {
  const baseUrl = new URL(env.FANMIND_OPERATIONS_MONITOR_BASE_URL || "https://fanmind.ch");
  try {
    const certificate = await certificateLoader(baseUrl.hostname, Number(baseUrl.port || 443));
    const expiresAt = new Date(certificate.valid_to);
    const days = (expiresAt.getTime() - Date.now()) / 86400000;
    const warningDays = positiveNumber(env.FANMIND_OPERATIONS_SSL_WARNING_DAYS, 30);
    const criticalDays = positiveNumber(env.FANMIND_OPERATIONS_SSL_CRITICAL_DAYS, 7);
    const state = classifyRemainingDays(days, warningDays, criticalDays);
    return check("ssl_certificate", state.status, `TLS-Zertifikat ist noch ${Math.floor(days)} Tage gültig.`, { days_remaining: Math.floor(days), expires_at: expiresAt.toISOString() });
  } catch {
    return check("ssl_certificate", "unavailable", "TLS-Zertifikat konnte nicht validiert werden.");
  }
}

function latestRowsByType(rows) {
  const latest = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    if (!latest.has(row.backup_type)) latest.set(row.backup_type, row);
  }
  return latest;
}

function classifyBackupFreshness(rows, now = Date.now(), env = process.env) {
  const latest = latestRowsByType(rows);
  const limits = {
    database: positiveNumber(env.FANMIND_OPERATIONS_DATABASE_BACKUP_MAX_HOURS, 36),
    storage: positiveNumber(env.FANMIND_OPERATIONS_STORAGE_BACKUP_MAX_HOURS, 36),
    server_config: positiveNumber(env.FANMIND_OPERATIONS_CONFIG_BACKUP_MAX_HOURS, 36),
    full: positiveNumber(env.FANMIND_OPERATIONS_FULL_BACKUP_MAX_HOURS, 192),
  };
  const details = [];
  let worst = "healthy";
  for (const [type, maximumHours] of Object.entries(limits)) {
    const row = latest.get(type);
    if (!row) {
      details.push(`${type}: fehlt`);
      worst = STATUS_RANK.degraded > STATUS_RANK[worst] ? "degraded" : worst;
      continue;
    }
    const timestamp = Date.parse(row.finished_at || row.started_at || row.created_at || "");
    const ageHours = (now - timestamp) / 3600000;
    const state = classifyAgeHours(ageHours, maximumHours);
    if (STATUS_RANK[state.status] > STATUS_RANK[worst]) worst = state.status;
    details.push(`${type}: ${Math.max(0, Math.floor(ageHours))} h`);
  }
  return check("backup_freshness", worst, `Backup-Alter: ${details.join(" · ")}.`, { checked_types: Object.keys(limits) });
}

async function checkBackupFreshness(env = process.env) {
  try {
    const rows = await rest(
      "backup_runs",
      "?select=backup_type,status,started_at,finished_at,created_at&backup_type=in.(database,storage,server_config,full)&status=in.(succeeded,offsite_pending,degraded,completed)&order=started_at.desc&limit=100",
      {},
      env,
    );
    return classifyBackupFreshness(rows, Date.now(), env);
  } catch {
    return check("backup_freshness", "unknown", "Backup-Aktualität konnte nicht geprüft werden.");
  }
}

async function checkBackupWorker(env = process.env) {
  try {
    const rows = await rest("system_health_events", "?select=created_at,status&component=eq.backup_worker&order=created_at.desc&limit=1", {}, env);
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) return check("backup_worker", "degraded", "Noch kein Backup-Worker-Heartbeat vorhanden.");
    const ageMinutes = (Date.now() - Date.parse(row.created_at)) / 60000;
    const warning = positiveNumber(env.FANMIND_OPERATIONS_BACKUP_WORKER_WARNING_MINUTES, 20);
    const critical = positiveNumber(env.FANMIND_OPERATIONS_BACKUP_WORKER_CRITICAL_MINUTES, 60);
    const status = ageMinutes > critical ? "unavailable" : ageMinutes > warning ? "degraded" : "healthy";
    return check("backup_worker", status, `Letzter Backup-Worker-Heartbeat vor ${Math.max(0, Math.floor(ageMinutes))} Minuten.`, { age_minutes: Math.max(0, Math.floor(ageMinutes)) });
  } catch {
    return check("backup_worker", "unknown", "Backup-Worker-Heartbeat konnte nicht geprüft werden.");
  }
}

async function collectChecks(env = process.env) {
  return Promise.all([
    checkApplication(env),
    checkDisk(env),
    Promise.resolve(checkMemory(env)),
    checkPm2(env),
    checkSsl(env),
    checkBackupFreshness(env),
    checkBackupWorker(env),
  ]);
}

async function latestEvents(components, env = process.env) {
  const encoded = components.map((value) => value.replace(/[^a-z0-9_]/g, "")).join(",");
  const rows = await rest("system_health_events", `?select=component,status,created_at&component=in.(${encoded})&order=created_at.desc&limit=200`, {}, env);
  const result = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    if (!result.has(row.component)) result.set(row.component, row);
  }
  return result;
}

async function activeNotification(component, env = process.env) {
  const reference = `monitor:${component}`;
  const rows = await rest(
    "admin_notifications",
    `?select=id,severity,status,created_at&source=eq.${SOURCE}&technical_reference=eq.${encodeURIComponent(reference)}&status=in.(${ACTIVE_NOTIFICATION_STATUSES})&order=created_at.desc&limit=1`,
    {},
    env,
  );
  return Array.isArray(rows) ? rows[0] ?? null : null;
}

function notificationCopy(checkResult, recovered = false) {
  const label = COMPONENT_LABELS[checkResult.component] || checkResult.component;
  if (recovered) {
    return {
      category: "resolved",
      severity: "resolved",
      title: clampText(`Entwarnung: ${label}`, 160),
      message: clampText(`${label} ist wieder im Normalbereich.`, 1200),
    };
  }
  return {
    category: checkResult.severity,
    severity: checkResult.severity,
    title: clampText(checkResult.status === "unavailable" ? `${label} kritisch` : `${label} prüfen`, 160),
    message: clampText(checkResult.summary, 1200),
  };
}

async function sendOperationsEmail(checkResult, recovered, env = process.env) {
  const config = operationsEmailConfig(env);
  if (!config.enabled) return { sent: false, reason: config.reason };
  const copy = notificationCopy(checkResult, recovered);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.from,
      to: config.recipients,
      subject: `[FanMind Betrieb] ${copy.title}`,
      text: [copy.title, "", copy.message, "", `Zeitpunkt: ${checkResult.checkedAt}`, "Operations Center: https://fanmind.ch/admin/operations"].join("\n"),
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`operations_email_${response.status}`);
  return { sent: true, reason: null };
}

async function insertEvent(checkResult, env = process.env) {
  await rest("system_health_events", "", {
    method: "POST",
    body: JSON.stringify({
      component: checkResult.component,
      status: checkResult.status,
      severity: checkResult.severity,
      summary: checkResult.summary,
      checked_at: checkResult.checkedAt,
      technical_reference: `monitor:${checkResult.component}`,
      metadata: checkResult.metadata,
    }),
  }, env);
}

async function syncCheck(checkResult, previousEvent, env = process.env) {
  const active = await activeNotification(checkResult.component, env);
  const plan = notificationTransition({
    previousStatus: previousEvent?.status,
    currentStatus: checkResult.status,
    hasActiveNotification: Boolean(active),
    activeSeverity: active?.severity,
  });
  const repeatHours = positiveNumber(env.FANMIND_OPERATIONS_HEALTH_EVENT_REPEAT_HOURS, 6);
  const previousAgeHours = previousEvent ? (Date.now() - Date.parse(previousEvent.created_at)) / 3600000 : Number.POSITIVE_INFINITY;
  if (!previousEvent || previousEvent.status !== checkResult.status || previousAgeHours >= repeatHours) {
    await insertEvent(checkResult, env);
  }

  const reference = `monitor:${checkResult.component}`;
  if (plan.notification === "open") {
    const copy = notificationCopy(checkResult);
    await rest("admin_notifications", "", {
      method: "POST",
      body: JSON.stringify({ ...copy, status: "open", source: SOURCE, technical_reference: reference, metadata: { component: checkResult.component, status: checkResult.status } }),
    }, env);
  } else if (plan.notification === "reopen" && active) {
    const copy = notificationCopy(checkResult);
    await rest("admin_notifications", `?id=eq.${encodeURIComponent(active.id)}`, {
      method: "PATCH",
      body: JSON.stringify({ ...copy, status: "open", read_at: null, read_by_user_id: null, acknowledged_at: null, acknowledged_by_user_id: null, resolved_at: null, metadata: { component: checkResult.component, status: checkResult.status } }),
    }, env);
  } else if (plan.notification === "resolve" && active) {
    const copy = notificationCopy(checkResult, true);
    await rest("admin_notifications", `?id=eq.${encodeURIComponent(active.id)}`, {
      method: "PATCH",
      body: JSON.stringify({ ...copy, status: "resolved", resolved_at: new Date().toISOString(), metadata: { component: checkResult.component, status: "healthy" } }),
    }, env);
  }

  if (plan.sendEmail) {
    try {
      const result = await sendOperationsEmail(checkResult, plan.notification === "resolve", env);
      await rest("operations_audit_log", "", {
        method: "POST",
        body: JSON.stringify({
          action: "operations_monitor_email",
          target_table: "admin_notifications",
          severity: checkResult.severity,
          outcome: result.sent ? "success" : "noop",
          technical_reference: reference,
          metadata: { component: checkResult.component, reason: result.reason },
        }),
      }, env).catch(() => {});
    } catch (error) {
      await rest("operations_audit_log", "", {
        method: "POST",
        body: JSON.stringify({ action: "operations_monitor_email", target_table: "admin_notifications", severity: "warning", outcome: "failure", technical_reference: reference, metadata: { component: checkResult.component, error_code: clampText(error?.message, 80) } }),
      }, env).catch(() => {});
    }
  }
  return plan;
}

async function runMonitor(env = process.env) {
  if (!monitorEnabled(env)) {
    log("info", "monitor_disabled");
    return { enabled: false, checks: [] };
  }
  supabaseConfig(env);
  const checks = await collectChecks(env);
  const previous = await latestEvents(checks.map((item) => item.component), env);
  const results = [];
  for (const item of checks) {
    const plan = await syncCheck(item, previous.get(item.component), env);
    results.push({ component: item.component, status: item.status, action: plan.notification });
  }
  log("info", "monitor_completed", { results });
  return { enabled: true, checks: results };
}

const direct = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (direct) {
  runMonitor().catch((error) => {
    log("error", "monitor_failed", { error_code: clampText(error?.message, 120) });
    process.exitCode = 1;
  });
}

export {
  adminEmailRecipients,
  checkMemory,
  classifyAgeHours,
  classifyBackupFreshness,
  classifyPercent,
  classifyRemainingDays,
  monitorEnabled,
  notificationTransition,
  operationsEmailConfig,
  parsePm2Status,
  runMonitor,
};
