import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath = new URL(
  "../supabase/migrations/20260808234500_website_chat_message_ingestion.sql",
  import.meta.url,
);
const routePath = new URL("../src/app/api/website-chat/message/route.ts", import.meta.url);
const servicePath = new URL("../src/lib/websiteChat.ts", import.meta.url);

test("website chat ingestion is transactional, idempotent and service-role-only", async () => {
  const sql = await readFile(migrationPath, "utf8");
  assert.match(sql, /primary key \(session_id, client_message_id\)/u);
  assert.match(sql, /alter table public\.website_chat_message_receipts enable row level security/u);
  assert.match(sql, /revoke all on table public\.website_chat_message_receipts[\s\S]*?from public, anon, authenticated/u);
  assert.match(sql, /security invoker/u);
  assert.match(sql, /revoke all on function public\.ingest_website_chat_message[\s\S]*?from public, anon, authenticated/u);
  assert.match(sql, /grant execute on function public\.ingest_website_chat_message[\s\S]*?to service_role/u);
  assert.match(sql, /s\.revoked_at is null/u);
  assert.match(sql, /s\.expires_at > v_now/u);
  assert.match(sql, /o\.verified_at is not null/u);
  assert.match(sql, /for update of s/u);
  assert.doesNotMatch(sql, /security definer/iu);
});

test("website messages enter the CRM inbox without AI or outbound delivery", async () => {
  const [sql, route, service] = await Promise.all([
    readFile(migrationPath, "utf8"),
    readFile(routePath, "utf8"),
    readFile(servicePath, "utf8"),
  ]);
  assert.match(sql, /insert into public\.contacts/u);
  assert.match(sql, /insert into public\.conversations/u);
  assert.match(sql, /insert into public\.conversation_messages/u);
  assert.match(sql, /'inbound'/u);
  assert.match(sql, /'website-chat'/u);
  assert.match(route, /authorization,content-type,\$\{INSTALLATION_HEADER\}/u);
  assert.match(route, /website_chat_message_session/u);
  assert.match(route, /readBoundedJsonRequest/u);
  assert.match(route, /SESSION_INVALID/u);
  assert.match(service, /rpc\/ingest_website_chat_message/u);
  assert.doesNotMatch(`${sql}\n${route}\n${service}`, /OPENAI_API_KEY|copilot\/reply|automatic.?send/iu);
  assert.doesNotMatch(sql, /direction[\s\S]{0,80}'outbound'/iu);
});
