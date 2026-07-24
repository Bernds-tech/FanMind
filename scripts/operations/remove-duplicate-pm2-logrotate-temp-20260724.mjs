#!/usr/bin/env node

import { appendFile, chmod, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const SAFE_ERRORS = new Set([
  "configuration_missing",
  "release_timeout",
  "health_failed",
  "pm2_state_invalid",
  "pm2_logrotate_config_invalid",
  "journald_policy_missing",
  "system_rule_inventory_invalid",
  "system_rule_removal_failed",
  "pm2_state_changed",
  "journald_policy_changed",
  "core_route_failed",
]);

const expectedRelease = process.env.EXPECTED_RELEASE || "";
const sourceDir = process.env.SOURCE_DIR || "/var/www/fanmind";
const reportPath = process.argv[2] || "";
const systemRule = "/etc/logrotate.d/fanmind-pm2";
const moduleConfigPath = join(homedir(), ".pm2/module_conf.json");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function emit(key, value) {
  const line = `${key}=${value}`;
  process.stdout.write(`${line}\n`);
  await appendFile(reportPath, `${line}\n`, { mode: 0o644 });
}

function run(binary, args, options = {}) {
  const result = spawnSync(binary, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: options.timeout ?? 30_000,
    env: options.env ?? process.env,
  });
  return result;
}

function requireSuccess(result, code) {
  if (result.error || result.status !== 0) throw new Error(code);
  return String(result.stdout || "").trim();
}

function gitValue(...args) {
  return requireSuccess(
    run("/usr/bin/git", ["-C", sourceDir, ...args]),
    "release_timeout",
  );
}

async function fetchJson(url) {
  const response = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null);
  return { response, payload };
}

async function evaluatePublicHealth() {
  const result = await fetchJson("https://fanmind.ch/api/health");
  if (!result.response.ok || !result.payload) return null;

  const policy = await import(
    `${pathToFileURL(`${sourceDir}/scripts/public-health-policy.mjs`).href}?cleanup=${Date.now()}`
  );
  const evaluation = policy.evaluatePublicHealth(result.payload);
  const required = policy.REQUIRED_PUBLIC_HEALTH_COMPONENTS;
  const checks = Array.isArray(result.payload.checks) ? result.payload.checks : [];
  const healthyRequired = required.every((component) =>
    checks.some(
      (check) => check?.component === component && check?.status === "healthy",
    ),
  );

  return {
    ok:
      result.payload.status === "healthy" &&
      evaluation.ok === true &&
      healthyRequired &&
      required.length === 7,
    requiredCount: required.length,
  };
}

async function waitForRelease() {
  for (let attempt = 1; attempt <= 90; attempt += 1) {
    try {
      const version = await fetchJson("https://fanmind.ch/api/version");
      const liveRelease =
        version.response.ok &&
        typeof version.payload?.releaseCommit === "string"
          ? version.payload.releaseCommit
          : "";
      const serverHead = gitValue("rev-parse", "HEAD");
      const originMain = gitValue("rev-parse", "origin/main");

      if (
        liveRelease === expectedRelease &&
        serverHead === expectedRelease &&
        originMain === expectedRelease
      ) {
        const health = await evaluatePublicHealth();
        if (health?.ok) {
          await emit("RELEASE_SYNC", "ok");
          await emit("PUBLIC_REQUIRED_HEALTHY_COUNT", health.requiredCount);
          return;
        }
      }
    } catch {
      // Retry without exposing response bodies or command output.
    }
    await sleep(10_000);
  }
  throw new Error("release_timeout");
}

