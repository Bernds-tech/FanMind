# FanMind Backup Worker

## Ausgangsanalyse

Vorhanden aus Phase 5: `/api/health`, `/admin/operations`, `AdminNotificationsBell`, Platform-Admin-Prüfung über `FANMIND_ADMIN_EMAILS`, die Tabellen `admin_notifications`, `system_health_events`, `admin_operation_jobs`, `backup_runs`, `operations_audit_log` und die Migration `20260711120000_phase_5_operations_foundation.sql`. Fehlend waren bisher atomare Job-Übernahme, echte Backup-Ausführung außerhalb von Next.js, Zeitpläne, Verschlüsselung, Offsite-Upload und Retention.

## Architektur

Die Web-App legt ausschließlich geprüfte Jobs in `admin_operation_jobs` an. Sie nimmt keine Shell-Befehle, Dateipfade oder freien Parameter aus dem Browser an. Der separate Worker `scripts/operations/backup-worker.mjs` läuft auf Production als root-eigener systemd-Service aus `/usr/local/lib/fanmind-ops/backup-worker.mjs` und verarbeitet nur die Allowlist:

- `backup_server_config`
- `backup_database`
- `backup_storage`
- `backup_full`

Die atomare Übernahme erfolgt über `claim_admin_backup_job(worker_id, lease_seconds)` mit `FOR UPDATE SKIP LOCKED`, Lease, Retry abgelaufener Leases und maximal einem aktiven Backup-Job. Die RPC-Funktion wird ausschließlich serverseitig mit `SUPABASE_SERVICE_ROLE_KEY` aufgerufen; `PUBLIC`, `anon` und `authenticated` dürfen kein `EXECUTE` auf diese Funktion haben, während `service_role` nach der Folgemigration `20260711170000_grant_backup_worker_rpc_service_role.sql` `EXECUTE` erhält.


## Leerlauf, RPC-Antworten und Heartbeat

PostgREST kann für `public.claim_admin_backup_job(text, integer)` bei leerer Queue je nach Composite-Rückgabetyp nicht nur JavaScript `null`, sondern auch ein leeres Array oder ein Composite-Leerobjekt wie `{ id: null, job_type: null }` liefern. Der Worker normalisiert deshalb die RPC-Antwort vor jeder Verarbeitung: `null`, `undefined`, `[]`, leere Composite-Zeilen und Jobs ohne nichtleere `id` oder ohne erlaubten `job_type` gelten nicht als ausführbarer Job. In diesem No-Job-Pfad wird kein `job_claimed` geschrieben, kein `handle(job)` aufgerufen, keine Admin-Benachrichtigung erzeugt und kein Audit-Eintrag angelegt; der Worker wartet regulär `FANMIND_BACKUP_POLL_MS` (Standard: 30 Sekunden), bevor er erneut pollt.

Ein tatsächlich beanspruchter Job mit nicht erlaubtem `job_type` wird defensiv als `failed` markiert und ohne Secrets mit `job_rejected` protokolliert. Die Allowlist des Workers bleibt `backup_server_config`, `backup_database`, `backup_storage` und `backup_full`; `verify_backup` bleibt deaktiviert, bis ein echter serverseitiger Verifier implementiert ist.

Der Job-Poll bleibt über `FANMIND_BACKUP_POLL_MS` kurzfristig steuerbar. Heartbeats in `system_health_events` sind davon entkoppelt und werden über `FANMIND_BACKUP_HEARTBEAT_MS` gesteuert (Standard: 300000 ms / 5 Minuten), damit normaler Leerlauf nicht alle 30 Sekunden zusätzliche Health-Zeilen erzeugt.

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

## Production-blocker fixes before installation (#538)

This PR keeps Phase 5 in preparation; do not install the worker or run Production migrations until after merge and manual review.

- Full backups are now single encrypted tar artifacts. The tar is assembled in a protected temporary full-backup directory and contains the encrypted server-config, database and storage part artifacts, their `.age.sha256` files, and a central `manifest.json` with file names, sizes and SHA256 values.
- Every backup move treats `<artifact>.age` and `<artifact>.age.sha256` as one unit. The worker re-reads the destination checksum file and recalculates SHA256 over the destination artifact before it writes `backup_runs.checksum_reference`.
- Offsite upload copies both the encrypted artifact and its `.sha256`; upload is marked `uploaded` only after both transfers succeed.
- `FANMIND_PM2_DUMP_FILE` is required operational configuration. Production uses `/home/ubuntu/.pm2/dump.pm2`; the worker checks readability and only logs `pm2_dump_file_unreadable` if it is missing.
- Storage backup walks each prefix with offset pagination (`FANMIND_STORAGE_BACKUP_PAGE_SIZE`, max 1000), ignores `.emptyFolderPlaceholder`, rejects duplicate paths and fails if listing and downloaded counts differ.
- `verify_backup` is disabled for this PR: it is absent from the UI, enqueue allowlist, worker allowlist and follow-up DB constraint until a real server-side verifier is implemented.
- The server-config backup intentionally includes `/etc/fanmind-backup` as `sensitive_encrypted_config`. This captures `worker.env`, `pgpass`, `rclone.conf` and the public age recipient only inside encrypted artifacts; plaintext remains in the worker temp directory and is removed during cleanup.
- `MemoryDenyWriteExecute=true` is intentionally omitted from the service because Node.js 24/V8 on Ubuntu 24.04 may require writable executable memory during startup. Other hardening remains: `NoNewPrivileges`, `PrivateTmp`, `ProtectSystem=strict`, `ProtectHome=read-only`, explicit `ReadOnlyPaths` and explicit `ReadWritePaths`.

Manual order after merge: do not install or start the worker until all required Production migrations have been applied and reviewed in this exact order: (1) `20260711120000_phase_5_operations_foundation.sql`, (2) `20260711143000_phase_5_backup_worker.sql`, (3) `20260711161500_disable_verify_backup_until_safe_validation.sql`, (4) `20260711170000_grant_backup_worker_rpc_service_role.sql`. The last migration confirms `public.claim_admin_backup_job(text, integer)` exists, keeps `EXECUTE` revoked from `PUBLIC`, `anon` and `authenticated`, and grants `EXECUTE` only to `service_role` so PostgREST RPC calls made with the server-side service role can claim queued jobs. Only after those migrations: install files; set `/etc/fanmind-backup/worker.env`; run `systemd-analyze verify /etc/systemd/system/fanmind-backup-worker.service`; start worker; enqueue a controlled test backup; verify Operations Center and files under `/var/backups/fanmind`. Rollback: stop/disable the service and timers, leave backup artifacts in place, and revert queued jobs to `blocked` manually if needed.
