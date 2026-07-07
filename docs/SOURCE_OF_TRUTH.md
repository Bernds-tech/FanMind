# FanMind Source of Truth

Stand: Juli 2026

Dieses Dokument ist die fachliche Source of Truth für FanMind. README, AGENTS.md, Landingpage, Pricing, Legal-Texte, Datenbank-Dokumentation und Codex-Tasks müssen mit diesem Stand synchron bleiben.

## 1. Produktdefinition

FanMind ist ein KI-gestütztes CRM und Copy-&-Open-Kommunikationssystem für Fan-/Kontaktbeziehungen.

FanMind ist:

- ein CRM-Kern für Kontakte/Fans;
- ein Arbeitsbereich für Nachrichtenkontext, Memory und Follow-ups;
- ein serverseitiger KI-Assistent für Antwortvorschläge;
- ein Copy-&-Open-Assistent: Antwort vorbereiten, kopieren, Originalkanal öffnen, Mensch sendet selbst;
- ein System mit ehrlicher Roadmap für Integrationen, Kampagnen, Analytics und Automationen.

FanMind ist nicht:

- ein Bot;
- ein Autoresponder;
- eine Scraping-Plattform;
- eine voll aktive Social-Media-Synchronisationsplattform für alle Kanäle;
- eine Kampagnenversand-Maschine;
- eine vollständige Enterprise-Rollen-/Analytics-/Payment-Suite.

## 2. Aktiver MVP-/CRM-Kern

Aktiv bzw. produktnah im aktuellen Stand:

- Landingpage und Roadmap
- Login
- Registrierung für Pilot und Starter
- temporärer Demo-Workspace
- geschütztes Dashboard
- Fans/Kontakte
- Fan-/Kontaktdetail
- CSV-Import
- manuelle Kontaktpflege
- gespeicherter Nachrichten-/Conversation-Kontext
- Memory
- Follow-ups
- serverseitige KI-Antwortvorschläge
- Memory-Vorschlag aus KI-Ausgabe
- Follow-up-Vorschlag aus KI-Ausgabe
- Kopieren von Antwortvorschlägen
- Admin-/Billing-Grundlagen
- Admin-only Freischaltung kostenfreier interner Testzugänge ohne Änderung der normalen Kundenlogik, inklusive serverseitig vorbereiteter Test-Flags für AI Maintenance
- Stripe-Test-/Setup-Checkout für Pilot/Starter, wenn ENV vollständig gesetzt ist
- Legal-Seiten und Zahlungsbedingungen

## 3. Kommerzielle Wahrheit

Alte Preise wie `299 €/Monat`, `499 €/Monat` oder `Agency ab 990 €/Monat` dürfen nicht wieder eingeführt werden, solange dieses Dokument nicht bewusst geändert wird.

| Paket | Status | Preis / Logik |
| --- | --- | --- |
| Pilot / Setup | aktiv | 990 € einmalig, 1 Testmonat, keine automatische Verlängerung |
| Starter Flex | aktiv | 990 € Setup + 312 €/Monat, monatlich kündbar |
| Starter 12 Monate | aktiv | 0 € Setup + 312 €/Monat, 12 Monate Laufzeit |
| Growth | Coming Soon | nicht produktiv buchbar |
| Agency | Coming Soon / auf Anfrage | nicht produktiv als Vollversion freigeschaltet |
| Enterprise / Custom | später | individuelle Prüfung |

Begründung für 312 €/Monat: FanMind ist kein Billig-Tool und der Aufwand liegt in sicherer CRM-Struktur, KI, Memory, Follow-ups, Datenpflege, Demo-Setup, Support, Security/RLS und späterer kontrollierter Integrationsfähigkeit. Die Preislogik soll diesen Arbeitsaufwand und B2B-Charakter widerspiegeln.

## 4. Referral Growth Window

Geplant ist ein begrenztes Referral-Programm, das nicht nur den ersten 100 Nutzern vorbehalten ist. Stattdessen läuft die Aktion, bis FanMind global `2.000` aktive zahlende FanMind-Kunden/Workspaces erreicht.

Kernlogik:

