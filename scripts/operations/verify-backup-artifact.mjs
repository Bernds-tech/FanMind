#!/usr/bin/env node
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import {
  access,
  constants,
  mkdtemp,
  readFile,
  rm,
  stat,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, normalize, relative, resolve, sep } from "node:path";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const GIT_SHA_PATTERN = /^(?:[a-f0-9]{40}|unknown)$/;
const BACKUP_TYPES = new Set(["database", "storage", "server_config", "full"]);

function verifierError(code, details = {}) {
  const error = new Error(code);
  error.code = code;
  error.details = details;
  return error;
}

export function parseChecksumLine(line) {
  const match = String(line).trim().match(/^([a-f0-9]{64})\s+\*?(.+)$/i);
  if (!match) throw verifierError("invalid_checksum_file");
  return {
    sha256: match[1].toLowerCase(),
    fileName: match[2].trim(),
  };
}

export function assertSafeArchiveEntry(entry) {
  const value = String(entry).replace(/^\.\//, "");
  if (!value || value === ".") return true;
  if (value.startsWith("/") || value.includes("\\")) {
    throw verifierError("unsafe_archive_entry", { entry });
  }
  const normalized = normalize(value);
  if (
    normalized === ".." ||
    normalized.startsWith(`..${sep}`) ||
    normalized.split(sep).includes("..")
  ) {
    throw verifierError("unsafe_archive_entry", { entry });
  }
  return true;
}

export function detectBackupType(fileName) {
  const name = basename(fileName).replace(/\.age$/, "");
  if (/^fanmind-database-.*\.dump$/u.test(name)) return "database";
  if (/^fanmind-storage-.*\.tar\.gz$/u.test(name)) return "storage";
  if (/^fanmind-server-config-.*\.tar\.gz$/u.test(name)) return "server_config";
  if (/^fanmind-full-.*\.tar\.gz$/u.test(name)) return "full";
  throw verifierError("unknown_backup_type", { fileName: basename(fileName) });
}

export async function sha256File(file) {
  const hash = createHash("sha256");
  await new Promise((resolvePromise, reject) => {
    createReadStream(file)
      .on("data", (chunk) => hash.update(chunk))
      .on("error", reject)
      .on("end", resolvePromise);
  });
  return hash.digest("hex");
}

function run(command, args, options = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      shell: false,
      cwd: options.cwd,
      env: { ...process.env, ...(options.env ?? {}) },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolvePromise({ stdout, stderr });
        return;
      }
      reject(
        verifierError("verification_command_failed", {
          command: basename(command),
          exitCode: code,
          stderr: stderr.slice(-1000),
        }),
      );
    });
  });
}

async function assertReadable(file) {
  await access(file, constants.R_OK).catch(() => {
    throw verifierError("file_not_readable", { file: basename(file) });
  });
}

export async function verifyChecksumPair(artifactPath, checksumPath = `${artifactPath}.sha256`) {
  await assertReadable(artifactPath);
  await assertReadable(checksumPath);
  const checksum = parseChecksumLine(await readFile(checksumPath, "utf8"));
  if (checksum.fileName !== basename(artifactPath)) {
    throw verifierError("checksum_filename_mismatch", {
      expected: basename(artifactPath),
      actual: checksum.fileName,
    });
  }
  const actual = await sha256File(artifactPath);
  if (actual !== checksum.sha256) {
    throw verifierError("checksum_mismatch", {
      expected: checksum.sha256,
      actual,
    });
  }
  const fileStat = await stat(artifactPath);
  return {
    artifact: basename(artifactPath),
    checksum: actual,
    sizeBytes: fileStat.size,
  };
}

async function listTarEntries(file, tarBin = "tar") {
  const { stdout } = await run(tarBin, ["-tzf", file]);
  const entries = stdout
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);
  for (const entry of entries) assertSafeArchiveEntry(entry);
  return entries;
}

async function extractTar(file, destination, tarBin = "tar") {
  await listTarEntries(file, tarBin);
  await run(tarBin, ["-xzf", file, "-C", destination]);
}

