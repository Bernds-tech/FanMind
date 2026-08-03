# FanMind

FanMind ist ein KI-gestütztes CRM und Copy-&-Open-Kommunikationssystem für Fan-/Kontaktbeziehungen. Der aktive Web-Kern umfasst Login, temporären Demo-Workspace, Dashboard, Kontakte, Kontaktdetail, CSV-Import, serverseitige KI-Antwortvorschläge, Kontaktwissen, Follow-ups und Roadmap. Zusätzlich besteht unter `apps/mobile` ein eigenständiger nativer Android-/iOS-App-Kern.

## Schnellentscheidung / Reader-Stand

Dieser Reader folgt der aktuellen Source of Truth in `docs/SOURCE_OF_TRUTH.md`.

- Aktive Kernfunktionen: Login, Registrierung, geschütztes Dashboard, Kontakte, Kontaktdetail, CSV-Import, KI-Antwortvorschläge, Kontaktwissen, Follow-ups, Roadmap und temporärer Demo-Workspace.
- Mobile-App: eigenständiger React-Native-/Expo-Kern für Android und iOS mit Login, Passwort-Recovery, Dashboard, Kontaktanlage/-bearbeitung, Kontaktwissen, KI-Antwortvorschlägen, kopierbarer und nativ teilbarer Antwort, Follow-ups, verschlüsselter Offline-Kontaktübersicht und sicherem lokalen Daten-Purge; signierte interne Builds und Store-Verteilung bleiben separat abzunehmen.
- Mobile-Signing-Gate: ein manueller `main`-gebundener Ablauf kann nach
  erfolgreichem Ressourcencheck genau einen credential-frozen internen
  Development-/Preview-Build einreihen und dessen EAS-Endstatus read-only bis
  zum erfolgreichen internen HTTPS-Artefakt prüfen. Eine unklare Queue- oder
  Abschlussantwort darf nicht automatisch wiederholt werden, sondern muss
  zuerst direkt im geschützten EAS-Projekt geprüft werden; Gerätetest und
  Store-Verteilung bleiben externe Nachweise.
- Öffentliche Registrierung: Starter Flex und Starter 12 Monate; während der Fertigstellungsphase zusätzlich der klar als Beta markierte 1-€/Tag-Test, solange der geschützte Admin-Schalter unter `/admin/settings` aktiv ist.
- Kostenlose Demo: temporärer, geschützter Demo-Workspace; kein entgeltliches Pilot-Paket.
- Beta-/Testzugang: Das Stripe-Testabo `internal_daily_test` ist während der Fertigstellungsphase gezielt im Registrierungsflow sichtbar, kostet 1 €/Tag, ist täglich kündbar und bleibt von Referral ausgeschlossen. Es wird im Adminbereich zum Verkaufsstart nach Abschluss der acht Abschlussblöcke wieder geschlossen; bestehende Abos bleiben davon unberührt.
- Billing-Steuermodus: `FANMIND_TAX_MODE=small_business` ist der aktuelle Default. Derzeit wird keine Umsatzsteuer ausgewiesen; Checkout, Angebot und Rechnung müssen dieselbe steuerliche Behandlung zeigen.
- Kommerzielle Wahrheit: Starter-Grundgebühr `312 €/Monat`.
- Starter Flex: `990 € einmalige Einrichtung + 312 €/Monat`; jederzeit zum Ende des laufenden, vollständig zu bezahlenden Abrechnungsmonats kündbar.
- Starter 12 Monate: `0 € Setup + 312 €/Monat`; zwölf Monate Mindestlaufzeit, danach Verlängerung um jeweils einen Monat.
- Starter-Abos können unter `/settings/package` zum serverseitig berechneten Vertragsende vorgemerkt und vor Wirksamkeit zurückgenommen werden; Account-Löschung bleibt ein separater DSGVO-Prozess.
- KI Standard: in der Starter-Grundgebühr enthalten.
- KI Plus: zusätzlich `100 €/Monat`.
- KI Ultra: zusätzlich `200 €/Monat`.
- Zentrale KI-Stufen-Policy: `src/config/aiTiers.mjs` führt Standard, Plus und Ultra; Plus/Ultra bleiben bis zur Modell-/Fallback-, Kontingent-, Runtime-, Stripe-/Staging-, Qualitäts-/Kosten-, Rechts-/Steuer- und ausdrücklichen Production-Freigabe nicht automatisch buchbar.
- Redigierte KI-Stufen-Prüfung: `npm run ai:tiers:readiness` bestätigt aktuell Standard als bereit sowie Plus/Ultra als blockiert. Stufenspezifische externe und technische Nachweise werden nur als feste Blocker-Codes ausgewertet; konkrete Stripe-IDs, Modelle, Limits, Beleg-IDs oder Secrets werden nicht ausgegeben.
- Nicht aktivierende KI-Stufen-Arbeitsempfehlung:
  `npm run ai:tiers:recommendation` prüft die datierte Modellklassen-,
  Kontingent- und Kostenmatrix offline; produktive KI-Pfade importieren sie
  nicht und Plus/Ultra bleiben blockiert.
