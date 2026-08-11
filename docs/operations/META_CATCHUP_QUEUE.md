# Meta Conversation Catch-up Queue – kontrollierter Staging-Pfad

## Zweck und Aktivierungsgrenze

Inbound-Facebook-/Instagram-Webhooks speichern die konkrete Nachricht
idempotent und führen im HTTP-Request keine Profil- oder Historienabfrage bei
Meta aus. Bei ausdrücklich aktiviertem Flag bündelt der Webhook nur einen
workspace-, connection-, plattform- und thread-gebundenen Auftrag. Ein
getrennter Worker verarbeitet ihn später.

Der SQL-Schritt
`supabase/controlled/20260811230000_meta_conversation_catchup_queue.sql` wird
von keinem normalen Web-Deploy ausgeführt. Die Vorbereitung installiert,
aktiviert oder startet auch den Worker nicht. Production ist ausgeschlossen.

## Offline-Prüfung

```bash
npm run db:meta-catchup-queue:check
```

Der Runner akzeptiert nur den bytegenau festgeschriebenen SHA-256-Wert und
prüft den Tabellen-, RLS-, Coalescing-, Lease-, Retry-/Dead-Letter- und
service-role-only-Vertrag.

## Manuelle Staging-Kontrollen

Beide Workflows laufen ausschließlich per `workflow_dispatch`, auf `main`, für
den exakten `reviewed_commit`, im GitHub-Environment `staging`, über TLS und
gegen eine explizit von Production abweichende Supabase-Projektreferenz.

1. Nach Review und Merge den Workflow
   `FanMind Meta Catch-up Queue Staging Apply` mit dem exakten Main-Commit und
   der Bestätigung `apply-meta-catchup-queue` starten. Vor dem schreibenden
   Schritt führt er den gemeinsamen Staging-Rollout-Zustand read-only aus und
   verlangt exakt `STAGING_DATABASE_ROLLOUT_META_CATCHUP=apply` sowie
   `STAGING_DATABASE_ROLLOUT_STATE=PASS`.
2. Nur `META_CATCHUP_QUEUE_APPLY=completed`,
   `META_CATCHUP_QUEUE_POSTFLIGHT=PASS`,
   `META_CATCHUP_QUEUE_POSTFLIGHT_TRANSACTION=ROLLED_BACK` und
   `SECRETS_WURDEN_NICHT_AUSGEGEBEN=true` akzeptieren.
3. Anschließend `FanMind Meta Catch-up Queue Staging Verify` mit demselben
   Commit und `verify-meta-catchup-queue` ausführen. Dieser Lauf ist read-only.

Meldet der gemeinsame Zustand für die Queue `verify`, ist sie bereits
vollständig vorhanden und darf nicht erneut angewendet werden. `block` oder
eine fehlende/exakt abweichende Ergebniszeile stoppt vor dem ersten
schreibenden `psql`-Aufruf.

Der Postflight prüft Metadaten, RLS/`FORCE RLS`, zusammengesetzte
Workspace-Fremdschlüssel, den partiellen Coalescing-Index, fehlende
Browserrechte, die nur lesende direkte Service-Role-Berechtigung und die drei
ausschließlich für `service_role` ausführbaren Funktionen. Die Prüfung läuft
in einer zurückgerollten Transaktion.

## Noch erforderliche synthetische Acceptance

Vor Worker-Aktivierung muss das isolierte Staging zusätzlich mit einem
synthetischen Workspace und einer synthetischen Meta-Connection belegen:

- doppelte Enqueues ergeben genau einen offenen Auftrag und erhöhen die
  Generation;
- parallele Claims liefern dieselbe Zeile nie an zwei Worker;
- Retry-Backoff endet nach fünf Versuchen in `dead_letter`;
- ein Worker-Neustart übernimmt erst nach Lease-Ablauf;
- neue Generationen während eines Claims bleiben als `pending` erhalten;
- falscher Workspace, falsche Connection, getrennte Connection und ungültiger
  Kontakt scheitern fail-closed;
- archivierter, abgelaufener oder nicht freigegebener Workspace wird
  `cancelled`, vorhandene CRM-Daten bleiben erhalten;
- der Webhook-Request führt keinen Graph-Historienaufruf aus;
- es wird weder Analyse noch automatischer Versand ausgelöst;
- Logs enthalten nur feste Ereignis-/Fehlercodes, Disposition und
  Versuchszähler, niemals IDs, Tokens, Body, Profil, Text oder Paging-URL.

Diese Acceptance darf keine realen Kunden-, Meta- oder Production-Daten
verwenden. Reale Meta-Testkonten und rechtliche Freigaben bleiben ein späteres,
eigenes Gate.

## Worker-Vorbereitung und Aktivierung

Die Vorlagen liegen unter:

- `scripts/operations/meta-catchup-worker.mjs`
- `ops/systemd/fanmind-meta-catchup-worker.service`
- `ops/systemd/fanmind-meta-catchup-worker.env.example`

Erst nach vollständig grüner Staging-Acceptance:

1. einen mindestens 32 Zeichen langen, getrennten
   `FANMIND_META_CATCHUP_WORKER_SECRET` ausschließlich in App und Worker
   hinterlegen;
2. Worker-Datei und Unit auf dem isolierten Staging-Host installieren, aber
   noch nicht aktivieren;
3. Worker-ENV mit Staging-Supabase, interner App-Origin und
   `FANMIND_META_CATCHUP_QUEUE_ENABLED=true` konfigurieren;
4. Worker starten und leere Queue/Health prüfen;
5. erst danach das App-Flag in Staging auf `true` setzen und die isolierte App
   neu starten;
6. synthetischen Webhook und Queue-/Worker-Abschluss erneut prüfen.

Keiner dieser Schritte ist Teil des normalen Deploy-Workflows.

## Sicherer Rollback

1. App-Flag auf `false` setzen und die isolierte Staging-App neu starten; neue
   Webhooks speichern weiter ihre konkrete Nachricht, enqueuen aber nichts.
2. Worker stoppen und deaktivieren.
3. Offene Queuezeilen unverändert erhalten; keine Tabelle und keine
   bestehende CRM-Historie löschen.
4. Ursache beheben und nach erneuter Abnahme fortsetzen. Abgelaufene Leases
   werden dann kontrolliert übernommen.

Ein Schema-Drop oder eine Production-Übertragung benötigt einen separaten,
ausdrücklich freigegebenen und datenverlustgeprüften Ablauf.
