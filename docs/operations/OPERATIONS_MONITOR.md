# FanMind Operations Monitor

## Zweck

Der Operations Monitor erzeugt datensparsame Betriebsereignisse und Admin-Meldungen für:

- öffentliche Erreichbarkeit von `/api/health`;
- PM2-Status des Prozesses `fanmind`;
- Disk- und RAM-Auslastung;
- verbleibende Gültigkeit des TLS-Zertifikats;
- Aktualität von Datenbank-, Storage-, Server-Konfigurations- und Vollbackups;
- Alter des letzten Backup-Worker-Heartbeats.

Er liest keine Kontakte, Nachrichten, Prompts, KI-Ausgaben oder Zahlungsdaten.

## Standardzustand

Nach dem Merge werden Script, Service und Timer nur installiert. Der Monitor bleibt deaktiviert, solange nicht ausdrücklich gesetzt ist:

```text
FANMIND_OPERATIONS_MONITOR_ENABLED=true
```

Der Timer wird durch das Deployment nicht automatisch aktiviert.

Auch E-Mails bleiben separat deaktiviert:

```text
FANMIND_OPERATIONS_EMAIL_ENABLED=false
```

## Production-Konfiguration

Empfohlene Startwerte in `/var/www/fanmind/.env.production`:

```text
FANMIND_OPERATIONS_MONITOR_ENABLED=false
FANMIND_OPERATIONS_MONITOR_BASE_URL=https://fanmind.ch
FANMIND_OPERATIONS_EMAIL_ENABLED=false
FANMIND_OPERATIONS_DISK_WARNING_PERCENT=80
FANMIND_OPERATIONS_DISK_CRITICAL_PERCENT=90
FANMIND_OPERATIONS_MEMORY_WARNING_PERCENT=85
FANMIND_OPERATIONS_MEMORY_CRITICAL_PERCENT=95
FANMIND_OPERATIONS_SSL_WARNING_DAYS=30
FANMIND_OPERATIONS_SSL_CRITICAL_DAYS=7
FANMIND_OPERATIONS_DATABASE_BACKUP_MAX_HOURS=36
FANMIND_OPERATIONS_STORAGE_BACKUP_MAX_HOURS=36
FANMIND_OPERATIONS_CONFIG_BACKUP_MAX_HOURS=36
FANMIND_OPERATIONS_FULL_BACKUP_MAX_HOURS=192
FANMIND_OPERATIONS_BACKUP_WORKER_WARNING_MINUTES=20
FANMIND_OPERATIONS_BACKUP_WORKER_CRITICAL_MINUTES=60
FANMIND_OPERATIONS_HEALTH_EVENT_REPEAT_HOURS=6
```

Für kritische E-Mails zusätzlich:

```text
FANMIND_OPERATIONS_EMAIL_ENABLED=true
RESEND_API_KEY=<server-only>
FANMIND_NOTIFICATION_FROM=FanMind <noreply@fanmind.ch>
FANMIND_ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

Die Schalter dürfen erst nach einem erfolgreichen manuellen Test aktiviert werden. Schlüssel und Empfänger nicht in Logs oder Chat ausgeben.

## Datenmodell

Vor Aktivierung Migration anwenden:

```text
supabase/migrations/20260718190000_operations_monitor_components.sql
```

Der Monitor schreibt ausschließlich technische Metadaten in:

- `system_health_events`;
- `admin_notifications`;
- `operations_audit_log` für E-Mail-Ergebnisse.

Pro Komponente wird höchstens eine aktive Monitor-Meldung geführt. Wiederholte unveränderte Fehler erzeugen keine E-Mail-Flut. Bei Eskalation wird die bestehende Meldung wieder geöffnet; bei Erholung wird sie als gelöst markiert.

## Manueller Test vor Aktivierung

```bash
cd /var/www/fanmind
FANMIND_OPERATIONS_MONITOR_ENABLED=true node scripts/operations/operations-monitor.mjs
```

Danach prüfen:

1. `system_health_events` enthält nur technische Komponenten und Zusammenfassungen.
2. `/admin/operations` zeigt neue Zustände.
3. Es wurden keine Kontakt-, Nachrichten- oder Prompt-Inhalte gespeichert.
4. Bei normalem Zustand wurde keine kritische E-Mail gesendet.
5. Ein künstlich abgesenkter Disk-Warnwert erzeugt genau eine Warnung.
6. Nach Rückstellung wird dieselbe Meldung gelöst.

## Timer kontrolliert aktivieren

Erst nach erfolgreichem manuellen Test:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now fanmind-operations-monitor.timer
sudo systemctl start fanmind-operations-monitor.service
sudo systemctl status fanmind-operations-monitor.timer --no-pager
sudo journalctl -u fanmind-operations-monitor.service -n 100 --no-pager
```

## Deaktivieren

```bash
sudo systemctl disable --now fanmind-operations-monitor.timer
```

Zusätzlich in `.env.production`:

```text
FANMIND_OPERATIONS_MONITOR_ENABLED=false
FANMIND_OPERATIONS_EMAIL_ENABLED=false
```

## Sicherheitsgrenzen

- keine frei eingebbaren Befehle oder Pfade;
- keine Shell-Ausführung aus dem Browser;
- keine Antwortinhalte aus FanMind-Routen in Admin-Meldungen;
- keine Secrets in UI, Datenbank oder Logs;
- E-Mail nur bei neuer kritischer Eskalation und optional bei Entwarnung;
- systemd-Service ohne Root-Rechte und mit eingeschränktem Dateisystemzugriff;
- kein automatisches Aktivieren durch Deployment.
