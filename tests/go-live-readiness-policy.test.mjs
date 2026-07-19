import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const roadmapPath = "src/config/roadmap.ts";
const smokeScriptPath = "scripts/final-go-live-preflight.mjs";
const workflowPath = ".github/workflows/final-go-live-readiness.yml";
const runbookPath = "docs/operations/FINAL_GO_LIVE_SMOKE_TEST.md";
const salesFiles = [
  "docs/sales/FANMIND_SALES_ONE_PAGER.md",
  "docs/sales/FANMIND_DEMO_SCRIPT.md",
  "docs/sales/FANMIND_OBJECTION_HANDLING.md",
];

async function read(path) {
  return readFile(path, "utf8");
}

test("roadmap separates completed technical foundations from external staging resources", async () => {
  const roadmap = await read(roadmapPath);

  assert.match(roadmap, /label: "Operations-Grundlage", state: "done", status: "Produktiv aktiv"/);
  assert.match(roadmap, /label: "Release-Checks", state: "done", status: "Automatisch aktiv"/);
  assert.match(roadmap, /label: "Produktions- und Testdaten trennen", state: "partial", status: "Technik fertig · externe Ressourcen offen"/);
  assert.match(roadmap, /label: "Umgebungs-Governance", state: "done", status: "Fail-closed aktiv"/);
});

test("final go-live preflight remains read-only and verifies public truth", async () => {
  const script = await read(smokeScriptPath);

  assert.doesNotMatch(script, /method:\s*"(?:POST|PUT|PATCH|DELETE)"/u);
  assert.match(script, /\/api\/version/);
  assert.match(script, /\/api\/health/);
  assert.match(script, /299 €\/Monat/);
  assert.match(script, /Pilot anfragen/);
});

test("final readiness workflow runs only after a successful deploy or manual dispatch", async () => {
  const workflow = await read(workflowPath);

  assert.match(workflow, /workflows:\s*\n\s*- Deploy FanMind/);
  assert.match(workflow, /github\.event\.workflow_run\.conclusion == 'success'/);
  assert.match(workflow, /npm run smoke:go-live:public/);
});

test("sales and final smoke documents preserve product guardrails", async () => {
  const documents = await Promise.all([runbookPath, ...salesFiles].map(read));
  const combined = documents.join("\n");

  assert.match(combined, /keine automatische Send/u);
  assert.match(combined, /312 € pro Monat/u);
  assert.match(combined, /Referral-Billing.*deaktiviert/us);
  assert.match(combined, /Stripe-Webhook 200/u);
});
