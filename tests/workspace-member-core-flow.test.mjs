import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path) {
  return readFile(path, "utf8");
}

test("regular CRM pages resolve an owner or workspace member without widening account controls", async () => {
  const [
    server,
    authorization,
    preActivation,
    pausedPage,
    dashboard,
    fans,
    detail,
    inbox,
    followups,
    csv,
    settings,
  ] = await Promise.all([
      source("src/lib/supabase/server.ts"),
      source("src/lib/workspaceAuthorization.ts"),
      source("src/lib/preActivation.ts"),
      source("src/app/workspace/access-paused/page.tsx"),
      source("src/app/dashboard/page.tsx"),
      source("src/app/fans/page.tsx"),
      source("src/app/fans/[id]/page.tsx"),
      source("src/app/inbox/page.tsx"),
      source("src/app/followups/page.tsx"),
      source("src/app/fans/import/page.tsx"),
      source("src/app/settings/actions.ts"),
    ]);

  assert.match(
    authorization,
    /export async function getUserAuthorizedWorkspaceDashboard[\s\S]*getUserWorkspaceDashboard[\s\S]*getUserWorkspaceMembershipDashboard/u,
  );
  assert.match(
    authorization,
    /export async function requireContactInAuthorizedWorkspaceMember[\s\S]*requireAuthorizedWorkspaceMember/u,
  );
  assert.match(
    server,
    /getUserWorkspaceMembershipDashboard[\s\S]*workspace_members[\s\S]*2,[\s\S]*false,[\s\S]*membershipResult\.data\.length !== 1/u,
  );
  for (const page of [dashboard, fans, followups, csv]) {
    assert.match(page, /getUserAuthorizedWorkspaceDashboard\(data\.user\)/u);
  }
  assert.match(detail, /requireAuthorizedWorkspaceMember\(\)/u);
  for (const page of [dashboard, fans, detail, inbox, followups, csv]) {
    assert.match(page, /getPreActivationRedirect\(/u);
  }
  assert.match(
    preActivation,
    /workspace\.role !== "owner"[\s\S]*evaluateWorkspaceProcessingEntitlement\(workspace\)\.allowed[\s\S]*\/workspace\/access-paused/u,
  );
  assert.match(pausedPage, /Nur der Workspace-Owner/u);
  assert.doesNotMatch(
    settings,
    /requireAuthorizedWorkspaceMember/u,
  );
});

test("member CRM mutations stay contact-scoped while channel operations remain owner-only", async () => {
  const [actions, contextActions, analysisActions, aiRoute] = await Promise.all([
    source("src/app/fans/actions.ts"),
    source("src/app/fans/[id]/contextActions.ts"),
    source("src/app/fans/[id]/analysisActions.ts"),
    source("src/app/api/ai/reply-suggestions/route.ts"),
  ]);

  assert.match(
    actions,
    /async function getCurrentWorkspaceOrThrow\(\)[\s\S]*requireActiveAuthorizedWorkspaceMember\(\)/u,
  );
  assert.match(
    await source("src/lib/workspaceAuthorization.ts"),
    /requireActiveAuthorizedWorkspaceMember[\s\S]*evaluateWorkspaceProcessingEntitlement\([\s\S]*context\.workspace[\s\S]*if \(!processing\.allowed\)/u,
  );
  assert.match(
    actions,
    /async function ensureContactInWorkspace[\s\S]*requireContactInActiveAuthorizedWorkspaceMember\(contactId\)/u,
  );
  assert.match(
    contextActions,
    /requireContactInActiveAuthorizedWorkspaceMember\(contactId\)/u,
  );
  assert.match(analysisActions, /requireContactInAuthorizedWorkspace\(contactId\)/u);
  assert.doesNotMatch(analysisActions, /requireContactInAuthorizedWorkspaceMember/u);
  assert.match(
    aiRoute,
    /requireContactInActiveAuthorizedWorkspaceMember\([\s\S]*contactId,[\s\S]*accessToken/u,
  );

  for (const ownerOnlyAction of [
    "saveFacebookReplyTarget",
  ]) {
    const start = actions.indexOf(`export async function ${ownerOnlyAction}`);
    const end = actions.indexOf("\nexport async function ", start + 1);
    assert.notEqual(start, -1);
    assert.match(
      actions.slice(start, end === -1 ? undefined : end),
      /requireAuthorizedWorkspace\(\)/u,
    );
  }
  const manualReplyStart = actions.indexOf(
    "export async function saveManualSentReply",
  );
  const manualReplyEnd = actions.indexOf(
    "\nexport async function ",
    manualReplyStart + 1,
  );
  assert.match(
    actions.slice(manualReplyStart, manualReplyEnd),
    /requireActiveAuthorizedWorkspaceMember\(\)/u,
  );
  assert.match(
    actions,
    /syncFacebookChatForContact[\s\S]*requireContactInAuthorizedWorkspace\(contactId\)/u,
  );
  assert.match(
    actions,
    /syncInstagramChatForContact[\s\S]*requireContactInAuthorizedWorkspace\(contactId\)/u,
  );
});
