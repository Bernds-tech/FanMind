import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  META_CONNECTION_CAPABILITIES,
  META_GRAPH_API_VERSION,
  PROHIBITED_SENSITIVE_INFERENCES,
  canManageMetaConnections,
  evaluateAnalysisActivation,
  evaluateExternalAccountBinding,
} from "../src/lib/metaIntegrationPolicy.mjs";

async function source(path) {
  return readFile(path, "utf8");
}

test("Meta connections use the supported stable Graph API and owner/admin control", () => {
  assert.equal(META_GRAPH_API_VERSION, "v25.0");
  assert.equal(canManageMetaConnections("owner"), true);
  assert.equal(canManageMetaConnections("admin"), true);
  assert.equal(canManageMetaConnections("member"), false);
  assert.equal(canManageMetaConnections(null), false);
});

test("Facebook and Instagram capabilities request only bounded scopes", () => {
  assert.deepEqual([...META_CONNECTION_CAPABILITIES.facebook.insights], [
    "pages_show_list",
    "pages_read_engagement",
    "read_insights",
  ]);
  assert.deepEqual([...META_CONNECTION_CAPABILITIES.instagram.messages], [
    "instagram_business_basic",
    "instagram_business_manage_messages",
  ]);
  assert.deepEqual([...META_CONNECTION_CAPABILITIES.instagram.insights], [
    "instagram_business_basic",
    "instagram_business_manage_insights",
  ]);
});

test("one external account cannot silently bind to another workspace", () => {
  assert.deepEqual(
    evaluateExternalAccountBinding({
      platform: "facebook",
      externalAccountId: "page-123",
      workspaceId: "workspace-a",
      userId: "user-a",
      role: "owner",
      existingActiveWorkspaceId: "workspace-b",
    }),
    {
      allowed: false,
      reason: "resource_already_bound",
      resourceKey: "facebook:page-123",
    },
  );
  assert.equal(
    evaluateExternalAccountBinding({
      platform: "instagram",
      externalAccountId: "ig-123",
      workspaceId: "workspace-a",
      userId: "user-a",
      role: "admin",
      existingActiveWorkspaceId: "workspace-a",
    }).allowed,
    true,
  );
});

test("analysis activation fails closed until all legal controls are confirmed", () => {
  assert.deepEqual(
    evaluateAnalysisActivation({
      role: "owner",
      legalBasisStatus: "confirmed",
      transparencyStatus: "unconfirmed",
      dataProcessingAgreementStatus: "confirmed",
      retentionStatus: "confirmed",
      dataSubjectRightsStatus: "confirmed",
    }),
    { allowed: false, blockers: ["transparency_unconfirmed"] },
  );
  assert.equal(
    evaluateAnalysisActivation({
      role: "admin",
      legalBasisStatus: "confirmed",
      transparencyStatus: "confirmed",
      dataProcessingAgreementStatus: "confirmed",
      retentionStatus: "confirmed",
      dataSubjectRightsStatus: "confirmed",
    }).allowed,
    true,
  );
});

test("sensitive fan traits remain prohibited analysis targets", () => {
  assert.ok(PROHIBITED_SENSITIVE_INFERENCES.includes("health_data"));
  assert.ok(PROHIBITED_SENSITIVE_INFERENCES.includes("political_opinions"));
  assert.ok(PROHIBITED_SENSITIVE_INFERENCES.includes("sexual_orientation"));
  assert.ok(PROHIBITED_SENSITIVE_INFERENCES.includes("psychological_diagnosis"));
});

test("OAuth flow cannot silently select among multiple Facebook pages", async () => {
  const callback = await source(
    "src/app/api/integrations/facebook/callback/route.ts",
  );
  const multiPageGuard = callback.indexOf("if (pages.length > 1)");
  const pageSelection = callback.indexOf("const page = pages[0]");
  assert.ok(multiPageGuard >= 0);
  assert.ok(pageSelection > multiPageGuard);
  assert.match(callback, /facebook_error=page_selection_required/u);
});

