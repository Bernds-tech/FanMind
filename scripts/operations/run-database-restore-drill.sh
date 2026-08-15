#!/usr/bin/env bash
set -Eeuo pipefail

fail() {
  printf 'RESTORE_RUNNER_ERROR=%s\n' "$1" >&2
  exit 1
}

snapshot_dir=""
snapshot_dump=""
snapshot_passfile=""
snapshot_full_receipt=""
snapshot_ca_certificate=""

cleanup_snapshot() {
  set +e
  [[ -z "$snapshot_dump" || ! -e "$snapshot_dump" ]] \
    || unlink -- "$snapshot_dump"
  [[ -z "$snapshot_passfile" || ! -e "$snapshot_passfile" ]] \
    || unlink -- "$snapshot_passfile"
  [[ -z "$snapshot_full_receipt" || ! -e "$snapshot_full_receipt" ]] \
    || unlink -- "$snapshot_full_receipt"
  [[ -z "$snapshot_ca_certificate" || ! -e "$snapshot_ca_certificate" ]] \
    || unlink -- "$snapshot_ca_certificate"
  [[ -z "$snapshot_dir" || ! -d "$snapshot_dir" ]] \
    || rmdir -- "$snapshot_dir"
}

validate_open_ca_certificate() {
  local source_path="$1"
  local source_fd_path="$2"
  local descriptor_metadata descriptor_device descriptor_inode owner_uid
  local permissions descriptor_mode descriptor_mode_value permission_value
  local path_metadata path_device path_inode path_mode path_mode_value

  descriptor_metadata="$(stat -Lc '%d %i %u %a %f' -- "$source_fd_path")" \
    || fail "ca_certificate_metadata_unavailable"
  read -r descriptor_device descriptor_inode owner_uid permissions descriptor_mode \
    <<< "$descriptor_metadata"
  [[ "$descriptor_device" =~ ^[0-9]+$ && "$descriptor_inode" =~ ^[0-9]+$ ]] \
    || fail "ca_certificate_identity_invalid"
  [[ "$owner_uid" =~ ^[0-9]+$ && "$permissions" =~ ^[0-7]{3,4}$ ]] \
    || fail "ca_certificate_metadata_invalid"
  [[ "$descriptor_mode" =~ ^[0-9a-fA-F]+$ ]] \
    || fail "ca_certificate_type_invalid"
  descriptor_mode_value=$((16#$descriptor_mode))
  (( (descriptor_mode_value & 0170000) == 0100000 )) \
    || fail "ca_certificate_not_regular"
  permission_value=$((8#$permissions))
  (( (permission_value & 022) == 0 )) \
    || fail "ca_certificate_permissions_invalid"

  path_metadata="$(stat -c '%d %i %f' -- "$source_path")" \
    || fail "ca_certificate_path_changed_during_open"
  read -r path_device path_inode path_mode <<< "$path_metadata"
  [[ "$path_device" =~ ^[0-9]+$ && "$path_inode" =~ ^[0-9]+$ ]] \
    || fail "ca_certificate_path_identity_invalid"
  [[ "$path_mode" =~ ^[0-9a-fA-F]+$ ]] \
    || fail "ca_certificate_path_type_invalid"
  path_mode_value=$((16#$path_mode))
  (( (path_mode_value & 0170000) == 0100000 )) \
    || fail "ca_certificate_symlink_forbidden"
  [[ "$path_device" == "$descriptor_device" && "$path_inode" == "$descriptor_inode" ]] \
    || fail "ca_certificate_path_changed_during_open"
}

validate_open_source() {
  local source_label="$1"
  local source_path="$2"
  local source_fd_path="$3"
  local descriptor_metadata descriptor_device descriptor_inode
  local owner_uid permissions descriptor_mode descriptor_mode_value
  local path_metadata path_device path_inode path_mode path_mode_value

  descriptor_metadata="$(stat -Lc '%d %i %u %a %f' -- "$source_fd_path")" \
    || fail "${source_label}_metadata_unavailable"
  read -r descriptor_device descriptor_inode owner_uid permissions descriptor_mode \
    <<< "$descriptor_metadata"
  [[ "$descriptor_device" =~ ^[0-9]+$ && "$descriptor_inode" =~ ^[0-9]+$ ]] \
    || fail "${source_label}_identity_invalid"
  [[ "$owner_uid" =~ ^[0-9]+$ ]] || fail "${source_label}_owner_invalid"
  [[ "$permissions" =~ ^[0-7]{3,4}$ ]] || fail "${source_label}_mode_invalid"
  [[ "$descriptor_mode" =~ ^[0-9a-fA-F]+$ ]] \
    || fail "${source_label}_type_invalid"
  descriptor_mode_value=$((16#$descriptor_mode))
  (( (descriptor_mode_value & 0170000) == 0100000 )) \
    || fail "${source_label}_not_regular"
  [[ "$owner_uid" == "$(id -u)" ]] || fail "${source_label}_owner_mismatch"
  local permission_value=$((8#$permissions))
  (( (permission_value & 077) == 0 )) \
    || fail "${source_label}_permissions_too_open"

  path_metadata="$(stat -c '%d %i %f' -- "$source_path")" \
    || fail "${source_label}_path_changed_during_open"
  read -r path_device path_inode path_mode <<< "$path_metadata"
  [[ "$path_device" =~ ^[0-9]+$ && "$path_inode" =~ ^[0-9]+$ ]] \
    || fail "${source_label}_path_identity_invalid"
  [[ "$path_mode" =~ ^[0-9a-fA-F]+$ ]] \
    || fail "${source_label}_path_type_invalid"
  path_mode_value=$((16#$path_mode))
  (( (path_mode_value & 0170000) == 0100000 )) \
    || fail "${source_label}_symlink_forbidden"
  [[ "$path_device" == "$descriptor_device" && "$path_inode" == "$descriptor_inode" ]] \
    || fail "${source_label}_path_changed_during_open"
}

validate_output_path() {
  local output_path="$1"
  local output_label="$2"
  local output_parent output_canonical metadata owner_uid permissions mode
  local mode_value permission_value

  [[ "$output_path" = /* ]] || fail "${output_label}_path_must_be_absolute"
  [[ ! -e "$output_path" && ! -L "$output_path" ]] \
    || fail "${output_label}_already_exists"
  output_parent="$(dirname -- "$output_path")"
  [[ ! -L "$output_parent" && -d "$output_parent" ]] \
    || fail "${output_label}_directory_unsafe"
  output_canonical="$(realpath -- "$output_parent")" \
    || fail "${output_label}_directory_unavailable"
  [[ "$output_parent" == "$output_canonical" ]] \
    || fail "${output_label}_directory_unsafe"
  metadata="$(stat -Lc '%u %a %f' -- "$output_parent")" \
    || fail "${output_label}_directory_unavailable"
  read -r owner_uid permissions mode <<< "$metadata"
  [[ "$owner_uid" == "$(id -u)" ]] \
    || fail "${output_label}_directory_owner_mismatch"
  [[ "$permissions" =~ ^[0-7]{3,4}$ && "$mode" =~ ^[0-9a-fA-F]+$ ]] \
    || fail "${output_label}_directory_metadata_invalid"
  mode_value=$((16#$mode))
  (( (mode_value & 0170000) == 0040000 )) \
    || fail "${output_label}_directory_unsafe"
  permission_value=$((8#$permissions))
  (( (permission_value & 077) == 0 )) \
    || fail "${output_label}_directory_permissions_invalid"
}

[[ "$#" -eq 1 ]] || fail "exactly_one_dump_path_required"

dump_path="$1"
[[ "$dump_path" != -* ]] || fail "option_like_dump_path_forbidden"
[[ ! -L "$dump_path" ]] || fail "dump_symlink_forbidden"
[[ -f "$dump_path" && -r "$dump_path" ]] || fail "dump_file_not_readable"

: "${PGHOST:?PGHOST is required}"
: "${PGPORT:?PGPORT is required}"
: "${PGDATABASE:?PGDATABASE is required}"
: "${PGUSER:?PGUSER is required}"
: "${PGPASSFILE:?PGPASSFILE is required}"
: "${PGSSLMODE:?PGSSLMODE is required}"
: "${PGSSLROOTCERT:?PGSSLROOTCERT is required}"
: "${PGGSSENCMODE:?PGGSSENCMODE is required}"
: "${FANMIND_FULL_BACKUP_RESTORE_RECEIPT_PATH:?FANMIND_FULL_BACKUP_RESTORE_RECEIPT_PATH is required}"
: "${FANMIND_RESTORE_RUNNER_RECEIPT_PATH:?FANMIND_RESTORE_RUNNER_RECEIPT_PATH is required}"
: "${FANMIND_RESTORE_DATABASE_POSTCHECK_RECEIPT_PATH:?FANMIND_RESTORE_DATABASE_POSTCHECK_RECEIPT_PATH is required}"
: "${FANMIND_RESTORE_DRILL_ID:?FANMIND_RESTORE_DRILL_ID is required}"
: "${FANMIND_RESTORE_DISPOSABLE_TARGET_ID:?FANMIND_RESTORE_DISPOSABLE_TARGET_ID is required}"
: "${FANMIND_RESTORE_PRODUCTION_COMMIT:?FANMIND_RESTORE_PRODUCTION_COMMIT is required}"

[[ "$PGPASSFILE" = /* ]] || fail "passfile_path_must_be_absolute"
[[ ! -L "$PGPASSFILE" ]] || fail "passfile_symlink_forbidden"
[[ -f "$PGPASSFILE" && -r "$PGPASSFILE" ]] || fail "passfile_not_readable"
[[ "$PGSSLMODE" == "verify-full" ]] || fail "sslmode_must_be_verify_full"
[[ "$PGGSSENCMODE" == "disable" ]] || fail "gss_encryption_must_be_disabled"
[[ "$PGSSLROOTCERT" = /* ]] || fail "ca_certificate_path_must_be_absolute"
[[ ! -L "$PGSSLROOTCERT" ]] || fail "ca_certificate_symlink_forbidden"
[[ -f "$PGSSLROOTCERT" && -r "$PGSSLROOTCERT" ]] \
  || fail "ca_certificate_not_readable"
[[ "$FANMIND_FULL_BACKUP_RESTORE_RECEIPT_PATH" = /* ]] \
  || fail "full_backup_receipt_path_must_be_absolute"
[[ ! -L "$FANMIND_FULL_BACKUP_RESTORE_RECEIPT_PATH" ]] \
  || fail "full_backup_receipt_symlink_forbidden"
[[ -f "$FANMIND_FULL_BACKUP_RESTORE_RECEIPT_PATH" \
  && -r "$FANMIND_FULL_BACKUP_RESTORE_RECEIPT_PATH" ]] \
  || fail "full_backup_receipt_not_readable"
[[ "$FANMIND_RESTORE_DRILL_ID" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}-[a-z0-9][a-z0-9-]{0,47}$ ]] \
  || fail "restore_drill_id_invalid"
[[ "$FANMIND_RESTORE_DISPOSABLE_TARGET_ID" =~ ^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$ ]] \
  || fail "restore_disposable_target_id_invalid"
[[ "$FANMIND_RESTORE_PRODUCTION_COMMIT" =~ ^[0-9a-f]{40}$ ]] \
  || fail "restore_production_commit_invalid"
[[ "$FANMIND_RESTORE_RUNNER_RECEIPT_PATH" != "$FANMIND_RESTORE_DATABASE_POSTCHECK_RECEIPT_PATH" ]] \
  || fail "restore_receipt_paths_must_be_distinct"
validate_output_path "$FANMIND_RESTORE_RUNNER_RECEIPT_PATH" "runner_receipt"
validate_output_path \
  "$FANMIND_RESTORE_DATABASE_POSTCHECK_RECEIPT_PATH" \
  "database_postcheck_receipt"

operational_test_mode="${FANMIND_OPERATIONAL_TEST_MODE:-}"
pg_restore_override="${FANMIND_PG_RESTORE_BIN:-}"
psql_override="${FANMIND_PSQL_BIN:-}"
if [[ -n "$pg_restore_override" || -n "$psql_override" ]]; then
  [[ "$operational_test_mode" == "restore-runner-test" ]] \
    || fail "operational_binary_override_forbidden"
fi
[[ -z "$operational_test_mode" || "$operational_test_mode" == "restore-runner-test" ]] \
  || fail "operational_test_mode_invalid"

pg_restore_bin="${pg_restore_override:-/usr/lib/postgresql/17/bin/pg_restore}"
psql_bin="${psql_override:-/usr/lib/postgresql/17/bin/psql}"
[[ "$pg_restore_bin" = /* && -x "$pg_restore_bin" ]] \
  || fail "pg_restore_not_executable"
[[ "$psql_bin" = /* && -x "$psql_bin" ]] \
  || fail "psql_not_executable"

exec {passfile_fd}<"$PGPASSFILE" || fail "passfile_open_failed"
passfile_fd_path="/proc/self/fd/$passfile_fd"
validate_open_source "passfile" "$PGPASSFILE" "$passfile_fd_path"

exec {ca_certificate_fd}<"$PGSSLROOTCERT" \
  || fail "ca_certificate_open_failed"
ca_certificate_fd_path="/proc/self/fd/$ca_certificate_fd"
validate_open_ca_certificate "$PGSSLROOTCERT" "$ca_certificate_fd_path"

exec {dump_fd}<"$dump_path" || fail "dump_open_failed"
dump_fd_path="/proc/self/fd/$dump_fd"
validate_open_source "dump" "$dump_path" "$dump_fd_path"

exec {full_receipt_fd}<"$FANMIND_FULL_BACKUP_RESTORE_RECEIPT_PATH" \
  || fail "full_backup_receipt_open_failed"
full_receipt_fd_path="/proc/self/fd/$full_receipt_fd"
validate_open_source \
  "full_backup_receipt" \
  "$FANMIND_FULL_BACKUP_RESTORE_RECEIPT_PATH" \
  "$full_receipt_fd_path"

umask 077
snapshot_dir="$(mktemp -d -- "${TMPDIR:-/tmp}/fanmind-restore.XXXXXX")" \
  || fail "snapshot_directory_create_failed"
trap cleanup_snapshot EXIT
snapshot_dump="$snapshot_dir/database.dump"
snapshot_passfile="$snapshot_dir/restore.pgpass"
snapshot_full_receipt="$snapshot_dir/full-backup-receipt.json"
snapshot_ca_certificate="$snapshot_dir/restore-ca.pem"

cp -- "$dump_fd_path" "$snapshot_dump" || fail "dump_snapshot_failed"
cp -- "$passfile_fd_path" "$snapshot_passfile" || fail "passfile_snapshot_failed"
cp -- "$full_receipt_fd_path" "$snapshot_full_receipt" \
  || fail "full_backup_receipt_snapshot_failed"
cp -- "$ca_certificate_fd_path" "$snapshot_ca_certificate" \
  || fail "ca_certificate_snapshot_failed"
chmod 0600 \
  "$snapshot_dump" \
  "$snapshot_passfile" \
  "$snapshot_full_receipt" \
  "$snapshot_ca_certificate" \
  || fail "snapshot_permissions_failed"
exec {dump_fd}<&-
exec {passfile_fd}<&-
exec {full_receipt_fd}<&-
exec {ca_certificate_fd}<&-

PGPASSFILE="$snapshot_passfile"
PGSSLROOTCERT="$snapshot_ca_certificate"
export PGPASSFILE
export PGSSLROOTCERT
readonly \
  PGHOST \
  PGPORT \
  PGDATABASE \
  PGUSER \
  PGPASSFILE \
  PGSSLMODE \
  PGSSLROOTCERT \
  PGGSSENCMODE

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd -- "$script_dir/../.." && pwd)"
cd "$repo_root"

FANMIND_RESTORE_STARTED_AT="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
  || fail "started_timestamp_failed"
export FANMIND_RESTORE_STARTED_AT

node scripts/operations/verify-full-backup-restore-receipt.mjs \
  --receipt "$snapshot_full_receipt" \
  --dump "$snapshot_dump" \
  >/dev/null \
  || fail "full_backup_receipt_verification_failed"

node scripts/operations/restore-target-preflight.mjs

if ! env \
  -u PGHOST \
  -u PGPORT \
  -u PGDATABASE \
  -u PGUSER \
  -u PGHOSTADDR \
  -u PGSERVICE \
  -u PGSERVICEFILE \
  -u PGPASSWORD \
  -u PGPASSFILE \
  -u PGSSLMODE \
  -u PGSSLROOTCERT \
  -u PGGSSENCMODE \
  -u PGOPTIONS \
  "$pg_restore_bin" \
  --list \
  "$snapshot_dump" \
  >/dev/null 2>&1
then
  fail "dump_archive_validation_failed"
fi

empty_target_sql="
WITH expected_extension_versions(
  extname,
  extversion,
  relocatable,
  schema_name
) AS (
  VALUES
    ('plpgsql', '1.0', false, 'pg_catalog'),
    ('pgcrypto', '1.3', true, 'extensions')
),
allowed_extensions AS (
  SELECT e.oid, e.extname, e.extowner, e.extnamespace
    FROM pg_catalog.pg_extension AS e
    JOIN expected_extension_versions AS expected
      ON expected.extname = e.extname
     AND expected.extversion = e.extversion
     AND expected.relocatable = e.extrelocatable
    JOIN pg_catalog.pg_namespace AS n
      ON n.oid = e.extnamespace
     AND n.nspname = expected.schema_name
   WHERE e.extconfig IS NULL
     AND e.extcondition IS NULL
),
expected_extension_functions(
  extname,
  proname,
  identity_arguments,
  c_symbol,
  result_type,
  is_strict,
  volatility,
  parallel_safety
) AS (
  VALUES
    ('plpgsql', 'plpgsql_call_handler', '', 'plpgsql_call_handler', 'language_handler', false, 'v', 'u'),
    ('plpgsql', 'plpgsql_inline_handler', 'internal', 'plpgsql_inline_handler', 'void', true, 'v', 'u'),
    ('plpgsql', 'plpgsql_validator', 'oid', 'plpgsql_validator', 'void', true, 'v', 'u'),
    ('pgcrypto', 'digest', 'text, text', 'pg_digest', 'bytea', true, 'i', 's'),
    ('pgcrypto', 'digest', 'bytea, text', 'pg_digest', 'bytea', true, 'i', 's'),
    ('pgcrypto', 'hmac', 'text, text, text', 'pg_hmac', 'bytea', true, 'i', 's'),
    ('pgcrypto', 'hmac', 'bytea, bytea, text', 'pg_hmac', 'bytea', true, 'i', 's'),
    ('pgcrypto', 'crypt', 'text, text', 'pg_crypt', 'text', true, 'i', 's'),
    ('pgcrypto', 'gen_salt', 'text', 'pg_gen_salt', 'text', true, 'v', 's'),
    ('pgcrypto', 'gen_salt', 'text, integer', 'pg_gen_salt_rounds', 'text', true, 'v', 's'),
    ('pgcrypto', 'encrypt', 'bytea, bytea, text', 'pg_encrypt', 'bytea', true, 'i', 's'),
    ('pgcrypto', 'decrypt', 'bytea, bytea, text', 'pg_decrypt', 'bytea', true, 'i', 's'),
    ('pgcrypto', 'encrypt_iv', 'bytea, bytea, bytea, text', 'pg_encrypt_iv', 'bytea', true, 'i', 's'),
    ('pgcrypto', 'decrypt_iv', 'bytea, bytea, bytea, text', 'pg_decrypt_iv', 'bytea', true, 'i', 's'),
    ('pgcrypto', 'gen_random_bytes', 'integer', 'pg_random_bytes', 'bytea', true, 'v', 's'),
    -- This is the pgcrypto C wrapper in extensions, not pg_catalog's
    -- separate internal-language function with the same name.
    ('pgcrypto', 'gen_random_uuid', '', 'pg_random_uuid', 'uuid', false, 'v', 's'),
    ('pgcrypto', 'pgp_sym_encrypt', 'text, text', 'pgp_sym_encrypt_text', 'bytea', true, 'v', 's'),
    ('pgcrypto', 'pgp_sym_encrypt_bytea', 'bytea, text', 'pgp_sym_encrypt_bytea', 'bytea', true, 'v', 's'),
    ('pgcrypto', 'pgp_sym_encrypt', 'text, text, text', 'pgp_sym_encrypt_text', 'bytea', true, 'v', 's'),
    ('pgcrypto', 'pgp_sym_encrypt_bytea', 'bytea, text, text', 'pgp_sym_encrypt_bytea', 'bytea', true, 'v', 's'),
    ('pgcrypto', 'pgp_sym_decrypt', 'bytea, text', 'pgp_sym_decrypt_text', 'text', true, 'i', 's'),
    ('pgcrypto', 'pgp_sym_decrypt_bytea', 'bytea, text', 'pgp_sym_decrypt_bytea', 'bytea', true, 'i', 's'),
    ('pgcrypto', 'pgp_sym_decrypt', 'bytea, text, text', 'pgp_sym_decrypt_text', 'text', true, 'i', 's'),
    ('pgcrypto', 'pgp_sym_decrypt_bytea', 'bytea, text, text', 'pgp_sym_decrypt_bytea', 'bytea', true, 'i', 's'),
    ('pgcrypto', 'pgp_pub_encrypt', 'text, bytea', 'pgp_pub_encrypt_text', 'bytea', true, 'v', 's'),
    ('pgcrypto', 'pgp_pub_encrypt_bytea', 'bytea, bytea', 'pgp_pub_encrypt_bytea', 'bytea', true, 'v', 's'),
    ('pgcrypto', 'pgp_pub_encrypt', 'text, bytea, text', 'pgp_pub_encrypt_text', 'bytea', true, 'v', 's'),
    ('pgcrypto', 'pgp_pub_encrypt_bytea', 'bytea, bytea, text', 'pgp_pub_encrypt_bytea', 'bytea', true, 'v', 's'),
    ('pgcrypto', 'pgp_pub_decrypt', 'bytea, bytea', 'pgp_pub_decrypt_text', 'text', true, 'i', 's'),
    ('pgcrypto', 'pgp_pub_decrypt_bytea', 'bytea, bytea', 'pgp_pub_decrypt_bytea', 'bytea', true, 'i', 's'),
    ('pgcrypto', 'pgp_pub_decrypt', 'bytea, bytea, text', 'pgp_pub_decrypt_text', 'text', true, 'i', 's'),
    ('pgcrypto', 'pgp_pub_decrypt_bytea', 'bytea, bytea, text', 'pgp_pub_decrypt_bytea', 'bytea', true, 'i', 's'),
    ('pgcrypto', 'pgp_pub_decrypt', 'bytea, bytea, text, text', 'pgp_pub_decrypt_text', 'text', true, 'i', 's'),
    ('pgcrypto', 'pgp_pub_decrypt_bytea', 'bytea, bytea, text, text', 'pgp_pub_decrypt_bytea', 'bytea', true, 'i', 's'),
    ('pgcrypto', 'pgp_key_id', 'bytea', 'pgp_key_id_w', 'text', true, 'i', 's'),
    ('pgcrypto', 'armor', 'bytea', 'pg_armor', 'text', true, 'i', 's'),
    ('pgcrypto', 'armor', 'bytea, text[], text[]', 'pg_armor', 'text', true, 'i', 's'),
    ('pgcrypto', 'dearmor', 'text', 'pg_dearmor', 'bytea', true, 'i', 's'),
    -- PostgreSQL 17 includes the OUT columns in this function's rendered
    -- identity arguments; keep them exact as well as the SETOF result.
    ('pgcrypto', 'pgp_armor_headers', 'text, OUT key text, OUT value text', 'pgp_armor_headers', 'SETOF record', true, 'i', 's')
),
resolved_extension_functions AS (
  SELECT expected.extname,
         expected.proname,
         expected.identity_arguments,
         expected.c_symbol,
         expected.result_type,
         expected.is_strict,
         expected.volatility,
         expected.parallel_safety,
         p.oid
    FROM expected_extension_functions AS expected
    JOIN allowed_extensions AS e ON e.extname = expected.extname
    JOIN pg_catalog.pg_proc AS p
      ON p.pronamespace = e.extnamespace
     AND p.proname = expected.proname
     AND pg_catalog.pg_get_function_identity_arguments(p.oid)
       = expected.identity_arguments
    JOIN pg_catalog.pg_language AS l ON l.oid = p.prolang
   WHERE p.prokind = 'f'
     AND l.lanname = 'c'
     AND p.probin = '\$libdir/' || expected.extname
     AND p.prosrc = expected.c_symbol
     -- Trusted extension scripts may create objects as the bootstrap superuser.
     AND p.proowner IN (e.extowner, 10::pg_catalog.oid)
     AND pg_catalog.pg_get_function_result(p.oid) = expected.result_type
     AND p.proisstrict = expected.is_strict
     AND p.provolatile = expected.volatility
     AND p.proparallel = expected.parallel_safety
     AND NOT p.prosecdef
     AND NOT p.proleakproof
     AND p.proconfig IS NULL
     AND p.protrftypes IS NULL
     AND p.prosupport = 0
     AND p.provariadic = 0
     AND p.pronargdefaults = 0
     AND p.proargdefaults IS NULL
     AND p.procost = 1
     AND p.prorows = CASE
       WHEN expected.result_type LIKE 'SETOF %' THEN 1000
       ELSE 0
     END
),
resolved_extension_languages AS (
  SELECT e.extname, l.oid
    FROM allowed_extensions AS e
    JOIN pg_catalog.pg_language AS l ON l.lanname = 'plpgsql'
    JOIN resolved_extension_functions AS call_handler
      ON call_handler.extname = 'plpgsql'
     AND call_handler.proname = 'plpgsql_call_handler'
     AND call_handler.identity_arguments = ''
    JOIN resolved_extension_functions AS inline_handler
      ON inline_handler.extname = 'plpgsql'
     AND inline_handler.proname = 'plpgsql_inline_handler'
     AND inline_handler.identity_arguments = 'internal'
    JOIN resolved_extension_functions AS validator
      ON validator.extname = 'plpgsql'
     AND validator.proname = 'plpgsql_validator'
     AND validator.identity_arguments = 'oid'
   WHERE e.extname = 'plpgsql'
     AND l.lanispl
     AND l.lanpltrusted
     AND l.lanplcallfoid = call_handler.oid
     AND l.laninline = inline_handler.oid
     AND l.lanvalidator = validator.oid
     AND l.lanowner = e.extowner
     AND l.lanacl IS NULL
),
expected_extension_addresses AS (
  SELECT functions.extname,
         'pg_catalog.pg_proc'::pg_catalog.regclass AS classid,
         functions.oid AS objid,
         0 AS objsubid
    FROM resolved_extension_functions AS functions
  UNION ALL
  SELECT languages.extname,
         'pg_catalog.pg_language'::pg_catalog.regclass AS classid,
         languages.oid AS objid,
         0 AS objsubid
    FROM resolved_extension_languages AS languages
),
actual_extension_addresses AS (
  SELECT e.extname, d.classid, d.objid, d.objsubid
    FROM allowed_extensions AS e
    JOIN pg_catalog.pg_depend AS d
      ON d.refclassid = 'pg_catalog.pg_extension'::pg_catalog.regclass
     AND d.refobjid = e.oid
     AND d.deptype = 'e'
),
extension_inventory_violations AS (
  SELECT 1 AS violation
    FROM expected_extension_versions AS expected
   WHERE NOT EXISTS (
     SELECT 1
       FROM allowed_extensions AS allowed
      WHERE allowed.extname = expected.extname
   )
  UNION ALL
  SELECT 1
    FROM expected_extension_functions AS expected
   WHERE NOT EXISTS (
     SELECT 1
       FROM resolved_extension_functions AS resolved
      WHERE resolved.extname = expected.extname
        AND resolved.proname = expected.proname
        AND resolved.identity_arguments = expected.identity_arguments
        AND resolved.c_symbol = expected.c_symbol
        AND resolved.result_type = expected.result_type
        AND resolved.is_strict = expected.is_strict
        AND resolved.volatility = expected.volatility
        AND resolved.parallel_safety = expected.parallel_safety
   )
  UNION ALL
  SELECT 1
   WHERE NOT EXISTS (
     SELECT 1 FROM resolved_extension_languages
   )
  UNION ALL
  SELECT 1
    FROM actual_extension_addresses AS actual
   WHERE NOT EXISTS (
     SELECT 1
       FROM expected_extension_addresses AS expected
      WHERE expected.extname = actual.extname
        AND expected.classid = actual.classid
        AND expected.objid = actual.objid
        AND expected.objsubid = actual.objsubid
   )
  UNION ALL
  SELECT 1
    FROM expected_extension_addresses AS expected
   WHERE NOT EXISTS (
     SELECT 1
       FROM actual_extension_addresses AS actual
      WHERE actual.extname = expected.extname
        AND actual.classid = expected.classid
        AND actual.objid = expected.objid
        AND actual.objsubid = expected.objsubid
   )
),
allowed_extension_schemas AS (
  SELECT DISTINCT e.extnamespace AS oid
    FROM allowed_extensions AS e
),
schema_objects(classid, objid, nspoid) AS (
  SELECT 'pg_catalog.pg_class'::pg_catalog.regclass,
         c.oid,
         c.relnamespace
    FROM pg_catalog.pg_class AS c
  UNION ALL
  SELECT 'pg_catalog.pg_proc'::pg_catalog.regclass,
         p.oid,
         p.pronamespace
    FROM pg_catalog.pg_proc AS p
  UNION ALL
  SELECT 'pg_catalog.pg_type'::pg_catalog.regclass,
         t.oid,
         t.typnamespace
    FROM pg_catalog.pg_type AS t
  UNION ALL
  SELECT 'pg_catalog.pg_collation'::pg_catalog.regclass,
         c.oid,
         c.collnamespace
    FROM pg_catalog.pg_collation AS c
  UNION ALL
  SELECT 'pg_catalog.pg_conversion'::pg_catalog.regclass,
         c.oid,
         c.connamespace
    FROM pg_catalog.pg_conversion AS c
  UNION ALL
  SELECT 'pg_catalog.pg_operator'::pg_catalog.regclass,
         o.oid,
         o.oprnamespace
    FROM pg_catalog.pg_operator AS o
  UNION ALL
  SELECT 'pg_catalog.pg_opclass'::pg_catalog.regclass,
         o.oid,
         o.opcnamespace
    FROM pg_catalog.pg_opclass AS o
  UNION ALL
  SELECT 'pg_catalog.pg_opfamily'::pg_catalog.regclass,
         o.oid,
         o.opfnamespace
    FROM pg_catalog.pg_opfamily AS o
  UNION ALL
  SELECT 'pg_catalog.pg_statistic_ext'::pg_catalog.regclass,
         s.oid,
         s.stxnamespace
    FROM pg_catalog.pg_statistic_ext AS s
  UNION ALL
  SELECT 'pg_catalog.pg_ts_parser'::pg_catalog.regclass,
         p.oid,
         p.prsnamespace
    FROM pg_catalog.pg_ts_parser AS p
  UNION ALL
  SELECT 'pg_catalog.pg_ts_dict'::pg_catalog.regclass,
         d.oid,
         d.dictnamespace
    FROM pg_catalog.pg_ts_dict AS d
  UNION ALL
  SELECT 'pg_catalog.pg_ts_template'::pg_catalog.regclass,
         t.oid,
         t.tmplnamespace
    FROM pg_catalog.pg_ts_template AS t
  UNION ALL
  SELECT 'pg_catalog.pg_ts_config'::pg_catalog.regclass,
         c.oid,
         c.cfgnamespace
    FROM pg_catalog.pg_ts_config AS c
  UNION ALL
  SELECT 'pg_catalog.pg_constraint'::pg_catalog.regclass,
         c.oid,
         c.connamespace
    FROM pg_catalog.pg_constraint AS c
   WHERE c.connamespace <> 0
),
schema_object_violations AS (
  SELECT 1 AS violation
    FROM schema_objects AS object
    JOIN pg_catalog.pg_namespace AS n ON n.oid = object.nspoid
   WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
     AND n.nspname !~ '^pg_toast'
     AND NOT EXISTS (
       SELECT 1
         FROM expected_extension_addresses AS allowed
        WHERE allowed.classid = object.classid
          AND allowed.objid = object.objid
          AND allowed.objsubid = 0
     )
),
top_level_object_violations AS (
  SELECT 1 AS violation
    FROM pg_catalog.pg_language AS l
   WHERE l.oid NOT IN (
     12::pg_catalog.oid,
     13::pg_catalog.oid,
     14::pg_catalog.oid
   )
     AND NOT EXISTS (
       SELECT 1
         FROM resolved_extension_languages AS allowed
        WHERE allowed.oid = l.oid
     )
  UNION ALL
  SELECT 1
    FROM pg_catalog.pg_cast AS c
   WHERE c.oid >= 16384::pg_catalog.oid
  UNION ALL
  SELECT 1
    FROM pg_catalog.pg_am AS a
   WHERE a.oid >= 16384::pg_catalog.oid
  UNION ALL
  SELECT 1
    FROM pg_catalog.pg_transform AS t
   WHERE t.oid >= 16384::pg_catalog.oid
  UNION ALL
  SELECT 1
    FROM pg_catalog.pg_foreign_data_wrapper AS f
   WHERE f.oid >= 16384::pg_catalog.oid
  UNION ALL
  SELECT 1 FROM pg_catalog.pg_foreign_server
  UNION ALL
  SELECT 1 FROM pg_catalog.pg_user_mapping
  UNION ALL
  SELECT 1 FROM pg_catalog.pg_default_acl
  UNION ALL
  SELECT 1 FROM pg_catalog.pg_event_trigger
  UNION ALL
  SELECT 1 FROM pg_catalog.pg_largeobject_metadata
  UNION ALL
  SELECT 1 FROM pg_catalog.pg_publication
  UNION ALL
  SELECT 1
    FROM pg_catalog.pg_subscription AS s
   WHERE s.subdbid = (
     SELECT d.oid
       FROM pg_catalog.pg_database AS d
      WHERE d.datname = pg_catalog.current_database()
   )
),
user_objects AS (
  SELECT violation FROM schema_object_violations
  UNION ALL
  SELECT 1
    FROM pg_catalog.pg_extension AS e
   WHERE NOT EXISTS (
     SELECT 1
       FROM allowed_extensions AS allowed
      WHERE allowed.oid = e.oid
   )
  UNION ALL
  SELECT 1
    FROM pg_catalog.pg_namespace AS n
   WHERE n.nspname NOT IN ('pg_catalog', 'information_schema', 'public')
     AND n.nspname !~ '^pg_toast'
     AND NOT EXISTS (
       SELECT 1
         FROM allowed_extension_schemas AS allowed
        WHERE allowed.oid = n.oid
     )
  UNION ALL
  SELECT violation FROM top_level_object_violations
  UNION ALL
  SELECT violation FROM extension_inventory_violations
)
SELECT COUNT(*)::text FROM user_objects;
"

if ! empty_target_result="$(
  env \
    -u PGHOST \
    -u PGPORT \
    -u PGDATABASE \
    -u PGUSER \
    -u PGHOSTADDR \
    -u PGSERVICE \
    -u PGSERVICEFILE \
    -u PGPASSWORD \
    -u PGSSLMODE \
    -u PGSSLROOTCERT \
    -u PGGSSENCMODE \
    -u PGOPTIONS \
    PGPASSFILE="$snapshot_passfile" \
    PGSSLMODE="verify-full" \
    PGSSLROOTCERT="$snapshot_ca_certificate" \
    PGGSSENCMODE="disable" \
    PGOPTIONS="-c default_transaction_read_only=on -c search_path=pg_catalog,pg_temp" \
    "$psql_bin" \
    --no-psqlrc \
    --no-align \
    --tuples-only \
    --quiet \
    --set ON_ERROR_STOP=1 \
    --no-password \
    --host "$PGHOST" \
    --port "$PGPORT" \
    --username "$PGUSER" \
    --dbname "$PGDATABASE" \
    --command "$empty_target_sql" \
    2>/dev/null
)"
then
  fail "empty_target_query_failed"
fi
[[ "$empty_target_result" == "0" ]] || fail "restore_target_not_empty"

FANMIND_RESTORE_EMPTY_TARGET_OBSERVED_AT="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
  || fail "empty_target_timestamp_failed"
FANMIND_RESTORE_EMPTY_TARGET_OBJECT_COUNT="0"
export FANMIND_RESTORE_EMPTY_TARGET_OBSERVED_AT
export FANMIND_RESTORE_EMPTY_TARGET_OBJECT_COUNT

if ! env \
  -u PGHOST \
  -u PGPORT \
  -u PGDATABASE \
  -u PGUSER \
  -u PGHOSTADDR \
  -u PGSERVICE \
  -u PGSERVICEFILE \
  -u PGPASSWORD \
  -u PGSSLMODE \
  -u PGSSLROOTCERT \
  -u PGGSSENCMODE \
  -u PGOPTIONS \
  PGPASSFILE="$snapshot_passfile" \
  PGSSLMODE="verify-full" \
  PGSSLROOTCERT="$snapshot_ca_certificate" \
  PGGSSENCMODE="disable" \
  "$pg_restore_bin" \
  --no-owner \
  --no-privileges \
  --exit-on-error \
  --single-transaction \
  --no-password \
  --host "$PGHOST" \
  --port "$PGPORT" \
  --username "$PGUSER" \
  --dbname "$PGDATABASE" \
  "$snapshot_dump" \
  >/dev/null 2>&1
then
  fail "database_restore_failed"
fi

FANMIND_RESTORE_COMPLETED_AT="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
  || fail "completed_timestamp_failed"
export FANMIND_RESTORE_COMPLETED_AT

node scripts/operations/restore-runner-receipt.mjs \
  --full-receipt "$snapshot_full_receipt" \
  --dump "$snapshot_dump" \
  --output "$FANMIND_RESTORE_RUNNER_RECEIPT_PATH"

postcheck_sql="
WITH fanmind_required_restore_tables(table_name) AS (
  VALUES
    ('contacts'),
    ('followups'),
    ('memories'),
    ('workspace_members'),
    ('workspaces')
)
SELECT required.table_name,
       CASE WHEN target.oid IS NULL THEN '0' ELSE '1' END,
       CASE WHEN COALESCE(target.relrowsecurity, false) THEN '1' ELSE '0' END,
       COALESCE(policies.policy_count, 0)::text
  FROM fanmind_required_restore_tables AS required
  LEFT JOIN LATERAL (
    SELECT c.oid, c.relrowsecurity
      FROM pg_catalog.pg_class AS c
      JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND c.relname = required.table_name
       AND c.relkind IN ('r', 'p')
  ) AS target ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::integer AS policy_count
      FROM pg_catalog.pg_policy AS p
     WHERE p.polrelid = target.oid
  ) AS policies ON true
 ORDER BY required.table_name;
"

if ! postcheck_result="$(
  env \
    -u PGHOST \
    -u PGPORT \
    -u PGDATABASE \
    -u PGUSER \
    -u PGHOSTADDR \
    -u PGSERVICE \
    -u PGSERVICEFILE \
    -u PGPASSWORD \
    -u PGSSLMODE \
    -u PGSSLROOTCERT \
    -u PGGSSENCMODE \
    -u PGOPTIONS \
    PGPASSFILE="$snapshot_passfile" \
    PGSSLMODE="verify-full" \
    PGSSLROOTCERT="$snapshot_ca_certificate" \
    PGGSSENCMODE="disable" \
    "$psql_bin" \
    --no-psqlrc \
    --no-align \
    --tuples-only \
    --quiet \
    --field-separator '|' \
    --set ON_ERROR_STOP=1 \
    --no-password \
    --host "$PGHOST" \
    --port "$PGPORT" \
    --username "$PGUSER" \
    --dbname "$PGDATABASE" \
    --command "$postcheck_sql" \
    2>/dev/null
)"
then
  fail "database_postcheck_query_failed"
fi

FANMIND_RESTORE_POSTCHECKED_AT="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
  || fail "postcheck_timestamp_failed"
export FANMIND_RESTORE_POSTCHECKED_AT

printf '%s\n' "$postcheck_result" \
  | node scripts/operations/restore-database-postcheck-receipt.mjs \
      --runner-receipt "$FANMIND_RESTORE_RUNNER_RECEIPT_PATH" \
      --output "$FANMIND_RESTORE_DATABASE_POSTCHECK_RECEIPT_PATH" \
  || fail "database_postcheck_receipt_failed"
