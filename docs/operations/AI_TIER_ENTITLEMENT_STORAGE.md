# Persistenter Workspace-KI-Stufenspeicher

Stand: 27. Juli 2026

## Ziel und Grenze

`workspace_ai_tier_entitlements` ist die spätere serververwaltete Source of
Truth für genau ein optionales KI-Add-on eines Workspaces. Eine fehlende Zeile
bedeutet immer KI Standard.

Die additive Migration
`supabase/migrations/20260727090000_workspace_ai_tier_entitlements.sql` ist
vorbereitet, aber mit diesem Code-Release noch nicht auf Staging oder
Production angewendet. Der Speicher ist noch nicht mit Stripe-Webhooks,
Checkout oder produktiven KI-Endpunkten verdrahtet. Plus und Ultra bleiben
dadurch weiterhin blockiert.

Der checksum-gebundene Runner bereitet ausschließlich einen kontrollierten
manuellen Datenbankschritt vor. Web-Deploy und Merge enthalten keine automatische Production-Migration.

## Sicherheitsvertrag

- Nur `plus` oder `ultra` dürfen gespeichert werden; Standard benötigt keine
  Zeile.
- Quelle ist ausschließlich Stripe.
- Workspace, Subscription, Subscription-Item, Price, letzter Event,
  Lifecycle und Zeitraum werden serverseitig gespeichert.
- RLS und `FORCE ROW LEVEL SECURITY` sind aktiv.
- Es gibt keine Policy für `public`, `anon` oder `authenticated`.
- Tabellen- und Spaltenrechte für Browserrollen werden vollständig entzogen.
- Nur `service_role` erhält `SELECT`, `INSERT`, `UPDATE` und `DELETE`.
- `workspace_id` ist nach dem Insert unveränderlich.
- Der Loader fragt mit `limit=2` ab und akzeptiert exakt null oder eine Zeile.
- Stripe-IDs, Price-IDs und Event-IDs verlassen den Loader nicht.
- Fehlende Konfiguration, HTTP-/JSON-Fehler, mehrere Zeilen, falscher
  Workspace oder beschädigte Werte fallen auf KI Standard zurück.

## Verbindliche Rollout-Reihenfolge

1. Diesen App-Brückenstand deployen. Der Loader ist noch an keinen
   produktiven KI-Pfad angeschlossen.
2. Migration in einer isolierten Staging-Datenbank anwenden.
3. Katalog, Constraints, RLS, Policies sowie Tabellen- und Spaltenrechte
   prüfen.
4. Mit einem normalen Owner-JWT und Mitglieder-JWT negative
   `SELECT`-/`INSERT`-/`UPDATE`-/`DELETE`-Tests durchführen.
5. Mit Service Role einen synthetischen Plus-Datensatz anlegen, lesen,
   ändern und löschen; keine echte Stripe- oder Kundennummer verwenden.
6. Nachweisen, dass null Zeilen KI Standard ergeben, exakt eine gültige Zeile
   redigiert wird und zwei beziehungsweise beschädigte Zeilen fail-closed
   sind.
7. Der vorbereitete Stripe-Lifecycle-Vertrag in
   `src/lib/aiTierStripeLifecycle.mjs` muss mit synthetischen Stripe-Events
   abgenommen werden. Er prüft Workspace-Ziel, Price-Allowlist,
   Item-Zuordnung, Ereignisreihenfolge und idempotente Wiederholungen. Er ist
   noch nicht mit dem produktiven Webhook oder der Datenbank verdrahtet.
8. Erst nach grüner Staging-Abnahme darf die Migration kontrolliert auf
   Production angewendet werden.
9. Produktive KI-Endpunkte werden erst in einem weiteren PR auf den Speicher
   verdrahtet, wenn Modelle, Kontingente, Stripe-Prices und zentrale
   Readiness vollständig freigegeben sind.

## Kontrollierter Migrationsrunner

Der Runner arbeitet in drei Modi:

1. `npm run db:ai-tier-entitlements:check` prüft offline den festgeschriebenen
   SHA-256 sowie SQL-, RLS-, Rechte-, Constraint-, Index- und
   Triggerverträge. Das ist der Default und benötigt keine Datenbank.
2. `npm run db:ai-tier-entitlements:verify` führt ausschließlich einen
   `READ ONLY`-Postflight gegen das explizit gebundene Ziel aus.
