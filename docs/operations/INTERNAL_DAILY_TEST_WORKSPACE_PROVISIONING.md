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
- `updatedAt` ist gültig und liegt nicht in der Zukunft; bereits ein um eine
  Millisekunde zukünftiger Startzeitpunkt schließt das Fenster fail-closed;
- `public.ensure_internal_daily_test_workspace(uuid,text,boolean)` ist
  installiert und ausschließlich für `service_role` ausführbar;
- die validierten Workspace-CHECKs bilden exakt den kanonischen Wertvertrag
  einschließlich `internal_daily_test` und `card` ab;
- direkte Tabellen- und Spalten-`INSERT`-Rechte auf `public.workspaces` sind
  für `PUBLIC`, `anon` und `authenticated` entzogen;
- der Readiness-RPC bestätigt diesen kombinierten Zustand;
- `STRIPE_PRICE_INTERNAL_DAILY_TEST`, `STRIPE_SECRET_KEY`, eine App-URL und
  `STRIPE_WEBHOOK_SECRET` sind gemeinsam konfiguriert. Fehlt nur einer dieser
  Werte, bleiben Admin-Freigabe, öffentliche Auswahl, Pre-Sign-up-Admission
  und Daily-Workspace-Mutation fail-closed.

Die Anwendung nimmt keine User-ID, Tarifoption, Preise, Billing-Felder oder
Testflags aus dem Registrierungs-Request an. Der bestehende authentifizierte
Starter-RPC bleibt absichtlich Starter-only. Ein normaler Web-Deploy wendet
die Migration nicht an und aktiviert das Fenster nicht.

## Artefakte

- App-Grenze: `src/app/api/register/workspace/route.ts`
- frischer Zeitfensterstatus: `src/lib/runtimeProductSettings.ts`
- gemeinsame Stripe-/Webhook-Admission:
  `src/lib/internalDailyTestReadinessPolicy.mjs`
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
8. Daily-Preis, Stripe-Secret, kanonische App-URL und Webhook-Secret im
   exakten Ziel prüfen; die Prüfung darf nur Statuswerte und keine Secrets
   ausgeben.
9. Production-Postflight ausführen. Das öffentliche Fenster bleibt weiterhin
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
  case conname
    when 'workspaces_commercial_option_check' then
      pg_get_constraintdef(oid, true) =
        $commercial_option_contract$CHECK (commercial_option = ANY (ARRAY['pilot_only'::text, 'starter_paid_setup'::text, 'starter_no_setup_commitment'::text, 'internal_daily_test'::text]))$commercial_option_contract$
    when 'workspaces_payment_collection_method_check' then
      pg_get_constraintdef(oid, true) =
        $payment_collection_contract$CHECK (payment_collection_method IS NULL OR (payment_collection_method = ANY (ARRAY['none'::text, 'manual_invoice'::text, 'sepa_direct_debit'::text, 'card'::text])))$payment_collection_contract$
    else false
  end as exact_value_contract
from pg_constraint
where conrelid = 'public.workspaces'::regclass
  and conname in (
    'workspaces_commercial_option_check',
    'workspaces_payment_collection_method_check'
  )
order by conname;
```

Der Repository-Policytest sichert den erwarteten Migrationstext ab; maßgeblich
für den Rollout ist zusätzlich dieser Katalog-Postflight im tatsächlichen
Staging- beziehungsweise Production-Ziel. Falls ein PostgreSQL-Major-Upgrade
die kanonische Ausgabe ändert, bleibt Readiness absichtlich `false`, bis der
unveränderte Wertvertrag erneut geprüft und die erwartete Definition bewusst
aktualisiert wurde.

Vor der Anwendung müssen beide `incompatible_*`-Zähler `0` sein. Nach der
Anwendung müssen beide Constraint-Zeilen vorhanden und validiert sein; der
Wert `exact_value_contract` muss für beide Zeilen `true` sein. Damit reichen
weder ein bloßes Vorkommen von `internal_daily_test` beziehungsweise `card`
noch ein CHECK mit zusätzlichen erlaubten Werten aus. Auch alle übrigen
booleschen Werte müssen `true` sein. Zusätzlich mit der
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
- Fehlender Daily-Preis, Stripe-Secret, App-URL oder Webhook-Secret: Die
  Pre-Sign-up-Admission antwortet fail-closed und der Registrierungsablauf
  ruft Supabase Sign-up nicht auf; die Workspace-Mutation bleibt ebenfalls
  gesperrt. Der Checkout startet nicht, solange der Webhook nicht bereit ist.
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
