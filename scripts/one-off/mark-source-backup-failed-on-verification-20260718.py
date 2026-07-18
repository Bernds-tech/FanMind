#!/usr/bin/env python3
from pathlib import Path

path = Path("scripts/operations/backup-worker.mjs")
text = path.read_text(encoding="utf-8")
old = """async function verifyLatestBackup(job) {
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
new = """async function verifyLatestBackup(job) {
  const start = Date.now();
  const sourceRun = await latestVerifiableBackupRun();
  if (!sourceRun) throw new Error('verifiable_backup_not_found');
  let result;
  try {
    const pair = await validatedLocalBackupPair(sourceRun);
    result = await verifyBackupArtifact({ artifactPath:pair.artifact, checksumPath:pair.checksum });
    if (sourceRun.sha256 && sourceRun.sha256 !== result.checksum) throw new Error('backup_run_sha256_mismatch');
    if (sourceRun.size_bytes != null && Number(sourceRun.size_bytes) !== result.sizeBytes) throw new Error('backup_run_size_mismatch');
  } catch (error) {
    await patch('backup_runs', sourceRun.id, { validation_status:'failed' }).catch(()=>{});
    throw error;
  }
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
if text.count(old) != 1:
    raise SystemExit("verifyLatestBackup anchor mismatch")
path.write_text(text.replace(old, new, 1), encoding="utf-8")
print("Verification failure status hardening applied.")
