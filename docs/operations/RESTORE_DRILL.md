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

The restore drill stops unless `ENVIRONMENT_BOUNDARY=OK`. This shared boundary is the first gate. Immediately before `pg_restore`, the restore-specific target preflight below repeats it and additionally binds the actual PostgreSQL host, port, database and user to an explicit isolated target.

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

For a database restore drill, use a private operator-owned directory with no
group or world permissions and opt in to both new outputs in the same
verification:

```bash
node scripts/operations/verify-backup-artifact.mjs \
  --artifact /secure/input/fanmind-full-<13-digit-timestamp>.tar.gz.age \
  --identity /secure/keys/fanmind-backup.agekey \
  --restore-dump-output /secure/work/verified-database.dump \
  --restore-receipt-output /secure/evidence/full-backup-receipt.json \
  --json
```

Both output paths must be absolute and absent. The verifier decrypts the
database part selected by the validated central manifest, validates it with
`pg_restore --list`, hashes the exact plaintext dump and publishes the dump
plus receipt as new mode-`0600` files without overwriting. The receipt binds
the exact outer artifact SHA-256, 40-character Production commit, encrypted
database-part SHA-256 and plaintext database-dump SHA-256. If any validation
or publication fails, no receipt is accepted. The age identity must be an
absolute, operator-owned, single-link regular file with no group or world
permissions. The verifier reads it without following symlinks, freezes the
stable bytes into its private temporary directory and removes that snapshot
with all other temporary plaintext.

For a standalone database backup, content verification runs:

```text
pg_restore --list
```

For a standalone Storage backup, it validates every file path, size and SHA-256 against the Storage manifest.

For a standalone server-config backup, it validates gzip/tar structure and safe archive paths. It does not print file contents.

## 4. Database restore drill

### Read-only resource readiness before the drill

Before enabling either restore write gate, run the manual GitHub workflow
`FanMind Restore Drill Resource Readiness` from `main`. It is bound to the
GitHub Environment `restore-drill` and an isolated self-hosted runner carrying
the exclusive label `fanmind-restore`.

The workflow requires the confirmation
`verify-isolated-restore-resources` and runs two strictly ordered read-only
phases.

The first phase, `restore:resources:preflight`, is checksum-only. It verifies:

- the Staging/Test application and Supabase project are distinct from
  Production;
- the independently recorded restore database target uses a host distinct from
  the Production database host;
- direct Supabase database hosts match the confirmed isolated project;
- no active `PG*` connection target, password or passfile can redirect the
  check;
- the selected encrypted `fanmind-full-*.tar.gz.age` artifact and its adjacent
  checksum are regular, non-symlink files with a matching SHA-256.

This first phase does not connect to PostgreSQL, decrypt the backup, inspect
customer data, enable `FANMIND_ENABLE_NON_PRODUCTION_WRITES`, enable
`FANMIND_ENABLE_RESTORE_DRILL`, or invoke `pg_restore`. Required final line:

```text
RESTORE_DRILL_RESOURCE_READINESS=PASS
```

Only after that line passes, the separate
`restore:target:compatibility` phase makes one read-only connection to the
explicitly confirmed isolated target. It uses the fixed PostgreSQL 17 `psql`
client, a private mode-`0600` passfile snapshot, a private CA snapshot,
`sslmode=verify-full`, and a server-enforced read-only session. Use the target's
canonical DNS hostname covered by its certificate; do not substitute an IP
address or alias.

Its one fixed query reads only `pg_catalog.pg_settings`,
`pg_catalog.pg_roles`, `pg_catalog.pg_extension`, and
`pg_catalog.pg_namespace`. It fails closed unless:

- the target server major is exactly PostgreSQL 17;
- the pre-existing roles `anon`, `authenticated`, and `service_role` are all
  present, because FanMind migrations grant or revoke privileges for them;
- the pre-installed, relocatable `pgcrypto` extension is exactly version 1.3
  in the fixed FanMind Production schema `extensions`, because five FanMind
  migrations declare `create extension if not exists pgcrypto`.

The compatibility phase never creates a role or extension, applies a
migration, decrypts a backup, invokes `pg_restore`, or enables either write
gate. Its output contains only the server major and bounded counts, never host,
database, user, file path, catalog name, password, certificate, or query error.
Required final lines:

