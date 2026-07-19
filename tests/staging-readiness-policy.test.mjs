import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const scriptPath = "scripts/staging-readiness-preflight.mjs";
const workflowPath = ".github/workflows/staging-readiness.yml";
const runbookPath = "docs/operations/STAGING_PROVISIONING.md";
const roadmapPath = "src/config/roadmap.ts";

async function read(path) {
  return readFile(path, "utf8");
}

test("staging readiness remains fail-closed and test-mode only", async () => {
  const [script, workflow] = await Promise.all([read(scriptPath), read(workflowPath)]);

  assert.match(script, /FANMIND_RUNTIME_ENVIRONMENT muss staging sein/);
  assert.match(script, /sk_test_/);
  assert.match(script, /FANMIND_ENABLE_NON_PRODUCTION_WRITES/);
  assert.match(script, /FANMIND_ENABLE_REFERRAL_BILLING/);
  assert.match(script, /STAGING_READINESS=OK/);

  assert.match(workflow, /environment: staging/);
  assert.match(workflow, /FANMIND_ENABLE_NON_PRODUCTION_WRITES: 'false'/);
  assert.match(workflow, /FANMIND_ENABLE_REFERRAL_BILLING: 'false'/);
  assert.match(workflow, /npm run staging:preflight/);
  assert.match(workflow, /npm run smoke:public/);
});

test("staging runbook forbids production data and documents external dependencies", async () => {
  const runbook = await read(runbookPath);

  assert.match(runbook, /ausschließlich synthetische Kontakte/);
  assert.match(runbook, /keine Live-Kunden/);
  assert.match(runbook, /ersetzt nicht die externen Ressourcen/);
  assert.match(runbook, /Produktions- und Testdaten trennen/);
});

test("roadmap only checks work that is actually complete", async () => {
  const roadmap = await read(roadmapPath);

  assert.match(roadmap, /label: "Operations-Grundlage", state: "done", status: "Produktiv aktiv"/);
  assert.match(roadmap, /label: "Release-Checks", state: "done", status: "Automatisch aktiv"/);
  assert.match(roadmap, /label: "Umgebungs-Governance", state: "done", status: "Fail-closed aktiv"/);
  assert.match(roadmap, /label: "Produktions- und Testdaten trennen", state: "partial", status: "Technik fertig · externe Ressourcen offen"/);
  assert.match(roadmap, /label: "Finaler Go-Live-Smoke-Test", state: "planned", status: "Offen"/);
  assert.match(roadmap, /label: "Steuerberater-Bestätigung", state: "planned", status: "Extern offen"/);
});
