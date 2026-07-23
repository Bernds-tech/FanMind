# FanMind Read-only Production Operations Audit

## Zweck

`scripts/operations/read-only-production-audit.sh` sammelt einen redigierten technischen Zustandsnachweis für FanMind Production. Das Skript darf weder Dienste verändern noch Backups entschlüsseln oder Daten wiederherstellen. Es ergänzt `/api/version`, `/api/health`, den Operations-Monitor und den Backup-Verifier um einen reproduzierbaren Host-Nachweis.

Der Audit ist insbesondere für Issue #524 und den zentralen P1-Tracker #644 vorgesehen.

## Geprüfte Bereiche

Der Audit gibt ausschließlich die folgenden Kategorien aus:

- Zeitpunkt und sichere Runtime-Versionen;
- Server-HEAD, `origin/main`, öffentlicher Release-Commit und Environment;
- öffentlicher Health-Gesamtstatus und veröffentlichte Komponentenstatus;
- ausgewählte PM2-Metadaten: Status, Restart-Zähler, instabile Restarts, Uptime, CWD, Ausführungsmodus und Memory;
- Ergebnis von `nginx -t`;
- HTTP-Status des lokalen und öffentlichen Login-Endpunkts;
- Root-Dateisystembelegung, verfügbarer Arbeitsspeicher und Reboot-Hinweis;
- Namen und Aktivierungsstatus der `fanmind-*`-systemd-Units;
- stabile Timer-Metadaten je konkreter `fanmind-*.timer`-Unit über `NextElapseUSecRealtime`, `NextElapseUSecMonotonic` und `LastTriggerUSec`;
- Anzahl und Aktualität verschlüsselter Backup-/Prüfsummen-Paare;
- checksum-only-Verifikation des neuesten verschlüsselten Vollbackups;
- bei aktivierter Offsite-Konfiguration nur Erreichbarkeit, Objekt-/Paaranzahlen und der neueste Vollbackup-Dateiname;
- ausschließlich erlaubte strukturierte Backup-Worker-Ereignisnamen und deren Anzahl, getrennt für die letzten 24 Stunden und 14 Tage.

## Harte Sicherheitsgrenzen

Das Skript führt ausdrücklich **nicht** aus:

- kein `pg_restore`, `psql` oder Datenbank-Write;
- keine `age`-Entschlüsselung und keine Verwendung einer privaten age-Identity;
- kein `rclone copy`, `sync`, `move`, `delete` oder `purge`;
- kein Start, Stop, Restart, Enable oder Disable von systemd-/PM2-Diensten;
- keine nginx-Neuladung;
- keine Git-Änderung;
- keine POST-/PUT-/PATCH-/DELETE-Anfrage;
- keine Ausgabe von `.env.production`, `worker.env`, Tokens, Keys, Passwörtern, Remote-Namen, Remote-Pfaden oder Backup-Inhalten;
- keine Ausgabe des vollständigen PM2-JSON oder der PM2-Environment-Map;
- keine Ausgabe von Backup-Job-IDs, Worker-Fehlertexten, Pfaden aus Fehlern oder vollständigen Journalzeilen.

Die wenigen `sudo -n`-Aufrufe sind auf lesende Prüfungen beschränkt: `nginx -t`, Dateisystem-Inventar, checksum-only-Verifier, read-only Offsite-Listing und Journal-Auswertung. Ein fehlendes non-interactive Recht führt zum Abbruch oder zu einem klaren `unavailable`-Status; das Skript fordert kein Passwort interaktiv an.

## Ausführung

Auf dem Production-Host aus einem vertrauenswürdigen, geprüften Repository-Stand:

```bash
cd /var/www/fanmind
bash scripts/operations/read-only-production-audit.sh
```

Optionale, nicht geheime Pfadparameter:

```bash
FANMIND_AUDIT_APP_ROOT=/var/www/fanmind \
FANMIND_AUDIT_BACKUP_ROOT=/var/backups/fanmind \
FANMIND_AUDIT_PUBLIC_BASE_URL=https://fanmind.ch \
FANMIND_AUDIT_PM2_APP_NAME=fanmind \
bash scripts/operations/read-only-production-audit.sh
```

## systemd- und Worker-Ausgabe

Die Timer-Ausgabe wird nicht aus lokalisierten Spalten von `systemctl list-timers` abgeleitet. Für jede konkrete Timer-Unit werden ausschließlich stabile Properties gelesen. Kalender-Timer nutzen typischerweise `next_realtime`; relative Timer wie `OnUnitActiveSec` können stattdessen nur `next_monotonic` liefern:

```text
SYSTEMD_TIMER=<unit>|next_realtime=<timestamp-or-unknown>|next_monotonic=<value-or-unknown>|last=<timestamp-or-unknown>
```

