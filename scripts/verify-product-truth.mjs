#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();

const checkedFiles = [
  ".gitignore",
  ".env.example",
  ".github/workflows/deploy-fanmind.yml",
  ".github/workflows/ai-tier-staging-migration.yml",
  ".github/workflows/ai-tier-staging-acceptance.yml",
  ".github/workflows/meta-content-staging-migration.yml",
  ".github/workflows/mobile-release-resource-readiness.yml",
  ".github/workflows/mobile-signed-internal-build.yml",
  ".github/workflows/ci-mobile.yml",
  "package.json",
  "apps/mobile/package.json",
  "src/config/aiTiers.mjs",
  "src/config/commercialModel.mjs",
  "src/config/aiTierRecommendation.mjs",
  "scripts/operations/verify-ai-tier-readiness.mjs",
  "scripts/operations/verify-ai-tier-recommendation.mjs",
  "scripts/operations/ai-reply-quality-eval.mjs",
  "tests/ai-reply-quality-eval.test.mjs",
  "scripts/operations/run-database-restore-drill.sh",
  "scripts/operations/restore-database-postcheck-receipt.mjs",
  "scripts/operations/verify-restore-drill-evidence.mjs",
  "tests/restore-drill-evidence.test.mjs",
  "docs/operations/RESTORE_DRILL.md",
  "scripts/operations/ai-tier-entitlement-migration-runner.mjs",
  "scripts/operations/ai-tier-staging-acceptance.mjs",
  "scripts/operations/meta-content-migration-runner.mjs",
  "src/lib/metaContentStagingMigrationPolicy.mjs",
  "scripts/operations/mobile-release-resource-readiness.mjs",
  "scripts/operations/mobile-signed-build-completion.mjs",
  "apps/mobile/scripts/check-store-readiness.mjs",
  "tests/mobile-native-release-policy.test.mjs",
  "tests/mobile-store-privacy-policy.test.mjs",
  "scripts/final-go-live-preflight.mjs",
  "scripts/smoke-public-routes.mjs",
  "src/lib/workspaceAiTierStorage.mjs",
  "src/lib/workspaceAiTierEntitlements.ts",
  "src/lib/aiTierStripeLifecycle.mjs",
  "src/lib/aiTierStagingAcceptancePolicy.mjs",
  "supabase/migrations/20260727090000_workspace_ai_tier_entitlements.sql",
  "src/lib/aiPromptPolicy.mjs",
  "src/lib/workspaceAiPrompts.ts",
  "src/app/api/ai/prompt-settings/route.ts",
  "src/app/api/ai/reply-suggestions/route.ts",
  "src/app/settings/ai-usage/AiPromptSettings.tsx",
  "tests/ai-tier-policy.test.mjs",
  "tests/ai-tier-recommendation.test.mjs",
  "tests/ai-tier-entitlement-storage.test.mjs",
  "tests/ai-tier-entitlement-migration-policy.test.mjs",
  "tests/ai-tier-stripe-lifecycle.test.mjs",
  "tests/ai-tier-staging-acceptance.test.mjs",
  "tests/meta-content-staging-migration.test.mjs",
  "tests/ai-prompt-policy.test.mjs",
  "tests/ai-prompt-integration-policy.test.mjs",
  "README.md",
  "AGENTS.md",
  "apps/mobile/README.md",
  "docs/mobile/ARCHITECTURE.md",
  "docs/mobile/BETA_RELEASE.md",
  "docs/mobile/STORE_LISTING.md",
  "docs/operations/P0_COMPLETION_TRACKER.md",
  "src/config/plans.ts",
  "src/lib/plans.ts",
  "src/lib/billing.ts",
  "src/lib/stripeBilling.ts",
  "src/lib/referrals.ts",
  "src/lib/referralPolicy.mjs",
  "src/lib/aiUsagePolicy.mjs",
  "src/lib/aiUsage.ts",
  "src/lib/aiUsageProviderMetrics.mjs",
  "src/lib/aiUsageCostMetrics.mjs",
  "src/lib/aiUsageDashboardMetrics.mjs",
  "src/lib/adminAiUsage.ts",
  "src/app/admin/ai-usage/page.tsx",
  "src/app/admin/billing/adminBilling.module.css",
  "src/lib/demoTurnstilePolicy.mjs",
  "src/lib/demoProtection.ts",
  "src/lib/workspaceAiUsage.ts",
  "src/lib/workspaceNavigation.ts",
  "src/lib/fanmindCopy.ts",
  "src/app/register/page.tsx",
  "src/app/fans/[id]/analysisActions.ts",
  "src/lib/runtimeProductSettings.ts",
  "src/app/admin/settings/page.tsx",
  "src/app/api/admin/settings/daily-test-plan/route.ts",
  "src/app/register/RegisterClient.tsx",
  "src/components/landing/FooterInquiryForm.tsx",
  "src/components/marketing/MarketingConsentManager.tsx",
  "src/lib/metaPixel.ts",
  "src/lib/metaPixelPolicy.mjs",
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
  "src/app/settings/AccountTabs.tsx",
  "src/app/settings/ai-usage/page.tsx",
  "src/app/fans/[id]/page.tsx",
  "src/app/agb/page.tsx",
  "src/app/zahlungsbedingungen/page.tsx",
  "src/app/datenschutz/page.tsx",
  "src/app/impressum/page.tsx",
  "src/app/avv/page.tsx",
  "src/app/referral-bedingungen/page.tsx",
  "src/app/settings/referral/page.tsx",
  "tests/referral-policy.test.mjs",
  "tests/commercial-model.test.mjs",
  "tests/ai-usage-policy.test.mjs",
  "tests/ai-usage-cost-metrics.test.mjs",
  "tests/ai-usage-dashboard-metrics.test.mjs",
  "tests/demo-turnstile-policy.test.mjs",
  "docs/SOURCE_OF_TRUTH.md",
  "docs/LEGAL_COMPLETION_STATUS.md",
  "docs/analytics/META_PIXEL.md",
  "docs/legal/AVV_WORKING_DRAFT.md",
  "docs/legal/RETENTION_REGISTER.md",
  "docs/legal/EXTERNAL_APPROVAL_REGISTER.md",
  "docs/legal/external-approval-evidence.json",
  "scripts/verify-legal-external-evidence.mjs",
  "scripts/legal/external-evidence-handoff.mjs",
  "tests/legal-external-evidence-handoff.test.mjs",
  "docs/database/fanmind_current_schema.md",
  "docs/SECURITY_RLS_SECRETS_CHECK.md",
  "docs/operations/AI_TIER_READINESS.md",
  "docs/operations/AI_TIER_DECISION_PROPOSAL.md",
  "docs/operations/AI_TIER_COST_AND_QUOTA_RECOMMENDATION.md",
  "docs/operations/AI_REPLY_QUALITY_EVAL.md",
  "docs/operations/AI_TIER_ENTITLEMENT_STORAGE.md",
  "docs/operations/META_CONTENT_STAGING_MIGRATION.md",
];

