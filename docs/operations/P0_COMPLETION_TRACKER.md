# FanMind P0-Abschluss-Tracker

Stand: 28. Juli 2026

GitHub-Issue [#640](https://github.com/Bernds-tech/FanMind/issues/640) ist der laufende, verbindliche Arbeits- und Nachweis-Tracker. Dieses Dokument hält die dauerhafte Repository-Zusammenfassung fest, damit bereits erledigte Arbeit nicht erneut umgesetzt wird.

## Statusmodell

Ein Punkt gilt erst dann als vollständig abgeschlossen, wenn alle zutreffenden Ebenen dokumentiert sind:

1. **Code:** Implementierung in `main`.
2. **Prüfung:** Product Truth, Lint, Operations-Tests, Mobile-CI und Production-Build grün.
3. **Deployment:** erwarteter Commit durch `/api/version` nachgewiesen.
4. **Production-Abnahme:** öffentliche Produktwahrheit und Kernrouten gegen die tatsächlich ausgelieferte Anwendung geprüft.
5. **Externe Freigabe:** nur dort, wo Recht, Steuer, Store-Konten oder externe Infrastruktur erforderlich sind.

Eine Änderung auf dem P0-Branch ist damit noch kein Abschlussnachweis. Dieser Tracker trennt bewusst zwischen **umgesetzt**, **gemergt**, **deployed** und **extern abgenommen**.

## Ausgangsstand

- Ausgangs-`main`: `c40ff79a6ffa2393cf70c9a4a71a6a5ea0e79201`.
- PR #637 enthält bereits die sichere Self-Service-Kündigung und den Archiv-/Lesemodus.
- Der ältere konfliktbehaftete PR #636 wurde deshalb ohne Merge geschlossen; die Kündigungslogik wird nicht doppelt gebaut.
- Die native Mobile-App unter `apps/mobile` ist bereits ein eigenständiger React-Native-/Expo-Kern und keine WebView-Hülle.
- Der aktuelle P0-Branch lautet `p0/completion-20260722`; zusammengeführt wird ausschließlich über PR #641 nach vollständiger Prüfung.

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
- signierte Builds, Store-Konten, TestFlight und Google-Play-Internal-Testing bleiben klar von bereits vorhandenem Code getrennt;
- der ursprüngliche MVP-Arbeitsauftrag bleibt als historische Scope-Grundlage erhalten, während aktuelle Preise, Terminologie und Produktfreigaben aus `docs/SOURCE_OF_TRUTH.md` gelten.

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
- separates Staging mit eigenem Supabase-Projekt und Stripe Test Mode;
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
