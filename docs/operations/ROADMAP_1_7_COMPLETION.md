# Roadmap 1–7: technischer Abschlussvertrag

Stand: 16. August 2026

Dieses Dokument begrenzt den aktuellen Abschlussauftrag auf die FanMind-
Roadmap-Punkte 1 bis einschließlich 7. Punkt 8 und alle späteren Punkte bleiben
außerhalb dieses Arbeitsumfangs. Ein vorhandener Codepfad, ein grüner Offline-
Test oder ein vorbereiteter Workflow ersetzt niemals einen erforderlichen
Staging-, externen oder Production-Nachweis.

## Statusklassen

Jeder noch offene Schritt gehört genau einer der folgenden Klassen:

1. **Code** – im Repository vollständig implementierbar und lokal/CI-seitig
   prüfbar.
2. **Staging/Infrastruktur** – benötigt eine getrennte Nicht-Production-
   Umgebung, synthetische Identitäten oder einen kontrollierten Runner.
3. **Extern** – benötigt Anbieterzugang, App Review, Business Verification,
   Signing, Store-/Portalzugriff oder eine rechtliche/steuerliche Freigabe.
4. **Production-Aktivierung** – benötigt nach allen vorherigen Gates einen
   exakten, geschützten und separat bestätigten Production-Schritt.

`Extern` und `Production-Aktivierung` dürfen nicht allein durch einen Merge als
erledigt markiert werden.

## Priorität 1: regulärer Gerhard-Benutzerfluss

| Fähigkeit | Code | Staging/Infrastruktur | Extern | Production-Aktivierung |
| --- | --- | --- | --- | --- |
| Registrierung/Login und regulärer Workspace | implementiert; server-owned Provisionierung und Workspace-Guards vorhanden | wiederverwendbare synthetische Owner-/Member-Identitäten und Browser-Acceptance vollständig ausführen | E-Mail-Zustellung und produktive Providerkonfiguration prüfen | exakten Release, `/api/version`, Login und Workspace-Erzeugung abnehmen |
| Dashboard und Fans/Kontakte | implementiert | echten synthetischen Kontaktfluss im isolierten Staging abnehmen | – | Live-Read-only-Smoke nach Deploy |
| Conversations/Nachrichten und Inbox | CRM-Speicher und gemeinsame Inbox implementiert; Assignment bleibt bis zum Spaltenrollout fail-closed | Conversation-/Assignment-RLS und vollständigen Kernflow abnehmen | – | Assignment erst nach eigenem kontrollierten Schema- und Releasegate aktivieren |
| KI Standard | serverseitige strukturierte Antwortvorschläge, Kostenmessung und Rate Limit implementiert | synthetischen Provider-/Fehler-/Speicherflow abnehmen | produktive OpenAI-Konfiguration und fachliche Qualitätsprüfung | nur nach grünem Health-/Kosten-/Qualitätsgate |
| Memory und Follow-ups | Speichern, Bearbeiten, Löschen, Abschließen und Wiederöffnen implementiert | im vollständigen Browser-Kernflow prüfen | – | Live-Smoke ohne Kundendatenmutation |

Der reguläre Kernflow hat Vorrang vor neuen Integrationsflächen. Ein Kanal darf
den Flow nicht blockieren und FanMind sendet keine Nachricht automatisch.

Der deterministische lokale Browser-Code-Nachweis ist mit
`npm run test:e2e:core-flow` geschlossen: Er führt Login, Dashboard, Inbox,
Fan-Detail, KI-Vorschläge, Kopieren, Kontaktwissen und den vollständigen
Follow-up-Lifecycle über echte FanMind-Routen und Server-Actions gegen eine
ausschließlich lokale Provider-Fixture aus. Nur die KI-Antwort wird
synthetisch erfüllt. Die isolierte Staging-, echte Provider- und
Production-Abnahme bleiben dadurch unverändert offen.

## Roadmap 1 – Produktkern

- **Code:** Login, Registrierung, Workspace, Dashboard, Kontakte, CSV-Import,
  Kontaktwissen, KI Standard, Follow-ups und Inbox sind vorhanden. Die
  zusammenhängende deterministische lokale Browser-Abnahme schützt den
  regulären Gerhard-Fluss über echte App-Routen; Provider- und Stagingbelege
  werden bewusst nicht simuliert.
- **Staging/Infrastruktur:** regulären Owner und getrennten Member mit
  synthetischem Kontakt durch den vollständigen Flow führen.
- **Extern:** produktive E-Mail- und OpenAI-Konfiguration sowie fachliche
  Antwortqualitätsprüfung.
- **Production-Aktivierung:** commitgenauer Deploy sowie Health-, Version- und
  Kernflow-Smoke.

## Roadmap 2 – Import und Datenqualität

- **Code:** Feldzuordnung, Validierung, Mapping, Duplikaterkennung und
  Segmentvorbereitung sind implementiert; Importgrenzen müssen in den
  Regressionstests erhalten bleiben.
- **Staging/Infrastruktur:** synthetische CSV mit Duplikaten, ungültigen Zeilen
  und Workspace-Isolation importieren und vollständig bereinigen.
- **Extern:** keine Anbieterfreigabe erforderlich.
- **Production-Aktivierung:** nur read-only Produkt-Smoke; keine echten
  Kundendaten als Abnahmefixture.

## Roadmap 3 – Facebook, Instagram und WhatsApp

- **Code:** Facebook-/Instagram-OAuth, explizite Ressourcenauswahl, Webhook-
  Ingestion, begrenzte Historie, Content-Cache, Conversation-Fortsetzung und
  Catch-up-Queue sind vorbereitet. WhatsApp besitzt nur Parser-/Speicher-
  Grundlage und bleibt ohne eigenen freigegebenen Cloud-API-Kontrollpfad
  inaktiv. Kein Kanal darf allgemein live erscheinen.
