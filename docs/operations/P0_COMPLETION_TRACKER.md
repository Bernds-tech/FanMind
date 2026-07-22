# FanMind P0-Abschluss-Tracker

Stand: 22. Juli 2026

GitHub-Issue [#640](https://github.com/Bernds-tech/FanMind/issues/640) ist der laufende, verbindliche Arbeits- und Nachweis-Tracker. Dieses Dokument hält die dauerhafte Repository-Zusammenfassung fest, damit bereits erledigte Arbeit nicht erneut umgesetzt wird.

## Statusmodell

Ein Punkt gilt erst dann als vollständig abgeschlossen, wenn alle zutreffenden Ebenen dokumentiert sind:

1. **Code:** Implementierung in `main`.
2. **Prüfung:** Product Truth, Lint, Operations-Tests, Mobile-CI und Production-Build grün.
3. **Deployment:** erwarteter Commit durch `/api/version` nachgewiesen.
4. **Production-Abnahme:** öffentliche Produktwahrheit und Kernrouten gegen die tatsächlich ausgelieferte Anwendung geprüft.
5. **Externe Freigabe:** nur dort, wo Recht, Steuer, Store-Konten oder externe Infrastruktur erforderlich sind.

## Ausgangsstand

- Ausgangs-`main`: `c40ff79a6ffa2393cf70c9a4a71a6a5ea0e79201`.
- PR #637 enthält bereits die sichere Self-Service-Kündigung und den Archiv-/Lesemodus.
- Der ältere konfliktbehaftete PR #636 wurde deshalb ohne Merge geschlossen; die Kündigungslogik wird nicht doppelt gebaut.
- Die native Mobile-App unter `apps/mobile` ist bereits ein eigenständiger React-Native-/Expo-Kern und keine WebView-Hülle.
- Der aktuelle P0-Branch lautet `p0/completion-20260722`.

## P0-Änderungsblöcke

### Live-Produktwahrheit und Deployment-Gate

- gemeinsame Source of Truth für tatsächlich ausgelieferten Text unter `scripts/public-product-truth.mjs`;
- finaler Go-Live-Preflight und unmittelbarer Deployment-Smoke verwenden dieselben Regeln;
- der Deployment-Smoke prüft zusätzlich `/api/version`, Production-Environment und `/api/health`;
- alte Preise, aktives Pilot-Angebot, `zzgl. USt.`, MVP-/Memory-Terminologie und andere bekannte Drift werden als Deployment-Fehler behandelt.

### Mobile

- kanonischer abgeschlossener Follow-up-Status: `completed`;
- bestehende Altdaten mit `done` bleiben rückwärtskompatibel und werden nicht als offen gezählt;
- Mobile schreibt neue Abschlüsse als `completed`;
- Regressionstest verhindert eine erneute Abweichung zwischen Web und Mobile.

### PDF-Datenauskunft

- alter Mailto-Ablauf und zusätzlicher Abmelden-Button aus der Datenauskunftskarte entfernt;
- ein lokalisierter, authentifizierter PDF-Download bleibt als einzige Kartenaktion;
- Export enthält sichere Konto-, Workspace-, Vertrags- und Kontaktdaten;
- keine Secrets, Tokens, Sessiondaten, Stripe-IDs, Admin-Notizen oder fremden Workspace-Daten;
- mehrseitige PDF-Erzeugung ohne stilles Abschneiden von Kontakten;
- deutsche und englische Ausgabe sowie ehrliche Leerzustände.

### Zentrale Produktdokumentation

- Mobile wird in `docs/SOURCE_OF_TRUTH.md`, `README.md`, `AGENTS.md` und der Roadmap als eigener aktiver Produktstream geführt;
- signierte Builds, Store-Konten, TestFlight und Google-Play-Internal-Testing bleiben klar von bereits vorhandenem Code getrennt.

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
