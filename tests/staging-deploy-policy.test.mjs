import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const workflowPath = ".github/workflows/deploy-staging.yml";
const provisioningWorkflowPath = ".github/workflows/provision-staging-host.yml";
const tlsWorkflowPath = ".github/workflows/enable-staging-tls.yml";
const nginxPath = "ops/nginx/fanmind-staging.http.conf";
const runbookPath = "docs/operations/STAGING_PROVISIONING.md";
const separationPath = "docs/operations/ENVIRONMENT_SEPARATION.md";

async function read(path) {
  return readFile(path, "utf8");
}

test("staging deploy is manual, isolated and fail-closed", async () => {
  const workflow = await read(workflowPath);

  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /github\.ref == 'refs\/heads\/main'/);
  assert.match(workflow, /inputs\.confirmation == 'deploy-staging-only'/);
  assert.match(workflow, /environment: staging/);
  assert.match(workflow, /runs-on: \[self-hosted, fanmind-staging, exoscale, linux, x64\]/);
  assert.match(workflow, /actions\/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1/);
  assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /SOURCE_DIR="\/var\/www\/fanmind-staging"/);
  assert.match(workflow, /ENV_FILE="\$SOURCE_DIR\/\.env\.production"/);
  assert.match(workflow, /EXPECTED_RELEASE_COMMIT: \$\{\{ github\.sha \}\}/);
  assert.match(workflow, /\[ -L "\$ENV_FILE" \]/);
  assert.match(workflow, /stat -c '%a'.*!= "600"/);
  assert.match(workflow, /git -C "\$GITHUB_WORKSPACE" rev-parse HEAD/);
  assert.match(workflow, /rsync --archive --delete/);
  assert.match(workflow, /--exclude '\.git\/'/);
  assert.match(workflow, /--exclude '\.env\.production'/);
  assert.match(workflow, /Git metadata must not persist/);
  assert.match(
    workflow,
    /NEXT_DEPLOYMENT_ID="\$EXPECTED_RELEASE_COMMIT" npm run build/u,
  );
  assert.match(
    workflow,
    /payload\?\.config\?\.deploymentId[\s\S]*FANMIND_REQUIRED_DEPLOYMENT_ID/u,
  );
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
  assert.doesNotMatch(workflow, /persist-credentials: true/);
  assert.doesNotMatch(workflow, /git fetch|git reset --hard|git clean/);
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
  assert.match(runbook, /ersetzt nicht die vollständige externe Laufzeitabnahme/);
  assert.match(separation, /\.github\/workflows\/deploy-staging\.yml/);
  assert.match(separation, /niemals auf dem Production-Runner/);
});

test("staging host provisioning creates a separate user, path, vhost and runner", async () => {
  const [workflow, nginx] = await Promise.all([
    read(provisioningWorkflowPath),
    read(nginxPath),
  ]);

  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /inputs\.confirmation == 'provision-fanmind-staging-host'/);
  assert.match(workflow, /github\.ref == 'refs\/heads\/main'/);
  assert.match(workflow, /environment: staging/);
  assert.match(workflow, /RUNNER_NAME:-.*fanmind-prod-01-exoscale/);
  assert.match(workflow, /STAGING_USER="fanmind-staging"/);
  assert.match(workflow, /SOURCE_DIR="\/var\/www\/fanmind-staging"/);
  assert.doesNotMatch(workflow, /git clone/);
  assert.match(workflow, /PORT", "3001"/);
  assert.match(workflow, /STRIPE_PRICE_STARTER_SETUP/);
  assert.match(workflow, /STRIPE_PRICE_STARTER_MONTHLY/);
  assert.match(workflow, /STRIPE_PRICE_AI_PLUS/);
  assert.match(workflow, /STRIPE_PRICE_AI_ULTRA/);
  assert.match(
    workflow,
    /STAGING_STRIPE_TAX_REGISTRATION_CONFIRMED: \$\{\{ vars\.FANMIND_STAGING_STRIPE_TAX_REGISTRATION_CONFIRMED \}\}/u,
  );
  assert.match(
    workflow,
    /FANMIND_STRIPE_TAX_REGISTRATION_CONFIRMED", confirmed\("STAGING_STRIPE_TAX_REGISTRATION_CONFIRMED"\)/u,
  );
  assert.match(
    workflow,
    /sudo stat -c '%U:%G:%a' \/var\/www\/fanmind-staging\/\.env\.production/u,
  );
  assert.match(workflow, /fanmind-staging:fanmind-staging:600/);
  assert.match(workflow, /fanmind-staging-01-exoscale/);
  assert.match(workflow, /--labels fanmind-staging,exoscale/);
  assert.match(workflow, /actions-runner-linux-x64-2\.336\.0\.tar\.gz/);
  assert.match(
    workflow,
    /04cf0be1aff4c3ec3554466c39124ca250e3effd8873bb7e8d68535aa9505d5d/,
  );
  assert.match(
    workflow,
    /sudo install -o "\$RUNNER_USER" -g "\$RUNNER_USER" -m 0600 "\$DOWNLOAD_PATH" "\$PRIVATE_ARCHIVE_PATH"/u,
  );
  assert.match(
    workflow,
    /sudo -u "\$RUNNER_USER" -H tar -xzf "\$PRIVATE_ARCHIVE_PATH" -C "\$RUNNER_DIR"/u,
  );
  assert.doesNotMatch(
    workflow,
    /sudo -u "\$RUNNER_USER" -H tar -xzf "\$RUNNER_TEMP/u,
  );
  assert.match(workflow, /STAGING_SECRETS_OUTPUT=false/);
  assert.doesNotMatch(workflow, /\.env\.production.*\/var\/www\/fanmind(?:["'\s]|$)/);
  assert.doesNotMatch(workflow, /pm2 (?:delete|restart|reload|start).*fanmind(?:["'\s]|$)/);
  assert.doesNotMatch(workflow, /FANMIND_ENABLE_NON_PRODUCTION_WRITES", "true"/);

  assert.match(nginx, /server_name staging\.fanmind\.ch;/);
  assert.match(nginx, /proxy_pass http:\/\/127\.0\.0\.1:3001;/);
  assert.doesNotMatch(nginx, /server_name (?:www\.)?fanmind\.ch;/);
});

test("staging TLS is manual, DNS-bound and reuses the existing certbot account", async () => {
  const workflow = await read(tlsWorkflowPath);

  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /inputs\.confirmation == 'enable-fanmind-staging-tls'/);
  assert.match(workflow, /github\.ref == 'refs\/heads\/main'/);
  assert.match(workflow, /environment: staging/);
  assert.match(workflow, /getent ahostsv4 staging\.fanmind\.ch/);
  assert.match(workflow, /\[ "\$DNS_IPV4" != "\$SERVER_IPV4" \]/);
  assert.match(workflow, /sudo test -d \/etc\/letsencrypt\/accounts/);
  assert.match(workflow, /--domain staging\.fanmind\.ch/);
  assert.match(workflow, /--keep-until-expiring/);
  assert.doesNotMatch(workflow, /--agree-tos|register-unsafely-without-email/);
  assert.doesNotMatch(workflow, /https:\/\/fanmind\.ch\//);
});
