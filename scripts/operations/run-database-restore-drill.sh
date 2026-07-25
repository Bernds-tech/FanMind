#!/usr/bin/env bash
set -Eeuo pipefail

fail() {
  printf 'RESTORE_RUNNER_ERROR=%s\n' "$1" >&2
  exit 1
}

snapshot_dir=""
snapshot_dump=""
snapshot_passfile=""

cleanup_snapshot() {
  set +e
  [[ -z "$snapshot_dump" || ! -e "$snapshot_dump" ]] \
    || unlink -- "$snapshot_dump"
  [[ -z "$snapshot_passfile" || ! -e "$snapshot_passfile" ]] \
    || unlink -- "$snapshot_passfile"
  [[ -z "$snapshot_dir" || ! -d "$snapshot_dir" ]] \
    || rmdir -- "$snapshot_dir"
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

[[ "$PGPASSFILE" = /* ]] || fail "passfile_path_must_be_absolute"
[[ ! -L "$PGPASSFILE" ]] || fail "passfile_symlink_forbidden"
[[ -f "$PGPASSFILE" && -r "$PGPASSFILE" ]] || fail "passfile_not_readable"

exec {passfile_fd}<"$PGPASSFILE" || fail "passfile_open_failed"
passfile_fd_path="/proc/self/fd/$passfile_fd"
validate_open_source "passfile" "$PGPASSFILE" "$passfile_fd_path"

exec {dump_fd}<"$dump_path" || fail "dump_open_failed"
dump_fd_path="/proc/self/fd/$dump_fd"
validate_open_source "dump" "$dump_path" "$dump_fd_path"

umask 077
snapshot_dir="$(mktemp -d -- "${TMPDIR:-/tmp}/fanmind-restore.XXXXXX")" \
  || fail "snapshot_directory_create_failed"
trap cleanup_snapshot EXIT
snapshot_dump="$snapshot_dir/database.dump"
snapshot_passfile="$snapshot_dir/restore.pgpass"

cp -- "$dump_fd_path" "$snapshot_dump" || fail "dump_snapshot_failed"
cp -- "$passfile_fd_path" "$snapshot_passfile" || fail "passfile_snapshot_failed"
chmod 0400 "$snapshot_dump" || fail "dump_snapshot_permissions_failed"
chmod 0600 "$snapshot_passfile" || fail "passfile_snapshot_permissions_failed"
exec {dump_fd}<&-
exec {passfile_fd}<&-

PGPASSFILE="$snapshot_passfile"
export PGPASSFILE
readonly PGHOST PGPORT PGDATABASE PGUSER PGPASSFILE

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd -- "$script_dir/../.." && pwd)"
pg_restore_bin="${FANMIND_PG_RESTORE_BIN:-/usr/lib/postgresql/17/bin/pg_restore}"

[[ -x "$pg_restore_bin" ]] || fail "pg_restore_not_executable"

cd "$repo_root"
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
  "$pg_restore_bin" \
  --list \
  "$snapshot_dump" \
  >/dev/null 2>&1
then
  fail "dump_archive_validation_failed"
fi

env \
  -u PGHOST \
  -u PGPORT \
  -u PGDATABASE \
  -u PGUSER \
  -u PGHOSTADDR \
  -u PGSERVICE \
  -u PGSERVICEFILE \
  -u PGPASSWORD \
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
  "$snapshot_dump"
