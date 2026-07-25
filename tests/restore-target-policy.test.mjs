import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import {
  chmod,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import test from "node:test";

import {
  RESTORE_TARGET_ACKNOWLEDGEMENT,
  evaluateRestoreTarget,
  normalizeHost,
  normalizePort,
} from "../src/lib/restoreTargetPolicy.mjs";

const execFileAsync = promisify(execFile);
const scriptPath = "scripts/operations/restore-target-preflight.mjs";
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

test("isolated restore target passes only with both boundaries and exact target binding", () => {
  const result = evaluateRestoreTarget(
    safeEnvironment({
      PGHOST: "Restore-DB.Internal.",
      PGPORT: "05432",
    }),
  );

  assert.equal(result.ok, true);
  assert.equal(result.environmentBoundaryOk, true);
  assert.equal(result.restoreEnabled, true);
  assert.equal(result.acknowledgementConfirmed, true);
  assert.equal(result.targetConfirmed, true);
  assert.equal(result.productionSeparated, true);
  assert.equal(result.hiddenTargetOverridesClear, true);
});

test("restore target normalization accepts canonical hosts and valid ports only", () => {
  assert.equal(normalizeHost("DB.Example.COM."), "db.example.com");
  assert.equal(normalizeHost("[2001:db8::1]"), "2001:db8::1");
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
  assert.equal(result.productionSeparated, false);
  assert.match(result.errors.join("\n"), /Production-Datenbank/);
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

test("restore runner freezes the checked target and passes only explicit connection arguments", async () => {
  const root = await mkdtemp(join(tmpdir(), "fanmind-restore-runner-test-"));
  try {
    const dumpPath = join(root, "fanmind-database-test.dump");
    const fakeRestorePath = join(root, "fake-pg-restore.sh");
    const capturePath = join(root, "capture.txt");
    const passfilePath = join(root, "restore.pgpass");
    await writeFile(dumpPath, "synthetic-dump");
    await writeFile(passfilePath, "synthetic-password-file");
    await writeFile(
      fakeRestorePath,
      [
        "#!/usr/bin/env bash",
        "set -Eeuo pipefail",
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
        "} > \"$FANMIND_TEST_CAPTURE_PATH\"",
        "",
      ].join("\n"),
    );
    await chmod(fakeRestorePath, 0o755);

    const { stdout, stderr } = await execFileAsync(
      "bash",
      [runnerPath, dumpPath],
      {
        env: {
          ...process.env,
          ...safeEnvironment({ PGPASSFILE: passfilePath }),
          FANMIND_PG_RESTORE_BIN: fakeRestorePath,
          FANMIND_TEST_CAPTURE_PATH: capturePath,
        },
      },
    );
    const output = `${stdout}\n${stderr}`;
    const capture = await readFile(capturePath, "utf8");

    assert.match(output, /RESTORE_TARGET_BOUNDARY=OK/);
    assert.match(
      capture,
      /ARGS=--no-owner --no-privileges --exit-on-error --no-password --host restore-db\.internal --port 5432 --username restore_operator --dbname fanmind_restore /,
    );
    assert.match(capture, new RegExp(`${dumpPath.replaceAll(".", "\\.")}\\s`));
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
  assert.ok(runner.indexOf("restore-target-preflight.mjs") < runner.indexOf("exec env"));
  assert.match(runner, /readonly PGHOST PGPORT PGDATABASE PGUSER/);
  assert.match(runner, /-u PGHOSTADDR/);
  assert.match(runner, /-u PGSERVICE/);
  assert.match(runner, /-u PGSERVICEFILE/);
  assert.match(runner, /--host "\$PGHOST"/);
  assert.match(runner, /--port "\$PGPORT"/);
  assert.match(runner, /--username "\$PGUSER"/);
  assert.match(runner, /--dbname "\$PGDATABASE"/);
});
