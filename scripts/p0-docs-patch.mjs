#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";

async function replaceExactlyOnce(path, before, after) {
  const source = await readFile(path, "utf8");
  const first = source.indexOf(before);
  if (first < 0) throw new Error(`${path}: expected source block was not found`);
  if (source.indexOf(before, first + before.length) >= 0) {
    throw new Error(`${path}: expected source block occurs more than once`);
  }
  await writeFile(path, source.replace(before, after), "utf8");
}

async function replaceAllGuarded(path, replacements) {
  let source = await readFile(path, "utf8");
  for (const [before, after] of replacements) {
    const first = source.indexOf(before);
    if (first < 0) throw new Error(`${path}: missing replacement token ${before}`);
    if (source.indexOf(before, first + before.length) >= 0) {
      throw new Error(`${path}: replacement token occurs more than once: ${before}`);
    }
    source = source.replace(before, after);
  }
  await writeFile(path, source, "utf8");
}

const readme = "README.md";
await replaceExactlyOnce(
  readme,
  "FanMind ist ein KI-gestütztes CRM und Copy-&-Open-Kommunikationssystem für Fan-/Kontaktbeziehungen. Der aktive Kern umfasst Login, temporären Demo-Workspace, Dashboard, Kontakte, Kontaktdetail, CSV-Import, serverseitige KI-Antwortvorschläge, Kontaktwissen, Follow-ups und Roadmap.",
  "FanMind ist ein KI-gestütztes CRM und Copy-&-Open-Kommunikationssystem für Fan-/Kontaktbeziehungen. Der aktive Web-Kern umfasst Login, temporären Demo-Workspace, Dashboard, Kontakte, Kontaktdetail, CSV-Import, serverseitige KI-Antwortvorschläge, Kontaktwissen, Follow-ups und Roadmap. Zusätzlich besteht unter `apps/mobile` ein eigenständiger nativer Android-/iOS-App-Kern.",
);
await replaceExactlyOnce(
  readme,
  "- Aktive Kernfunktionen: Login, Registrierung, geschütztes Dashboard, Kontakte, Kontaktdetail, CSV-Import, KI-Antwortvorschläge, Kontaktwissen, Follow-ups, Roadmap und temporärer Demo-Workspace.\n",
  "- Aktive Kernfunktionen: Login, Registrierung, geschütztes Dashboard, Kontakte, Kontaktdetail, CSV-Import, KI-Antwortvorschläge, Kontaktwissen, Follow-ups, Roadmap und temporärer Demo-Workspace.\n- Mobile-App: eigenständiger React-Native-/Expo-Kern für Android und iOS mit Login, Dashboard, Kontakten, Kontaktwissen, KI-Antwortvorschlägen und Follow-ups; signierte interne Builds und Store-Verteilung bleiben separat abzunehmen.\n",
);
await replaceExactlyOnce(
  readme,
  "- UI: React `19.2.4`\n- Sprache: TypeScript",
  "- UI: React `19.2.4`\n- Mobile: React Native / Expo unter `apps/mobile` mit eigener Navigation, CI und Releasegrenze\n- Sprache: TypeScript",
);
await replaceExactlyOnce(
  readme,
  "```\n\n## Wichtige Routen",
  "```\n\n## Mobile-App\n\nDie Mobile-App ist ein eigener Produktstream und keine eingebettete Website. Web und Mobile teilen ausschließlich freigegebene, RLS-geschützte Backend-Verträge und die serverseitige KI-API.\n\nBereits vorhanden:\n\n- native E-Mail-/Passwort-Anmeldung und sichere Gerätesitzung;\n- Dashboard, Kontaktliste, Suche und Kontaktdetail;\n- Kontaktwissen und serverseitige KI-Antwortvorschläge;\n- Antwort kopieren, Kontaktwissen und Follow-up speichern;\n- offene Follow-ups anzeigen und als `completed` abschließen; Altdaten mit `done` bleiben kompatibel;\n- separate Mobile-CI, Expo Doctor, TypeScript-Check und Android-JavaScript-Bundle.\n\nNoch extern beziehungsweise als nächste Mobile-Phase abzunehmen:\n\n- EAS-Projekt, Signing Credentials und signierter interner Android-Build;\n- Apple Developer / App Store Connect und iOS-TestFlight;\n- Passwort-Reset/Deep Links, Kontakt anlegen/bearbeiten, Offline-Lese-Cache und Push-Grundlage.\n\nVerbindliche Details: `apps/mobile/README.md` und `docs/mobile/ARCHITECTURE.md`.\n\n## Wichtige Routen",
);
await replaceExactlyOnce(
  readme,
  "Wenn Preise, Pakete, Referral-Logik, aktiver Scope, Demo-Pfad, Billing, KI-Leistungsstufen, Datenbank, Security oder öffentliche Versprechen geändert werden, müssen `docs/SOURCE_OF_TRUTH.md`, `README.md`, `AGENTS.md` und die betroffenen Legal-/Pricing-Dateien im selben PR geprüft und synchronisiert werden.",
  "Wenn Preise, Pakete, Referral-Logik, aktiver Scope, Demo-Pfad, Billing, KI-Leistungsstufen, Datenbank, Security, Mobile-Verträge oder öffentliche Versprechen geändert werden, müssen `docs/SOURCE_OF_TRUTH.md`, `README.md`, `AGENTS.md`, `apps/mobile/README.md`, `docs/mobile/ARCHITECTURE.md` und die betroffenen Legal-/Pricing-Dateien im selben PR geprüft und synchronisiert werden.",
);

