#!/usr/bin/env python3
from pathlib import Path

path = Path("scripts/operations/backup-worker.mjs")
text = path.read_text(encoding="utf-8")


def replace_once(old: str, new: str, label: str) -> None:
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    text = text.replace(old, new, 1)


replace_once(
    "import { access, constants, mkdir, mkdtemp, open, readFile, rename, rm, stat, unlink, writeFile } from 'node:fs/promises';\n",
    "import { access, constants, mkdir, mkdtemp, open, readFile, realpath, rename, rm, stat, unlink, writeFile } from 'node:fs/promises';\n",
    "fs imports",
)
replace_once(
    "import { join, basename, dirname } from 'node:path';\n",
    "import { join, basename, dirname, relative, resolve } from 'node:path';\n",
    "path imports",
)
replace_once(
    "import { pathToFileURL } from 'node:url';\n\nconst VERSION = 'phase5-backup-worker-4';\nconst JOBS = new Set(['backup_server_config','backup_database','backup_storage','backup_full']);\n",
    "import { pathToFileURL } from 'node:url';\nimport { verifyBackupArtifact } from './verify-backup-artifact.mjs';\n\nconst VERSION = 'phase5-backup-worker-5';\nconst JOBS = new Set(['backup_server_config','backup_database','backup_storage','backup_full','verify_backup']);\n",
    "verifier import",
)

verification = """async function latestVerifiableBackupRun() {
  const rows = await api(restUrl('backup_runs', '?select=id,backup_type,status,storage_reference,checksum_reference,sha256,size_bytes,started_at&backup_type=neq.verification&status=in.(succeeded,offsite_pending,degraded,completed)&storage_reference=not.is.null&checksum_reference=not.is.null&order=started_at.desc&limit=1'));
  return Array.isArray(rows) ? rows[0] ?? null : null;
}
async function validatedLocalBackupPair(runRow) {
  if (!runRow || typeof runRow.storage_reference !== 'string' || typeof runRow.checksum_reference !== 'string') throw new Error('verifiable_backup_not_found');
  const root = await realpath(backupRoot());
  const artifact = await realpath(resolve(runRow.storage_reference));
  const checksum = await realpath(resolve(runRow.checksum_reference));
  const artifactRelative = relative(root, artifact);
  const checksumRelative = relative(root, checksum);
  if (!artifactRelative || artifactRelative.startsWith('..') || resolve(root, artifactRelative) !== artifact) throw new Error('backup_artifact_outside_root');
  if (!checksumRelative || checksumRelative.startsWith('..') || resolve(root, checksumRelative) !== checksum) throw new Error('backup_checksum_outside_root');
  if (checksum !== `${artifact}.sha256`) throw new Error('backup_checksum_pair_mismatch');
  return { artifact, checksum };
}
async function verifyLatestBackup(job) {
  const start = Date.now();
  const sourceRun = await latestVerifiableBackupRun();
  const pair = await validatedLocalBackupPair(sourceRun);
  const result = await verifyBackupArtifact({ artifactPath:pair.artifact, checksumPath:pair.checksum });
  if (sourceRun.sha256 && sourceRun.sha256 !== result.checksum) throw new Error('backup_run_sha256_mismatch');
  if (sourceRun.size_bytes != null && Number(sourceRun.size_bytes) !== result.sizeBytes) throw new Error('backup_run_size_mismatch');
  const verificationRun = await insert('backup_runs', {
    backup_type:'verification', status:'succeeded', severity:'info', finished_at:new Date().toISOString(),
    validation_status:'passed', storage_reference:null, checksum_reference:null, sha256:result.checksum,
    size_bytes:result.sizeBytes, offsite_status:'skipped', job_id:job.id, worker_id:WORKER_ID,
    duration_ms:Date.now()-start, technical_reference:sourceRun.id,
    manifest:{ source_backup_run_id:sourceRun.id, source_backup_type:sourceRun.backup_type, mode:result.mode, artifact:result.artifact },
  });
  await patch('backup_runs', sourceRun.id, { validation_status:'passed' });
  await patch('admin_operation_jobs', job.id, { status:'succeeded', finished_at:new Date().toISOString(), result_reference:verificationRun.id, lease_until:null });
  await notify('info', 'Backup-Prüfung erfolgreich', `${sourceRun.backup_type} wurde checksum-only geprüft.`, 'backup_worker', verificationRun.id);
  await audit(job.job_type, 'success', { source_backup_run_id:sourceRun.id, verification_run_id:verificationRun.id, mode:result.mode });
  return verificationRun;
}

"""
replace_once("async function offsite(file) {\n", verification + "async function offsite(file) {\n", "verification functions")

old = "async function handle(job) { if (!JOBS.has(job.job_type)) throw new Error('job_type_not_allowed'); await patch('admin_operation_jobs', job.id, { status:'running', started_at:new Date().toISOString(), lease_until:new Date(Date.now()+900000).toISOString() }); const tmp = await mkdtemp(join(tmpdir(), 'fanmind-backup-'));"
new = "async function handle(job) { if (!JOBS.has(job.job_type)) throw new Error('job_type_not_allowed'); await patch('admin_operation_jobs', job.id, { status:'running', started_at:new Date().toISOString(), lease_until:new Date(Date.now()+900000).toISOString() }); if (job.job_type === 'verify_backup') { await verifyLatestBackup(job); return; } const tmp = await mkdtemp(join(tmpdir(), 'fanmind-backup-'));"
replace_once(old, new, "handle verification branch")
replace_once(
    "export { encryptedFinalize, createFull, createStorage, walkStorage, listStorage, placeBackupPair, moveAndValidate, offsite, createServerConfig, normalizeClaimedJob, backupPollMs, backupHeartbeatMs, __setBackupWorkerTestHooks, JOBS };\n",
    "export { encryptedFinalize, createFull, createStorage, walkStorage, listStorage, placeBackupPair, moveAndValidate, offsite, createServerConfig, normalizeClaimedJob, backupPollMs, backupHeartbeatMs, validatedLocalBackupPair, verifyLatestBackup, __setBackupWorkerTestHooks, JOBS };\n",
    "exports",
)

path.write_text(text, encoding="utf-8")
print("Backup worker verification support applied.")