```text
RESTORE_TARGET_COMPATIBILITY_DATABASE_CONNECTION=read_only_catalog
RESTORE_TARGET_COMPATIBILITY_TLS=verify-full
RESTORE_TARGET_COMPATIBILITY_WRITES=disabled
RESTORE_TARGET_COMPATIBILITY=PASS
```

One-time external setup for the GitHub Environment `restore-drill`:

- variables `FANMIND_RESTORE_APP_URL`,
  `FANMIND_RESTORE_SUPABASE_PROJECT_REF`,
  `FANMIND_PRODUCTION_SUPABASE_PROJECT_REF`,
  `FANMIND_RESTORE_TARGET_DB_PORT`, `FANMIND_RESTORE_TARGET_DB_NAME`,
  `FANMIND_PRODUCTION_DB_PORT` and `FANMIND_PRODUCTION_DB_NAME`;
- secrets `FANMIND_RESTORE_SUPABASE_URL`,
  `FANMIND_RESTORE_TARGET_DB_HOST`, `FANMIND_RESTORE_TARGET_DB_USER`,
  `FANMIND_PRODUCTION_DB_HOST`, `FANMIND_PRODUCTION_DB_USER` and
  `FANMIND_RESTORE_ARTIFACT_PATH`;
- secrets `FANMIND_RESTORE_TARGET_PGPASSFILE_PATH` and
  `FANMIND_RESTORE_TARGET_CA_CERT_PATH`, each containing an absolute path on
  the isolated runner. The passfile must already exist as an operator-owned,
  regular, non-symlink mode-`0600` file. The CA bundle must already exist as a
  regular, non-symlink file and must not be group- or world-writable;
- secret `FANMIND_RESTORE_AGE_IDENTITY_PATH`, containing the absolute path to
  the operator-owned, regular, non-symlink age identity on the isolated
  runner. It must have exact private permissions and must never be copied into
  GitHub secrets, logs or artifacts;
- an isolated host with a checked-out repository, Node.js and read-only access
  to the transferred encrypted artifact pair, PostgreSQL 17 client tools at
  `/usr/lib/postgresql/17/bin`, and network access only to the isolated target,
  registered only as `fanmind-restore`.

Neither readiness result counts as a restore drill. Content verification, the
transactional database restore, RLS checks, Storage sample, server-config
inspection and cleanup evidence remain mandatory.

### Controlled database restore workflow

After the read-only phases pass, the manual workflow
`FanMind Isolated Database Restore Drill` provides the controlled bridge for
the database portion. It accepts only `main`, requires
`reviewed_commit == github.sha`, binds the exact Production commit recorded in
the selected full backup and requires the confirmation
`run-isolated-database-restore`. It re-runs resource readiness and target
compatibility before either write gate is enabled.

The write step then:

1. proves the restore boundary again;
2. snapshots the private age identity, decrypts and validates the full backup;
3. restores only the receipt-bound database dump into the confirmed empty
   disposable target with `sslmode=verify-full`, the frozen CA and one
   transaction;
4. creates the private full-backup, runner and 5/5/5 database-postcheck
   receipts;
5. uploads only those three redacted receipts as a private three-day artifact;
6. removes the plaintext dump and receipt files from the runner in the final
   cleanup step.

The workflow deliberately does not upload a dump, an age identity, a passfile
or a CA file. It also does not claim final drill completion: the disposable
database still has to be destroyed by the operator, and the Storage sample,
server-config inspection, final evidence record and cleanup proof remain
separate mandatory steps.

### Preconditions

- isolated PostgreSQL instance or another dedicated PostgreSQL 17 target that
  passes the catalog-level empty-target proof; a newly provisioned Supabase
  project is not considered empty merely because it has no FanMind rows, since
  its platform schemas and objects remain present;
- PostgreSQL major 17 plus the pre-existing roles `anon`, `authenticated` and
  `service_role`, `plpgsql` 1.0 and the pre-installed `pgcrypto` 1.3 extension,
  as proven by the compatibility and empty-target phases;
- empty disposable target database;
- no DNS, webhook or application configuration pointing at Production;
- written target identifier in the drill record.

