#!/usr/bin/env node

import { appendFile, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const REPORT_PATH = process.env.FANMIND_DEPENDENCY_AUDIT_REPORT?.trim() ||
  "fanmind-dependency-resolution-audit.txt";
const MAX_CANDIDATES = 5;
const CURRENT_REQUIRED_VERSION = "16.2.11";

class DependencyResolutionAuditError extends Error {
  constructor(code) {
    super(code);
    this.name = "DependencyResolutionAuditError";
    this.code = code;
  }
}

async function emit(key, value) {
  const line = `${key}=${value}`;
  process.stdout.write(`${line}\n`);
  await appendFile(REPORT_PATH, `${line}\n`, { mode: 0o644 });
}

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: options.timeout ?? 180_000,
    maxBuffer: 32 * 1024 * 1024,
    env: {
      ...process.env,
      npm_config_fund: "false",
      npm_config_audit: "false",
      npm_config_update_notifier: "false",
    },
  });
}

function requireSuccess(result, code, accepted = [0]) {
  if (result.error || !accepted.includes(result.status ?? -1)) {
    throw new DependencyResolutionAuditError(code);
  }
  return String(result.stdout || "").trim();
}

function parseJson(value, code) {
  try {
    return JSON.parse(value);
  } catch {
    throw new DependencyResolutionAuditError(code);
  }
}

function auditSummary(payload) {
  const counts = payload?.metadata?.vulnerabilities ?? {};
  const vulnerabilities =
    payload?.vulnerabilities && typeof payload.vulnerabilities === "object"
      ? payload.vulnerabilities
      : {};
  const packages = Object.keys(vulnerabilities).sort();

  return {
    critical: Number(counts.critical ?? 0),
    high: Number(counts.high ?? 0),
    moderate: Number(counts.moderate ?? 0),
    low: Number(counts.low ?? 0),
    total: Number(counts.total ?? 0),
    packages,
  };
}

function runAudit() {
  const result = run("npm", ["audit", "--omit=dev", "--json"], {
    timeout: 120_000,
  });
  const output = requireSuccess(result, "npm_audit_unavailable", [0, 1]);
  return auditSummary(parseJson(output, "npm_audit_json_invalid"));
}

function npmView(packageName, field) {
  const output = requireSuccess(
    run("npm", ["view", packageName, field, "--json"], { timeout: 60_000 }),
    "npm_registry_query_failed",
  );
  return parseJson(output, "npm_registry_json_invalid");
}

