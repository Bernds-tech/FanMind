#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();

const runtimeFiles = [
  "src/config/plans.ts",
  "src/lib/plans.ts",
  "src/lib/stripeBilling.ts",
  "src/lib/referrals.ts",
  "src/lib/referralPolicy.mjs",
  "src/app/landing-v2/page.tsx",
  "src/app/landing-v2/FaqAccordion.tsx",
  "src/app/brandMetadata.ts",
  "src/app/opengraph-image.tsx",
  "src/components/PlatformLogo.module.css",
  "src/components/LegalTopHeader.tsx",
  "src/app/register/RegisterClient.tsx",
  "src/app/settings/AccountSections.tsx",
  "src/app/fans/[id]/page.tsx",
  "src/app/agb/page.tsx",
  "src/app/zahlungsbedingungen/page.tsx",
  "src/app/datenschutz/page.tsx",
  "src/app/impressum/page.tsx",
  "src/app/avv/page.tsx",
  "tests/referral-policy.test.mjs",
  "docs/SOURCE_OF_TRUTH.md",
];

const documentationFiles = new Set(["docs/SOURCE_OF_TRUTH.md"]);
const contents = new Map();
const errors = [];
const warnings = [];

for (const file of runtimeFiles) {
  try {
    contents.set(file, await readFile(resolve(root, file), "utf8"));
  } catch (error) {
    errors.push(
      `${file}: Datei konnte nicht gelesen werden (${error instanceof Error ? error.message : "unbekannter Fehler"}).`,
    );
  }
}

function content(file) {
  return contents.get(file) ?? "";
}

function requireText(file, value, explanation) {
  if (!content(file).includes(value)) {
    errors.push(
      `${file}: ${explanation} Erwarteter Wert fehlt: ${JSON.stringify(value)}.`,
    );
  }
}

function forbid(pattern, explanation) {
  for (const [file, text] of contents) {
    if (documentationFiles.has(file)) continue;
    if (pattern.test(text)) {
      errors.push(`${file}: ${explanation}`);
    }
  }
}

function forbidIn(file, pattern, explanation) {
  const text = content(file);
  if (pattern.test(text)) {
    errors.push(`${file}: ${explanation}`);
  }
}

function warn(pattern, explanation) {
  for (const [file, text] of contents) {
    if (pattern.test(text)) {
      warnings.push(`${file}: ${explanation}`);
    }
  }
}

forbid(
  /299\s*€\s*\/\s*Monat/iu,
  "Veralteter Starter-Preis 299 €/Monat gefunden.",
);
forbid(
  /499\s*€\s*\/\s*Monat/iu,
  "Veralteter Growth-Preis 499 €/Monat gefunden.",
);
forbid(
  /Agency\s+ab\s+990\s*€\s*\/\s*Monat/iu,
  "Veralteter Agency-Preis gefunden.",
);
forbid(
  /kontakt@fanmind\.de/iu,
  "Veraltete .de-Kontaktadresse gefunden.",
);
forbid(
  /Fanmind@fanmind\.ch/u,
  "Uneinheitliche Anfrageadresse gefunden; nutze kontakt@fanmind.ch.",
);
forbid(
  /hello@fanmind\.ch/iu,
  "Uneinheitliche Kontaktadresse gefunden; nutze kontakt@fanmind.ch.",
);
forbid(
  /Ehrliche Roadmap/iu,
  "Öffentliche Roadmap darf nicht als Ehrliche Roadmap bezeichnet werden.",
);
forbid(
  /Unified Inbox Timeline/iu,
  "Nicht aktive Inbox-Synchronisierung darf nicht als Unified Inbox bezeichnet werden.",
);

requireText(
  "src/config/plans.ts",
  "312 €/Monat",
  "Die zentrale Paketkonfiguration muss die beschlossene Starter-Monatsgebühr enthalten.",
);
requireText(
  "src/lib/plans.ts",
  "monthlyFeeCents: 31200",
  "Die zentrale Commercial-Terms-Logik muss 31.200 Cent Monatsgebühr verwenden.",
);
requireText(
  "src/lib/stripeBilling.ts",
  "monthlyFeeCents: 31200",
  "Stripe-Billing muss mit 31.200 Cent Monatsgebühr arbeiten.",
);
requireText(
  "src/app/agb/page.tsx",
  "312 €/Monat",
  "Die Vertragsbedingungen müssen die beschlossene Starter-Monatsgebühr nennen.",
);
requireText(
  "src/app/zahlungsbedingungen/page.tsx",
  'getCommercialTerms("starter_paid_setup")',
  "Die Zahlungsbedingungen müssen ihre Starter-Werte aus der zentralen Commercial-Terms-Logik laden.",
);
requireText(
  "src/app/zahlungsbedingungen/page.tsx",
  "starterFlexTerms.monthlyFeeCents",
  "Die Zahlungsbedingungen müssen die zentrale Starter-Monatsgebühr rendern.",
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
  "src/lib/referralPolicy.mjs",
  "REFERRAL_DISCOUNT_STEP_PERCENT = 5",
  "Referral muss 5 Prozent je aktivem geworbenem Workspace verwenden.",
);
requireText(
  "src/lib/referralPolicy.mjs",
  "REFERRAL_MAX_ACTIVE_COUNT = 20",
  "Referral muss maximal 20 aktive Empfehlungen berücksichtigen.",
);
requireText(
  "src/lib/referralPolicy.mjs",
  "REFERRAL_GROWTH_WINDOW_CAP = 2000",
  "Das Referral Growth Window muss bei 2.000 aktiven zahlenden Workspaces gedeckelt sein.",
);
requireText(
  "src/lib/referralPolicy.mjs",
  'billingStatus !== "active"',
  "Nur aktiv zahlende Workspaces dürfen für Referral freigeschaltet werden.",
);
requireText(
  "src/lib/referralPolicy.mjs",
  "monthlyFeeCentsAfterDiscount",
  "Die wiederkehrende Referral-Berechnung muss einen nicht negativen Monatsbetrag liefern.",
);
requireText(
  "tests/referral-policy.test.mjs",
  "growth window closes at 2000 active paid workspaces",
  "Die Referral-Policy muss den 2.000er-Cap automatisiert testen.",
);
requireText(
  "src/app/settings/AccountSections.tsx",
  "KI Standard ist im Basispaket enthalten",
  "Die Paketansicht muss KI Standard als enthalten und Plus/Ultra als separate Erweiterungen einordnen.",
);
requireText(
  "src/app/settings/AccountSections.tsx",
  "höherer Zusatzpreis als KI Plus",
  "KI Ultra muss als höherpreisige Erweiterung oberhalb von KI Plus beschrieben werden.",
);
requireText(
  "docs/SOURCE_OF_TRUTH.md",
  "### KI-Leistungsstufen / Add-ons",
  "Die Source of Truth muss die beschlossenen KI-Leistungsstufen dokumentieren.",
);