const sourceOfTruth = "docs/SOURCE_OF_TRUTH.md";
await replaceExactlyOnce(sourceOfTruth, "Stand: 19. Juli 2026", "Stand: 22. Juli 2026");
await replaceExactlyOnce(
  sourceOfTruth,
  "- ein System mit klarer Roadmap für Integrationen, Kampagnen, Analytics und spätere Erweiterungen.",
  "- ein System mit klarer Roadmap für Integrationen, Kampagnen, Analytics und spätere Erweiterungen;\n- ein eigenständiger nativer Mobile-App-Kern für Android und iOS, nicht als WebView-Hülle.",
);
await replaceExactlyOnce(
  sourceOfTruth,
  "- Kopieren von Antwortvorschlägen ohne automatische Sendung;\n- Admin-, Billing-, Operations- und Backup-Grundlagen;",
  "- Kopieren von Antwortvorschlägen ohne automatische Sendung;\n- eigenständiger React-Native-/Expo-App-Kern mit Login, Dashboard, Kontakten, Kontaktwissen, KI und Follow-ups;\n- Admin-, Billing-, Operations- und Backup-Grundlagen;",
);
await replaceExactlyOnce(
  sourceOfTruth,
  "## 3. Roadmap- und Go-Live-Stand",
  `## 3. Eigenständige Mobile-App\n\nDer Mobile-App-Kern liegt unter \`apps/mobile\` und wird unabhängig von der Next.js-Website gebaut und veröffentlicht. Er ist keine eingebettete Website und importiert keine Website-CSS- oder Next.js-UI-Komponenten.\n\nAktiv im App-Kern:\n\n- native Supabase-E-Mail-/Passwort-Anmeldung;\n- verschlüsselte Sitzung über \`expo-secure-store\`;\n- geschützte Expo-Router-Navigation;\n- Dashboard, Kontaktliste, Suche und Kontaktdetail;\n- Kontaktwissen;\n- Bearer-authentifizierte serverseitige KI-Antwortvorschläge;\n- Antwort kopieren, Kontaktwissen und Follow-up speichern;\n- offene Follow-ups anzeigen und mit dem kanonischen Status \`completed\` abschließen; bestehende \`done\`-Altdaten bleiben lesekompatibel;\n- separate Mobile-CI mit TypeScript, Expo Doctor, Architekturgrenze und Android-JavaScript-Bundle.\n\nNoch nicht als ausgelieferte Store-App freigegeben:\n\n- EAS-Projekt und Signing Credentials;\n- signierter interner Android-Build;\n- Apple Developer / App Store Connect und TestFlight;\n- Passwort-Reset/Deep Links, Kontaktanlage/-bearbeitung, Offline-Lese-Cache und Push-Grundlage;\n- realer End-to-End-Gerätetest auf Android und iOS.\n\nMobile führt kein Billing, Referral-Reconciliation, Admin-Operationen, Webhook-Ingestion, externe Kanal-Credentials oder automatische Kommunikation aus. Verbindliche Architekturdetails stehen in \`apps/mobile/README.md\` und \`docs/mobile/ARCHITECTURE.md\`.\n\n## 4. Roadmap- und Go-Live-Stand`,
);
await replaceAllGuarded(sourceOfTruth, [
  ["## 13. Reader-Synchronisierung", "## 14. Reader-Synchronisierung"],
  ["## 12. Finale technische Go-Live-Freigabe", "## 13. Finale technische Go-Live-Freigabe"],
  ["## 11. KI und Kostenbeobachtung", "## 12. KI und Kostenbeobachtung"],
  ["## 10. Datenbank-Source-of-Truth", "## 11. Datenbank-Source-of-Truth"],
  ["## 9. Security, RLS und Umgebungsgrenzen", "## 10. Security, RLS und Umgebungsgrenzen"],
  ["## 8. Integrationsstatus", "## 9. Integrationsstatus"],
  ["## 7. Gefrorener Demo-Pfad", "## 8. Gefrorener Demo-Pfad"],
  ["## 6. Referral Growth Window", "## 7. Referral Growth Window"],
  ["## 5. Verbindliche Terminologie", "## 6. Verbindliche Terminologie"],
  ["## 4. Kommerzielle Wahrheit", "## 5. Kommerzielle Wahrheit"],
]);
await replaceExactlyOnce(
  sourceOfTruth,
  "- `docs/database/fanmind_current_schema.md`;\n- relevante Security-, KI-, Referral-, Landingpage- und Legal-Dateien.",
  "- `docs/database/fanmind_current_schema.md`;\n- `apps/mobile/README.md` und `docs/mobile/ARCHITECTURE.md` bei Mobile- oder Backend-Vertragsänderungen;\n- relevante Security-, KI-, Referral-, Landingpage- und Legal-Dateien.",
);

