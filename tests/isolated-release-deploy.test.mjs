import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const scriptPath = "scripts/operations/deploy-isolated-release.sh";
const workflowPath = ".github/workflows/deploy-fanmind.yml";

function position(text, value) {
  const result = text.indexOf(value);
  assert.notEqual(result, -1, `Expected marker not found: ${value}`);
  return result;
}

test("isolated deployment shell script has valid Bash syntax", () => {
  const result = spawnSync("bash", ["-n", scriptPath], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
});

test("release is built and verified before PM2 switches away from the live cwd", async () => {
  const script = await readFile(scriptPath, "utf8");
  const archive = position(script, 'git archive --format=tar "$RELEASE_COMMIT"');
  const install = position(script, "npm ci --no-audit --no-fund");
  const truth = position(script, "npm run verify:truth");
  const lint = position(script, "npm run lint");
  const tests = position(script, "npm run test:operations");
  const build = position(script, "npm run build");
  const switchProcess = position(script, 'start_pm2_release "$RELEASE_DIR"');

  assert.ok(archive < install);
  assert.ok(install < truth);
  assert.ok(truth < lint);
  assert.ok(lint < tests);
  assert.ok(tests < build);
  assert.ok(build < switchProcess);
});

test("failed health or smoke checks invoke rollback before failure", async () => {
  const script = await readFile(scriptPath, "utf8");
  assert.match(script, /rollback "login healthcheck failed"/);
  assert.match(script, /rollback "public smoke test failed"/);
  assert.match(script, /PREVIOUS_CWD/);
  assert.match(script, /pm2 start npm --name "\$APP_NAME" --cwd "\$PREVIOUS_CWD" -- start/);
  assert.match(script, /git reset --hard "\$RELEASE_COMMIT"/);
  assert.match(script, /unexpected failure after PM2 switched to the new release/);
});

test("plaintext environment stays shared and releases are retained safely", async () => {
  const script = await readFile(scriptPath, "utf8");
  assert.match(
    script,
    /ln -s "\$SOURCE_DIR\/\.env\.production" "\$TEMP_RELEASE\/\.env\.production"/,
  );
  assert.match(script, /FANMIND_RELEASE_RETENTION_COUNT:-4/);
  assert.match(script, /is_safe_release_path/);
  assert.doesNotMatch(script, /cat .*\.env\.production/);
});

test("current release link is updated atomically with the required privilege", async () => {
  const script = await readFile(scriptPath, "utf8");
  const removeTempLink = position(script, 'sudo rm -f -- "${CURRENT_LINK}.new"');
  const createTempLink = position(script, 'sudo ln -s "$RELEASE_DIR" "${CURRENT_LINK}.new"');
  const replaceCurrentLink = position(script, 'sudo mv -Tf "${CURRENT_LINK}.new" "$CURRENT_LINK"');

  assert.ok(removeTempLink < createTempLink);
  assert.ok(createTempLink < replaceCurrentLink);
});

test("production workflow keeps isolated deployment explicitly disabled by default", async () => {
  const workflow = await readFile(workflowPath, "utf8");
  assert.match(workflow, /ISOLATED_DEPLOY_ENABLED="false"/);
  assert.match(workflow, /FANMIND_ENABLE_ISOLATED_RELEASE_DEPLOY/);
  assert.match(workflow, /if \[ "\$ISOLATED_DEPLOY_ENABLED" = "true" \]/);
  assert.match(workflow, /deploy-isolated-release\.sh/);
  assert.match(
    workflow,
    /Using legacy in-place deployment because isolated release deployment is disabled/,
  );
  assert.match(workflow, /git reset --hard origin\/main/);
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
