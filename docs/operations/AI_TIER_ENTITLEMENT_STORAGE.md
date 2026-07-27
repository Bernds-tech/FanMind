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
7. Erst danach einen separaten Stripe-Lifecycle-PR bauen. Er muss Event-
   Signatur, Workspace-Ziel, Price-Allowlist, Item-Zuordnung, Ereignis-
   Reihenfolge und idempotente Updates prüfen.
8. Erst nach grüner Staging-Abnahme darf die Migration kontrolliert auf
   Production angewendet werden.
9. Produktive KI-Endpunkte werden erst in einem weiteren PR auf den Speicher
   verdrahtet, wenn Modelle, Kontingente, Stripe-Prices und zentrale
   Readiness vollständig freigegeben sind.

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

- sichere, checksum-gebundene Ausführung der Migration;
- echte Staging-Datenbank und Stripe-Testprodukt;
- Price-Allowlist für Plus und Ultra;
- Stripe-Webhook-Lifecycle und Ereignisreihenfolge;
- konkrete Modelle und Monatskontingente;
- Verdrahtung mit Antwortvorschlägen und Nutzungsgrenzen;
- Production-Migration und Abnahme.
