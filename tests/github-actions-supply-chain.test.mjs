import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";
import test from "node:test";

import { scanWorkflowPolicy } from "../scripts/verify-actions-pinned.mjs";

const CODEQL_V4_37_6_SHA = "5595ccaf912efad79be6eef63a5619ff05969be3";
const SETUP_JAVA_V5_7_0_SHA =
  "b6effb05e454b25005698d916606bdc6ffcbf961";
const HOSTED_CHECKOUT_V7_0_1_SHA =
  "3d3c42e5aac5ba805825da76410c181273ba90b1";
const RESTORE_CHECKOUT_V4_SHA =
  "11d5960a326750d5838078e36cf38b85af677262";
const STAGING_DEPLOY_WORKFLOW = "deploy-staging.yml";
const RESTORE_WORKFLOW = "restore-drill-resource-readiness.yml";
const STAGING_PROVISION_WORKFLOW = "provision-staging-host.yml";

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

test("release integration failures retain reports and still allow the build diagnostic", async () => {
  const workflow = await readFile(".github/workflows/ci-fanmind.yml", "utf8");
  assert.match(workflow, /id: release_integrations[\s\S]*continue-on-error: true[\s\S]*release-integration-report\.txt/u);
  assert.match(workflow, /name: fanmind-release-integration-report[\s\S]*if-no-files-found: error/u);
  assert.match(workflow, /id: build[\s\S]*build-report\.txt/u);
  assert.match(workflow, /steps\.release_integrations\.outcome != 'success'[\s\S]*fanmind-release-integration-report artifact/u);
});

test("all GitHub workflows use immutable external Action references and explicit permissions", async () => {
  const result = await scanWorkflowPolicy();

  assert.equal(result.errors.length, 0, result.errors.join("\n"));
  assert.ok(result.workflowCount >= 9);
  assert.ok(result.externalActionCount > 0);
  assert.equal(
    result.references
      .filter((reference) => reference.kind === "external")
      .every((reference) => /^[0-9a-f]{40}$/u.test(reference.ref)),
    true,
  );
});

test("hosted checkout uses v7 while the isolated restore runner stays on v4", async () => {
  const workflowFiles = (await readdir(".github/workflows"))
    .filter((file) => /\.ya?ml$/u.test(file))
    .sort();
  const checkoutWorkflows = [];

  for (const file of workflowFiles) {
    const source = await readFile(`.github/workflows/${file}`, "utf8");
    const checkoutShas = [
      ...source.matchAll(/actions\/checkout@([0-9a-f]{40})/gu),
    ].map((match) => match[1]);

    if (checkoutShas.length > 0) {
      checkoutWorkflows.push({
        file,
        source,
        checkoutShas,
        selfHosted: /\bruns-on:\s*\[[^\]]*\bself-hosted\b[^\]]*\]/u.test(
          source,
        ),
      });
    }
  }

  const selfHostedWorkflows = checkoutWorkflows.filter(
    (workflow) => workflow.selfHosted,
  );
  assert.deepEqual(
    selfHostedWorkflows.map((workflow) => workflow.file),
    [STAGING_DEPLOY_WORKFLOW, STAGING_PROVISION_WORKFLOW, RESTORE_WORKFLOW],
  );
  const restoreWorkflow = selfHostedWorkflows.find(
    (workflow) => workflow.file === RESTORE_WORKFLOW,
  );
  const stagingProvisionWorkflow = selfHostedWorkflows.find(
    (workflow) => workflow.file === STAGING_PROVISION_WORKFLOW,
  );
  const stagingDeployWorkflow = selfHostedWorkflows.find(
    (workflow) => workflow.file === STAGING_DEPLOY_WORKFLOW,
  );
  assert.deepEqual(restoreWorkflow?.checkoutShas, [
    RESTORE_CHECKOUT_V4_SHA,
  ]);
  assert.deepEqual(stagingProvisionWorkflow?.checkoutShas, [
    HOSTED_CHECKOUT_V7_0_1_SHA,
  ]);
  assert.deepEqual(stagingDeployWorkflow?.checkoutShas, [
    HOSTED_CHECKOUT_V7_0_1_SHA,
  ]);
  assert.match(
    restoreWorkflow?.source ?? "",
    /runs-on:\s*\[self-hosted, fanmind-restore, linux, x64\]/u,
  );
  assert.match(
    stagingProvisionWorkflow?.source ?? "",
    /runs-on:\s*\[self-hosted, fanmind-prod, exoscale, linux, x64\]/u,
  );
  assert.match(
    stagingDeployWorkflow?.source ?? "",
    /runs-on:\s*\[self-hosted, fanmind-staging, exoscale, linux, x64\]/u,
  );

  const hostedWorkflows = checkoutWorkflows.filter(
    (workflow) => !workflow.selfHosted,
  );
  assert.equal(hostedWorkflows.length, 30);
  assert.equal(
    hostedWorkflows.reduce(
      (count, workflow) => count + workflow.checkoutShas.length,
      0,
    ),
    31,
  );
  assert.equal(
    hostedWorkflows.every((workflow) =>
      workflow.checkoutShas.every(
        (checkoutSha) => checkoutSha === HOSTED_CHECKOUT_V7_0_1_SHA,
      ),
    ),
    true,
  );
});