- Privater Antwortqualitäts-Eval: `npm run ai:reply-quality:eval` validiert
  ausschließlich numerische Blindbewertungen aus dem von Git ausgeschlossenen
  Eval-Verzeichnis. Prompts, Antworten, Fall-IDs, Reviewer und Provider-
  Modellzuordnungen werden nicht ausgegeben; ein gültiges Ergebnis besitzt
  ausdrücklich keine Aktivierungswirkung.
- Admin-Kostenvergleich: Die KI-Verbrauchsansicht zählt Kontakte/Fans je
  Workspace exakt und zeigt die geschätzten Kosten pro Fan sowie pro
  100/1.000 Fans; fehlende oder leere Fan-Basen bleiben ohne Scheinwert.
  Validierte Schnellansichten decken 24 Stunden sowie 7, 30 und 90 Tage ab;
  die Modellverteilung zeigt Anfragen, geschätzte Kosten, Tokens und Fehler.
  Paginationsbegrenzte Monatsbudget- und Spike-Hinweise beobachten nur,
  blockieren keine KI-Anfrage und behaupten ohne Konfiguration keine Quote.
  Vollständige Tokenwerte der OpenAI Responses API werden serverseitig
  bevorzugt; bei fehlender oder inkonsistenter Provider-Usage greift weiterhin
  die konservative Zeichenlängen-Schätzung. Für erfolgreiche, konsistente
  Events zeigt die Adminansicht zusätzlich P50, P90 und P95 der Input-,
  Output- und Gesamttokens je Feature als nicht aktivierende
  Kontingent-Entscheidungsgrundlage.
- Serverseitiger Entitlement-Vertrag: fehlende, unbekannte, client-kontrollierte, pausierte, nicht gestartete, abgelaufene oder unvollständig freigegebene Plus-/Ultra-Zustände fallen immer auf KI Standard zurück.
- Persistenter Entitlement-Speicher: server-only Tabelle und redigierender Loader sind als deploy-before-migrate-Brücke vorbereitet; Migration, Stripe-Lifecycle und produktive KI-Verdrahtung sind noch nicht freigegeben, daher bleiben Plus/Ultra blockiert.
- Kontrollierter Entitlement-Migrationspfad: `npm run db:ai-tier-entitlements:check` prüft die festgeschriebene Migration offline; `verify` und `apply` sind explizit zielgebunden und führen niemals automatisch durch einen Web-Deploy aus. Der manuelle, ausschließlich auf `main` und das GitHub-Environment `staging` begrenzte Workflow `FanMind AI Tier Staging Migration` bereitet den echten Staging-Apply samt Postflight vor.
- KI-Stufen-Staging-Abnahme: manueller rollback-only Workflow für getrennte
  Staging-Datenbank, synthetischen Owner-/Member-Workspace und Stripe-Testpreise
  ist vorbereitet; er wendet keine Migration an und der echte externe Lauf
  steht noch aus.
- KI-Stufen-Ressourcencheck: ein vorgelagerter manueller Read-only-Workflow
  prüft auf `main` die getrennte Staging-Bindung, zwei aktive Stripe-Testpreise
  zu 100/200 Euro pro Monat sowie einen synthetischen Workspace mit
  unterschiedlichem Owner und Member. Er aktiviert keine Schreibfreigabe,
  liest keine Entitlement-Daten und wendet keine Migration an.
- Restore-Ressourcencheck: ein manueller, nur auf `main` ausführbarer
  checksum-only Workflow prüft auf einem getrennten `fanmind-restore`-Runner
  das isolierte Ziel und das verschlüsselte Full-Backup. Er verbindet sich
  nicht mit PostgreSQL, entschlüsselt keine Daten und aktiviert keine
  Schreibfreigabe. Der getrennte transaktionale Restore-Runner erzeugt nach
  einem echten isolierten Restore zusätzlich nur bei 5/5 vorhandenen
  Kerntabellen, 5/5 aktivierter RLS und 5/5 Policy-Abdeckung einen privaten,
  SHA-gebundenen Datenbank-Postcheck-Beleg; der echte externe Restore-Drill
  bleibt offen.
