# FanMind Source of Truth

Stand: 23. Juli 2026

Dieses Dokument ist die fachliche Source of Truth für FanMind. README, AGENTS.md, Landingpage, Pricing, Legal-Texte, Datenbank-Dokumentation, Roadmap und Codex-Tasks müssen mit diesem Stand synchron bleiben.

## 1. Produktdefinition

FanMind ist ein KI-gestütztes CRM und Copy-&-Open-Kommunikationssystem für Fan- und Kontaktbeziehungen.

FanMind ist:

- ein CRM-Kern für Kontakte und Fans;
- ein Arbeitsbereich für Nachrichtenkontext, Kontaktwissen und Follow-ups;
- ein serverseitiger KI-Assistent für Antwortvorschläge;
- ein Copy-&-Open-Assistent: Antwort vorbereiten, kopieren, Originalkanal öffnen, Mensch sendet selbst;
- ein System mit klarer Roadmap für Integrationen, Kampagnen, Analytics und spätere Erweiterungen;
- ein eigenständiger nativer Mobile-App-Kern für Android und iOS, nicht als WebView-Hülle.

FanMind ist nicht:

- ein Bot oder Autoresponder;
- eine Scraping-Plattform;
- eine allgemein freigegebene Social-Media-Vollintegration;
- eine Kampagnenversand-Maschine;
- eine vollständige Enterprise-Rollen-, Analytics- oder Payment-Suite.

## 2. Aktiver CRM-Kern

Aktiv beziehungsweise produktnah:

- deutsche und englische Landingpage mit automatischer Sprachprüfung;
- Login und öffentliche Starter-Registrierung;
- kostenloser temporärer Demo-Workspace, getrennt vom entgeltlichen Angebot;
- geschütztes Dashboard;
- Kontakte, Kontaktdetail und Suche;
- CSV-Import und manuelle Kontaktpflege;
- gespeicherter Nachrichten- und Gesprächskontext;
- Kontaktwissen mit Bearbeiten und Löschen;
- Follow-ups;
- serverseitige KI-Antwortvorschläge;
- Kontaktwissen- und Follow-up-Vorschläge aus der KI-Ausgabe;
- Kopieren von Antwortvorschlägen ohne automatische Sendung;
- eigenständiger React-Native-/Expo-App-Kern mit Login, Passwort-Recovery, Dashboard, Kontaktanlage/-bearbeitung, Kontaktwissen, KI und Follow-ups;
- Admin-, Billing-, Operations- und Backup-Grundlagen;
- getrennte kompakte Konto-Seiten:
  - `/settings/profile` für Profil und Workspace-Basisdaten;
  - `/settings/package` für Paket, Status, Betrag, Setup und kontrollierte Paketoptionen;
  - `/settings/invoices` für eigene Stripe-Rechnungen mit Öffnen- und PDF-Links;
  - Self-Service-Kündigung für Starter-Abos zum serverseitig erzwungenen Vertragsende mit separatem Account-/DSGVO-Löschprozess;
- Admin-only Asset-Upload in den Supabase-Storage-Bucket `fanmind-assets`;
- Legal-Seiten, Zahlungsbedingungen und AVV-Anforderungsseite;
- internes Live-Testabo `internal_daily_test` mit 1 € pro Tag ausschließlich für klar markierte interne Test-Workspaces; kein Referral-Rabatt.

Das entgeltliche öffentliche Pilot-/Setup-Paket ist eingestellt. Legacy-Pilot-Checkout bleibt gesperrt. Die kostenlose Demo ist kein entgeltliches Paket.

## 3. Eigenständige Mobile-App

Der Mobile-App-Kern liegt unter `apps/mobile` und wird unabhängig von der Next.js-Website gebaut und veröffentlicht. Er ist keine eingebettete Website und importiert keine Website-CSS- oder Next.js-UI-Komponenten.

Aktiv im App-Kern:

- native Supabase-E-Mail-/Passwort-Anmeldung;
- PKCE-basierte Passwort-Recovery über `fanmind://reset-password` mit strikter Callback-Validierung;
- verschlüsselte Sitzung über `expo-secure-store` und zentralen lokalen Purge beim Abmelden;
- geschützte Expo-Router-Navigation;
- Dashboard, Kontaktliste, Suche und Kontaktdetail;
- Kontakt in Mobile anlegen und bearbeiten, jeweils mit Workspace-Filter und RLS;
- Kontaktwissen;
- Bearer-authentifizierte serverseitige KI-Antwortvorschläge;
- Antwort kopieren, Kontaktwissen und Follow-up speichern;
- offene Follow-ups anzeigen und mit dem kanonischen Status `completed` abschließen; bestehende `done`-Altdaten bleiben lesekompatibel;
- separate Mobile-CI mit TypeScript, Expo Doctor, Architekturgrenze und Android-JavaScript-Bundle.

