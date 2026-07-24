#!/usr/bin/env node

import { appendFile, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const EXPECTED_RELEASE = process.env.EXPECTED_RELEASE || "";
const REPORT_PATH =
  process.argv[2] || "fanmind-controlled-reboot-readiness.txt";
const SOURCE_DIR = "/var/www/fanmind";
const RELEASE_DIR = `/var/www/fanmind-releases/${EXPECTED_RELEASE}`;
const CURRENT_LINK = "/var/www/fanmind-current";
const BACKUP_ROOT = "/var/backups/fanmind/";

function requireCondition(condition, code) {
  if (!condition) throw new Error(code);
}

function runText(binary, args, options = {}) {
  const result = spawnSync(binary, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: options.timeout ?? 30_000,
    env: options.env ?? process.env,
  });
  if (result.error || result.status !== 0) {
    if (options.allowFailure) return null;
    throw new Error(options.code || "command_failed");
  }
  return String(result.stdout || "").trim();
}

function sudoText(args, options = {}) {
  return runText("sudo", ["-n", ...args], options);
}

async function emit(key, value) {
  const line = `${key}=${value}`;
  process.stdout.write(`${line}\n`);
  await appendFile(REPORT_PATH, `${line}\n`, { mode: 0o600 });
}

function parseEnv(text) {
  const values = new Map();
  for (const rawLine of String(text).split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const split = line.indexOf("=");
    const key = line.slice(0, split).trim();
    let value = line.slice(split + 1).trim();
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

function required(config, name) {
  const value = config.get(name) || "";
  if (!value) throw new Error(`${name}_missing`);
  return value;
}

async function fetchJson(url, init = {}, attempts = 5) {
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...init,
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw new Error(`http_${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, 2_000));
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error("fetch_failed");
}

function unitCounts(pattern, type) {
  const unitFiles =
    runText(
      "systemctl",
      ["list-unit-files", `--type=${type}`, "--no-legend", pattern],
      { allowFailure: true },
    ) || "";
  const activeUnits =
    runText(
      "systemctl",
      ["list-units", `--type=${type}`, "--state=active", "--no-legend", pattern],
      { allowFailure: true },
    ) || "";
  const fileRows = unitFiles.split(/\r?\n/u).filter(Boolean);
  const activeRows = activeUnits.split(/\r?\n/u).filter(Boolean);
  return {
    total: fileRows.length,
    enabled: fileRows.filter((row) => /\s+enabled(?:\s|$)/u.test(row)).length,
    active: activeRows.length,
  };
}

function healthyPublicPayload(payload) {
  const checks = Array.isArray(payload?.checks) ? payload.checks : [];
  return (
    payload?.status === "healthy" &&
    checks.length >= 7 &&
    checks.every((check) => check?.status === "healthy")
  );
}

async function auditReleaseAndHealth() {
  const [version, health] = await Promise.all([
    fetchJson("https://fanmind.ch/api/version"),
    fetchJson("https://fanmind.ch/api/health"),
  ]);
  const liveMatches = version?.releaseCommit === EXPECTED_RELEASE;
  const serverHead = runText("git", ["-C", SOURCE_DIR, "rev-parse", "HEAD"]);
  const originMain = runText("git", [
    "-C",
    SOURCE_DIR,
    "rev-parse",
    "origin/main",
  ]);
  const serverMatches = serverHead === EXPECTED_RELEASE;
  const originMatches = originMain === EXPECTED_RELEASE;
  const healthReady = healthyPublicPayload(health);

  await emit("LIVE_RELEASE_MATCH", liveMatches ? "yes" : "no");
  await emit("SERVER_HEAD_MATCH", serverMatches ? "yes" : "no");
  await emit("ORIGIN_MAIN_MATCH", originMatches ? "yes" : "no");
  await emit("PUBLIC_HEALTH_READY", healthReady ? "yes" : "no");
  await emit(
    "PUBLIC_HEALTH_CHECK_COUNT",
    Array.isArray(health?.checks) ? health.checks.length : 0,
  );

  requireCondition(liveMatches, "live_release_mismatch");
  requireCondition(serverMatches, "server_head_mismatch");
  requireCondition(originMatches, "origin_main_mismatch");
  requireCondition(healthReady, "public_health_not_ready");
}

async function auditHostAndServices() {
  sudoText(["true"], { code: "passwordless_sudo_unavailable" });
  sudoText(["nginx", "-t"], { code: "nginx_configuration_invalid" });
  runText("systemctl", ["is-active", "--quiet", "nginx.service"], {
    code: "nginx_inactive",
  });
  runText(
    "systemctl",
    ["is-active", "--quiet", "fanmind-backup-worker.service"],
    { code: "backup_worker_inactive" },
  );

  const processes = runText("ps", ["-eo", "comm="])
    .split(/\r?\n/u)
    .map((value) => value.trim());
  const packageManagerProcessCount = processes.filter((name) =>
    ["apt", "apt-get", "dpkg", "unattended-upgr"].includes(name),
  ).length;

  runText("which", ["fuser"], { code: "fuser_missing" });
  const packageLocks = [
    "/var/lib/dpkg/lock-frontend",
    "/var/lib/dpkg/lock",
    "/var/lib/apt/lists/lock",
    "/var/cache/apt/archives/lock",
  ];
  const heldPackageLockCount = packageLocks.filter(
    (lockPath) =>
      sudoText(["fuser", lockPath], { allowFailure: true }) !== null,
  ).length;
  const aptDailyActive =
    runText(
      "systemctl",
      ["is-active", "--quiet", "apt-daily.service"],
      { allowFailure: true },
    ) !== null;
  const aptUpgradeActive =
    runText(
      "systemctl",
      ["is-active", "--quiet", "apt-daily-upgrade.service"],
      { allowFailure: true },
    ) !== null;
  const packageManagerBusy =
    heldPackageLockCount > 0 || aptDailyActive || aptUpgradeActive;
  await emit("PACKAGE_MANAGER_PROCESS_COUNT", packageManagerProcessCount);
  await emit("PACKAGE_MANAGER_HELD_LOCK_COUNT", heldPackageLockCount);
  await emit("APT_DAILY_ACTIVE", aptDailyActive ? "yes" : "no");
  await emit("APT_DAILY_UPGRADE_ACTIVE", aptUpgradeActive ? "yes" : "no");
  await emit("PACKAGE_MANAGER_ACTIVITY", packageManagerBusy ? "busy" : "idle");
  requireCondition(!packageManagerBusy, "package_manager_busy");

  const rebootRequired =
    sudoText(["test", "-f", "/run/reboot-required"], {
      allowFailure: true,
    }) !== null;
  let rebootPackageCount = 0;
  const packageText = sudoText(["cat", "/run/reboot-required.pkgs"], {
    allowFailure: true,
  });
  if (packageText) {
    rebootPackageCount = packageText
      .split(/\r?\n/u)
      .filter((line) => line.trim()).length;
  }
  await emit("REBOOT_REQUIRED", rebootRequired ? "yes" : "no");
  await emit("REBOOT_REQUIRED_PACKAGE_COUNT", rebootPackageCount);

  const cpuCount = Number(runText("nproc", []));
  const loadOne = Number((await readFile("/proc/loadavg", "utf8")).split(/\s+/u)[0]);
  const memInfo = await readFile("/proc/meminfo", "utf8");
  const availableKiB = Number(memInfo.match(/^MemAvailable:\s+(\d+)/mu)?.[1] || 0);
  const diskOutput = runText("df", ["-Pk", "/"])
    .split(/\r?\n/u)
    .filter(Boolean);
  const rootAvailableKiB = Number(diskOutput.at(-1)?.trim().split(/\s+/u)[3] || 0);
  requireCondition(Number.isFinite(cpuCount) && cpuCount >= 1, "cpu_invalid");
  requireCondition(
    Number.isFinite(loadOne) && loadOne <= Math.max(cpuCount * 4, 8),
    "load_too_high",
  );
  requireCondition(availableKiB >= 262_144, "memory_too_low");
  requireCondition(rootAvailableKiB >= 2_097_152, "disk_too_low");
  await emit("HOST_CAPACITY", "ready");

  const currentRelease = runText("readlink", ["-f", CURRENT_LINK]);
  requireCondition(currentRelease === RELEASE_DIR, "release_link_mismatch");
  await emit("CURRENT_RELEASE_LINK", "matching");

  const pm2List = JSON.parse(runText("pm2", ["jlist"]));
  const fanMindRows = pm2List.filter((item) => item?.name === "fanmind");
  requireCondition(fanMindRows.length === 1, "pm2_fanmind_count_invalid");
  const fanMind = fanMindRows[0];
  const pm2Status = String(fanMind?.pm2_env?.status || "");
  const pm2Cwd = String(fanMind?.pm2_env?.pm_cwd || "");
  const pm2Pid = Number(fanMind?.pid || 0);
  const pm2Restarts = Number(fanMind?.pm2_env?.restart_time);
  requireCondition(pm2Status === "online", "pm2_fanmind_not_online");
  requireCondition(pm2Cwd === RELEASE_DIR, "pm2_cwd_release_mismatch");
  requireCondition(pm2Pid > 0, "pm2_pid_missing");
  requireCondition(
    Number.isInteger(pm2Restarts) && pm2Restarts >= 0,
    "pm2_restart_count_invalid",
  );
  runText("test", ["-s", "/home/ubuntu/.pm2/dump.pm2"], {
    code: "pm2_dump_missing",
  });
  await emit("PM2_FANMIND_PROCESS_COUNT", 1);
  await emit("PM2_FANMIND_STATUS", "online");
  await emit("PM2_FANMIND_CWD_RELEASE", "matching");
  await emit("PM2_FANMIND_RESTART_COUNT", pm2Restarts);
  await emit("PM2_FANMIND_PID_PRESENT", "yes");
  await emit("PM2_DUMP", "present");

  const pm2Units = unitCounts("pm2-*.service", "service");
  const runnerUnits = unitCounts("actions.runner.*.service", "service");
  const timerUnits = unitCounts("fanmind-*.timer", "timer");
  await emit("PM2_STARTUP_UNIT_COUNT", pm2Units.total);
  await emit("PM2_STARTUP_ENABLED_COUNT", pm2Units.enabled);
  await emit("PM2_STARTUP_ACTIVE_COUNT", pm2Units.active);
  await emit("GITHUB_RUNNER_UNIT_COUNT", runnerUnits.total);
  await emit("GITHUB_RUNNER_STARTUP_ENABLED_COUNT", runnerUnits.enabled);
  await emit("GITHUB_RUNNER_ACTIVE_COUNT", runnerUnits.active);
  await emit("FANMIND_TIMER_UNIT_COUNT", timerUnits.total);
  await emit("FANMIND_TIMER_ENABLED_COUNT", timerUnits.enabled);
  await emit("FANMIND_TIMER_ACTIVE_COUNT", timerUnits.active);

  requireCondition(pm2Units.enabled >= 1, "pm2_startup_not_enabled");
  requireCondition(pm2Units.active >= 1, "pm2_startup_not_active");
  requireCondition(runnerUnits.enabled >= 1, "runner_startup_not_enabled");
  requireCondition(runnerUnits.active >= 1, "runner_not_active");
  requireCondition(timerUnits.total >= 8, "fanmind_timer_count_too_low");
  requireCondition(
    timerUnits.active >= timerUnits.enabled,
    "fanmind_enabled_timer_inactive",
  );

  const bootId = (await readFile("/proc/sys/kernel/random/boot_id", "utf8")).trim();
  requireCondition(/^[0-9a-f-]{36}$/u.test(bootId), "boot_id_invalid");
  await emit("BOOT_ID_PRESENT", "yes");
  await emit("NGINX_CONFIGURATION", "valid");
  await emit("NGINX_SERVICE", "active");
  await emit("BACKUP_WORKER_SERVICE", "active");
  await emit("HOST_REBOOT_READINESS", "ready");
}

async function auditBackups() {
  const workerEnv = sudoText(["cat", "/etc/fanmind-backup/worker.env"], {
    code: "backup_worker_env_unreadable",
  });
  const config = parseEnv(workerEnv);
  const base = required(config, "NEXT_PUBLIC_SUPABASE_URL").replace(/\/$/u, "");
  const key = required(config, "SUPABASE_SERVICE_ROLE_KEY");
  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  const query = (path) => fetchJson(`${base}/rest/v1/${path}`, { headers });

  const [fullRows, configRows, activeJobs] = await Promise.all([
    query(
      "backup_runs?select=backup_type,status,validation_status,offsite_status,storage_reference,checksum_reference,started_at,finished_at&backup_type=eq.full&order=started_at.desc&limit=1",
    ),
    query(
      "backup_runs?select=backup_type,status,validation_status,offsite_status,storage_reference,checksum_reference,started_at,finished_at&backup_type=eq.server_config&order=started_at.desc&limit=1",
    ),
    query(
      "admin_operation_jobs?select=job_type,status,requested_at&status=in.(queued,running)&order=requested_at.asc&limit=100",
    ),
  ]);

  async function validate(rows, label, maxAgeHours) {
    const row = Array.isArray(rows) ? rows[0] : null;
    requireCondition(row, `${label}_backup_missing`);
    const timestamp = Date.parse(row.finished_at || row.started_at || "");
    const ageHours = (Date.now() - timestamp) / 3_600_000;
    requireCondition(
      Number.isFinite(ageHours) && ageHours >= 0 && ageHours <= maxAgeHours,
      `${label}_backup_stale`,
    );
    requireCondition(
      ["succeeded", "offsite_pending", "degraded", "completed"].includes(
        row.status,
      ),
      `${label}_backup_status_invalid`,
    );
    requireCondition(
      row.validation_status === "passed",
      `${label}_backup_validation_invalid`,
    );
    if (config.get("FANMIND_BACKUP_OFFSITE_ENABLED") === "true") {
      requireCondition(
        row.offsite_status === "uploaded",
        `${label}_backup_offsite_invalid`,
      );
    }
    const artifact = String(row.storage_reference || "");
    const checksum = String(row.checksum_reference || "");
    requireCondition(
      artifact.startsWith(BACKUP_ROOT) && checksum === `${artifact}.sha256`,
      `${label}_backup_path_invalid`,
    );
    requireCondition(
      sudoText(["test", "-s", artifact], { allowFailure: true }) !== null,
      `${label}_backup_artifact_missing`,
    );
    requireCondition(
      sudoText(["test", "-s", checksum], { allowFailure: true }) !== null,
      `${label}_backup_checksum_missing`,
    );
    return Math.floor(ageHours);
  }

  const fullAge = await validate(fullRows, "full", 72);
  const configAge = await validate(configRows, "server_config", 72);
  const jobs = Array.isArray(activeJobs) ? activeJobs : [];
  const runningJobs = jobs.filter((job) => job.status === "running");
  requireCondition(runningJobs.length === 0, "backup_job_running");

  await emit("LATEST_FULL_BACKUP_AGE_HOURS", fullAge);
  await emit("LATEST_FULL_BACKUP_VALIDATION", "passed");
  await emit("LATEST_FULL_BACKUP_OFFSITE", "ready");
  await emit("LATEST_SERVER_CONFIG_BACKUP_AGE_HOURS", configAge);
  await emit("LATEST_SERVER_CONFIG_BACKUP_VALIDATION", "passed");
  await emit("LATEST_SERVER_CONFIG_BACKUP_OFFSITE", "ready");
  await emit("ACTIVE_BACKUP_JOB_COUNT", jobs.length);
  await emit("RUNNING_BACKUP_JOB_COUNT", 0);
  await emit("BACKUP_READINESS", "ready");
  await emit("BACKUP_PATHS_AND_CREDENTIALS_WERE_NOT_PRINTED", "true");
}

async function main() {
  requireCondition(/^[0-9a-f]{40}$/u.test(EXPECTED_RELEASE), "release_invalid");
  await writeFile(REPORT_PATH, "", { mode: 0o600 });
  await emit("READINESS_AUDIT_UTC", new Date().toISOString());
  await emit("EXPECTED_RELEASE", EXPECTED_RELEASE);
  await auditReleaseAndHealth();
  await auditHostAndServices();
  await auditBackups();
  await emit("CONTROLLED_REBOOT_READINESS_RESULT", "success");
}

main().catch(async (error) => {
  const reason =
    error instanceof Error && /^[a-z0-9_]+$/u.test(error.message)
      ? error.message
      : "controlled_reboot_readiness_failed";
  try {
    await emit("CONTROLLED_REBOOT_READINESS_RESULT", "failed");
    await emit("CONTROLLED_REBOOT_READINESS_REASON", reason);
  } catch {
    // Keep failure output bounded.
  }
  process.stderr.write("controlled_reboot_readiness_failed\n");
  process.exit(1);
});