- Mobile-Release-Ressourcencheck: ein manueller, nur auf `main` ausführbarer
  Read-only-Workflow prüft je geschützter Development-/Preview-/Production-
  Umgebung die EAS-Projektbindung, App-Identität und ausschließlich öffentliche
  Client-Konfiguration. Geschützte Owner-/Projektvariablen ergänzen die
  statische App-Konfiguration erst bei der Expo-Auswertung. Der Workflow
  verwendet weder Build, Submit noch Update und lädt keine Signing Credentials;
  der externe Lauf und signierte Builds bleiben offen.
- Mobile-Build-Abschluss: Der getrennte signierte Build-Ablauf prüft nach
  exakt einer validierten Queue-Antwort mit `build:view` denselben Commit,
  Plattform, Profil, interne Distribution, erfolgreichen EAS-Endstatus und
  das vorhandene HTTPS-Artefakt. Build-ID und URL bleiben privat; Submit,
  Update, Gerätetest und Store-Verteilung werden dadurch nicht ausgeführt.
- Mobile-Push-Staging-Kontrolle: Die vorbereitete Registrierungstabelle besitzt
  jetzt getrennte manuelle Pfade für read-only Ressourcenprüfung,
  checksum-gebundenen Staging-Apply und rollback-only Acceptance. Alle sind an
  `main`, den manuell geprüften exakten Commit und das geschützte
  `staging`-Environment gebunden; Production-Ziele, echte Push-Tokens und
  Zustellung bleiben ausgeschlossen. Externe Läufe stehen noch aus.
- Vorbereiteter KI-Add-on-Lifecycle: eine serverseitige Price-Allowlist sowie fail-closed Regeln für Workspace-Ziel, Subscription-Item, doppelte, verspätete und gleichzeitige Stripe-Events; noch ohne produktive Webhook- oder Datenbank-Verdrahtung.
- Referral-Rabatte gelten nur auf die Starter-Grundgebühr von 312 €/Monat. Einrichtung und KI-Add-ons sind nicht rabattfähig.
- Growth, Agency und Enterprise bleiben Roadmap / Coming Soon / Auf Anfrage, bis sie ausdrücklich freigegeben sind.
- FanMind ist kein Bot: KI bereitet Antworten vor; der Mensch prüft, kopiert und sendet final selbst.
- FanMind garantiert keine fehlerfreien KI-Antworten.
- Externe Integrationen dürfen nicht als allgemein aktive Vollfunktion dargestellt werden, solange sie nicht technisch und rechtlich validiert sind.
- Legal-Readiness: Eine klar als nicht unterschriftsreif begrenzte
  AVV-Arbeitsfassung und ein technisches Retention-Register bündeln Rollen,
  Datenarten, Personengruppen, TOM, Anbieter sowie im Code belegte Fristen.
  Die Datenschutzerklärung nennt das aktive parameterlose Meta-Event und die
  technischen Löschkriterien konsistent. Anbieter-DPAs, Regionen,
  Drittlandgrundlagen, steuerliche Fristen und die finale Rechtsfreigabe
  bleiben externe Abschlussnachweise.
- Ein externes Freigaberegister ordnet UID-/Registerstatus,
  Rechts-/Steuerprüfung, Anbieter-DPAs, Regionen, Transfers, finale Fristen
  und AVV-Annahme konkreten Nachweisen zu. `npm run legal:evidence:check`
  validiert die Struktur; `npm run legal:evidence:require-complete` ist das
  absichtlich fail-closed gesetzte Gate vor echtem Drittpersonen-Onboarding.
  Vertrauliche Belege bleiben außerhalb von GitHub, im Register stehen später
  nur SHA-256-Prüfsummen. `npm run legal:evidence:hash` erzeugt eine solche
  Referenz ausschließlich aus einer lokalen, privaten Belegdatei, ohne Inhalt
  oder Pfad auszugeben und ohne den Registerstatus automatisch zu ändern.
  `npm run legal:evidence:handoff` erzeugt daraus eine datensparsame,
  zuständigkeitsbezogene Liste der noch offenen Controls und Belegarten, ohne
  Werte, Pfade, Kontokennungen, vorhandene Hashes oder abgeschlossene Controls
  auszugeben und ohne einen Status zu verändern.

## Betreiber

Vertragspartner ist **Bernd Guggenberger, Einzelunternehmen unter der Geschäftsbezeichnung FanMind**.

