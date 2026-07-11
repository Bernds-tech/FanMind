# FanMind Backup Worker

## Ausgangsanalyse

Vorhanden aus Phase 5: `/api/health`, `/admin/operations`, `AdminNotificationsBell`, Platform-Admin-Prüfung über `FANMIND_ADMIN_EMAILS`, die Tabellen `admin_notifications`, `system_health_events`, `admin_operation_jobs`, `backup_runs`, `operations_audit_log` und die Migration `20260711120000_phase_5_operations_foundation.sql`. Fehlend waren bisher atomare Job-Übernahme, echte Backup-Ausführung außerhalb von Next.js, Zeitpläne, Verschlüsselung, Offsite-Upload und Retention.

## Architektur

Die Web-App legt ausschließlich geprüfte Jobs in `admin_operation_jobs` an. Sie nimmt keine Shell-Befehle, Dateipfade oder freien Parameter aus dem Browser an. Der separate Worker `scripts/operations/backup-worker.mjs` läuft auf Production als root-eigener systemd-Service aus `/usr/local/lib/fanmind-ops/backup-worker.mjs` und verarbeitet nur die Allowlist:

- `backup_server_config`
- `backup_database`
- `backup_storage`
- `backup_full`
- `verify_backup`

Die atomare Übernahme erfolgt über `claim_admin_backup_job(worker_id, lease_seconds)` mit `FOR UPDATE SKIP LOCKED`, Lease, Retry abgelaufener Leases und maximal einem aktiven Backup-Job.

## Serverpfade, Eigentümer und Rechte

- `/usr/local/lib/fanmind-ops/backup-worker.mjs`: `root:root`, `0755`
- `/usr/local/sbin/fanmind-backup-worker` optionaler Wrapper: `root:root`, `0755`
- `/etc/fanmind-backup/worker.env`: `root:root`, `0600`
- `/etc/fanmind-backup/pgpass`: `root:root`, `0600`
- `/etc/fanmind-backup/recipient.txt`: `root:root`, `0644`, enthält nur den öffentlichen age-Empfänger
- `/etc/fanmind-backup/rclone.conf`: `root:root`, `0600`
- `/var/backups/fanmind`: `root:root`, `0700`

## ENV / Root-Konfiguration

Siehe `ops/systemd/fanmind-backup-worker.env.example`. Echte Werte werden nur auf dem Server gesetzt und nicht committet. Wichtig: `SUPABASE_SERVICE_ROLE_KEY` ist ausschließlich serverseitig für Worker und Admin-API vorgesehen.

## systemd

Installieren:

```bash
sudo install -o root -g root -m 0755 scripts/operations/backup-worker.mjs /usr/local/lib/fanmind-ops/backup-worker.mjs
sudo install -o root -g root -m 0644 ops/systemd/fanmind-backup-worker.service /etc/systemd/system/fanmind-backup-worker.service
sudo install -o root -g root -m 0600 ops/systemd/fanmind-backup-worker.env.example /etc/fanmind-backup/worker.env
sudo systemctl daemon-reload
sudo systemctl enable --now fanmind-backup-worker.service
```

Status und Logs:

```bash
sudo systemctl status fanmind-backup-worker.service
sudo journalctl -u fanmind-backup-worker.service -f
```

Deaktivierung/Rollback:

```bash
sudo systemctl disable --now fanmind-backup-worker.service
sudo rm -f /etc/systemd/system/fanmind-backup-worker.service
sudo systemctl daemon-reload
```

## Sicherheit

Der Worker nutzt `spawn(..., { shell:false })`, feste Jobtypen und feste Backup-Pfade. Browserdaten werden nicht als Shell-Argumente oder Dateipfade verwendet. Logs sind strukturiert und redigieren Key-/Secret-/Token-Felder. Restore ist nicht implementiert.

## Scheduling

Zeitpläne werden durch root-eigene systemd-Timer umgesetzt. Die Timer starten keine Backups direkt, sondern rufen `enqueue-backup-job.mjs` auf und legen einen geprüften Job an. Der laufende Worker übernimmt anschließend atomar.

- `fanmind-backup-database.timer`: täglich
- `fanmind-backup-storage.timer`: täglich
- `fanmind-backup-server_config.timer`: täglich
- `fanmind-backup-full.timer`: wöchentlich

Installation der Timer:

```bash
sudo install -o root -g root -m 0755 scripts/operations/enqueue-backup-job.mjs /usr/local/lib/fanmind-ops/enqueue-backup-job.mjs
sudo install -o root -g root -m 0644 ops/systemd/fanmind-backup-enqueue@.service /etc/systemd/system/fanmind-backup-enqueue@.service
sudo install -o root -g root -m 0644 ops/systemd/fanmind-backup-*.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now fanmind-backup-database.timer fanmind-backup-storage.timer fanmind-backup-server_config.timer fanmind-backup-full.timer
```

## Retention

`backup-retention.mjs` löscht nur Dateien, die dem Muster `fanmind-*.age` oder `fanmind-*.sha256` entsprechen. Vor Production-Ausführung muss Bernd den Dry-Run prüfen:

```bash
sudo FANMIND_BACKUP_ROOT=/var/backups/fanmind node /usr/local/lib/fanmind-ops/backup-retention.mjs --dry-run
```
