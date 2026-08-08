# FanMind P0-Abschluss-Tracker

Stand: 8. August 2026

GitHub-Issue [#640](https://github.com/Bernds-tech/FanMind/issues/640) ist der laufende, verbindliche Arbeits- und Nachweis-Tracker. Dieses Dokument hält die dauerhafte Repository-Zusammenfassung fest, damit bereits erledigte Arbeit nicht erneut umgesetzt wird.

## Statusmodell

Ein Punkt gilt erst dann als vollständig abgeschlossen, wenn alle zutreffenden Ebenen dokumentiert sind:

1. **Code:** Implementierung in `main`.
2. **Prüfung:** Product Truth, Lint, Operations-Tests, Mobile-CI und Production-Build grün.
3. **Deployment:** erwarteter Commit durch `/api/version` nachgewiesen.
4. **Production-Abnahme:** öffentliche Produktwahrheit und Kernrouten gegen die tatsächlich ausgelieferte Anwendung geprüft.
5. **Externe Freigabe:** nur dort, wo Recht, Steuer, Store-Konten oder externe Infrastruktur erforderlich sind.

Eine Änderung auf dem P0-Branch ist damit noch kein Abschlussnachweis. Dieser Tracker trennt bewusst zwischen **umgesetzt**, **gemergt**, **deployed** und **extern abgenommen**.

## Kanonischer Fortschrittsstand

Die Prozentwerte sind konservative Managementwerte. Sie ersetzen keinen der
oben definierten technischen oder externen Nachweise.

| Abschlussblock | Vorher | Jetzt | Nächstes Abschluss-Gate |
| --- | ---: | ---: | --- |
| Echtes Staging | 76 % | **80 %** | eigene Web-Staging-VM mit Runner, DNS/TLS, Deploy, E2E und Stripe-Testbindung |
| Restore-Drill | 82 % | **82 %** | echter Restore auf ein leeres, wegwerfbares PostgreSQL-17-Ziel samt Postcheck und Cleanup |
| Mobile Signing/TestFlight | 68 % | **68 %** | signierte Android-/iOS-Preview-Builds und Realgeräteabnahme |
| Offline/Push/Stores | 88 % | **89 %** | Push-Staging-Acceptance, private Gerätetests und Store-Abnahme |
| Security/Dependencies | 99 % | **99 %** | finale Live- und externe Prüfung |
| Recht/Steuer/AVV | 56 % | **56 %** | externe Rechts-, Steuer-, AVV- und Providerbelege |
| Meta Events Manager | 92 % | **94 %** | synthetischer Meta-E2E, App Review und Rechtsfreigabe |
| KI Standard/Plus/Ultra | 87 % | **89 %** | Stripe-Testpreise, Lifecycle- sowie Qualitäts-/Kostenabnahme |

- Produkt-/MVP-Stand: **ca. 89 %**
- Abschlussreife der acht Blöcke: **ca. 82 %**
- Repository-technische Vorbereitung: **ca. 86 %**

### Arbeits- und Umsatzsystem als eigener Produktquerschnitt

Die acht Abschlussblöcke messen vor allem technische und externe Abschlussreife.
Das Zielsystem wird deshalb zusätzlich eigenständig geführt:

| Produktfähigkeit | Stand | Offene Grenze |
| --- | --- | --- |
| Kontaktwissen / Fan-Gedächtnis | MVP gebaut | automatische Analyse bleibt bis Staging-, Meta- und Rechtsfreigabe aus |
| KI-Antwortvorschläge | KI Standard gebaut | Plus/Ultra bleiben bis vollständiger Readiness und Stripe-Abnahme fail-closed |
| Kontakte | gebaut | keine bekannte P0-Kernlücke |
| Follow-ups | gebaut | keine automatische Nachrichtenzustellung |
| Kanalübergreifende Organisation | teilgebaut | gemeinsame Inbox und Meta-Beta vorhanden; weitere Kanäle bleiben Roadmap |
| Teamarbeit | Basis teilgebaut | Einladungen, differenzierte Rollen und Agency-/Multi-Client-Steuerung offen |
| Erfolgsmessung | teilgebaut | operative KPIs und KI-Kosten vorhanden; vollständige Umsatz-/Kampagnenanalyse offen |

FanMind bleibt dabei ein spezialisiertes Arbeits- und Umsatzsystem, in dem der
Mensch jede externe Nachricht selbst prüft und sendet. Phase 7 zählt nicht in
die acht Abschlussblöcke; OnlyFans bleibt ausschließlich eine unverbindliche
spätere Prüfung.

### Offene Arbeits- und Nachweiszeilen

| Arbeitszeile | Aktueller Stand |
| --- | --- |
| Migration und checksum-only Prüfung | Staging-Schemata angewendet und nachgeprüft; Ledger-Alias-Guard noch zu mergen |
| Echtes Staging und Restore-Drill | separates Supabase-Staging vorhanden; Web-Staging-VM und echter Restore offen |
| KI Plus/Ultra und Stripe-Abnahme | Entitlement-Schema auf Staging; Stripe-Testkatalog und rollback-only Acceptance offen |
| Meta-Abschluss | Foundation, History und Tenant-Idempotenz auf Staging; E2E, App Review und Recht offen |
| Mobile Signing, Android-Beta und TestFlight | kontrollierte Workflows vorhanden; signierte Binaries und Verteilung offen |
| Push, Gerätetests und Store-Unterlagen | Push-Schema auf Staging und Unterlagen vorbereitet; Acceptance und externe Nachweise offen |
| Technische Rechts-/AVV-Unterlagen | Arbeitsfassungen, Register und Validatoren vorhanden |
| Externe Rechts-/Steuerfreigaben | Rechts-, Steuer-, AVV- und Providerbelege weiterhin extern offen |

## Ausgangsstand

- Ausgangs-`main`: `c40ff79a6ffa2393cf70c9a4a71a6a5ea0e79201`.
- PR #637 enthält bereits die sichere Self-Service-Kündigung und den Archiv-/Lesemodus.
- Der ältere konfliktbehaftete PR #636 wurde deshalb ohne Merge geschlossen; die Kündigungslogik wird nicht doppelt gebaut.
- Die native Mobile-App unter `apps/mobile` ist bereits ein eigenständiger React-Native-/Expo-Kern und keine WebView-Hülle.
- Der historische P0-Branch `p0/completion-20260722` und PR #641 sind
  abgeschlossen; der aktuelle Stand wird ausschließlich aus `main`, dem
  Production-Commit und den externen Nachweisen abgeleitet.

## P0-Änderungsblöcke

### Live-Produktwahrheit und Deployment-Gate

- gemeinsame Source of Truth für tatsächlich ausgelieferten Text unter `scripts/public-product-truth.mjs`;
- finaler Go-Live-Preflight und unmittelbarer Deployment-Smoke verwenden dieselben Regeln;
- der Deployment-Smoke prüft zusätzlich `/api/version`, Production-Environment und `/api/health`;
- Pflichtkomponenten wie Anwendung, Supabase, Stripe und OpenAI blockieren bei einem ungesunden Zustand;
- optionale E-Mail-Konfiguration wird als Warnung behandelt und verursacht ohne produktive Pflicht keinen falschen Rollback;
- alte Preise, aktives Pilot-Angebot, `zzgl. USt.`, MVP-/Memory-Terminologie und andere bekannte Drift werden als Deployment-Fehler behandelt;
- ein einmaliger read-only Production-Runtime-Audit hat Node, npm, PM2, Server-HEAD, `origin/main`, Live-Commit, Environment und Health geprüft; der temporäre Audit-Workflow wurde danach wieder entfernt.

### Mobile

- kanonischer abgeschlossener Follow-up-Status: `completed`;
- bestehende Altdaten mit `done` bleiben rückwärtskompatibel und werden nicht als offen gezählt;
- Mobile schreibt neue Abschlüsse als `completed`;
- Web-Kontaktdetail, Zähler und Mobile-Listen verwenden dieselbe Statuswahrheit;
- Regressionstest verhindert eine erneute Abweichung zwischen Web und Mobile;
- Expo-SDK-57-Abhängigkeiten werden exakt und reproduzierbar gelockt; transitive Worklets-Versionen dürfen nicht unkontrolliert auf eine inkompatible Veröffentlichung springen.
- ein manueller, nur von `main` startbarer Read-only-EAS-Ressourcencheck ist
  vorbereitet und an getrennte geschützte Mobile-Environments gebunden;
- der Check bestätigt Projekt-/Owner-Bindung, App-Identität und ausschließlich
  öffentliche Clientwerte, ohne Build, Submit, Update oder Signing-Zugriff;
- ein getrenntes manuelles Gate kann nach derselben Ressourcenprüfung genau
  einen credential-frozen Development-/Preview-Build auf Android oder iOS
  einreihen; Production, Submit, Update und Credential-Erzeugung bleiben
  blockiert, und der Queue-Nachweis gilt nicht als fertiges Binary;
- eigenständige 1024×1024-Icon-Quellen und getrennte PNG-Verträge für
  iOS/Legacy-Android sowie Android Adaptive Icon sind im Native-Prebuild
  abgesichert; die visuelle Abnahme bleibt beim signierten Realgeräte-Build;
- iOS-Privacy-Manifest, fehlende Tracking-Domains, minimale native
  Berechtigungen und Android API 36 werden im isolierten Prebuild geprüft;
- getrennte technische Entwürfe für Apple App Privacy und Google Play Data
  Safety sind vorbereitet, bleiben aber bis zum signierten Build und zur
  externen Datenschutz-/Rechtsfreigabe unveröffentlicht;
- der externe Lauf, signierte Android-/iOS-Builds und Store-Verteilung bleiben
  offen.

### PDF-Datenauskunft

- alter Mailto-Ablauf und zusätzlicher Abmelden-Button aus der Datenauskunftskarte entfernt;
- ein lokalisierter, authentifizierter PDF-Download bleibt als einzige Kartenaktion;
- Export enthält sichere Konto-, Workspace-, Vertrags- und Kontaktdaten;
- keine Secrets, Tokens, Sessiondaten, Stripe-IDs, Admin-Notizen oder fremden Workspace-Daten;
- Kontaktabfrage erfolgt stabil paginiert mit angemeldeter User-Session und bestehender RLS, nicht mit einer Service Role;
- jede Kontaktzeile wird erneut gegen den autorisierten Workspace geprüft;
- doppelte IDs, instabile Pagination, ungültige Seiten oder mehr als die definierte Sicherheitsobergrenze brechen explizit ab, statt Daten still abzuschneiden;
- mehrseitige PDF-Erzeugung erfolgt als PDF/A-2u mit NFC-Normalisierung und eingebetteten Noto-Schriften;
- nicht-lateinische Namen und Inhalte bleiben zusätzlich als exaktes Unicode-`ActualText` im getaggten PDF erhalten;
- deutsche und englische Ausgabe sowie ehrliche Leerzustände;
- Regressionstests decken 140 PDF-Kontakte, 1.201 paginierte Kontakte, Sicherheitsgrenze, Workspace-Grenze sowie kyrillische, griechische, chinesische, polnische, arabische und Emoji-Daten ab.

### Zentrale Produktdokumentation

- Mobile wird in `docs/SOURCE_OF_TRUTH.md`, `README.md`, `AGENTS.md` und der Roadmap als eigener aktiver Produktstream geführt;
- Roadmap-Phase 7 bleibt als öffentliche Zukunftsplanung erhalten, gehört aber
  nicht zum aktuellen Abschlussumfang der acht Fertigstellungsblöcke und wird
  in deren Fortschritt nicht mitgezählt;
- signierte Builds, Store-Konten, TestFlight und Google-Play-Internal-Testing bleiben klar von bereits vorhandenem Code getrennt;
- der ursprüngliche MVP-Arbeitsauftrag bleibt als historische Scope-Grundlage erhalten, während aktuelle Preise, Terminologie und Produktfreigaben aus `docs/SOURCE_OF_TRUTH.md` gelten.
- eine nicht unterschriftsreife AVV-Arbeitsfassung und ein technisches
  Retention-Register bündeln die intern belegbaren Datenschutzgrundlagen;
- Product-Truth-CI verhindert, dass die Datenschutzerklärung hinter den
  consent-gesteuerten Meta-Events oder den bestätigten technischen
  Retention-Werten zurückfällt;
- Anbieter-Verträge, Regionen, Drittlandgrundlagen, finale Fristen und
  Rechts-/Steuerfreigabe bleiben ausdrücklich externe Nachweise.
- Ein strukturiertes externes Freigaberegister benennt pro UID-/Registerwert,
  Fachfreigabe und Anbieter den erforderlichen konto- und versionsbezogenen
  Nachweis. Der normale Check validiert die Struktur; ein getrenntes
  fail-closed Vollständigkeitsgate verhindert, dass fehlende externe Belege
  als Abschluss ausgegeben werden.

### Restore-Drill-Vorbereitung

- Zielgrenze, transaktionaler Datenbank-Runner und redigierter Evidence-Validator sind implementiert;
- ein manueller, `main`-gebundener Ressourcencheck prüft auf einem exklusiven
  `fanmind-restore`-Runner nur die isolierte Zielidentität und die Prüfsumme
  eines verschlüsselten Full-Backups;
- der Ressourcencheck verbindet sich nicht mit PostgreSQL, entschlüsselt
  nichts und aktiviert keine Schreibfreigabe;
- der tatsächliche Restore-, RLS-, Storage-, Server-Konfigurations- und
  Cleanup-Nachweis bleibt ausdrücklich extern offen.

## Noch nicht als P0-Codeabschluss auszugeben

Diese Punkte benötigen einen eigenen externen oder produktiven Nachweis und dürfen nicht durch eine reine Codeänderung als erledigt markiert werden:

- tatsächlicher Production-Commit und Live-HTML nach dem Merge;
- signierter Android-Build und iOS-TestFlight-Build;
- Apple-/Google-Store-Konten und Signing Credentials;
- eigener Web-Staging-Host und Stripe Test Mode; das separate
  Supabase-Staging-Projekt ist vorhanden und darf nicht als Restore-Ziel dienen;
- externe Rechts- und Steuerfreigabe;
- isolierter Restore-Drill und belegte Offsite-Retention.

## Abschlussnachweis

Der finale Kommentar in Issue #640 muss mindestens enthalten:

- Merge-Commit;
- grüne CI-/Testläufe;
- Deployment-Run;
- `/api/version`-Commit;
- `/api/health`-Status;
- Live-Prüfung der deutschen und englischen Landingpage und Registrierung;
- verbleibende externe Handgriffe mit exakt minimalem Nutzeranteil.