async function readPm2State() {
  const list = requireSuccess(run("/usr/bin/pm2", ["jlist"]), "pm2_state_invalid");
  let processes;
  let configPayload;
  try {
    processes = JSON.parse(list);
    configPayload = JSON.parse(await readFile(moduleConfigPath, "utf8"));
  } catch {
    throw new Error("pm2_state_invalid");
  }

  const moduleProcess = processes.find((item) => item?.name === "pm2-logrotate");
  const appProcess = processes.find((item) => item?.name === "fanmind");
  const config = configPayload?.["pm2-logrotate"];
  if (
    moduleProcess?.pm2_env?.status !== "online" ||
    appProcess?.pm2_env?.status !== "online" ||
    !config ||
    typeof config !== "object"
  ) {
    throw new Error("pm2_state_invalid");
  }

  const state = {
    appStatus: String(appProcess.pm2_env.status),
    appRestartTime: Number(appProcess.pm2_env.restart_time ?? -1),
    appPid: Number(appProcess.pid ?? -1),
    moduleStatus: String(moduleProcess.pm2_env.status),
    moduleRestartTime: Number(moduleProcess.pm2_env.restart_time ?? -1),
    maxSize: String(config.max_size ?? "").trim().toUpperCase(),
    retain: Number(config.retain),
    compress:
      config.compress === true || String(config.compress).toLowerCase() === "true",
    rotateInterval: String(config.rotateInterval ?? "").trim(),
  };

  if (
    !Number.isInteger(state.appRestartTime) ||
    state.appRestartTime < 0 ||
    !Number.isInteger(state.appPid) ||
    state.appPid <= 0 ||
    !Number.isInteger(state.moduleRestartTime) ||
    state.moduleRestartTime < 0
  ) {
    throw new Error("pm2_state_invalid");
  }
  if (
    state.maxSize !== "10M" ||
    state.retain !== 14 ||
    state.compress !== true ||
    state.rotateInterval !== "0 0 * * *"
  ) {
    throw new Error("pm2_logrotate_config_invalid");
  }

  return state;
}

function journaldPolicyDigest() {
  const script = String.raw`
    set -euo pipefail
    files=()
    while IFS= read -r -d '' file; do files+=("$file"); done < <(
      find /etc/systemd/journald.conf.d -maxdepth 1 -type f -iname '*fanmind*' -print0 2>/dev/null | sort -z
    )
    ((${#files[@]} > 0))
    for file in "${files[@]}"; do sha256sum "$file"; done | sha256sum | awk '{print $1}'
  `;
  return requireSuccess(
    run("/usr/bin/sudo", ["-n", "/usr/bin/bash", "-lc", script]),
    "journald_policy_missing",
  );
}

function systemRulePresent() {
  const result = run("/usr/bin/sudo", ["-n", "/usr/bin/test", "-f", systemRule]);
  if (result.error || ![0, 1].includes(result.status ?? -1)) {
    throw new Error("system_rule_inventory_invalid");
  }
  return result.status === 0;
}

function systemPm2RuleCount() {
  const script = String.raw`
    set -euo pipefail
    grep -RIl --fixed-strings '/home/ubuntu/.pm2/logs' /etc/logrotate.d 2>/dev/null || true
  `;
  const output = requireSuccess(
    run("/usr/bin/sudo", ["-n", "/usr/bin/bash", "-lc", script]),
    "system_rule_inventory_invalid",
  );
  if (!output) return 0;
  return output.split(/\r?\n/u).filter(Boolean).length;
}

function removeSystemRule() {
  requireSuccess(
    run("/usr/bin/sudo", ["-n", "/usr/bin/rm", "-f", "--", systemRule]),
    "system_rule_removal_failed",
  );
  if (systemRulePresent() || systemPm2RuleCount() !== 0) {
    throw new Error("system_rule_removal_failed");
  }
}

function samePm2State(before, after) {
  return (
    before.appStatus === after.appStatus &&
    before.appRestartTime === after.appRestartTime &&
    before.appPid === after.appPid &&
    before.moduleStatus === after.moduleStatus &&
    before.moduleRestartTime === after.moduleRestartTime &&
    before.maxSize === after.maxSize &&
    before.retain === after.retain &&
    before.compress === after.compress &&
    before.rotateInterval === after.rotateInterval
  );
}

