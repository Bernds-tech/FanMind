# FanMind Staging-Provisioning

## Ziel

Eine klar abgegrenzte Nicht-Production-Umgebung für schreibende Stripe-, Referral-, Restore-, Migrations- und Integrationsprüfungen bereitstellen. Der Webhost nutzt aus Kostengründen denselben Exoscale-Server wie Production, ist dort aber durch einen eigenen Linux-Nutzer, Release-Pfad, Prozess, nginx-vHost, ENV-Datei und Runner-Dienst getrennt. Diese Betriebsgrenze ist keine Infrastrukturtrennung durch einen zweiten Server. Supabase- und Stripe-Staging-Ressourcen müssen dagegen vollständig von Production getrennt bleiben. Production-Daten, Production-Schlüssel und echte Kundendaten dürfen nicht verwendet werden.

## Bereits technisch vorhanden

- Fail-closed-Policy in `src/lib/environmentBoundaryPolicy.mjs`;
- Read-only- und Write-Preflight über `npm run environment:preflight` und `npm run environment:preflight:write`;
- sichere Vorlage `.env.staging.example`;
- zusätzlicher Baseline-Check `npm run staging:preflight`;
- manueller GitHub-Workflow `FanMind Staging Readiness`;
- manueller, `main`-gebundener und commit-genauer Deploy-Workflow `Deploy FanMind Staging` für einen ausschließlich mit `fanmind-staging` gekennzeichneten Self-Hosted Runner;
- manueller, `main`-gebundener Workflow `Provision FanMind Staging Host`, der
  auf dem bestehenden Exoscale-Host ausschließlich den getrennten Linux-Nutzer,
  Release-Pfad, privaten ENV-Pfad, nginx-vHost und zweiten Runner-Dienst anlegt;
- separater manueller Workflow `Enable FanMind Staging TLS`, der erst nach
  erfolgreicher DNS-Bindung das vorhandene Certbot-Konto für
  `staging.fanmind.ch` verwendet;
- Policy-Tests, die Production-Ziele und unvollständige Freigaben blockieren.

## Extern einmalig einzurichten

1. **Staging-Webgrenze auf dem bestehenden Exoscale-Server**
   - eigener HTTPS-Host `staging.fanmind.ch`;
   - eigener Linux-Nutzer, eigener Prozess, eigener Release-Pfad und getrennte ENV-Datei;
   - kein Alias auf die Production-Anwendung und keine gemeinsame Runtime;
   - kein zweiter Server: ein Ausfall oder eine Fehlkonfiguration des gemeinsamen Hosts bleibt ein geteiltes Infrastrukturrisiko.

2. **Supabase Staging**
   - neues eigenes Supabase-Projekt;
   - eigenes Auth, Datenbank, Storage und Service-Role-Key;
   - `FANMIND_TARGET_SUPABASE_PROJECT_REF` muss exakt der Projektreferenz in der Supabase-URL entsprechen;
   - Abweichungen zwischen URL und expliziter Zielreferenz werden fail-closed abgelehnt;
   - ausschließlich synthetische Kontakte, Nachrichten und Dateien;
   - Production-Projektreferenz nur als Vergleichswert, niemals Production-Schlüssel hinterlegen.

3. **Stripe Test Mode**
   - ausschließlich `sk_test_...`;
   - eigener Test-Webhook auf den Staging-Host;
   - Stripe-Testkarten und Testprodukte;
   - keine Live-Kunden, Live-Zahlungsmittel oder Live-Subscription-IDs.