- Geschäftsanschrift: Turnerstraße 18, 2345 Brunn am Gebirge, Österreich
- Inhaber und vertretungsberechtigt: Bernd Guggenberger
- Zuständige Gewerbebehörde: Bezirkshauptmannschaft Mödling
- Kontakt: `kontakt@fanmind.ch`
- Telefon: `+43 676 5367236`

Der Zusatz `e.U.` wird erst nach bestätigter Firmenbucheintragung samt Firmenbuchnummer und Firmenbuchgericht verwendet.

## Gefrorener Gerhard-Demo-Pfad

Der Verkaufsdemo-Pfad ist fest und soll nicht durch Nebenfunktionen überlagert werden:

1. Landingpage öffnen.
2. Login oder kostenlose Demo starten.
3. Dashboard zeigen.
4. Kontakte öffnen.
5. CSV-Import kurz zeigen oder direkt einen Demo-Kontakt öffnen.
6. Kontaktdetail öffnen.
7. letzte eingehende Nachricht als Kontext verwenden.
8. KI-Antwortvorschläge erzeugen.
9. Antwort kopieren.
10. Vorschlag fürs Kontaktwissen speichern.
11. Follow-up-Vorschlag speichern.
12. Follow-up-Liste und/oder Roadmap zeigen.

Alles, was nicht zu diesem Pfad gehört, muss versteckt, als Roadmap/Beta markiert oder aus der Standarddemo herausgehalten werden.

## Technik

- Framework: Next.js `16.2.12`
- UI: React `19.2.8`
- Mobile: React Native / Expo unter `apps/mobile` mit eigener Navigation, CI und Releasegrenze
- Sprache: TypeScript
- Auth und Daten: Supabase Auth / Supabase PostgREST
- KI: serverseitige OpenAI Responses API
- Deployment: Exoscale + PM2 + nginx über `.github/workflows/deploy-fanmind.yml`
- Produktionsdomain: `https://fanmind.ch`

Installieren und lokal starten:

```bash
npm ci
npm run dev
```

Release-Prüfung:

```bash
npm run verify:truth
npm run lint
npm run test:operations
npm run build
```

## Optionale Marketing-Messung

FanMind besitzt eine zentral im Next.js-Root-Layout eingebundene, consent-gesteuerte Meta-Pixel-Struktur für eine eng begrenzte Allowlist öffentlicher Seiten. Sie ist keine Produkt-Analytics-Suite, läuft nicht auf geschützten CRM-/Admin-/Billing-Seiten und bleibt ohne gültige öffentliche Pixel-ID vollständig deaktiviert.

- Konfiguration: `NEXT_PUBLIC_META_PIXEL_ID`;
- Production-Dataset: `FanMind Dataset`, Pixel-ID `2069553844439892`;
- aktives Event: ausschließlich `PageView`, dedupliziert je freigegebenem öffentlichen App-Router-Pfad und unsensitivem Queryzustand;
- vorbereitet, aber nicht mit Produktaktionen verbunden: `CompleteRegistration`, `Lead`, `ViewContent`, `Contact`, `Schedule`, `StartTrial`, `Purchase`;
- kein Laden vor ausdrücklicher Marketing-Einwilligung;
- keine E-Mail, Namen, CRM-, Kontakt-, Nachrichten-, KI- oder Zahlungsdaten; geschützte same-origin Referrer werden blockiert;
- kein Advanced Matching, keine Conversions API und kein serverseitiges Meta-Tracking.

Die Codeintegration allein aktiviert den Pixel nicht auf Production. Nach gesetzter ENV ist ein neuer Build erforderlich; Consent, Widerruf, genau ein initiales PageView und deduplizierte Client-Navigationen werden gemäß `docs/analytics/META_PIXEL.md` kontrolliert abgenommen.

## Mobile-App

Die Mobile-App ist ein eigener Produktstream und keine eingebettete Website. Web und Mobile teilen ausschließlich freigegebene, RLS-geschützte Backend-Verträge und die serverseitige KI-API.

Bereits vorhanden:

- native E-Mail-/Passwort-Anmeldung und sichere Gerätesitzung;
- PKCE-basierte Passwort-Recovery über `fanmind://reset-password` mit strikter Callback-Validierung;
- Dashboard, Kontaktliste, Suche und Kontaktdetail;
- Kontakte in Mobile anlegen und bearbeiten, jeweils mit Workspace-Filter und RLS;
- Kontaktwissen und serverseitige KI-Antwortvorschläge;
- Antwort kopieren oder ausschließlich den ausgewählten Antworttext über die
  native Android-/iOS-Teilen-Auswahl weitergeben; FanMind wählt weder Ziel noch
  Empfänger und sendet nicht selbst;
