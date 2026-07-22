import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const routePath = "src/app/settings/profile/data-export/route.ts";
const pdfPath = "src/lib/dataDisclosurePdf.ts";
const sectionPath = "src/app/settings/AccountSections.tsx";

async function loadPdfModule() {
  const source = await readFile(pdfPath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      strict: true,
    },
    fileName: pdfPath,
  }).outputText;
  const directory = await mkdtemp(join(tmpdir(), "fanmind-pdf-test-"));
  const modulePath = join(directory, "dataDisclosurePdf.mjs");
  await writeFile(modulePath, output, "utf8");
  const module = await import(`${pathToFileURL(modulePath).href}?t=${Date.now()}`);
  return { module, cleanup: () => rm(directory, { recursive: true, force: true }) };
}

test("profile offers one localized protected PDF download without legacy mail or logout actions", async () => {
  const [route, section] = await Promise.all([
    readFile(routePath, "utf8"),
    readFile(sectionPath, "utf8"),
  ]);

  assert.match(section, /\/settings\/profile\/data-export\?lang=\$\{locale\}/u);
  assert.match(section, /PDF-Datenauskunft herunterladen/u);
  assert.match(section, /Download PDF data disclosure/u);
  assert.doesNotMatch(section, /DSGVO-Datenauskunft anfordern/u);
  assert.doesNotMatch(section, /mailto:kontakt@fanmind\.ch\?subject=DSGVO-Datenauskunft/u);
  assert.doesNotMatch(section, /<form action=\{logoutAction\}>/u);
  assert.doesNotMatch(section, /logoutAction:\s*\(\) => Promise<void>/u);

  assert.match(route, /getSupabaseServerUser\(\)/u);
  assert.match(route, /getUserWorkspaceDashboard\(data\.user\)/u);
  assert.match(route, /getWorkspaceContacts\(workspace\.id\)/u);
  assert.match(route, /Content-Type": "application\/pdf"/u);
  assert.match(route, /Cache-Control": "private, no-store"/u);
  assert.match(route, /X-Content-Type-Options": "nosniff"/u);
  assert.match(route, /fanmind-data-disclosure\.pdf/u);
  assert.doesNotMatch(
    route,
    /stripe_customer_id|stripe_subscription_id|stripe_checkout_session_id|test_access_flags|billing_admin_note|SUPABASE_SERVICE_ROLE_KEY/u,
  );
});

test("PDF generator emits all contacts across multiple valid page objects without silent truncation", async () => {
  const { module, cleanup } = await loadPdfModule();
  try {
    const contacts = Array.from({ length: 140 }, (_, index) => ({
      displayName: `Kontakt ${index + 1}`,
      handle: `@kontakt_${index + 1}`,
      sourcePlatform: "manual",
      language: index % 2 ? "en" : "de",
      status: "active",
      tags: ["vip", `gruppe-${index + 1}`],
      summary: `Vollständige Zusammenfassung für Kontakt ${index + 1} mit genügend Text für einen sicheren Seitenumbruch ohne Abschneiden.`,
      internalNotes: `Interne Notiz ${index + 1}`,
      createdAt: "2026-07-01T10:00:00.000Z",
      updatedAt: "2026-07-20T12:00:00.000Z",
    }));

    const pdf = module.createDataDisclosurePdf({
      generatedAt: new Date("2026-07-22T12:00:00.000Z"),
      locale: "de",
      user: {
        id: "user-1",
        email: "owner@example.com",
        displayName: "Test Owner",
      },
      workspace: {
        id: "workspace-1",
        name: "Test Workspace",
        planId: "starter",
        commercialOption: "Starter Flex",
        billingStatus: "active",
        setupFeeCents: 99000,
        monthlyFeeCents: 31200,
        commitmentMonths: 0,
        organizationName: "Test Organisation",
      },
      contacts,
    });

    const body = Buffer.from(pdf).toString("latin1");
    const pageObjects = body.match(/\/Type \/Page\b/g) ?? [];
    assert.match(body, /^%PDF-1\.4/u);
    assert.match(body, /FanMind PDF-Datenauskunft/u);
    assert.match(body, /CRM-Kontakte/u);
    assert.match(body, /Kontakt 140/u);
    assert.match(body, /Seite 1 \/ /u);
    assert.ok(pageObjects.length > 2, "large disclosure must span multiple PDF pages");
    assert.match(body, new RegExp(`/Count ${pageObjects.length}\\b`, "u"));
    assert.doesNotMatch(body, /Weitere Kontakte|nicht im kompakten PDF gelistet/u);
    assert.match(body, /%%EOF/u);
  } finally {
    await cleanup();
  }
});

test("empty exports stay honest and English output uses English section labels", async () => {
  const { module, cleanup } = await loadPdfModule();
  try {
    const pdf = module.createDataDisclosurePdf({
      generatedAt: new Date("2026-07-22T12:00:00.000Z"),
      locale: "en",
      user: { id: "user-empty" },
      workspace: { id: "workspace-empty", name: "Empty Workspace" },
      contacts: [],
    });
    const body = Buffer.from(pdf).toString("latin1");
    assert.match(body, /FanMind PDF data disclosure/u);
    assert.match(body, /No contacts are stored in this workspace\./u);
    assert.match(body, /Page 1 \/ 1/u);
  } finally {
    await cleanup();
  }
});