For the empty-target proof, only the exact PostgreSQL 17 member inventories of
`plpgsql` 1.0 and `pgcrypto` 1.3 are allowed: the three `plpgsql` handler
functions and its language object, plus the 36 schema-qualified `pgcrypto`
functions with their expected signatures, result types, execution attributes,
C entry points and library bindings.
The namespaces are part of the fixed FanMind Production recovery contract:
`plpgsql` must be in `pg_catalog` and `pgcrypto` 1.3 must be in `extensions`.
Production and Staging use that layout. A target with `pgcrypto` installed in
any other schema is rejected before decryption and again before `pg_restore`;
`CREATE EXTENSION IF NOT EXISTS` would otherwise leave the pre-installed
extension in the wrong schema instead of relocating it.
The proof compares that independent allowlist with PostgreSQL's extension
membership catalog in both directions, so an object attached later with
`ALTER EXTENSION ... ADD` still blocks the restore. The concrete schema object
hosting an allowed extension is exempt, including Supabase's `extensions`
schema, while every unrelated schema-scoped object inside it remains visible.
That includes relations, routines, types, collations, conversions, operators,
operator classes and families, extended statistics and text-search objects.
Schema-less database objects such as non-core languages, casts, access methods,
transforms, FDWs, foreign servers, user mappings, default ACLs, event triggers,
large objects, publications and current-database subscriptions also block the
restore. Every other non-system schema or extension blocks it before
`pg_restore` as well.

Decrypt and verify the full backup on the isolated host. The content verifier
must create a private full-backup receipt that binds the encrypted database
part and the exact decrypted database dump by SHA-256. A free environment
variable or a manually copied expected dump hash is not accepted. Both
receipts, the dump and the passfile must be regular, non-symlink files owned by
the operator with exact private permissions. The CA must be a stable regular
non-symlink file that is not group- or world-writable. Use a dedicated TCP
endpoint, `sslmode=verify-full`, the canonical certificate-covered DNS
hostname and absolute paths to the protected `PGPASSFILE` and CA; do not put
the database password in `PGPASSWORD`.

Set the actual libpq target and independently confirmed comparison metadata in the same protected shell:

```bash
export PGHOST=<isolated-target-host>
export PGPORT=<isolated-target-port>
export PGDATABASE=<isolated-target-database>
export PGUSER=<isolated-target-user>
export PGPASSFILE=<protected-passfile-path>
export PGSSLMODE=verify-full
export PGSSLROOTCERT=<protected-ca-certificate-path>
export PGGSSENCMODE=disable

export FANMIND_RESTORE_TARGET_DB_HOST=<same-isolated-target-host>
export FANMIND_RESTORE_TARGET_DB_PORT=<same-isolated-target-port>
export FANMIND_RESTORE_TARGET_DB_NAME=<same-isolated-target-database>
export FANMIND_RESTORE_TARGET_DB_USER=<same-isolated-target-user>

export FANMIND_PRODUCTION_DB_HOST=<production-comparison-host>
export FANMIND_PRODUCTION_DB_PORT=<production-comparison-port>
export FANMIND_PRODUCTION_DB_NAME=<production-comparison-database>
export FANMIND_PRODUCTION_DB_USER=<production-comparison-user>

export FANMIND_ENABLE_RESTORE_DRILL=true
export FANMIND_RESTORE_TARGET_ACK=I_UNDERSTAND_EMPTY_DISPOSABLE_DATABASE_ONLY
export FANMIND_RESTORE_DRILL_ID=2026-07-30-restore-001
export FANMIND_RESTORE_DISPOSABLE_TARGET_ID=<new-random-uuid-v4>
export FANMIND_RESTORE_PRODUCTION_COMMIT=<exact-40-character-source-commit>
export FANMIND_FULL_BACKUP_RESTORE_RECEIPT_PATH=<private-receipt-path>
export FANMIND_RESTORE_RUNNER_RECEIPT_PATH=<new-private-output-path>
export FANMIND_RESTORE_DATABASE_POSTCHECK_RECEIPT_PATH=<new-private-postcheck-output-path>
unset PGPASSWORD PGHOSTADDR PGSERVICE PGSERVICEFILE

npm run restore:preflight
```

The command is read-only and does not decrypt or restore anything. It fails unless:

- the shared write boundary confirms `staging` or `test` and a Supabase project distinct from Production;
- `PGHOST`, `PGPORT`, `PGDATABASE` and `PGUSER` exactly match the separately written restore target;
- the actual four `PG*` values are already canonical: normalized lower-case host without trailing dot, decimal port without leading zeros, and database/user without surrounding whitespace;
- the target host differs from the Production database host, independently of port, database or user;
- canonical IPv4/IPv6 spellings are enforced; legacy numeric IPv4 forms are rejected;
- no `PGHOSTADDR`, `PGSERVICE` or `PGSERVICEFILE` can silently redirect libpq;
- `PGDATABASE` is a plain database name, not a URI or libpq Connection-String;
- shared Supabase-Pooler are blocked, while a direct `db.<project-ref>.supabase.co` host must match the confirmed non-Production project;
- absolute protected `PGPASSFILE` and CA paths are configured,
  `PGSSLMODE=verify-full`, `PGGSSENCMODE=disable` and `PGPASSWORD` is absent.

