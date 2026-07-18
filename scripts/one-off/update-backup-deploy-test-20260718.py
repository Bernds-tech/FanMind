#!/usr/bin/env python3
from pathlib import Path

path = Path("tests/backup-worker.test.mjs")
text = path.read_text(encoding="utf-8")
start_marker = "test('deployment workflow records deployed commit only after successful healthcheck without starting inactive backup worker', () => {"
end_marker = "\ntest('verify_backup is blocked in worker and migration follow-up', () => {"
start = text.find(start_marker)
end = text.find(end_marker)
if start < 0 or end < 0 or end <= start:
    raise SystemExit("deployment workflow test block not found")

replacement = '''test('deployment workflow records a verified release only after either deployment path succeeds', () => {
  const indexOfRequired = (needle) => {
    const index = deployWorkflow.indexOf(needle);
    assert.notEqual(index, -1, `Missing workflow command: ${needle}`);
    return index;
  };

  const fetchIndex = indexOfRequired('git fetch --prune origin main');
  const releaseCommitIndex = indexOfRequired('RELEASE_COMMIT="$(git rev-parse origin/main)"');
  const commitValidationIndex = indexOfRequired('^[0-9a-f]{40}$');
  const isolatedGateIndex = indexOfRequired('ISOLATED_DEPLOY_ENABLED="false"');
  const isolatedDeployIndex = indexOfRequired('bash "$DEPLOY_SCRIPT" "$RELEASE_COMMIT"');
  const resetIndex = indexOfRequired('git reset --hard origin/main');
  const npmCiIndex = indexOfRequired('npm ci --no-audit --no-fund');
  const buildIndex = indexOfRequired('npm run build');
  const pm2RestartIndex = indexOfRequired('pm2 restart fanmind --update-env');
  const nginxIndex = indexOfRequired('sudo nginx -t');
  const healthcheckIndex = indexOfRequired('Health check passed.');
  const sourceSyncCheckIndex = indexOfRequired('Source checkout is not synchronized after deployment.');
  const helperInstallIndex = indexOfRequired('sudo install -o root -g root -m 0755 scripts/operations/write-backup-release-env.sh /usr/local/lib/fanmind-ops/write-backup-release-env.sh');
  const unitInstallIndex = indexOfRequired('sudo install -o root -g root -m 0644 ops/systemd/fanmind-backup-worker.service /etc/systemd/system/fanmind-backup-worker.service');
  const daemonReloadIndex = indexOfRequired('sudo systemctl daemon-reload');
  const releaseWriteIndex = indexOfRequired('sudo /usr/local/lib/fanmind-ops/write-backup-release-env.sh "$RELEASE_COMMIT"');
  const workerActiveCheckIndex = indexOfRequired('sudo systemctl is-active --quiet fanmind-backup-worker.service');
  const workerRestartIndex = indexOfRequired('sudo systemctl restart fanmind-backup-worker.service');
  const inactiveWorkerMessageIndex = indexOfRequired('Backup worker is not active; not starting it.');

  assert.ok(fetchIndex < releaseCommitIndex, 'origin/main is fetched before the target commit is resolved');
  assert.ok(releaseCommitIndex < commitValidationIndex, 'the target commit is validated before deployment selection');
  assert.ok(commitValidationIndex < isolatedGateIndex, 'deployment mode is selected only after commit validation');
  assert.ok(isolatedGateIndex < isolatedDeployIndex, 'isolated deployment remains behind its explicit gate');
  assert.ok(isolatedGateIndex < resetIndex, 'legacy reset remains in the disabled branch');
  assert.ok(resetIndex < npmCiIndex);
  assert.ok(npmCiIndex < buildIndex);
  assert.ok(buildIndex < pm2RestartIndex);
  assert.ok(pm2RestartIndex < nginxIndex);
  assert.ok(nginxIndex < healthcheckIndex);
  assert.ok(isolatedDeployIndex < sourceSyncCheckIndex, 'the isolated script must return successfully before common post-deploy work');
  assert.ok(healthcheckIndex < sourceSyncCheckIndex, 'legacy healthcheck must pass before common post-deploy work');
  assert.ok(sourceSyncCheckIndex < helperInstallIndex);
  assert.ok(helperInstallIndex < unitInstallIndex);
  assert.ok(unitInstallIndex < daemonReloadIndex);
  assert.ok(daemonReloadIndex < releaseWriteIndex);
  assert.ok(releaseWriteIndex < workerActiveCheckIndex, 'release.env is written before an active worker is restarted');
  assert.ok(workerActiveCheckIndex < workerRestartIndex);
  assert.ok(workerRestartIndex < inactiveWorkerMessageIndex);

  assert.match(deployWorkflow, /systemctl is-active --quiet fanmind-backup-worker\.service[\s\S]*systemctl restart fanmind-backup-worker\.service/);
  assert.match(deployWorkflow, /Backup worker is not active; not starting it\./);
  assert.doesNotMatch(deployWorkflow, /systemctl enable/);
  assert.doesNotMatch(deployWorkflow, /systemctl start fanmind-backup-worker\.service/);
});
'''

path.write_text(text[:start] + replacement + text[end:], encoding="utf-8")
print("Backup deployment workflow test updated for dual deployment paths.")
