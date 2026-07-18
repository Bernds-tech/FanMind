# FanMind aktueller Datenbank- und RLS-Stand

Stand: Juli 2026

Dieses Dokument ersetzt die alte Lesart von `docs/database/fanmind_mvp_schema.sql` als vollständiges Schema. Die Datei `fanmind_mvp_schema.sql` bleibt nur als historischer Auth-/Workspace-Basisstand erhalten.

Die aktuelle Datenbankwahrheit ergibt sich aus:

1. den Supabase-Migrationen unter `supabase/migrations/`,
2. den tatsächlich verwendeten Queries und Typen in `src/lib/supabase/server.ts`,
3. dieser Dokumentation.

## 1. Grundprinzip

Alle produktiven Daten sind workspace-scoped oder user-scoped.

- Jede Kundendaten-Tabelle braucht `workspace_id`, wenn sie nicht ausschließlich user-scoped ist.
- Jede API-Route und Server Action muss User -> Workspace -> Ressource prüfen.
- Supabase Service Role ist nur serverseitig erlaubt.
- Browser-Code nutzt nur Supabase URL und Anon Key.
- RLS muss für workspace- und userbezogene Tabellen aktiv sein.

## 2. Auth-/Workspace-Kern

### `profiles`

Zweck: Nutzerprofil zu Supabase Auth User.

Wichtige Felder:

- `id`
- `email`
- `display_name`
- `phone`
- `role_audience`
- `created_at`

RLS-Erwartung:

- Nutzer darf eigenes Profil lesen, anlegen und aktualisieren.
- Andere Profile dürfen nicht sichtbar sein, außer explizit admin-/workspace-scoped später freigegeben.

### `workspaces`

Zweck: Mandanten-/Workspace-Ebene.

Wichtige Felder laut aktuellem Code:

- `id`
- `name`
- `owner_user_id`
- `plan_id`
- `commercial_option`
- `setup_fee_cents`
- `monthly_fee_cents`
- `commitment_months`
- `billing_status`
- `billing_suspended_at`
- `billing_suspended_reason`
- `billing_manual_override`
- `billing_last_payment_failed_at`
- `billing_last_payment_at`
- `billing_retry_count`
- `billing_next_retry_at`
- `billing_grace_until`
- `billing_admin_note`
- `test_access_flags` (JSONB, serverseitige Flags für interne Testzugänge; Default `{}`)
- `billing_updated_at`
- `billing_updated_by_user_id`
- `stripe_customer_id`
- `stripe_subscription_id`
- `stripe_checkout_session_id`
- `last_invoice_id`
- `last_invoice_status`
- `last_invoice_amount_due_cents`
- `last_invoice_amount_paid_cents`
- `last_invoice_hosted_url`
- `last_invoice_pdf_url`
- `organization_name`
- `street_address`
- `postal_code`
- `city`
- `country`
- `vat_id`
- `tax_number`
- `company_register_number`
- `company_register_court`

RLS-Erwartung:

- Owner darf eigenen Workspace lesen.
- Workspace-Mitglieder dürfen ihren Workspace lesen.
- Owner darf Workspace mutieren, soweit im MVP nötig.
- Billing-/Admin-Felder dürfen nicht durch normale Nutzer frei manipulierbar sein.

### `workspace_members`

Zweck: Nutzer-Workspace-Zuordnung.

Wichtige Felder:

- `id`
- `workspace_id`
- `user_id`
- `role`
- `created_at`

RLS-Erwartung:

- Nutzer sieht eigene Memberships.
- Owner darf Membership für eigenen Workspace vorbereiten, soweit MVP benötigt.

## 3. CRM-Kern

### `contacts`

Zweck: Fan-/Kontaktstammdaten pro Workspace und Kanal.

Wichtige Felder:

- `id`
- `workspace_id`
- `display_name`
- `handle`
- `source_platform`
- `language`
- `status`
- `tags`
- `summary`
- `internal_notes`
- `created_at`
- `updated_at`

RLS-Erwartung:

- Nur Kontakte im eigenen Workspace lesen/schreiben.
- Kein Kontaktzugriff nur über `contact_id` ohne Workspace-Prüfung.

### `memories`

Zweck: gespeichertes Fan-Gedächtnis / relevante Kontextnotizen.

