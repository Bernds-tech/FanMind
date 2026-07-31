import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function source(path) {
  return readFile(resolve(root, path), "utf8");
}

test("public legal pages contain no internal placeholders and use current product terms", async () => {
  const files = await Promise.all(
    [
      "src/app/impressum/page.tsx",
      "src/app/datenschutz/page.tsx",
      "src/app/avv/page.tsx",
      "src/app/agb/page.tsx",
      "src/app/zahlungsbedingungen/page.tsx",
      "src/app/referral-bedingungen/page.tsx",
    ].map(source),
  );

  for (const content of files) {
    assert.doesNotMatch(
      content,
      /TODO:|\[BITTE FINAL EINTRAGEN|kontakt@fanmind\.de|FanMind e\.U\./iu,
    );
  }

  const privacy = files[1];
  assert.doesNotMatch(privacy, /\b(?:Memory|Memories|Fan-Analyse)\b/iu);
  assert.match(privacy, /Kontaktwissen/u);
  assert.match(privacy, /Copy-&-Open-Assistent/u);
});

test("privacy copy stays aligned with the active consent-gated Meta events", async () => {
  const [privacy, policy, register, inquiry] = await Promise.all([
    source("src/app/datenschutz/page.tsx"),
    source("src/lib/metaPixelPolicy.mjs"),
    source("src/app/register/RegisterClient.tsx"),
    source("src/components/landing/FooterInquiryForm.tsx"),
  ]);

  for (const eventName of ["PageView", "CompleteRegistration", "Lead"]) {
    assert.match(policy, new RegExp(`"${eventName}"`, "u"));
    assert.match(privacy, new RegExp(`<code>${eventName}</code>`, "u"));
  }

  assert.match(register, /trackMetaPixelEvent\("CompleteRegistration"\)/u);
  assert.match(inquiry, /trackMetaPixelEvent\("Lead"\)/u);
  assert.match(
    privacy,
    /Alle drei Events werden ohne zusätzliche FanMind-Eventparameter übermittelt\./u,
  );
  assert.doesNotMatch(
    privacy,
    /ausschließlich das Standardevent\s*<code>PageView<\/code>/u,
  );
});

test("public retention statements map to implemented technical boundaries", async () => {
  const [
    privacy,
    retention,
    metaPolicy,
    deletionPolicy,
    demoRoute,
    diagnosticWorker,
    backupPolicy,
  ] = await Promise.all([
    source("src/app/datenschutz/page.tsx"),
    source("docs/legal/RETENTION_REGISTER.md"),
    source("src/lib/metaPixelPolicy.mjs"),
    source("src/lib/accountDeletionPolicy.mjs"),
    source("src/app/api/demo/start/route.ts"),
    source("scripts/operations/webhook-diagnostic-retention.mjs"),
    source("scripts/operations/backup-retention.mjs"),
  ]);

  assert.match(metaPolicy, /180 \* 24 \* 60 \* 60/u);
  assert.match(privacy, /höchstens 180 Tage/u);
  assert.match(deletionPolicy, /ACCOUNT_DELETION_PROCESSING_DAYS = 30/u);
  assert.match(privacy, /Bearbeitungsziel von höchstens 30 Tagen/u);
  assert.match(demoRoute, /DEMO_DURATION_MS = 60 \* 60 \* 1000/u);
  assert.match(privacy, /Demo-Zugänge laufen nach einer Stunde ab/u);
  assert.match(diagnosticWorker, /DEFAULT_RETENTION_DAYS = 30/u);
  assert.match(privacy, /Diagnosen werden standardmäßig nach 30 Tagen gelöscht/u);
  assert.match(
    backupPolicy,
    /database: Object\.freeze\(\{ daily: 1, weekly: 1, monthly: 1 \}\)/u,
  );
  assert.match(retention, /Offsite-Backups/u);
  assert.match(retention, /Entscheidung offen/u);
  assert.match(
    privacy,
    /eine vollständig ausgeführte zeitliche Offsite-Löschregel bleibt vor Vertragsfreigabe nachzuweisen/u,
  );
  assert.match(
    privacy,
    /Eine EU-Senderegion ist daher kein Nachweis für EU-Datenspeicherung/u,
  );
});

test("AVV working draft covers Article 28 annexes without claiming signature readiness", async () => {
  const [draft, status] = await Promise.all([
    source("docs/legal/AVV_WORKING_DRAFT.md"),
    source("docs/LEGAL_COMPLETION_STATUS.md"),
  ]);

  assert.match(draft, /\*\*nicht unterschriftsreif\*\*/u);
  assert.match(draft, /Art\. 28 DSGVO/u);
  for (const heading of [
    "Rollen und Parteien",
    "Gegenstand, Zweck und Dauer",
    "Datenarten",
    "Betroffene Personengruppen",
    "Technische und organisatorische Maßnahmen",
    "Unterauftragsverarbeiter und weitere Empfänger",
    "Noch erforderliche Abschlussentscheidungen",
  ]) {
    assert.match(draft, new RegExp(heading, "u"));
  }
  for (const provider of [
    "Exoscale",
    "Supabase",
    "OpenAI",
    "Stripe",
    "Meta",
    "Resend",
  ]) {
    assert.match(draft, new RegExp(provider, "u"));
  }

  assert.match(
    status,
    /-\s*\[x\]\s*technische und fachliche AVV-Arbeitsfassung/iu,
  );
  assert.match(
    status,
    /-\s*\[ \]\s*rechtsgeprüfte und unterzeichnungsfähige AVV/iu,
  );
});

test("external legal evidence stays account-specific and fail-closed", async () => {
  const [register, evidence, verifier, hasher, packageSource, gitignore] =
    await Promise.all([
      source("docs/legal/EXTERNAL_APPROVAL_REGISTER.md"),
      source("docs/legal/external-approval-evidence.json"),
      source("scripts/verify-legal-external-evidence.mjs"),
      source("scripts/legal/hash-external-evidence.mjs"),
      source("package.json"),
      source(".gitignore"),
    ]);

  const parsed = JSON.parse(evidence);
  assert.equal(parsed.schemaVersion, 1);
  assert.equal(parsed.operator.legalName, "Bernd Guggenberger");
  assert.equal(parsed.operator.legalForm, "Einzelunternehmen");
  assert.equal(parsed.operator.vatId.status, "pending");
  assert.equal(parsed.approvals.legalReview.status, "pending");
  assert.equal(parsed.approvals.taxReview.status, "pending");
  assert.equal(parsed.approvals.customerDpa.status, "pending");
  assert.deepEqual(
    parsed.providers.map(({ id }) => id),
    ["exoscale", "supabase", "openai", "stripe", "meta", "resend"],
  );
  for (const provider of parsed.providers) {
    assert.equal(provider.dpa.status, "pending");
    assert.equal(provider.dataLocation.status, "pending");
    assert.equal(provider.transferAssessment.status, "pending");
  }

  assert.match(register, /Supabase[\s\S]*PandaDoc/iu);
  assert.match(register, /Resend[\s\S]*US-Speicher/iu);
  assert.match(register, /Wer die AVV unterschreibt/u);
  assert.match(register, /Steuerberatung[\s\S]*Rechts-\/Datenschutzberatung/u);
  assert.match(register, /SHA-256-Prüfsumme/u);
  assert.match(verifier, /--require-complete/u);
  assert.match(verifier, /LEGAL_EXTERNAL_EVIDENCE_READY/u);
  assert.match(hasher, /O_NOFOLLOW/u);
  assert.match(hasher, /LEGAL_EXTERNAL_EVIDENCE_PRIVATE_CONTENT_OUTPUT=false/u);
  assert.match(
    packageSource,
    /"legal:evidence:hash":\s*"node scripts\/legal\/hash-external-evidence\.mjs"/u,
  );
  assert.match(
    packageSource,
    /"legal:evidence:require-complete":\s*"node scripts\/verify-legal-external-evidence\.mjs --require-complete"/u,
  );
  assert.match(gitignore, /\/docs\/legal\/private-evidence\//u);
});

test("both production release checks include every public legal route", async () => {
  const scripts = await Promise.all([
    source("scripts/final-go-live-preflight.mjs"),
    source("scripts/smoke-public-routes.mjs"),
  ]);

  for (const script of scripts) {
    for (const route of [
      "/impressum",
      "/datenschutz",
      "/avv",
      "/agb",
      "/zahlungsbedingungen",
    ]) {
      assert.match(script, new RegExp(`"${route}"`, "u"));
    }
  }
});