- Jeder berechtigte zahlende FanMind-Nutzer kann während des offenen Referral Growth Windows einen persönlichen Referral-Link oder Referral-Code nutzen.
- Für jeden aktiv zahlenden geworbenen Kunden/Workspace erhält der Referrer `5 %` Rabatt auf seine eigenen laufenden FanMind-Kosten.
- Maximal zählen `20` aktive geworbene Kunden/Workspaces pro Referrer.
- Bei 20 aktiven geworbenen Kunden/Workspaces ergibt sich rechnerisch `100 %` Rabatt auf die laufenden FanMind-Kosten.
- Wenn ein geworbener Kunde kündigt, nicht mehr zahlt, gesperrt wird oder inaktiv wird, fällt dessen `5 %` wieder weg.
- Sobald der 2.000. aktive zahlende FanMind-Kunde/Workspace erreicht ist, wird das Referral Growth Window geschlossen.
- Nach Schließung bleiben bereits erworbene aktive Referral-Rabatte bestehen, solange die geworbenen Kunden aktiv bleiben.
- Nach Schließung können keine neuen zusätzlichen Rabattprozente mehr verdient werden, außer FanMind fällt wieder unter die definierte Schwelle und öffnet das Growth Window ausdrücklich erneut.
- Rabatte werden nicht automatisch bar ausgezahlt und dürfen nicht unter 0 € fallen.

Status:

- Roadmap / Growth-Programm, noch nicht als automatische Billing-Funktion aktiv.
- Darf nur mit klarer Begrenzung kommuniziert werden: Aktion bis 2.000 aktive zahlende Kunden/Workspaces, maximal 20 aktive Referrals pro Referrer, Rabatt nur solange geworbene Kunden aktiv bleiben. Phase 2 zeigt berechtigten Workspaces Link/Code und Status und speichert Signup-Attributionen; Billing-Verrechnung bleibt separat geprüft.
- Vor Umsetzung müssen Tracking, Billing-Verrechnung, Missbrauchsschutz, Datenschutz, AGB/Zahlungsbedingungen und steuerliche Behandlung geprüft werden.
- Details stehen in `docs/REFERRAL_PROGRAM.md`.

## 5. Gefrorener Gerhard-Demo-Pfad

Der Demo-Pfad ist fest. Er darf optisch anders umgesetzt sein, aber fachlich bleibt die Reihenfolge:

1. Landingpage öffnen.
2. Login oder Demo starten.
3. Dashboard zeigen.
4. Fans/Kontakte öffnen.
5. Entweder CSV-Import kurz zeigen oder Sandra/demo-Kontakt öffnen.
6. Kontaktdetail öffnen.
7. Nachrichten-/Conversation-Kontext zeigen.
8. letzte eingehende Nachricht als KI-Kontext verwenden.
9. KI-Antwortvorschläge erzeugen.
10. Antwort kopieren.
11. Memory-Vorschlag speichern.
12. Follow-up-Vorschlag speichern.
13. Follow-up-Liste und/oder Roadmap zeigen.
14. Abschlussfrage stellen: „Wäre dieser Ablauf für eure Agentur / euer Team nützlich?“

Alles, was nicht zu diesem Pfad gehört, wird für Gerhards Standarddemo versteckt, admin-only gemacht, feature-geflaggt oder als Roadmap/Beta klar markiert.

## 6. Roadmap-Statuslogik

| Status | Bedeutung | Darf wie aktiv verkauft werden? |
| --- | --- | --- |
| Aktiv / verfügbar | im MVP-Kern real nutzbar | Ja, mit realistischen Grenzen |
| Demo | nur Beispielworkspace oder Testzugang | Ja, aber nicht als Kundendatenbetrieb darstellen |
| Preview / Beta / vorbereitet | technisch begonnen, nicht allgemein freigegeben | Nein, nur als Pilot/Prüfstand erklären |
| Coming Soon | geplant, aber nicht nutzbar | Nein |
| Roadmap | späterer Ausbau | Nein |
| Hidden / admin-only | nicht öffentlich zeigen | Nein |

Pflichtsatz für Integrationen:

> Geplante Integrationen werden erst nach technischer und rechtlicher Prüfung umgesetzt. FanMind sendet keine Nachrichten automatisch. Im Standard-Workflow prüft der Mensch, kopiert die Antwort und sendet final selbst im Originalkanal.

## 7. Integrationsstatus

Aktiv im Standard-MVP:

- manuelle Kontaktpflege
- CSV-Import
- gespeicherter Nachrichten-/Conversation-Kontext
- Webformular-/Inquiry-Grundlagen, soweit serverseitig implementiert

Vorbereitet / Beta / nicht allgemein live verkaufen:

- Meta/Facebook/Instagram Webhooks und Social Connections
- Facebook-Reply-Target-/Messenger-Hilfen
- Telegram-Webhook-/Bot-Grundlagen
- Stripe Checkout / SEPA Setup für Pilot/Starter

Roadmap / Coming Soon:

- WhatsApp
- TikTok
- X/Twitter
- Discord
- vollautomatische Social-Synchronisation
- Kampagnen
- Analytics/Reichweite
- Rollen/Rechte-Komplexität
- Enterprise-Governance
- Referral-Growth-Window-Automation, bis Tracking/Billing/Legal fertig ist

