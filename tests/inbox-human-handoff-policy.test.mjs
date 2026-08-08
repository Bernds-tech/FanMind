import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const actionsPath = new URL("../src/app/inbox/actions.ts", import.meta.url);
const pagePath = new URL("../src/app/inbox/page.tsx", import.meta.url);
const serverPath = new URL("../src/lib/supabase/server.ts", import.meta.url);
const navigationPath = new URL("../src/lib/workspaceNavigation.ts", import.meta.url);
const searchFormPath = new URL("../src/app/inbox/InboxSearchForm.tsx", import.meta.url);
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
  assert.match(assignment, /\["assigned_user_id", assignedUserId\]/u);
  assert.doesNotMatch(assignment, /status: "open"|next_step:/u);
  assert.doesNotMatch(assignment, /conversation_messages|send|webhook/iu);
});

test("assignment rollout is backward-compatible and avoids email labels", async () => {
  const [actions, page, server] = await Promise.all([
    readFile(actionsPath, "utf8"),
    readFile(pagePath, "utf8"),
    readFile(serverPath, "utf8"),
  ]);

  assert.match(server, /CONVERSATION_ASSIGNMENT_COLUMNS/u);
  assert.match(server, /isMissingAssignedUserIdentity/u);
  assert.match(server, /assigned_user_id[\s\S]*CONVERSATION_COLUMNS/u);
  assert.match(server, /assignmentSupported = false[\s\S]*assignment_supported: assignmentSupported/u);
  assert.match(page, /item\.assignmentSupported && !item\.assignedUserId/u);
  assert.match(page, /item\.assignmentSupported && item\.assignedUserId === userId/u);
  assert.doesNotMatch(actions, /user\.email/u);
  assert.match(actions, /return "Workspace-Team"/u);
  assert.doesNotMatch(page, /getSupabaseServerUser/u);
  assert.match(page, /WorkspaceAuthorizationError/u);
  assert.match(page, /redirect\("\/onboarding"\)/u);
});

test("inbox exposes explicit claim and release controls", async () => {
  const page = await readFile(pagePath, "utf8");

  assert.match(page, /claimConversation/u);
  assert.match(page, /releaseConversation/u);
  assert.match(page, /inboxText\(locale, "Übernehmen"\)/u);
  assert.match(page, /inboxText\(locale, "Freigeben"\)/u);
  assert.match(page, /item\.assignedUserId === userId/u);
  assert.match(page, /getNoticeMessage\(notice, locale\)/u);
});

test("English inbox navigation preserves locale and renders localized workspace copy", async () => {
  const [page, navigation, searchForm, actions] = await Promise.all([
    readFile(pagePath, "utf8"),
    readFile(navigationPath, "utf8"),
    readFile(searchFormPath, "utf8"),
    readFile(actionsPath, "utf8"),
  ]);

  assert.match(navigation, /locale === "en" \? "\/inbox\?lang=en" : "\/inbox"/u);
  assert.match(page, /resolveWorkspaceLocale\(\{[\s\S]*lang: params\?\.lang,[\s\S]*user,/u);
  assert.match(page, /getWorkspaceNavigationForUser\("inbox", userEmail, locale\)/u);
  assert.match(page, /locale=\{locale\}/u);
  assert.match(page, /Prioritized work queue for incoming messages/u);
  assert.match(page, /Never send replies automatically/u);
  assert.match(searchForm, /if \(locale === "en"\) params\.set\("lang", "en"\)/u);
  assert.match(searchForm, /locale === "en" \? "Search" : "Suche"/u);
  assert.equal(page.match(/<input name="lang" type="hidden" value=\{locale\} \/>/gu)?.length, 2);
  assert.match(actions, /formValue\(formData, "lang"\) === "en"/u);
  assert.match(actions, /inboxNoticePath\("conversation_claimed", locale\)/u);
  assert.match(actions, /params\.set\("lang", "en"\)/u);
});

test("assignment schema stores a stable authenticated identity", async () => {
  const migration = await readFile(migrationPath, "utf8");

  assert.match(migration, /assigned_user_id uuid references auth\.users\(id\)/u);
  assert.match(migration, /on delete set null/u);
  assert.match(migration, /workspace_id, assigned_user_id/u);
});