const agents = "AGENTS.md";
await replaceExactlyOnce(
  agents,
  "- Database/RLS truth lives in `docs/database/fanmind_current_schema.md` plus the Supabase migrations under `supabase/migrations/`.\n",
  "- Database/RLS truth lives in `docs/database/fanmind_current_schema.md` plus the Supabase migrations under `supabase/migrations/`.\n- Mobile product and architecture truth lives in `apps/mobile/README.md` and `docs/mobile/ARCHITECTURE.md`; Web and Mobile share backend contracts deliberately but never UI code.\n",
);
await replaceExactlyOnce(
  agents,
  "- Active CRM core: login, registration, protected dashboard, contacts/fans, contact detail, CSV import, server-side AI reply suggestions, memory, follow-ups, roadmap, admin/billing groundwork, Stripe test checkout, legal pages, and temporary demo workspace.\n",
  "- Active CRM core: login, registration, protected dashboard, contacts/fans, contact detail, CSV import, server-side AI reply suggestions, contact knowledge, follow-ups, roadmap, admin/billing groundwork, Stripe test checkout, legal pages, and temporary demo workspace.\n- Active Mobile Phase A: independent Expo/React-Native app with native login, secure session persistence, dashboard, contacts, contact knowledge, server-side AI reply suggestions and follow-ups. Signed internal builds and store distribution remain separate release steps.\n",
);
await replaceExactlyOnce(agents, "## MVP scope", "## Active product scope");
await replaceExactlyOnce(
  agents,
  "Build FanMind as a real CRM core, not as a slide/demo shell. Active MVP functionality may include:",
  "Build FanMind as a real CRM core, not as a slide/demo shell. The active product scope includes:",
);
await replaceExactlyOnce(agents, "- Memory\n", "- Contact knowledge\n");
await replaceExactlyOnce(
  agents,
  "- Admin/billing groundwork only where explicitly shown as setup/payment status, not as a broad payment platform\n\n## Hard stop rules",
  `- Admin/billing groundwork only where explicitly shown as setup/payment status, not as a broad payment platform\n\n## Mobile product boundary\n\n- Mobile source lives under \`apps/mobile\` with its own package, navigation, UI primitives, CI and release cadence.\n- Never turn the Mobile app into a WebView wrapper or import Next.js routes, Website CSS or Website UI components.\n- Mobile may contain only public Supabase configuration and the FanMind API base URL; service-role, OpenAI, Stripe, webhook and backup secrets remain server-only.\n- The canonical completed follow-up status is \`completed\`; \`done\` remains read-compatible only for historical rows.\n- Mobile does not perform billing, referral reconciliation, admin operations, webhook ingestion, external channel credential handling or automatic sending.\n- A Web merge cannot publish a mobile binary. EAS builds, signing, Android internal testing and iOS TestFlight require explicit separate verification.\n\n## Hard stop rules`,
);