Wichtige Felder:

- `id`
- `workspace_id`
- `contact_id`
- `type`
- `content`
- `importance`
- `created_at`

RLS-Erwartung:

- Nur Memories des eigenen Workspaces lesen/schreiben.
- `contact_id` muss zu demselben Workspace gehören.

### `followups`

Zweck: manuelle Nachfass-Aufgaben.

Wichtige Felder:

- `id`
- `workspace_id`
- `contact_id`
- `due_date`
- `priority`
- `reason`
- `status`
- `created_at`

RLS-Erwartung:

- Nur Follow-ups des eigenen Workspaces lesen/schreiben.
- Offene Follow-ups im Dashboard und in Kontaktliste dürfen nur workspace-scoped erscheinen.

## 4. Conversations / Messages

### `conversations`

Zweck: Arbeitskonversationen pro Kontakt.

Wichtige Felder:

- `id`
- `workspace_id`
- `contact_id`
- `status`
- `priority`
- `source_platform`
- `source_type`
- `source_url`
- `reply_target_url`
- `external_thread_id`
- `external_message_id`
- `external_post_id`
- `external_video_id`
- `external_comment_id`
- `original_author_label`
- `original_text_excerpt`
- `last_inbound_at`
- `last_outbound_at`
- `last_message_preview`
- `assigned_owner`
- `ai_status`
- `next_step`
- `created_at`
- `updated_at`

RLS-Erwartung:

- Nur Conversations des eigenen Workspaces lesen/schreiben.
- Archivierte Conversations dürfen nicht versehentlich als offene Arbeit erscheinen.

### `conversation_messages`

Zweck: gespeicherter Nachrichten-/Timeline-Kontext.

Wichtige Felder:

- `id`
- `workspace_id`
- `conversation_id`
- `contact_id`
- `direction`
- `message_type`
- `source_platform`
- `source_type`
- `source_url`
- `reply_target_url`
- `external_thread_id`
- `external_message_id`
- `external_post_id`
- `external_video_id`
- `external_comment_id`
- `original_author_label`
- `original_text_excerpt`
- `author_label`
- `content`
- `attachments`
- `message_kind`
- `created_at`
- `seen_at`

RLS-Erwartung:

- Nur Messages des eigenen Workspaces lesen/schreiben.
- Anhänge/URLs dürfen keine ungeprüften Secrets enthalten.
- Externe IDs sind Kontextdaten, keine Login-Daten.

### `conversation_summaries`

Zweck: zusammengefasster Conversation-Kontext für KI und UI.

Wichtige Felder:

- `id`
- `workspace_id`
- `conversation_id`
- `contact_id`
- `summary`
- `key_points`
- `open_questions`
- `last_summarized_message_at`
- `message_count_seen`
- `updated_at`
- `created_at`

RLS-Erwartung:

- Nur Summaries des eigenen Workspaces lesen/schreiben.

## 5. KI-/Profil-Tabellen

### `contact_ai_profiles`

Zweck: vorsichtig abgeleitete Kommunikations-/Profilhinweise pro Kontakt.

Wichtige Felder:

- `id`
- `workspace_id`
- `contact_id`
- `language`
- `tone`
- `sentiment`
- `interests`
- `buying_signals`
- `no_gos`
- `preferred_style`
- `response_triggers`
- `risk_notes`
- `confidence_score`
- `source_message_count`
- `updated_at`
- `created_at`

RLS-Erwartung:

- Nur eigener Workspace.
- Keine sensiblen, diagnostischen oder geschützten Eigenschaften als harte Tatsachen speichern.

### `workspace_voice_profiles`

Zweck: Schreibstil-/Voice-Kontext pro Workspace/User.

Wichtige Felder:

- `id`
- `workspace_id`
- `user_id`
- `owner_label`
- `language`
- `tone`
- `sentence_length`
- `emoji_style`
- `greeting_style`
- `closing_style`
- `common_phrases`
- `avoided_phrases`
- `sales_style`
- `examples_count`
- `confidence_score`
- `updated_at`
- `created_at`

RLS-Erwartung:

- Nur eigener Workspace, ggf. User-spezifisch eingeschränkt.

### `fan_analysis_reports`