async function verifyCoreRoutes() {
  for (const route of ["/", "/login", "/register", "/api/version", "/api/health"]) {
    const response = await fetch(`https://fanmind.ch${route}`, {
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
    if (!response.ok) throw new Error("core_route_failed");
  }

  const version = await fetchJson("https://fanmind.ch/api/version");
  const health = await evaluatePublicHealth();
  if (
    !version.response.ok ||
    version.payload?.releaseCommit !== expectedRelease ||
    gitValue("rev-parse", "HEAD") !== expectedRelease ||
    gitValue("rev-parse", "origin/main") !== expectedRelease ||
    !health?.ok
  ) {
    throw new Error("health_failed");
  }
}

async function main() {
  if (!reportPath || !/^[0-9a-f]{40}$/u.test(expectedRelease)) {
    throw new Error("configuration_missing");
  }
  await writeFile(reportPath, "", { mode: 0o644 });
  await emit("AUDIT_UTC", new Date().toISOString());
  await emit("EXPECTED_RELEASE", expectedRelease);

  await waitForRelease();

  const beforePm2 = await readPm2State();
  const beforeJournald = journaldPolicyDigest();
  const beforePresent = systemRulePresent();
  const beforeMatches = systemPm2RuleCount();
  if (beforeMatches > 1) throw new Error("system_rule_inventory_invalid");

  await emit("PM2_APP_STATUS", "online");
  await emit("PM2_LOGROTATE_STATUS", "online");
  await emit("PM2_LOGROTATE_MAX_SIZE", "10M");
  await emit("PM2_LOGROTATE_RETAIN", 14);
  await emit("PM2_LOGROTATE_COMPRESS", "true");
  await emit("PM2_LOGROTATE_SCHEDULE", "daily");
  await emit("JOURNALD_FANMIND_POLICY", "present");
  await emit("SYSTEM_PM2_RULE_BEFORE", beforePresent ? "present" : "already_absent");
  await emit("SYSTEM_PM2_RULE_MATCHES_BEFORE", beforeMatches);

  removeSystemRule();
  await emit("SYSTEM_PM2_RULE_AFTER", "absent");
  await emit("SYSTEM_PM2_RULE_MATCHES_AFTER", 0);
  await emit("LOG_FILES_READ_OR_DELETED", "false");

  const afterPm2 = await readPm2State();
  const afterJournald = journaldPolicyDigest();
  if (!samePm2State(beforePm2, afterPm2)) throw new Error("pm2_state_changed");
  if (beforeJournald !== afterJournald) throw new Error("journald_policy_changed");

  await emit("FANMIND_PM2_RESTART_COUNT_UNCHANGED", "yes");
  await emit("FANMIND_PM2_PID_UNCHANGED", "yes");
  await emit("PM2_LOGROTATE_MODULE_UNCHANGED", "yes");
  await emit("PM2_LOGROTATE_CONFIG_UNCHANGED", "yes");
  await emit("JOURNALD_CONFIG_UNCHANGED", "yes");

  await verifyCoreRoutes();
  await emit("PUBLIC_CORE_ROUTES", "healthy");
  await emit("POST_CLEANUP_RELEASE_SYNC", "ok");
  await emit("POST_CLEANUP_PUBLIC_HEALTH", "healthy");
  await emit("PM2_LOGROTATE_CLEANUP_RESULT", "success");
  await chmod(reportPath, 0o644);
}

main().catch(async (error) => {
  const reason = SAFE_ERRORS.has(error?.message)
    ? error.message
    : "pm2_logrotate_cleanup_failed";
  try {
    if (reportPath) {
      await emit("PM2_LOGROTATE_CLEANUP_RESULT", "failed");
      await emit("PM2_LOGROTATE_CLEANUP_REASON", reason);
      await chmod(reportPath, 0o644);
    }
  } catch {
    // Keep failure output bounded if the report cannot be written.
  }
  process.stderr.write("pm2_logrotate_cleanup_failed\n");
  process.exit(1);
});
