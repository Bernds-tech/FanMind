import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function read(path) {
  return readFile(path, "utf8");
}

test("Playwright stays exactly pinned and exposes separate public and staging commands", async () => {
  const manifest = JSON.parse(await read("package.json"));

  assert.equal(manifest.devDependencies?.["@playwright/test"], "1.60.0");
  assert.equal(
    manifest.scripts?.["test:e2e"],
    "playwright test --config=playwright.config.mts",
  );
  assert.equal(
    manifest.scripts?.["test:e2e:staging"],
    "playwright test --config=playwright.staging.config.mts",
  );
  assert.match(
    manifest.scripts?.["test:operations"] ?? "",
    /tests\/browser-e2e-policy\.test\.mjs/u,
  );
});

test("public browser config runs deterministic desktop and mobile Chromium with failure-only evidence", async () => {
  const source = await read("playwright.config.mts");

  assert.match(source, /baseURL[\s\S]*127\.0\.0\.1:3100/u);
  assert.match(source, /workers: 1/u);
  assert.match(source, /name: "desktop-chromium"/u);
  assert.match(source, /devices\["Desktop Chrome"\]/u);
  assert.match(source, /name: "mobile-chromium"/u);
  assert.match(source, /devices\["Pixel 7"\]/u);
  assert.match(source, /trace: "retain-on-failure"/u);
  assert.match(source, /screenshot: "only-on-failure"/u);
  assert.match(source, /video: "off"/u);
  assert.doesNotMatch(source, /firefox|webkit/iu);
});

test("public Browser E2E workflow is immutable, Chromium-only and read-only", async () => {
  const source = await read(".github/workflows/browser-e2e.yml");

  assert.match(
    source,
    /actions\/checkout@11d5960a326750d5838078e36cf38b85af677262/u,
  );
  assert.match(
    source,
    /actions\/setup-node@48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e/u,
  );
  assert.match(
    source,
    /actions\/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02/u,
  );
  assert.match(source, /permissions:\s*\n\s*contents: read/u);
  assert.doesNotMatch(source, /contents: write|write-all/u);
  assert.match(source, /npx playwright install --with-deps chromium/u);
  assert.doesNotMatch(source, /install[^\n]*(?:firefox|webkit)/iu);
  assert.match(source, /npm run test:e2e/u);
  assert.match(source, /retention-days: 7/u);
});

test("public browser spec uses synthetic responses and cannot create a demo or account", async () => {
  const source = await read("e2e/public-critical.spec.ts");

  assert.match(source, /e2e\.invalid@example\.com/u);
  assert.match(source, /e2e\.recovery@example\.com/u);
  assert.match(source, /auth\/v1\/token/u);
  assert.match(source, /auth\/v1\/recover/u);
  assert.match(source, /Demo-Bestätigung[\s\S]*startet aber keine Demo/u);
  assert.match(source, /geschütztes Dashboard führt ohne Sitzung zum Login/u);
  assert.doesNotMatch(source, /\/api\/demo\/start/u);
  assert.doesNotMatch(source, /signUp|Konto erstellen"\s*\}\)\.click/u);
  assert.doesNotMatch(
    source,
    /OPENAI_API_KEY|SUPABASE_SERVICE_ROLE_KEY|STRIPE_SECRET_KEY/u,
  );
  assert.doesNotMatch(source, /https:\/\/fanmind\.ch/u);
});

test("staging config rejects Production and disables authenticated artifacts", async () => {
  const source = await read("playwright.staging.config.mts");

  assert.match(source, /FANMIND_E2E_STAGING_URL/u);
  assert.match(source, /fanmind-staging-readonly/u);
  assert.match(source, /target\.protocol !== "https:"/u);
  assert.match(source, /"fanmind\.ch", "www\.fanmind\.ch"/u);
  assert.match(source, /hostname[\s\S]*includes\("staging"\)/u);
  assert.match(source, /trace: "off"/u);
  assert.match(source, /screenshot: "off"/u);
  assert.match(source, /video: "off"/u);
  assert.doesNotMatch(source, /webServer:/u);
});

test("manual staging workflow uses the staging environment and never uploads session evidence", async () => {
  const source = await read(".github/workflows/browser-e2e-staging.yml");

  assert.match(source, /workflow_dispatch:/u);
  assert.doesNotMatch(source, /pull_request:|push:/u);
  assert.match(source, /environment: staging/u);
  assert.match(source, /FANMIND_STAGING_E2E_EMAIL/u);
  assert.match(source, /FANMIND_STAGING_E2E_PASSWORD/u);
  assert.match(source, /permissions:\s*\n\s*contents: read/u);
  assert.doesNotMatch(source, /upload-artifact/u);
  assert.doesNotMatch(source, /contents: write|write-all/u);
  assert.match(source, /npx playwright install --with-deps chromium/u);
  assert.match(source, /npm run test:e2e:staging/u);
});

test("authenticated staging spec allows only session exchange plus reads", async () => {
  const source = await read("e2e-staging/readonly-critical.spec.ts");

  assert.match(source, /isAuthSessionExchange/u);
  assert.match(source, /url\.pathname\.endsWith\("\/auth\/v1\/token"\)/u);
  assert.match(source, /\["GET", "HEAD", "OPTIONS"\]/u);
  assert.match(source, /route\.abort\("blockedbyclient"\)/u);
  assert.match(source, /blockedWrites[\s\S]*toEqual\(\[\]\)/u);
  assert.doesNotMatch(
    source,
    /\/api\/demo\/start|\/api\/ai|signUp|\.insert\(|\.update\(|\.delete\(/u,
  );
  assert.doesNotMatch(source, /console\.(?:log|warn|error)/u);
});

test("browser E2E runbook preserves existing test layers and external staging truth", async () => {
  const source = await read("docs/testing/BROWSER_E2E.md");

  assert.match(source, /ergänzt die bestehenden Unit-, Policy-, Build-, Public-Smoke- und Sprachprüfungen/u);
  assert.match(source, /startet keine öffentliche Demo/u);
  assert.match(source, /niemals `fanmind\.ch`/u);
  assert.match(source, /Jede andere POST-, PATCH-, PUT- oder DELETE-Anfrage wird browserseitig blockiert/u);
  assert.match(source, /erst ausgeführt, wenn die getrennten externen Staging-Ressourcen vorhanden sind/u);
  assert.match(source, /niemals auf Production ausweichen/u);
});
