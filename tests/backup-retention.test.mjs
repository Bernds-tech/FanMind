import test from 'node:test';
import assert from 'node:assert/strict';
import { access, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  discoverBackupPairs,
  executeRetention,
  parseArtifactName,
  selectRetention,
} from '../scripts/operations/backup-retention.mjs';

function pair(type, iso, suffix = 'tar.gz') {
  const timestampMs = Date.parse(iso);
  const prefix = type === 'server_config' ? 'server-config' : type;
  const artifactName = `fanmind-${prefix}-${timestampMs}.${suffix}.age`;
  return {
    type,
    timestampMs,
    date: new Date(timestampMs),
    artifactName,
    artifactPath: `/backups/${artifactName}`,
    checksumName: `${artifactName}.sha256`,
    checksumPath: `/backups/${artifactName}.sha256`,
  };
}

async function writePair(root, type, timestampMs, payload = 'payload') {
  const prefix = type === 'server_config' ? 'server-config' : type;
  const suffix = type === 'database' ? 'dump' : 'tar.gz';
  const artifactName = `fanmind-${prefix}-${timestampMs}.${suffix}.age`;
  const artifactPath = join(root, artifactName);
  const checksumPath = `${artifactPath}.sha256`;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload));
  const sha = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  await writeFile(artifactPath, payload, { mode: 0o600 });
  await writeFile(checksumPath, `${sha}  ${artifactName}\n`, { mode: 0o600 });
  return { artifactName, artifactPath, checksumPath };
}

test('recognized backup names parse exact worker artifact formats', () => {
  const db = parseArtifactName('fanmind-database-1783881096964.dump.age');
  const full = parseArtifactName('fanmind-full-1783881096964.tar.gz.age');
  assert.equal(db.type, 'database');
  assert.equal(full.type, 'full');
  assert.equal(parseArtifactName('fanmind-full-old.tar.gz.age'), null);
  assert.equal(parseArtifactName('unrelated-1783881096964.tar.gz.age'), null);
});

test('retention keeps at least seven newest complete pairs per type', () => {
  const pairs = [];
  for (let index = 0; index < 10; index += 1) {
    pairs.push(pair('full', `2026-07-12T${String(index).padStart(2, '0')}:00:00Z`));
  }
  const result = selectRetention(pairs, { daily: 0, weekly: 0, monthly: 0, minimumPairs: 7 });
  assert.equal(result.keep.length, 7);
  assert.equal(result.remove.length, 3);
  const keptTimestamps = result.keep.map((item) => item.timestampMs).sort((a, b) => b - a);
  const expected = pairs.map((item) => item.timestampMs).sort((a, b) => b - a).slice(0, 7);
  assert.deepEqual(keptTimestamps, expected);
});

test('monthly policy keeps newest representative from six distinct UTC months', () => {
  const pairs = [];
  for (let month = 0; month < 10; month += 1) {
    const date = new Date(Date.UTC(2026, 9 - month, 15, 12, 0, 0));
    pairs.push(pair('database', date.toISOString(), 'dump'));
  }
  const result = selectRetention(pairs, { daily: 0, weekly: 0, monthly: 6, minimumPairs: 1 });
  assert.equal(result.keep.length, 6);
  assert.equal(result.remove.length, 4);
});

test('incomplete or invalid pairs are reported and never selected for deletion', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fanmind-retention-incomplete-'));
  const timestamp = Date.parse('2026-07-12T12:00:00Z');
  const artifactName = `fanmind-full-${timestamp}.tar.gz.age`;
  await writeFile(join(root, artifactName), 'payload');
  const invalidName = `fanmind-database-${timestamp}.dump.age`;
  await writeFile(join(root, invalidName), 'payload');
  await writeFile(join(root, `${invalidName}.sha256`), `not-a-valid-checksum  ${invalidName}\n`);
  const orphanName = `fanmind-storage-${timestamp}.tar.gz.age.sha256`;
  await writeFile(join(root, orphanName), `${'0'.repeat(64)}  ${orphanName.slice(0, -7)}\n`);

  const discovered = await discoverBackupPairs(root);
  assert.equal(discovered.pairs.length, 0);
  assert.deepEqual(discovered.incomplete.map((item) => item.reason).sort(), ['artifact_missing', 'checksum_invalid', 'checksum_missing']);
});

test('dry run reports pair deletion candidates without removing either file', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fanmind-retention-dry-'));
  const newer = await writePair(root, 'full', Date.parse('2026-07-12T12:00:00Z'), 'new');
  const older = await writePair(root, 'full', Date.parse('2026-06-12T12:00:00Z'), 'old');
  const lines = [];

  const summary = await executeRetention({
    root,
    dryRun: true,
    options: { daily: 0, weekly: 0, monthly: 0, minimumPairs: 1 },
    logger: (line) => lines.push(JSON.parse(line)),
  });

  assert.equal(summary.deletion_candidates, 1);
  assert.equal(lines.some((line) => line.action === 'would_delete_pair' && line.artifact === older.artifactPath && line.checksum === older.checksumPath), true);
  await access(newer.artifactPath);
  await access(newer.checksumPath);
  await access(older.artifactPath);
  await access(older.checksumPath);
});

test('execute mode removes artifact and checksum as one retention decision', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fanmind-retention-execute-'));
  const newer = await writePair(root, 'database', Date.parse('2026-07-12T12:00:00Z'), 'new');
  const older = await writePair(root, 'database', Date.parse('2026-06-12T12:00:00Z'), 'old');

  const summary = await executeRetention({
    root,
    dryRun: false,
    options: { daily: 0, weekly: 0, monthly: 0, minimumPairs: 1 },
    logger: () => {},
  });

  assert.equal(summary.deleted_pairs, 1);
  await access(newer.artifactPath);
  await access(newer.checksumPath);
  await assert.rejects(() => access(older.artifactPath), /ENOENT/);
  await assert.rejects(() => access(older.checksumPath), /ENOENT/);
  assert.match(await readFile(newer.checksumPath, 'utf8'), /^[0-9a-f]{64}/);
});
