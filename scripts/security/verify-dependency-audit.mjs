#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT_REVIEW_EXCEPTION_EXPIRES_AT = "2026-08-07T00:00:00.000Z";
const ROOT_REVIEWED_AT = "2026-07-23T16:33:19.357Z";
const ROOT_REVIEW_SOURCE_RUN = "30025574639";
const ROOT_REVIEWED_FRAMEWORK_VERSION = "16.2.11";
const ROOT_REVIEW_HIGH_MAXIMUM = 3;
const ROOT_REVIEW_MODERATE_MAXIMUM = 0;
const REVIEWED_ROOT_PACKAGES = Object.freeze([
  "next",
  "postcss",
  "sharp",
]);

function parseArgument(name, fallback = null) {
  const exact = process.argv.findIndex((value) => value === name);
  if (exact >= 0) return process.argv[exact + 1] ?? fallback;
  const prefix = `${name}=`;
  const inline = process.argv.find((value) => value.startsWith(prefix));
  return inline ? inline.slice(prefix.length) : fallback;
}

function auditMetadata(payload) {
  const values = payload?.metadata?.vulnerabilities ?? {};
  return {
    info: Number(values.info ?? 0),
    low: Number(values.low ?? 0),
    moderate: Number(values.moderate ?? 0),
    high: Number(values.high ?? 0),
    critical: Number(values.critical ?? 0),
    total: Number(values.total ?? 0),
  };
}

function vulnerabilityNames(payload) {
  const vulnerabilities =
    payload?.vulnerabilities && typeof payload.vulnerabilities === "object"
      ? payload.vulnerabilities
      : {};
  return Object.keys(vulnerabilities).sort();
}

function evaluateDependencyAudit({
  rootPayload,
  mobilePayload,
  rootManifest,
  now = new Date(),
}) {
  const root = auditMetadata(rootPayload);
  const mobile = auditMetadata(mobilePayload);
  const rootNames = vulnerabilityNames(rootPayload);
  const mobileNames = vulnerabilityNames(mobilePayload);
  const allowedRootNames = new Set(REVIEWED_ROOT_PACKAGES);
  const unknownRootNames = rootNames.filter(
    (name) => !allowedRootNames.has(name),
  );
  const reviewedExceptionNeeded = rootNames.length > 0;
  const exceptionExpiresAt = new Date(ROOT_REVIEW_EXCEPTION_EXPIRES_AT);
  const exceptionCurrent = now.getTime() < exceptionExpiresAt.getTime();
  const rootVersionsPinned =
    rootManifest?.dependencies?.next === ROOT_REVIEWED_FRAMEWORK_VERSION &&
    rootManifest?.devDependencies?.["eslint-config-next"] ===
      ROOT_REVIEWED_FRAMEWORK_VERSION;

  const rootOk =
    root.critical === 0 &&
    root.high <= ROOT_REVIEW_HIGH_MAXIMUM &&
    root.moderate <= ROOT_REVIEW_MODERATE_MAXIMUM &&
    unknownRootNames.length === 0 &&
    rootVersionsPinned &&
    (!reviewedExceptionNeeded || exceptionCurrent);
  const mobileOk = mobile.critical === 0 && mobile.high === 0;

  const errors = [];
  if (root.critical !== 0) errors.push("root_critical_vulnerability_present");
  if (root.high > ROOT_REVIEW_HIGH_MAXIMUM) {
    errors.push("root_high_vulnerability_budget_exceeded");
  }
  if (root.moderate > ROOT_REVIEW_MODERATE_MAXIMUM) {
    errors.push("root_moderate_vulnerability_budget_exceeded");
  }
  if (unknownRootNames.length > 0) {
    errors.push("root_unreviewed_vulnerability_package_present");
  }
  if (!rootVersionsPinned) errors.push("root_framework_security_patch_missing");
  if (reviewedExceptionNeeded && !exceptionCurrent) {
    errors.push("root_review_exception_expired");
  }
  if (mobile.critical !== 0) {
    errors.push("mobile_critical_vulnerability_present");
  }
  if (mobile.high !== 0) errors.push("mobile_high_vulnerability_present");

  return {
    ok: rootOk && mobileOk,
    root: {
      ...root,
      packages: rootNames,
      unknownPackages: unknownRootNames,
      versionsPinned: rootVersionsPinned,
      reviewedExceptionNeeded,
      reviewedExceptionCurrent: exceptionCurrent,
      reviewedExceptionExpiresAt: ROOT_REVIEW_EXCEPTION_EXPIRES_AT,
      reviewedAt: ROOT_REVIEWED_AT,
      reviewSourceRun: ROOT_REVIEW_SOURCE_RUN,
      reviewedFrameworkVersion: ROOT_REVIEWED_FRAMEWORK_VERSION,
      highMaximum: ROOT_REVIEW_HIGH_MAXIMUM,
      moderateMaximum: ROOT_REVIEW_MODERATE_MAXIMUM,
    },
    mobile: {
      ...mobile,
      packages: mobileNames,
    },
    errors,
  };
}