Sonderregel Telegram:

- Jede echte Telegram-Sendefunktion ist nicht Teil der Standard-Copy-&-Open-Demo.
- Wenn Telegram-Senden im Code existiert, muss es deaktiviert, versteckt, admin-/pilot-only oder ausdrücklich als validierter Pilot markiert werden.
- Der Standardnutzer darf nicht den Eindruck bekommen, FanMind sei bereits ein In-App-Sendewerkzeug.

## 8. Security / RLS / Secrets

Vor Pilotkundendaten, Integration-Aktivierung oder Billing-Aktivierung muss `docs/SECURITY_RLS_SECRETS_CHECK.md` abgearbeitet werden.

Kernregeln:

- keine Secrets im Repository;
- `OPENAI_API_KEY` nur serverseitig;
- `SUPABASE_SERVICE_ROLE_KEY` nur serverseitig;
- `FANMIND_ADMIN_EMAILS` ist einzige Admin-Quelle;
- keine hardcodierten echten Admin-Adressen;
- alle workspace-scoped Daten müssen per RLS und serverseitiger Autorisierung geschützt sein;
- jede API-Mutation muss User, Workspace und Ressource prüfen;
- Demo-Workspaces dürfen keine echten Kundendaten enthalten;
- externe Plattform-Login-Daten werden nicht gespeichert.

## 9. Datenbank-Source-of-Truth

Die aktuelle Datenbankwahrheit steht in:

- `docs/database/fanmind_current_schema.md`
- `supabase/migrations/`
- `src/lib/supabase/server.ts`

Die alte Datei `docs/database/fanmind_mvp_schema.sql` ist nur noch ein historischer Auth-/Workspace-Basisstand und darf nicht mehr als vollständiges Schema gelesen werden.

Aktuell relevante Objekte:

- `profiles`
- `workspaces`
- `workspace_members`
- `contacts`
- `memories`
- `followups`
- `conversations`
- `conversation_messages`
- `conversation_summaries`
- `contact_ai_profiles`
- `workspace_voice_profiles`
- `fan_analysis_reports`
- `contact_reply_targets`
- `social_connections`
- `meta_webhook_events`
- Billing-Felder an `workspaces`
- Inquiry-/Pilot-Anfrage-Tabellen, soweit in Migrations vorhanden
- spätere Referral-Tabellen laut `docs/REFERRAL_PROGRAM.md`

## 10. KI und Kostenbeobachtung

Aktuell muss die KI sicher und kostenbewusst laufen:

- serverseitiger Endpunkt;
- kein API-Key im Browser;
- limitierte Inputlänge;
- Rate Limit;
- strukturierte Ausgabe;
- keine automatische Sendefunktion.

Aktiver Ausbau:

- Usage-Logging je Workspace, User, Kontakt, Feature, Modell und Zeitraum für Reply Suggestions und Fan-Analyse;
- Schätzung von Input-/Output-Tokens;
- Berechnung von Kosten über serverseitig gepflegte Modellpreise;
- Admin-Dashboard `/admin/ai-usage` für Gesamtverbrauch, Workspaces, Features und Zeitraum;
- Werte werden als geschätzt markiert;
- Workspace-Detail, Kosten pro Fan und Warnschwellen bleiben weitere Ausbaustufen.

Details stehen in `docs/AI_COST_MONITORING.md`.

## 11. Reader-Synchronisierung

Wenn eine Änderung eines dieser Themen berührt, müssen Reader/Dokumente im selben PR geprüft und aktualisiert werden:

- Preis/Pakete/Commercial Terms
- Referral-/Rabattlogik
- aktiver MVP-Scope
- Demo-Pfad
- Integrationsstatus
- Billing-/Stripe-Verhalten
- KI-Modell oder KI-Kostenlogik
- Datenbanktabellen/RLS
- Secrets/Security
- öffentliche Landingpage-Versprechen
- Legal-/Zahlungsbedingungen, falls Preis, Referral oder Leistungsgrenzen betroffen sind

Pflichtdateien für Synchronisierung:

- `docs/SOURCE_OF_TRUTH.md`
- `README.md`
- `AGENTS.md`
- `docs/database/fanmind_current_schema.md`
- `docs/SECURITY_RLS_SECRETS_CHECK.md`, wenn Security/RLS/Secrets betroffen sind
- `docs/AI_COST_MONITORING.md`, wenn KI/Kosten betroffen sind
- `docs/REFERRAL_PROGRAM.md`, wenn Referral/Rabatte betroffen sind
- Landingpage/Legal/Pricing-Code, wenn öffentliche Aussagen betroffen sind
