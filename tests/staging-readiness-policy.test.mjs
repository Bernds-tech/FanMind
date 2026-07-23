import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import test from "node:test";
import { readFile } from "node:fs/promises";

const execFileAsync = promisify(execFile);
const scriptPath = "scripts/staging-readiness-preflight.mjs";
const workflowPath = ".github/workflows/staging-readiness.yml";
const runbookPath = "docs/operations/STAGING_PROVISIONING.md";
const roadmapPath = "src/config/roadmap.ts";

const stagingSecrets = {
  anon: "anon_value_1234567890",
  service: "service_value_1234567890",
  stripe: "sk_test_SyntheticOnly1234567890",
  webhook: "whsec_SyntheticOnly1234567890",
};

function stagingEnvironment(overrides = {}) {
  return {
    ...process.env,
    FANMIND_RUNTIME_ENVIRONMENT: "staging",
    NEXT_PUBLIC_APP_URL: "https://staging.fanmind.example",
    NEXT_PUBLIC_SITE_URL: "https://staging.fanmind.example",
    NEXT_PUBLIC_SUPABASE_URL: "https://stagingref12345.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: stagingSecrets.anon,
    SUPABASE_SERVICE_ROLE_KEY: stagingSecrets.service,
    FANMIND_TARGET_SUPABASE_PROJECT_REF: "stagingref12345",
    FANMIND_PRODUCTION_SUPABASE_PROJECT_REF: "productionref123",
    FANMIND_ENABLE_NON_PRODUCTION_WRITES: "false",
    FANMIND_NON_PRODUCTION_WRITE_ACK: "",
    STRIPE_SECRET_KEY: stagingSecrets.stripe,
    STRIPE_WEBHOOK_SECRET: stagingSecrets.webhook,
    OPENAI_API_KEY: "",
    FANMIND_ENABLE_REFERRAL_BILLING: "false",
    FANMIND_PUBLIC_DEMO_ENABLED: "false",
    FANMIND_ENABLE_TELEGRAM_SEND: "false",
    FANMIND_OPERATIONS_EMAIL_ENABLED: "false",
    FANMIND_SERVER_ERROR_EMAIL_ENABLED: "false",
    ...overrides,
  };
}

async function read(path) {
  return readFile(path, "utf8");
}

test("staging readiness remains fail-closed and test-mode only", async () => {
  const [script, workflow] = await Promise.all([read(scriptPath), read(workflowPath)]);

  assert.match(script, /FANMIND_RUNTIME_ENVIRONMENT muss staging sein/);
  assert.match(script, /sk_test_/);
  assert.match(script, /FANMIND_ENABLE_NON_PRODUCTION_WRITES/);
  assert.match(script, /FANMIND_ENABLE_REFERRAL_BILLING/);
  assert.match(script, /FANMIND_TARGET_SUPABASE_PROJECT_REF/);
  assert.match(script, /Supabase-URL und explizite Staging-Zielreferenz müssen exakt übereinstimmen/);
  assert.match(script, /STAGING_SUPABASE_REF_BINDING/);
  assert.match(script, /STAGING_READINESS=OK/);

  assert.match(workflow, /environment: staging/);
  assert.match(workflow, /FANMIND_ENABLE_NON_PRODUCTION_WRITES: 'false'/);
  assert.match(workflow, /FANMIND_ENABLE_REFERRAL_BILLING: 'false'/);
  assert.match(workflow, /npm run staging:preflight/);
  assert.match(workflow, /npm run smoke:public/);
});

test("staging readiness accepts an exact URL-to-target binding without exposing values", async () => {
  const { stdout, stderr } = await execFileAsync(
    process.execPath,
    [scriptPath],
    { env: stagingEnvironment() },
  );
  const output = `${stdout}\n${stderr}`;

  assert.match(output, /STAGING_RUNTIME=staging/);
  assert.match(output, /STAGING_APP_TARGET=separate/);
  assert.match(output, /STAGING_SUPABASE_TARGET=separate/);
  assert.match(output, /STAGING_SUPABASE_REF_BINDING=matching/);
  assert.match(output, /STAGING_STRIPE_MODE=test/);
  assert.match(output, /SECRETS_WURDEN_NICHT_AUSGEGEBEN=true/);
  assert.match(output, /STAGING_READINESS=OK/);

  for (const value of Object.values(stagingSecrets)) {
    assert.doesNotMatch(output, new RegExp(value));
  }
  assert.doesNotMatch(output, /stagingref12345|productionref123/);
});

test("staging readiness rejects a mismatched explicit target without exposing values", async () => {
  await assert.rejects(
    execFileAsync(
      process.execPath,
      [scriptPath],
      {
        env: stagingEnvironment({
          FANMIND_TARGET_SUPABASE_PROJECT_REF: "differentref123",
        }),
      },
    ),
    (error) => {
      const output = `${error.stdout ?? ""}\n${error.stderr ?? ""}`;
      assert.match(output, /STAGING_SUPABASE_REF_BINDING=invalid/);
      assert.match(output, /Supabase-URL und explizite Staging-Zielreferenz müssen exakt übereinstimmen/);
      assert.doesNotMatch(output, /stagingref12345|differentref123|productionref123/);
      for (const value of Object.values(stagingSecrets)) {
        assert.doesNotMatch(output, new RegExp(value));
      }
      return true;
    },
  );
});

test("staging runbook forbids production data and documents external dependencies", async () => {
  const runbook = await read(runbookPath);

  assert.match(runbook, /ausschließlich synthetische Kontakte/);
  assert.match(runbook, /keine Live-Kunden/);
  assert.match(runbook, /exakt der Projektreferenz in der Supabase-URL entsprechen/);
  assert.match(runbook, /ersetzt nicht die externen Ressourcen/);
  assert.match(runbook, /Produktions- und Testdaten trennen/);
});

test("roadmap only checks work that is actually complete", async () => {
  const roadmap = await read(roadmapPath);

  assert.match(roadmap, /label: "Operations-Grundlage", state: "done", status: "Produktiv aktiv"/);
  assert.match(roadmap, /label: "Release-Checks", state: "done", status: "Automatisch aktiv"/);
  assert.match(roadmap, /label: "Umgebungs-Governance", state: "done", status: "Fail-closed aktiv"/);
  assert.match(roadmap, /label: "Produktionsfreigabe", state: "done", status: "Erledigt"/);
  assert.match(roadmap, /label: "Finaler Go-Live-Smoke-Test", state: "done", status: "Erledigt"/);
  assert.match(roadmap, /label: "Produktions- und Testdaten trennen", state: "partial", status: "Technik fertig · externe Ressourcen offen"/);
  assert.doesNotMatch(roadmap, /Steuerberater-Bestätigung/);
});
