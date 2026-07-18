# FanMind Production-/Staging-Trennung

## Ziel

Schreibende Tests für Stripe, Referral, Restore, Social-Integrationen oder Datenmigrationen dürfen niemals versehentlich gegen `fanmind.ch` oder das Production-Supabase-Projekt laufen.

Die gemeinsame Policy liegt in:

```text
src/lib/environmentBoundaryPolicy.mjs
```

Der ausführbare Preflight lautet:

```bash
npm run environment:preflight
npm run environment:preflight:write
```

## Verbindliche Umgebungen

### Production

- `FANMIND_RUNTIME_ENVIRONMENT=production`
- App-Ziel ausschließlich `https://fanmind.ch` oder `https://www.fanmind.ch`
- eigenes Production-Supabase-Projekt
- Stripe Live nur in Production und niemals in Sandbox-Skripten
- reale Kunden- und Kontaktdaten nur in Production
- nicht-produktive Schreibfreigabe immer `false`

### Staging

- `FANMIND_RUNTIME_ENVIRONMENT=staging`
- eigener Host, beispielsweise `staging.fanmind.ch` oder ein klarer Testhost
- separates Supabase-Projekt mit separatem Auth, Storage und Service-Role-Key
- ausschließlich Stripe Test Mode
- ausschließlich synthetische Testdaten
- eigene Webhook-Ziele und eigene E-Mail-Empfänger
- öffentliche Demo, Billing, Monitor, Fehlertracking und Integrationen zunächst deaktiviert

### Test

- `FANMIND_RUNTIME_ENVIRONMENT=test`
- nur automatisierte oder kontrollierte Testläufe
- separates Supabase-Projekt beziehungsweise vollständig isolierte Fixtures
- keine Production-URLs, -IDs, -Schlüssel oder Kundendaten

### Development

- lokale Entwicklung
- der gemeinsame Policy-Preflight erlaubt keine schreibenden Remote-Tests im Modus `development`
- Remote-Schreibtests müssen ausdrücklich über `staging` oder `test` laufen

## Fünf Bedingungen für schreibende Tests

Ein Lauf mit `--allow-write` wird nur freigegeben, wenn gleichzeitig gilt:

1. `FANMIND_RUNTIME_ENVIRONMENT` ist `staging` oder `test`.
2. Die App-Ziel-URL ist gültig, HTTPS und nicht `fanmind.ch`.
3. Das Ziel-Supabase-Projekt ist eindeutig identifiziert und unterscheidet sich von `FANMIND_PRODUCTION_SUPABASE_PROJECT_REF`.
4. `FANMIND_ENABLE_NON_PRODUCTION_WRITES=true` ist bewusst gesetzt.
5. `FANMIND_NON_PRODUCTION_WRITE_ACK=I_UNDERSTAND_NON_PRODUCTION_ONLY` ist exakt gesetzt.

Fehlt eine Bedingung, endet der Preflight mit Fehlerstatus.

## Supabase-Projektvergleich

Bei Standard-Supabase-URLs wird die Projektreferenz aus

```text
https://<project-ref>.supabase.co
```

abgeleitet. Bei Custom Domains muss zusätzlich gesetzt werden:

```text
FANMIND_TARGET_SUPABASE_PROJECT_REF=<staging-oder-test-ref>
```

Der Production-Vergleichswert wird ausschließlich als Projektreferenz hinterlegt:

```text
FANMIND_PRODUCTION_SUPABASE_PROJECT_REF=<production-ref>
```

Die Projektreferenz ist kein Service-Role-Key. Trotzdem wird im Preflight nur der Status `identified/missing/match` ausgegeben, nicht der konkrete Wert.

## Sichere Startvorlage

Repository-Vorlage:

```text
.env.staging.example
```

Vorgehen:

1. Datei außerhalb von Git nach `.env.staging.local` oder in einen Secret Store kopieren.
2. ausschließlich Staging-/Testwerte eintragen;
3. sämtliche Feature- und Schreibschalter zunächst auf `false` belassen;
4. Read-only-Preflight ausführen;
5. erst für einen konkreten kontrollierten Test beide Schreibfreigaben setzen;
6. nach dem Test sofort wieder deaktivieren.

## Read-only-Prüfung

```bash
set -a
source /sicherer/pfad/.env.staging.local
set +a
npm run environment:preflight
```

Ein Read-only-Lauf verlangt:

```text
FANMIND_ENABLE_NON_PRODUCTION_WRITES=false
```

Er gibt keine Schlüssel, URLs oder Projektreferenzen aus.

## Kontrollierte Schreibfreigabe

Nur für einen vorher beschriebenen Testfall:

```text
FANMIND_ENABLE_NON_PRODUCTION_WRITES=true
FANMIND_NON_PRODUCTION_WRITE_ACK=I_UNDERSTAND_NON_PRODUCTION_ONLY
```

Danach:

```bash
npm run environment:preflight:write
```

Erst bei `ENVIRONMENT_BOUNDARY=OK` darf das nachgelagerte Schreibskript gestartet werden.

Nach dem Test:

```text
FANMIND_ENABLE_NON_PRODUCTION_WRITES=false
FANMIND_NON_PRODUCTION_WRITE_ACK=
```

## Datenregeln

In Staging/Test verboten:

- Kopien realer Fan-Nachrichten oder Kontaktwissen;
- Production-Datenbank-Dumps ohne vorherige vollständige Anonymisierung;
- Production-Storage-Artefakte mit personenbezogenen Inhalten;
- Live-Stripe-Schlüssel oder echte Zahlungsmittel;
- Production-Service-Role-Key;
- Production-Webhooks oder reale Social-Page-Tokens;
- Versand an echte Kunden/Fans.

Erlaubt:

- synthetische Demo-Kontakte;
- Stripe-Testkarten und Test-Webhooks;
- dedizierte Staging-E-Mail-Empfänger;
- isolierte Restore-Drills mit verschlüsselten beziehungsweise anonymisierten Testartefakten;
- kontrollierte KI-Tests ohne reale personenbezogene Inhalte.

## Deployment-Grenze

Der bestehende Production-Deploy darf niemals setzen:

```text
FANMIND_ENABLE_NON_PRODUCTION_WRITES=true
FANMIND_NON_PRODUCTION_WRITE_ACK=I_UNDERSTAND_NON_PRODUCTION_ONLY
```

Die Policy-Tests prüfen diese Grenze im Repository.

## Referral-Sandbox

Referral-Schreibtests benötigen zusätzlich zu den bestehenden Stripe-/Referral-Bedingungen auch den gemeinsamen Umgebungs-Preflight. Dadurch reichen ein Testschlüssel und eine fremde URL allein nicht mehr aus; das Supabase-Ziel muss nachweislich von Production getrennt sein.

## Restore-Drill

Ein Restore-Drill darf erst beginnen, wenn:

- der gemeinsame Schreib-Preflight grün ist;
- Ziel-Supabase und Ziel-Storage separat bestätigt wurden;
- keine Production-Daten überschrieben werden können;
- ein Rückbauplan und eine Löschung der Testdaten dokumentiert sind.

Siehe zusätzlich:

```text
docs/operations/RESTORE_DRILL.md
```