- offene Follow-ups anzeigen und als `completed` abschließen; Altdaten mit `done` bleiben kompatibel;
- verschlüsselte, höchstens 24 Stunden alte Offline-Übersicht mit maximal 50 Kontakten; nur Name, Handle, Plattform, Status und Änderungszeit, ausschließlich lesbar;
- sicherer lokaler Logout mit Purge aller registrierten FanMind-SecureStore-Schlüssel und des Workspace-Zustands;
- native Push-Grundlage mit validierter Follow-up-Navigation, sicherem
  Login-Handoff, ausdrücklichem Nutzer-Opt-in und vorbereiteter verschlüsselter
  Ein-Gerät-Registrierung für Owner oder autorisierte Workspace-Mitglieder;
  öffentliche Demo-Workspaces und nicht freigegebene EAS-Projekte werden
  abgelehnt, serverseitige Zustellung bleibt deaktiviert;
- strikt Staging-only Push-Kontrollpfad mit read-only Ressourcencheck,
  separat bestätigtem checksum-Apply sowie rollback-only Browser-/service-role-
  Abnahme für synthetische Nicht-Demo-Owner/-Member/-Geräte; kein echter Token
  und keine Delivery-Aktivierung;
- nativer Splashscreen mit bestätigter FanMind-Wortmarke, eigenständige
  1024×1024-App-Icons für iOS/Legacy-Android und Android Adaptive Icon sowie
  vorbereitete deutsche/englische Store-Metadaten;
- iOS-Privacy-Manifest mit den Required-Reason-APIs der installierten nativen
  Bibliotheken, ohne Tracking-Domains, sowie fail-closed Android-API-36-Prüfung;
- erster iOS-Release bewusst iPhone-only; iPad erst nach separater Layout-,
  Geräte- und Screenshot-Abnahme;
- getrennte technische Entwürfe für Apple App Privacy und Google Play Data
  Safety; externe Datenschutz-/Rechts- und Portalabnahme bleibt offen;
- eigener SDK-57-Development-Client sowie explizite EAS-Umgebungen;
- separate Mobile-CI, Expo Doctor, TypeScript-Check, Android-/iOS-JavaScript-Bundles, isolierter Native-Prebuild sowie echtes Android-Debug-APK und codesign-freie iOS-Simulator-App als reine Build-Nachweise.
- kontrollierter signierter EAS-Workflow mit redigierter Abschlussprüfung für
  exakten Commit, Plattform, Profil, interne Distribution, erfolgreichen
  Endstatus und vorhandenes internes HTTPS-Artefakt; der reale externe Lauf
  steht noch aus.

Noch extern beziehungsweise als nächste Mobile-Phase abzunehmen:

- Supabase-Redirect-Freigabe und realer E-Mail-/Gerätetest für `fanmind://reset-password`;
- EAS-Projekt, Expo-Token, getrennte öffentliche EAS-Umgebungen und erstmaliger
  Read-only-Ressourcencheck;
- Signing Credentials und signierter interner Android-Build;
- Apple Developer / App Store Connect und iOS-TestFlight;
- visuelle Icon-Abnahme sowie reale Push-Berechtigungs-/Registrierungsabnahme
  im signierten Build; erst danach echte serverseitige Zustellung;
- finale Store-Screenshots, Datenschutzangaben und Portalabnahme aus signierten Builds;
- reale Android-/iOS-Gerätetests.

Verbindliche Details: `apps/mobile/README.md`, `docs/mobile/ARCHITECTURE.md` und `docs/mobile/BETA_RELEASE.md`.

## Wichtige Routen

