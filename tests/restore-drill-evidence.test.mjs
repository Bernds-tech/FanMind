import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { chmod, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const verifierPath = "scripts/operations/verify-restore-drill-evidence.mjs";
const runbookPath = "docs/operations/RESTORE_DRILL.md";

function validEvidence(overrides = {}) {
  return {
    schemaVersion: 1,
    drillId: "2026-07-26-restore-001",
    startedAt: "2026-07-26T18:00:00Z",
    completedAt: "2026-07-26T18:30:00Z",
    environment: "staging",
    sourceArtifactBasename: "fanmind-full-20260726T170000Z.tar.gz.age",
    outerSha256: "a".repeat(64),
    productionCommit: "b".repeat(40),
    targetIdentitySha256: "c".repeat(64),
    verifier: "passed",
    databaseRestore: "passed",
    coreSchemaChecks: "passed",
    rlsVerification: "passed",
    storageSample: "passed",
    serverConfigInspection: "passed",
    cleanup: "passed",
    productionModified: false,
    customerDataExported: false,
    secretsRecorded: false,
    issues: [],
    ...overrides,
  };
}

async function withEvidence(payload, callback) {
  const root = await mkdtemp(join(tmpdir(), "fanmind-restore-evidence-"));
  try {
    const path = join(root, "evidence.json");
    await writeFile(path, JSON.stringify(payload));
    await chmod(path, 0o600);
    return await callback(path);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test("valid redacted restore evidence passes without echoing identifiers", async () => {
  await withEvidence(validEvidence(), async (path) => {
    const { stdout, stderr } = await execFileAsync(process.execPath, [
      verifierPath,
      "--input",
      path,
    ]);
    const output = `${stdout}\n${stderr}`;

    assert.match(output, /RESTORE_EVIDENCE_SCHEMA=valid/);
    assert.match(output, /RESTORE_EVIDENCE_SECRETS_RECORDED=false/);
    assert.match(output, /RESTORE_EVIDENCE_PRODUCTION_MODIFIED=false/);
    assert.match(output, /RESTORE_DRILL_EVIDENCE=PASS/);
    assert.doesNotMatch(output, /fanmind-full|restore-001|a{20}|b{20}|c{20}/);
  });
});

test("evidence with unexpected fields fails closed without echoing their values", async () => {
  const secretMarker = "never-print-this-database-password";
  await withEvidence(
    { ...validEvidence(), databasePassword: secretMarker },
    async (path) => {
      await assert.rejects(
        execFileAsync(process.execPath, [verifierPath, "--input", path]),
        (error) => {
          const output = `${error.stdout ?? ""}\n${error.stderr ?? ""}`;
          assert.match(output, /record_keys_invalid/);
          assert.match(output, /RESTORE_DRILL_EVIDENCE=FAIL/);
          assert.doesNotMatch(output, new RegExp(secretMarker));
          return true;
        },
      );
    },
  );
});

test("pass evidence rejects Production modification, retained issues and incomplete cleanup", async () => {
  await withEvidence(
    validEvidence({
      productionModified: true,
      cleanup: "failed",
      issues: ["cleanup_incomplete"],
    }),
    async (path) => {
      await assert.rejects(
        execFileAsync(process.execPath, [verifierPath, "--input", path]),
        (error) => {
          const output = `${error.stdout ?? ""}\n${error.stderr ?? ""}`;
          assert.match(output, /productionModified_must_be_false/);
          assert.match(output, /cleanup_not_passed/);
          assert.match(output, /issues_must_be_empty_for_pass/);
          return true;
        },
      );
    },
  );
});

test("unreadable input reports a fixed code without echoing the path", async () => {
  const missingPath = join(tmpdir(), "never-print-internal-evidence-path.json");
  await assert.rejects(
    execFileAsync(process.execPath, [verifierPath, "--input", missingPath]),
    (error) => {
      const output = `${error.stdout ?? ""}\n${error.stderr ?? ""}`;
      assert.match(output, /RESTORE_EVIDENCE_ERROR=input_read_failed/);
      assert.doesNotMatch(output, /never-print-internal-evidence-path/);
      return true;
    },
  );
});

test("restore runbook requires the machine-checked evidence gate", async () => {
  const source = await import("node:fs/promises").then(({ readFile }) => readFile(runbookPath, "utf8"));

  assert.match(source, /npm run restore:evidence:verify/);
  assert.match(source, /targetIdentitySha256/);
  assert.match(source, /RESTORE_DRILL_EVIDENCE=PASS/);
  assert.match(source, /keine Hostnamen, Datenbanknamen, Benutzernamen/);
});
