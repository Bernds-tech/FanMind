#!/usr/bin/env node
import { readdir, stat, rm } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.env.FANMIND_BACKUP_ROOT || '/var/backups/fanmind';
const dryRun = process.argv.includes('--dry-run');
const keep = Number(process.env.FANMIND_BACKUP_RETENTION_KEEP || 18);
const entries = (await readdir(root).catch(() => [])).filter((name) => /^fanmind-.*\.(age|sha256)$/.test(name));
const files = [];
for (const name of entries) files.push({ name, path:join(root, name), mtime:(await stat(join(root, name))).mtimeMs });
files.sort((a,b) => b.mtime - a.mtime);
const candidates = files.slice(Math.max(keep, 1)).filter((file) => !file.name.includes('full') || files.some((kept, idx) => idx < keep && kept.name.includes('full')));
for (const file of candidates) {
  console.log(JSON.stringify({ action: dryRun ? 'would_delete' : 'delete', path:file.path }));
  if (!dryRun) await rm(file.path, { force:true });
}