function safeManifestPath(root, manifestPath) {
  const clean = String(manifestPath).replace(/^\.\//, "");
  assertSafeArchiveEntry(clean);
  const candidate = resolve(root, clean);
  const rel = relative(resolve(root), candidate);
  if (rel.startsWith("..") || rel.includes(`${sep}..${sep}`)) {
    throw verifierError("manifest_path_escape", { manifestPath });
  }
  return candidate;
}

export async function verifyStorageManifest(root, manifest) {
  if (!manifest || typeof manifest !== "object") {
    throw verifierError("storage_manifest_missing");
  }
  if (manifest.bucket !== "fanmind-assets") {
    throw verifierError("storage_bucket_mismatch");
  }
  if (!Array.isArray(manifest.files)) {
    throw verifierError("storage_manifest_files_missing");
  }
  const seen = new Set();
  let totalSizeBytes = 0;
  for (const entry of manifest.files) {
    if (!entry || typeof entry.path !== "string" || !SHA256_PATTERN.test(entry.sha256)) {
      throw verifierError("invalid_storage_manifest_entry");
    }
    if (seen.has(entry.path)) throw verifierError("duplicate_storage_manifest_path");
    seen.add(entry.path);
    const file = safeManifestPath(root, entry.path);
    await assertReadable(file);
    const fileStat = await stat(file);
    const actualHash = await sha256File(file);
    if (fileStat.size !== entry.size) {
      throw verifierError("storage_file_size_mismatch", { path: entry.path });
    }
    if (actualHash !== entry.sha256) {
      throw verifierError("storage_file_checksum_mismatch", { path: entry.path });
    }
    totalSizeBytes += fileStat.size;
  }
  if (manifest.object_count !== manifest.files.length) {
    throw verifierError("storage_object_count_mismatch");
  }
  if (
    Number.isInteger(manifest.downloaded_object_count) &&
    manifest.downloaded_object_count !== manifest.files.length
  ) {
    throw verifierError("storage_downloaded_count_mismatch");
  }
  if (
    Number.isInteger(manifest.listed_object_count) &&
    manifest.listed_object_count !== manifest.files.length
  ) {
    throw verifierError("storage_listed_count_mismatch");
  }
  if (manifest.total_size_bytes !== totalSizeBytes) {
    throw verifierError("storage_total_size_mismatch");
  }
  return {
    objectCount: manifest.files.length,
    totalSizeBytes,
  };
}

export async function verifyFullManifest(root, manifest) {
  if (!manifest || typeof manifest !== "object" || !Array.isArray(manifest.parts)) {
    throw verifierError("full_manifest_missing");
  }
  if (!GIT_SHA_PATTERN.test(String(manifest.production_commit ?? ""))) {
    throw verifierError("invalid_production_commit");
  }
  if (manifest.parts.length !== 3) {
    throw verifierError("full_manifest_part_count_mismatch");
  }
  const foundTypes = new Set();
  for (const part of manifest.parts) {
    if (
      !part ||
      typeof part.file !== "string" ||
      typeof part.checksum_file !== "string" ||
      !SHA256_PATTERN.test(part.sha256) ||
      !Number.isInteger(part.size_bytes) ||
      !part.manifest ||
      !BACKUP_TYPES.has(part.manifest.backup_type)
    ) {
      throw verifierError("invalid_full_manifest_part");
    }
    if (part.manifest.backup_type === "full") {
      throw verifierError("nested_full_backup_not_allowed");
    }
    if (foundTypes.has(part.manifest.backup_type)) {
      throw verifierError("duplicate_full_backup_part_type");
    }
    foundTypes.add(part.manifest.backup_type);
    const artifact = safeManifestPath(root, part.file);
    const checksum = safeManifestPath(root, part.checksum_file);
    const result = await verifyChecksumPair(artifact, checksum);
    if (result.checksum !== part.sha256 || result.sizeBytes !== part.size_bytes) {
      throw verifierError("full_manifest_part_mismatch", {
        backupType: part.manifest.backup_type,
      });
    }
  }
  for (const requiredType of ["server_config", "database", "storage"]) {
    if (!foundTypes.has(requiredType)) {
      throw verifierError("full_manifest_required_part_missing", { requiredType });
    }
  }
  return {
    productionCommit: manifest.production_commit,
    partCount: manifest.parts.length,
    partTypes: [...foundTypes].sort(),
  };
}

async function validateDecryptedArtifact(clearFile, type, options) {
  if (type === "database") {
    await run(options.pgRestoreBin, ["--list", clearFile]);
    return { pgRestoreList: "ok" };
  }

  const extractRoot = await mkdtemp(join(tmpdir(), "fanmind-backup-content-"));
  try {
    const entries = await listTarEntries(clearFile, options.tarBin);
    if (type === "server_config") {
      return { tarEntries: entries.length, archive: "valid" };
    }
    await extractTar(clearFile, extractRoot, options.tarBin);
    const manifestPath = join(extractRoot, "manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8").catch(() => {
      throw verifierError(`${type}_manifest_missing`);
    }));
    if (type === "storage") {
      return verifyStorageManifest(extractRoot, manifest);
    }
    if (type === "full") {
      return verifyFullManifest(extractRoot, manifest);
    }
    throw verifierError("unsupported_backup_type", { type });
  } finally {
    await rm(extractRoot, { recursive: true, force: true });
  }
}

