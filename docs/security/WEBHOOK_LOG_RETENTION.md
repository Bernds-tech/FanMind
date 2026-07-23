# FanMind Webhook-, Diagnose- und Log-Retention

## Ziel

Technische Webhook- und Fehlerdiagnosen müssen datensparsam, zeitlich begrenzt und reproduzierbar betrieben werden. Dieser Bereich ist strikt von fachlichen CRM-Daten getrennt.

Nicht Teil dieser Retention sind:

- Kontakte;
- Konversationen und Nachrichten;
- Kontaktwissen;
- Follow-ups;
- Rechnungen und Billing-Daten;
- Backups;
- Social-Connection-Credentials.

## Geprüfter Ausgangsstand

Der read-only Production-Audit für Issue `#695` hat bestätigt:

- Meta- und Telegram-Webhook-Secrets sind konfiguriert;
- `meta_webhook_events` existiert, enthielt beim Audit aber keine Zeilen;
- `server_error_events` und `server_error_groups` waren nicht deployt;
- nginx besitzt bereits Logrotate;
- journald besaß keine explizite Größen- oder Zeitgrenze;
- bestehender Code konnte Rohpayloads, Nachrichtentext, externe IDs und freie Fehlermeldungen in Diagnosepfade übernehmen;
- fehlende Meta-/Telegram-Secrets wurden in Production nicht konsequent fail-closed behandelt.

Der gezielte Nachaudit `#699` / Run `30043749121` bestätigte zusätzlich, dass das etablierte PM2-Modul `pm2-logrotate` bereits online war. Seine produktive Konfiguration beträgt 10 MiB, 14 Rotationen, Kompression und tägliche Rotation. Eine im ersten Retention-Rollout zusätzlich installierte systemweite PM2-Regel war daher redundant und wurde über `#700` wieder entfernt.

Es gab keine bestehende Production-Altlast in `meta_webhook_events`, die vor der Codehärtung gelöscht werden musste.

## Webhook-Authentifizierungsgrenze

### Meta

- `FACEBOOK_WEBHOOK_VERIFY_TOKEN` beziehungsweise der dokumentierte Legacy-Fallback ist für die Verifikation erforderlich.
- `FACEBOOK_APP_SECRET` beziehungsweise der dokumentierte Legacy-Fallback ist für POST-Signaturen erforderlich.
- In Production führt ein fehlendes oder zu kurzes Secret zu HTTP 503.
- Eine falsche oder syntaktisch ungültige HMAC-Signatur führt zu HTTP 403.
- Der Vergleich erfolgt zeitkonstant.
- Request-Bodies sind auf 1.000.000 Bytes begrenzt.

### Telegram

- `TELEGRAM_WEBHOOK_SECRET` ist in Production erforderlich.
- Fehlende Konfiguration führt zu HTTP 503.
- Ein falscher Header führt zu HTTP 401.
- Request-Bodies sind auf 1.000.000 Bytes begrenzt.

Öffentliche Antworten enthalten nur stabile Fehlerklassen. Provider-, Datenbank- oder Credential-Details werden nicht zurückgegeben.

## Minimierter Meta-Diagnosevertrag

Neue Zeilen in `meta_webhook_events` dürfen ausschließlich technische Strukturmerkmale enthalten:

- Plattform und Eventtyp;
- Richtung und Nachrichtenart;
- ob Text, URL oder Identifikatoren vorhanden waren;
- Anzahl und Typen von Anhängen;
- rekursiv minimierte Provider-Struktur ohne Rohwerte;
- stabiler Status und optionaler maschinenlesbarer Fehlercode;
- Zeitstempel und interne Workspace-/Connection-Zuordnung.

Die folgenden Spalten müssen bei neuen Diagnosezeilen immer `NULL` sein:

- `page_id`;
- `sender_id`;
- `recipient_id`;
- `text`;
- `message_text`;
- `message_id`.

`raw_payload` enthält keine Rohtexte oder IDs. Strings werden nach Feldklasse durch Marker wie `[text_present]`, `[identifier_present]`, `[url_present]` oder `[redacted]` ersetzt. Objekttiefe, Schlüsselanzahl und Arraylänge sind begrenzt.

Die additive Datenbank-Constraint wird als `NOT VALID` angelegt. Dadurch werden historische Zeilen nicht automatisch verändert, während jede neue oder aktualisierte Zeile den minimierten Vertrag erfüllen muss.

## Sichere Fehlercodes

Erlaubte Diagnosecodes sind fest in `src/lib/webhookSecurityPolicy.mjs` definiert. Freie Provider- oder Supabase-Fehlermeldungen dürfen weder in öffentlichen Antworten noch in Webhook-Logs oder Diagnosezeilen übernommen werden.

Beispiele:

- `invalid_signature`;
- `workspace_not_configured`;
- `connection_lookup_failed`;
- `message_persist_failed`;
- `conversation_sync_failed`;
- `diagnostic_persist_failed`.

## Datenbank-Retention

Migration:

```text
supabase/migrations/20260723184500_webhook_diagnostic_retention.sql
```

RPC:

```text
public.manage_meta_webhook_event_retention(
  p_retention_days integer,
  p_limit integer,
  p_execute boolean
)
```

Eigenschaften:

- ausschließlich `service_role` darf den RPC ausführen;
- Standard-Retention: 30 Tage;
- Standard-Maximalmenge: 500 Zeilen pro Lauf;
- harte Obergrenze: 5.000 Zeilen;
- Dry-Run mit `p_execute=false`;
- Execute mit `p_execute=true`;
- Auswahl immer nach `created_at, id`;
- konkurrierende Läufe verwenden `FOR UPDATE SKIP LOCKED`;
- Ergebnis enthält nur Kandidatenzahl, Löschzahl und `has_more`;
- kein unbounded `DELETE`;
- keine andere Tabelle wird durch den Meta-RPC verändert.