test("CodeQL init and analyze use the same reviewed v4.37.6 commit and minimal permissions", async () => {
  const [source, reader] = await Promise.all([
    readFile(".github/workflows/codeql.yml", "utf8"),
    readFile("docs/security/SUPPLY_CHAIN.md", "utf8"),
  ]);
  const initMatch = source.match(
    /github\/codeql-action\/init@([0-9a-f]{40})\s+#\s+v4\.37\.6/u,
  );
  const analyzeMatch = source.match(
    /github\/codeql-action\/analyze@([0-9a-f]{40})\s+#\s+v4\.37\.6/u,
  );

  assert.equal(initMatch?.[1], CODEQL_V4_37_6_SHA);
  assert.equal(analyzeMatch?.[1], CODEQL_V4_37_6_SHA);
  assert.equal(initMatch?.[1], analyzeMatch?.[1]);
  assert.match(source, /queries: security-extended/u);
  assert.match(source, /security-events: write/u);
  assert.match(source, /contents: read/u);
  assert.doesNotMatch(source, /contents: write/u);
  assert.match(
    reader,
    new RegExp(
      `github/codeql-action[^\\n]+${CODEQL_V4_37_6_SHA}[^\\n]+v4\\.37\\.6`,
      "u",
    ),
  );
  assert.equal([...reader.matchAll(/4\.37\.6/gu)].length, 2);
  assert.doesNotMatch(reader, /4\.37\.5/u);
});

test("native CI and supply-chain reader use the reviewed setup-java v5.7.0 commit", async () => {
  const [workflow, reader] = await Promise.all([
    readFile(".github/workflows/ci-mobile-native.yml", "utf8"),
    readFile("docs/security/SUPPLY_CHAIN.md", "utf8"),
  ]);
  const setupJavaMatch = workflow.match(
    /actions\/setup-java@([0-9a-f]{40})\s+#\s+v5\.7\.0/u,
  );

  assert.equal(setupJavaMatch?.[1], SETUP_JAVA_V5_7_0_SHA);
  assert.match(
    reader,
    new RegExp(
      `actions/setup-java[^\\n]+${SETUP_JAVA_V5_7_0_SHA}[^\\n]+v5\\.7\\.0`,
      "u",
    ),
  );
  assert.doesNotMatch(reader, /v5\.6\.0/u);
});

test("dependency audit and CycloneDX SBOM gates are persistent and short-lived", async () => {
  const [workflow, manifest] = await Promise.all([
    readFile(".github/workflows/supply-chain-security.yml", "utf8"),
    readFile("package.json", "utf8"),
  ]);

  assert.match(workflow, /npm run verify:actions-pinned/u);
  assert.match(workflow, /npm run security:audit/u);
  assert.match(workflow, /npm run security:sbom/u);
  assert.match(workflow, /fanmind-dependency-audit-report/u);
  assert.match(workflow, /fanmind-cyclonedx-sbom/u);
  assert.match(workflow, /retention-days: 7/u);
  assert.match(workflow, /contents: read/u);
  assert.doesNotMatch(workflow, /contents: write/u);

  const parsed = JSON.parse(manifest);
  assert.equal(
    parsed.scripts["verify:actions-pinned"],
    "node scripts/verify-actions-pinned.mjs",
  );
  assert.equal(
    parsed.scripts["security:audit"],
    "node scripts/security/verify-dependency-audit.mjs",
  );
  assert.equal(
    parsed.scripts["security:sbom"],
    "node scripts/security/generate-sbom.mjs",
  );
});

test("Dependabot covers web, Mobile and GitHub Actions without auto-merge configuration", async () => {
  const source = await readFile(".github/dependabot.yml", "utf8");

  assert.match(source, /package-ecosystem: npm[\s\S]*directory: \//u);
  assert.match(source, /package-ecosystem: npm[\s\S]*directory: \/apps\/mobile/u);
  assert.match(source, /package-ecosystem: github-actions/u);
  assert.match(source, /interval: weekly/u);
  assert.doesNotMatch(source, /auto-merge|automerge/u);
});

test("completed one-off and patch workflows are absent", async () => {
  assert.equal(
    await exists(
      ".github/workflows/one-off-apply-top-fan-migration-20260719.yml",
    ),
    false,
  );
  assert.equal(
    await exists(
      ".github/workflows/p1-supply-chain-hardening-patch-20260723.yml",
    ),
    false,
  );
  assert.equal(
    await exists("scripts/security/supply-chain-hardening-patch-temp.mjs"),
    false,
  );
});
