#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";

async function replaceRequired(path, from, to, label) {
  const source = await readFile(path, "utf8");
  if (!source.includes(from)) {
    throw new Error(`patch_anchor_missing:${label}:${path}`);
  }
  const updated = source.replace(from, to);
  if (updated === source) {
    throw new Error(`patch_produced_no_change:${label}:${path}`);
  }
  await writeFile(path, updated, "utf8");
}

await replaceRequired(
  "docs/analytics/META_PIXEL.md",
  `8. Beim Wechsel auf geschützte oder nicht freigegebene URLs wird Meta-Consent vorsorglich widerrufen und kein FanMind-Event ausgelöst.`,
  `8. Beim Wechsel auf geschützte oder nicht freigegebene URLs wird Meta-Consent vorsorglich widerrufen und kein FanMind-Event ausgelöst.\n9. Das dynamisch erzeugte Meta-Script erhält \`referrerPolicy='no-referrer'\`; zusätzlich blockiert FanMind jeden same-origin Referrer, der von einer geschützten, dynamischen oder anderweitig nicht freigegebenen FanMind-URL stammt.`,
  "runbook_referrer_architecture",
);

await replaceRequired(
  "docs/analytics/META_PIXEL.md",
  `Parameter wie E-Mail, Referral-Code, \`returnTo\`, Kontakt-/Workspace-ID, Session-/Recovery-Wert oder freie Kampagnenparameter verhindern das Laden und Tracking vollständig. Damit gelangen keine CRM-IDs oder sensiblen Callback-URLs allein durch einen \`PageView\` an Meta.`,
  `Parameter wie E-Mail, Referral-Code, \`returnTo\`, Kontakt-/Workspace-ID, Session-/Recovery-Wert oder freie Kampagnenparameter verhindern das Laden und Tracking vollständig. Damit gelangen keine CRM-IDs oder sensiblen Callback-URLs allein durch einen \`PageView\` an Meta. Ein same-origin Referrer aus einer solchen geschützten oder unsicheren FanMind-URL blockiert den Pixel ebenfalls; externe Referrer bleiben für die normale Marketing-Attribution zulässig.`,
  "runbook_referrer_boundary",
);

await replaceRequired(
  "README.md",
  `- keine E-Mail, Namen, CRM-, Kontakt-, Nachrichten-, KI- oder Zahlungsdaten;`,
  `- keine E-Mail, Namen, CRM-, Kontakt-, Nachrichten-, KI- oder Zahlungsdaten; geschützte same-origin Referrer werden blockiert;`,
  "readme_referrer_boundary",
);

await replaceRequired(
  "docs/SOURCE_OF_TRUTH.md",
  `keine PII-/CRM-Daten, kein Advanced Matching und keine Conversions API;`,
  `keine PII-/CRM-Daten, blockierte geschützte same-origin Referrer, kein Advanced Matching und keine Conversions API;`,
  "source_of_truth_referrer_boundary",
);

await replaceRequired(
  "AGENTS.md",
  `protected/dynamic CRM, admin and billing URLs plus unsafe query or fragment values are fail-closed excluded,`,
  `protected/dynamic CRM, admin and billing URLs plus unsafe query or fragment values and protected same-origin referrers are fail-closed excluded,`,
  "agents_referrer_guardrail",
);

await replaceRequired(
  "src/app/datenschutz/page.tsx",
  `          unsichere Query- oder Fragmentwerte sind von der Pixel-Ausführung ausgeschlossen.`,
  `          unsichere Query- oder Fragmentwerte sind von der Pixel-Ausführung ausgeschlossen. Gleiches\n          gilt für same-origin Referrer aus solchen geschützten oder nicht freigegebenen FanMind-Seiten.`,
  "privacy_referrer_boundary",
);

await replaceRequired(
  "docs/testing/BROWSER_E2E.md",
  `sowie fail-closed blockierte geschützte Routen und unsichere Querywerte.`,
  `sowie fail-closed blockierte geschützte Routen, unsichere Querywerte und geschützte same-origin Referrer.`,
  "browser_docs_referrer_boundary",
);

console.log("META_PIXEL_REFERRER_PATCH=success");