Zweck: gespeicherte Fan-Analyse-Reports.

Wichtige Felder:

- `id`
- `workspace_id`
- `contact_id`
- `report_json`
- `summary`
- `model`
- `source_message_count`
- `generated_at`
- `created_at`
- `updated_at`

RLS-Erwartung:

- Nur eigener Workspace.
- Reports müssen vorsichtig formuliert bleiben und dürfen keine geschützten/sensiblen Eigenschaften als Tatsachen speichern.

## 6. Reply Targets / Originalkanal-Kontext

### `contact_reply_targets`

Zweck: gespeicherte Direktlinks oder Originalkanal-Ziele, vor allem Facebook/Messenger-Hilfen.

Wichtige Felder:

- `id`
- `workspace_id`
- `contact_id`
- `source_platform`
- `source_type`
- `label`
- `url`
- `quality`
- `created_at`
- `updated_at`

RLS-Erwartung:

- Nur eigener Workspace.
- URLs dürfen nicht ungeprüft als Login-/Token-URLs gespeichert werden.
- Demo-Modus blockiert externe Direktlinks.

## 7. Social / Meta / Webhooks

### `social_connections`

Zweck: vorbereitete Social-/Meta-Verbindungen pro Workspace.

Wichtige Felder:

- `id`
- `workspace_id`
- `platform`
- `provider`
- `status`
- `external_account_id`
- `external_account_name`
- `page_id`
- `page_name`
- `page_access_token_encrypted`
- `token_last_four`
- `scopes`
- `webhook_subscribed`
- `connected_by`
- `connected_at`
- `disconnected_at`
- `last_event_at`
- `last_comment_fetch_at`
- `last_comment_fetch_count`
- `last_comment_fetch_error`
- `last_messenger_sync_at`
- `last_messenger_sync_checked_count`
- `last_messenger_sync_imported_inbound_count`
- `last_messenger_sync_imported_outbound_count`
- `last_messenger_sync_imported_media_count`
- `last_messenger_sync_skipped_count`
- `last_messenger_sync_error`
- `last_messenger_sync_outbound_at`
- `created_at`
- `updated_at`

RLS-Erwartung:

- Nur eigener Workspace oder Admin.
- Token-Werte verschlüsseln.
- Keine externen Login-Passwörter speichern.
- Nicht als allgemein live verkaufen, solange nicht validiert.

### `meta_webhook_events`

Zweck: Debug-/Audit-/Ingestion-Ereignisse für Meta-Webhooks.

Wichtige Felder:

- `id`
- `workspace_id`
- `social_connection_id`
- `platform`
- `source`
- `event_type`
- `page_id`
- `sender_id`
- `recipient_id`
- `text`
- `message_text`
- `raw_payload`
- `status`
- `error_reason`
- `message_id`
- `received_at`
- `created_at`

RLS-Erwartung:

- Webhook-Inserts serverseitig.
- Lesen nur eigener Workspace/Admin.
- `raw_payload` kann sensible Kontextdaten enthalten und darf nicht öffentlich sichtbar sein.

## 8. Billing-Grundlagen

Billing-Felder liegen aktuell primär auf `workspaces`.

Aktiv verwendete Logik:

- `Pilot / Setup = 990 € einmalig`
- `Starter Flex = 990 € Setup + 312 €/Monat`
- `Starter 12 Monate = 0 € Setup + 312 €/Monat`
- Stripe Checkout / SEPA Setup, sofern ENV vollständig gesetzt ist
- Demo-User dürfen Checkout nicht starten
- Growth/Agency nicht produktiv buchbar

RLS-/Security-Erwartung:

- Normale User dürfen Billing-Felder nicht beliebig ändern.
- Admin-Änderungen nur über admin-only Routen.
- Kostenfreie interne Testzugänge nutzen eine admin-only Markierung auf `workspaces` (`billing_status = demo_free`, `billing_manual_override = true`, `billing_admin_note` enthält „Interner Testzugang“) und serverseitige `test_access_flags` (`admin`, `demo`, `internal`, `test`, `billing_disabled`, `mail_confirmed`, `no_expiry`, `ai_maintenance`). Normale Kunden behalten den Default `{}` und werden davon nicht beeinflusst.
- Das interne Stripe-Live-Testabo nutzt dieselben Billing-Felder mit `commercial_option = internal_daily_test`, `test_access_flags.stripe_live_daily_test = true`, `STRIPE_PRICE_INTERNAL_DAILY_TEST` und Stripe-Webhook-Updates für Checkout-Session, Subscription, letzte Zahlung und Rechnungsstatus. Es ist admin-only, kostet 1 € pro Tag, ist kündbar/deaktivierbar und löst keine Referral- oder Rabatt-Automation aus.
- Stripe-Webhooks müssen Signatur prüfen.
- Stripe-IDs nicht unnötig im Client anzeigen.