| Route | Zweck | Status |
| --- | --- | --- |
| `/` | öffentliche Landingpage | aktiv |
| `/login` | Login und Demo-Einstieg | aktiv |
| `/register` | Starter-Registrierung | aktiv |
| `/dashboard` | geschützter Arbeitsbereich | aktiv |
| `/fans` | Kontaktliste | aktiv |
| `/fans/import` | CSV-Import | aktiv |
| `/fans/[id]` | Kontaktdetail, Verlauf, KI, Kontaktwissen und Follow-ups | aktiv |
| `/followups` | Follow-up-Übersicht | aktiv |
| `/settings/profile` | Profil und Workspace-Basisdaten | aktiv |
| `/settings/package` | Starter-Paket, KI-Add-ons und sichere Self-Service-Kündigung zum Vertragsende | aktiv |
| `/settings/invoices` | Rechnungsarchiv | aktiv |
| `/settings/referral` | Referral-Code, Status und Rabattübersicht | aktiv; Billing-Verrechnung separat freizugeben |
| `/referral-bedingungen` | öffentliche Referral-Teilnahmebedingungen | aktiv; automatische Rabattverrechnung weiterhin deaktiviert |
| `/settings/ai-usage` | monatliche KI-Nutzungsanzeige sowie Unternehmens-Prompt und Antwortprofile | aktiv |
| `/billing/start` | Starter-Checkout | aktiv; Legacy-Pilot-Checkout gesperrt |
| `/admin/...` | Admin- und Billing-Grundlagen | admin-only |
| `/api/ai/reply-suggestions` | serverseitiger KI-Endpunkt | aktiv |
| `/api/demo/start` | temporärer Demo-Workspace | aktiv |
| `/api/stripe/webhook` | Stripe-Lifecycle und Referral-Synchronisierung | aktiv; Referral-Rabattverrechnung per Flag deaktiviert |
| `/api/webhooks/meta` | Meta-Webhooks | vorbereitet/Beta |

## Pakete und KI-Add-ons

| Produkt | Status | Preislogik |
| --- | --- | --- |
| Öffentliche Demo | aktiv | kostenloser temporärer Demo-Zugang; kein entgeltliches Paket |
| Starter Flex | aktiv | 990 € Einrichtung + 312 €/Monat; Kündigung zum Ende des bezahlten Monats |
| Starter 12 Monate | aktiv | 0 € Setup + 312 €/Monat; 12 Monate Mindestlaufzeit, danach monatlich |
| KI Standard | aktiv | in 312 €/Monat enthalten |
| KI Plus | freigegebener Preis, technische Add-on-Aktivierung separat | +100 €/Monat |
| KI Ultra | freigegebener Preis, technische Add-on-Aktivierung separat | +200 €/Monat |
| Internes Live-Testabo | temporär als Beta-Test verfügbar | 1 €/Tag; täglich kündbar; nur während der Fertigstellungsphase, zum Verkaufsstart wieder deaktivieren |
| Growth | Coming Soon | nicht produktiv buchbar |
| Agency | Coming Soon / auf Anfrage | nicht produktiv buchbar |
| Enterprise / Custom | später | individuelle Prüfung |

Keine alten Preise wie `299 €/Monat`, `499 €/Monat` oder `Agency ab 990 €/Monat` wieder einführen.

## Kündigungslogik

### Starter Flex

Starter Flex kann jederzeit gekündigt werden. Die Kündigung wird zum Ende des laufenden, bereits bezahlten Abrechnungsmonats wirksam. Der laufende Monat wird vollständig verrechnet und nicht anteilig rückerstattet.

### Starter 12 Monate

Starter 12 Monate hat eine Mindestlaufzeit von zwölf Monaten. Danach verlängert sich der Vertrag jeweils um einen weiteren Monat, sofern er nicht gekündigt wird.

## Referral Growth Window

Das Empfehlungsprogramm ist bis zum globalen Ziel von 2.000 aktiven zahlenden Workspaces begrenzt:

- 5 % Rabatt je aktivem geworbenem zahlenden Workspace;
- maximal 20 aktive Referrals beziehungsweise 100 % Rabatt;
- Rabatt ausschließlich auf die Starter-Grundgebühr von 312 €/Monat;
- kein Rabatt auf Einrichtung oder KI Plus/Ultra;
- kein negativer Rechnungsbetrag und keine Barauszahlung;
- bei Kündigung, Nichtzahlung, Refund oder Chargeback entfällt der jeweilige Rabatt;
- Referral-Live-Billing bleibt bis zur kontrollierten Freigabe mit `FANMIND_ENABLE_REFERRAL_BILLING=false` deaktiviert.

Details: `docs/REFERRAL_PROGRAM.md` und `docs/operations/referral-stripe-sandbox-runbook.md`.

## ENV und Secrets

Siehe `.env.example` für Platzhalter. Echte Werte gehören nur in lokale oder Server-ENV-Dateien und niemals ins Repository.

Regel: Alles mit Service Role, Secret, Token, Stripe, OpenAI, Plattform-App-Secret oder Admin-E-Mail ist server-only. Keine echten Werte in `.env.example`, Logs, Screenshots, Client-Code oder Dokumentation.

## Datenbank und RLS

Die aktuelle Datenbankwahrheit steht in:

- `docs/database/fanmind_current_schema.md`
- `supabase/migrations/`
- `supabase/controlled/` für einzeln freizugebende Contract-Schritte
- `src/lib/supabase/server.ts`