const documentationFiles = new Set([
  "README.md",
  "docs/SOURCE_OF_TRUTH.md",
]);
const contents = new Map();
const errors = [];

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

// Restore evidence must bind schema and RLS success to the machine postcheck.
requireText(
  "package.json",
  '"restore:database:postcheck": "node scripts/operations/restore-database-postcheck-receipt.mjs"',
  "Der Restore-Postcheck muss als fester Operations-Befehl registriert sein.",
);
for (const table of [
  "contacts",
  "followups",
  "memories",
  "workspace_members",
  "workspaces",
]) {
  requireText(
    "scripts/operations/restore-database-postcheck-receipt.mjs",
    `"${table}"`,
    `Der Datenbank-Postcheck muss die Kerntabelle ${table} fest prüfen.`,
  );
}
requireText(
  "scripts/operations/run-database-restore-drill.sh",
  "fanmind_required_restore_tables",
  "Der Restore-Runner muss den festen Post-Restore-Katalogcheck ausführen.",
);
requireText(
  "scripts/operations/run-database-restore-drill.sh",
  "FANMIND_RESTORE_DATABASE_POSTCHECK_RECEIPT_PATH",
  "Der Restore-Runner muss einen getrennten privaten Postcheck-Beleg verlangen.",
);
requireText(
  "scripts/operations/verify-restore-drill-evidence.mjs",
  "evidence.schemaVersion !== 5",
  "Der Restore-Evidence-Validator muss ausschließlich Schema 5 akzeptieren.",
);
requireText(
  "scripts/operations/verify-restore-drill-evidence.mjs",
  "databasePostcheckReceiptSha256",
  "Der Restore-Evidence-Validator muss den Postcheck-Beleg per SHA-256 binden.",
);
requireText(
  "tests/restore-drill-evidence.test.mjs",
  "database postcheck hash, identity, counts and timestamps are bound",
  "Die Postcheck-Bindung muss automatisiert regressionsgeprüft sein.",
);
requireText(
  "docs/operations/RESTORE_DRILL.md",
  "`coreSchemaChecks: \"passed\"` or manual",
  "Das Runbook muss manuelle Kernschema-Freigaben ausdrücklich ablehnen.",
);
requireText(
  "docs/operations/RESTORE_DRILL.md",
  "manual `rlsVerification: \"passed\"`",
  "Das Runbook muss manuelle RLS-Freigaben ausdrücklich ablehnen.",
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
  "getPublicDailyTestPlanEnabled",
  "Die Registrierung muss den serverseitigen, admin-gesteuerten 1-€/Tag-Schalter auswerten.",
);
requireText(
  "src/lib/runtimeProductSettings.ts",
  "publicDailyTestPlanEnabled",
  "Die Laufzeitkonfiguration muss den 1-€/Tag-Schalter persistent speichern.",
);
requireText(
  "src/app/api/admin/settings/daily-test-plan/route.ts",
  "requirePlatformAdmin",
  "Nur Plattform-Admins dürfen den 1-€/Tag-Schalter ändern.",
);
requireText(
  "src/app/admin/settings/page.tsx",
  "1-€/Tag-Beta-Abo",
  "Der Adminbereich muss den 1-€/Tag-Schalter sichtbar anbieten.",
);
requireText(
  ".env.example",
  "FANMIND_ENABLE_PUBLIC_DAILY_TEST_PLAN=false",
  "Die Beispielkonfiguration muss das 1-€/Tag-Beta-Testabo standardmäßig geschlossen halten.",
);
requireText(
  ".github/workflows/deploy-fanmind.yml",
  "publicDailyTestPlanEnabled",
  "Der Production-Deploy muss den initial aktiven Beta-Zustand einmalig und ohne Überschreiben späterer Admin-Entscheidungen anlegen.",
);
requireText(
  "README.md",
  "zum Verkaufsstart nach Abschluss der acht Abschlussblöcke",
  "README muss den verbindlichen Abschaltzeitpunkt des 1-€/Tag-Beta-Testabos dokumentieren.",
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
  "src/config/commercialModel.mjs",
  "CORE_MONTHLY_FEE_CENTS = 31_200",
  "Das Umsatzmodell muss die Core-Grundgebühr zentral führen.",
);
requireText(
  "src/config/commercialModel.mjs",
  "CORE_INCLUDED_CONNECTIONS = 10",
  "Das Umsatzmodell muss zehn Connections im Core enthalten.",
);
requireText(
  "src/config/commercialModel.mjs",
  "CONNECTION_PACK_MONTHLY_FEE_CENTS = 4_900",
  "Das Umsatzmodell muss weitere fünf Connections mit 49 Euro bepreisen.",
);
requireText(
  "src/config/commercialModel.mjs",
  "Referral discount and agency volume discount cannot be combined",
  "Referral und Agency-Mengenrabatt müssen technisch ausgeschlossen sein.",
);
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
  "scripts/operations/verify-ai-tier-readiness.mjs",
  "AI_TIER_READINESS=PASS",
  "Die KI-Stufen müssen eine redigierte gemeinsame Readiness-Prüfung besitzen.",
);
requireText(
  "src/lib/adminAiUsage.ts",
  'Prefer: "count=exact"',
  "Die Admin-KI-Auswertung muss Kontakte/Fans paginationsunabhängig exakt zählen.",
);
requireText(
  "src/app/admin/ai-usage/page.tsx",
  "Kosten/Fan",
  "Die Admin-KI-Auswertung muss geschätzte Kosten relativ zur Fan-Basis anzeigen.",
);
requireText(
  "tests/ai-usage-cost-metrics.test.mjs",
  "without inventing zero-contact values",
  "Fehlende oder leere Fan-Basen dürfen keine scheinpräzisen Kostenverhältnisse erzeugen.",
);
requireText(
  "src/lib/aiUsageDashboardMetrics.mjs",
  "ADMIN_AI_USAGE_DAY_RANGES",
  "Die Admin-KI-Auswertung muss feste, validierte Schnellzeiträume verwenden.",
);
requireText(
  "src/lib/adminAiUsage.ts",
  "aggregateAiUsageByModel",
  "Die Admin-KI-Auswertung muss Usage je Modell serverseitig aggregieren.",
);
requireText(
  "src/app/admin/ai-usage/page.tsx",
  "Verbrauch pro Modell",
  "Die Admin-KI-Auswertung muss die Modellverteilung sichtbar machen.",
);
requireText(
  "tests/ai-usage-dashboard-metrics.test.mjs",
  "accepts only the documented quick ranges",
  "Schnellzeiträume und Modellverteilung müssen automatisiert geprüft werden.",
);
requireText(
  ".env.example",
  "FANMIND_AI_ADMIN_MONTHLY_BUDGET_CENTS=",
  "Das optionale interne KI-Monatsbudget muss serverseitig dokumentiert sein.",
);
requireText(
  ".env.example",
  "FANMIND_AI_ADMIN_SPIKE_RATIO=2",
  "Der beobachtende KI-Spike-Vergleich muss nachvollziehbar konfigurierbar sein.",
);
requireText(
  "src/lib/adminAiUsage.ts",
  "MAX_ADMIN_USAGE_EVENTS = 10_000",
  "Admin-KI-Zeiträume müssen paginiert und mit sichtbarer Obergrenze geladen werden.",
);
requireText(
  "src/app/admin/ai-usage/page.tsx",
  "Beobachtung ohne Sperre",
  "Budget- und Spike-Hinweise dürfen keine automatische Sperre behaupten.",
);
requireText(
  "tests/ai-usage-dashboard-metrics.test.mjs",
  "remain observational and fail honest when unconfigured",
  "Nicht konfigurierte oder begrenzte Budgetdaten müssen ehrlich getestet werden.",
);
requireText(
  "src/lib/aiUsageDashboardMetrics.mjs",
  "aggregateAiUsageTokenDistributionByFeature",
  "Die Admin-KI-Auswertung muss Tokenverteilungen je Feature reproduzierbar aggregieren.",
);
requireText(
  "src/app/admin/ai-usage/page.tsx",
  "Token-Verteilung pro Feature",
  "Die Admin-KI-Auswertung muss P50, P90 und P95 als Entscheidungsgrundlage sichtbar machen.",
);
requireText(
  "src/app/admin/billing/adminBilling.module.css",
  ".tokenDistributionTable",
  "Die Tokenverteilung muss auf breiten und mobilen Ansichten lesbar bleiben.",
);
requireText(
  "tests/ai-usage-dashboard-metrics.test.mjs",
  "feature token distributions expose deterministic nearest-rank P50, P90 and P95",
  "Tokenperzentile und ihre Stichprobengrenzen müssen automatisiert geprüft werden.",
);
requireText(
  "docs/operations/AI_TIER_DECISION_PROPOSAL.md",
  "füllt keinen `UNENTSCHIEDEN`-Wert automatisch aus",
  "Die Tokenverteilung darf keine fachliche KI-Stufen-Freigabe vortäuschen.",
);
requireText(
  "src/lib/aiUsageProviderMetrics.mjs",
  "totalTokens !== inputTokens + outputTokens",
  "Provider-Tokenwerte müssen vollständig und in sich konsistent validiert werden.",
);
requireText(
  "src/lib/aiUsage.ts",
  "normalizeOpenAiResponseUsage(input.providerUsage)",
  "Das Usage-Log muss vollständige Provider-Tokenwerte vor der Schätzung bevorzugen.",
);
requireText(
  "src/app/api/ai/reply-suggestions/route.ts",
  "providerUsage: responseBody?.usage",
  "Antwortvorschläge müssen die OpenAI-Responses-Usage an das Usage-Log weiterreichen.",
);
requireText(
  "src/app/fans/[id]/analysisActions.ts",
  "providerUsage: responseBody?.usage",
  "Die Kommunikationsanalyse muss die OpenAI-Responses-Usage an das Usage-Log weiterreichen.",
);
requireText(
  "tests/ai-usage-policy.test.mjs",
  "productive Responses paths forward provider usage and retain the estimate fallback",
  "Provider-Tokenübernahme und Schätz-Fallback müssen automatisiert geprüft werden.",
);
requireText(
  "src/config/aiTierRecommendation.mjs",
  'AI_TIER_RECOMMENDATION_STATUS = "advisory"',
  "Die KI-Stufen-Arbeitsempfehlung muss ausdrücklich ohne Aktivierungswirkung bleiben.",
);
requireText(
  "scripts/operations/verify-ai-tier-recommendation.mjs",
  "AI_TIER_RECOMMENDATION=PASS activation=none",
  "Die KI-Stufen-Arbeitsempfehlung muss einen reproduzierbaren Offline-Check besitzen.",
);
requireText(
  "tests/ai-tier-recommendation.test.mjs",
  "AI tier recommendation is advisory and cannot activate paid tiers",
  "Die Trennung zwischen Arbeitsempfehlung und aktiver Paid-Tier-Policy muss automatisiert geprüft werden.",
);
requireText(
  "scripts/operations/ai-reply-quality-eval.mjs",
  "AI_REPLY_QUALITY_EVAL_ACTIVATION=none",
  "Der Antwortqualitäts-Eval darf keine KI-Stufe aktivieren.",
);
requireText(
  ".gitignore",
  "/docs/operations/private-ai-evals/",
  "Private KI-Eval-Ergebnisse müssen vollständig aus Git ausgeschlossen bleiben.",
);
requireText(
  "package.json",
  "ai:reply-quality:eval",
  "Der private Antwortqualitäts-Eval muss als fester Offline-Befehl verfügbar sein.",
);
requireText(
  "tests/ai-reply-quality-eval.test.mjs",
  "quality evaluation rejects raw content and incomplete coverage",
  "Der Antwortqualitäts-Eval muss Rohtext und unvollständige Abdeckung fail-closed ablehnen.",
);
requireText(
  "docs/operations/AI_REPLY_QUALITY_EVAL.md",
  "Prompts und Antworten bleiben außerhalb von Git",
  "Das Qualitäts-Eval-Runbook muss die private Rohdaten-Grenze festhalten.",
);
requireText(
  ".github/workflows/mobile-release-resource-readiness.yml",
  "eas-cli@21.2.0 env:exec",
  "Der Mobile-Release-Ressourcencheck muss die gepinnte EAS-Umgebung ausschließlich read-only laden.",
);
requireText(
  "scripts/operations/mobile-release-resource-readiness.mjs",
  "MOBILE_RELEASE_RESOURCE_READINESS=PASS",
  "Der Mobile-Release-Ressourcencheck muss einen redigierten gemeinsamen PASS-Vertrag besitzen.",
);
requireText(
  ".github/workflows/mobile-signed-internal-build.yml",
  "eas-cli@21.2.0 build:view",
  "Der signierte Mobile-Build muss seinen EAS-Endstatus read-only prüfen.",
);
requireText(
  "scripts/operations/mobile-signed-build-completion.mjs",
  "MOBILE_SIGNED_BUILD_COMPLETION_VERIFICATION=PASS",
  "Die Mobile-Build-Abschlussprüfung muss einen redigierten PASS-Vertrag besitzen.",
);
requireText(
  "tests/mobile-native-release-policy.test.mjs",
  "signed Mobile completion fails closed on identity drift",
  "Die Mobile-Build-Abschlussprüfung muss Ziel-, Status- und Artefaktdrift automatisiert sperren.",
);
requireText(
  "apps/mobile/package.json",
  '"store:check": "node scripts/check-store-readiness.mjs"',
  "Der Mobile Store-Preflight muss als fester lokaler Befehl verfügbar sein.",
);
requireText(
  ".github/workflows/ci-mobile.yml",
  "npm run store:check",
  "Die Mobile-CI muss Store-Texte, Branding und EAS-Profile fail-closed prüfen.",
);
requireText(
  "apps/mobile/scripts/check-store-readiness.mjs",
  "MOBILE_STORE_READINESS=PASS",
  "Der Mobile Store-Preflight muss einen redigierten PASS-Vertrag besitzen.",
);
requireText(
  "docs/mobile/STORE_LISTING.md",
  "KI-CRM: Kontakte & Follow-ups",
  "Der deutsche Apple-Untertitel muss innerhalb des aktuellen Zeichenlimits bleiben.",
);
requireText(
  "docs/mobile/BETA_RELEASE.md",
  "Dieser Vorabcheck ist vorbereitet, aber noch nicht extern ausgeführt.",
  "Das Mobile-Runbook muss den weiterhin offenen externen EAS-Nachweis ehrlich dokumentieren.",
);
requireText(
  "docs/operations/AI_TIER_READINESS.md",
  "AI_TIER_STANDARD=READY blockers=none",
  "Das Runbook muss den aktuellen Standard-/Plus-/Ultra-Vertrag dokumentieren.",
);
requireText(
  "src/config/aiTiers.mjs",
  "resolveWorkspaceAiTierEntitlement",
  "Die zentrale KI-Tier-Policy muss den fail-closed Workspace-Entitlement-Vertrag besitzen.",
);
requireText(
  "src/config/aiTiers.mjs",
  'blockers.push("production_activation")',
  "Eine bezahlte KI-Stufe darf ohne stufenspezifische Production-Aktivierung niemals bereit werden.",
);
requireText(
  "tests/ai-tier-policy.test.mjs",
  "workspace entitlement rejects unknown and client-controlled paid tiers",
  "Client-kontrollierte oder unbekannte KI-Entitlements müssen automatisiert auf Standard zurückfallen.",
);
requireText(
  "tests/ai-tier-policy.test.mjs",
  "paid tier activation evidence is tier-specific and redacted",
  "KI-Stufen-Nachweise müssen stufenspezifisch bleiben und dürfen keine Runtime-Werte ausgeben.",
);
requireText(
  "supabase/migrations/20260727090000_workspace_ai_tier_entitlements.sql",
  "force row level security",
  "Der persistente KI-Stufenspeicher muss RLS auch für den Tabellenowner erzwingen.",
);
requireText(
  "supabase/migrations/20260727090000_workspace_ai_tier_entitlements.sql",
  "workspace_ai_tier_entitlement_policy_boundary_failed",
  "Die Migration muss bei einer Browser-exponierenden RLS-Policy transaktional abbrechen.",
);
requireText(
  "src/lib/workspaceAiTierStorage.mjs",
  "stripeSubscriptionItemLinked: true",
  "Der Storage-Mapper darf nur eine validierte, redigierte Item-Verknüpfung an den Resolver geben.",
);
requireText(
  "src/lib/workspaceAiTierEntitlements.ts",
  'url.searchParams.set("limit", "2")',
  "Der serverseitige KI-Stufenloader muss mehrdeutige Workspace-Zeilen erkennen können.",
);
requireText(
  "tests/ai-tier-entitlement-storage.test.mjs",
  "storage row is reduced to the redacted resolver contract",
  "Die Redaction persistenter KI-Stufen muss automatisiert getestet werden.",
);
requireText(
  "docs/operations/AI_TIER_ENTITLEMENT_STORAGE.md",
  "Plus und Ultra bleiben",
  "Das Runbook muss den weiterhin blockierten Plus-/Ultra-Status offenlegen.",
);
requireText(
  "scripts/operations/ai-tier-entitlement-migration-runner.mjs",
  "06c83aacd98eebc1655023ed40132322eb4c38c2d10b46ef626c339ab5b076b9",
  "Die KI-Stufen-Speichermigration muss an den geprüften SHA-256 gebunden sein.",
);
requireText(
  "scripts/operations/ai-tier-entitlement-migration-runner.mjs",
  "AI_TIER_ENTITLEMENT_MIGRATION_POSTFLIGHT=PASS",
  "Der KI-Stufen-Speicher benötigt einen getrennten Metadaten-Postflight.",
);
requireText(
  "package.json",
  "db:ai-tier-entitlements:check",
  "Die Offline-Prüfung der KI-Stufen-Speichermigration muss als fester Befehl verfügbar sein.",
);
requireText(
  "tests/ai-tier-entitlement-migration-policy.test.mjs",
  "verify binds the target and runs only the read-only metadata postflight",
  "Zielbindung und read-only Postflight müssen automatisiert getestet werden.",
);
requireText(
  "src/lib/aiTierStripeLifecycle.mjs",
  "event_order_conflict",
  "Der KI-Add-on-Lifecycle muss gleichzeitige Stripe-Events fail-closed behandeln.",
);
requireText(
  "src/lib/aiTierStripeLifecycle.mjs",
  "ambiguous_price_items",
  "Der KI-Add-on-Lifecycle darf nie mehrere passende Add-on-Items akzeptieren.",
);
requireText(
  "tests/ai-tier-stripe-lifecycle.test.mjs",
  "duplicate and stale events cannot overwrite newer entitlement state",
  "Doppelte und verspätete KI-Add-on-Events müssen automatisiert geprüft werden.",
);
requireText(
  "package.json",
  '"ai:tiers:staging:run": "node scripts/operations/ai-tier-staging-acceptance.mjs --run"',
  "Die kontrollierte KI-Stufen-Staging-Abnahme muss explizit aufrufbar sein.",
);
requireText(
  ".github/workflows/ai-tier-staging-migration.yml",
  "github.ref == 'refs/heads/main'",
  "Der KI-Stufen-Migrationsworkflow muss auf den geprüften main-Branch begrenzt sein.",
);
requireText(
  ".github/workflows/ai-tier-staging-migration.yml",
  "FANMIND_NON_PRODUCTION_WRITE_ACK: I_UNDERSTAND_NON_PRODUCTION_ONLY",
  "Der KI-Stufen-Migrationsworkflow muss die unabhängige Nicht-Production-Schreibbestätigung verlangen.",
);
requireText(
  ".github/workflows/ai-tier-staging-migration.yml",
  "npm run db:ai-tier-entitlements:apply",
  "Der KI-Stufen-Migrationsworkflow muss den checksum-gebundenen Runner verwenden.",
);
forbidIn(
  ".github/workflows/ai-tier-staging-migration.yml",
  /FANMIND_RUNTIME_ENVIRONMENT: production|FANMIND_PRODUCTION_CHANGE_TICKET|sk_live_|https:\/\/fanmind\.ch|ai:tiers:staging:run/iu,
  "Der KI-Stufen-Migrationsworkflow darf weder Production-Ziele noch die Abnahme automatisch starten.",
);
requireText(
  ".github/workflows/ai-tier-staging-acceptance.yml",
  "FANMIND_NON_PRODUCTION_WRITE_ACK: I_UNDERSTAND_NON_PRODUCTION_ONLY",
  "Der KI-Stufen-Abnahmeworkflow muss die unabhängige Nicht-Production-Schreibbestätigung verlangen.",
);
requireText(
  ".github/workflows/ai-tier-staging-acceptance.yml",
  "npm run db:ai-tier-entitlements:verify",
  "Der KI-Stufen-Abnahmeworkflow muss die angewendete Migration read-only verifizieren.",
);
forbidIn(
  ".github/workflows/ai-tier-staging-acceptance.yml",
  /db:ai-tier-entitlements:apply|sk_live_|https:\/\/fanmind\.ch/iu,
  "Der KI-Stufen-Abnahmeworkflow darf weder Migrationen anwenden noch Production-Ziele enthalten.",
);
requireText(
  "scripts/operations/ai-tier-staging-acceptance.mjs",
  "AI_TIER_STAGING_TRANSACTION=ROLLED_BACK",
  "Der KI-Stufen-Abnahmerunner muss den rollback-only Datenbanknachweis melden.",
);
requireText(
  "docs/operations/AI_TIER_ENTITLEMENT_STORAGE.md",
  "keine automatische Production-Migration",
  "Das Runbook muss automatische Production-Migrationen ausdrücklich ausschließen.",
);
requireText(
  "package.json",
  '"db:meta-content:check": "node scripts/operations/meta-content-migration-runner.mjs --check"',
  "Die Offline-Prüfung der Meta-Content-Migrationen muss fest verfügbar sein.",
);
requireText(
  ".github/workflows/meta-content-staging-migration.yml",
  "inputs.reviewed_commit == github.sha",
  "Der Meta-Migrationsworkflow muss den exakten geprüften main-Commit binden.",
);
requireText(
  ".github/workflows/meta-content-staging-migration.yml",
  "PGSSLMODE: verify-full",
  "Der Meta-Migrationsworkflow muss den Staging-Datenbankhost vollständig per TLS prüfen.",
);
requireText(
  ".github/workflows/meta-content-staging-migration.yml",
  "npm run db:meta-content:apply",
  "Der Meta-Migrationsworkflow muss ausschließlich den checksum-gebundenen Runner verwenden.",
);
forbidIn(
  ".github/workflows/meta-content-staging-migration.yml",
  /FANMIND_RUNTIME_ENVIRONMENT: production|db:meta-content:verify|Meta App Review|analysis.*enabled/iu,
  "Der Meta-Migrationsworkflow darf Production, Review oder Analyse nicht aktivieren.",
);
requireText(
  "scripts/operations/meta-content-migration-runner.mjs",
  "META_CONTENT_MIGRATION_APPLY=already_current",
  "Der Meta-Runner muss sichere, postflight-gebundene Wiederholungsläufe unterstützen.",
);
requireText(
  "scripts/operations/meta-content-migration-runner.mjs",
  "META_CONTENT_ANALYSIS_ACTIVATION=disabled",
  "Der Meta-Runner muss die unveränderte Analysesperre ausweisen.",
);
requireText(
  "docs/operations/META_CONTENT_STAGING_MIGRATION.md",
  "teilweise vorhandenes",
  "Das Meta-Runbook muss Drift und Teilzustände fail-closed behandeln.",
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

requireText(
  "src/app/referral-bedingungen/page.tsx",
  "Rabatt ausschließlich auf die Starter-Grundgebühr von 312 €/Monat",
  "Die Referral-Bedingungen müssen die rabattfähige Starter-Grundgebühr eindeutig nennen.",
);
requireText(
  "src/app/referral-bedingungen/page.tsx",
  "kein Rabatt auf Einrichtung, KI Plus, KI Ultra, Connections oder Agency-Erweiterungen",
  "Die Referral-Bedingungen müssen alle nicht rabattfähigen Add-ons ausschließen.",
);
requireText(
  "src/app/referral-bedingungen/page.tsx",
  "produktive automatische Rabattverrechnung bleibt",
  "Die Referral-Bedingungen müssen den noch deaktivierten Billing-Status offenlegen.",
);
requireText(
  "src/app/settings/referral/page.tsx",
  'href="/referral-bedingungen"',
  "Die geschützte Referral-Seite muss auf die vollständigen Teilnahmebedingungen verlinken.",
);
requireText(
  "src/components/LegalTopHeader.tsx",
  'href: "/referral-bedingungen"',
  "Die Rechtsnavigation muss die Referral-Teilnahmebedingungen enthalten.",
);
requireText(
  "src/app/landing-v2/page.tsx",
  '{ label: "Referral-Bedingungen", href: "/referral-bedingungen" }',
  "Der öffentliche Footer muss die Referral-Teilnahmebedingungen verlinken.",
);

// Betreiber, B2B und Steuerdarstellung.
requireText(
  "src/app/impressum/page.tsx",
  "Bernd Guggenberger, Einzelunternehmen – Geschäftsbezeichnung FanMind",
  "Das Impressum muss den bestätigten Einzelunternehmer nennen.",
);
requireText(
  "src/app/datenschutz/page.tsx",
  "Bernd Guggenberger, Einzelunternehmen – Geschäftsbezeichnung FanMind",
  "Die Datenschutzerklärung muss denselben bestätigten Betreiber wie das Impressum nennen.",
);
requireText(
  "docs/LEGAL_COMPLETION_STATUS.md",
  "Betreiber und Vertragspartner: Bernd Guggenberger, Einzelunternehmen unter der Geschäftsbezeichnung FanMind",
  "Der rechtliche Abschlussstatus muss den kanonischen Betreiber nennen.",
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
  "README.md",
  "scripts/operations/deploy-isolated-release.sh",
  "README muss den aktiven isolierten Production-Release-Pfad dokumentieren.",
);
requireText(
  "README.md",
  "/var/www/fanmind-current",
  "README muss den stabilen atomaren Production-Release-Symlink dokumentieren.",
);
requireText(
  "README.md",
  "FanMind Production Read-only Audit",
  "README muss den dauerhaften read-only Production-Audit dokumentieren.",
);
forbidIn(
  "README.md",
  /git reset --hard origin\/main|pm2 (?:restart|delete) fanmind/iu,
  "README darf den alten In-Place-Deploy nicht als aktuellen Production-Ablauf anleiten.",
);
requireText(
  "docs/SOURCE_OF_TRUTH.md",
  "Öffentliche Demo | aktiv | kostenloser temporärer Demo-Zugang; kein entgeltliches Paket",
  "Die Source of Truth muss die kostenlose Demo statt eines Pilot-Pakets dokumentieren.",
);
requireText(
  "docs/SOURCE_OF_TRUTH.md",
  "Production-Audit: Ein dauerhaft installierter, commitgebundener und",
  "Die Source of Truth muss den automatisierten Production-Audit dokumentieren.",
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
  "src/app/settings/AccountTabs.tsx",
  'href: "/settings/ai-usage"',
  "KI-Nutzung muss im geschützten Kontobereich erreichbar sein.",
);

// Workspace-Unternehmens-Prompt und Antwortprofile.
requireText(
  "src/lib/aiPromptPolicy.mjs",
  "AI_PROMPT_PROFILE_MAX_COUNT = 8",
  "Ein Workspace darf höchstens acht Antwortprofile speichern.",
);
requireText(
  "src/app/settings/ai-usage/AiPromptSettings.tsx",
  "Unternehmens-Prompt & Antwortprofile",
  "Die KI-Nutzungsseite muss die Promptverwaltung sichtbar anbieten.",
);
requireText(
  "src/app/api/ai/prompt-settings/route.ts",
  "workspace.owner_user_id === context.user.id",
  "Nur Owner oder Plattform-Admin dürfen Workspace-Prompts ändern.",
);
requireText(
  "src/app/api/ai/reply-suggestions/route.ts",
  "getWorkspaceAiPromptContext",
  "Antwortvorschläge müssen Workspace-Prompts serverseitig laden.",
);
requireText(
  "docs/SOURCE_OF_TRUTH.md",
  "Workspace-Unternehmens-Prompt",
  "Die Source of Truth muss die aktive Promptverwaltung dokumentieren.",
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
  "src/app/datenschutz/page.tsx",
  /Ein Projekt von Gerhard Novy|Vertreten durch Gerhard Novy|Beteiligungsverhältnisse|50&nbsp;%|TODO:|\[BITTE FINAL EINTRAGEN/iu,
  "Die Datenschutzerklärung enthält alte Betreiberangaben oder interne Platzhalter.",
);
requireText(
  "src/lib/metaPixelPolicy.mjs",
  'export const META_PIXEL_ACTIVE_EVENTS = Object.freeze(["PageView"]);',
  "Nur PageView darf in der aktiven Meta-Event-Allowlist stehen.",
);
forbidIn(
  "src/app/register/RegisterClient.tsx",
  /trackMetaPixelEvent\s*\(/u,
  "Die Registrierung darf ohne separate Freigabe kein Meta-Conversion-Event auslösen.",
);
forbidIn(
  "src/components/landing/FooterInquiryForm.tsx",
  /trackMetaPixelEvent\s*\(/u,
  "Die Beratungsanfrage darf ohne separate Freigabe kein Meta-Conversion-Event auslösen.",
);
forbidIn(
  "src/app/datenschutz/page.tsx",
  /\b(?:Memory|Memories|Fan-Analyse)\b/iu,
  "Die Datenschutzerklärung muss die aktuelle Kontaktwissen-Terminologie verwenden.",
);
requireText(
  "src/app/datenschutz/page.tsx",
  "Im aktuell freigegebenen Stand wird ausschließlich das Standardevent",
  "Die Datenschutzerklärung muss den PageView-only-Scope nennen.",
);
forbidIn(
  "src/app/datenschutz/page.tsx",
  /<code>(?:CompleteRegistration|Lead)<\/code>/u,
  "Die Datenschutzerklärung darf vorbereitete Conversion-Events nicht als aktiv darstellen.",
);
requireText(
  "src/app/datenschutz/page.tsx",
  "Minimierte Webhook- und Serverfehler-Diagnosen werden standardmäßig nach 30 Tagen gelöscht.",
  "Die Datenschutzerklärung muss die implementierte Diagnose-Retention nennen.",
);
requireText(
  "src/app/datenschutz/page.tsx",
  "Bestätigte Account-Löschanfragen haben ein reguläres Bearbeitungsziel von höchstens 30 Tagen",
  "Die Datenschutzerklärung muss das transparente Account-Löschziel nennen.",
);
requireText(
  "src/app/datenschutz/page.tsx",
  "Eine EU-Senderegion ist daher kein Nachweis für EU-Datenspeicherung",
  "Die Datenschutzerklärung muss Resend-Senderegion und US-Datenspeicherung auseinanderhalten.",
);
forbidIn(
  "docs/LEGAL_COMPLETION_STATUS.md",
  /Gerhard Novy|Beteiligungsverhältnis: 50 % \/ 50 %/iu,
  "Der rechtliche Abschlussstatus enthält alte Betreiber- oder Beteiligungsangaben.",
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
requireText(
  "docs/legal/AVV_WORKING_DRAFT.md",
  "Diese Arbeitsfassung bereitet die technischen und fachlichen Anlagen einer",
  "Die AVV-Arbeitsfassung muss ihren nicht unterschriftsreifen Status klar begrenzen.",
);
requireText(
  "docs/legal/AVV_WORKING_DRAFT.md",
  "## 12. Noch erforderliche Abschlussentscheidungen",
  "Die AVV-Arbeitsfassung muss verbleibende externe Abschlussentscheidungen ausweisen.",
);
requireText(
  "docs/legal/RETENTION_REGISTER.md",
  "## Fachliche Daten mit Kriterien statt erfundener Endfrist",
  "Das Retention-Register muss implementierte Grenzen von offenen Entscheidungen trennen.",
);
requireText(
  "docs/LEGAL_COMPLETION_STATUS.md",
  "- [x] Production-Smoke-Test prüft `/impressum`, `/datenschutz`, `/avv`,",
  "Der Legal-Abschlussstatus muss den vorhandenen Production-Smoke-Nachweis korrekt führen.",
);
requireText(
  "scripts/legal/external-evidence-handoff.mjs",
  "LEGAL_EXTERNAL_EVIDENCE_PRIVATE_CONTENT_OUTPUT=false",
  "Der externe Legal-Handoff muss Fehler ohne private Inhalte ausgeben.",
);
requireText(
  "tests/legal-external-evidence-handoff.test.mjs",
  "formatted handoff omits values, evidence references and completed controls",
  "Der Legal-Handoff muss seine Datensparsamkeit automatisiert prüfen.",
);
requireText(
  "tests/legal-external-evidence-handoff.test.mjs",
  "invalid completion evidence keeps controls in the external handoff",
  "Der Legal-Handoff darf unvollständig belegte Abschlussstatus nicht ausblenden.",
);

for (const file of [
  "scripts/final-go-live-preflight.mjs",
  "scripts/smoke-public-routes.mjs",
]) {
  for (const route of [
    '"/impressum"',
    '"/datenschutz"',
    '"/avv"',
    '"/agb"',
    '"/zahlungsbedingungen"',
  ]) {
    requireText(
      file,
      route,
      `Der öffentliche Release-Check muss die Rechtsroute ${route} prüfen.`,
    );
  }
}

if (errors.length) {
  for (const error of errors) console.error(`TRUTH_ERROR: ${error}`);
  console.error(
    `Product truth verification failed with ${errors.length} error(s).`,
  );
  process.exit(1);
}

console.log(
  `Product truth verified across ${checkedFiles.length} checked files (0 warning(s)).`,
);
