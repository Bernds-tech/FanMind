import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

import { scanWorkflowPolicy } from "../scripts/verify-actions-pinned.mjs";

const CODEQL_V4_37_3_SHA = "e4fba868fa4b1b91e1fdab776edc8cfbe6e9fb81";

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

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

test("CodeQL init and analyze use the same reviewed v4.37.3 commit and minimal permissions", async () => {
  const source = await readFile(".github/workflows/codeql.yml", "utf8");
  const initMatch = source.match(
    /github\/codeql-action\/init@([0-9a-f]{40})\s+#\s+v4\.37\.3/u,
  );
  const analyzeMatch = source.match(
    /github\/codeql-action\/analyze@([0-9a-f]{40})\s+#\s+v4\.37\.3/u,
  );

  assert.equal(initMatch?.[1], CODEQL_V4_37_3_SHA);
  assert.equal(analyzeMatch?.[1], CODEQL_V4_37_3_SHA);
  assert.equal(initMatch?.[1], analyzeMatch?.[1]);
  assert.match(source, /queries: security-extended/u);
  assert.match(source, /security-events: write/u);
  assert.match(source, /contents: read/u);
  assert.doesNotMatch(source, /contents: write/u);
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