4. **Staging-Runtime und Runner**
   - eigener Self-Hosted Runner mit dem exklusiven Label `fanmind-staging`, niemals der Production-Runner;
   - eigener Release-Pfad unter `/var/www/fanmind-staging`;
   - eigene, nicht versionierte `/var/www/fanmind-staging/.env.production` mit Dateimodus `0600` und ausschließlich Staging-Werten;
   - eigener PM2-Prozess `fanmind-staging` und eigener nginx-vHost;
   - die einmalige Host-Provisionierung läuft mit der Bestätigung
     `provision-fanmind-staging-host`; sie deployt keine Anwendung und ändert
     weder den Production-Checkout noch den Production-PM2-Prozess;
   - der eigentliche Deploy synchronisiert einen kurzlebig authentifizierten,
     commit-genauen Checkout mit `persist-credentials: false` ohne `.git` in
     den Release-Pfad; der Staging-Nutzer erhält keine dauerhaften
     Repository-Zugangsdaten;
   - der dafür kurzzeitig benötigte Secret
     `FANMIND_STAGING_RUNNER_REGISTRATION_TOKEN` wird nach erfolgreicher
     Registrierung des zweiten Runners aus dem GitHub Environment gelöscht;
   - dadurch entsteht kein zweiter Exoscale-Server und kein zusätzlicher
     monatlicher Infrastrukturpreis.

5. **GitHub Environment `staging`**
   - Variable `FANMIND_STAGING_APP_URL`;
   - Variable `FANMIND_STAGING_SUPABASE_PROJECT_REF`;
   - Variable `FANMIND_PRODUCTION_SUPABASE_PROJECT_REF`;
   - Secret `FANMIND_STAGING_SUPABASE_URL`;
   - Secret `FANMIND_STAGING_SUPABASE_ANON_KEY`;
   - Secret `FANMIND_STAGING_SUPABASE_SERVICE_ROLE_KEY`;
   - Secret `FANMIND_STAGING_STRIPE_SECRET_KEY`;
   - Secret `FANMIND_STAGING_STRIPE_WEBHOOK_SECRET`;
   - optionaler begrenzter Secret `FANMIND_STAGING_OPENAI_API_KEY`.
   - Variable `FANMIND_AI_TIER_STAGING_WORKSPACE_ID` für einen ausschließlich
     synthetischen Workspace mit einem Owner und mindestens einem Mitglied;
   - Variablen `FANMIND_STAGING_STRIPE_PRICE_AI_PLUS` und
     `FANMIND_STAGING_STRIPE_PRICE_AI_ULTRA` für aktive EUR-Monatspreise im
     Stripe Test Mode;
   - Variablen `FANMIND_STAGING_DB_PORT` (`5432`) und
     `FANMIND_STAGING_DB_NAME`;
   - Secrets `FANMIND_STAGING_DB_HOST` (IPv4-kompatibler Supabase-Supavisor-
     Session-Pooler) und `FANMIND_STAGING_DB_PASSWORD`; der DB-Benutzer wird
     als `postgres.<staging-project-ref>` abgeleitet und nie frei gesetzt;
     niemals eine Production-Verbindung.
   - temporärer Secret `FANMIND_STAGING_RUNNER_REGISTRATION_TOKEN` nur für
     die erste Runner-Registrierung; niemals in Runtime-ENV oder Git schreiben.

## Sichere Reihenfolge

1. externe Ressourcen erstellen;
2. den kurzlebigen Runner-Registrierungstoken ausschließlich als geschützten
   Environment-Secret hinterlegen und `Provision FanMind Staging Host` auf
   `main` mit `provision-fanmind-staging-host` starten;
3. den im Workflow-Summary ausgewiesenen IPv4-Wert als A-Record für
   `staging.fanmind.ch` setzen;
4. nach nachgewiesener DNS-Auflösung `Enable FanMind Staging TLS` mit
   `enable-fanmind-staging-tls` starten;
5. den kurzlebigen Runner-Registrierungstoken anschließend löschen;
6. `.env.staging.example` außerhalb von Git befüllen;
7. die Projektreferenz aus `NEXT_PUBLIC_SUPABASE_URL` exakt in `FANMIND_TARGET_SUPABASE_PROJECT_REF` übernehmen;
8. alle Schreibschalter auf `false` lassen;
9. `npm run staging:preflight` ausführen;
10. den manuellen Workflow `Deploy FanMind Staging` auf dem ausgewählten, von `main` erreichbaren Commit mit der Bestätigung `deploy-staging-only` starten;
11. der Workflow muss Preflight, Product Truth, Lint, Operations-Tests, Build, separaten PM2-Start, Health und commit-genauen Public Smoke erfolgreich abschließen;
12. Workflow `FanMind Staging Readiness` exakt auf diesem Git-Commit manuell starten;
13. erst für einen ausdrücklich beschriebenen Testfall `FANMIND_ENABLE_NON_PRODUCTION_WRITES=true` und die exakte Bestätigung setzen;
14. nach dem Test Schreibfreigabe sofort wieder deaktivieren;
15. synthetische Testdaten und temporäre Artefakte kontrolliert löschen.

