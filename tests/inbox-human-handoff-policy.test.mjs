import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const actionsPath = new URL("../src/app/inbox/actions.ts", import.meta.url);
const pagePath = new URL("../src/app/inbox/page.tsx", import.meta.url);
const serverPath = new URL("../src/lib/supabase/server.ts", import.meta.url);
const migrationPath = new URL(
  "../supabase/migrations/20260808140000_add_conversation_assignment_identity.sql",
  import.meta.url,
);

test("inbox handoff stays authenticated and workspace-bound", async () => {
  const actions = await readFile(actionsPath, "utf8");

  assert.match(actions, /requireAuthorizedWorkspaceMember\(\)/u);
  assert.match(actions, /getWorkspaceConversations\(workspace\.id\)/u);
  assert.match(actions, /workspaceId: workspace\.id/u);
  assert.match(actions, /assignedUserId: user\.id/u);
  assert.doesNotMatch(actions, /service.role|SUPABASE_SERVICE_ROLE_KEY/iu);
});

test("assignment mutations are identity-bound and cannot send a message", async () => {
  const server = await readFile(serverPath, "utf8");
  const assignment = server.slice(
    server.indexOf("export async function claimConversationAssignment"),
    server.indexOf("export async function saveReplyDraftAsNote"),
  );

  assert.match(assignment, /assigned_owner/u);
  assert.match(assignment, /assigned_user_id/u);
  assert.match(assignment, /workspace_id/u);
  assert.match(assignment, /\["assigned_user_id", null\]/u);
  assert.match(assignment, /\["assigned_owner", null\]/u);
  assert.match(assignment, /\["assigned_user_id", assignedUserId\]/u);
  assert.doesNotMatch(assignment, /conversation_messages|send|webhook/iu);
});

test("inbox exposes explicit claim and release controls", async () => {
  const page = await readFile(pagePath, "utf8");

  assert.match(page, /claimConversation/u);
  assert.match(page, /releaseConversation/u);
  assert.match(page, />\s*Übernehmen/u);
  assert.match(page, />Freigeben</u);
  assert.match(page, /item\.assignedUserId === userId/u);
  assert.match(page, /getNoticeMessage\(notice\)/u);
});

test("assignment schema stores a stable authenticated identity", async () => {
  const migration = await readFile(migrationPath, "utf8");

  assert.match(migration, /assigned_user_id uuid references auth\.users\(id\)/u);
  assert.match(migration, /on delete set null/u);
  assert.match(migration, /workspace_id, assigned_user_id/u);
});
