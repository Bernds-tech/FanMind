#!/usr/bin/env node

import { open, lstat } from "node:fs/promises";

const MAX_EVIDENCE_BYTES = 16 * 1024;
const PASS_FIELDS = [
  "verifier",
  "databaseRestore",
  "coreSchemaChecks",
  "rlsVerification",
  "storageSample",
  "serverConfigInspection",
  "cleanup",
];
const BOOLEAN_FALSE_FIELDS = [
  "productionModified",
  "customerDataExported",
  "secretsRecorded",
];
const REQUIRED_KEYS = [
  "schemaVersion",
  "drillId",
  "startedAt",
  "completedAt",
  "environment",
  "sourceArtifactBasename",
  "outerSha256",
  "productionCommit",
  "targetIdentitySha256",
  ...PASS_FIELDS,
  ...BOOLEAN_FALSE_FIELDS,
  "issues",
].sort();

function fail(code) {
  console.error(`RESTORE_EVIDENCE_ERROR=${code}`);
}

function isPlainObject(value) {
  return Boolean(value)
    && typeof value === "object"
    && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype;
}

function isIsoUtc(value) {
  return typeof value === "string"
    && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value)
    && Number.isFinite(Date.parse(value));
}

async function readStableEvidence(path) {
  const before = await lstat(path);
  if (!before.isFile() || before.isSymbolicLink()) {
    throw new Error("input_not_regular_file");
  }
  if ((before.mode & 0o022) !== 0) {
    throw new Error("input_permissions_too_open");
  }
  if (before.size <= 0 || before.size > MAX_EVIDENCE_BYTES) {
    throw new Error("input_size_invalid");
  }

  const handle = await open(path, "r");
  try {
    const opened = await handle.stat();
    if (!opened.isFile() || opened.dev !== before.dev || opened.ino !== before.ino) {
      throw new Error("input_changed_during_open");
    }
    const text = await handle.readFile("utf8");
    if (Buffer.byteLength(text, "utf8") !== opened.size) {
      throw new Error("input_changed_during_read");
    }
    return text;
  } finally {
    await handle.close();
  }
}

const args = process.argv.slice(2);
if (args.length !== 2 || args[0] !== "--input" || !args[1] || args[1].startsWith("-")) {
  fail("usage_requires_single_input");
  process.exit(1);
}

let payload;
try {
  payload = JSON.parse(await readStableEvidence(args[1]));
} catch (error) {
  const safeCode = error instanceof SyntaxError
    ? "input_json_invalid"
    : typeof error?.message === "string" && /^[a-z_]+$/.test(error.message)
      ? error.message
      : "input_read_failed";
  fail(safeCode);
  process.exit(1);
}

const errors = [];
const addError = (code) => {
  if (!errors.includes(code)) errors.push(code);
};

if (!isPlainObject(payload)) {
  addError("record_must_be_object");
} else {
  const keys = Object.keys(payload).sort();
  if (keys.length !== REQUIRED_KEYS.length || keys.some((key, index) => key !== REQUIRED_KEYS[index])) {
    addError("record_keys_invalid");
  }

  if (payload.schemaVersion !== 1) addError("schema_version_invalid");
  if (
    typeof payload.drillId !== "string"
    || !/^\d{4}-\d{2}-\d{2}-[a-z0-9][a-z0-9-]{0,47}$/.test(payload.drillId)
  ) {
    addError("drill_id_invalid");
  }
  if (!isIsoUtc(payload.startedAt) || !isIsoUtc(payload.completedAt)) {
    addError("timestamps_invalid");
  } else if (Date.parse(payload.completedAt) < Date.parse(payload.startedAt)) {
    addError("timestamp_order_invalid");
  }
  if (!["staging", "test"].includes(payload.environment)) {
    addError("environment_invalid");
  }
  if (
    typeof payload.sourceArtifactBasename !== "string"
    || payload.sourceArtifactBasename.length > 160
    || !/^fanmind-full-[a-zA-Z0-9._-]+\.tar\.gz\.age$/.test(payload.sourceArtifactBasename)
  ) {
    addError("artifact_basename_invalid");
  }

  for (const field of ["outerSha256", "targetIdentitySha256"]) {
    if (typeof payload[field] !== "string" || !/^[0-9a-f]{64}$/.test(payload[field])) {
      addError(`${field}_invalid`);
    }
  }
  if (typeof payload.productionCommit !== "string" || !/^[0-9a-f]{40}$/.test(payload.productionCommit)) {
    addError("production_commit_invalid");
  }

  for (const field of PASS_FIELDS) {
    if (payload[field] !== "passed") addError(`${field}_not_passed`);
  }
  for (const field of BOOLEAN_FALSE_FIELDS) {
    if (payload[field] !== false) addError(`${field}_must_be_false`);
  }

  if (!Array.isArray(payload.issues)) {
    addError("issues_invalid");
  } else {
    if (payload.issues.length !== 0) addError("issues_must_be_empty_for_pass");
    if (payload.issues.some((item) => typeof item !== "string" || !/^[a-z0-9][a-z0-9_-]{0,63}$/.test(item))) {
      addError("issue_code_invalid");
    }
  }
}

console.log(`RESTORE_EVIDENCE_SCHEMA=${errors.length ? "invalid" : "valid"}`);
console.log(`RESTORE_EVIDENCE_SECRETS_RECORDED=${payload?.secretsRecorded === false ? "false" : "blocked"}`);
console.log(`RESTORE_EVIDENCE_PRODUCTION_MODIFIED=${payload?.productionModified === false ? "false" : "blocked"}`);

if (errors.length) {
  for (const code of errors) fail(code);
  console.error("RESTORE_DRILL_EVIDENCE=FAIL");
  process.exit(1);
}

console.log("RESTORE_DRILL_EVIDENCE=PASS");