Noch nicht als ausgelieferte Store-App freigegeben:

- Supabase-Redirect-Freigabe und realer E-Mail-/Gerätetest für `fanmind://reset-password`;
- EAS-Projekt und Signing Credentials;
- signierter interner Android-Build;
- Apple Developer / App Store Connect und TestFlight;
- Offline-Lese-Cache, Push-Grundlage und Account-/Datenlöschprozess;
- realer End-to-End-Gerätetest auf Android und iOS.

Mobile führt kein Billing, Referral-Reconciliation, Admin-Operationen, Webhook-Ingestion, externe Kanal-Credentials oder automatische Kommunikation aus. Verbindliche Architektur- und Beta-Details stehen in `apps/mobile/README.md`, `docs/mobile/ARCHITECTURE.md` und `docs/mobile/BETA_RELEASE.md`.

## 4. Roadmap- und Go-Live-Stand

### Phase 4 – Erledigt / Verkaufsstart freigegeben

- Stripe-Live-Schritte: erledigt.
- Abrechnung & Admin-Basis: erledigt.
- Profil/Paket/Rechnungen: erledigt.
- Sales-Unterlagen: vorbereitet unter `docs/sales/`.
- Produktionsfreigabe: erledigt.
- Finaler Go-Live-Smoke-Test: erledigt.

### Phase 5 – Produktion und Testumgebung

- Operations-Grundlage: produktiv aktiv.
- Release-Checks: automatisch aktiv.
- isolierter Release-Deploy, Health, Version, Public Smoke, Product Truth, Lint, Operations-Tests, Build und Sprachprüfung sind aktiv.
- Produktions- und Testdaten-Trennung: Fail-closed-Policy, Preflight und Staging-Vorlage sind implementiert.
- Umgebungs-Governance: schreibende Remote-Tests sind außerhalb eindeutig identifizierter Staging- oder Testumgebungen blockiert.
- Extern noch einzurichten: eigener Staging-Host, separates Supabase-Projekt, Stripe Test Mode, eigene Webhooks und synthetische Testdaten.

Das fehlende externe Staging blockiert nicht den read-only Produktions-Smoke-Test. Es bleibt Voraussetzung für Referral-Lifecycle-, Restore- und andere schreibende Nicht-Production-Tests.

## 5. Kommerzielle Wahrheit

Alte Preise wie `299 €/Monat`, `499 €/Monat` oder `Agency ab 990 €/Monat` dürfen nicht wieder eingeführt werden.

| Paket | Status | Preis / Logik |
| --- | --- | --- |
| Öffentliche Demo | aktiv | kostenloser temporärer Demo-Zugang; kein entgeltliches Paket |
| Starter Flex | aktiv | 990 € Einrichtung + 312 €/Monat; Kündigung zum Ende des laufenden bezahlten Abrechnungsmonats |
| Starter 12 Monate | aktiv | 0 € Setup + 312 €/Monat; 12 Monate Mindestlaufzeit, danach monatliche Verlängerung |

Starter-Abos können unter `/settings/package` sicher zum Vertragsende gekündigt werden. Starter Flex endet frühestens zum bezahlten Periodenende; Starter 12 Monate frühestens zum Ende der Mindestlaufzeit. Nach Vertragsende bleiben Account, Login, CRM-Historie, Rechnungen und Export sichtbar; neue Nachrichten, Channel-Sync, externe Ingress-Webhooks, KI-Vorschläge, KI-Analysen und kostenpflichtige Hintergrundverarbeitung sind fail-closed zu deaktivieren.
| Internes Live-Testabo | intern | 1 € pro Tag; ausschließlich klar markierter Test-Workspace; keine Referral-Automation |
| Growth | Coming Soon | nicht produktiv buchbar |
| Agency | Coming Soon / auf Anfrage | nicht als Vollversion freigeschaltet |
| Enterprise / Custom | später | individuelle Prüfung |

### KI-Leistungsstufen

