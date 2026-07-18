#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();

const checkedFiles = [
  ".env.example",
  "src/config/aiTiers.mjs",
  "tests/ai-tier-policy.test.mjs",
  "README.md",
  "src/config/plans.ts",
  "src/lib/plans.ts",
  "src/lib/billing.ts",
  "src/lib/stripeBilling.ts",
  "src/lib/referrals.ts",
  "src/lib/referralPolicy.mjs",
  "src/lib/aiUsagePolicy.mjs",
  "src/lib/demoTurnstilePolicy.mjs",
  "src/lib/demoProtection.ts",
  "src/lib/workspaceAiUsage.ts",
  "src/lib/workspaceNavigation.ts",
  "src/lib/fanmindCopy.ts",
  "src/app/register/page.tsx",
  "src/app/register/RegisterClient.tsx",
  "src/app/login/page.tsx",
  "src/app/landing-v2/page.tsx",
  "src/app/landing-v2/FaqAccordion.tsx",
  "src/app/brandMetadata.ts",
  "src/app/opengraph-image.tsx",
  "src/app/billing/start/page.tsx",
  "src/components/PlatformLogo.module.css",
  "src/components/FanMindFunctionIcon.tsx",
  "src/components/DemoTurnstile.tsx",
  "src/components/WorkspaceShell.tsx",
  "src/components/LegalTopHeader.tsx",
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

const documentationFiles = new Set([
  "README.md",
  "docs/SOURCE_OF_TRUTH.md",
]);
const contents = new Map();
const errors = [];
const warnings = [];

for (const file of checkedFiles) {
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

function forbidRuntime(pattern, explanation) {
  for (const [file, text] of contents) {
    if (documentationFiles.has(file)) continue;
    if (pattern.test(text)) errors.push(`${file}: ${explanation}`);
  }
}

function forbidIn(file, pattern, explanation) {
  if (pattern.test(content(file))) errors.push(`${file}: ${explanation}`);
}

function warnIn(file, pattern, explanation) {
  if (pattern.test(content(file))) warnings.push(`${file}: ${explanation}`);
}

// Alte oder widersprüchliche öffentliche Wahrheit.
forbidRuntime(
  /299\s*€\s*\/\s*Monat/iu,
  "Veralteter Starter-Preis 299 €/Monat gefunden.",
);
forbidRuntime(
  /499\s*€\s*\/\s*Monat/iu,
  "Veralteter Growth-Preis 499 €/Monat gefunden.",
);
forbidRuntime(
  /Agency\s+ab\s+990\s*€\s*\/\s*Monat/iu,
  "Veralteter Agency-Preis gefunden.",
);
forbidRuntime(
  /kontakt@fanmind\.de/iu,
  "Veraltete .de-Kontaktadresse gefunden.",
);
forbidRuntime(
  /(?:Fanmind|hello)@fanmind\.ch/iu,
  "Uneinheitliche Kontaktadresse gefunden; nutze kontakt@fanmind.ch.",
);
forbidRuntime(
  /Ehrliche Roadmap/iu,
  "Öffentliche Roadmap darf nicht als Ehrliche Roadmap bezeichnet werden.",
);
forbidRuntime(
  /Unified Inbox Timeline/iu,
  "Nicht aktive Inbox-Synchronisierung darf nicht als Unified Inbox bezeichnet werden.",
);
forbidRuntime(
  /FanMind e\.U\./u,
  "Der Zusatz e.U. darf ohne bestätigte Firmenbucheintragung nicht veröffentlicht werden.",
);

// Starter-Preise und zentrale Billing-Werte.
requireText(
  "src/config/plans.ts",
  "312 €/Monat",
  "Die zentrale Paketkonfiguration muss die Starter-Grundgebühr enthalten.",
);
requireText(
  "src/lib/plans.ts",
  "monthlyFeeCents: 31200",
  "Die Commercial-Terms-Logik muss 31.200 Cent Monatsgebühr verwenden.",
);
requireText(
  "src/lib/stripeBilling.ts",
  "monthlyFeeCents: 31200",
  "Stripe-Billing muss mit 31.200 Cent Monatsgebühr arbeiten.",
);
requireText(
  "src/app/landing-v2/page.tsx",
  'name: "Starter Flex"',
  "Die Landingpage muss Starter Flex aktiv zeigen.",
);
requireText(
  "src/app/landing-v2/page.tsx",
  'name: "Starter 12 Monate"',
  "Die Landingpage muss Starter 12 Monate aktiv zeigen.",
);
requireText(
  "src/app/landing-v2/page.tsx",
  "990 € Setup + 312 €/Monat",
  "Starter Flex muss die freigegebene Preislogik verwenden.",
);
requireText(
  "src/app/landing-v2/page.tsx",
  "12 Monate Mindestlaufzeit · danach monatliche Verlängerung",
  "Starter 12 Monate muss die Verlängerungslogik offenlegen.",
);
requireText(
  "src/app/agb/page.tsx",
  "Starter Flex:",
  "Die AGB müssen Starter Flex nennen.",
);
requireText(
  "src/app/agb/page.tsx",
  "Starter 12 Monate:",
  "Die AGB müssen Starter 12 Monate nennen.",
);
requireText(
  "src/app/zahlungsbedingungen/page.tsx",
  'getCommercialTerms("starter_paid_setup")',
  "Die Zahlungsbedingungen müssen zentrale Starter-Werte laden.",
);
requireText(
  "src/app/zahlungsbedingungen/page.tsx",
  "starterFlexTerms.monthlyFeeCents",
  "Die Zahlungsbedingungen müssen die zentrale Monatsgebühr rendern.",
);

// Entgeltliches Pilot-Paket ist öffentlich eingestellt.
forbidIn(
  "src/app/landing-v2/page.tsx",
  /name:\s*["']Pilot \/ Setup["']|990 € einmalig\s*·\s*zzgl\. USt\./iu,
  "Die Landingpage darf das eingestellte Pilot-/Setup-Paket nicht mehr anbieten.",
);
forbidIn(
  "src/app/settings/AccountSections.tsx",
  /name:\s*["']Pilot \/ Setup["']|key:\s*["']pilot_only["']/iu,
  "Die Paketansicht darf das eingestellte Pilot-Paket nicht mehr anbieten.",
);
forbidIn(
  "src/app/register/RegisterClient.tsx",
  /title:\s*["']Pilot \/ Setup starten["']|price:\s*["']990 € einmalig · 1 Testmonat["']/iu,
  "Die öffentliche Registrierung darf keine Pilot-Paketkarte mehr enthalten.",
);
forbidIn(
  "src/app/zahlungsbedingungen/page.tsx",
  /title:\s*["']Pilot \/ Setup["']|Pilot \/ Setup kostet/iu,
  "Die Zahlungsbedingungen dürfen das eingestellte Pilot-Paket nicht mehr anbieten.",
);
forbidIn(
  "src/app/agb/page.tsx",
  /<strong>Pilot \/ Setup:<\/strong>/iu,
  "Die AGB dürfen das eingestellte Pilot-Paket nicht mehr als Preisoption führen.",
);
requireText(
  "src/app/register/page.tsx",
  "enablePublicDailyTestPlan={false}",
  "Das 1-€/Tag-Testabo muss aus der öffentlichen Registrierung entfernt bleiben.",
);
requireText(
  "src/lib/stripeBilling.ts",
  'if (planId === "pilot" && commercialOption === "pilot_only") return null;',
  "Der Stripe-Adapter muss Legacy-Pilot-Checkout blockieren.",
);
requireText(
  "src/lib/billing.ts",
  'if (option === "pilot_only") return false;',
  "Die UI muss Legacy-Pilot-Checkout blockieren.",
);

// KI-Stufen und Referral-Grenzen.
requireText(
  "src/config/aiTiers.mjs",
  'monthlyAddOnCents: 10000',
  "Die zentrale KI-Tier-Policy muss KI Plus mit 100 €/Monat führen.",
);
requireText(
  "src/config/aiTiers.mjs",
  'monthlyAddOnCents: 20000',
  "Die zentrale KI-Tier-Policy muss KI Ultra mit 200 €/Monat führen.",
);
requireText(
  "src/config/aiTiers.mjs",
  'includedInBase: true',
  "KI Standard muss in der zentralen Policy im Basispaket enthalten bleiben.",
);
requireText(
  "src/config/aiTiers.mjs",
  'addOnReferralDiscountEligible: false',
  "KI-Add-ons dürfen nicht referral-rabattfähig werden.",
);
requireText(
  "src/config/aiTiers.mjs",
  'automaticSendingEnabled: false',
  "Keine KI-Stufe darf automatische Sendung aktivieren.",
);
requireText(
  "src/app/settings/AccountSections.tsx",
  'from "@/config/aiTiers.mjs"',
  "Die Paketansicht muss die zentrale KI-Tier-Policy verwenden.",
);
requireText(
  "tests/ai-tier-policy.test.mjs",
  "Plus and Ultra cannot be automatically booked before models, limits and billing are approved",
  "Die nicht freigegebene Auto-Buchung von Plus/Ultra muss automatisiert getestet werden.",
);
requireText(
  "docs/SOURCE_OF_TRUTH.md",
  "KI Plus** kostet zusätzlich 100 €/Monat",
  "Die Source of Truth muss den KI-Plus-Preis dokumentieren.",
);
requireText(
  "docs/SOURCE_OF_TRUTH.md",
  "KI Ultra** kostet zusätzlich 200 €/Monat",
  "Die Source of Truth muss den KI-Ultra-Preis dokumentieren.",
);
requireText(
  "src/lib/referralPolicy.mjs",
  "REFERRAL_DISCOUNT_STEP_PERCENT = 5",
  "Referral muss 5 Prozent je aktivem Workspace verwenden.",
);
requireText(
  "src/lib/referralPolicy.mjs",
  "REFERRAL_MAX_ACTIVE_COUNT = 20",
  "Referral muss maximal 20 aktive Empfehlungen berücksichtigen.",
);
requireText(
  "src/lib/referralPolicy.mjs",
  "REFERRAL_GROWTH_WINDOW_CAP = 2000",
  "Referral muss beim 2.000er-Cap schließen.",
);
requireText(
  "src/lib/referralPolicy.mjs",
  'billingStatus !== "active"',
  "Nur aktiv zahlende Workspaces dürfen Referral nutzen.",
);
requireText(
  "src/lib/referralPolicy.mjs",
  "monthlyFeeCentsAfterDiscount",
  "Referral muss einen nicht negativen Monatsbetrag liefern.",
);
requireText(
  "tests/referral-policy.test.mjs",
  "growth window closes at 2000 active paid workspaces",
  "Der 2.000er-Cap muss automatisiert getestet werden.",
);

// Betreiber, B2B und Steuerdarstellung.
requireText(
  "src/app/impressum/page.tsx",
  "Bernd Guggenberger, Einzelunternehmen – Geschäftsbezeichnung FanMind",
  "Das Impressum muss den bestätigten Einzelunternehmer nennen.",
);
requireText(
  "src/app/impressum/page.tsx",
  "Bezirkshauptmannschaft Mödling",
  "Das Impressum muss die zuständige Gewerbebehörde nennen.",
);
requireText(
  "src/app/impressum/page.tsx",
  "+43 676 5367236",
  "Das Impressum muss die bestätigte Telefonnummer nennen.",
);
requireText(
  "src/app/impressum/page.tsx",
  "kontakt@fanmind.ch",
  "Das Impressum muss die einheitliche Kontaktadresse verwenden.",
);
requireText(
  "src/app/agb/page.tsx",
  "Ein Vertragsabschluss durch Verbraucher ist nicht vorgesehen",
  "Die AGB müssen den B2B-Geltungsbereich klarstellen.",
);
requireText(
  "src/app/agb/page.tsx",
  "FanMind garantiert keine fehlerfreien KI-Antworten",
  "Die AGB müssen die KI-Haftungsgrenze klar nennen.",
);
forbidIn(
  "src/app/landing-v2/page.tsx",
  /zzgl\. USt\./iu,
  "Die Landingpage darf aktuell keine zusätzliche Umsatzsteuer behaupten.",
);
forbidIn(
  "src/app/billing/start/page.tsx",
  /zzgl\. USt\./iu,
  "Der Checkout darf aktuell keine zusätzliche Umsatzsteuer behaupten.",
);
forbidIn(
  "src/app/agb/page.tsx",
  /zzgl\. USt\.|zuzüglich gesetzlicher Umsatzsteuer/iu,
  "Die AGB müssen die aktuelle steuerliche Darstellung verwenden.",
);
forbidIn(
  "src/app/zahlungsbedingungen/page.tsx",
  /zzgl\. USt\.|Preise zzgl\. USt\./iu,
  "Die Zahlungsbedingungen müssen die aktuelle steuerliche Darstellung verwenden.",
);

// README und Source of Truth müssen synchron sein.
requireText(
  "README.md",
  "Starter Flex: `990 € einmalige Einrichtung + 312 €/Monat`",
  "README muss Starter Flex korrekt dokumentieren.",
);
requireText(
  "README.md",
  "KI Plus: zusätzlich `100 €/Monat`",
  "README muss den KI-Plus-Preis dokumentieren.",
);
requireText(
  "README.md",
  "KI Ultra: zusätzlich `200 €/Monat`",
  "README muss den KI-Ultra-Preis dokumentieren.",
);
requireText(
  "README.md",
  "Legacy-Pilot-Checkout gesperrt",
  "README muss die Einstellung des entgeltlichen Pilot-Checkouts dokumentieren.",
);
requireText(
  "docs/SOURCE_OF_TRUTH.md",
  "Öffentliche Demo | aktiv | kostenloser temporärer Demo-Zugang; kein entgeltliches Paket",
  "Die Source of Truth muss die kostenlose Demo statt eines Pilot-Pakets dokumentieren.",
);

// KI-Nutzungsanzeige.
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
  "Die KI-Policy muss den Zustand ohne Sperre testen.",
);
requireText(
  "src/app/settings/ai-usage/page.tsx",
  "weder ein vertragliches Kontingent noch eine automatische Sperre aktiviert",
  "Die Nutzeransicht muss den Zustand ohne Vertragsgrenze offenlegen.",
);
requireText(
  "src/lib/workspaceNavigation.ts",
  'href: "/settings/ai-usage"',
  "KI-Nutzung muss im geschützten Kontobereich erreichbar sein.",
);

// Gemeinsame Funktionssymbole und Kanal-Logos.
requireText(
  "src/components/FanMindFunctionIcon.tsx",
  "export type FanMindFunctionIconKey",
  "Funktionssymbole müssen über eine typisierte Registry definiert sein.",
);
requireText(
  "src/components/WorkspaceShell.tsx",
  "icon?: FanMindFunctionIconKey",
  "Die Workspace-Navigation muss die gemeinsame Symbol-Registry verwenden.",
);
requireText(
  "src/app/landing-v2/page.tsx",
  "resolveFanMindFunctionIcon(feature.icon, feature.title)",
  "Die Landingpage muss die gemeinsame Symbol-Registry verwenden.",
);
requireText(
  "src/components/PlatformLogo.module.css",
  "object-fit: contain",
  "Kanal-Logos müssen einheitlich und unbeschnitten dargestellt werden.",
);

// Turnstile und Demo-Schutz.
requireText(
  ".env.example",
  "FANMIND_REQUIRE_TURNSTILE_FOR_PUBLIC_DEMO=false",
  "Turnstile muss ausdrücklich konfigurierbar bleiben.",
);
requireText(
  "src/lib/demoTurnstilePolicy.mjs",
  'mode: "misconfigured"',
  "Unvollständige Turnstile-Konfiguration muss fail-closed sein.",
);
requireText(
  "src/lib/demoProtection.ts",
  'FANMIND_REQUIRE_TURNSTILE_FOR_PUBLIC_DEMO === "true"',
  "Der Demo-Endpunkt muss den verpflichtenden Turnstile-Modus auswerten.",
);
requireText(
  "src/components/DemoTurnstile.tsx",
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit",
  "Das Browser-Widget muss die offizielle Turnstile-API laden.",
);
requireText(
  "src/components/DemoTurnstile.tsx",
  'action: "fanmind_demo_start"',
  "Widget und Server müssen dieselbe Turnstile-Action verwenden.",
);
requireText(
  "src/app/login/page.tsx",
  "turnstileToken: turnstileToken ?? undefined",
  "Die Loginseite muss den Turnstile-Token übergeben.",
);
requireText(
  "tests/demo-turnstile-policy.test.mjs",
  "Turnstile required mode fails closed before both keys are configured",
  "Der Pflichtmodus muss automatisiert getestet werden.",
);

// Öffentliche Terminologie und Legal-Seiten.
forbidIn(
  "src/app/landing-v2/page.tsx",
  /(?:Fan-Analyse-Report|Memory|\bMVP\b|DSGVO-konform)/iu,
  "Die Landingpage enthält veraltete oder missverständliche Produktbegriffe.",
);
forbidIn(
  "src/lib/fanmindCopy.ts",
  /(?:Fan-Analyse-Report|Fan analysis report|Memory|DSGVO-konform)/iu,
  "Öffentliche Übersetzungen enthalten veraltete oder missverständliche Produktbegriffe.",
);
forbidIn(
  "src/app/landing-v2/FaqAccordion.tsx",
  /DSGVO-konform/iu,
  "Die FAQ darf keine pauschale Datenschutzgarantie formulieren.",
);
forbidIn(
  "src/app/brandMetadata.ts",
  /(?:Memory|MVP)/iu,
  "Öffentliche Metadaten müssen aktuelle Begriffe verwenden.",
);
forbidIn(
  "src/app/opengraph-image.tsx",
  /["']Memory["']/iu,
  "Das Social-Preview darf Memory nicht als sichtbaren Produktbegriff verwenden.",
);
forbidIn(
  "src/app/impressum/page.tsx",
  /Ein Projekt von Gerhard Novy|Beteiligungsverhältnisse|50&nbsp;%|\[BITTE FINAL EINTRAGEN|TODO:/iu,
  "Das Impressum enthält alte Betreiberangaben oder interne Platzhalter.",
);
forbidIn(
  "src/app/avv/page.tsx",
  /redirect\s*\(/u,
  "Die AVV-Seite darf nicht zur Datenschutzerklärung umleiten.",
);
requireText(
  "src/app/avv/page.tsx",
  "Diese Seite ersetzt keine unterschriebene AVV",
  "Die AVV-Seite muss ihre rechtliche Grenze nennen.",
);
requireText(
  "src/app/avv/page.tsx",
  "Aktuelle AVV per E-Mail anfordern",
  "Die AVV-Seite muss einen Anforderungsweg enthalten.",
);
requireText(
  "src/components/LegalTopHeader.tsx",
  '{ href: "/avv", label: "AVV", key: "avv" }',
  "Die Rechtsnavigation muss die AVV direkt verlinken.",
);

warnIn(
  "src/app/datenschutz/page.tsx",
  /TODO:\s*(OpenAI-Vertrag|DPA|Transfergrundlagen)/iu,
  "Rechtliche Abschlussprüfung ist noch dokumentiert offen.",
);

for (const warning of warnings) {
  console.warn(`TRUTH_WARNING: ${warning}`);
}

if (errors.length) {
  for (const error of errors) console.error(`TRUTH_ERROR: ${error}`);
  console.error(
    `Product truth verification failed with ${errors.length} error(s).`,
  );
  process.exit(1);
}

console.log(
  `Product truth verified across ${checkedFiles.length} checked files (${warnings.length} warning(s)).`,
);
