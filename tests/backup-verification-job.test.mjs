import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.test";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-test";
process.env.FANMIND_BACKUP_PUBLIC_KEY_FILE = "/tmp/fanmind-verification-recipient.txt";
process.env.FANMIND_BACKUP_PGPASSFILE = "/tmp/fanmind-verification-pgpass";
process.env.FANMIND_BACKUP_DB_HOST = "db.test";
process.env.FANMIND_BACKUP_DB_USER = "postgres";
process.env.FANMIND_BACKUP_DB_NAME = "postgres";
await writeFile(process.env.FANMIND_BACKUP_PUBLIC_KEY_FILE, "age1test");
await writeFile(process.env.FANMIND_BACKUP_PGPASSFILE, "localhost:*:*:*:x");

const worker = await import("../scripts/operations/backup-worker.mjs");
const migration = await readFile(new URL("../supabase/migrations/20260718173000_enable_safe_backup_verification.sql", import.meta.url), "utf8");
const operationsSource = await readFile(new URL("../src/lib/backupOperations.ts", import.meta.url), "utf8");
const uiSource = await readFile(new URL("../src/app/admin/operations/BackupJobActions.tsx", import.meta.url), "utf8");

test("safe verification job is allowlisted end to end", () => {
  assert.equal(worker.JOBS.has("verify_backup"), true);
  assert.match(operationsSource, /"verify_backup"/);
  assert.match(uiSource, /Letztes Backup prüfen/);
  assert.match(uiSource, /checksum-only/);
});

test("verification migration grants only service_role claim access", () => {
  assert.match(migration, /verify_backup/);
  assert.match(migration, /backup_type in \([^)]*'verification'/s);
  assert.match(migration, /revoke all on function public\.claim_admin_backup_job\(text, integer\) from public, anon, authenticated;/i);
  assert.match(migration, /grant execute on function public\.claim_admin_backup_job\(text, integer\) to service_role;/i);
  assert.doesNotMatch(migration, /grant execute .* to (public|anon|authenticated)/i);
});

test("local backup pair must remain inside configured backup root", async () => {
  const root = await mkdtemp(join(tmpdir(), "fanmind-verification-root-"));
  const artifact = join(root, "fanmind-database-safe.dump.age");
  const checksum = `${artifact}.sha256`;
  await writeFile(artifact, "payload");
  await writeFile(checksum, "0".repeat(64) + "  fanmind-database-safe.dump.age\n");
  process.env.FANMIND_BACKUP_ROOT = root;
  const pair = await worker.validatedLocalBackupPair({ storage_reference:artifact, checksum_reference:checksum });
  assert.equal(pair.artifact, artifact);
  assert.equal(pair.checksum, checksum);
});

test("outside-root and mismatched checksum paths are rejected", async () => {
  const root = await mkdtemp(join(tmpdir(), "fanmind-verification-root-"));
  const outside = await mkdtemp(join(tmpdir(), "fanmind-verification-outside-"));
  const outsideArtifact = join(outside, "fanmind-database-outside.dump.age");
  const outsideChecksum = `${outsideArtifact}.sha256`;
  await writeFile(outsideArtifact, "payload");
  await writeFile(outsideChecksum, "0".repeat(64) + "  fanmind-database-outside.dump.age\n");
  process.env.FANMIND_BACKUP_ROOT = root;
  await assert.rejects(
    () => worker.validatedLocalBackupPair({ storage_reference:outsideArtifact, checksum_reference:outsideChecksum }),
    /backup_artifact_outside_root/,
  );

  const localArtifact = join(root, "fanmind-database-local.dump.age");
  const otherChecksum = join(root, "other.sha256");
  await writeFile(localArtifact, "payload");
  await writeFile(otherChecksum, "0".repeat(64) + "  other\n");
  await assert.rejects(
    () => worker.validatedLocalBackupPair({ storage_reference:localArtifact, checksum_reference:otherChecksum }),
    /backup_checksum_pair_mismatch/,
  );
});

test("worker never accepts a browser supplied artifact path", async () => {
  const workerSource = await readFile(new URL("../scripts/operations/backup-worker.mjs", import.meta.url), "utf8");
  assert.match(workerSource, /latestVerifiableBackupRun/);
  assert.match(workerSource, /source_backup_run_id/);
  assert.doesNotMatch(operationsSource, /artifactPath|checksumPath|storage_reference/);
});