KI Standard, KI Plus und KI Ultra sind keine eigenständigen CRM-Hauptpakete.

- **KI Standard** ist im Starter-Basispaket enthalten.
- **KI Plus** kostet zusätzlich 100 €/Monat und bleibt bis zur Freigabe der Modelle, Kontingente und Billing-Items Coming Soon.
- **KI Ultra** kostet zusätzlich 200 €/Monat und bleibt bis zur Freigabe der Modelle, Kontingente und Billing-Items Coming Soon.
- `src/config/aiTiers.mjs` ist die technische Source of Truth.
- Einrichtung und KI-Add-ons sind nicht referral-rabattfähig.
- Keine KI-Stufe aktiviert automatische Sendung.
- Nicht festgelegte Modelle oder Limits bleiben `null` und dürfen nicht erfunden werden.

### Betreiber- und Steuerstatus

- Vertragspartner: Bernd Guggenberger, Einzelunternehmen unter der Geschäftsbezeichnung FanMind.
- Geschäftsanschrift: Turnerstraße 18, 2345 Brunn am Gebirge, Österreich.
- Inhaber und vertretungsberechtigt: Bernd Guggenberger.
- zuständige Gewerbebehörde: Bezirkshauptmannschaft Mödling.
- Kontakt: kontakt@fanmind.ch, +43 676 5367236.
- Angebot ausschließlich für B2B-Unternehmer.
- `FanMind e.U.` darf erst nach bestätigter Firmenbucheintragung verwendet werden.
- Derzeit wird keine Umsatzsteuer ausgewiesen; Checkout, Angebot und Rechnung folgen dem dokumentierten Kleinunternehmer-Steuermodus.

## 6. Verbindliche Terminologie

- Deutsch: **KI**; Englisch: **AI**.
- Nutzerseitig: **Kontaktwissen**, nicht Memory oder Fan-Gedächtnis.
- Analysebereich: **Kommunikationsübersicht**.
- öffentliche Seiten verwenden Produkt oder aktuelle Version, keinen MVP-Jargon.
- Datenschutz wird konkret beschrieben; keine pauschale Konformitätsgarantie.
- Plattformlogos verwenden die gemeinsame `PlatformLogo`-Komponente.
- Funktionssymbole verwenden die gemeinsame `FanMindFunctionIcon`-Registry.

## 7. Referral Growth Window

Die technische Policy ist vorbereitet, die produktive automatische Verrechnung bleibt deaktiviert.

- 5 % Rabatt je aktiv zahlendem geworbenen Workspace;
- maximal 20 aktive Referrals beziehungsweise 100 % auf die Starter-Grundgebühr;
- globales Growth Window bis 2.000 aktive zahlende Workspaces;
- Rabatt nur auf 312 €/Monat Grundgebühr;
- kein Rabatt auf Einrichtung oder KI-Add-ons;
- Demo- und interne Test-Workspaces ausgeschlossen;
- Kündigung, Zahlungsausfall oder Inaktivität entfernt den betreffenden Rabatt;
- keine Barauszahlung und kein negativer Rechnungsbetrag.

Vor Aktivierung erforderlich:

- separates Supabase-/Stripe-Staging;
- vollständige Lifecycle-Tests;
- Missbrauchsschutz;
- Rechts- und Steuerfreigabe der Teilnahmebedingungen.

## 8. Gefrorener Demo-Pfad

1. Landingpage öffnen.
2. Login oder kostenlose Demo starten.
3. Dashboard zeigen.
4. Kontakte öffnen.
5. CSV-Import kurz zeigen oder Sandra M. öffnen.
6. Kontaktdetail und Nachrichtenkontext zeigen.
7. letzte eingehende Nachricht als KI-Kontext verwenden.
8. KI-Antwortvorschläge erzeugen.
9. Antwort kopieren.
10. Kontaktwissen-Vorschlag speichern.
11. Follow-up-Vorschlag speichern.
12. Follow-up-Liste und Roadmap zeigen.
13. Abschlussfrage: „Wäre dieser Ablauf für euer Team nützlich?“

Das vollständige Sales-Skript steht in `docs/sales/FANMIND_DEMO_SCRIPT.md`.

## 9. Integrationsstatus

Aktiv im Standardprodukt:

- manuelle Kontaktpflege;
- CSV-Import;
- gespeicherter Nachrichtenkontext;
- Webformular- und Inquiry-Grundlagen.

