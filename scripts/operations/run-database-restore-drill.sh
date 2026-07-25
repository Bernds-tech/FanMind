#!/usr/bin/env bash
set -Eeuo pipefail

fail() {
  printf 'RESTORE_RUNNER_ERROR=%s\n' "$1" >&2
  exit 1
}

[[ "$#" -eq 1 ]] || fail "exactly_one_dump_path_required"

dump_path="$1"
[[ "$dump_path" != -* ]] || fail "option_like_dump_path_forbidden"
[[ -f "$dump_path" && -r "$dump_path" ]] || fail "dump_file_not_readable"
dump_path="$(realpath -- "$dump_path")" || fail "dump_path_resolution_failed"

: "${PGHOST:?PGHOST is required}"
: "${PGPORT:?PGPORT is required}"
: "${PGDATABASE:?PGDATABASE is required}"
: "${PGUSER:?PGUSER is required}"
: "${PGPASSFILE:?PGPASSFILE is required}"

[[ "$PGPASSFILE" = /* ]] || fail "passfile_path_must_be_absolute"
[[ -f "$PGPASSFILE" && -r "$PGPASSFILE" ]] || fail "passfile_not_readable"

readonly PGHOST PGPORT PGDATABASE PGUSER

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd -- "$script_dir/../.." && pwd)"
pg_restore_bin="${FANMIND_PG_RESTORE_BIN:-/usr/lib/postgresql/17/bin/pg_restore}"

[[ -x "$pg_restore_bin" ]] || fail "pg_restore_not_executable"

cd "$repo_root"
node scripts/operations/restore-target-preflight.mjs

exec env \
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
  --no-password \
  --host "$PGHOST" \
  --port "$PGPORT" \
  --username "$PGUSER" \
  --dbname "$PGDATABASE" \
  "$dump_path"