- **Staging/Infrastruktur:** Meta-Continuation und Catch-up-Queue kontrolliert
  anwenden, rollback-only Acceptances, Workspace-Processing und echten
  synthetischen Webhook-/Cursor-E2E ausführen. Für WhatsApp sind getrennte
  Cloud-API-Fixtures, Tenant-Bindung, Signaturprüfung, Idempotenz und Cleanup
  erforderlich.
- **Extern:** Meta App Review, Advanced Access, Business Verification,
  WhatsApp-Cloud-API-Zugang sowie Rechtsgrundlage, Transparenz, AVV und
  Aufbewahrungsfreigabe.
- **Production-Aktivierung:** eigene checksum-, environment-, release- und
  workspacegebundene Aktivierung; Flags bleiben vorher aus.

## Roadmap 4 – Production und Billing

- **Code:** Starter-Billing, Stripe-Signatur-/Replay-Schutz, Rechnungen,
  Kündigung, Admin- und Operations-Grundlagen sind implementiert.
- **Staging/Infrastruktur:** Stripe-Testwebhook, vollständigen Billing-Lifecycle
  und dauerhafte synthetische Fixtures abnehmen.
- **Extern:** Steuerfreigabe, Stripe-Vertrags-/Kontonachweise und rechtliche
  Angebots-/Rechnungsprüfung.
- **Production-Aktivierung:** Billing- oder Steueränderungen nur über getrennte
  Freigabe; normaler Deploy aktiviert keine vorbereitete Erweiterung.

## Roadmap 5 – Produktion und Testumgebung

- **Code:** Environment-Governance, isolierter Releasepfad, Backups,
  Monitoring, Audit und Restore-Runner sind vorbereitet. Der sichere
  Releasepfad muss der verbindliche Normalfall bleiben.
- **Staging/Infrastruktur:** echten Restore-Drill einschließlich 5/5/5-
  Postcheck, Storage-/Serverprüfung und Wegwerfziel-Cleanup abschließen.
- **Extern:** geschützte Runner-/Environment-Verwaltung und gegebenenfalls
  Offsite-Providerzugang.
- **Production-Aktivierung:** Trigger-Hardening und weitere kontrollierte DDL
  ausschließlich nach read-only Vor-/Nachprüfung und erneuter Bestätigung.

## Roadmap 6 – Mobile App

- **Code:** nativer Expo-Kern, Auth/Recovery, Kontakte, Memory, KI, Follow-ups,
  sicherer Offline-Cache, lokaler Purge, Copy/Share und Pushregistrierungs-
  Vorbereitung sind vorhanden.
- **Staging/Infrastruktur:** Push-Acceptance, signierte interne Builds und
  private Android-/iOS-Geräteabnahme durchführen.
- **Extern:** Expo/EAS-Projekt, Signing Credentials, Apple Developer/App Store
  Connect, Google Play, TestFlight, Store-Datenschutz und Portalabnahme.
- **Production-Aktivierung:** Pushzustellung, Store-Verteilung und produktive
  Mobile-Environments bleiben eigene explizite Schritte.

## Roadmap 7 – TikTok, X/Twitter, Discord und OnlyFans-Prüfung

- **Code:** nur offizielle, providerfreie Verträge, Import-/Intake-Grenzen,
  Tenant-Isolation, Copy-&-Open und fail-closed Featureflags vorbereiten.
  OnlyFans bleibt eine nicht bindende technische und rechtliche Evaluation;
  ohne freigegebene offizielle API wird keine Integration implementiert.
- **Staging/Infrastruktur:** pro tatsächlich freigegebenem Anbieter getrennte
  synthetische Fixtures, Signatur-/OAuth-, RLS-, Idempotenz-, Disconnect- und
  Cleanup-Acceptance.
- **Extern:** offizielle API-Zugänge und Reviews für TikTok, X und Discord sowie
  separate technische/rechtliche Entscheidung zu OnlyFans. Scraping und
  Speicherung von Plattformpasswörtern bleiben ausgeschlossen.
- **Production-Aktivierung:** jeder Kanal einzeln, workspacegebunden und erst
  nach Technik-, Provider- und Rechtsgate; kein gemeinsamer globaler Schalter.

## Querschnitt: KI Plus und Ultra

KI Plus/Ultra gehören zum Abschlussumfang 1–7, sind aber vor den folgenden
Gates weiterhin nicht buchbar:

- **Code:** tier-spezifische Modelle/Fallbacks, harte Nutzungsdurchsetzung,
  idempotenter Stripe-Item-Lifecycle und produktive Entitlement-Verdrahtung.
- **Staging/Infrastruktur:** Katalog-, Lifecycle-, Owner/Member-, Kosten- und
  rollback-only Acceptance.
- **Extern:** private geblendete Qualitätsevaluation, Providerfreigabe sowie
  rechtliche und steuerliche Freigabe.
- **Production-Aktivierung:** Plus und Ultra getrennt aktivieren; fehlende oder
  unvollständige Evidenz fällt immer auf Standard zurück.

## Verbotene Abschlussbehauptungen

- Kein externer Provider-, Store-, Signing-, Rechts- oder Steuerstatus wird aus
  Repositorytests abgeleitet.
- Kein Staging-Apply gilt als Production-Aktivierung.
- Kein vorbereiteter Parser, OAuth-Callback oder Webhook gilt als allgemein
  aktive Integration.
- Keine Phase-8- oder spätere Funktion wird in diesem Abschlussauftrag gebaut
  oder als Fortschritt der Phasen 1–7 gezählt.