function parseStableVersion(version) {
  const match = String(version).match(/^(\d+)\.(\d+)\.(\d+)$/u);
  if (!match) return null;
  return {
    raw: String(version),
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

function compareVersions(left, right) {
  return (
    left.major - right.major ||
    left.minor - right.minor ||
    left.patch - right.patch
  );
}

function restorePackageFiles() {
  requireSuccess(
    run("git", ["restore", "--source=HEAD", "--", "package.json", "package-lock.json"]),
    "package_restore_failed",
  );
}

function installCandidateLockfile(version) {
  const result = run(
    "npm",
    [
      "install",
      "--package-lock-only",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--save-exact",
      `next@${version}`,
      `eslint-config-next@${version}`,
    ],
    { timeout: 180_000 },
  );
  requireSuccess(result, "candidate_lockfile_install_failed");
}

function runGate(command, args, code, timeout = 300_000) {
  const result = run(command, args, { timeout });
  return {
    ok: !result.error && result.status === 0,
    code,
  };
}

function validateCandidateManifest(version) {
  const manifest = parseJson(
    requireSuccess(
      run("node", ["-e", "process.stdout.write(require('node:fs').readFileSync('package.json','utf8'))"]),
      "candidate_manifest_read_failed",
    ),
    "candidate_manifest_json_invalid",
  );
  return (
    manifest?.dependencies?.next === version &&
    manifest?.devDependencies?.["eslint-config-next"] === version
  );
}

async function inspectCandidate(version) {
  restorePackageFiles();
  installCandidateLockfile(version);
  if (!validateCandidateManifest(version)) {
    throw new DependencyResolutionAuditError("candidate_manifest_version_mismatch");
  }

  const audit = runAudit();
  const cleanEnough =
    audit.critical === 0 && audit.high === 0 && audit.moderate === 0;

  let compatibility = "not_run";
  if (cleanEnough) {
    const install = runGate(
      "npm",
      ["ci", "--no-audit", "--no-fund"],
      "candidate_npm_ci_failed",
      240_000,
    );
    if (!install.ok) {
      compatibility = install.code;
    } else {
      const gates = [
        runGate("npm", ["run", "verify:truth"], "candidate_truth_failed"),
        runGate("npm", ["run", "lint"], "candidate_lint_failed"),
        runGate("npm", ["run", "test:operations"], "candidate_operations_failed", 360_000),
        runGate("npm", ["run", "build"], "candidate_build_failed", 360_000),
      ];
      const failed = gates.find((gate) => !gate.ok);
      compatibility = failed ? failed.code : "success";
    }
  }

  restorePackageFiles();
  return {
    version,
    audit,
    cleanEnough,
    compatibility,
    eligible: cleanEnough && compatibility === "success",
  };
}

async function main() {
  await writeFile(REPORT_PATH, "", { mode: 0o644 });
  await emit("AUDIT_UTC", new Date().toISOString());
  await emit("AUDIT_MODE", "read_only_candidate_resolution");
  await emit("SECRETS_READ", "false");
  await emit("ADVISORY_BODIES_REPORTED", "false");

  const manifest = JSON.parse(await readFile("package.json", "utf8"));
  const currentVersion = manifest?.dependencies?.next;
  const eslintVersion = manifest?.devDependencies?.["eslint-config-next"];
  if (
    currentVersion !== CURRENT_REQUIRED_VERSION ||
    eslintVersion !== CURRENT_REQUIRED_VERSION
  ) {
    throw new DependencyResolutionAuditError("current_framework_version_unexpected");
  }
  await emit("CURRENT_NEXT_VERSION", currentVersion);
  await emit("CURRENT_ESLINT_CONFIG_NEXT_VERSION", eslintVersion);

  const currentAudit = runAudit();
  await emit("CURRENT_AUDIT_CRITICAL", currentAudit.critical);
  await emit("CURRENT_AUDIT_HIGH", currentAudit.high);
  await emit("CURRENT_AUDIT_MODERATE", currentAudit.moderate);
  await emit("CURRENT_AUDIT_LOW", currentAudit.low);
  await emit("CURRENT_AUDIT_TOTAL", currentAudit.total);
  await emit(
    "CURRENT_AUDIT_PACKAGES",
    currentAudit.packages.length ? currentAudit.packages.join(",") : "none",
  );

  const [nextVersionsRaw, eslintVersionsRaw, nextTags, eslintTags] = [
    npmView("next", "versions"),
    npmView("eslint-config-next", "versions"),
    npmView("next", "dist-tags"),
    npmView("eslint-config-next", "dist-tags"),
  ];

  const nextVersions = Array.isArray(nextVersionsRaw) ? nextVersionsRaw : [];
  const eslintVersions = new Set(
    Array.isArray(eslintVersionsRaw) ? eslintVersionsRaw.map(String) : [],
  );
  const currentParsed = parseStableVersion(currentVersion);
  if (!currentParsed) {
    throw new DependencyResolutionAuditError("current_framework_version_invalid");
  }

  const commonStable = nextVersions
    .map(parseStableVersion)
    .filter(Boolean)
    .filter((version) => version.major === currentParsed.major)
    .filter((version) => compareVersions(version, currentParsed) > 0)
    .filter((version) => eslintVersions.has(version.raw))
    .sort(compareVersions)
    .reverse();

  await emit("NEXT_DIST_TAG_LATEST", String(nextTags?.latest ?? "missing"));
  await emit(
    "ESLINT_CONFIG_NEXT_DIST_TAG_LATEST",
    String(eslintTags?.latest ?? "missing"),
  );
  await emit("COMMON_STABLE_MAJOR_16_GREATER_COUNT", commonStable.length);

  const candidates = commonStable.slice(0, MAX_CANDIDATES);
  await emit(
    "CANDIDATE_VERSIONS",
    candidates.length ? candidates.map((candidate) => candidate.raw).join(",") : "none",
  );

  const results = [];
  for (const candidate of candidates) {
    try {
      const result = await inspectCandidate(candidate.raw);
      results.push(result);
      await emit(`CANDIDATE_${candidate.raw}_CRITICAL`, result.audit.critical);
      await emit(`CANDIDATE_${candidate.raw}_HIGH`, result.audit.high);
      await emit(`CANDIDATE_${candidate.raw}_MODERATE`, result.audit.moderate);
      await emit(
        `CANDIDATE_${candidate.raw}_PACKAGES`,
        result.audit.packages.length ? result.audit.packages.join(",") : "none",
      );
      await emit(`CANDIDATE_${candidate.raw}_COMPATIBILITY`, result.compatibility);
      await emit(`CANDIDATE_${candidate.raw}_ELIGIBLE`, result.eligible ? "yes" : "no");
    } catch (error) {
      restorePackageFiles();
      const reason =
        error instanceof DependencyResolutionAuditError
          ? error.code
          : "candidate_evaluation_failed";
      results.push({
        version: candidate.raw,
        eligible: false,
        compatibility: reason,
      });
      await emit(`CANDIDATE_${candidate.raw}_EVALUATION`, reason);
      await emit(`CANDIDATE_${candidate.raw}_ELIGIBLE`, "no");
    }
  }

  restorePackageFiles();
  const diff = run("git", ["diff", "--exit-code", "--", "package.json", "package-lock.json"]);
  if (diff.error || diff.status !== 0) {
    throw new DependencyResolutionAuditError("working_tree_not_restored");
  }

  const eligible = results.filter((result) => result.eligible === true);
  await emit("ELIGIBLE_CANDIDATE_COUNT", eligible.length);
  await emit(
    "ELIGIBLE_CANDIDATE_VERSIONS",
    eligible.length ? eligible.map((result) => result.version).join(",") : "none",
  );
  await emit(
    "DEPENDENCY_RESOLUTION_RESULT",
    eligible.length ? "compatible_fix_available" : "no_compatible_fix_found",
  );
}

main().catch(async (error) => {
  try {
    restorePackageFiles();
  } catch {
    // Preserve the primary bounded failure reason.
  }
  const reason =
    error instanceof DependencyResolutionAuditError
      ? error.code
      : "dependency_resolution_audit_failed";
  try {
    await emit("DEPENDENCY_RESOLUTION_RESULT", "failed");
    await emit("DEPENDENCY_RESOLUTION_REASON", reason);
  } catch {
    // Keep failure output bounded if the report cannot be written.
  }
  process.stderr.write("dependency_resolution_audit_failed\n");
  process.exit(1);
});
