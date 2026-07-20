import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const routePath = "src/app/api/settings/data-export/route.ts";
const pdfPath = "src/lib/dataExport/pdf.ts";
const settingsPath = "src/app/settings/AccountSections.tsx";

test("self-service data export requires auth and workspace isolation", async () => {
  const route = await readFile(routePath, "utf8");
  assert.match(route, /getSupabaseServerUser\(\)/u);
  assert.match(route, /status: 401/u);
  assert.match(route, /getUserWorkspaceDashboard\(user\)/u);
  assert.match(route, /getWorkspaceContacts\(workspace\.id\)/u);
  assert.match(route, /getWorkspaceFollowups\(workspace\.id\)/u);
  assert.match(route, /getWorkspaceConversationMessages\(workspace\.id\)/u);
  assert.match(route, /getContactMemories\(workspace\.id, contact\.id\)/u);
});

test("self-service data export returns a branded PDF download", async () => {
  const [route, pdf] = await Promise.all([readFile(routePath, "utf8"), readFile(pdfPath, "utf8")]);
  assert.match(route, /Content-Type": "application\/pdf"/u);
  assert.match(route, /FanMind-Datenauskunft-\$\{new Date\(\)\.toISOString\(\)\.slice\(0, 10\)\}\.pdf/u);
  assert.match(pdf, /FanMind/u);
  assert.match(pdf, /Keine Daten vorhanden/u);
});

test("self-service data export excludes secrets and replaces mail/logout card actions", async () => {
  const [route, settings] = await Promise.all([readFile(routePath, "utf8"), readFile(settingsPath, "utf8")]);
  assert.doesNotMatch(route, /\["(?:Passwort|Sessiondaten|API-Key|Token|Service-Key|OPENAI_API_KEY|SUPABASE_SERVICE_ROLE)"/u);
  assert.doesNotMatch(settings, /DSGVO-Datenauskunft%20FanMind/u);
  assert.match(settings, /href="\/api\/settings\/data-export"/u);
  assert.doesNotMatch(settings, /gdpr-profile-title[\s\S]*<form action=\{logoutAction\}/u);
});