Vorbereitet / Beta / nicht allgemein live verkaufen:

- Meta-, Facebook- und Instagram-Grundlagen;
- Facebook-Reply-Target- und Messenger-Hilfen;
- Telegram-Webhook- und Bot-Grundlagen;
- Stripe Checkout für Starter.

Roadmap / Coming Soon:

- WhatsApp, TikTok, X, Discord und weitere Kanäle;
- vollständige Social-Synchronisation;
- Kampagnen und Analytics;
- komplexe Rollen und Enterprise-Governance;
- Referral-Billing-Automation;
- KI Plus/Ultra Auto-Buchung.

Pflichtsatz:

> Geplante Integrationen werden erst nach technischer und rechtlicher Prüfung umgesetzt. FanMind sendet keine Nachrichten automatisch. Der Mensch prüft, kopiert und sendet final selbst im Originalkanal.

## 10. Security, RLS und Umgebungsgrenzen

- keine Secrets im Repository;
- OpenAI- und Supabase-Service-Role-Keys nur serverseitig;
- `FANMIND_ADMIN_EMAILS` ist die einzige Admin-Quelle;
- alle workspace-bezogenen Daten benötigen RLS und serverseitige Autorisierung;
- jede Mutation prüft User, Workspace und Ressource;
- Demo-Workspaces enthalten keine echten Kundendaten;
- externe Plattform-Login-Daten werden nicht gespeichert;
- schreibende Staging-/Testläufe benötigen alle Bedingungen aus `docs/operations/ENVIRONMENT_SEPARATION.md`;
- kein Restore gegen Production.

## 11. Datenbank-Source-of-Truth

Verbindliche Quellen:

- `docs/database/fanmind_current_schema.md`;
- `supabase/migrations/`;
- `src/lib/supabase/server.ts`.

Relevante Objekte umfassen unter anderem:

- `profiles`, `workspaces`, `workspace_members`;
- `contacts`, `memories`, `followups`;
- `conversations`, `conversation_messages`, `conversation_summaries`;
- `contact_ai_profiles`, `workspace_voice_profiles`, `fan_analysis_reports`;
- `contact_reply_targets`, `social_connections`, `meta_webhook_events`;
- Billing-, Referral-, Inquiry-, Operations- und Backup-Tabellen laut aktueller Migrationen.

Interne Tabellen- oder Feature-Keys wie `memories`, `memory` oder `pilot` dürfen aus Kompatibilitätsgründen bestehen bleiben, sind aber keine öffentliche Terminologie.

## 12. KI und Kostenbeobachtung

- serverseitige Endpunkte;
- kein API-Key im Browser;
- begrenzte Eingabelänge und Rate Limits;
- strukturierte Ausgabe;
- Usage-Logging und geschätzte Token-/Kostenwerte;
- Admin-Dashboard `/admin/ai-usage`;
- optionale Soft-Hinweise sind weder vertragliche Kontingente noch automatische Sperren;
- keine automatische Sendefunktion.

Details: `docs/AI_COST_MONITORING.md`.

## 13. Finale technische Go-Live-Freigabe

- automatischer read-only Preflight: `npm run smoke:go-live:public`;
- permanenter Workflow `FanMind Final Go-Live Readiness` nach erfolgreichem Production-Deploy;
- vollständiges Runbook: `docs/operations/FINAL_GO_LIVE_SMOKE_TEST.md`;
- Sales-One-Pager, Demo-Skript und Einwandbehandlung: `docs/sales/`;
- technische Freigabe und externe Steuer-/Rechtsfreigabe werden getrennt dokumentiert;
- Referral-Billing, KI Plus/Ultra Auto-Buchung und schreibende Staging-Tests bleiben bis zur separaten Freigabe deaktiviert.

## 14. Reader-Synchronisierung

Bei Änderungen an Preis, Paketen, Referral, aktivem Scope, Demo, Integrationen, Billing, KI, Datenbank, Security oder öffentlichen Versprechen müssen mindestens geprüft werden:

- `docs/SOURCE_OF_TRUTH.md`;
- `README.md`;
- `AGENTS.md`;
- `docs/database/fanmind_current_schema.md`;
- `apps/mobile/README.md`, `docs/mobile/ARCHITECTURE.md` und `docs/mobile/BETA_RELEASE.md` bei Mobile- oder Backend-Vertragsänderungen;
- relevante Security-, KI-, Referral-, Landingpage- und Legal-Dateien.
