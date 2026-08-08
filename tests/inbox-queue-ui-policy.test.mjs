import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagePath = new URL("../src/app/inbox/page.tsx", import.meta.url);

test("inbox uses one unified queue instead of replacing follow-ups", async () => {
  const page = await readFile(pagePath, "utf8");

  assert.match(page, /buildUnifiedInboxQueue\([\s\S]*?conversations:[\s\S]*?followups:/u);
  assert.doesNotMatch(page, /activeConversations\.length\s*\?/u);
  assert.match(page, /if \(!contactFollowups\.length\) continue;/u);
});

test("queue has no inactive selection controls and one waiting label", async () => {
  const page = await readFile(pagePath, "utf8");

  assert.doesNotMatch(page, /type="checkbox"/u);
  assert.doesNotMatch(page, />Auswahl</u);
  assert.equal(page.match(/<span>Wartet seit<\/span>/gu)?.length, 1);
});
