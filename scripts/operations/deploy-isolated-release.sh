#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="${FANMIND_SOURCE_DIR:-/var/www/fanmind}"
RELEASE_ROOT="${FANMIND_RELEASE_ROOT:-/var/www/fanmind-releases}"
CURRENT_LINK="${FANMIND_CURRENT_RELEASE_LINK:-/var/www/fanmind-current}"
APP_NAME="${FANMIND_PM2_APP_NAME:-fanmind}"
BASE_URL="${FANMIND_DEPLOY_BASE_URL:-https://fanmind.ch}"
RETAIN_RELEASES="${FANMIND_RELEASE_RETENTION_COUNT:-4}"
RELEASE_COMMIT="${1:-}"
TEMP_RELEASE=""
SWITCHED=0
PREVIOUS_CWD=""
PREVIOUS_COMMIT=""

log() {
  printf '[fanmind-release] %s\n' "$*"
}

fail() {
  printf '[fanmind-release] ERROR: %s\n' "$*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "required command missing: $1"
}

is_safe_release_path() {
  local candidate="$1"
  [[ -n "$candidate" ]] && [[ "$candidate" == "$RELEASE_ROOT"/* ]]
}

read_previous_pm2_cwd() {
  pm2 jlist | node -e '
    let body = "";
    process.stdin.on("data", chunk => body += chunk);
    process.stdin.on("end", () => {
      try {
        const list = JSON.parse(body);
        const processEntry = list.find(item => item?.name === process.env.FANMIND_PM2_APP_NAME);
        process.stdout.write(processEntry?.pm2_env?.pm_cwd || "");
      } catch {
        process.stdout.write("");
      }
    });
  '
}

read_live_commit() {
  curl -fsS --max-time 15 "$BASE_URL/api/version" 2>/dev/null |
    node -e '
      let body = "";
      process.stdin.on("data", chunk => body += chunk);
      process.stdin.on("end", () => {
        try {
          const payload = JSON.parse(body);
          process.stdout.write(/^[0-9a-f]{40}$/.test(payload.releaseCommit || "") ? payload.releaseCommit : "");
        } catch {
          process.stdout.write("");
        }
      });
    '
}

start_pm2_release() {
  local cwd="$1"
  local commit="$2"
  [[ -f "$cwd/package.json" ]] || return 1
  pm2 delete "$APP_NAME" >/dev/null 2>&1 || true
  FANMIND_RELEASE_COMMIT="$commit" NODE_ENV=production \
    pm2 start npm --name "$APP_NAME" --cwd "$cwd" -- start
}

rollback() {
  local reason="$1"
  log "rollback requested: $reason"
  pm2 delete "$APP_NAME" >/dev/null 2>&1 || true

  if [[ -n "$PREVIOUS_CWD" ]] && [[ -f "$PREVIOUS_CWD/package.json" ]]; then
    local rollback_commit="$PREVIOUS_COMMIT"
    if [[ ! "$rollback_commit" =~ ^[0-9a-f]{40}$ ]]; then
      rollback_commit="unknown"
    fi
    FANMIND_RELEASE_COMMIT="$rollback_commit" NODE_ENV=production \
      pm2 start npm --name "$APP_NAME" --cwd "$PREVIOUS_CWD" -- start
    pm2 save
    log "rollback completed to previous cwd"
    return 0
  fi

  if [[ -f "$SOURCE_DIR/package.json" ]] && [[ -d "$SOURCE_DIR/.next" ]]; then
    FANMIND_RELEASE_COMMIT="${PREVIOUS_COMMIT:-unknown}" NODE_ENV=production \
      pm2 start npm --name "$APP_NAME" --cwd "$SOURCE_DIR" -- start
    pm2 save
    log "rollback completed to source checkout fallback"
    return 0
  fi

  log "rollback target unavailable; manual intervention required"
  return 1
}

cleanup() {
  if [[ -n "$TEMP_RELEASE" ]] && [[ -d "$TEMP_RELEASE" ]]; then
    rm -rf -- "$TEMP_RELEASE"
  fi
}
trap cleanup EXIT

[[ "$RELEASE_COMMIT" =~ ^[0-9a-f]{40}$ ]] || fail "release commit must be a full SHA"
[[ "$RETAIN_RELEASES" =~ ^[1-9][0-9]*$ ]] || fail "retention count must be a positive integer"
[[ -d "$SOURCE_DIR/.git" ]] || fail "source checkout not found"
[[ -r "$SOURCE_DIR/.env.production" ]] || fail "source production environment file not readable"

for command in git tar npm node pm2 curl sudo; do
  require_command "$command"
done

export FANMIND_PM2_APP_NAME="$APP_NAME"
PREVIOUS_CWD="$(read_previous_pm2_cwd)"
PREVIOUS_COMMIT="$(read_live_commit)"

log "building isolated release $RELEASE_COMMIT"
log "previous cwd: ${PREVIOUS_CWD:-unknown}"
log "previous commit: ${PREVIOUS_COMMIT:-unknown}"

cd "$SOURCE_DIR"
git fetch --prune origin main
[[ "$(git rev-parse origin/main)" == "$RELEASE_COMMIT" ]] || fail "origin/main moved away from expected commit"

sudo install -d -o "$(id -u)" -g "$(id -g)" -m 0755 "$RELEASE_ROOT"
RELEASE_DIR="$RELEASE_ROOT/$RELEASE_COMMIT"
TEMP_RELEASE="$RELEASE_ROOT/.${RELEASE_COMMIT}.tmp.$$"

if [[ -e "$RELEASE_DIR" ]]; then
  if [[ "$PREVIOUS_CWD" == "$RELEASE_DIR" ]]; then
    log "release is already active; validating without rebuilding"
  else
    is_safe_release_path "$RELEASE_DIR" || fail "unsafe existing release path"
    rm -rf -- "$RELEASE_DIR"
  fi
fi

if [[ ! -d "$RELEASE_DIR" ]]; then
  mkdir -m 0755 "$TEMP_RELEASE"
  git archive --format=tar "$RELEASE_COMMIT" | tar -xf - -C "$TEMP_RELEASE"
  ln -s "$SOURCE_DIR/.env.production" "$TEMP_RELEASE/.env.production"

  cd "$TEMP_RELEASE"
  npm ci --no-audit --no-fund
  npm run verify:truth
  npm run lint
  npm run test:operations
  npm run build
  [[ -f ".next/required-server-files.json" ]] || fail "required Next.js build metadata missing"

  mv "$TEMP_RELEASE" "$RELEASE_DIR"
  TEMP_RELEASE=""
fi

sudo nginx -t

if ! start_pm2_release "$RELEASE_DIR" "$RELEASE_COMMIT"; then
  rollback "PM2 start failed" || true
  fail "new release could not be started"
fi
SWITCHED=1

HEALTH_OK=0
for attempt in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fsSL --max-time 15 "$BASE_URL/login" -o /dev/null; then
    HEALTH_OK=1
    break
  fi
  log "application not ready; attempt $attempt/10"
  sleep 3
done

if [[ "$HEALTH_OK" -ne 1 ]]; then
  rollback "login healthcheck failed" || true
  fail "new release failed login healthcheck"
fi

cd "$RELEASE_DIR"
if ! FANMIND_SMOKE_BASE_URL="$BASE_URL" \
  FANMIND_EXPECTED_RELEASE_COMMIT="$RELEASE_COMMIT" \
  npm run smoke:public; then
  rollback "public smoke test failed" || true
  fail "new release failed public smoke test"
fi

cd "$SOURCE_DIR"
if ! git reset --hard "$RELEASE_COMMIT"; then
  rollback "source checkout synchronization failed" || true
  fail "source checkout could not be synchronized"
fi

ln -sfn "$RELEASE_DIR" "${CURRENT_LINK}.new"
mv -Tf "${CURRENT_LINK}.new" "$CURRENT_LINK"
pm2 save
SWITCHED=0

mapfile -t RELEASE_PATHS < <(
  find "$RELEASE_ROOT" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' |
    sort -nr |
    awk '{ $1=""; sub(/^ /, ""); print }'
)

kept=0
for candidate in "${RELEASE_PATHS[@]}"; do
  if [[ "$candidate" == "$RELEASE_DIR" ]] || [[ "$candidate" == "$PREVIOUS_CWD" ]]; then
    kept=$((kept + 1))
    continue
  fi
  if (( kept < RETAIN_RELEASES )); then
    kept=$((kept + 1))
    continue
  fi
  is_safe_release_path "$candidate" || fail "unsafe release cleanup path"
  rm -rf -- "$candidate"
  log "removed old release $(basename "$candidate")"
done

log "isolated release deployment completed at $RELEASE_COMMIT"
