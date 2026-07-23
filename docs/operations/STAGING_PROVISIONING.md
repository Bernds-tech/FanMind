# FanMind Staging-Provisioning

## Ziel

Eine vollständig getrennte Nicht-Production-Umgebung für schreibende Stripe-, Referral-, Restore-, Migrations- und Integrationsprüfungen bereitstellen. Production-Daten, Production-Schlüssel und echte Kundendaten dürfen dabei nicht verwendet werden.

## Bereits technisch vorhanden

- Fail-closed-Policy in `src/lib/environmentBoundaryPolicy.mjs`;
- Read-only- und Write-Preflight über `npm run environment:preflight` und `npm run environment:preflight:write`;
- sichere Vorlage `.env.staging.example`;
- zusätzlicher Baseline-Check `npm run staging:preflight`;
- manueller GitHub-Workflow `FanMind Staging Readiness`;
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

4. **GitHub Environment `staging`**
   - Variable `FANMIND_STAGING_APP_URL`;
   - Variable `FANMIND_STAGING_SUPABASE_PROJECT_REF`;
   - Variable `FANMIND_PRODUCTION_SUPABASE_PROJECT_REF`;
   - Secret `FANMIND_STAGING_SUPABASE_URL`;
   - Secret `FANMIND_STAGING_SUPABASE_ANON_KEY`;
   - Secret `FANMIND_STAGING_SUPABASE_SERVICE_ROLE_KEY`;
   - Secret `FANMIND_STAGING_STRIPE_SECRET_KEY`;
   - Secret `FANMIND_STAGING_STRIPE_WEBHOOK_SECRET`;
   - optionaler begrenzter Secret `FANMIND_STAGING_OPENAI_API_KEY`.

## Sichere Reihenfolge

1. externe Ressourcen erstellen;
2. `.env.staging.example` außerhalb von Git befüllen;
3. die Projektreferenz aus `NEXT_PUBLIC_SUPABASE_URL` exakt in `FANMIND_TARGET_SUPABASE_PROJECT_REF` übernehmen;
4. alle Schreibschalter auf `false` lassen;
5. `npm run staging:preflight` ausführen;
6. Workflow `FanMind Staging Readiness` manuell starten;
7. erst für einen ausdrücklich beschriebenen Testfall `FANMIND_ENABLE_NON_PRODUCTION_WRITES=true` und die exakte Bestätigung setzen;
8. nach dem Test Schreibfreigabe sofort wieder deaktivieren;
9. synthetische Testdaten und temporäre Artefakte kontrolliert löschen.

## Freigabekriterien

Staging gilt erst als tatsächlich eingerichtet, wenn:

- eigener HTTPS-Host erreichbar ist;
- Supabase-Projekt nachweislich von Production getrennt ist;
- URL-Projektreferenz und explizite Staging-Zielreferenz exakt übereinstimmen;
- Stripe Test Mode verwendet wird;
- GitHub-Workflow vollständig grün ist;
- keine realen Kundendaten vorhanden sind;
- Read-only- und Write-Preflight wie vorgesehen fail-closed reagieren;
- ein Test-Webhook erfolgreich verarbeitet wurde.

## Nicht als erledigt markieren

Das Vorhandensein der Policy, Vorlage und dieses Runbooks ersetzt nicht die externen Ressourcen. Der Roadmap-Punkt `Produktions- und Testdaten trennen` bleibt deshalb teilweise offen, bis Host, Supabase und Stripe Test Mode tatsächlich bereitstehen.