function runNpmAudit(cwd, { omitDev = false } = {}) {
  const args = ["audit", "--json"];
  if (omitDev) args.push("--omit=dev");

  const result = spawnSync("npm", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 120_000,
    maxBuffer: 16 * 1024 * 1024,
  });

  if (result.error || ![0, 1].includes(result.status ?? -1)) {
    throw new Error("npm_audit_unavailable");
  }

  try {
    return JSON.parse(result.stdout || "{}");
  } catch {
    throw new Error("npm_audit_json_invalid");
  }
}

async function main() {
  const rootDirectory = process.cwd();
  const mobileDirectory = resolve(rootDirectory, "apps/mobile");
  const reportPath = resolve(
    rootDirectory,
    parseArgument("--report", "dependency-audit-report.json"),
  );
  const rootManifest = JSON.parse(
    await readFile(resolve(rootDirectory, "package.json"), "utf8"),
  );

  const evaluation = evaluateDependencyAudit({
    rootPayload: runNpmAudit(rootDirectory, { omitDev: true }),
    mobilePayload: runNpmAudit(mobileDirectory),
    rootManifest,
    now: new Date(),
  });

  const report = {
    generatedAt: new Date().toISOString(),
    policy: {
      rootCriticalMaximum: 0,
      rootHighMaximum: ROOT_REVIEW_HIGH_MAXIMUM,
      rootModerateMaximum: ROOT_REVIEW_MODERATE_MAXIMUM,
      reviewedRootPackages: REVIEWED_ROOT_PACKAGES,
      reviewedFrameworkVersion: ROOT_REVIEWED_FRAMEWORK_VERSION,
      reviewedAt: ROOT_REVIEWED_AT,
      reviewSourceRun: ROOT_REVIEW_SOURCE_RUN,
      reviewedExceptionExpiresAt: ROOT_REVIEW_EXCEPTION_EXPIRES_AT,
      mobileCriticalMaximum: 0,
      mobileHighMaximum: 0,
    },
    result: evaluation,
    advisoryDetailsIncluded: false,
    environmentValuesRead: false,
  };

  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, {
    mode: 0o600,
  });

  console.log(`DEPENDENCY_AUDIT_ROOT_TOTAL=${evaluation.root.total}`);
  console.log(`DEPENDENCY_AUDIT_ROOT_HIGH=${evaluation.root.high}`);
  console.log(`DEPENDENCY_AUDIT_ROOT_CRITICAL=${evaluation.root.critical}`);
  console.log(`DEPENDENCY_AUDIT_MOBILE_TOTAL=${evaluation.mobile.total}`);
  console.log(`DEPENDENCY_AUDIT_MOBILE_HIGH=${evaluation.mobile.high}`);
  console.log(`DEPENDENCY_AUDIT_MOBILE_CRITICAL=${evaluation.mobile.critical}`);
  console.log(
    `DEPENDENCY_AUDIT_REVIEW_EXCEPTION_CURRENT=${
      evaluation.root.reviewedExceptionCurrent ? "yes" : "no"
    }`,
  );
  console.log(`DEPENDENCY_AUDIT_RESULT=${evaluation.ok ? "success" : "failed"}`);

  if (!evaluation.ok) {
    for (const error of evaluation.errors) {
      console.error(`DEPENDENCY_AUDIT_ERROR=${error}`);
    }
    process.exit(1);
  }
}

export {
  REVIEWED_ROOT_PACKAGES,
  ROOT_REVIEWED_AT,
  ROOT_REVIEWED_FRAMEWORK_VERSION,
  ROOT_REVIEW_EXCEPTION_EXPIRES_AT,
  ROOT_REVIEW_HIGH_MAXIMUM,
  ROOT_REVIEW_MODERATE_MAXIMUM,
  ROOT_REVIEW_SOURCE_RUN,
  auditMetadata,
  evaluateDependencyAudit,
  runNpmAudit,
  vulnerabilityNames,
};

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    console.error(
      `DEPENDENCY_AUDIT_FATAL=${
        error instanceof Error ? error.message : "unknown"
      }`,
    );
    process.exit(1);
  });
}