## 9. KI-Usage-Tabelle

`ai_usage_events` ist das aktive serverseitige Kosten-/Usage-Observability-Log für KI-Aufrufe. Es speichert keine Prompt- oder Antwortvolltexte, sondern nur Zähler, Modell, Feature, Status und geschätzte Kosten.

Spalten:

- `id`
- `workspace_id`
- `user_id`
- `contact_id`
- `feature` (`reply_suggestions`, `fan_analysis`, `summary`, ...)
- `model`
- `provider`
- `input_chars`
- `output_chars`
- `estimated_input_tokens`
- `estimated_output_tokens`
- `estimated_total_tokens`
- `estimated_cost_cents`
- `currency`
- `status` (`ok`, `error`, `skipped`)
- `error_code`
- `latency_ms`
- `source_route`
- `created_at`

RLS-Erwartung:

- Workspace-Mitglieder sehen nur Usage ihres eigenen Workspace.
- Inserts laufen serverseitig; der Helper nutzt Service Role, damit Logging nicht am User-Token hängt.
- Admin-Aggregation läuft ausschließlich nach `requirePlatformAdmin()` über serverseitige Service-Role-Abfragen.
- Normale User sehen keine anderen Workspaces.

## 10. Migrations- und Reader-Regel

Wenn Tabellen, Spalten oder RLS-Policies geändert werden:

1. Migration unter `supabase/migrations/` ergänzen.
2. `src/lib/supabase/server.ts` Typen/Columns anpassen.
3. `docs/database/fanmind_current_schema.md` aktualisieren.
4. `docs/SECURITY_RLS_SECRETS_CHECK.md` prüfen.
5. README und `docs/SOURCE_OF_TRUTH.md` nur anpassen, wenn sich Produktwahrheit oder Demo-/Billing-/Integrationslogik ändert.

## 11. Bekannte Altlast

`docs/database/fanmind_mvp_schema.sql` enthält historische Aussagen wie „Kontakte, Messages, Memories, Follow-ups und KI-Ausgaben bleiben spätere Tabellen“. Das ist nicht mehr der aktuelle Stand. Diese Datei bleibt nur als Auth-Basis-Snapshot erhalten und verweist künftig auf dieses Dokument.

## 12. Referral Growth Window (admin-only foundation)

Issue #442 ist bewusst als Admin-Grundlage umgesetzt, nicht als öffentliche Rabattfunktion.

Neue Tabellen aus `supabase/migrations/20260706143000_referral_program_admin_foundation.sql`:

- `referral_program_state`: globaler Programmstatus mit `status in ('open','closing','closed','reopened')`, `active_paid_workspace_cap` und `active_paid_workspace_count` als globale Cap-Größe. Standard-Cap ist `2.000` aktive zahlende Workspaces/Kunden.
- `referral_program_members`: berechtigte/referrende Workspaces mit Referral-Code, Teilnahme-/Prüfstatus, Admin-Notiz und manuellen Override-Feldern für aktive Referrals oder Rabattprozent.
- `referrals`: einzelne Zuordnungen zwischen Referrer-Workspace und geworbenem Workspace mit Status `pending`, `qualified`, `active`, `inactive`, `rejected` oder `locked_after_window_closed`.
- `referral_discount_snapshots`: vorbereitete Rabatt-Snapshots mit aktiver Referral-Zahl, Prozentwert und monatlichen Beträgen vor/nach Rabatt. Diese Snapshots sind noch keine aktive Billing-Verrechnung.

RLS/Scope:

