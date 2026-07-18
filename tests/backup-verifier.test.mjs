import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

import {
  assertSafeArchiveEntry,
  detectBackupType,
  parseChecksumLine,
  sha256File,
  verifyChecksumPair,
  verifyFullManifest,
  verifyStorageManifest,
} from "../scripts/operations/verify-backup-artifact.mjs";

function hash(content) {
  return createHash("sha256").update(content).digest("hex");
}

test("checksum parser accepts standard sha256sum format", () => {
  const parsed = parseChecksumLine(
    "a".repeat(64) + "  fanmind-database-1.dump.age\n",
  );
  assert.equal(parsed.sha256, "a".repeat(64));
  assert.equal(parsed.fileName, "fanmind-database-1.dump.age");
});

test("archive entry guard rejects absolute paths and traversal", () => {
  assert.equal(assertSafeArchiveEntry("./manifest.json"), true);
  assert.equal(assertSafeArchiveEntry("storage/avatar.png"), true);
  assert.throws(() => assertSafeArchiveEntry("../../etc/passwd"), /unsafe_archive_entry/);
  assert.throws(() => assertSafeArchiveEntry("/etc/passwd"), /unsafe_archive_entry/);
  assert.throws(() => assertSafeArchiveEntry("folder\\evil"), /unsafe_archive_entry/);
});

test("backup type detection recognizes all supported artifacts", () => {
  assert.equal(detectBackupType("fanmind-database-1.dump.age"), "database");
  assert.equal(detectBackupType("fanmind-storage-1.tar.gz.age"), "storage");
  assert.equal(
    detectBackupType("fanmind-server-config-1.tar.gz.age"),
    "server_config",
  );
  assert.equal(detectBackupType("fanmind-full-1.tar.gz.age"), "full");
  assert.throws(() => detectBackupType("random.age"), /unknown_backup_type/);
});

test("checksum verification is read-only and catches mismatches", async () => {
  const root = await mkdtemp(join(tmpdir(), "fanmind-verifier-test-"));
  try {
    const artifact = join(root, "fanmind-database-1.dump.age");
    const content = Buffer.from("encrypted-test-artifact");
    await writeFile(artifact, content);
    await writeFile(
      `${artifact}.sha256`,
      `${hash(content)}  ${basename(artifact)}\n`,
    );
    const before = await readFile(artifact);
    const result = await verifyChecksumPair(artifact);
    const after = await readFile(artifact);
    assert.equal(result.checksum, hash(content));
    assert.deepEqual(after, before);

    await writeFile(`${artifact}.sha256`, `${"0".repeat(64)}  ${basename(artifact)}\n`);
    await assert.rejects(() => verifyChecksumPair(artifact), /checksum_mismatch/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("storage manifest validates object count, size and hashes", async () => {
  const root = await mkdtemp(join(tmpdir(), "fanmind-storage-manifest-test-"));
  try {
    await mkdir(join(root, "avatars"), { recursive: true });
    const content = Buffer.from("avatar-content");
    await writeFile(join(root, "avatars", "one.png"), content);
    const manifest = {
      bucket: "fanmind-assets",
      listed_object_count: 1,
      downloaded_object_count: 1,
      object_count: 1,
      total_size_bytes: content.length,
      files: [
        {
          path: "avatars/one.png",
          size: content.length,
          sha256: hash(content),
        },
      ],
    };
    const result = await verifyStorageManifest(root, manifest);
    assert.deepEqual(result, {
      objectCount: 1,
      totalSizeBytes: content.length,
    });

    manifest.files[0].sha256 = "0".repeat(64);
    await assert.rejects(
      () => verifyStorageManifest(root, manifest),
      /storage_file_checksum_mismatch/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("full manifest requires exactly one valid encrypted part of each backup type", async () => {
  const root = await mkdtemp(join(tmpdir(), "fanmind-full-manifest-test-"));
  try {
    const definitions = [
      ["server_config", "fanmind-server-config-1.tar.gz.age"],
      ["database", "fanmind-database-1.dump.age"],
      ["storage", "fanmind-storage-1.tar.gz.age"],
    ];
    const parts = [];
    for (const [backupType, file] of definitions) {
      const artifact = join(root, file);
      const content = Buffer.from(`encrypted-${backupType}`);
      const digest = hash(content);
      await writeFile(artifact, content);
      await writeFile(`${artifact}.sha256`, `${digest}  ${file}\n`);
      parts.push({
        file,
        checksum_file: `${file}.sha256`,
        sha256: digest,
        size_bytes: content.length,
        manifest: { backup_type: backupType },
      });
    }
    const result = await verifyFullManifest(root, {
      production_commit: "a".repeat(40),
      parts,
    });
    assert.equal(result.partCount, 3);
    assert.deepEqual(result.partTypes, ["database", "server_config", "storage"]);

    parts.push({ ...parts[0] });
    await assert.rejects(
      () =>
        verifyFullManifest(root, {
          production_commit: "a".repeat(40),
          parts,
        }),
      /full_manifest_part_count_mismatch/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("sha256 helper returns the exact file digest", async () => {
  const root = await mkdtemp(join(tmpdir(), "fanmind-sha-test-"));
  try {
    const file = join(root, "value.bin");
    const content = Buffer.from("known-value");
    await writeFile(file, content);
    assert.equal(await sha256File(file), hash(content));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
