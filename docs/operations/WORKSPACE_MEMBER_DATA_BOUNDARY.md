# Workspace-Member-Datengrenze

Status: `CHECKED_NOT_APPLIED`.

Dieser Stand ist eine vorbereitete, checksum-gebundene Datenbankhärtung. Der
Web-Deploy und ein generischer Supabase-Migrationslauf wenden sie nicht an. In
diesem Repository ist kein Apply-Befehl freigeschaltet.

## Ziel

Der Control
`supabase/controlled/20260816120000_workspace_member_data_boundary.sql`
schließt vier getrennte Grenzen:

1. Authentifizierte Teammitglieder lesen nicht mehr die volle
   `workspaces`-Zeile mit Billing-, Stripe-, Invoice-, Steuer-, Adress- und
   serververwalteten Testfeldern. Sie erhalten ausschließlich die Projektion
   `workspace_id`, `workspace_name`, `plan_id`, `membership_role` und
   `member_processing_allowed` aus dem parameterlosen RPC
   `get_current_workspace_member_safe_dashboard()`.
   Die administrative `workspace_analysis_settings`-Zeile mit Legal-Basis,
   Transparenz-, AVV-, Retention-, Betroffenenrechts- und Bestätigerfeldern
   wird ebenfalls Owner-only.
2. Direkte JWT-Mutationen auf `contacts`, `memories`, `followups`,
   `conversations`, `conversation_messages`, `conversation_summaries`,
   `contact_reply_targets`, `ai_usage_events`, `content_sources`,
   `fan_analysis_reports`, `contact_ai_profiles` und
   `workspace_voice_profiles` benötigen zugleich Workspace-Ownership und den
   kanonischen aktiven Processing-Vertrag. Bestehende Member-Reads bleiben
   unverändert.
3. `social_connections` ist für Browser nur durch den Owner lesbar. Der
   Browser erhält exakt die dokumentierten nicht geheimen Statusspalten und
   keinerlei INSERT-, UPDATE-, DELETE- oder Secret-Spaltenrechte.
   `page_access_token_encrypted` bleibt ausschließlich serverseitig.
4. Terminale Billing-Zustände gewinnen immer gegen Override, Grace und
   temporäre Freigaben. Ein temporärer Demo-Zugang ist nur mit einer
   serververwalteten, noch gültigen DB-Expiry berechtigt. Client-editierbare
   Auth-Metadaten sind keine Entitlement-Quelle.

## App-first-Vertrag

Die Anwendung bleibt vor und nach dem SQL-Apply kompatibel:

- Nur bei der eindeutig fehlenden Safe-RPC-Funktion lädt der Webserver nach
  bereits eindeutig geprüfter Membership mit `service_role` intern exakt die
  für die Processing-Auswertung erforderlichen Workspace-Felder. An Browser,
  Renderer und DTO gelangen trotzdem nur die fünf sicheren Projektionsfelder.
  Andere RPC-Fehler bleiben fail-closed.
- Mobile verwendet beim exakt fehlenden RPC höchstens `id,name,plan_id` für
  die bereits gebundene Workspace-ID und setzt Processing fail-closed auf
  `false`. Nach dem SQL-Apply greift der Safe-RPC.
- Web und Mobile zeigen Membern CRM-Daten im Nur-Lese-Modus. Create, Edit,
  Archive, Merge, CSV, Memory-/Follow-up-Speichern, Statuswechsel, KI-Analyse,
  Reply-Erzeugung und Connector-Aktionen bleiben verborgen beziehungsweise
  lokal blockiert. Sämtliche Web-Mutations- und KI-Routen autorisieren darüber
  hinaus explizit den aktiven Owner statt des Member-Read-Kontexts.
- Low-Level-Facebook-/Instagram-Sync und Diagnose sind `server-only` Services.
  Die beiden clientimportierbaren Channel-Actions enthalten keine
  caller-gelieferten Connection-Objekte und reautorisieren Owner plus aktives
  Processing vor jedem Aufruf.
- Vollständige Member-Schreibrechte dürfen nicht durch einen erfolgreichen
  RLS-Postflight aktiviert werden. Dafür ist ein gesondert geprüfter atomarer
  DB-RPC-Vertrag erforderlich.

## Kontrollierte Prüfung

```bash
npm run db:workspace-member-data-boundary:check
node --test tests/workspace-member-data-boundary.test.mjs
```

Der Runner akzeptiert ausschließlich `--check`, verifiziert SHA-256, Projektion,
Policy- und ACL-Vertrag und meldet
`WORKSPACE_MEMBER_DATA_BOUNDARY_DATABASE_WRITE=not_performed`. `--apply` ist
absichtlich ungültig.

## Voraussetzungen für einen späteren Apply

- exakter Release-Commit ist auf dem isolierten Staging deployed;
- `20260726121000_workspace_server_owned_columns.sql` und dessen
  serververwaltete Workspace-Felder sind im Ziel nachgewiesen;
- alle im Control genannten Tabellen existieren und besitzen bereits RLS;
- App-first Safe-DTO und Member-Nur-Lese-Oberflächen sind aktiv;
- ein separater, geschützter, commit- und Zielprojekt-gebundener
  Staging-Apply-/Postflight-Workflow wurde freigegeben;
- danach beweist der reale Staging-Lauf Owner-Schreiben, Member-Lesen,
  fehlende Member-Mutationscontrols und eine abgewiesene direkte
  Member-JWT-Mutation.

Ohne diese Nachweise bleibt der Status `CHECKED_NOT_APPLIED`. Kein Apply gegen
Production, kein Restore und keine Provider-Aktivierung gehören zu diesem
Control.

## Bekannte Restgrenze

Einige bestehende `service_role`-Actions prüfen Autorisierung und mutieren in
getrennten Requests. Diese TOCTOU-Grenze wird durch Member-Nur-Lesen und die
direkten RLS-Policies nicht erweitert, ist aber kein atomarer Schreibvertrag.
Sie bleibt als gesonderter P2-Folgepunkt offen; neue Member-Schreibpfade dürfen
darauf nicht aufgebaut werden.
