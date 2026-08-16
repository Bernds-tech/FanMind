# Persistenter Workspace-KI-Stufenspeicher

Stand: 16. August 2026

## Ziel und Grenze

`workspace_ai_tier_entitlements` ist die spätere serververwaltete Source of
Truth für genau ein optionales KI-Add-on eines Workspaces. Eine fehlende Zeile
bedeutet immer KI Standard.

Die additive Migration
`supabase/migrations/20260727090000_workspace_ai_tier_entitlements.sql` ist
vorbereitet. Ein extern gemeldeter Staging-Stand von 45 Migrationen ist mit
ihrer Anwendung vereinbar, beweist aber weder den exakten Ledger-Eintrag noch
den vollständigen Objektvertrag. Vor einem Apply entscheidet deshalb der
read-only Ablauf in `STAGING_DATABASE_ROLLOUT_STATE.md` zwischen
`verify`, `skip`, `apply` und `block`. Für Production liegt weiterhin kein
Anwendungsnachweis vor. Der echte Stripe-Webhook ist mit einer standardmäßig
inaktiven Server-Brücke verdrahtet. Sie liest und schreibt den Speicher erst,
wenn `FANMIND_AI_TIER_STRIPE_PERSISTENCE_ENABLED=true`,
`FANMIND_AI_TIER_WORKSPACE_CONTRACT_CONFIRMED=true` und zwei vollständige,
unterschiedliche KI-Price-IDs vorliegen. Checkout und produktive KI-Endpunkte
verwenden den Speicher weiterhin nicht. Plus und Ultra bleiben dadurch und
durch die zentrale Readiness blockiert.

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

1. Diesen App-Brückenstand deployen. Ohne das dedizierte Persistence-Gate und
   den bestätigten Workspace-Vertrag bleibt die Stripe-Brücke vollständig
   inaktiv; der Loader ist noch an keinen produktiven KI-Pfad angeschlossen.
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
7. Den Stripe-Lifecycle-Vertrag in `src/lib/aiTierStripeLifecycle.mjs` und die
   Webhook-Brücke in `src/lib/aiTierStripeEntitlementSync.mjs` mit
   synthetischen Stripe-Testevents abnehmen. Sie prüfen Workspace-Ziel,
   Übereinstimmung aller direkten Workspace-IDs, gespeicherte Customer- und
   Basis-Subscription-Bindung, Price-Allowlist, vollständige Item-Zuordnung,
   Entfernen des Add-ons,
   Ereignisreihenfolge, idempotente Wiederholungen und optimistische
   Schreibkonflikte. Starter-only Subscriptions müssen ein schreibfreies No-op
   bleiben.
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
andere Projektreferenz als Production verwenden. Ein Staging-Apply verlangt
zusätzlich `FANMIND_ENABLE_NON_PRODUCTION_WRITES=true`,
`FANMIND_NON_PRODUCTION_WRITE_ACK=I_UNDERSTAND_NON_PRODUCTION_ONLY` und die
exakte Migrationsbestätigung. Ein Production-Apply verlangt zusätzlich einen
Change-Verweis und dieselbe exakte Migrationsbestätigung:

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

Der Ablauf ist als manueller, rollback-only Workflow vorbereitet:
`FanMind AI Tier Staging Acceptance`.

Vor der Migration kann `FanMind AI Tier Staging Resource Readiness` manuell
von `main` im GitHub-Environment `staging` ausgeführt werden. Der Workflow
verlangt die Bestätigung `verify-ai-tier-staging-resources` und lässt
`FANMIND_ENABLE_NON_PRODUCTION_WRITES=false` sowie den Write-Acknowledge leer.
Er prüft ausschließlich:

- getrennte Supabase-Projektreferenz und gebundenen Datenbankhost;
- einen synthetischen Workspace mit unterschiedlichem Owner und Mitglied;
- aktive, monatliche Stripe-Testpreise in EUR zu 100 beziehungsweise 200 Euro;
- die private, eigentümergeführte Datenbank-Passwortdatei.