- RLS ist für alle vier Referral-Tabellen aktiviert.
- Es gibt im ersten Schritt bewusst keine öffentlichen `authenticated` Policies. Die Adminübersicht nutzt serverseitige Service-Role-Abfragen nach `requirePlatformAdmin()`.
- Normale Nutzer dürfen Referral-Ökonomie, fremde Codes und Rabatt-Snapshots nicht sehen oder verändern.
- Signup-/Checkout-Attribution, Nutzerdashboard, automatische Snapshot-Erzeugung und Billing-Verrechnung sind separate Schritte.
- AGB/Zahlungsbedingungen, Missbrauchsschutz und steuerliche Prüfung müssen vor öffentlicher Aktivierung ergänzt werden.


### Phase 2 Ergänzungen (20260707120000)

Die Migration `20260707120000_referral_growth_window_phase_2.sql` ergänzt eindeutige Workspace-/Referred-Workspace-Indizes für Referral-Mitglieder und Attributionen sowie Update-Trigger/Kommentare. Die App nutzt serverseitige Service-Role-Zugriffe, um berechtigten Workspaces den eigenen Referral-Code/Link anzuzeigen und Signup-Attributionen zu speichern. Normale Nutzer erhalten weiterhin keinen Zugriff auf fremde Referral-Ökonomie; Rabattwerte sind vorbereitete Statuswerte und werden nicht automatisch mit Billing verrechnet.


## 13. Datenschutzsparsame Serverfehler-Telemetrie

Migration: `supabase/migrations/20260718203000_privacy_server_error_tracking.sql`

### `server_error_events`

Zweck: minimale technische Einzelereignisse für unerwartete serverseitige Next.js-Fehler.

Gespeicherte Felder:

- `id`
- `created_at`
- `fingerprint` als SHA-256
- optionaler, formatgeprüfter Next.js-`digest`
- `route_path` ausschließlich als Route-Schablone oder `/unknown`
- `route_type`
- `router_kind`
- `http_method`
- `environment`
- `release_commit`

Ausdrücklich nicht vorhanden:

- Fehlermeldung oder Stack
- Request-/Response-Body
- Header, Cookies, Query-Parameter oder IP-Adresse
- Kontakt-, Nachrichten-, Prompt-, KI- oder Zahlungsinhalte

RLS/Scope:

- RLS ist aktiviert.
- `PUBLIC`, `anon` und `authenticated` haben keine Tabellenrechte.
- Inserts erfolgen ausschließlich über die service-role-only RPC `record_server_error_event(...)`.
- Einzelereignisse werden über `cleanup_server_error_events(...)` zeitlich begrenzt bereinigt; die RPC ist ebenfalls service-role-only.

### `server_error_groups`

Zweck: Aggregation identischer technischer Fehlergruppen und Alarm-Cooldown.

Gespeicherte Felder:

- `fingerprint`
- `first_seen_at`
- `last_seen_at`
- `occurrence_count`
- optionaler `digest`
- Route-Schablone, Route-Typ, Router-Art und HTTP-Methode
- Umgebung und letzter Release-Commit
- Status, Auflösungszeitpunkt und letzte Alarmstufe

RLS/Scope:

- RLS ist aktiviert.
- Keine Browserrolle erhält Tabellen- oder RPC-Zugriff.
- Platform-Admins lesen aggregierte Gruppen ausschließlich serverseitig nach `requirePlatformAdmin()` über Service Role.
- Admin-Meldungen enthalten nur generische Texte und eine verkürzte Fingerprint-Referenz; keine Route, Fehlermeldung oder Stackdaten.

### RPCs

- `record_server_error_event(...)`: validiert alle Metadaten, schreibt Ereignis und Gruppe atomar, berechnet das 10-Minuten-Fenster und erzeugt höchstens eine aktive Admin-Meldung je Fingerprint. Ausführung ausschließlich `service_role`.
- `cleanup_server_error_events(integer)`: löscht minimale Einzelereignisse nach 7 bis 365 Tagen. Ausführung ausschließlich `service_role`.

Aktivierung:

- Code bleibt ohne `FANMIND_SERVER_ERROR_TRACKING_ENABLED=true` inaktiv.
- Kritische E-Mails bleiben zusätzlich über `FANMIND_SERVER_ERROR_EMAIL_ENABLED=false` gesperrt, bis ein kontrollierter Test abgeschlossen ist.
