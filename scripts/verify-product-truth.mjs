#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();

const runtimeFiles = [
  ".env.example",
  "src/config/plans.ts",
  "src/lib/plans.ts",
  "src/lib/stripeBilling.ts",
  "src/lib/referrals.ts",
  "src/lib/referralPolicy.mjs",
  "src/lib/aiUsagePolicy.mjs",
  "src/lib/demoTurnstilePolicy.mjs",
  "src/lib/demoProtection.ts",
  "src/lib/workspaceAiUsage.ts",
  "src/lib/workspaceNavigation.ts",
  "src/app/login/page.tsx",
  "src/app/landing-v2/page.tsx",
  "src/app/landing-v2/FaqAccordion.tsx",
  "src/app/brandMetadata.ts",
  "src/app/opengraph-image.tsx",
  "src/components/PlatformLogo.module.css",
  "src/components/FanMindFunctionIcon.tsx",
  "src/components/DemoTurnstile.tsx",
  "src/components/WorkspaceShell.tsx",
  "src/app/dashboard/dashboard.module.css",
  "src/components/LegalTopHeader.tsx",
  "src/app/register/RegisterClient.tsx",
  "src/app/settings/AccountSections.tsx",
  "src/app/settings/ai-usage/page.tsx",
  "src/app/fans/[id]/page.tsx",
  "src/app/agb/page.tsx",
  "src/app/zahlungsbedingungen/page.tsx",
  "src/app/datenschutz/page.tsx",
  "src/app/impressum/page.tsx",
  "src/app/avv/page.tsx",
  "tests/referral-policy.test.mjs",
  "tests/ai-usage-policy.test.mjs",
  "tests/demo-turnstile-policy.test.mjs",
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

requireText(
  ".env.example",
  "FANMIND_AI_STANDARD_SOFT_REQUEST_WARNING=",
  "Die optionale KI-Aktions-Hinweisgrenze muss dokumentiert sein.",
);
requireText(
  ".env.example",
  "FANMIND_AI_STANDARD_SOFT_TOKEN_WARNING=",
  "Die optionale KI-Token-Hinweisgrenze muss dokumentiert sein.",
);
requireText(
  "src/lib/aiUsagePolicy.mjs",
  'level: "unconfigured"',
  "Nicht konfigurierte KI-Hinweisgrenzen dürfen kein Kontingent vortäuschen.",
);
requireText(
  "tests/ai-usage-policy.test.mjs",
  "unconfigured thresholds never imply a quota or automatic block",
  "Die KI-Nutzungs-Policy muss den transparenten Zustand ohne Sperre testen.",
);
requireText(
  "src/app/settings/ai-usage/page.tsx",
  "weder ein vertragliches Kontingent noch eine automatische Sperre aktiviert",
  "Die Nutzeransicht muss offenlegen, wenn keine vertragliche KI-Grenze aktiv ist.",
);
requireText(
  "src/app/settings/ai-usage/page.tsx",
  "Hinweisgrenzen dienen ausschließlich der Orientierung",
  "Soft-Hinweisgrenzen dürfen nicht als harte Kontingentgrenze dargestellt werden.",
);
requireText(
  "src/app/settings/ai-usage/page.tsx",
  "KI Standard ist enthalten",
  "Die KI-Nutzungsseite muss die aktuelle Paketlogik korrekt einordnen.",
);
requireText(
  "src/lib/workspaceNavigation.ts",
  'href: "/settings/ai-usage"',
  "Die KI-Nutzungsseite muss im geschützten Kontobereich erreichbar sein.",
);

requireText(
  "src/components/FanMindFunctionIcon.tsx",
  "export type FanMindFunctionIconKey",
  "Funktionssymbole müssen über eine gemeinsame, typisierte Registry definiert sein.",
);
requireText(
  "src/components/WorkspaceShell.tsx",
  "icon?: FanMindFunctionIconKey",
  "Die Workspace-Navigation muss die gemeinsame Funktionssymbol-Registry verwenden.",
);
requireText(
  "src/app/landing-v2/page.tsx",
  "resolveFanMindFunctionIcon(feature.icon, feature.title)",
  "Die Landingpage muss für Kernfunktionen dieselben Symbole wie die Anwendung verwenden.",
);
requireText(
  "src/lib/workspaceNavigation.ts",
  'icon: "dashboard"',
  "Die zentrale Workspace-Navigation muss semantische Icon-Schlüssel setzen.",
);
requireText(
  "docs/SOURCE_OF_TRUTH.md",
  "Funktionssymbole werden über die gemeinsame `FanMindFunctionIcon`-Registry gerendert",
  "Die Source of Truth muss die gemeinsame Funktionssymbol-Regel dokumentieren.",
);

requireText(
  ".env.example",
  "FANMIND_REQUIRE_TURNSTILE_FOR_PUBLIC_DEMO=false",
  "Turnstile muss vor vollständiger Schlüsselkonfiguration optional und ausdrücklich deaktivierbar bleiben.",
);
requireText(
  "src/lib/demoTurnstilePolicy.mjs",
  'mode: "misconfigured"',
  "Unvollständige Turnstile-Konfiguration muss fail-closed behandelt werden.",
);
requireText(
  "src/lib/demoProtection.ts",
  'FANMIND_REQUIRE_TURNSTILE_FOR_PUBLIC_DEMO === "true"',
  "Der öffentliche Demo-Endpunkt muss den verpflichtenden Turnstile-Modus serverseitig auswerten.",
);
requireText(
  "src/components/DemoTurnstile.tsx",
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit",
  "Das Browser-Widget muss die offizielle Turnstile-API direkt und explizit laden.",
);
requireText(
  "src/components/DemoTurnstile.tsx",
  'action: "fanmind_demo_start"',
  "Widget und Server müssen dieselbe Turnstile-Action verwenden.",
);
requireText(
  "src/app/login/page.tsx",
  "turnstileToken: turnstileToken ?? undefined",
  "Die Loginseite muss den gelösten Token an den geschützten Demo-Endpunkt übergeben.",
);
requireText(
  "tests/demo-turnstile-policy.test.mjs",
  "Turnstile required mode fails closed before both keys are configured",
  "Der verpflichtende Turnstile-Modus muss automatisiert auf unvollständige Konfiguration getestet werden.",
);

requireText(
  "src/app/impressum/page.tsx",
  "Bernd Guggenberger, Einzelunternehmen – Geschäftsbezeichnung FanMind",
  "Das Impressum muss den bestätigten Einzelunternehmer als Vertragspartner nennen.",
);
requireText(
  "src/app/settings/AccountSections.tsx",
  'price: "+100 €/Monat"',
  "KI Plus muss mit dem freigegebenen Zusatzpreis ausgewiesen werden.",
);
requireText(
  "src/app/settings/AccountSections.tsx",
  'price: "+200 €/Monat"',
  "KI Ultra muss mit dem freigegebenen Zusatzpreis ausgewiesen werden.",
);
forbid(
  /Pilot \/ Setup starten|990 € einmalig · 1 Testmonat/iu,
  "Das entgeltliche Pilot-Paket wurde abgeschafft und darf öffentlich nicht erneut erscheinen.",
);
forbid(
  /FanMind e\.U\./u,
  "Der Zusatz e.U. darf ohne bestätigte Firmenbucheintragung nicht veröffentlicht werden.",
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
