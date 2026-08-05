# FanMind Staging-Provisioning

## Ziel

Eine vollständig getrennte Nicht-Production-Umgebung für schreibende Stripe-, Referral-, Restore-, Migrations- und Integrationsprüfungen bereitstellen. Production-Daten, Production-Schlüssel und echte Kundendaten dürfen dabei nicht verwendet werden.

## Bereits technisch vorhanden

- Fail-closed-Policy in `src/lib/environmentBoundaryPolicy.mjs`;
- Read-only- und Write-Preflight über `npm run environment:preflight` und `npm run environment:preflight:write`;
- sichere Vorlage `.env.staging.example`;
- zusätzlicher Baseline-Check `npm run staging:preflight`;
- manueller GitHub-Workflow `FanMind Staging Readiness`;
- manueller, commit-genauer Deploy-Workflow `Deploy FanMind Staging` für einen ausschließlich mit `fanmind-staging` gekennzeichneten Self-Hosted Runner;
- Policy-Tests, die Production-Ziele und unvollständige Freigaben blockieren.

## Extern einmalig einzurichten

1. **Staging-Host**
   - eigener HTTPS-Host, empfohlen `staging.fanmind.ch`;
   - getrennte Runtime und getrennte ENV-Datei;
   - kein Alias auf die Production-Anwendung.

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
   - eigener Checkout unter `/var/www/fanmind-staging`;
   - eigene, nicht versionierte `/var/www/fanmind-staging/.env.production` mit Dateimodus `0600` und ausschließlich Staging-Werten;
   - eigener PM2-Prozess `fanmind-staging` und eigener nginx-vHost;

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

## Sichere Reihenfolge

1. externe Ressourcen erstellen;
2. `.env.staging.example` außerhalb von Git befüllen;
3. die Projektreferenz aus `NEXT_PUBLIC_SUPABASE_URL` exakt in `FANMIND_TARGET_SUPABASE_PROJECT_REF` übernehmen;
4. alle Schreibschalter auf `false` lassen;
5. `npm run staging:preflight` ausführen;
6. den manuellen Workflow `Deploy FanMind Staging` auf dem ausgewählten, von `main` erreichbaren Commit mit der Bestätigung `deploy-staging-only` starten;
7. der Workflow muss Preflight, Product Truth, Lint, Operations-Tests, Build, separaten PM2-Start, Health und commit-genauen Public Smoke erfolgreich abschließen;
8. Workflow `FanMind Staging Readiness` exakt auf diesem Git-Commit manuell starten;
9. erst für einen ausdrücklich beschriebenen Testfall `FANMIND_ENABLE_NON_PRODUCTION_WRITES=true` und die exakte Bestätigung setzen;
10. nach dem Test Schreibfreigabe sofort wieder deaktivieren;
11. synthetische Testdaten und temporäre Artefakte kontrolliert löschen.

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
