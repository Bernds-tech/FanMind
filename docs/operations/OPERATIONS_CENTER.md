# Operations Center

`/admin/operations` ist die Phase-5-Oberfläche für Betriebsstatus, Backup-Transparenz und sichere Backup-Job-Anforderung.

## Backup-Worker-Erweiterung

Die Oberfläche zeigt jetzt echte Metadaten aus `backup_runs` und `admin_operation_jobs`: Status, Startzeit, Größe, SHA256, Offsite-Status, Worker, Lease und Ergebnisreferenz. Platform-Admins können Server-Konfigurations-, Datenbank-, Storage- und Vollbackups einreihen. Die API führt niemals ein Backup direkt aus, sondern schreibt nur einen allowlist-geprüften Job.

## Manuelle Schritte nach Merge

1. Migration `supabase/migrations/20260711143000_phase_5_backup_worker.sql` prüfen und manuell anwenden.
2. age-Empfänger und PGPASSFILE auf Production unter `/etc/fanmind-backup/` konfigurieren.
3. Worker-Dateien nach `/usr/local/lib/fanmind-ops/` installieren.
4. systemd-Service aktivieren.
5. Optional rclone-Offsite konfigurieren.

Externe E-Mail-Alarmierung, Sentry/Fehlertracking, Deployment-/Rollback-Umbau, Production/Test-Trennung und Restore-Test bleiben offen.

## Verify backup scope

The Operations Center can enqueue server-config, database, storage and full backups only. `verify_backup` was removed until validation can be implemented strictly by `backup_runs.id`, with server-side path resolution under `FANMIND_BACKUP_ROOT`, symlink/path-traversal protection and checksum/manifest validation without decrypting Production data.
