#!/usr/bin/env node

import { appendFile, chmod, readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const expectedRelease = process.env.EXPECTED_RELEASE || "";
const sourceDir = process.env.SOURCE_DIR || "/var/www/fanmind";
const reportPath = process.argv[2] || "";
const systemRule = "/etc/logrotate.d/fanmind-pm2";
const moduleConfigPath = "/home/ubuntu/.pm2/module_conf.json";
const safeErrors = new Set([
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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function emit(key, value) {
  const line = `${key}=${value}`;
  process.stdout.write(`${line}\n`);
  await appendFile(reportPath, `${line}\n`, { mode: 0o644 });
}

function spawn(binary, args, timeout = 30_000) {
  return spawnSync(binary, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout,
    env: process.env,
  });
}

function success(result, code, accepted = [0]) {
  if (result.error || !accepted.includes(result.status ?? -1)) {
    throw new Error(code);
  }
  return String(result.stdout || "").trim();
}

function shell(script, code, accepted = [0]) {
  return success(
    spawn("/usr/bin/bash", ["-lc", script]),
    code,
    accepted,
  );
}

function sudoShell(script, code) {
  return success(
    spawn("/usr/bin/sudo", ["-n", "/usr/bin/bash", "-lc", script]),
    code,
  );
}

function gitValue(...args) {
  return success(
    spawn("/usr/bin/git", ["-C", sourceDir, ...args]),
    "release_timeout",
  );
}

async function fetchJson(url) {
  const response = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  return {
    response,
    payload: await response.json().catch(() => null),
  };
}

async function publicHealth() {
  const { response, payload } = await fetchJson("https://fanmind.ch/api/health");
  if (!response.ok || !payload) return null;
  const policy = await import(
    `${pathToFileURL(`${sourceDir}/scripts/public-health-policy.mjs`).href}?pm2=${Date.now()}`
  );
  const required = policy.REQUIRED_PUBLIC_HEALTH_COMPONENTS;
  const checks = Array.isArray(payload.checks) ? payload.checks : [];
  const evaluation = policy.evaluatePublicHealth(payload);
  return {
    requiredCount: required.length,
    ok:
      payload.status === "healthy" &&
      evaluation.ok === true &&
      required.length === 7 &&
      required.every((component) =>
        checks.some(
          (check) =>
            check?.component === component && check?.status === "healthy",
        ),
      ),
  };
}

async function waitForRelease() {
  for (let attempt = 1; attempt <= 90; attempt += 1) {
    try {
      const version = await fetchJson("https://fanmind.ch/api/version");
      const live = version.response.ok ? version.payload?.releaseCommit : "";
      if (
        live === expectedRelease &&
        gitValue("rev-parse", "HEAD") === expectedRelease &&
        gitValue("rev-parse", "origin/main") === expectedRelease
      ) {
        const health = await publicHealth();
        if (health?.ok) {
          await emit("RELEASE_SYNC", "ok");
          await emit("PUBLIC_REQUIRED_HEALTHY_COUNT", health.requiredCount);
          return;
        }
      }
    } catch {
      // Keep retries redacted.
    }
    await sleep(10_000);
  }
  throw new Error("release_timeout");
}

function resolvePm2Binary() {
  const binary = shell("command -v pm2", "pm2_state_invalid");
  if (!binary.startsWith("/")) throw new Error("pm2_state_invalid");
  return binary;
}

function normalizedModuleConfig(payload, moduleProcess) {
  if (payload?.["pm2-logrotate"] && typeof payload["pm2-logrotate"] === "object") {
    return payload["pm2-logrotate"];
  }
  const flattened = Object.fromEntries(
    Object.entries(payload || {})
      .filter(([key]) => key.startsWith("pm2-logrotate:"))
      .map(([key, value]) => [key.slice("pm2-logrotate:".length), value]),
  );
  if (Object.keys(flattened).length) return flattened;
  return moduleProcess?.pm2_env || null;
}

async function pm2State() {
  const pm2 = resolvePm2Binary();
  const output = success(spawn(pm2, ["jlist"]), "pm2_state_invalid");
  let processes;
  let payload;
  try {
    processes = JSON.parse(output);
    payload = JSON.parse(await readFile(moduleConfigPath, "utf8"));
  } catch {
    throw new Error("pm2_state_invalid");
  }
  const moduleProcess = processes.find((item) => item?.name === "pm2-logrotate");
  const appProcess = processes.find((item) => item?.name === "fanmind");
  const config = normalizedModuleConfig(payload, moduleProcess);
  if (
    moduleProcess?.pm2_env?.status !== "online" ||
    appProcess?.pm2_env?.status !== "online" ||
    !config
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
    !state.compress ||
    state.rotateInterval !== "0 0 * * *"
  ) {
    throw new Error("pm2_logrotate_config_invalid");
  }
  return state;
}

function journaldDigest() {
  const script = [
    "set -euo pipefail",
    "count=$(find /etc/systemd/journald.conf.d -maxdepth 1 -type f -iname '*fanmind*' 2>/dev/null | wc -l)",
    "test \"$count\" -gt 0",
    "find /etc/systemd/journald.conf.d -maxdepth 1 -type f -iname '*fanmind*' -print0 2>/dev/null | sort -z | xargs -0 -r sha256sum | sha256sum | awk '{print $1}'",
  ].join("\n");
  return sudoShell(script, "journald_policy_missing");
}

function systemRulePresent() {
  const result = spawn("/usr/bin/sudo", [
    "-n",
    "/usr/bin/test",
    "-f",
    systemRule,
  ]);
  success(result, "system_rule_inventory_invalid", [0, 1]);
  return result.status === 0;
}

function systemRuleCount() {
  const output = sudoShell(
    "grep -RIl --fixed-strings '/home/ubuntu/.pm2/logs' /etc/logrotate.d 2>/dev/null || true",
    "system_rule_inventory_invalid",
  );
  return output ? output.split(/\r?\n/u).filter(Boolean).length : 0;
}

function removeSystemRule() {
  success(
    spawn("/usr/bin/sudo", [
      "-n",
      "/usr/bin/rm",
      "-f",
      "--",
      systemRule,
    ]),
    "system_rule_removal_failed",
  );
  if (systemRulePresent() || systemRuleCount() !== 0) {
    throw new Error("system_rule_removal_failed");
  }
}

function pm2Equal(before, after) {
  return Object.keys(before).every((key) => before[key] === after[key]);
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
  const health = await publicHealth();
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

  const beforePm2 = await pm2State();
  const beforeJournald = journaldDigest();
  const beforePresent = systemRulePresent();
  const beforeCount = systemRuleCount();
  if (beforeCount > 1) throw new Error("system_rule_inventory_invalid");

  await emit("PM2_APP_STATUS", "online");
  await emit("PM2_LOGROTATE_STATUS", "online");
  await emit("PM2_LOGROTATE_MAX_SIZE", "10M");
  await emit("PM2_LOGROTATE_RETAIN", 14);
  await emit("PM2_LOGROTATE_COMPRESS", "true");
  await emit("PM2_LOGROTATE_SCHEDULE", "daily");
  await emit("JOURNALD_FANMIND_POLICY", "present");
  await emit("SYSTEM_PM2_RULE_BEFORE", beforePresent ? "present" : "already_absent");
  await emit("SYSTEM_PM2_RULE_MATCHES_BEFORE", beforeCount);

  removeSystemRule();
  await emit("SYSTEM_PM2_RULE_AFTER", "absent");
  await emit("SYSTEM_PM2_RULE_MATCHES_AFTER", 0);
  await emit("LOG_FILES_READ_OR_DELETED", "false");

  const afterPm2 = await pm2State();
  const afterJournald = journaldDigest();
  if (!pm2Equal(beforePm2, afterPm2)) throw new Error("pm2_state_changed");
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
  const reason = safeErrors.has(error?.message)
    ? error.message
    : "pm2_logrotate_cleanup_failed";
  try {
    if (reportPath) {
      await emit("PM2_LOGROTATE_CLEANUP_RESULT", "failed");
      await emit("PM2_LOGROTATE_CLEANUP_REASON", reason);
      await chmod(reportPath, 0o644);
    }
  } catch {
    // Keep failure output bounded.
  }
  process.stderr.write("pm2_logrotate_cleanup_failed\n");
  process.exit(1);
});