Required final line:

```text
RESTORE_TARGET_BOUNDARY=OK
```

Run the guarded restore runner immediately afterwards in the same shell:

Restore into the empty test database:

```bash
npm run restore:database:drill -- \
  /secure/work/fanmind-database-<timestamp>.dump
```

The runner opens the protected non-symlink dump, full-backup receipt, passfile
and CA once, verifies their type and permissions, and copies those exact file
objects into a new operator-private snapshot directory. The supplied paths are
not trusted again afterwards. It verifies
that the private dump hash equals the hash bound into the full-backup receipt
and that the receipt names the exact Production commit. A separately supplied
free expected hash is forbidden.

It repeats the target preflight against the private passfile copy, rejects any
non-canonical active target value and makes the four checked `PG*` values
read-only inside its process. Before the write-mode call it validates the
private dump snapshot with a target-free `pg_restore --list` and queries the
target with `psql` to prove that no non-system objects exist. A nonzero,
ambiguous or unreadable result stops the runner before `pg_restore`.

The target-free archive listing is held only inside the private snapshot
directory. The fixed Production archive contract requires exactly one active
PostgreSQL 17 TOC line for `SCHEMA - extensions postgres`, bound to the
`pg_namespace` catalog class. The runner copies every TOC entry in its original
order and disables only that one schema-definition line before using the list
with `pg_restore --use-list`. This avoids replaying `CREATE SCHEMA extensions`
against the required pre-installed pgcrypto host schema. Missing, duplicated,
malformed, differently owned or ambiguous entries stop before even the
empty-target query. The `EXTENSION - pgcrypto` entry, schema or extension
comments and security labels, and every table, function or other object inside
`extensions` remain active. A broad `--exclude-schema=extensions` is forbidden
because it would omit restored Production objects. The filtered list is opened
and validated once, its path is removed, and the inherited private descriptor
is passed to `pg_restore`. The raw TOC path and filtered TOC pathname are
unlinked before the target query; the filtered bytes remain reachable only
through that private descriptor until `pg_restore` returns. The snapshot trap
also removes either path if preparation fails earlier.

The restore then uses that exact same snapshot with
`--single-transaction`. A failed archive check stops the runner before any
write, and a restore error rolls back the single transaction. Host, port, user
and database are supplied as explicit arguments while hidden libpq target
overrides are removed. Every database connection uses `verify-full` with the
frozen CA snapshot and disables GSS encryption fallback. Only after the
successful restore does the
commit-bound runner create a new private, atomic runner receipt. It binds the
drill ID, opaque disposable-target UUID, empty-target observation, exact
full-backup receipt bytes, database hashes, timestamps and successful
single-transaction result. A pre-existing output or symlink fails closed.

Immediately after that receipt is written, the same frozen target and private
passfile snapshot are used for a catalog-only post-restore query. It checks
exactly `workspaces`, `workspace_members`, `contacts`, `memories` and
`followups`: every table must exist in `public`, have RLS enabled and have at
least one PostgreSQL policy. Only a 5/5/5 result creates the separate private
`database-postcheck-receipt.json`. The receipt binds its timestamp, drill ID,
opaque disposable-target UUID and Production commit to the exact runner
receipt SHA-256. A missing table, disabled RLS, missing policy, changed
identity, pre-existing output or unsafe output directory fails closed.

The host policy canonicalizes literal IPv4 and IPv6 addresses and rejects legacy numeric IPv4 spellings. It does not perform DNS resolution. The recorded Production and isolated target identities must therefore use their real canonical endpoints, never aliases or CNAMEs; endpoint isolation remains an explicit operator precondition.

After the drill, clear the one-time gates:

```bash
export FANMIND_ENABLE_RESTORE_DRILL=false
unset FANMIND_RESTORE_TARGET_ACK
export FANMIND_ENABLE_NON_PRODUCTION_WRITES=false
unset FANMIND_NON_PRODUCTION_WRITE_ACK
```

