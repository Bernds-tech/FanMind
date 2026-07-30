import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import {
  access,
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { promisify } from "node:util";
import test from "node:test";

import {
  RESTORE_READINESS_CONFIRMATION,
  RESTORE_TARGET_ACKNOWLEDGEMENT,
  evaluateRestoreReadiness,
  evaluateRestoreTarget,
  normalizeHost,
  normalizePort,
} from "../src/lib/restoreTargetPolicy.mjs";

const execFileAsync = promisify(execFile);
const scriptPath = "scripts/operations/restore-target-preflight.mjs";
const readinessScriptPath =
  "scripts/operations/restore-drill-resource-readiness.mjs";
const readinessWorkflowPath =
  ".github/workflows/restore-drill-resource-readiness.yml";
const runnerPath = "scripts/operations/run-database-restore-drill.sh";
const runbookPath = "docs/operations/RESTORE_DRILL.md";
const packagePath = "package.json";

function safeEnvironment(overrides = {}) {
  return {
    FANMIND_RUNTIME_ENVIRONMENT: "test",
    NEXT_PUBLIC_APP_URL: "https://restore-test.fanmind.example",
    NEXT_PUBLIC_SUPABASE_URL: "https://restoretestref1.supabase.co",
    FANMIND_TARGET_SUPABASE_PROJECT_REF: "restoretestref1",
    FANMIND_PRODUCTION_SUPABASE_PROJECT_REF: "productionref123",
    FANMIND_ENABLE_NON_PRODUCTION_WRITES: "true",
    FANMIND_NON_PRODUCTION_WRITE_ACK: "I_UNDERSTAND_NON_PRODUCTION_ONLY",
    FANMIND_ENABLE_RESTORE_DRILL: "true",
    FANMIND_RESTORE_TARGET_ACK: RESTORE_TARGET_ACKNOWLEDGEMENT,
    PGHOST: "restore-db.internal",
    PGPORT: "5432",
    PGDATABASE: "fanmind_restore",
    PGUSER: "restore_operator",
    PGPASSFILE: "/secure/keys/restore.pgpass",
    PGPASSWORD: "",
    PGHOSTADDR: "",
    PGSERVICE: "",
    PGSERVICEFILE: "",
    FANMIND_RESTORE_TARGET_DB_HOST: "restore-db.internal",
    FANMIND_RESTORE_TARGET_DB_PORT: "5432",
    FANMIND_RESTORE_TARGET_DB_NAME: "fanmind_restore",
    FANMIND_RESTORE_TARGET_DB_USER: "restore_operator",
    FANMIND_PRODUCTION_DB_HOST: "db.production.internal",
    FANMIND_PRODUCTION_DB_PORT: "6543",
    FANMIND_PRODUCTION_DB_NAME: "postgres",
    FANMIND_PRODUCTION_DB_USER: "postgres.productionref123",
    ...overrides,
  };
}

function safeReadinessEnvironment(overrides = {}) {
  return safeEnvironment({
    FANMIND_ENABLE_NON_PRODUCTION_WRITES: "false",
    FANMIND_NON_PRODUCTION_WRITE_ACK: "",
    FANMIND_ENABLE_RESTORE_DRILL: "false",
    FANMIND_RESTORE_TARGET_ACK: "",
    FANMIND_RESTORE_READINESS_CONFIRM: RESTORE_READINESS_CONFIRMATION,
    PGHOST: "",
    PGPORT: "",
    PGDATABASE: "",
    PGUSER: "",
    PGPASSFILE: "",
    ...overrides,
  });
}

async function restoreRunnerEnvironment(root, dumpPath, overrides = {}) {
  const receiptPath = join(root, "full-backup-receipt.json");
  const runnerReceiptPath = join(root, "restore-runner-receipt.json");
  const fakePsqlPath = join(root, "fake-psql.sh");
  const dumpBytes = await readFile(dumpPath);
  const dumpSha256 = createHash("sha256").update(dumpBytes).digest("hex");
  const fullReceipt = {
    schemaVersion: 1,
    createdAt: "2026-07-30T07:55:00Z",
    sourceArtifactBasename: "fanmind-full-1785398400000.tar.gz.age",
    outerSha256: "a".repeat(64),
    productionCommit: "b".repeat(40),
    databasePartEncryptedSha256: "d".repeat(64),
    databaseDumpSha256: dumpSha256,
    verifier: "passed",
  };
  await writeFile(receiptPath, `${JSON.stringify(fullReceipt)}\n`);
  await chmod(receiptPath, 0o600);
  await writeFile(
    fakePsqlPath,
    [
      "#!/usr/bin/env bash",
      "set -Eeuo pipefail",
      "if [[ -n \"${FANMIND_TEST_EMPTY_QUERY_MARKER_PATH:-}\" ]]; then",
      "  {",
      "    printf 'ARGS='",
      "    printf '%q ' \"$@\"",
      "    printf '\\nPGPASSFILE=%s\\n' \"$PGPASSFILE\"",
      "  } > \"$FANMIND_TEST_EMPTY_QUERY_MARKER_PATH\"",
      "fi",
      "printf '%s\\n' \"${FANMIND_TEST_EMPTY_TARGET_RESULT:-0}\"",
      "",
    ].join("\n"),
  );
  await chmod(fakePsqlPath, 0o755);

  return {
    FANMIND_OPERATIONAL_TEST_MODE: "restore-runner-test",
    FANMIND_PSQL_BIN: fakePsqlPath,
    FANMIND_FULL_BACKUP_RESTORE_RECEIPT_PATH: receiptPath,
    FANMIND_RESTORE_RUNNER_RECEIPT_PATH: runnerReceiptPath,
    FANMIND_RESTORE_DRILL_ID: "2026-07-30-restore-001",
    FANMIND_RESTORE_DISPOSABLE_TARGET_ID:
      "123e4567-e89b-42d3-a456-426614174000",
    FANMIND_RESTORE_PRODUCTION_COMMIT: "b".repeat(40),
    ...overrides,
  };
}

test("read-only restore readiness confirms isolation without enabling a restore", () => {
  const result = evaluateRestoreReadiness(safeReadinessEnvironment());

  assert.equal(result.ok, true);
  assert.equal(result.mode, "isolated-restore-readiness");
  assert.equal(result.environmentBoundaryOk, true);
  assert.equal(result.targetConfirmed, true);
  assert.equal(result.productionHostSeparated, true);
  assert.equal(result.hiddenTargetOverridesClear, true);

  const unsafe = evaluateRestoreReadiness(
    safeReadinessEnvironment({
      FANMIND_RUNTIME_ENVIRONMENT: "production",
      NEXT_PUBLIC_APP_URL: "https://fanmind.ch",
      NEXT_PUBLIC_SUPABASE_URL:
        "https://productionref123.supabase.co",
      FANMIND_TARGET_SUPABASE_PROJECT_REF: "productionref123",
      FANMIND_ENABLE_RESTORE_DRILL: "true",
      FANMIND_RESTORE_TARGET_ACK: RESTORE_TARGET_ACKNOWLEDGEMENT,
      FANMIND_RESTORE_TARGET_DB_HOST: "db.production.internal",
    }),
  );
  assert.equal(unsafe.ok, false);
  assert.ok(unsafe.errors.includes("runtime_environment"));
  assert.ok(unsafe.errors.includes("production_boundary"));
  assert.ok(unsafe.errors.includes("restore_write_gate"));
  assert.ok(unsafe.errors.includes("production_database_target"));

  const incomplete = evaluateRestoreReadiness(
    safeReadinessEnvironment({
      FANMIND_PRODUCTION_SUPABASE_PROJECT_REF: "",
      FANMIND_ENABLE_NON_PRODUCTION_WRITES: "",
    }),
  );
  assert.equal(incomplete.ok, false);
  assert.ok(incomplete.errors.includes("production_boundary"));
  assert.ok(incomplete.errors.includes("non_production_write_gate"));
});

test("restore resource runner verifies only the encrypted full-backup checksum", async () => {
  const root = await mkdtemp(join(tmpdir(), "fanmind-restore-readiness-"));
  try {
    const secretMarker = "never-print-restore-resource";
    const artifactPath = join(
      root,
      "fanmind-full-20260727T120000Z.tar.gz.age",
    );
    const content = Buffer.from(`encrypted-${secretMarker}`);
    const digest = createHash("sha256").update(content).digest("hex");
    await writeFile(artifactPath, content);
    await writeFile(
      `${artifactPath}.sha256`,
      `${digest}  fanmind-full-20260727T120000Z.tar.gz.age\n`,
    );
    const before = await readFile(artifactPath);

    const { stdout, stderr } = await execFileAsync(
      process.execPath,
      [readinessScriptPath],
      {
        env: {
          ...process.env,
          ...safeReadinessEnvironment({
            FANMIND_RESTORE_ARTIFACT_PATH: artifactPath,
          }),
        },
      },
    );
    const output = `${stdout}\n${stderr}`;

    assert.match(output, /RESTORE_READINESS_MODE=checksum_only/);
    assert.match(output, /RESTORE_READINESS_DATABASE_CONNECTION=not_attempted/);
    assert.match(output, /RESTORE_READINESS_DECRYPTION=not_attempted/);
    assert.match(output, /RESTORE_READINESS_WRITES=disabled/);
    assert.match(output, /RESTORE_DRILL_RESOURCE_READINESS=PASS/);
    assert.doesNotMatch(output, new RegExp(secretMarker));
    assert.doesNotMatch(output, new RegExp(digest));
    assert.doesNotMatch(output, /fanmind-full-20260727/);
    assert.deepEqual(await readFile(artifactPath), before);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("manual restore readiness workflow is main-only and write-disabled", async () => {
  const [workflow, runbook, packageSource] = await Promise.all([
    readFile(readinessWorkflowPath, "utf8"),
    readFile(runbookPath, "utf8"),
    readFile(packagePath, "utf8"),
  ]);
  const packageJson = JSON.parse(packageSource);

  assert.match(workflow, /workflow_dispatch:/);
  assert.match(
    workflow,
    /inputs\.confirmation == 'verify-isolated-restore-resources'/,
  );
  assert.match(workflow, /github\.ref == 'refs\/heads\/main'/);
  assert.match(workflow, /runs-on: \[self-hosted, fanmind-restore, linux, x64\]/);
  assert.match(workflow, /environment: restore-drill/);
  assert.match(workflow, /FANMIND_ENABLE_NON_PRODUCTION_WRITES: 'false'/);
  assert.match(workflow, /FANMIND_ENABLE_RESTORE_DRILL: 'false'/);
  assert.match(workflow, /npm run restore:resources:preflight/);
  assert.doesNotMatch(
    workflow,
    /restore:database:drill|pg_restore|--identity|FANMIND_BACKUP_AGE_IDENTITY/,
  );
  assert.equal(
    packageJson.scripts["restore:resources:preflight"],
    "node scripts/operations/restore-drill-resource-readiness.mjs",
  );
  assert.match(runbook, /FanMind Restore Drill Resource Readiness/);
  assert.match(runbook, /RESTORE_DRILL_RESOURCE_READINESS=PASS/);
});

test("isolated restore target passes only with both boundaries and exact target binding", () => {
  const result = evaluateRestoreTarget(safeEnvironment());

  assert.equal(result.ok, true);
  assert.equal(result.environmentBoundaryOk, true);
  assert.equal(result.restoreEnabled, true);
  assert.equal(result.acknowledgementConfirmed, true);
  assert.equal(result.targetConfirmed, true);
  assert.equal(result.actualTargetCanonical, true);
  assert.equal(result.productionHostSeparated, true);
  assert.equal(result.productionSeparated, true);
  assert.equal(result.hiddenTargetOverridesClear, true);
});

test("restore target normalization accepts canonical hosts and valid ports only", () => {
  assert.equal(normalizeHost("DB.Example.COM."), "db.example.com");
  assert.equal(normalizeHost("[2001:db8::1]"), "2001:db8::1");
  assert.equal(
    normalizeHost("2001:0db8:0:0:0:0:0:1"),
    "2001:db8::1",
  );
  assert.equal(normalizeHost("127.1"), null);
  assert.equal(normalizeHost("127.000.000.001"), null);
  assert.equal(normalizeHost("0x7f.1"), null);
  assert.equal(normalizeHost("db-one,db-two"), null);
  assert.equal(normalizeHost("postgresql://db.example.com"), null);
  assert.equal(normalizePort("05432"), "5432");
  assert.equal(normalizePort("0"), null);
  assert.equal(normalizePort("65536"), null);
});

test("shared write boundary remains mandatory for restore drills", () => {
  const result = evaluateRestoreTarget(
    safeEnvironment({
      FANMIND_RUNTIME_ENVIRONMENT: "production",
      NEXT_PUBLIC_APP_URL: "https://fanmind.ch",
      NEXT_PUBLIC_SUPABASE_URL: "https://productionref123.supabase.co",
      FANMIND_TARGET_SUPABASE_PROJECT_REF: "productionref123",
    }),
  );

  assert.equal(result.ok, false);
  assert.equal(result.environmentBoundaryOk, false);
  assert.match(result.errors.join("\n"), /Umgebungsgrenze/);
  assert.match(result.errors.join("\n"), /staging oder test/);
  assert.match(result.errors.join("\n"), /Production-Supabase-Projekt/);
});

test("exact Production database tuple is always rejected", () => {
  const result = evaluateRestoreTarget(
    safeEnvironment({
      PGHOST: "db.production.internal",
      PGPORT: "6543",
      PGDATABASE: "postgres",
      PGUSER: "postgres.productionref123",
      FANMIND_RESTORE_TARGET_DB_HOST: "db.production.internal",
      FANMIND_RESTORE_TARGET_DB_PORT: "6543",
      FANMIND_RESTORE_TARGET_DB_NAME: "postgres",
      FANMIND_RESTORE_TARGET_DB_USER: "postgres.productionref123",
    }),
  );

  assert.equal(result.ok, false);
  assert.equal(result.targetConfirmed, true);
  assert.equal(result.productionHostSeparated, false);
  assert.equal(result.productionSeparated, false);
  assert.match(result.errors.join("\n"), /Production-Datenbankhost/);
});

test("every target on the Production database host is rejected independently of tuple fields", () => {
  const result = evaluateRestoreTarget(
    safeEnvironment({
      PGHOST: "db.production.internal",
      PGPORT: "7432",
      PGDATABASE: "fanmind_restore_isolated",
      PGUSER: "restore_only_operator",
      FANMIND_RESTORE_TARGET_DB_HOST: "db.production.internal",
      FANMIND_RESTORE_TARGET_DB_PORT: "7432",
      FANMIND_RESTORE_TARGET_DB_NAME: "fanmind_restore_isolated",
      FANMIND_RESTORE_TARGET_DB_USER: "restore_only_operator",
    }),
  );

  assert.equal(result.targetConfirmed, true);
  assert.equal(result.productionHostSeparated, false);
  assert.equal(result.productionSeparated, false);
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /Production-Datenbankhost/);
});

test("equivalent numeric Production endpoints cannot bypass host separation", () => {
  const cases = [
    ["127.1", "127.0.0.1"],
    ["127.000.000.001", "127.0.0.1"],
    ["2001:db8::1", "2001:0db8:0:0:0:0:0:1"],
  ];

  for (const [actualHost, productionHost] of cases) {
    const result = evaluateRestoreTarget(
      safeEnvironment({
        PGHOST: actualHost,
        FANMIND_RESTORE_TARGET_DB_HOST: actualHost,
        FANMIND_PRODUCTION_DB_HOST: productionHost,
      }),
    );
    assert.equal(result.ok, false, `${actualHost} -> ${productionHost}`);
    assert.equal(
      result.productionSeparated,
      false,
      `${actualHost} -> ${productionHost}`,
    );
  }
});

test("actual pg_restore values must already equal their canonical checked form", () => {
  const cases = [
    ["PGHOST", "Restore-DB.Internal."],
    ["PGPORT", "05432"],
    ["PGDATABASE", "fanmind_restore "],
    ["PGUSER", " restore_operator"],
  ];

  for (const [name, value] of cases) {
    const result = evaluateRestoreTarget(safeEnvironment({ [name]: value }));
    assert.equal(result.targetConfirmed, true, name);
    assert.equal(result.actualTargetValid, true, name);
    assert.equal(result.actualTargetCanonical, false, name);
    assert.equal(result.ok, false, name);
    assert.match(result.errors.join("\n"), /bereits kanonisch/, name);
  }
});

test("every actual pg_restore target field must match the explicit confirmation", () => {
  const cases = [
    ["PGHOST", "other-db.internal"],
    ["PGPORT", "6432"],
    ["PGDATABASE", "other_restore"],
    ["PGUSER", "other_operator"],
  ];

  for (const [name, value] of cases) {
    const result = evaluateRestoreTarget(safeEnvironment({ [name]: value }));
    assert.equal(result.ok, false, name);
    assert.equal(result.targetConfirmed, false, name);
    assert.match(result.errors.join("\n"), /stimmen nicht exakt/, name);
  }
});

test("connection strings, multi-host routing and hidden libpq target overrides fail closed", () => {
  const connectionString = evaluateRestoreTarget(
    safeEnvironment({
      PGDATABASE:
        "postgresql://restore_operator@example.invalid/fanmind_restore",
    }),
  );
  assert.equal(connectionString.ok, false);
  assert.equal(connectionString.actualTargetValid, false);
  assert.match(connectionString.errors.join("\n"), /Connection-Strings/);

  const hiddenOverride = evaluateRestoreTarget(
    safeEnvironment({
      PGHOSTADDR: "203.0.113.10",
      PGSERVICE: "hidden-target",
    }),
  );
  assert.equal(hiddenOverride.ok, false);
  assert.equal(hiddenOverride.hiddenTargetOverridesClear, false);
  assert.match(hiddenOverride.errors.join("\n"), /PGHOSTADDR, PGSERVICE/);

  const sharedPooler = evaluateRestoreTarget(
    safeEnvironment({
      PGHOST: "aws-0-eu-central-1.pooler.supabase.com",
      FANMIND_RESTORE_TARGET_DB_HOST:
        "aws-0-eu-central-1.pooler.supabase.com",
    }),
  );
  assert.equal(sharedPooler.ok, false);
  assert.equal(sharedPooler.sharedSupabasePooler, true);
  assert.match(sharedPooler.errors.join("\n"), /Shared Supabase-Pooler/);
});

test("direct Supabase restore hosts must belong to the confirmed target project", () => {
  const matching = evaluateRestoreTarget(
    safeEnvironment({
      PGHOST: "db.restoretestref1.supabase.co",
      FANMIND_RESTORE_TARGET_DB_HOST:
        "db.restoretestref1.supabase.co",
    }),
  );
  assert.equal(matching.ok, true);
  assert.equal(matching.directSupabaseProjectBound, true);

  const mismatched = evaluateRestoreTarget(
    safeEnvironment({
      PGHOST: "db.otherprojectref.supabase.co",
      FANMIND_RESTORE_TARGET_DB_HOST:
        "db.otherprojectref.supabase.co",
    }),
  );
  assert.equal(mismatched.ok, false);
  assert.equal(mismatched.directSupabaseProjectBound, false);
  assert.match(mismatched.errors.join("\n"), /Zielprojektreferenz/);
});

test("Production comparison and protected passfile are mandatory without PGPASSWORD", () => {
  const missingComparison = evaluateRestoreTarget(
    safeEnvironment({
      FANMIND_PRODUCTION_DB_HOST: "",
      FANMIND_PRODUCTION_DB_PORT: "",
      FANMIND_PRODUCTION_DB_NAME: "",
      FANMIND_PRODUCTION_DB_USER: "",
      PGPASSFILE: "",
      PGPASSWORD: "must-never-be-logged",
    }),
  );

  assert.equal(missingComparison.ok, false);
  assert.equal(missingComparison.productionTargetComplete, false);
  assert.equal(missingComparison.passfileConfigured, false);
  assert.equal(missingComparison.passwordInEnvironment, true);
  assert.match(missingComparison.errors.join("\n"), /Production-Vergleich/);
  assert.match(missingComparison.errors.join("\n"), /PGPASSFILE/);
  assert.match(missingComparison.errors.join("\n"), /PGPASSWORD/);

  const relativePassfile = evaluateRestoreTarget(
    safeEnvironment({ PGPASSFILE: "relative/restore.pgpass" }),
  );
  assert.equal(relativePassfile.ok, false);
  assert.equal(relativePassfile.passfileAbsolute, false);
  assert.match(relativePassfile.errors.join("\n"), /absoluter Pfad/);
});

test("CLI reports only redacted gate state", async () => {
  const environment = {
    ...process.env,
    ...safeEnvironment(),
  };
  const { stdout, stderr } = await execFileAsync(
    process.execPath,
    [scriptPath],
    { env: environment },
  );
  const output = `${stdout}\n${stderr}`;

  assert.match(output, /ENVIRONMENT_BOUNDARY=ok/);
  assert.match(output, /RESTORE_TARGET=confirmed/);
  assert.match(output, /RESTORE_INPUT=canonical/);
  assert.match(output, /PRODUCTION_TARGET=separate/);
  assert.match(output, /LIBPQ_TARGET_OVERRIDES=clear/);
  assert.match(output, /DATABASE_PASSWORD_SOURCE=passfile/);
  assert.match(output, /SECRETS_WURDEN_NICHT_AUSGEGEBEN=true/);
  assert.match(output, /RESTORE_TARGET_BOUNDARY=OK/);

  for (const value of [
    "restore-db.internal",
    "fanmind_restore",
    "restore_operator",
    "db.production.internal",
    "postgres.productionref123",
    "/secure/keys/restore.pgpass",
  ]) {
    assert.doesNotMatch(output, new RegExp(value.replaceAll(".", "\\.")));
  }
});

test("failing CLI output remains redacted", async () => {
  const sensitiveValues = [
    "sensitive-restore-host.internal",
    "sensitive_restore_database",
    "sensitive_restore_user",
    "/sensitive/passfiles/restore.pgpass",
    "sensitive-database-password",
  ];
  const environment = {
    ...process.env,
    ...safeEnvironment({
      PGHOST: sensitiveValues[0],
      PGDATABASE: sensitiveValues[1],
      PGUSER: sensitiveValues[2],
      PGPASSFILE: sensitiveValues[3],
      PGPASSWORD: sensitiveValues[4],
    }),
  };

  await assert.rejects(
    execFileAsync(process.execPath, [scriptPath], { env: environment }),
    (error) => {
      const output = `${String(error.stdout)}\n${String(error.stderr)}`;
      assert.match(output, /RESTORE_TARGET_BOUNDARY=OK|RESTORE_ERROR=/);
      assert.doesNotMatch(output, /RESTORE_TARGET_BOUNDARY=OK/);
      assert.match(output, /SECRETS_WURDEN_NICHT_AUSGEGEBEN=true/);
      for (const value of sensitiveValues) {
        assert.doesNotMatch(
          output,
          new RegExp(value.replaceAll(".", "\\.").replaceAll("/", "\\/")),
        );
      }
      return true;
    },
  );
});

test("restore runner freezes the checked target and passes only explicit connection arguments", async () => {
  const root = await mkdtemp(join(tmpdir(), "fanmind-restore-runner-test-"));
  try {
    const dumpPath = join(root, "fanmind-database-test.dump");
    const fakeRestorePath = join(root, "fake-pg-restore.sh");
    const capturePath = join(root, "capture.txt");
    const passfilePath = join(root, "restore.pgpass");
    const listMarkerPath = join(root, "list-validated.txt");
    const emptyQueryMarkerPath = join(root, "empty-query.txt");
    await writeFile(dumpPath, "synthetic-dump");
    await chmod(dumpPath, 0o600);
    await writeFile(passfilePath, "synthetic-password-file");
    await chmod(passfilePath, 0o600);
    await writeFile(
      fakeRestorePath,
      [
        "#!/usr/bin/env bash",
        "set -Eeuo pipefail",
        "if [[ \"${1:-}\" == \"--list\" ]]; then",
        "  printf '%s\\n' \"${2:-}\" > \"$FANMIND_TEST_LIST_MARKER_PATH\"",
        "  exit 0",
        "fi",
        "[[ -s \"$FANMIND_TEST_EMPTY_QUERY_MARKER_PATH\" ]]",
        "write_dump_path=\"${@: -1}\"",
        "list_dump_path=\"$(cat \"$FANMIND_TEST_LIST_MARKER_PATH\")\"",
        "[[ \"$list_dump_path\" == \"$write_dump_path\" ]]",
        "{",
        "  printf 'ARGS='",
        "  printf '%q ' \"$@\"",
        "  printf '\\n'",
        "  printf 'PGHOST_SET=%s\\n' \"${PGHOST+x}\"",
        "  printf 'PGPORT_SET=%s\\n' \"${PGPORT+x}\"",
        "  printf 'PGDATABASE_SET=%s\\n' \"${PGDATABASE+x}\"",
        "  printf 'PGUSER_SET=%s\\n' \"${PGUSER+x}\"",
        "  printf 'PGHOSTADDR_SET=%s\\n' \"${PGHOSTADDR+x}\"",
        "  printf 'PGSERVICE_SET=%s\\n' \"${PGSERVICE+x}\"",
        "  printf 'PGSERVICEFILE_SET=%s\\n' \"${PGSERVICEFILE+x}\"",
        "  printf 'PGPASSWORD_SET=%s\\n' \"${PGPASSWORD+x}\"",
        "  printf 'PGPASSFILE=%s\\n' \"$PGPASSFILE\"",
        "} > \"$FANMIND_TEST_CAPTURE_PATH\"",
        "",
      ].join("\n"),
    );
    await chmod(fakeRestorePath, 0o755);
    const runnerEnvironment = await restoreRunnerEnvironment(root, dumpPath);

    const { stdout, stderr } = await execFileAsync(
      "bash",
      [runnerPath, dumpPath],
      {
        env: {
          ...process.env,
          ...safeEnvironment({ PGPASSFILE: passfilePath }),
          ...runnerEnvironment,
          FANMIND_PG_RESTORE_BIN: fakeRestorePath,
          FANMIND_TEST_CAPTURE_PATH: capturePath,
          FANMIND_TEST_LIST_MARKER_PATH: listMarkerPath,
          FANMIND_TEST_EMPTY_QUERY_MARKER_PATH: emptyQueryMarkerPath,
        },
      },
    );
    const output = `${stdout}\n${stderr}`;
    const capture = await readFile(capturePath, "utf8");
    const emptyQueryCapture = await readFile(emptyQueryMarkerPath, "utf8");

    assert.match(output, /RESTORE_TARGET_BOUNDARY=OK/);
    const validatedSnapshotPath = (await readFile(listMarkerPath, "utf8")).trim();
    assert.match(validatedSnapshotPath, /fanmind-restore\.[^/]+\/database\.dump$/u);
    assert.doesNotMatch(validatedSnapshotPath, new RegExp(dumpPath.replaceAll(".", "\\.")));
    assert.match(
      capture,
      /ARGS=--no-owner --no-privileges --exit-on-error --single-transaction --no-password --host restore-db\.internal --port 5432 --username restore_operator --dbname fanmind_restore /,
    );
    assert.doesNotMatch(capture, new RegExp(`${dumpPath.replaceAll(".", "\\.")}\\s`));
    assert.match(capture, /fanmind-restore\.[^/]+\/database\.dump\s/u);
    assert.match(
      emptyQueryCapture,
      /ARGS=--no-psqlrc --no-align --tuples-only --quiet --set ON_ERROR_STOP=1 --no-password --host restore-db\.internal --port 5432 --username restore_operator --dbname fanmind_restore --command /u,
    );
    const snapshotPassfileMatch = capture.match(/^PGPASSFILE=(.+)$/mu);
    assert.ok(snapshotPassfileMatch);
    const snapshotPassfilePath = snapshotPassfileMatch[1];
    assert.match(snapshotPassfilePath, /fanmind-restore\.[^/]+\/restore\.pgpass$/u);
    assert.notEqual(snapshotPassfilePath, passfilePath);
    assert.equal(dirname(snapshotPassfilePath), dirname(validatedSnapshotPath));
    for (const name of [
      "PGHOST",
      "PGPORT",
      "PGDATABASE",
      "PGUSER",
      "PGHOSTADDR",
      "PGSERVICE",
      "PGSERVICEFILE",
      "PGPASSWORD",
    ]) {
      assert.match(capture, new RegExp(`${name}_SET=\\n`));
    }
    const runnerReceipt = JSON.parse(
      await readFile(
        runnerEnvironment.FANMIND_RESTORE_RUNNER_RECEIPT_PATH,
        "utf8",
      ),
    );
    assert.equal(runnerReceipt.databaseRestore, "passed");
    assert.equal(runnerReceipt.emptyTargetObjectCount, 0);
    assert.equal(runnerReceipt.singleTransaction, true);
    await assert.rejects(access(dirname(validatedSnapshotPath)), /ENOENT/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("restore runner proves an empty target before writing or creating a receipt", async () => {
  const root = await mkdtemp(join(tmpdir(), "fanmind-restore-empty-target-test-"));
  try {
    const dumpPath = join(root, "fanmind-database-test.dump");
    const fakeRestorePath = join(root, "fake-pg-restore.sh");
    const passfilePath = join(root, "restore.pgpass");
    const writeInvokedPath = join(root, "write-invoked.txt");
    await writeFile(dumpPath, "synthetic-dump");
    await chmod(dumpPath, 0o600);
    await writeFile(passfilePath, "synthetic-password-file");
    await chmod(passfilePath, 0o600);
    await writeFile(
      fakeRestorePath,
      [
        "#!/usr/bin/env bash",
        "set -Eeuo pipefail",
        "if [[ \"${1:-}\" == \"--list\" ]]; then exit 0; fi",
        "printf 'write-invoked\\n' > \"$FANMIND_TEST_WRITE_INVOKED_PATH\"",
        "",
      ].join("\n"),
    );
    await chmod(fakeRestorePath, 0o755);
    const runnerEnvironment = await restoreRunnerEnvironment(root, dumpPath, {
      FANMIND_TEST_EMPTY_TARGET_RESULT: "1",
    });

    await assert.rejects(
      execFileAsync("bash", [runnerPath, dumpPath], {
        env: {
          ...process.env,
          ...safeEnvironment({ PGPASSFILE: passfilePath }),
          ...runnerEnvironment,
          FANMIND_PG_RESTORE_BIN: fakeRestorePath,
          FANMIND_TEST_WRITE_INVOKED_PATH: writeInvokedPath,
        },
      }),
      (error) => {
        assert.match(String(error.stderr), /restore_target_not_empty/u);
        return true;
      },
    );
    await assert.rejects(readFile(writeInvokedPath, "utf8"), /ENOENT/u);
    await assert.rejects(
      readFile(
        runnerEnvironment.FANMIND_RESTORE_RUNNER_RECEIPT_PATH,
        "utf8",
      ),
      /ENOENT/u,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("restore runner binary overrides require the exact test-only gate", async () => {
  const root = await mkdtemp(join(tmpdir(), "fanmind-restore-override-test-"));
  try {
    const dumpPath = join(root, "fanmind-database-test.dump");
    const fakeRestorePath = join(root, "fake-pg-restore.sh");
    const passfilePath = join(root, "restore.pgpass");
    await writeFile(dumpPath, "synthetic-dump");
    await chmod(dumpPath, 0o600);
    await writeFile(passfilePath, "synthetic-password-file");
    await chmod(passfilePath, 0o600);
    await writeFile(fakeRestorePath, "#!/usr/bin/env bash\nexit 0\n");
    await chmod(fakeRestorePath, 0o755);
    const runnerEnvironment = await restoreRunnerEnvironment(root, dumpPath, {
      FANMIND_OPERATIONAL_TEST_MODE: "",
    });

    await assert.rejects(
      execFileAsync("bash", [runnerPath, dumpPath], {
        env: {
          ...process.env,
          ...safeEnvironment({ PGPASSFILE: passfilePath }),
          ...runnerEnvironment,
          FANMIND_PG_RESTORE_BIN: fakeRestorePath,
        },
      }),
      /operational_binary_override_forbidden/u,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("restore runner rejects permissive passfiles before invoking pg_restore", async () => {
  const root = await mkdtemp(join(tmpdir(), "fanmind-restore-passfile-test-"));
  try {
    const dumpPath = join(root, "fanmind-database-test.dump");
    const fakeRestorePath = join(root, "fake-pg-restore.sh");
    const passfilePath = join(root, "restore.pgpass");
    const invokedPath = join(root, "invoked.txt");
    await writeFile(dumpPath, "synthetic-dump");
    await chmod(dumpPath, 0o600);
    await writeFile(passfilePath, "synthetic-password-file");
    await chmod(passfilePath, 0o644);
    await writeFile(
      fakeRestorePath,
      [
        "#!/usr/bin/env bash",
        "set -Eeuo pipefail",
        "printf 'invoked\\n' > \"$FANMIND_TEST_INVOKED_PATH\"",
        "",
      ].join("\n"),
    );
    await chmod(fakeRestorePath, 0o755);
    const runnerEnvironment = await restoreRunnerEnvironment(root, dumpPath);

    await assert.rejects(
      execFileAsync("bash", [runnerPath, dumpPath], {
        env: {
          ...process.env,
          ...safeEnvironment({ PGPASSFILE: passfilePath }),
          ...runnerEnvironment,
          FANMIND_PG_RESTORE_BIN: fakeRestorePath,
          FANMIND_TEST_INVOKED_PATH: invokedPath,
        },
      }),
      (error) => {
        assert.match(String(error.stderr), /passfile_permissions_too_open/);
        return true;
      },
    );
    await assert.rejects(readFile(invokedPath, "utf8"), /ENOENT/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("restore runner rejects a passfile owned by another user before invoking pg_restore", async () => {
  const root = await mkdtemp(join(tmpdir(), "fanmind-restore-passfile-owner-test-"));
  try {
    const dumpPath = join(root, "fanmind-database-test.dump");
    const fakeBinDirectory = join(root, "bin");
    const fakeStatPath = join(fakeBinDirectory, "stat");
    const fakeRestorePath = join(root, "fake-pg-restore.sh");
    const passfilePath = join(root, "restore.pgpass");
    const invokedPath = join(root, "invoked.txt");
    await mkdir(fakeBinDirectory, { recursive: true });
    await writeFile(dumpPath, "synthetic-dump");
    await chmod(dumpPath, 0o600);
    await writeFile(passfilePath, "synthetic-password-file");
    await chmod(passfilePath, 0o600);
    await writeFile(
      fakeStatPath,
      [
        "#!/usr/bin/env bash",
        "set -Eeuo pipefail",
        "target=\"${@: -1}\"",
        "if [[ \"$target\" != /proc/self/fd/* ]]; then",
        "  exec /usr/bin/stat \"$@\"",
        "fi",
        "printf '1 2 999999 600 81a0\\n'",
        "",
      ].join("\n"),
    );
    await writeFile(
      fakeRestorePath,
      [
        "#!/usr/bin/env bash",
        "set -Eeuo pipefail",
        "printf 'invoked\\n' > \"$FANMIND_TEST_INVOKED_PATH\"",
        "",
      ].join("\n"),
    );
    await chmod(fakeStatPath, 0o755);
    await chmod(fakeRestorePath, 0o755);
    const runnerEnvironment = await restoreRunnerEnvironment(root, dumpPath);

    await assert.rejects(
      execFileAsync("bash", [runnerPath, dumpPath], {
        env: {
          ...process.env,
          ...safeEnvironment({ PGPASSFILE: passfilePath }),
          ...runnerEnvironment,
          PATH: `${fakeBinDirectory}:${process.env.PATH ?? ""}`,
          FANMIND_PG_RESTORE_BIN: fakeRestorePath,
          FANMIND_TEST_INVOKED_PATH: invokedPath,
        },
      }),
      (error) => {
        const output = `${String(error.stdout)}\n${String(error.stderr)}`;
        assert.match(output, /passfile_owner_mismatch/);
        assert.doesNotMatch(output, new RegExp(passfilePath.replaceAll(".", "\\.")));
        return true;
      },
    );
    await assert.rejects(readFile(invokedPath, "utf8"), /ENOENT/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("restore runner rejects a source path swapped after it was opened", async () => {
  const root = await mkdtemp(join(tmpdir(), "fanmind-restore-source-swap-test-"));
  try {
    const dumpPath = join(root, "fanmind-database-test.dump");
    const fakeBinDirectory = join(root, "bin");
    const fakeStatPath = join(fakeBinDirectory, "stat");
    const fakeRestorePath = join(root, "fake-pg-restore.sh");
    const passfilePath = join(root, "restore.pgpass");
    const statStatePath = join(root, "stat-state.txt");
    const invokedPath = join(root, "invoked.txt");
    await mkdir(fakeBinDirectory, { recursive: true });
    await writeFile(dumpPath, "synthetic-dump");
    await chmod(dumpPath, 0o600);
    await writeFile(passfilePath, "synthetic-password-file");
    await chmod(passfilePath, 0o600);
    await writeFile(
      fakeStatPath,
      [
        "#!/usr/bin/env bash",
        "set -Eeuo pipefail",
        "target=\"${@: -1}\"",
        "if [[ \"$target\" != /proc/self/fd/* && \"$target\" != \"$PGPASSFILE\" ]]; then",
        "  exec /usr/bin/stat \"$@\"",
        "fi",
        "count=0",
        "[[ ! -f \"$FANMIND_TEST_STAT_STATE_PATH\" ]] || read -r count < \"$FANMIND_TEST_STAT_STATE_PATH\"",
        "count=$((count + 1))",
        "printf '%s\\n' \"$count\" > \"$FANMIND_TEST_STAT_STATE_PATH\"",
        "if [[ \"$count\" -eq 1 ]]; then",
        "  printf '1 2 %s 600 81a0\\n' \"$(id -u)\"",
        "else",
        "  printf '1 3 81a0\\n'",
        "fi",
        "",
      ].join("\n"),
    );
    await writeFile(
      fakeRestorePath,
      [
        "#!/usr/bin/env bash",
        "set -Eeuo pipefail",
        "printf 'invoked\\n' > \"$FANMIND_TEST_INVOKED_PATH\"",
        "",
      ].join("\n"),
    );
    await chmod(fakeStatPath, 0o755);
    await chmod(fakeRestorePath, 0o755);
    const runnerEnvironment = await restoreRunnerEnvironment(root, dumpPath);

    await assert.rejects(
      execFileAsync("bash", [runnerPath, dumpPath], {
        env: {
          ...process.env,
          ...safeEnvironment({ PGPASSFILE: passfilePath }),
          ...runnerEnvironment,
          PATH: `${fakeBinDirectory}:${process.env.PATH ?? ""}`,
          FANMIND_PG_RESTORE_BIN: fakeRestorePath,
          FANMIND_TEST_INVOKED_PATH: invokedPath,
          FANMIND_TEST_STAT_STATE_PATH: statStatePath,
        },
      }),
      (error) => {
        assert.match(
          `${String(error.stdout)}\n${String(error.stderr)}`,
          /passfile_path_changed_during_open/,
        );
        return true;
      },
    );
    await assert.rejects(readFile(invokedPath, "utf8"), /ENOENT/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("restore runner validates the dump archive before any write invocation", async () => {
  const root = await mkdtemp(join(tmpdir(), "fanmind-restore-archive-test-"));
  try {
    const dumpPath = join(root, "fanmind-database-invalid.dump");
    const fakeRestorePath = join(root, "fake-pg-restore.sh");
    const passfilePath = join(root, "restore.pgpass");
    const writeInvokedPath = join(root, "write-invoked.txt");
    const listMarkerPath = join(root, "list-attempted.txt");
    await writeFile(dumpPath, "invalid-synthetic-dump");
    await chmod(dumpPath, 0o600);
    await writeFile(passfilePath, "synthetic-password-file");
    await chmod(passfilePath, 0o600);
    await writeFile(
      fakeRestorePath,
      [
        "#!/usr/bin/env bash",
        "set -Eeuo pipefail",
        "if [[ \"${1:-}\" == \"--list\" ]]; then",
        "  printf '%s\\n' \"${2:-}\" > \"$FANMIND_TEST_LIST_MARKER_PATH\"",
        "  exit 1",
        "fi",
        "printf 'write-invoked\\n' > \"$FANMIND_TEST_WRITE_INVOKED_PATH\"",
        "",
      ].join("\n"),
    );
    await chmod(fakeRestorePath, 0o755);
    const runnerEnvironment = await restoreRunnerEnvironment(root, dumpPath);

    await assert.rejects(
      execFileAsync("bash", [runnerPath, dumpPath], {
        env: {
          ...process.env,
          ...safeEnvironment({ PGPASSFILE: passfilePath }),
          ...runnerEnvironment,
          FANMIND_PG_RESTORE_BIN: fakeRestorePath,
          FANMIND_TEST_WRITE_INVOKED_PATH: writeInvokedPath,
          FANMIND_TEST_LIST_MARKER_PATH: listMarkerPath,
        },
      }),
      (error) => {
        assert.match(String(error.stderr), /dump_archive_validation_failed/);
        return true;
      },
    );
    await assert.rejects(readFile(writeInvokedPath, "utf8"), /ENOENT/);
    const failedSnapshotPath = (await readFile(listMarkerPath, "utf8")).trim();
    await assert.rejects(access(dirname(failedSnapshotPath)), /ENOENT/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("runbook and package scripts require the gated runner for pg_restore", async () => {
  const [runbook, packageSource, runner] = await Promise.all([
    readFile(runbookPath, "utf8"),
    readFile(packagePath, "utf8"),
    readFile(runnerPath, "utf8"),
  ]);
  const packageJson = JSON.parse(packageSource);
  const preflightPosition = runbook.indexOf("npm run restore:preflight");
  const runnerPosition = runbook.indexOf("npm run restore:database:drill");

  assert.equal(
    packageJson.scripts["restore:preflight"],
    "node scripts/operations/restore-target-preflight.mjs",
  );
  assert.equal(
    packageJson.scripts["restore:database:drill"],
    "bash scripts/operations/run-database-restore-drill.sh",
  );
  assert.match(packageJson.scripts["test:operations"], /restore-target-policy\.test\.mjs/);
  assert.ok(preflightPosition >= 0);
  assert.ok(runnerPosition > preflightPosition);
  assert.match(runbook, /RESTORE_TARGET_BOUNDARY=OK/);
  assert.match(runbook, /PGHOSTADDR/);
  assert.match(runbook, /Connection-String/);
  assert.match(runbook, /target host differs from the Production database host/);
  assert.match(
    runbook,
    /receipts, the dump and the passfile must be regular, non-symlink files owned by\s+the operator/u,
  );
  assert.match(runbook, /pg_restore --list/);
  assert.ok(runner.indexOf("restore-target-preflight.mjs") < runner.indexOf("--list"));
  assert.ok(runner.indexOf("--list") < runner.indexOf("empty_target_sql"));
  assert.ok(runner.indexOf("empty_target_sql") < runner.indexOf("--single-transaction"));
  assert.match(runner, /readonly PGHOST PGPORT PGDATABASE PGUSER/);
  assert.match(runner, /owner_uid/);
  assert.match(runner, /path_changed_during_open/);
  assert.match(runner, /source_label}_permissions_too_open/);
  assert.match(runner, /dump_symlink_forbidden/);
  assert.match(runner, /passfile_symlink_forbidden/);
  assert.match(runner, /snapshot_dump/);
  assert.match(runner, /snapshot_passfile/);
  assert.match(runner, /snapshot_full_receipt/);
  assert.match(runner, /verify-full-backup-restore-receipt\.mjs/);
  assert.match(runner, /restore-runner-receipt\.mjs/);
  assert.match(runner, /restore_target_not_empty/);
  assert.match(runner, /FANMIND_OPERATIONAL_TEST_MODE/);
  assert.match(runner, /--single-transaction/);
  assert.match(runner, /-u PGHOSTADDR/);
  assert.match(runner, /-u PGSERVICE/);
  assert.match(runner, /-u PGSERVICEFILE/);
  assert.match(runner, /--host "\$PGHOST"/);
  assert.match(runner, /--port "\$PGPORT"/);
  assert.match(runner, /--username "\$PGUSER"/);
  assert.match(runner, /--dbname "\$PGDATABASE"/);
});
