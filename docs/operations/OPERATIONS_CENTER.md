# FanMind Admin Operations Center

`/admin/operations` ist die erste sichere Phase-5-Grundstruktur für Betriebstransparenz.

## Architektur
- Zugriff nur über `requirePlatformAdmin` und damit ausschließlich für E-Mails aus `FANMIND_ADMIN_EMAILS`.
- UI liest Betriebsdaten serverseitig mit `SUPABASE_SERVICE_ROLE_KEY`.
- Der Admin-Header lädt Meldungen über `/api/admin/notifications` und markiert sie über eine admin-only Route als gelesen oder quittiert.
- Es gibt keine Shell-Befehle, keinen Restore-Button und keine direkte privilegierte Serverausführung aus Next.js.

## Datenmodell
- `admin_notifications`: kritische, Warn-, Info- und Entwarnungsmeldungen mit gelesen/quittiert-Status.
- `system_health_events`: gespeicherte Healthcheck-Ergebnisse je Komponente.
- `admin_operation_jobs`: technische Admin-Jobs als Statusmodell, noch ohne Ausführung aus der UI.
- `backup_runs`: Backup-Läufe und Verifikationen als Metadatenmodell.
- `operations_audit_log`: serverseitiger Audit-Log für Betriebsaktionen.

Alle Tabellen aktivieren RLS und erstellen absichtlich keine `anon`-/`authenticated`-Policies. Platform-Admin-Lesen/Schreiben läuft über serverseitige Routen und Service Role.

## Sicherheitsgrenzen
- Keine Secrets, Tokens, Prompts, Fan-Nachrichten oder externen Login-Daten speichern.
- Keine frei eingebbaren Kommandos.
- Keine Production-Migrationen automatisch starten.
- Keine Restore-Aktion in der Web-App.
- Keine Service-Role-Keys an den Client.

## ENV-Variablen
- `FANMIND_ADMIN_EMAILS` – einzige Platform-Admin-Quelle.
- `SUPABASE_SERVICE_ROLE_KEY` – serverseitig für Operations-Tabellen.
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` – öffentliche Supabase-Konfiguration.
- `STRIPE_SECRET_KEY` – nur Konfigurationsstatus wird geprüft.
- `OPENAI_API_KEY` – nur Konfigurationsstatus wird geprüft.
- `RESEND_API_KEY` oder `SMTP_HOST` – E-Mail-Konfigurationsstatus.
- Optional `FANMIND_RELEASE_COMMIT` – sicherer Commit-Hinweis, falls kein CI-Commit-ENV vorhanden ist.

## Manuelle Schritte
1. Migration `supabase/migrations/20260711120000_phase_5_operations_foundation.sql` in Supabase prüfen und anwenden.
2. Production-ENV auf die oben genannten Variablen prüfen.
3. Health-Endpunkt und `/admin/operations` als Platform-Admin testen.
4. Backup-Runner erst in einem späteren PR anbinden.
