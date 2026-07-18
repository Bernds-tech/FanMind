#!/usr/bin/env python3
from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


script_path = Path("scripts/operations/deploy-isolated-release.sh")
script = script_path.read_text(encoding="utf-8")

script = replace_once(
    script,
    '''    FANMIND_RELEASE_COMMIT="$rollback_commit" NODE_ENV=production \\
      pm2 start npm --name "$APP_NAME" --cwd "$PREVIOUS_CWD" -- start
    pm2 save
    log "rollback completed to previous cwd"
    return 0
''',
    '''    if FANMIND_RELEASE_COMMIT="$rollback_commit" NODE_ENV=production \\
      pm2 start npm --name "$APP_NAME" --cwd "$PREVIOUS_CWD" -- start; then
      pm2 save
      log "rollback completed to previous cwd"
      return 0
    fi
    log "previous cwd could not be started; trying source checkout fallback"
''',
    "previous cwd rollback",
)

script = replace_once(
    script,
    '''  if [[ -f "$SOURCE_DIR/package.json" ]] && [[ -d "$SOURCE_DIR/.next" ]]; then
    FANMIND_RELEASE_COMMIT="${PREVIOUS_COMMIT:-unknown}" NODE_ENV=production \\
      pm2 start npm --name "$APP_NAME" --cwd "$SOURCE_DIR" -- start
    pm2 save
    log "rollback completed to source checkout fallback"
    return 0
  fi
''',
    '''  if [[ -f "$SOURCE_DIR/package.json" ]] && [[ -d "$SOURCE_DIR/.next" ]]; then
    if FANMIND_RELEASE_COMMIT="${PREVIOUS_COMMIT:-unknown}" NODE_ENV=production \\
      pm2 start npm --name "$APP_NAME" --cwd "$SOURCE_DIR" -- start; then
      pm2 save
      log "rollback completed to source checkout fallback"
      return 0
    fi
    log "source checkout fallback could not be started"
  fi
''',
    "source checkout rollback",
)

script = replace_once(
    script,
    '''PREVIOUS_CWD="$(read_previous_pm2_cwd)"
PREVIOUS_COMMIT="$(read_live_commit)"
''',
    '''PREVIOUS_CWD="$(read_previous_pm2_cwd || true)"
PREVIOUS_COMMIT="$(read_live_commit || true)"
''',
    "tolerant previous state reads",
)

script_path.write_text(script, encoding="utf-8")

backup_test_path = Path("tests/backup-worker.test.mjs")
backup_test = backup_test_path.read_text(encoding="utf-8")
backup_test = replace_once(
    backup_test,
    "  const pm2RestartIndex = indexOfRequired('pm2 restart fanmind --update-env');\n",
    "  const pm2StartIndex = indexOfRequired('pm2 start npm --name fanmind --cwd \"$SOURCE_DIR\" -- start');\n",
    "backup test PM2 marker",
)
backup_test = backup_test.replace("pm2RestartIndex", "pm2StartIndex")
backup_test = backup_test.replace("pm2 restart", "PM2 source start")
backup_test_path.write_text(backup_test, encoding="utf-8")

isolated_test_path = Path("tests/isolated-release-deploy.test.mjs")
isolated_test = isolated_test_path.read_text(encoding="utf-8")
old = '''  assert.match(workflow, /git reset --hard origin\/main/);
});
'''
new = '''  assert.match(workflow, /git reset --hard origin\/main/);
  assert.match(workflow, /pm2 start npm --name fanmind --cwd "\$SOURCE_DIR" -- start/);
});

test("rollback failures fall through to the next safe target and live version lookup is optional", async () => {
  const script = await readFile(scriptPath, "utf8");
  assert.match(script, /PREVIOUS_COMMIT="\$\(read_live_commit \|\| true\)"/);
  assert.match(script, /if FANMIND_RELEASE_COMMIT="\$rollback_commit"[\s\S]*pm2 start npm --name "\$APP_NAME" --cwd "\$PREVIOUS_CWD" -- start; then/);
  assert.match(script, /previous cwd could not be started; trying source checkout fallback/);
  assert.match(script, /source checkout fallback could not be started/);
  assert.match(script, /manual intervention required/);
});
'''
isolated_test = replace_once(isolated_test, old, new, "isolated test hardening")
isolated_test_path.write_text(isolated_test, encoding="utf-8")

print("Isolated release rollback and compatibility tests hardened.")
