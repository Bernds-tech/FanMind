#!/usr/bin/env python3
from pathlib import Path

path = Path("tests/backup-worker.test.mjs")
text = path.read_text(encoding="utf-8")

old_import = "const serviceRoleGrantMigration = await readFile(new URL('../supabase/migrations/20260711170000_grant_backup_worker_rpc_service_role.sql', import.meta.url), 'utf8');\n"
new_import = old_import + "const enableVerificationMigration = await readFile(new URL('../supabase/migrations/20260718173000_enable_safe_backup_verification.sql', import.meta.url), 'utf8');\n"
if text.count(old_import) != 1:
    raise SystemExit("enable migration import anchor mismatch")
text = text.replace(old_import, new_import, 1)

old_test = """test('verify_backup is blocked in worker and migration follow-up', () => {
  assert.equal(worker.JOBS.has('verify_backup'), false);
  assert.doesNotMatch(migration.match(/job_type in \(([^)]*)\)/)?.[1] ?? '', /verify_backup/);
  assert.match(migration, /verify_backup disabled/);
});
"""
new_test = """test('verify_backup is re-enabled only by the safe follow-up migration', () => {
  assert.equal(worker.JOBS.has('verify_backup'), true);
  assert.doesNotMatch(migration.match(/job_type in \(([^)]*)\)/)?.[1] ?? '', /verify_backup/);
  assert.match(migration, /verify_backup disabled/);
  assert.match(enableVerificationMigration, /job_type in \([^)]*verify_backup/s);
  assert.match(enableVerificationMigration, /backup_type in \([^)]*verification/s);
  assert.match(enableVerificationMigration, /grant execute on function public\.claim_admin_backup_job\(text, integer\) to service_role;/i);
  assert.doesNotMatch(enableVerificationMigration, /grant execute .* to (public|anon|authenticated)/i);
});
"""
if text.count(old_test) != 1:
    raise SystemExit("legacy verification test anchor mismatch")
text = text.replace(old_test, new_test, 1)
path.write_text(text, encoding="utf-8")
print("Backup worker verification test updated.")