3. `npm run db:ai-tier-entitlements:apply` wendet genau die festgeschriebene
   Migration einmal an und verlangt danach denselben Postflight.

Die Verbindung wird nie als URL oder Prozessargument übergeben. Erforderlich
sind `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER` und eine absolute,
eigentümergeführte `PGPASSFILE` mit Modus `0600`. Der Runner erstellt einen
privaten Snapshot der Passfile, sperrt alternative libpq-Umleitungen und
entfernt den Snapshot nach dem Lauf.

Vor jedem schreibenden Lauf müssen Zielumgebung, Supabase-Projektreferenz und
Datenbankhost unabhängig gebunden werden. Staging muss ausdrücklich eine
andere Projektreferenz als Production verwenden. Ein Production-Apply
verlangt zusätzlich einen Change-Verweis und die exakte Bestätigung:

```bash
export FANMIND_AI_TIER_ENTITLEMENT_MIGRATION_CONFIRM=apply-workspace-ai-tier-entitlements
npm run db:ai-tier-entitlements:apply
```

Erfolgreich ist der Datenbankschritt nur mit:

```text
AI_TIER_ENTITLEMENT_MIGRATION_POSTFLIGHT=PASS
```

Der Postflight liest keine Workspace-, Stripe- oder Kundendatensätze. Er prüft
nur PostgreSQL-Metadaten zu Tabelle, RLS/`FORCE RLS`, fehlenden
Browser-Policies, Tabellen- und Spaltenrechten, Constraints, Indizes, Trigger
und Triggerfunktion.

## Synthetische Staging-Abnahme

Nach einem kontrollierten Staging-Apply:

1. Postflight erneut mit `npm run db:ai-tier-entitlements:verify` ausführen.
2. Als normaler Owner und als Mitglied nachweisen, dass `SELECT`, `INSERT`,
   `UPDATE` und `DELETE` blockiert bleiben.
3. Mit Service Role genau einen vollständig synthetischen Plus-Datensatz
   anlegen, lesen, ändern und löschen.
4. Nachweisen, dass der Loader keine Stripe-Referenz zurückgibt.
5. Null Zeilen, zwei Zeilen und beschädigte Werte müssen fail-closed auf KI
   Standard fallen.
6. Plus und Ultra bleiben trotz erfolgreicher Speichermigration blockiert,
   solange Readiness, Stripe-Lifecycle, Modelle und Kontingente fehlen.

## Postflight-SQL

Die folgenden Abfragen dürfen nur Tabellenmetadaten liefern, keine Stripe-
oder Workspace-Zeilen:

```sql
select relrowsecurity, relforcerowsecurity
from pg_class
where oid = 'public.workspace_ai_tier_entitlements'::regclass;

select policyname, permissive, cmd, roles
from pg_policies
where schemaname = 'public'
  and tablename = 'workspace_ai_tier_entitlements';

select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'workspace_ai_tier_entitlements'
order by grantee, privilege_type;

select grantee, column_name, privilege_type
from information_schema.role_column_grants
where table_schema = 'public'
  and table_name = 'workspace_ai_tier_entitlements'
order by grantee, column_name, privilege_type;

select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.workspace_ai_tier_entitlements'::regclass
order by conname;
```

Erwartet:

- beide RLS-Werte sind `true`;
- die Policy-Abfrage ist leer;
- `anon` und `authenticated` besitzen weder Tabellen- noch Spaltenrechte;
- `service_role` besitzt ausschließlich den vorgesehenen Datenzugriff;
- Tier, Status, Quelle, Stripe-Referenzformate, Zeitraum, Event-Zeit und
  eindeutiges Subscription-Item sind durch Constraints gebunden.

## Noch ausdrücklich offen

- kontrollierte Ausführung und Abnahme zuerst auf echtem Staging;
- echte Staging-Datenbank und Stripe-Testprodukt;
- atomare Datenbankanwendung des vorbereiteten Price-Allowlist- und
  Stripe-Lifecycle-Vertrags;
- produktive Webhook-Verdrahtung nach Stripe-Testmode-Abnahme;
- konkrete Modelle und Monatskontingente;
- Verdrahtung mit Antwortvorschlägen und Nutzungsgrenzen;
- Production-Migration und Abnahme.
