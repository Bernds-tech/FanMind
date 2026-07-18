# FanMind Backup Verification and Restore Drill

## Purpose

This runbook proves that encrypted FanMind backups can be read and validated without touching Production data. It separates three activities:

1. **checksum verification** on the Production host;
2. **content verification** on an isolated verification host with the age identity;
3. **restore drill** into an empty, disposable test environment.

The verifier is deliberately read-only. It never restores a database, uploads Storage objects, edits Production configuration or writes into the backup directory.

## Hard safety rules

- Never pass a Production database target to a restore command.
- Never decrypt backups in `/var/backups/fanmind` or `/var/www/fanmind`.
- Never print the age identity, database password, Supabase service-role key or `.env.production` content.
- Use a disposable host or encrypted offline workstation for decryption.
- Use a separate test PostgreSQL database and separate test Storage bucket/project.
- Keep `FANMIND_ENABLE_REFERRAL_BILLING=false` and all write integrations disabled during a restore drill.
- Do not point a restored test application at `fanmind.ch` or Production webhooks.
- Before any write or restore, the shared environment boundary must pass with a distinct Staging/Test Supabase project.

### Mandatory environment boundary before restore writes

Load only the isolated target configuration and run:

```bash
npm run environment:preflight:write
```

Required gates:

```text
FANMIND_RUNTIME_ENVIRONMENT=staging or test
FANMIND_ENABLE_NON_PRODUCTION_WRITES=true
FANMIND_NON_PRODUCTION_WRITE_ACK=I_UNDERSTAND_NON_PRODUCTION_ONLY
FANMIND_TARGET_SUPABASE_PROJECT_REF=<isolated target>
FANMIND_PRODUCTION_SUPABASE_PROJECT_REF=<comparison only>
```

The restore drill stops unless `ENVIRONMENT_BOUNDARY=OK`. This preflight does not replace the separate database-host confirmation immediately before `pg_restore`.

## 1. Production checksum-only verification

Choose the encrypted artifact, not a plaintext dump:

```bash
sudo node /usr/local/lib/fanmind-ops/verify-backup-artifact.mjs \
  --artifact /var/backups/fanmind/fanmind-full-<timestamp>.tar.gz.age \
  --json
```

Expected properties:

```text
ok=true
mode=checksum_only
backupType=full
```

This verifies the adjacent `.age.sha256` file, its filename binding, the SHA-256 value and readability. It does not decrypt the artifact.

Failure conditions include:

- missing artifact or checksum file;
- malformed checksum line;
- checksum filename mismatch;
- calculated SHA-256 mismatch;
- unknown backup type.

## 2. Copy encrypted pair off-server

Always copy the pair together:

```text
<artifact>.age
<artifact>.age.sha256
```

Verify the checksum again after transfer. Do not copy the private age identity through GitHub, chat, email or unencrypted cloud storage.

## 3. Isolated content verification

On a disposable verification host with `age`, `tar` and PostgreSQL client tools installed:

```bash
node scripts/operations/verify-backup-artifact.mjs \
  --artifact /secure/input/fanmind-full-<timestamp>.tar.gz.age \
  --identity /secure/keys/fanmind-backup.agekey \
  --json
```

The tool:

- verifies the outer checksum pair;
- decrypts only into a private temporary directory;
- validates tar entries before extraction;
- rejects absolute paths and path traversal;
- validates `manifest.json`;
- requires exactly one database, Storage and server-config part in a full backup;
- validates every nested encrypted part and its checksum;
- validates the Production commit metadata;
- removes temporary plaintext automatically.

For a standalone database backup, content verification runs:

```text
pg_restore --list
```

For a standalone Storage backup, it validates every file path, size and SHA-256 against the Storage manifest.

For a standalone server-config backup, it validates gzip/tar structure and safe archive paths. It does not print file contents.

## 4. Database restore drill

### Preconditions

- isolated PostgreSQL instance or separate Supabase test project;
- empty disposable target database;
- no DNS, webhook or application configuration pointing at Production;
- written target identifier in the drill record.

Decrypt the standalone database part into a protected temporary directory. Before any restore, verify the target twice:

```bash
printf 'TARGET_HOST=%s\nTARGET_DATABASE=%s\n' "$PGHOST" "$PGDATABASE"
```

The target must not equal the Production pooler host or Production database identifier.

Restore into the empty test database:

```bash
pg_restore \
  --no-owner \
  --no-privileges \
  --exit-on-error \
  --dbname "$PGDATABASE" \
  /secure/work/fanmind-database-<timestamp>.dump
```

Post-restore checks:

```sql
select count(*) from public.workspaces;
select count(*) from public.contacts;
select count(*) from public.followups;
select count(*) from public.memories;
```

Also verify:

- expected schemas and tables exist;
- RLS remains enabled on protected customer tables;
- no Production webhook or secret values were restored into application runtime configuration;
- test logins and test data access remain isolated.

Destroy the disposable database after evidence is recorded.

## 5. Storage restore drill

Use a separate test bucket or test Supabase project. Never upload into the Production `fanmind-assets` bucket during a drill.

Steps:

1. verify and decrypt the standalone Storage artifact;
2. inspect `manifest.json` without editing it;
3. upload a small representative subset to the empty test bucket;
4. compare uploaded object count, size and SHA-256 against the manifest;
5. download the sample again and verify SHA-256;
6. delete the disposable test bucket or objects.

A full automated Storage restore is intentionally not part of the verifier. Upload remains an explicit, reviewed test-environment action.

## 6. Server configuration inspection

Decrypt only on the isolated host. Confirm the archive contains the expected categories:

- `.env.production` inside encrypted content;
- PM2 dump;
- nginx configuration;
- systemd units;
- encrypted backup-worker configuration.

Do not paste or log their contents. Compare permissions and file presence against `docs/operations/BACKUP_WORKER.md`.

## 7. Evidence record

Record the following without secrets:

```text
Drill date:
Operator:
Source artifact basename:
Outer SHA-256:
Backup type:
Production commit from manifest:
Verifier result:
Disposable DB/project identifier:
Database restore result:
Storage sample result:
RLS verification result:
Cleanup completed:
Issues found:
```

Attach only redacted command output. Never attach decrypted files, credentials or `.env` values.

## 8. Pass criteria

A restore drill passes when:

- the transferred encrypted artifact matches its SHA-256;
- decryption and structural validation succeed;
- a database dump restores into an isolated empty target without errors;
- core table checks complete;
- representative Storage objects validate after upload/download in a test bucket;
- server-config archive contents are present and readable in isolation;
- all plaintext temporary files and disposable targets are removed;
- no Production data, service or configuration was modified.

## 9. Failure handling

If any validation fails:

- do not retry by disabling checksum or path validation;
- preserve the encrypted artifact pair;
- record the verifier error code;
- create a new backup after the cause is understood;
- keep the last previously verified backup within retention;
- do not mark the backup run as restore-tested.