const roadmap = "src/config/roadmap.ts";
await replaceExactlyOnce(
  roadmap,
  `  {\n    number: "06",\n    phase: "Phase 6",\n    icon: "integrations",\n    title: "Weitere Social-Kanäle",`,
  `  {\n    number: "06",\n    phase: "Phase 6",\n    icon: "rocket",\n    title: "Mobile-App für Android & iOS",\n    status: "App-Kern vorhanden · interne Builds offen",\n    statusIcon: "◷",\n    tone: "cyan",\n    availability: "upcoming",\n    items: [\n      { label: "Eigenständiger Expo-/React-Native-App-Kern", state: "done", status: "Vorhanden" },\n      { label: "Login, Dashboard, Kontakte, Kontaktwissen, KI und Follow-ups", state: "done", status: "Phase A erledigt" },\n      { label: "Web-/Mobile-Follow-up-Status synchronisiert", state: "done", status: "completed + Legacy done" },\n      { label: "Signierter interner Android-Build", state: "partial", status: "EAS-/Signing-Einrichtung offen" },\n      { label: "iOS-TestFlight", state: "planned", status: "Apple-Konto und Signing offen" },\n      { label: "Passwort-Reset, Kontaktbearbeitung, Offline und Push", state: "planned", status: "Nächste Mobile-Phase" },\n    ],\n  },\n\n  {\n    number: "07",\n    phase: "Phase 7",\n    icon: "integrations",\n    title: "Weitere Social-Kanäle",`,
);
await replaceAllGuarded(roadmap, [
  ["number: \"13\",\n    phase: \"Phase 13\",\n    icon: \"analytics\",\n    title: \"Datenschutz & Kontrolle\"", "number: \"14\",\n    phase: \"Phase 14\",\n    icon: \"analytics\",\n    title: \"Datenschutz & Kontrolle\""],
  ["number: \"12\",\n    phase: \"Phase 12\",\n    icon: \"campaign\",\n    title: \"Kostenpflichtige KI-Erweiterungen\"", "number: \"13\",\n    phase: \"Phase 13\",\n    icon: \"campaign\",\n    title: \"Kostenpflichtige KI-Erweiterungen\""],
  ["number: \"11\",\n    phase: \"Phase 11\",\n    icon: \"rocket\",\n    title: \"Multi-Workspace / Agency\"", "number: \"12\",\n    phase: \"Phase 12\",\n    icon: \"rocket\",\n    title: \"Multi-Workspace / Agency\""],
  ["number: \"10\",\n    phase: \"Phase 10\",\n    icon: \"analytics\",\n    title: \"Team & Rollen/Rechte\"", "number: \"11\",\n    phase: \"Phase 11\",\n    icon: \"analytics\",\n    title: \"Team & Rollen/Rechte\""],
  ["number: \"09\",\n    phase: \"Phase 9\",\n    icon: \"analytics\",\n    title: \"Analytics & Reichweitenerkennung\"", "number: \"10\",\n    phase: \"Phase 10\",\n    icon: \"analytics\",\n    title: \"Analytics & Reichweitenerkennung\""],
  ["number: \"08\",\n    phase: \"Phase 8\",\n    icon: \"campaign\",\n    title: \"Kampagnen-Vorbereitung\"", "number: \"09\",\n    phase: \"Phase 9\",\n    icon: \"campaign\",\n    title: \"Kampagnen-Vorbereitung\""],
  ["number: \"07\",\n    phase: \"Phase 7\",\n    icon: \"campaign\",\n    title: \"Segmente & Listen\"", "number: \"08\",\n    phase: \"Phase 8\",\n    icon: \"campaign\",\n    title: \"Segmente & Listen\""],
]);

const translations = "src/lib/landingEnglishCopySupplement.ts";
await replaceExactlyOnce(
  translations,
  "  \"Fail-closed aktiv\": \"Fail-closed active\",\n  \"Segmente & Listen\": \"Segments & lists\",",
  `  "Fail-closed aktiv": "Fail-closed active",\n  "Mobile-App für Android & iOS": "Mobile app for Android & iOS",\n  "App-Kern vorhanden · interne Builds offen": "App core available · internal builds pending",\n  "Eigenständiger Expo-/React-Native-App-Kern": "Independent Expo/React Native app core",\n  Vorhanden: "Available",\n  "Login, Dashboard, Kontakte, Kontaktwissen, KI und Follow-ups": "Login, dashboard, contacts, contact knowledge, AI and follow-ups",\n  "Phase A erledigt": "Phase A complete",\n  "Web-/Mobile-Follow-up-Status synchronisiert": "Web/mobile follow-up status synchronized",\n  "completed + Legacy done": "completed + legacy done",\n  "Signierter interner Android-Build": "Signed internal Android build",\n  "EAS-/Signing-Einrichtung offen": "EAS/signing setup pending",\n  "iOS-TestFlight": "iOS TestFlight",\n  "Apple-Konto und Signing offen": "Apple account and signing pending",\n  "Passwort-Reset, Kontaktbearbeitung, Offline und Push": "Password reset, contact editing, offline and push",\n  "Nächste Mobile-Phase": "Next mobile phase",\n  "Segmente & Listen": "Segments & lists",`,
);

console.log("P0_DOCS_PATCH=OK");
