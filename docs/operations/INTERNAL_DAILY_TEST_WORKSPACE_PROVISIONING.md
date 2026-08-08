# Öffentliche Daily-Test-Provisionierung

Stand: 9. August 2026

## Zweck und harte Grenze

Der interne Tarif `internal_daily_test` bleibt im Normalbetrieb admin-only.
Ein Admin darf das außergewöhnliche öffentliche Registrierungsfenster für
höchstens 24 Stunden nur öffnen, wenn alle folgenden Grenzen gleichzeitig
wirksam sind:

- die Anwendung provisioniert Workspaces ausschließlich nach einer
  serverseitig verifizierten Supabase-Session;
- das Laufzeitfenster wird unmittelbar vor der Mutation frisch und
  fail-closed gelesen;
- `public.ensure_internal_daily_test_workspace(uuid,text,boolean)` ist
  installiert und ausschließlich für `service_role` ausführbar;
- die validierten Workspace-CHECKs erlauben `internal_daily_test` und `card`;
- direkte Tabellen- und Spalten-`INSERT`-Rechte auf `public.workspaces` sind
  für `PUBLIC`, `anon` und `authenticated` entzogen;
- der Readiness-RPC bestätigt diesen kombinierten Zustand.

Die Anwendung nimmt keine User-ID, Tarifoption, Preise, Billing-Felder oder
Testflags aus dem Registrierungs-Request an. Der bestehende authentifizierte
Starter-RPC bleibt absichtlich Starter-only. Ein normaler Web-Deploy wendet
die Migration nicht an und aktiviert das Fenster nicht.

## Artefakte

- App-Grenze: `src/app/api/register/workspace/route.ts`
- frischer Zeitfensterstatus: `src/lib/runtimeProductSettings.ts`
- serverseitige Provisionierung: `src/lib/supabase/server.ts`
- additive Migration:
  `supabase/migrations/20260808230102_internal_daily_test_workspace_provisioning.sql`
- Browser-INSERT-Contract:
  `supabase/controlled/20260726121000_workspace_server_owned_columns.sql`

## Verbindliche Reihenfolge

1. Fenster deaktiviert lassen und den App-Stand zuerst deployen. Ohne neuen
   RPC bleibt die Daily-Auswahl durch den Readiness-Check verborgen.
2. In der isolierten Staging-Datenbank bestätigen, dass
   `20260726120000_workspace_provisioning_rpc.sql` und der kontrollierte
   Browser-INSERT-Contract vollständig abgenommen sind.
3. Vor der Migration count-only prüfen, dass alle bestehenden
   `commercial_option`- und `payment_collection_method`-Werte im unten
   dokumentierten erweiterten Vertrag liegen. Jeder Fremdwert blockiert den
   Rollout und muss anhand der Billing-Auditdaten getrennt geklärt werden.
4. Die neue additive Expand-/Contract-Migration ausschließlich gegen dieses
   bestätigte Staging-Ziel anwenden. Ihre neuen CHECKs werden zuerst erweitert
   und validiert; erst danach ersetzt sie die bisherigen engeren CHECKs.
5. PostgREST-Schema-Cache aktualisieren und die unten stehenden Privileg- und
   Readiness-Prüfungen ausführen.
6. Mit einem dedizierten synthetischen Staging-Auth-Nutzer den positiven,
   negativen und parallelen Provisioning-Fall prüfen. Transaktionale
   Testdaten anschließend kontrolliert entfernen; keine Production-Nutzer
   verwenden.
7. Erst nach dokumentiertem Staging-Go denselben read-only Preflight gegen
   Production ausführen, Backup/Restore-Bereitschaft bestätigen und die
   Migration getrennt freigeben.
8. Production-Postflight ausführen. Das öffentliche Fenster bleibt weiterhin
   aus und darf erst durch eine separate Admin-Entscheidung geöffnet werden.

## Read-only Preflight und Postflight

Nur in der kontrollierten SQL-Umgebung des exakt bestätigten Ziels ausführen.
Ausgaben dürfen keine Nutzer-, Workspace-, Stripe- oder Secretwerte enthalten.