`manage_server_error_event_retention` ist rein additiv vorbereitet. Fehlt die optionale Tabelle, liefert der RPC `table_present=false` und verändert nichts.

## Worker und Timer

Worker:

```text
scripts/operations/webhook-diagnostic-retention.mjs
```

Manueller Dry-Run:

```bash
sudo -n env FANMIND_ENV_FILE=/var/www/fanmind/.env.production \
  /usr/bin/node /usr/local/lib/fanmind-ops/webhook-diagnostic-retention.mjs
```

Begrenzter Execute-Lauf:

```bash
sudo -n env FANMIND_ENV_FILE=/var/www/fanmind/.env.production \
  /usr/bin/node /usr/local/lib/fanmind-ops/webhook-diagnostic-retention.mjs --execute
```

Der Worker gibt ausschließlich aggregierte Zähler aus. Supabase-URL, Service-Role-Key, Payloads, IDs, Nachrichten und Fehlerdetails werden nicht ausgegeben.

Systemd-Dateien:

- `fanmind-webhook-retention.service`;
- `fanmind-webhook-retention.timer`.

Das Deployment installiert beide Dateien. Der Timer wurde erst nach Backup, Migration, Rechteprüfung, Dry-Run und einem begrenzten Production-Execute kontrolliert aktiviert.

## PM2- und journald-Grenzen

### PM2

Der **einzige PM2-Rotationsmechanismus** ist das bereits etablierte Modul `pm2-logrotate` unter dem PM2-Home des Production-Benutzers.

Verbindlicher, read-only bestätigter Stand:

- maximale Loggröße: 10 MiB;
- 14 Rotationen;
- Kompression aktiv;
- tägliche Rotation;
- Modulstatus `online`.

Die Datei `/etc/logrotate.d/fanmind-pm2` muss abwesend sein. Eine zweite systemweite `copytruncate`-Regel für dieselben PM2-Logs ist verboten, weil zwei voneinander unabhängige Rotationsmechanismen zu konkurrierenden Umbenennungen, mehrfacher Kompression oder unvorhersehbarem Retention-Verhalten führen können.

Das bestehende PM2-Modul darf durch normale FanMind-Deployments weder deinstalliert noch still umkonfiguriert werden. Änderungen an Größe, Anzahl, Kompression oder Intervall benötigen einen eigenen Operations-Review.

### journald

Repository-Vorlage:

```text
ops/systemd/journald-fanmind.conf
```

Verbindlicher Stand:

- Kompression aktiv;
- `SystemMaxUse=512M`;
- `RuntimeMaxUse=128M`;
- `MaxRetentionSec=14day`.

Die journald-Grenze ist hostweit. Installation, `systemd-analyze cat-config`, Dienstneustart und anschließende Health-Prüfung erfolgten in einem kontrollierten Operations-Schritt.

## Production-Rollout

Der initiale Rollout wurde über den nicht gemergten Operations-PR `#698` und Run `30043045085` ausgeführt:

1. Fach-PR vollständig grün geprüft und gemergt.
2. Exakten Release und gesunde Anwendung bestätigt.
3. Frisches verschlüsseltes Datenbank-Backup erzeugt.
4. `.age`-/`.age.sha256`-Paar checksum-only verifiziert.
5. Migration mit `psql -v ON_ERROR_STOP=1` angewendet.
6. Constraint, Funktionen und Rollenrechte geprüft.
7. Synthetische minimierte Diagnosezeile angelegt.
8. Rohwert-Insert durch die Constraint abgelehnt.
9. Dry-Run mit exakt einem Kandidaten ausgeführt.
10. Begrenzten Execute-Lauf ausgeführt und Probezeile entfernt.
11. Worker-Timer aktiviert und kontrolliert gestartet.
12. journald-Drop-in installiert und validiert.
13. `/api/version`, `/api/health`, Landingpage, Login und Registrierung geprüft.
14. Meta und Telegram mit falschen Credentials geprüft; es entstand keine Diagnose- oder CRM-Seitenwirkung.

Der anschließende read-only Nachaudit `#699` erkannte die bereits vorhandene PM2-Modulrotation. Die redundante systemweite PM2-Regel wurde deshalb über `#700` kontrolliert entfernt; `pm2-logrotate` blieb online und unverändert.

## Rollback

Bei einem Codeproblem:

1. Anwendung auf den vorherigen gesunden Release zurückrollen.
2. Health und Kernrouten prüfen.
3. Retention-Timer deaktivieren.
4. Die additive Tabelle/Constraint/RPCs zunächst bestehen lassen; sie verändern ohne Aufruf keine Daten.
5. Ursache in einem kleinen Folge-PR beheben.

Bei einem Host-Konfigurationsproblem:

1. Das bestehende PM2-Modul nicht deinstallieren oder verändern.
2. Sicherstellen, dass `/etc/logrotate.d/fanmind-pm2` abwesend bleibt.
3. Das journald-Drop-in aus dem vorab erzeugten Backup wiederherstellen oder gezielt entfernen.
4. Konfiguration syntaktisch prüfen.
5. betroffenen Dienst kontrolliert neu laden beziehungsweise starten.
6. FanMind-Health und Kernrouten erneut prüfen.

Die Migration wird nicht durch ein unkontrolliertes `DROP TABLE` zurückgerollt. CRM- und Billing-Daten werden niemals als Teil dieses Rollbacks gelöscht.