Die Backup-Worker-Ausgabe verwendet eine feste Ereignis-Whitelist und zwei Zeitfenster:

```text
BACKUP_WORKER_WINDOW=24h
BACKUP_WORKER_EVENT=24h|job_failed:0
BACKUP_WORKER_WINDOW=14d
BACKUP_WORKER_EVENT=14d|job_failed:<count>
BACKUP_WORKER_24H_FAILURE_EVENT_COUNT=0
BACKUP_WORKER_24H_FAILURE_FREE=true
```

Ältere, bereits behobene Fehler bleiben im 14-Tage-Fenster sichtbar, ohne den aktuellen 24-Stunden-Zustand zu verschleiern. Ausgegeben werden nur Zähler für `worker_start`, `worker_stop`, `sigterm_received`, `claim_failed`, `job_claimed`, `job_failed`, `job_rejected` und `fatal`.

## Backup-Prüfung

Der Audit wählt das neueste lokale Artefakt nach dem Muster

```text
fanmind-full-*.tar.gz.age
```

und ruft den bestehenden Verifier ausschließlich ohne `--identity` auf. Dadurch werden nur:

- Artefakt und benachbarte `.sha256`-Datei auf Lesbarkeit geprüft;
- Dateinamensbindung geprüft;
- SHA-256 neu berechnet und verglichen;
- Backup-Typ und Dateigröße ermittelt.

Das Ergebnis muss `mode=checksum_only` und `backupType=full` melden. Eine inhaltliche Prüfung oder ein Restore bleibt dem isolierten Ablauf in `docs/operations/RESTORE_DRILL.md` vorbehalten.

## Offsite-Prüfung

Die Offsite-Konfiguration wird nicht per Shell `source` ausgeführt. Das Skript liest nur vier ausdrücklich erlaubte Konfigurationsfelder als Text:

- `FANMIND_BACKUP_OFFSITE_ENABLED`;
- `FANMIND_BACKUP_RCLONE_REMOTE`;
- `FANMIND_BACKUP_RCLONE_CONFIG`;
- `FANMIND_BACKUP_REMOTE_PATH`.

Remote-Name und Remote-Pfad werden nicht ausgegeben. Bei aktivierter und vollständiger Konfiguration wird ausschließlich `rclone lsf --files-only --recursive` verwendet. Der Audit bewertet, ob verschlüsselte Artefakte und Prüfsummen als vollständige Paare vorliegen.

## Pass-Kriterien

Eine vollständig durchgelaufene technische Audit-Ausführung endet mit:

```text
AUDIT_RESULT=success
```

Für einen belastbaren Operations-Pass müssen zusätzlich gelten:

- Server-HEAD, `origin/main` und `LIVE_RELEASE` sind identisch;
- `LIVE_ENVIRONMENT=production`;
- `LIVE_HEALTH=healthy` und alle Pflichtkomponenten sind gesund;
- `PM2_STATUS=online` und `PM2_UNSTABLE_RESTARTS=0`;
- nginx-Konfiguration ist gültig;
- lokaler und öffentlicher Login antworten mit 2xx/3xx;
- Backup-Root ist verfügbar;
- keine verwaisten lokalen Backup-Paare;
- das neueste Vollbackup besteht die checksum-only-Prüfung;
- bei aktivierter Offsite-Sicherung ist das Remote erreichbar und enthält keine verwaisten Paare;
- `BACKUP_WORKER_24H_FAILURE_FREE=true`.

Ein `REBOOT_REQUIRED=true` ist kein automatischer Neustartauftrag. Der Neustart benötigt einen eigenen kontrollierten Plan mit Backup-, Rollback- und anschließendem Smoke-Test.

## GitHub-Actions-Sicherheitsregel

Production-nahe Self-Hosted Runner dürfen nicht dauerhaft beliebigen Pull-Request-Code ausführen. Ein temporärer Audit-Workflow darf deshalb nur auf einem vertrauenswürdigen internen Branch verwendet und muss vor dem Merge entfernt werden. Dauerhafte Automation muss ausschließlich Code aus dem geschützten `main`-Stand ausführen oder einen bereits auf dem Server installierten, root-eigenen Audit verwenden.

## Dokumentation eines Laufs

In #524 und #644 werden nur die redigierten Felder dokumentiert:

- Audit-Zeitpunkt und Run-ID;
- Release-Synchronität;
- Health-, PM2-, nginx-, Disk-/RAM- und Reboot-Status;
- systemd-/Timer-Gesamtbild;
- Backup-Paaranzahlen, Alter und checksum-only-Ergebnis;
- Offsite-Erreichbarkeit/Paarstatus;
- Backup-Worker-Zähler im 24-Stunden- und 14-Tage-Fenster;
- verbleibende Maßnahmen.

Keine Rohkonfiguration, kein vollständiges Journal und keine Secret-bearing Artefakte werden an Issues angehängt.
