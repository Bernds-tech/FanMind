#!/usr/bin/env python3
from pathlib import Path

path = Path("tests/backup-worker.test.mjs")
text = path.read_text(encoding="utf-8")
old = """test('claim response normalization rejects unsupported job types as not executable', () => {
  assert.equal(worker.normalizeClaimedJob({ id: 'job-3', job_type: 'verify_backup' }), null);
  assert.equal(worker.normalizeClaimedJob([{ id: 'job-4', job_type: 'not_allowed' }]), null);
});
"""
new = """test('claim response normalization accepts verification and rejects unknown job types', () => {
  const verificationJob = { id: 'job-3', job_type: 'verify_backup' };
  assert.equal(worker.normalizeClaimedJob(verificationJob), verificationJob);
  assert.equal(worker.normalizeClaimedJob([{ id: 'job-4', job_type: 'not_allowed' }]), null);
});
"""
if text.count(old) != 1:
    raise SystemExit("normalization test anchor mismatch")
path.write_text(text.replace(old, new, 1), encoding="utf-8")
print("Backup verification normalization test updated.")