forbidIn(
  "src/app/landing-v2/page.tsx",
  /(?:Fan-Analyse-Report|Memory|\bMVP\b|DSGVO-konform)/iu,
  "Öffentliche Landingpage enthält veraltete oder missverständliche Produktbegriffe.",
);
forbidIn(
  "src/lib/fanmindCopy.ts",
  /(?:Fan-Analyse-Report|Fan analysis report|Memory|\bMVP\b|DSGVO-konform)/iu,
  "Öffentliche Übersetzungen enthalten veraltete oder missverständliche Produktbegriffe.",
);
forbidIn(
  "src/app/landing-v2/FaqAccordion.tsx",
  /DSGVO-konform/iu,
  "Die FAQ darf Datenschutz nicht als pauschale Konformitätsgarantie formulieren.",
);
forbidIn(
  "src/app/brandMetadata.ts",
  /(?:Memory|MVP)/iu,
  "Öffentliche Metadaten müssen Kontaktwissen und aktuelle Produktbegriffe verwenden.",
);
forbidIn(
  "src/app/opengraph-image.tsx",
  /['"]Memory['"]/iu,
  "Das Social-Preview darf Memory nicht als sichtbaren Produktbegriff verwenden.",
);
forbidIn(
  "src/app/impressum/page.tsx",
  /Keine aktiven Social-Media-Integrationen|autonome Kommunikation und Zahlungslogik/iu,
  "Das Impressum muss den gestuften Integrations- und aktiven Billing-Stand korrekt beschreiben.",
);
forbidIn(
  "src/app/impressum/page.tsx",
  /\[BITTE FINAL EINTRAGEN|TODO:/iu,
  "Öffentliche Rechtsseiten dürfen keine internen Platzhalter oder TODO-Kommentare enthalten.",
);
forbidIn(
  "src/app/avv/page.tsx",
  /redirect\s*\(/u,
  "Die AVV-Seite darf nicht mehr auf die Datenschutzerklärung weiterleiten.",
);
requireText(
  "src/app/impressum/page.tsx",
  "Integrationen und Abrechnung",
  "Das Impressum muss den gestuften Integrations- und Billing-Status erklären.",
);
requireText(
  "src/app/impressum/page.tsx",
  "Rechtlicher Abschlussstatus",
  "Das Impressum muss fehlende, noch nicht freigegebene Betreiberangaben transparent statt als Platzhalter ausweisen.",
);
requireText(
  "src/app/avv/page.tsx",
  "Diese Seite ersetzt keine unterschriebene AVV",
  "Die AVV-Seite muss ihre rechtliche Grenze klar benennen.",
);
requireText(
  "src/app/avv/page.tsx",
  "Aktuelle AVV per E-Mail anfordern",
  "Die AVV-Seite muss einen eindeutigen Anforderungsweg enthalten.",
);
requireText(
  "src/components/LegalTopHeader.tsx",
  '{ href: "/avv", label: "AVV", key: "avv" }',
  "Die Rechtsnavigation muss die AVV-Seite direkt erreichbar machen.",
);
requireText(
  "src/components/PlatformLogo.module.css",
  "object-fit: contain",
  "Kanal-Logos müssen in der gemeinsamen Komponente einheitlich und ohne Beschneidung dargestellt werden.",
);

warn(
  /TODO:\s*(OpenAI-Vertrag|DPA|Transfergrundlagen)/iu,
  "Rechtliche Abschlussprüfung ist noch dokumentiert offen.",
);

for (const warning of warnings) {
  console.warn(`TRUTH_WARNING: ${warning}`);
}

if (errors.length) {
  for (const error of errors) {
    console.error(`TRUTH_ERROR: ${error}`);
  }
  console.error(
    `Product truth verification failed with ${errors.length} error(s).`,
  );
  process.exit(1);
}

console.log(
  `Product truth verified across ${runtimeFiles.length} checked files (${warnings.length} warning(s)).`,
);
