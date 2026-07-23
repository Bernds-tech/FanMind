#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { accessSync, constants, readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import {
  DEFAULT_POLICY,
  parseArtifactName,
  selectRetention,
} from './backup-retention.mjs';

function sanitize(value, max = 120) {
  return String(value || 'unknown')
    .replace(/[^a-zA-Z0-9_.:-]/g, '_')
    .slice(0, max);
}

function parseEnv(text) {
  const values = new Map();
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const separator = line.indexOf('=');
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }
    values.set(key, value);
  }
  return values;
}

function buildFailureReport(reason) {
  return [
    `DRY_RUN_UTC=${new Date().toISOString()}`,
    'OFFSITE_RETENTION_MODE=read_only_dry_run',
    'OFFSITE_REMOTE_IDENTIFIER_REDACTED=true',
    'OFFSITE_REMOTE_DELETE_EXECUTED=false',
    'OFFSITE_RETENTION_DRY_RUN_RESULT=failed',
    `OFFSITE_RETENTION_DRY_RUN_REASON=${sanitize(reason)}`,
  ];
}

async function main() {
  const reportPath = process.argv[2];
  if (!reportPath) throw new Error('report_path_missing');

  const env = parseEnv(readFileSync('/etc/fanmind-backup/worker.env', 'utf8'));
  const enabled = env.get('FANMIND_BACKUP_OFFSITE_ENABLED') || 'false';
  const remote = env.get('FANMIND_BACKUP_RCLONE_REMOTE') || '';
  const config = env.get('FANMIND_BACKUP_RCLONE_CONFIG') || '/etc/fanmind-backup/rclone.conf';
  const remotePath = env.get('FANMIND_BACKUP_REMOTE_PATH') || 'fanmind/production';
  const rcloneBin = '/usr/bin/rclone';

  if (enabled !== 'true') throw new Error('offsite_not_enabled');
  if (!remote) throw new Error('offsite_remote_missing');
  accessSync(config, constants.R_OK);
  accessSync(rcloneBin, constants.X_OK);

  let listingText;
  try {
    listingText = execFileSync(
      rcloneBin,
      [
        '--config',
        config,
        'lsjson',
        `${remote}:${remotePath}`,
        '--files-only',
        '--recursive',
      ],
      {
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
        stdio: ['ignore', 'pipe', 'ignore'],
      },
    );
  } catch {
    throw new Error('rclone_inventory_failed');
  }

  const entries = JSON.parse(listingText);
  if (!Array.isArray(entries)) throw new Error('rclone_inventory_invalid');

  const names = entries
    .map(entry => String(entry?.Path || entry?.Name || '').trim())
    .filter(Boolean)
    .filter(name => /(^|\/)fanmind-.*\.age(?:\.sha256)?$/.test(name));

  const groups = new Map();
  for (const path of names) {
    const key = path.endsWith('.sha256') ? path.slice(0, -7) : path;
    const group = groups.get(key) || { artifact: null, checksum: null };
    if (path.endsWith('.sha256')) group.checksum = path;
    else group.artifact = path;
    groups.set(key, group);
  }

  const completePairs = [];
  const incomplete = [];
  for (const [key, group] of groups.entries()) {
    if (!group.artifact || !group.checksum) {
      incomplete.push({ key, group });
      continue;
    }
    const artifactName = basename(group.artifact);
    const parsed = parseArtifactName(artifactName);
    if (!parsed) continue;
    completePairs.push({
      ...parsed,
      artifactName,
      artifactPath: group.artifact,
      checksumName: basename(group.checksum),
      checksumPath: group.checksum,
    });
  }

  const selection = selectRetention(completePairs);
  const types = ['database', 'storage', 'server_config', 'full'];
  const lines = [];
  lines.push(`DRY_RUN_UTC=${new Date().toISOString()}`);
  lines.push('OFFSITE_RETENTION_MODE=read_only_dry_run');
  lines.push('OFFSITE_REMOTE_IDENTIFIER_REDACTED=true');
  lines.push(`OFFSITE_RELEVANT_OBJECT_COUNT=${names.length}`);
  lines.push(`OFFSITE_COMPLETE_PAIR_COUNT=${completePairs.length}`);
  lines.push(`OFFSITE_ORPHAN_PAIR_COUNT=${incomplete.length}`);
  lines.push(`OFFSITE_KEEP_PAIR_COUNT=${selection.keep.length}`);
  lines.push(`OFFSITE_DELETION_CANDIDATE_PAIR_COUNT=${selection.remove.length}`);

  let latestProtected = true;
  for (const type of types) {
    const typePairs = completePairs.filter(pair => pair.type === type);
    const kept = selection.keep.filter(pair => pair.type === type);
    const removed = selection.remove.filter(pair => pair.type === type);
    const latest = [...typePairs].sort((a, b) => b.timestampMs - a.timestampMs)[0] || null;
    const latestKept = !latest || kept.some(pair => pair.artifactName === latest.artifactName);
    latestProtected = latestProtected && latestKept;
    lines.push(
      `OFFSITE_RETENTION_TYPE=${type}|complete:${typePairs.length}|keep:${kept.length}|candidate:${removed.length}|latest_protected:${latestKept}`,
    );
  }

  lines.push(`OFFSITE_LATEST_PER_TYPE_PROTECTED=${latestProtected}`);
  lines.push(
    `OFFSITE_POLICY=database:${DEFAULT_POLICY.database.daily}-${DEFAULT_POLICY.database.weekly}-${DEFAULT_POLICY.database.monthly}|storage:${DEFAULT_POLICY.storage.daily}-${DEFAULT_POLICY.storage.weekly}-${DEFAULT_POLICY.storage.monthly}|server_config:${DEFAULT_POLICY.server_config.daily}-${DEFAULT_POLICY.server_config.weekly}-${DEFAULT_POLICY.server_config.monthly}|full:${DEFAULT_POLICY.full.daily}-${DEFAULT_POLICY.full.weekly}-${DEFAULT_POLICY.full.monthly}`,
  );
  lines.push('OFFSITE_REMOTE_DELETE_EXECUTED=false');

  if (incomplete.length > 0) throw new Error('offsite_incomplete_pairs_present');
  if (!latestProtected) throw new Error('offsite_latest_pair_not_protected');
  if (completePairs.length === 0) throw new Error('offsite_no_complete_pairs');

  lines.push('OFFSITE_RETENTION_DRY_RUN_RESULT=success');
  writeFileSync(reportPath, `${lines.join('\n')}\n`, { mode: 0o600 });
  process.stdout.write(`${lines.join('\n')}\n`);
}

main().catch(error => {
  const lines = buildFailureReport(error instanceof Error ? error.message : error);
  const reportPath = process.argv[2];
  if (reportPath) writeFileSync(reportPath, `${lines.join('\n')}\n`, { mode: 0o600 });
  console.error(lines.join('\n'));
  process.exit(1);
});