export async function verifyBackupArtifact(input) {
  const artifactPath = resolve(input.artifactPath);
  const type = input.type ?? detectBackupType(artifactPath);
  const checksumResult = await verifyChecksumPair(
    artifactPath,
    input.checksumPath ? resolve(input.checksumPath) : `${artifactPath}.sha256`,
  );
  const result = {
    ok: true,
    mode: input.identityPath ? "decrypted" : "checksum_only",
    backupType: type,
    ...checksumResult,
    contentValidation: null,
  };
  if (!input.identityPath) return result;

  const workRoot = await mkdtemp(join(tmpdir(), "fanmind-backup-verify-"));
  const clearFile = join(workRoot, basename(artifactPath).replace(/\.age$/, ""));
  try {
    await assertReadable(resolve(input.identityPath));
    await run(input.ageBin ?? "age", [
      "--decrypt",
      "--identity",
      resolve(input.identityPath),
      "--output",
      clearFile,
      artifactPath,
    ]);
    result.contentValidation = await validateDecryptedArtifact(clearFile, type, {
      pgRestoreBin: input.pgRestoreBin ?? "/usr/lib/postgresql/17/bin/pg_restore",
      tarBin: input.tarBin ?? "tar",
    });
    return result;
  } finally {
    await rm(workRoot, { recursive: true, force: true });
  }
}

function parseCli(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--artifact") options.artifactPath = argv[++index];
    else if (value === "--checksum") options.checksumPath = argv[++index];
    else if (value === "--identity") options.identityPath = argv[++index];
    else if (value === "--type") options.type = argv[++index];
    else if (value === "--age-bin") options.ageBin = argv[++index];
    else if (value === "--pg-restore-bin") options.pgRestoreBin = argv[++index];
    else if (value === "--tar-bin") options.tarBin = argv[++index];
    else if (value === "--json") options.json = true;
    else if (value === "--help") options.help = true;
    else throw verifierError("unknown_argument", { argument: value });
  }
  return options;
}

function usage() {
  return `FanMind read-only backup verifier

Usage:
  node scripts/operations/verify-backup-artifact.mjs --artifact /path/backup.age [options]

Options:
  --checksum PATH       Adjacent checksum file; default: <artifact>.sha256
  --identity PATH       age identity for decrypt/content validation
  --type TYPE           database | storage | server_config | full; default: detect
  --age-bin PATH        age executable; default: age
  --pg-restore-bin PATH pg_restore executable
  --tar-bin PATH        tar executable; default: tar
  --json                JSON output

Without --identity the verifier performs a non-destructive checksum-only check.
It never restores data and never writes into the backup directory.`;
}

async function main() {
  const options = parseCli(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }
  if (!options.artifactPath) throw verifierError("artifact_argument_required");
  if (options.type && !BACKUP_TYPES.has(options.type)) {
    throw verifierError("invalid_backup_type", { type: options.type });
  }
  const result = await verifyBackupArtifact(options);
  if (options.json) console.log(JSON.stringify(result));
  else {
    console.log(`FanMind backup verification: OK`);
    console.log(`artifact=${result.artifact}`);
    console.log(`backup_type=${result.backupType}`);
    console.log(`mode=${result.mode}`);
    console.log(`sha256=${result.checksum}`);
    console.log(`size_bytes=${result.sizeBytes}`);
    if (result.contentValidation) {
      console.log(`content_validation=${JSON.stringify(result.contentValidation)}`);
    }
  }
}

const isDirectRun = process.argv[1]
  ? import.meta.url === pathToFileURL(resolve(process.argv[1])).href
  : false;

if (isDirectRun) {
  main().catch((error) => {
    const code = error?.code ?? error?.message ?? "backup_verification_failed";
    console.error(`FanMind backup verification: FAILED (${code})`);
    process.exitCode = 1;
  });
}