## Kontrollierte KI-Stufen-Abnahme

Der manuelle Workflow `FanMind AI Tier Staging Acceptance` ist vorbereitet,
führt aber keine Migration aus. Vor seinem ersten Lauf muss die
checksum-gebundene Entitlement-Migration separat und bewusst auf Staging
angewendet worden sein.

1. Einen synthetischen Staging-Workspace mit einem Owner und mindestens einem
   weiteren Mitglied anlegen. Er darf noch keinen KI-Stufeneintrag besitzen.
2. Zwei aktive Stripe-Testprodukte mit wiederkehrenden EUR-Monatspreisen
   bereitstellen: Plus exakt 100 Euro, Ultra exakt 200 Euro.
3. Die oben genannten Staging-Variablen und -Secrets im GitHub Environment
   hinterlegen.
4. Den manuellen Workflow `FanMind AI Tier Staging Migration` auf `main` mit
   der Bestätigung `apply-workspace-ai-tier-entitlements` starten. Er prüft
   die festgeschriebene Checksumme, bindet Supabase-Projektreferenz und
   Datenbankhost unabhängig, wendet die Migration genau einmal an und verlangt
   danach den read-only Metadaten-Postflight.
5. Erst nach
   `AI_TIER_ENTITLEMENT_MIGRATION_APPLY=completed` und
   `AI_TIER_ENTITLEMENT_MIGRATION_POSTFLIGHT=PASS` den manuellen
   Abnahmeworkflow mit der Bestätigung
   `run-ai-tier-staging-acceptance` starten.
6. Der Abnahmerunner prüft den Stripe-Testkatalog read-only, simuliert doppelte,
   verspätete und kollidierende Lifecycle-Ereignisse und testet für Owner und
   Mitglied `SELECT`, `INSERT`, `UPDATE` und `DELETE` als verbotene
   Browserzugriffe.
7. Der erlaubte Service-Role-Insert-/Read-/Update-/Delete-Nachweis läuft
   ausschließlich in einer Datenbanktransaktion, die am Ende zurückgerollt
   wird. Workspace-, Nutzer-, Price-, Subscription- und Event-IDs werden
   nicht ausgegeben.

Erst `AI_TIER_STAGING_ACCEPTANCE=PASS` zusammen mit
`AI_TIER_STAGING_TRANSACTION=ROLLED_BACK` gilt als technischer Nachweis.
Das beweist noch keine Production-Freigabe und aktiviert Plus oder Ultra
nicht.

## Freigabekriterien

Staging gilt erst als tatsächlich eingerichtet, wenn:

- eigener HTTPS-Host erreichbar ist;
- Supabase-Projekt nachweislich von Production getrennt ist;
- URL-Projektreferenz und explizite Staging-Zielreferenz exakt übereinstimmen;
- Stripe Test Mode verwendet wird;
- GitHub-Workflow vollständig grün ist;
- `/api/version` exakt den Commit ausliefert, auf dem der Readiness-Workflow gestartet wurde;
- `/api/version` zusätzlich `runtimeEnvironment=staging` ausliefert und damit die aktive Staging-Runtime bestätigt;
- keine realen Kundendaten vorhanden sind;
- Read-only- und Write-Preflight wie vorgesehen fail-closed reagieren;
- ein Test-Webhook erfolgreich verarbeitet wurde.
- die KI-Stufen-Abnahme bei angewendeter Staging-Migration vollständig grün
  ist, bevor der Entitlement-Speicher mit Webhook oder produktiver KI
  verdrahtet wird.

## Nicht als erledigt markieren

Das Vorhandensein der Policy, Vorlage, Deploy-Automation und dieses Runbooks ersetzt nicht die externen Ressourcen. Der Roadmap-Punkt `Produktions- und Testdaten trennen` bleibt deshalb teilweise offen, bis Host, Supabase und Stripe Test Mode tatsächlich bereitstehen.