The runner now records the core database postcheck automatically. Do not copy
`coreSchemaChecks: "passed"` or `rlsVerification: "passed"` into the final
evidence manually; schema 5 rejects both fields. Additionally verify:

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

Record the result as a protected JSON file and validate it together with the
exact three private receipts before marking the drill complete:

```bash
npm run restore:evidence:verify -- \
  --input /secure/evidence/fanmind-restore-drill.json \
  --full-receipt /secure/evidence/full-backup-receipt.json \
  --runner-receipt /secure/evidence/restore-runner-receipt.json \
  --database-postcheck-receipt /secure/evidence/database-postcheck-receipt.json
```

Required final line:

```text
RESTORE_DRILL_EVIDENCE=PASS
```

Use this exact schema and replace only the bounded placeholder values:

```json
{
  "schemaVersion": 5,
  "drillId": "2026-07-30-restore-001",
  "startedAt": "2026-07-30T08:00:00Z",
  "completedAt": "2026-07-30T08:30:00Z",
  "environment": "staging",
  "sourceArtifactBasename": "fanmind-full-1785398400000.tar.gz.age",
  "outerSha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "productionCommit": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  "fullBackupReceiptSha256": "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
  "restoreRunnerReceiptSha256": "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
  "databasePostcheckReceiptSha256": "9999999999999999999999999999999999999999999999999999999999999999",
  "databasePartEncryptedSha256": "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
  "databaseDumpSha256": "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
  "disposableTargetId": "123e4567-e89b-42d3-a456-426614174000",
  "verifier": "passed",
  "storageSample": "passed",
  "serverConfigInspection": "passed",
  "cleanup": "passed",
  "productionModified": false,
  "customerDataRecordedInEvidence": false,
  "secretsRecorded": false,
  "issues": []
}
```

The UTC timestamps must be real calendar instants, and the full-backup
basename must use the worker's exact 13-digit millisecond format. Duplicate
JSON member names are rejected before parsing. Calculate
`fullBackupReceiptSha256` over the exact receipt bytes. Copy
`databasePartEncryptedSha256` and `databaseDumpSha256` from that receipt.
Calculate `restoreRunnerReceiptSha256` over the exact runner-receipt bytes.
Calculate `databasePostcheckReceiptSha256` over the exact database-postcheck
receipt bytes. The verifier requires all three hashes, `drillId`,
`disposableTargetId`, Production commit and the evidence timestamp envelope to
match the runner and postcheck receipts. It accepts database restore and
empty-target success only from the machine-generated runner receipt and core
schema/RLS/policy success only from the machine-generated postcheck receipt.
Schema v4, a manually asserted `databaseRestore: "passed"`, manual
`coreSchemaChecks: "passed"` or manual `rlsVerification: "passed"` fail
closed.

Generate `disposableTargetId` as a new random UUID v4 for this drill. Keep the
private mapping from that opaque ID to the actual disposable host/database in
the protected operator record, never in the attachable evidence. A real
Production backup necessarily transfers customer data into the controlled
disposable restore target; the narrower
`customerDataRecordedInEvidence: false` assertion means that none of those
contents or identifiers were copied into the redacted evidence.

The evidence file and all three receipts contain keine Hostnamen, Datenbanknamen,
Benutzernamen, Passwörter, Schlüssel, Kundendaten oder freie Notizfelder. The
verifier accepts only the documented evidence and receipt keys, reads stable
private regular files, binds the artifact basename, outer SHA-256, Production
commit, database-part SHA-256, restored-dump SHA-256, empty-target observation
and transactional restore result, prints status codes only and never echoes
record values. The database postcheck receipt exposes only the fixed counts
5/5/5 and the hashes and opaque identities required for binding; it records no
table contents or policy expressions.

On success the verifier also prints:

```text
RESTORE_EVIDENCE_SHA256=<sha256-of-the-exact-validated-json-bytes>
```

Immediately before attachment, calculate `sha256sum` over the exact file and
require it to equal `RESTORE_EVIDENCE_SHA256`. Attach only those validated
bytes, the matching digest and bounded status output. Never attach decrypted
files, credentials or `.env` values.

## 8. Pass criteria

A restore drill passes when:

- the transferred encrypted artifact matches its SHA-256;
- decryption and structural validation succeed;
- a database dump restores into an isolated empty target without errors;
- the machine-bound database postcheck proves 5/5 required tables, 5/5 RLS
  enablement and 5/5 policy coverage;
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
