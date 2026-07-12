#!/usr/bin/env node
import { readdir, readFile, rm, stat } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const DEFAULTS = Object.freeze({
  daily: 7,
  weekly: 4,
  monthly: 6,
  minimumPairs: 7,
});

const ARTIFACT_PATTERNS = Object.freeze([
  { type: 'server_config', regex: /^fanmind-server-config-(\d{13})\.tar\.gz\.age$/ },
  { type: 'database', regex: /^fanmind-database-(\d{13})\.dump\.age$/ },
  { type: 'storage', regex: /^fanmind-storage-(\d{13})\.tar\.gz\.age$/ },
  { type: 'full', regex: /^fanmind-full-(\d{13})\.tar\.gz\.age$/ },
]);

function parseNonNegativeInt(value, fallback, name) {
  if (value === undefined || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) throw new Error(`${name}_must_be_non_negative_integer`);
  return parsed;
}

function parsePositiveInt(value, fallback, name) {
  const parsed = parseNonNegativeInt(value, fallback, name);
  if (parsed < 1) throw new Error(`${name}_must_be_positive_integer`);
  return parsed;
}

function parseArtifactName(name) {
  for (const pattern of ARTIFACT_PATTERNS) {
    const match = name.match(pattern.regex);
    if (!match) continue;
    const timestampMs = Number(match[1]);
    const date = new Date(timestampMs);
    if (!Number.isFinite(timestampMs) || Number.isNaN(date.getTime())) return null;
    return { type: pattern.type, timestampMs, date };
  }
  return null;
}

function dayKey(date) {
  return date.toISOString().slice(0, 10);
}

function monthKey(date) {
  return date.toISOString().slice(0, 7);
}

function isoWeekKey(date) {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const weekday = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - weekday);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((utc - yearStart) / 86400000) + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function addPeriodRepresentatives(sortedPairs, limit, keyFn, keepNames, reasons, label) {
  if (limit <= 0) return;
  const periods = new Set();
  for (const pair of sortedPairs) {
    const key = keyFn(pair.date);
    if (periods.has(key)) continue;
    periods.add(key);
    keepNames.add(pair.artifactName);
    const pairReasons = reasons.get(pair.artifactName) ?? [];
    pairReasons.push(`${label}:${key}`);
    reasons.set(pair.artifactName, pairReasons);
    if (periods.size >= limit) break;
  }
}

function selectRetention(pairs, options = {}) {
  const daily = parseNonNegativeInt(options.daily, DEFAULTS.daily, 'daily');
  const weekly = parseNonNegativeInt(options.weekly, DEFAULTS.weekly, 'weekly');
  const monthly = parseNonNegativeInt(options.monthly, DEFAULTS.monthly, 'monthly');
  const minimumPairs = parsePositiveInt(options.minimumPairs, DEFAULTS.minimumPairs, 'minimum_pairs');

  const byType = new Map();
  for (const pair of pairs) {
    const list = byType.get(pair.type) ?? [];
    list.push(pair);
    byType.set(pair.type, list);
  }

  const keepNames = new Set();
  const reasons = new Map();

  for (const typePairs of byType.values()) {
    const sorted = [...typePairs].sort((a, b) => b.timestampMs - a.timestampMs || a.artifactName.localeCompare(b.artifactName));

    for (const pair of sorted.slice(0, minimumPairs)) {
      keepNames.add(pair.artifactName);
      const pairReasons = reasons.get(pair.artifactName) ?? [];
      pairReasons.push('minimum_recent');
      reasons.set(pair.artifactName, pairReasons);
    }

    addPeriodRepresentatives(sorted, daily, dayKey, keepNames, reasons, 'daily');
    addPeriodRepresentatives(sorted, weekly, isoWeekKey, keepNames, reasons, 'weekly');
    addPeriodRepresentatives(sorted, monthly, monthKey, keepNames, reasons, 'monthly');
  }

  return {
    keep: pairs.filter((pair) => keepNames.has(pair.artifactName)),
    remove: pairs.filter((pair) => !keepNames.has(pair.artifactName)),
    reasons,
    policy: { daily, weekly, monthly, minimumPairs },
  };
}

async function checksumLooksValid(checksumPath, artifactName) {
  try {
    const content = (await readFile(checksumPath, 'utf8')).trim();
    const match = content.match(/^([0-9a-f]{64})\s+\*?(.+)$/i);
    if (!match) return false;
    return basename(match[2]) === artifactName;
  } catch {
    return false;
  }
}

