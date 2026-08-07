import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { validateFacebookGraphPagingUrl } from "../src/lib/facebookGraphPagingPolicy.mjs";

const migrationPath =
  "supabase/controlled/20260806160000_meta_webhook_external_id_idempotency.sql";

test("unknown Meta pages fail closed without borrowing a tenant", async () => {
  const [webhook, server] = await Promise.all([
    readFile("src/lib/metaWebhook.ts", "utf8"),
    readFile("src/lib/supabase/server.ts", "utf8"),
  ]);

  assert.doesNotMatch(webhook, /findMetaWebhookFallbackWorkspaceId/u);
  assert.doesNotMatch(server, /findMetaWebhookFallbackWorkspaceId/u);
  assert.match(
    webhook,
    /if \(!connection\.connection\)[\s\S]*createMetaWebhookDebugEvent\(\{[\s\S]*workspaceId: null,[\s\S]*ignored_unmapped_page/u,
  );
  assert.match(
    server,
    /createMetaWebhookDebugEvent[\s\S]*workspace_id: input\.workspaceId \?\? null/u,
  );
});

test("parallel identical Meta inserts converge on the database-owned row", async () => {
  const [server, migration] = await Promise.all([
    readFile("src/lib/supabase/server.ts", "utf8"),
    readFile(migrationPath, "utf8"),
  ]);

  assert.match(
    migration,
    /create unique index if not exists[\s\S]*conversation_messages_meta_external_message_unique_idx[\s\S]*workspace_id,[\s\S]*source_platform,[\s\S]*external_message_id/u,
  );
  assert.match(
    migration,
    /create unique index if not exists[\s\S]*conversation_messages_meta_external_comment_unique_idx[\s\S]*workspace_id,[\s\S]*source_platform,[\s\S]*external_comment_id/u,
  );
  assert.match(
    server,
    /if \(messageResult\.error\) \{[\s\S]*findExistingMetaConversationMessage\(\{[\s\S]*concurrentDuplicate\.message[\s\S]*error: null/u,
  );
});

test("external Meta identifiers never deduplicate across tenants", async () => {
  const [server, migration] = await Promise.all([
    readFile("src/lib/supabase/server.ts", "utf8"),
    readFile(migrationPath, "utf8"),
  ]);

  assert.match(
    server,
    /findExistingMetaConversationMessage[\s\S]*\["workspace_id", input\.workspaceId\][\s\S]*\["source_platform", input\.sourcePlatform\][\s\S]*\[column, externalId\]/u,
  );
  assert.equal(
    (migration.match(/workspace_id,\s*source_platform,\s*external_(?:message|comment)_id/gu) ?? [])
      .length,
    4,
  );
  assert.doesNotMatch(
    migration,
    /unique\s*\([^)]*external_(?:message|comment)_id\s*\)/iu,
  );
});

test("Facebook pagination accepts only HTTPS Graph v25.0 URLs", () => {
  const accepted =
    "https://graph.facebook.com/v25.0/page/messages?after=cursor";
  assert.equal(validateFacebookGraphPagingUrl(accepted), accepted);

  for (const manipulated of [
    "http://graph.facebook.com/v25.0/page/messages?after=cursor",
    "https://graph.facebook.com.evil.example/v25.0/page/messages",
    "https://graph.facebook.com/v24.0/page/messages",
    "https://graph.facebook.com/v25.0.evil/page/messages",
    "https://user@graph.facebook.com/v25.0/page/messages",
    "https://graph.facebook.com:444/v25.0/page/messages",
    "https://evil.example/v25.0/page/messages",
    "not-a-url",
  ]) {
    assert.equal(validateFacebookGraphPagingUrl(manipulated), null, manipulated);
  }
});

test("both Facebook paging loops apply the strict validator", async () => {
  const integration = await readFile("src/lib/facebookIntegration.ts", "utf8");
  assert.equal(
    (
      integration.match(
        /validateFacebookGraphPagingUrl\(payload\?\.paging\?\.next \?\? null\)/gu,
      ) ?? []
    ).length,
    2,
  );
  assert.doesNotMatch(
    integration,
    /nextUrl\s*=\s*payload\?\.paging\?\.next\s*\?\?/u,
  );
});
