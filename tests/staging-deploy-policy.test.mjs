import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const workflowPath = ".github/workflows/deploy-staging.yml";
const runbookPath = "docs/operations/STAGING_PROVISIONING.md";
const separationPath = "docs/operations/ENVIRONMENT_SEPARATION.md";

async function read(path) {
  return readFile(path, "utf8");
}

test("staging deploy is manual, isolated and fail-closed", async () => {
  const workflow = await read(workflowPath);

  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /inputs\.confirmation == 'deploy-staging-only'/);
  assert.match(workflow, /environment: staging/);
  assert.match(workflow, /- fanmind-staging/);
  assert.match(workflow, /SOURCE_DIR="\/var\/www\/fanmind-staging"/);
  assert.match(workflow, /ENV_FILE="\$SOURCE_DIR\/\.env\.production"/);
  assert.match(workflow, /\[ -L "\$ENV_FILE" \]/);
  assert.match(workflow, /stat -c '%a'.*!= "600"/);
  assert.match(workflow, /git merge-base --is-ancestor "\$EXPECTED_RELEASE_COMMIT" origin\/main/);
  assert.match(workflow, /git reset --hard "\$EXPECTED_RELEASE_COMMIT"/);
  assert.match(workflow, /npm run staging:preflight/);
  assert.match(workflow, /npm run verify:truth/);
  assert.match(workflow, /npm run test:operations/);
  assert.match(workflow, /pm2 start npm --name fanmind-staging/);
  assert.match(workflow, /FANMIND_EXPECTED_RUNTIME_ENVIRONMENT=staging/);
  assert.match(workflow, /npm run smoke:public/);

  assert.doesNotMatch(workflow, /SOURCE_DIR="\/var\/www\/fanmind"/);
  assert.doesNotMatch(workflow, /--name fanmind(?:\s|")/);
  assert.doesNotMatch(workflow, /FANMIND_ENABLE_NON_PRODUCTION_WRITES=true/);
  assert.doesNotMatch(workflow, /https:\/\/fanmind\.ch/);
});

test("staging documentation keeps external provisioning and deployment boundaries honest", async () => {
  const [runbook, separation] = await Promise.all([
    read(runbookPath),
    read(separationPath),
  ]);

  assert.match(runbook, /Deploy FanMind Staging/);
  assert.match(runbook, /fanmind-staging/);
  assert.match(runbook, /\/var\/www\/fanmind-staging\/\.env\.production/);
  assert.match(runbook, /deploy-staging-only/);
  assert.match(runbook, /ersetzt nicht die externen Ressourcen/);
  assert.match(separation, /\.github\/workflows\/deploy-staging\.yml/);
  assert.match(separation, /niemals auf dem Production-Runner/);
});
