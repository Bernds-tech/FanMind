#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();

const runtimeFiles = [
  "src/config/plans.ts",
  "src/lib/stripeBilling.ts",
  "src/lib/referrals.ts",
  "src/app/landing-v2/page.tsx",
  "src/app/register/RegisterClient.tsx",
  "src/app/settings/AccountSections.tsx",
  "src/app/agb/page.tsx",
  "src/app/zahlungsbedingungen/page.tsx",
  "src/app/datenschutz/page.tsx",
  "src/app/impressum/page.tsx",
];

const contents = new Map();
const errors = [];
const warnings = [];

for (const file of runtimeFiles) {
  try {
    contents.set(file, await readFile(resolve(root, file), "utf8"));
  } catch (error) {
    errors.push(`${file}: Datei konnte nicht gelesen werden (${error instanceof Error ? error.message : "unbekannter Fehler"}).`);
  }
}

function content(file) {
  return contents.get(file) ?? "";
}

function requireText(file, value, explanation) {
  if (!content(file).includes(value)) {
    errors.push(`${file}: ${explanation} Erwarteter Wert fehlt: ${JSON.stringify(value)}.`);
  }
}

function forbid(pattern, explanation) {
  for (const [file, text] of contents) {
    if (pattern.test(text)) {
      errors.push(`${file}: ${explanation}`);
    }
  }
}

function warn(pattern, explanation) {
  for (const [file, text] of contents) {
    if (pattern.test(text)) {
      warnings.push(`${file}: ${explanation}`);
    }
  }
}

forbid(/299\s*€\s*\/\s*Monat/iu, "Veralteter Starter-Preis 299 €/Monat gefunden.");
forbid(/499\s*€\s*\/\s*Monat/iu, "Veralteter Growth-Preis 499 €/Monat gefunden.");
forbid(/Agency\s+ab\s+990\s*€\s*\/\s*Monat/iu, "Veralteter Agency-Preis gefunden.");
forbid(/kontakt@fanmind\.de/iu, "Veraltete .de-Kontaktadresse gefunden.");
forbid(/Fanmind@fanmind\.ch/u, "Uneinheitliche Anfrageadresse gefunden; nutze kontakt@fanmind.ch.");

requireText(
  "src/config/plans.ts",
  "312 €/Monat",
  "Die zentrale Paketkonfiguration muss die beschlossene Starter-Monatsgebühr enthalten.",
);
requireText(
  "src/lib/stripeBilling.ts",
  "monthlyFeeCents: 31200",
  "Stripe-Billing muss mit 31200 Cent Monatsgebühr arbeiten.",
);
requireText(
  "src/app/agb/page.tsx",
  "312 €/Monat",
  "Die Vertragsbedingungen müssen die beschlossene Starter-Monatsgebühr nennen.",
);
requireText(
  "src/app/zahlungsbedingungen/page.tsx",
  "312",
  "Die Zahlungsbedingungen müssen die beschlossene Starter-Monatsgebühr enthalten.",
);
requireText(
  "src/app/impressum/page.tsx",
  "kontakt@fanmind.ch",
  "Das Impressum muss die einheitliche Kontaktadresse verwenden.",
);
requireText(
  "src/app/datenschutz/page.tsx",
  "kontakt@fanmind.ch",
  "Die Datenschutzerklärung muss die einheitliche Kontaktadresse verwenden.",
);
requireText(
  "src/lib/referrals.ts",
  "REFERRAL_DISCOUNT_STEP_PERCENT = 5",
  "Referral muss 5 Prozent je aktivem geworbenem Workspace verwenden.",
);
requireText(
  "src/lib/referrals.ts",
  "REFERRAL_MAX_ACTIVE_COUNT = 20",
  "Referral muss maximal 20 aktive Empfehlungen berücksichtigen.",
);
requireText(
  "src/lib/referrals.ts",
  "REFERRAL_GROWTH_WINDOW_CAP = 2000",
  "Das Referral Growth Window muss bei 2.000 aktiven zahlenden Workspaces gedeckelt sein.",
);

warn(/\[BITTE FINAL EINTRAGEN/iu, "Öffentlicher rechtlicher Platzhalter ist noch offen.");
warn(/TODO:\s*(Rechtsform|Vertretungsbefugnis|UID|FN|OpenAI-Vertrag|DPA|Transfergrundlagen)/iu, "Rechtliche Abschlussprüfung ist noch dokumentiert offen.");

for (const warning of warnings) {
  console.warn(`TRUTH_WARNING: ${warning}`);
}

if (errors.length) {
  for (const error of errors) {
    console.error(`TRUTH_ERROR: ${error}`);
  }
  console.error(`Product truth verification failed with ${errors.length} error(s).`);
  process.exit(1);
}

console.log(`Product truth verified across ${runtimeFiles.length} runtime files (${warnings.length} warning(s)).`);