async function discoverBackupPairs(root) {
  const entries = await readdir(root, { withFileTypes: true }).catch((error) => {
    if (error?.code === 'ENOENT') return [];
    throw error;
  });
  const fileNames = new Set(entries.filter((entry) => entry.isFile()).map((entry) => entry.name));
  const pairs = [];
  const incomplete = [];

  for (const artifactName of [...fileNames].sort()) {
    const parsed = parseArtifactName(artifactName);
    if (!parsed) continue;
    const checksumName = `${artifactName}.sha256`;
    const artifactPath = join(root, artifactName);
    const checksumPath = join(root, checksumName);

    if (!fileNames.has(checksumName)) {
      incomplete.push({ type: parsed.type, artifactName, artifactPath, checksumName, checksumPath, reason: 'checksum_missing' });
      continue;
    }

    const [artifactStat, checksumStat, checksumValid] = await Promise.all([
      stat(artifactPath),
      stat(checksumPath),
      checksumLooksValid(checksumPath, artifactName),
    ]);

    if (!checksumValid) {
      incomplete.push({ type: parsed.type, artifactName, artifactPath, checksumName, checksumPath, reason: 'checksum_invalid' });
      continue;
    }

    pairs.push({
      ...parsed,
      artifactName,
      artifactPath,
      checksumName,
      checksumPath,
      artifactSize: artifactStat.size,
      checksumSize: checksumStat.size,
    });
  }

  for (const checksumName of [...fileNames].filter((name) => name.endsWith('.age.sha256')).sort()) {
    const artifactName = checksumName.slice(0, -'.sha256'.length);
    if (fileNames.has(artifactName)) continue;
    const parsed = parseArtifactName(artifactName);
    if (!parsed) continue;
    incomplete.push({
      type: parsed.type,
      artifactName,
      artifactPath: join(root, artifactName),
      checksumName,
      checksumPath: join(root, checksumName),
      reason: 'artifact_missing',
    });
  }

  return { pairs, incomplete };
}

async function executeRetention({ root, dryRun, options = {}, logger = console.log }) {
  const { pairs, incomplete } = await discoverBackupPairs(root);
  const selection = selectRetention(pairs, options);

  for (const item of incomplete) {
    logger(JSON.stringify({ action: 'skip_incomplete_pair', type: item.type, artifact: item.artifactPath, checksum: item.checksumPath, reason: item.reason }));
  }

  for (const pair of [...selection.keep].sort((a, b) => b.timestampMs - a.timestampMs)) {
    logger(JSON.stringify({ action: 'keep_pair', type: pair.type, artifact: pair.artifactPath, checksum: pair.checksumPath, created_at: pair.date.toISOString(), reasons: selection.reasons.get(pair.artifactName) ?? [] }));
  }

  const removePairs = [...selection.remove].sort((a, b) => a.timestampMs - b.timestampMs);
  for (const pair of removePairs) {
    logger(JSON.stringify({ action: dryRun ? 'would_delete_pair' : 'delete_pair', type: pair.type, artifact: pair.artifactPath, checksum: pair.checksumPath, created_at: pair.date.toISOString() }));
    if (!dryRun) {
      await rm(pair.artifactPath);
      await rm(pair.checksumPath, { force: true });
    }
  }

  const summary = {
    action: 'retention_summary',
    dry_run: dryRun,
    complete_pairs: pairs.length,
    kept_pairs: selection.keep.length,
    deletion_candidates: selection.remove.length,
    incomplete_pairs: incomplete.length,
    deleted_pairs: dryRun ? 0 : selection.remove.length,
    policy: selection.policy,
  };
  logger(JSON.stringify(summary));
  return summary;
}

async function main() {
  const root = process.env.FANMIND_BACKUP_ROOT || '/var/backups/fanmind';
  const dryRun = process.argv.includes('--dry-run');
  const execute = process.argv.includes('--execute');
  if (dryRun === execute) throw new Error('exactly_one_of_dry_run_or_execute_required');

  await executeRetention({
    root,
    dryRun,
    options: {
      daily: process.env.FANMIND_BACKUP_RETENTION_DAILY,
      weekly: process.env.FANMIND_BACKUP_RETENTION_WEEKLY,
      monthly: process.env.FANMIND_BACKUP_RETENTION_MONTHLY,
      minimumPairs: process.env.FANMIND_BACKUP_RETENTION_MIN_PAIRS,
    },
  });
}

export {
  ARTIFACT_PATTERNS,
  DEFAULTS,
  dayKey,
  discoverBackupPairs,
  executeRetention,
  isoWeekKey,
  monthKey,
  parseArtifactName,
  selectRetention,
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : 'retention_failed');
    process.exit(1);
  });
}