test("tokens are server-only and active account bindings are globally unique", async () => {
  const [server, migration] = await Promise.all([
    source("src/lib/supabase/server.ts"),
    source(
      "supabase/migrations/20260803120000_meta_content_intelligence_foundation.sql",
    ),
  ]);
  const publicColumns = server.match(
    /const SOCIAL_CONNECTION_PUBLIC_COLUMNS =\n\s*"([^"]+)";/u,
  );
  assert.ok(publicColumns);
  assert.doesNotMatch(publicColumns[1], /page_access_token_encrypted/u);
  assert.match(
    server,
    /SOCIAL_CONNECTION_SECRET_COLUMNS[\s\S]*page_access_token_encrypted/u,
  );
  assert.match(
    server,
    /upsertFacebookSocialConnection[\s\S]*getServiceAccessToken\(\)/u,
  );
  assert.match(
    migration,
    /social_connections_active_external_account_unique_idx[\s\S]*platform, external_account_id[\s\S]*status = 'connected'/u,
  );
  assert.match(
    migration,
    /drop policy if exists social_connections_insert_workspace_member/u,
  );
  assert.match(
    migration,
    /revoke all on table public\.social_connections from anon, authenticated/u,
  );
  const socialGrant = migration.match(
    /grant select \(([\s\S]*?)\) on public\.social_connections to authenticated;/u,
  );
  assert.ok(socialGrant);
  assert.doesNotMatch(socialGrant[1], /page_access_token_encrypted/u);
});

test("database analysis settings and generated reports are fail-closed", async () => {
  const migration = await source(
    "supabase/migrations/20260803120000_meta_content_intelligence_foundation.sql",
  );
  assert.match(
    migration,
    /fan_analysis_enabled boolean not null default false/u,
  );
  assert.match(
    migration,
    /content_insights_enabled boolean not null default false/u,
  );
  assert.match(
    migration,
    /legal_basis_status = 'confirmed'[\s\S]*transparency_status = 'confirmed'[\s\S]*data_processing_agreement_status = 'confirmed'[\s\S]*retention_status = 'confirmed'[\s\S]*data_subject_rights_status = 'confirmed'/u,
  );
  assert.match(
    migration,
    /communication_analysis_reports_select_workspace_member/u,
  );
  assert.match(
    migration,
    /source_scope text not null default 'confirmed_manual_outbound'/u,
  );
  assert.match(
    migration,
    /workspace_voice_profiles_confirmed_manual_source_check/u,
  );
  assert.match(
    migration,
    /insert into public\.workspace_analysis_settings \(workspace_id\)[\s\S]*select id from public\.workspaces/u,
  );
  assert.match(migration, /workspaces_create_analysis_settings/u);
  assert.match(
    migration,
    /foreign key \(content_source_id, workspace_id\)[\s\S]*references public\.content_sources \(id, workspace_id\)/u,
  );
  assert.match(
    migration,
    /foreign key \(conversation_id, workspace_id\)[\s\S]*references public\.conversations \(id, workspace_id\)/u,
  );
  assert.match(
    migration,
    /revoke all on table public\.fan_analysis_reports from anon, authenticated/u,
  );
  assert.match(
    migration,
    /revoke all on table public\.contact_ai_profiles from anon, authenticated/u,
  );
  assert.match(
    migration,
    /revoke all on table public\.workspace_voice_profiles from anon, authenticated/u,
  );
});

test("existing analysis paths enforce the workspace activation gate", async () => {
  const [server, analysisAction] = await Promise.all([
    source("src/lib/supabase/server.ts"),
    source("src/app/fans/[id]/analysisActions.ts"),
  ]);
  assert.match(
    server,
    /updateContactProfileFromInboundMessage[\s\S]*getWorkspaceAnalysisCapabilityStatus[\s\S]*"fan_analysis"/u,
  );
  assert.match(
    server,
    /updateWorkspaceVoiceProfileFromManualOutbound[\s\S]*getWorkspaceAnalysisCapabilityStatus[\s\S]*"user_voice_analysis"/u,
  );
  assert.match(
    analysisAction,
    /getWorkspaceAnalysisCapabilityStatus\([\s\S]*"fan_analysis"[\s\S]*if \(!analysisCapability\.enabled\)/u,
  );
  assert.match(
    server,
    /upsertFanAnalysisReport[\s\S]*getServiceAccessToken\(\)/u,
  );
  assert.match(
    server,
    /upsertContactAiProfile[\s\S]*getServiceAccessToken\(\)/u,
  );
  assert.match(
    server,
    /upsertWorkspaceVoiceProfile[\s\S]*getServiceAccessToken\(\)/u,
  );
});
