import assert from "node:assert/strict";
import test from "node:test";
import { buildWebsiteChatWidgetScript } from "../src/lib/websiteChatWidget.mjs";

test("widget is consent-first, cookie-free and uses only the public Website Chat APIs", () => {
  const source = buildWebsiteChatWidgetScript();
  assert.match(source, /consent\.checked/u);
  assert.match(source, /credentials:"omit"/u);
  assert.match(source, /\/api\/website-chat\/session/u);
  assert.match(source, /\/api\/website-chat\/message/u);
  assert.match(source, /crypto\.randomUUID\(\)/u);
  assert.match(source, /sessionToken = null/u);
  assert.match(source, /keine automatische KI-Antwort/u);
  assert.doesNotMatch(source, /document\.cookie|localStorage|sessionStorage|OPENAI|poll|outbound/iu);
});

test("widget validates bounded embed attributes and never exposes internal CRM identifiers", () => {
  const source = buildWebsiteChatWidgetScript();
  assert.match(source, /dataset\.installationId/u);
  assert.match(source, /consentVersion\.length > 80/u);
  assert.match(source, /attachShadow/u);
  assert.doesNotMatch(source, /contactId|conversationId|workspaceId/iu);
});
