import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const worker = await readFile(new URL('../scripts/operations/backup-worker.mjs', import.meta.url), 'utf8');
const migration = await readFile(new URL('../supabase/migrations/20260711143000_phase_5_backup_worker.sql', import.meta.url), 'utf8');

test('worker uses fixed backup job allowlist only', () => {
  for (const job of ['backup_server_config','backup_database','backup_storage','backup_full','verify_backup']) assert.match(worker, new RegExp(job));
  assert.match(worker, /job_type_not_allowed/);
});

test('worker does not enable shell execution for commands', () => {
  assert.match(worker, /shell:false/);
  assert.doesNotMatch(worker, /exec\(/);
});

test('migration implements atomic lease based claiming', () => {
  assert.match(migration, /FOR UPDATE SKIP LOCKED/i);
  assert.match(migration, /lease_until/);
  assert.match(migration, /claim_admin_backup_job/);
  assert.match(migration, /status in \('claimed','running'\)/);
});

test('migration stores required job metadata without broad browser grants', () => {
  for (const column of ['requested_by','requested_at','claimed_at','started_at','finished_at','worker_id','attempt_count','error_code','error_message','result_reference','idempotency_key','lease_until','priority']) assert.match(migration, new RegExp(column));
  assert.match(migration, /revoke all on function public\.claim_admin_backup_job/);
});