Workspace-scoped Daten müssen per RLS und serverseitiger Autorisierung geschützt sein. Vor echten Kundendaten ist `docs/SECURITY_RLS_SECRETS_CHECK.md` abzuarbeiten.

Die Härtung serververwalteter Workspace-Felder wird deploy-before-migrate als
Expand-/Contract-Rollout ausgerollt: Der App-Brückenstand fällt ausschließlich
bei einem exakt fehlenden RPC auf den bisherigen Insert-Pfad und bei einer
exakt fehlenden Step-A-Spalte auf den älteren kommerziellen Core zurück.
Allgemeine Reads und Demo-Updates setzen diese Spalten nicht voraus. Danach
folgen Production-Preflight, additive Spalten-/RPC-Migration und
Schema-Nachweis. Der abschließende Privileg-Entzug liegt absichtlich als
kontrollierter SQL-Schritt außerhalb des automatischen Migration-Sets. Ein
normaler Web-Deploy wendet beides nicht automatisch an; verbindlicher
Production-Preflight und Abnahme stehen in
`docs/operations/WORKSPACE_SERVER_OWNED_FIELDS.md`.

## KI und Kostenkontrolle

- KI läuft serverseitig.
- API-Keys werden nicht im Browser verwendet.
- Eingaben, geladene Kontextzeilen, Ausgaben und Aufrufraten werden technisch
  begrenzt; diese Missbrauchs- und Kostengrenzen sind keine vertraglichen
  KI-Kontingente.
- Ausgaben sind strukturiert.
- KI-Nutzung wird je Workspace gemessen.
- Ein Workspace-Unternehmens-Prompt und bis zu acht auswählbare Antwortprofile steuern Ton, Wortwahl und belegte nächste Schritte; der Browser sendet an die KI-Route nur die Profil-ID, die Prompttexte werden serverseitig geladen.
- Sicherheits-, Wahrheits-, Datenschutz-, Schema- und Manuell-Senden-Regeln haben immer Vorrang vor Workspace-Prompts.
- Es gibt keine automatische Sendefunktion.
- Nutzer müssen KI-Ausgaben vor Verwendung prüfen.
- FanMind garantiert keine fehlerfreien, vollständigen oder aktuellen KI-Antworten.

Provider-Preise bleiben serverseitig konfigurierbar und werden nicht als statische UI-Wahrheit hartcodiert.

Details zur Promptverwaltung: `docs/AI_PROMPT_PROFILES.md`.

## Harte Stop-Regeln

Nicht als aktiv bauen oder verkaufen, sofern nicht ausdrücklich freigegeben und validiert:

- vollständige Instagram-, TikTok-, WhatsApp-, Facebook-, X- oder Discord-Integration;
- Scraping;
- ungeprüftes automatisches Senden;
- externe Plattform-Login-Daten speichern;
- Kampagnenversand-Automation;
- vollständige Analytics-Suite;
- Enterprise-Rollen-/Rechte-Komplexität;
- Fake-Kunden, Fake-Live-Integrationen oder Fake-Metriken.

## Deployment

Deployments auf `main` laufen über `.github/workflows/deploy-fanmind.yml` auf dem Self-Hosted Runner:

Der auf Production aktive isolierte Release-Pfad:

1. löst den exakten 40-stelligen Commit von `origin/main` auf;
2. führt `scripts/operations/deploy-isolated-release.sh` commitgebunden in
   einem neuen unveränderlichen Release-Verzeichnis aus;
3. prüft Product Truth, Lint, Operations-Tests, Next.js-Production-Build,
   Build-Metadaten und nginx, während das bisherige Release weiterläuft;
4. schaltet `/var/www/fanmind-current` atomar auf den neuen Stand und lädt den
   einzelnen PM2-Cluster-Worker rollierend neu;
5. verlangt die exakte Release-ID über `/api/version`, gesunde öffentliche
   Kernrouten und eine lückenlose `200`-Verfügbarkeitsprobe;
6. rollt bei einem Fehler auf das zuvor aktive Release zurück.

Der frühere In-Place-Pfad ist nur noch ein ausdrücklich deaktivierbarer
Notfall-Fallback. Der verbindliche Ablauf und die Rollback-Grenzen stehen in
`docs/operations/ISOLATED_RELEASE_DEPLOY.md`.