Die Workspace-Abfrage läuft in einer expliziten Read-only-Transaktion. Der
Ressourcencheck liest keine Entitlement-Zeilen, wendet keine Migration an und
startet weder Migration noch Abnahme. Erfolgreiche Ausgabe:

```text
AI_TIER_STAGING_STRIPE_CATALOG=PASS
AI_TIER_STAGING_SYNTHETIC_WORKSPACE=PASS
AI_TIER_STAGING_RESOURCE_MODE=READ_ONLY
AI_TIER_STAGING_RESOURCE_READINESS=PASS
```

Die Migration davor ist als eigener manueller Workflow
`FanMind AI Tier Staging Migration` vorbereitet. Er läuft ausschließlich vom
Branch `main` im GitHub-Environment `staging`, verlangt als Eingabe
`apply-workspace-ai-tier-entitlements`, führt zuerst den checksum-gebundenen
Offline-Check und danach genau einen zielgebundenen Apply samt read-only
Postflight aus. Die Passwortdatei wird nur im privaten Runner-Temp-Verzeichnis
erzeugt und anschließend immer entfernt. Der Workflow startet weder die
Abnahme noch eine Production-Migration automatisch.

Er verlangt zusätzlich zur allgemeinen Nicht-Production-Schreibfreigabe die
exakte Bestätigung `run-ai-tier-staging-acceptance`, einen leeren
synthetischen Workspace mit echtem Owner und Mitglied, Stripe Test Mode,
unterschiedliche Plus-/Ultra-Prices und eine private `PGPASSFILE`.

Der Workflow wendet keine Migration an. Er führt zuerst den read-only
Postflight aus, prüft danach beide Stripe-Testpreise gegen 100 beziehungsweise
200 Euro pro Monat, beweist die Browserrollen-Sperre für alle vier
Datenoperationen und führt den Service-Role-CRUD ausschließlich in einer
zurückgerollten Transaktion aus. Erfolgreiche Ausgabe:

```text
AI_TIER_STAGING_STRIPE_CATALOG=PASS
AI_TIER_STAGING_LIFECYCLE=PASS
AI_TIER_STAGING_BROWSER_BOUNDARY=PASS
AI_TIER_STAGING_SERVICE_ROLE_CRUD=PASS
AI_TIER_STAGING_TRANSACTION=ROLLED_BACK
AI_TIER_STAGING_ACCEPTANCE=PASS
```

`npm run ai:tiers:staging:check` prüft den lokalen Vertrag offline. Nur
`npm run ai:tiers:staging:run` mit echten, getrennten Staging-Ressourcen darf
als Abnahme gelten.

`npm run ai:tiers:staging:preflight` ist ausschließlich der vorgelagerte
Read-only-Ressourcennachweis und ersetzt weder Migration noch Abnahme.

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
- echter Stripe-Testmode-Lauf der nun verdrahteten Lifecycle-Brücke;
- Production-Migration und erst danach zielgebundene Aktivierung des
  Workspace-Vertrags;
- konkrete Modelle und Monatskontingente;
- Verdrahtung mit Antwortvorschlägen und Nutzungsgrenzen;
- abschließende Production-Abnahme.

Die bestehende Tabelle kann die letzte Event-ID und -Zeit dauerhaft speichern
und per Compare-and-swap gegen paralleles Überschreiben schützen. Sie besitzt
aber kein vollständiges Event-Ledger. Zwei verschiedene Stripe-Events mit
derselben Sekunden-Zeit bleiben deshalb bewusst `retry`, statt willkürlich
geordnet zu werden. Der sichere Folgeschritt ist eine getrennt freizugebende,
service-role-only Event-Tabelle mit eindeutiger Event-ID sowie eine
transaktionale Datenbankfunktion, die Event-Insert, Subscription-Lock und
Entitlement-Mutation gemeinsam ausführt. Bei gleicher Zeit oder einem
Subscription-Wechsel muss der Worker zusätzlich den kanonischen aktuellen
Subscription-Stand von Stripe abrufen und abgleichen. Diese Migration wird
erst nach Testmode-Design, RLS-/Rechteprüfung, Rollback-Abnahme und eigener
Production-Freigabe erstellt.
