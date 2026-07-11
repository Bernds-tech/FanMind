# Phase 5 Implementation Plan – Operations Foundation

## Ausgangsanalyse

### Bereits vorhanden
- Adminbereich mit serverseitiger `requirePlatformAdmin`-Prüfung auf Basis von `FANMIND_ADMIN_EMAILS`.
- Admin-Navigation für Billing, KI-Verbrauch, Referrals, Roadmap, Anfragen und Assets.
- Supabase-Service-Role-Zugriffe ausschließlich in Server-Libraries.
- Deployment-Workflow für Exoscale/PM2/nginx in `.github/workflows/deploy-fanmind.yml`.
- KI-Usage-Audit-Grundlage ohne Prompt-/Antwortvolltexte.
- Storage-Adminbereich für Assets über Supabase Storage.

### Teilweise vorhanden
- Auditierbarkeit: KI-Usage und Admin-Billing-Änderungen sind teilweise nachvollziehbar; ein zentrales Operations-Audit fehlte.
- Monitoring: Konfigurations- und Laufzeitprüfungen waren implizit vorhanden, aber nicht als sicherer Health-Endpunkt gebündelt.
- Backup-Betrieb: Dokumentierte manuelle Schritte existieren, aber kein einheitliches Datenmodell für Backup-Läufe.
- Admin-Header: Adminseiten nutzen die Shell, aber bisher ohne Operations-Meldungen.

### Fehlte vor diesem PR
- `/api/health` mit öffentlicher/admininterner Trennung.
- Zentrale Tabellen für `admin_notifications`, `system_health_events`, `admin_operation_jobs`, `backup_runs`, `operations_audit_log`.
- `/admin/operations` als sicherer Überblick.
- Benachrichtigungs-Badge mit gelesen/quittiert-Grundlage.

### Risiken
- Migrationen sind nur im Repository vorbereitet und müssen manuell in Supabase angewendet werden.
- Ohne `SUPABASE_SERVICE_ROLE_KEY` können Admin-Operations-Daten nicht gelesen werden.
- Der Healthcheck darf keine geheimen Werte ausgeben; neue Checks müssen diese Grenze beibehalten.
- Backup- und Restore-Automation darf nicht in der Web-App mit frei ausführbaren Befehlen umgesetzt werden.

## Empfohlene weitere PRs für Phase 5
1. Backup-Automation außerhalb der Web-App: Exoscale/Supabase-Backup-Skripte, sichere Retention, Restore-Runbook.
2. Persistente Health-Events: geplanter Cron/Runner, Schwellenwerte, Deduplizierung und Notification-Erzeugung.
3. Externe Benachrichtigung: E-Mail/Slack/Pager nur für kritische Events, ohne personenbezogene Inhalte.
4. Test-/Produktions-Governance: klare ENV-Matrix, Demo-/Testdaten-Trennung und Release-Checkliste.
5. Operations-Audit-Ausbau: strukturierte Audit-Einträge für alle adminseitigen Betriebsaktionen.

## Keine Phase-3-Arbeiten
Dieser PR startet Phase 5 und verändert keine Meta-/Facebook-/Instagram-/WhatsApp-Integration.
