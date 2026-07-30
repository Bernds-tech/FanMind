import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { constants as fsConstants } from "node:fs";
import {
  chmod,
  mkdtemp,
  open,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const verifierPath = "scripts/operations/verify-restore-drill-evidence.mjs";
const receiptVerifierPath =
  "scripts/operations/verify-full-backup-restore-receipt.mjs";
const receiptWriterPath =
  "scripts/operations/restore-runner-receipt.mjs";
const runbookPath = "docs/operations/RESTORE_DRILL.md";

const sha = (value) =>
  createHash("sha256").update(value).digest("hex");

function fullReceipt(overrides = {}) {
  return {
    schemaVersion: 1,
    createdAt: "2026-07-30T07:55:00Z",
    sourceArtifactBasename: "fanmind-full-1785398400000.tar.gz.age",
    outerSha256: "a".repeat(64),
    productionCommit: "b".repeat(40),
    databasePartEncryptedSha256: "d".repeat(64),
    databaseDumpSha256: sha("synthetic-database-dump"),
    verifier: "passed",
    ...overrides,
  };
}

function runnerReceipt(fullBytes, targetId, overrides = {}) {
  const full = JSON.parse(fullBytes);
  return {
    schemaVersion: 1,
    drillId: "2026-07-30-restore-001",
    startedAt: "2026-07-30T08:00:00Z",
    completedAt: "2026-07-30T08:20:00Z",
    sourceArtifactBasename: full.sourceArtifactBasename,
    outerSha256: full.outerSha256,
    productionCommit: full.productionCommit,
    fullBackupReceiptSha256: sha(fullBytes),
    databasePartEncryptedSha256:
      full.databasePartEncryptedSha256,
    databaseDumpSha256: full.databaseDumpSha256,
    disposableTargetId: targetId,
    emptyTargetObservedAt: "2026-07-30T08:02:00Z",
    emptyTargetObjectCount: 0,
    databaseRestore: "passed",
    singleTransaction: true,
    ...overrides,
  };
}

function evidence(fullBytes, runnerBytes, targetId, overrides = {}) {
  const full = JSON.parse(fullBytes);
  return {
    schemaVersion: 4,
    drillId: "2026-07-30-restore-001",
    startedAt: "2026-07-30T08:00:00Z",
    completedAt: "2026-07-30T08:30:00Z",
    environment: "staging",
    sourceArtifactBasename: full.sourceArtifactBasename,
    outerSha256: full.outerSha256,
    productionCommit: full.productionCommit,
    fullBackupReceiptSha256: sha(fullBytes),
    restoreRunnerReceiptSha256: sha(runnerBytes),
    databasePartEncryptedSha256:
      full.databasePartEncryptedSha256,
    databaseDumpSha256: full.databaseDumpSha256,
    disposableTargetId: targetId,
    verifier: "passed",
    coreSchemaChecks: "passed",
    rlsVerification: "passed",
    storageSample: "passed",
    serverConfigInspection: "passed",
    cleanup: "passed",
    productionModified: false,
    customerDataRecordedInEvidence: false,
    secretsRecorded: false,
    issues: [],
    ...overrides,
  };
}

async function privateFile(path, content) {
  await writeFile(path, content, { mode: 0o600 });
  await chmod(path, 0o600);
}

async function readPrivateRegularFile(path, encoding) {
  const handle = await open(
    path,
    fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW,
  );
  try {
    const metadata = await handle.stat();
    assert.equal(metadata.isFile(), true);
    assert.equal(metadata.mode & 0o777, 0o600);
    assert.equal(metadata.nlink, 1);
    return {
      content: await handle.readFile({ encoding }),
      metadata,
    };
  } finally {
    await handle.close();
  }
}

async function withReceiptSet(callback) {
  const root = await mkdtemp(join(tmpdir(), "fanmind-restore-evidence-"));
  try {
    await chmod(root, 0o700);
    const targetId = randomUUID();
    const fullBytes = `${JSON.stringify(fullReceipt())}\n`;
    const runnerBytes = `${JSON.stringify(
      runnerReceipt(fullBytes, targetId),
    )}\n`;
    const evidenceBytes = `${JSON.stringify(
      evidence(fullBytes, runnerBytes, targetId),
    )}\n`;
    const paths = {
      root,
      full: join(root, "full-receipt.json"),
      runner: join(root, "runner-receipt.json"),
      evidence: join(root, "evidence.json"),
      dump: join(root, "database.dump"),
    };
    await Promise.all([
      privateFile(paths.full, fullBytes),
      privateFile(paths.runner, runnerBytes),
      privateFile(paths.evidence, evidenceBytes),
      privateFile(paths.dump, "synthetic-database-dump"),
    ]);
    return await callback({
      paths,
      targetId,
      fullBytes,
      runnerBytes,
      evidenceBytes,
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

function verifierArguments(paths) {
  return [
    verifierPath,
    "--input",
    paths.evidence,
    "--full-receipt",
    paths.full,
    "--runner-receipt",
    paths.runner,
  ];
}

test("full-backup receipt binds the exact private database dump", async () => {
  await withReceiptSet(async ({ paths }) => {
    const { stdout, stderr } = await execFileAsync(process.execPath, [
      receiptVerifierPath,
      "--receipt",
      paths.full,
      "--dump",
      paths.dump,
    ]);
    const output = `${stdout}\n${stderr}`;
    assert.match(output, /FULL_BACKUP_RESTORE_RECEIPT=PASS/u);
    assert.doesNotMatch(output, /fanmind-full|a{20}|b{20}|d{20}/u);

    await privateFile(paths.dump, "different-database-dump");
    await assert.rejects(
      execFileAsync(process.execPath, [
        receiptVerifierPath,
        "--receipt",
        paths.full,
        "--dump",
        paths.dump,
      ]),
      (error) => {
        const failed = `${error.stdout ?? ""}\n${error.stderr ?? ""}`;
        assert.match(failed, /database_dump_sha_mismatch/u);
        assert.doesNotMatch(failed, /different-database-dump/u);
        return true;
      },
    );
  });
});

test("atomic writer creates one exact private runner receipt", async () => {
  await withReceiptSet(async ({ paths, targetId, fullBytes }) => {
    const outputPath = join(paths.root, "new-runner-receipt.json");
    const environment = {
      ...process.env,
      FANMIND_RESTORE_DRILL_ID: "2026-07-30-restore-001",
      FANMIND_RESTORE_DISPOSABLE_TARGET_ID: targetId,
      FANMIND_RESTORE_PRODUCTION_COMMIT: "b".repeat(40),
      FANMIND_RESTORE_STARTED_AT: "2026-07-30T08:00:00Z",
      FANMIND_RESTORE_EMPTY_TARGET_OBSERVED_AT:
        "2026-07-30T08:02:00Z",
      FANMIND_RESTORE_COMPLETED_AT: "2026-07-30T08:20:00Z",
      FANMIND_RESTORE_EMPTY_TARGET_OBJECT_COUNT: "0",
    };
    const { stdout } = await execFileAsync(
      process.execPath,
      [
        receiptWriterPath,
        "--full-receipt",
        paths.full,
        "--dump",
        paths.dump,
        "--output",
        outputPath,
      ],
      { env: environment },
    );
    assert.match(stdout, /RESTORE_RUNNER_RECEIPT=PASS/u);
    const output = await readPrivateRegularFile(outputPath, "utf8");
    const record = JSON.parse(output.content);
    assert.equal(record.fullBackupReceiptSha256, sha(fullBytes));
    assert.equal(record.emptyTargetObjectCount, 0);
    assert.equal(record.singleTransaction, true);

    await assert.rejects(
      execFileAsync(
        process.execPath,
        [
          receiptWriterPath,
          "--full-receipt",
          paths.full,
          "--dump",
          paths.dump,
          "--output",
          outputPath,
        ],
        { env: environment },
      ),
      /output_already_exists/u,
    );
  });
});

test("valid schema v4 binds both receipts without echoing identifiers", async () => {
  await withReceiptSet(async ({ paths, evidenceBytes }) => {
    const { stdout, stderr } = await execFileAsync(
      process.execPath,
      verifierArguments(paths),
    );
    const output = `${stdout}\n${stderr}`;
    assert.match(output, /RESTORE_EVIDENCE_SCHEMA=valid/u);
    assert.match(output, /RESTORE_EVIDENCE_SECRETS_RECORDED=false/u);
    assert.match(output, /RESTORE_EVIDENCE_PRODUCTION_MODIFIED=false/u);
    assert.match(output, /RESTORE_DRILL_EVIDENCE=PASS/u);
    assert.match(
      output,
      new RegExp(`RESTORE_EVIDENCE_SHA256=${sha(evidenceBytes)}`, "u"),
    );
    assert.doesNotMatch(
      output,
      /fanmind-full|restore-001|a{20}|b{20}|d{20}/u,
    );
  });
});

test("runner receipt is mandatory at the evidence CLI boundary", async () => {
  await withReceiptSet(async ({ paths }) => {
    await assert.rejects(
      execFileAsync(process.execPath, [
        verifierPath,
        "--input",
        paths.evidence,
        "--full-receipt",
        paths.full,
      ]),
      (error) => {
        assert.match(
          `${error.stdout ?? ""}\n${error.stderr ?? ""}`,
          /RESTORE_EVIDENCE_ERROR=usage_invalid/u,
        );
        return true;
      },
    );
  });
});

test("schema v3 and a manual databaseRestore assertion fail closed", async () => {
  await withReceiptSet(
    async ({ paths, fullBytes, runnerBytes, targetId }) => {
      await privateFile(
        paths.evidence,
        `${JSON.stringify(
          evidence(fullBytes, runnerBytes, targetId, {
            schemaVersion: 3,
          }),
        )}\n`,
      );
      await assert.rejects(
        execFileAsync(process.execPath, verifierArguments(paths)),
        /evidence_schema_invalid/u,
      );

      const manual = evidence(fullBytes, runnerBytes, targetId);
      manual.databaseRestore = "passed";
      manual.schemaVersion = 4;
      await privateFile(paths.evidence, `${JSON.stringify(manual)}\n`);
      await assert.rejects(
        execFileAsync(process.execPath, verifierArguments(paths)),
        /evidence_keys_invalid/u,
      );
    },
  );
});

test("runner receipt SHA, IDs, backup hashes and timestamp envelope are bound", async () => {
  const cases = [
    ["restoreRunnerReceiptSha256", "0".repeat(64), "runner_receipt_sha_mismatch"],
    ["drillId", "2026-07-30-other-001", "runner_identity_binding_mismatch"],
    ["databaseDumpSha256", "0".repeat(64), "receipt_binding_database_dump_sha256_mismatch"],
    ["startedAt", "2026-07-30T08:05:00Z", "runner_timestamp_envelope_mismatch"],
  ];
  for (const [field, value, code] of cases) {
    await withReceiptSet(
      async ({ paths, fullBytes, runnerBytes, targetId }) => {
        await privateFile(
          paths.evidence,
          `${JSON.stringify(
            evidence(fullBytes, runnerBytes, targetId, {
              [field]: value,
            }),
          )}\n`,
        );
        await assert.rejects(
          execFileAsync(process.execPath, verifierArguments(paths)),
          new RegExp(code, "u"),
        );
      },
    );
  }
});

test("nonzero empty target and non-transactional restore receipts fail", async () => {
  for (const [field, value, code] of [
    ["emptyTargetObjectCount", 1, "runner_receipt_target_not_empty"],
    ["singleTransaction", false, "runner_receipt_transaction_invalid"],
    ["databaseRestore", "failed", "runner_receipt_restore_not_passed"],
  ]) {
    await withReceiptSet(
      async ({ paths, fullBytes, targetId, runnerBytes }) => {
        const badRunnerBytes = `${JSON.stringify(
          runnerReceipt(fullBytes, targetId, { [field]: value }),
        )}\n`;
        await privateFile(paths.runner, badRunnerBytes);
        await privateFile(
          paths.evidence,
          `${JSON.stringify(
            evidence(fullBytes, badRunnerBytes, targetId, {
              restoreRunnerReceiptSha256: sha(badRunnerBytes),
            }),
          )}\n`,
        );
        await assert.rejects(
          execFileAsync(process.execPath, verifierArguments(paths)),
          new RegExp(code, "u"),
        );
        assert.notEqual(sha(runnerBytes), sha(badRunnerBytes));
      },
    );
  }
});

test("duplicate and unexpected receipt or evidence members stay redacted", async () => {
  await withReceiptSet(
    async ({ paths, fullBytes, runnerBytes, targetId }) => {
      const secret = "never-print-this-secret-value";
      await privateFile(
        paths.evidence,
        `{"schemaVersion":4,"schemaVersion":4,"secret":"${secret}"}\n`,
      );
      await assert.rejects(
        execFileAsync(process.execPath, verifierArguments(paths)),
        (error) => {
          const output = `${error.stdout ?? ""}\n${error.stderr ?? ""}`;
          assert.match(output, /evidence_duplicate_member/u);
          assert.doesNotMatch(output, new RegExp(secret, "u"));
          return true;
        },
      );

      await privateFile(
        paths.evidence,
        `${JSON.stringify({
          ...evidence(fullBytes, runnerBytes, targetId),
          databasePassword: secret,
        })}\n`,
      );
      await assert.rejects(
        execFileAsync(process.execPath, verifierArguments(paths)),
        (error) => {
          const output = `${error.stdout ?? ""}\n${error.stderr ?? ""}`;
          assert.match(output, /evidence_keys_invalid/u);
          assert.doesNotMatch(output, new RegExp(secret, "u"));
          return true;
        },
      );
    },
  );
});

test("evidence and both receipts require private regular files", async () => {
  await withReceiptSet(async ({ paths }) => {
    await chmod(paths.evidence, 0o644);
    await assert.rejects(
      execFileAsync(process.execPath, verifierArguments(paths)),
      /evidence_permissions_invalid/u,
    );
    await chmod(paths.evidence, 0o600);

    const target = join(paths.root, "full-target.json");
    await privateFile(target, await readFile(paths.full));
    await rm(paths.full);
    await symlink(target, paths.full);
    await assert.rejects(
      execFileAsync(process.execPath, verifierArguments(paths)),
      /full_backup_receipt_not_regular/u,
    );
  });
});

test("restore runbook requires receipt-bound schema v4 evidence", async () => {
  const source = await readFile(runbookPath, "utf8");
  assert.match(source, /schemaVersion.*4/su);
  assert.match(source, /restoreRunnerReceiptSha256/u);
  assert.match(source, /fullBackupReceiptSha256/u);
  assert.match(source, /RESTORE_EVIDENCE_SHA256/u);
  assert.match(source, /databaseRestore.*(?:manuell|manually)/su);
});