```sql
select
  to_regprocedure(
    'public.ensure_current_user_workspace(text,text,boolean)'
  ) is not null as starter_rpc_present,
  to_regprocedure(
    'public.ensure_internal_daily_test_workspace(uuid,text,boolean)'
  ) is not null as daily_rpc_present,
  not has_table_privilege('anon', 'public.workspaces', 'INSERT')
    and not has_any_column_privilege(
      'anon', 'public.workspaces', 'INSERT'
    ) as anon_insert_denied,
  not has_table_privilege('authenticated', 'public.workspaces', 'INSERT')
    and not has_any_column_privilege(
      'authenticated', 'public.workspaces', 'INSERT'
    ) as authenticated_insert_denied;

select
  count(*) filter (
    where commercial_option not in (
      'pilot_only',
      'starter_paid_setup',
      'starter_no_setup_commitment',
      'internal_daily_test'
    )
  ) as incompatible_commercial_options,
  count(*) filter (
    where payment_collection_method is not null
      and payment_collection_method not in (
        'none',
        'manual_invoice',
        'sepa_direct_debit',
        'card'
      )
  ) as incompatible_payment_methods
from public.workspaces;

select
  conname,
  convalidated,
  position(
    'internal_daily_test' in pg_get_constraintdef(oid, true)
  ) > 0 as allows_daily,
  position(
    '''card''' in pg_get_constraintdef(oid, true)
  ) > 0 as allows_card
from pg_constraint
where conrelid = 'public.workspaces'::regclass
  and conname in (
    'workspaces_commercial_option_check',
    'workspaces_payment_collection_method_check'
  )
order by conname;
```

Vor der Anwendung müssen beide `incompatible_*`-Zähler `0` sein. Nach der
Anwendung müssen beide Constraint-Zeilen vorhanden und validiert sein; der
Commercial-Check muss `allows_daily=true`, der Zahlungsweg-Check
`allows_card=true` melden. Auch alle übrigen booleschen Werte müssen `true`
sein. Zusätzlich mit der
serverseitigen Staging-Service-Role über PostgREST prüfen:

```text
POST /rest/v1/rpc/internal_daily_test_workspace_provisioning_ready
{}
```

Erwartung: exakt eine Zeile mit `ready=true`. Derselbe Aufruf mit `anon` oder
`authenticated` muss verweigert werden. Der Daily-Provisioning-RPC muss für
beide Browserrollen ebenfalls verweigert werden.

## Funktionsabnahme

- Fenster geschlossen: Registrierung endet vor der DB-Mutation; keine
  Workspace- und keine Membership-Zeile entsteht.
- Fenster offen und Readiness `true`: genau ein Daily-Workspace mit
  `pilot`, `internal_daily_test`, `0/0/0`, `pending_payment_setup`,
  `stripe`, `card`, Zahlungsbedingung `2026-06-v1` und genau eine
  Owner-Membership entsteht.
- Wiederholung und parallele Aufrufe: dieselbe Workspace-ID, höchstens ein
  `created=true`, keine Duplikate.
- Bestehender Workspace: keine Tarifkonvertierung; der vorhandene Workspace
  bleibt unverändert.
- Direkter authentifizierter Aufruf: `EXECUTE` verweigert, auch während eines
  offenen Fensters.
- Abgelaufenes, fehlendes oder beschädigtes Laufzeitfile: fail-closed, keine
  Mutation.

## Rollback

1. Das öffentliche Fenster zuerst deaktivieren.
2. Falls nur die App zurückgerollt wird, die RPCs installiert aber ungenutzt
   lassen; keine bestehenden Workspaces verändern.
3. Falls die Funktionen zurückgenommen werden müssen, `EXECUTE` zuerst für
   alle Browserrollen und `service_role` entziehen und anschließend nur die
   beiden neuen Funktionen droppen. Die Readiness fällt dann automatisch auf
   `false`.
4. Der Browser-INSERT-Contract bleibt bestehen und darf für einen Rollback
   niemals wieder geöffnet werden. Bestehende Workspaces, Abos und Zahlungen
   werden nicht gelöscht oder umgestellt.
