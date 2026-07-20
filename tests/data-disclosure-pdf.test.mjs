import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const routePath = "src/app/settings/profile/data-export/route.ts";
const pdfPath = "src/lib/dataDisclosurePdf.ts";
const sectionPath = "src/app/settings/AccountSections.tsx";

test("profile offers a protected PDF data disclosure download", async () => {
  const [route, section] = await Promise.all([readFile(routePath, "utf8"), readFile(sectionPath, "utf8")]);

  assert.match(section, /href="\/settings\/profile\/data-export"/u);
  assert.match(section, /PDF-Datenauskunft herunterladen/u);
  assert.match(route, /getSupabaseServerUser\(\)/u);
  assert.match(route, /getUserWorkspaceDashboard\(data\.user\)/u);
  assert.match(route, /getWorkspaceContacts\(workspaceResult\.workspace\.id\)/u);
  assert.match(route, /Content-Type": "application\/pdf"/u);
  assert.match(route, /Cache-Control": "private, no-store"/u);
});

test("PDF generator emits a compact PDF with account, workspace and CRM sections", async () => {
  const source = await readFile(pdfPath, "utf8");

  assert.match(source, /FanMind PDF-Datenauskunft/u);
  assert.match(source, /Konto/u);
  assert.match(source, /Workspace/u);
  assert.match(source, /CRM-Daten im Export/u);
  assert.match(source, /%PDF-1\.4/u);
  assert.match(source, /Externe Kanalinhalte/u);
});
