import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  REQUIRED_PUBLIC_HEALTH_COMPONENTS,
  evaluatePublicHealth,
} from "../scripts/public-health-policy.mjs";

const roadmapPath = "src/config/roadmap.ts";
const smokeScriptPath = "scripts/final-go-live-preflight.mjs";
const deploySmokePath = "scripts/smoke-public-routes.mjs";
const truthPolicyPath = "scripts/public-product-truth.mjs";
const healthPolicyPath = "scripts/public-health-policy.mjs";
const workflowPath = ".github/workflows/final-go-live-readiness.yml";
const deployWorkflowPath = ".github/workflows/deploy-fanmind.yml";
const runbookPath = "docs/operations/FINAL_GO_LIVE_SMOKE_TEST.md";
const salesFiles = [
  "docs/sales/FANMIND_SALES_ONE_PAGER.md",
  "docs/sales/FANMIND_DEMO_SCRIPT.md",
  "docs/sales/FANMIND_OBJECTION_HANDLING.md",
];

async function read(path) {
  return readFile(path, "utf8");
}

function healthyRequiredChecks() {
  return REQUIRED_PUBLIC_HEALTH_COMPONENTS.map((component) => ({
    component,
    status: "healthy",
  }));
}

test("roadmap separates completed technical foundations from external staging resources", async () => {
  const roadmap = await read(roadmapPath);

  assert.match(roadmap, /label: "Operations-Grundlage", state: "done", status: "Produktiv aktiv"/);
  assert.match(roadmap, /label: "Release-Checks", state: "done", status: "Automatisch aktiv"/);
  assert.match(roadmap, /label: "Produktions- und Testdaten trennen", state: "partial", status: "Technik fertig · externe Ressourcen offen"/);
  assert.match(roadmap, /label: "Umgebungs-Governance", state: "done", status: "Fail-closed aktiv"/);
});

test("go-live and deploy smoke gates share live truth and blocking-only health policies", async () => {
  const [goLive, deploySmoke, truthPolicy, healthPolicy, deployWorkflow] = await Promise.all([
    read(smokeScriptPath),
    read(deploySmokePath),
    read(truthPolicyPath),
    read(healthPolicyPath),
    read(deployWorkflowPath),
  ]);

  assert.doesNotMatch(goLive, /method:\s*"(?:POST|PUT|PATCH|DELETE)"/u);
  assert.doesNotMatch(deploySmoke, /method:\s*"(?:POST|PUT|PATCH|DELETE)"/u);
  assert.match(goLive, /public-product-truth\.mjs/u);
  assert.match(deploySmoke, /public-product-truth\.mjs/u);
  assert.match(goLive, /public-health-policy\.mjs/u);
  assert.match(deploySmoke, /public-health-policy\.mjs/u);
  assert.match(deploySmoke, /\/api\/version/u);
  assert.match(deploySmoke, /\/api\/health/u);
  assert.match(deploySmoke, /live German product truth/u);
  assert.match(deployWorkflow, /npm run smoke:public/u);
  assert.match(healthPolicy, /OPTIONAL_PUBLIC_HEALTH_COMPONENTS/u);
  assert.match(healthPolicy, /email_config/u);

  for (const required of [
    "Starter Flex",
    "990 € Setup + 312 €/Monat",
    "Starter 12 Monate",
    "0 € Setup + 312 €/Monat",
    "Kontaktwissen",
  ]) {
    assert.match(truthPolicy, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "u"));
  }

  for (const forbidden of [
    "Fan-Gedächtnis",
    "Pilot anfragen",
    "Pilot / Setup",
    "299 €/Monat",
    "499 €/Monat",
    "Agency ab 990 €/Monat",
    "zzgl. USt.",
    "MVP-Workspace",
  ]) {
    assert.match(truthPolicy, new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "u"));
  }
});

test("optional email configuration never blocks an otherwise healthy production release", () => {
  const result = evaluatePublicHealth({
    status: "degraded",
    checks: [
      ...healthyRequiredChecks(),
      { component: "email_config", status: "unknown" },
    ],
  });

  assert.equal(result.ok, true);
  assert.equal(result.errors.length, 0);
  assert.match(result.detail, /Pflichtkomponenten healthy/u);
  assert.match(result.warnings.join(" "), /email_config.*unknown/u);
});

test("missing or unhealthy required components block deployment", () => {
  const missing = evaluatePublicHealth({
    status: "healthy",
    checks: healthyRequiredChecks().filter(
      (check) => check.component !== "supabase_database",
    ),
  });
  assert.equal(missing.ok, false);
  assert.match(missing.errors.join(" "), /Pflichtkomponente fehlt: supabase_database/u);

  const unhealthy = evaluatePublicHealth({
    status: "degraded",
    checks: healthyRequiredChecks().map((check) =>
      check.component === "openai_config"
        ? { ...check, status: "unavailable" }
        : check,
    ),
  });
  assert.equal(unhealthy.ok, false);
  assert.match(unhealthy.errors.join(" "), /openai_config ist unavailable/u);
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

test("phase 4 is marked done for sales launch and no longer waits for tax advisor confirmation", async () => {
  const roadmap = await read(roadmapPath);

  assert.match(roadmap, /title: "Erledigt \/ Verkaufsstart freigegeben"/u);
  assert.match(roadmap, /status: "Erledigt \/ Verkaufsstart freigegeben"/u);
  assert.match(roadmap, /availability: "done"/u);
  assert.match(roadmap, /label: "Produktionsfreigabe", state: "done", status: "Erledigt"/u);
  assert.match(roadmap, /label: "Finaler Go-Live-Smoke-Test", state: "done", status: "Erledigt"/u);
  assert.doesNotMatch(roadmap, /Steuerberater-Bestätigung/u);
});