Nach jedem erfolgreichen Production-Deploy sowie täglich um 04:17 UTC läuft
zusätzlich der Workflow `FanMind Production Read-only Audit`. Er verwendet nur
die zuvor root-owned installierten Auditdateien, prüft Release/Runtime,
acht Health-Komponenten, PM2, nginx, Login, Hostressourcen, lokale und
Offsite-Backup-Paare sowie Backup-Worker-Fehler und nimmt keine
Service-, Datenbank-, Restore- oder Remote-Mutation vor.

Das Admin Operations Center lädt seine serverseitigen Betriebsdaten nach einer
erfolgreichen Job-Anforderung sofort neu. Solange ein Job `queued`, `claimed`
oder `running` ist, aktualisiert die sichtbare Seite alle 15 Sekunden sowie beim
Zurückkehren in den sichtbaren Tab. Bei erledigten Jobs und im Hintergrund
findet kein Polling-Verkehr statt.

Alle manuellen Backup- und Checksum-Verifikationsanforderungen verlangen eine
ausdrückliche Bestätigung und teilen ein serverseitiges atomares Limit von fünf
Anforderungen je Platform-Admin in zehn Minuten. Die Limiter-Identität ist
HMAC-SHA256-pseudonymisiert; bei fehlendem Limiter wird kein Job eingereiht.
Die für `verify_backup` notwendige Constraint-Erweiterung besitzt einen
eigenen checksum- und release-gebundenen Production-Verify/Apply-Ablauf. Ein
normaler Web-Deploy installiert nur den root-owned Kontrollpfad und wendet die
Datenbankmigration nicht automatisch an.

Die für den Operations Monitor benötigte Constraint-Erweiterung bleibt von
diesem Deploy getrennt. Sie wurde am 1. August 2026 kontrolliert angewendet und
unabhängig read-only verifiziert; der Zehn-Minuten-Timer ist aktiv und
Operations-E-Mail bleibt deaktiviert. Der manuelle Production-Control-Workflow
kann nach einem gesunden Probe zusätzlich die feste, E-Mail-freie Folge
Warnung, Kritisch und Recovery auf einer reservierten technischen Komponente
abnehmen. Timer, Probe und Lifecycle teilen ein exklusives Laufzeit-Lock.
Zugangsdaten, SQL-Fehlertext und ungefilterte Journalzeilen werden nicht in
GitHub-Logs ausgegeben. Der reguläre Lauf speichert außerdem den normalisierten
Aktivzustand von `nginx.service` über einen unprivilegierten Read-only-Aufruf;
nginx-Konfiguration und Journal werden dabei nicht gelesen. Ein CPU-
Momentwert wird wegen des Fehlalarmrisikos nicht als eigener Zehn-Minuten-
Alarm geführt.

Die datenschutzsparsame Server-Fehlertelemetrie wurde am 1. August 2026 auf dem
Release `04f2a472c57559393dd2d9c89575edf0ce8141ba` kontrolliert repariert,
unabhängig verifiziert, E-Mail-frei abgenommen und rollback-gesichert aktiviert.
Sie speichert weder Fehlermeldungen noch Stacks, Header, Queryparameter, Bodies,
IP-Adressen oder Kundendaten. Kritische E-Mails bleiben deaktiviert; ein
öffentlicher Fehler-Testendpunkt existiert nicht. Der getrennte read-only
Abschlussaudit vom 1. August 2026 belegte bei unveränderten 40 PM2-Restarts
2.213 Sekunden kontinuierliche Uptime, 8/8 gesunde Komponenten, denselben
Release-Commit sowie weiterhin gesunde lokale und externe Backups.

Ein getrenntes Staging wird ausschließlich manuell über `.github/workflows/deploy-staging.yml` auf einem eigenen `fanmind-staging`-Runner ausgerollt. Der Workflow akzeptiert nur einen von `main` erreichbaren Commit, verlangt den Staging-Preflight und startet den separaten PM2-Prozess `fanmind-staging`. Host, Supabase-Staging-Projekt, Stripe-Testmodus, nginx-vHost und synthetische Testdaten bleiben externe Voraussetzungen.

## Dokumentations-Synchronisierung

Wenn Preise, Pakete, Referral-Logik, aktiver Scope, Demo-Pfad, Billing, KI-Leistungsstufen, Datenbank, Security, Mobile-Verträge oder öffentliche Versprechen geändert werden, müssen `docs/SOURCE_OF_TRUTH.md`, `README.md`, `AGENTS.md`, `apps/mobile/README.md`, `docs/mobile/ARCHITECTURE.md`, `docs/mobile/BETA_RELEASE.md` und die betroffenen Legal-/Pricing-Dateien im selben PR geprüft und synchronisiert werden.
