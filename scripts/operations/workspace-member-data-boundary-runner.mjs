#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const CONTROL_ID = "20260816120000_workspace_member_data_boundary";
export const CONTROL_PATH = resolve(
  process.cwd(),
  `supabase/controlled/${CONTROL_ID}.sql`,
);
export const EXPECTED_CONTROL_SHA256 =
  "365f721ef4fc12383a6606c33b0c922d74c117e80b06d06a651723be7b7d133c";
export const PROTECTED_MEMBER_WRITABLE_TABLES = Object.freeze([
  "contacts",
  "memories",
  "followups",
  "conversations",
  "conversation_messages",
  "conversation_summaries",
  "contact_reply_targets",
  "ai_usage_events",
  "content_sources",
  "fan_analysis_reports",
  "contact_ai_profiles",
  "workspace_voice_profiles",
]);
export const SOCIAL_CONNECTION_PUBLIC_COLUMNS = Object.freeze([
  "id",
  "workspace_id",
  "platform",
  "provider",
  "status",
  "external_account_id",
  "external_account_name",
  "page_id",
  "page_name",
  "token_last_four",
  "scopes",
  "webhook_subscribed",
  "connected_by",
  "connected_at",
  "disconnected_at",
  "last_event_at",
  "last_comment_fetch_at",
  "last_comment_fetch_count",
  "last_comment_fetch_error",
  "last_messenger_sync_at",
  "last_messenger_sync_checked_count",
  "last_messenger_sync_imported_inbound_count",
  "last_messenger_sync_imported_outbound_count",
  "last_messenger_sync_imported_media_count",
  "last_messenger_sync_skipped_count",
  "last_messenger_sync_error",
  "last_messenger_sync_outbound_at",
  "created_at",
  "updated_at",
]);

function fail(code) {
  throw new Error(`WORKSPACE_MEMBER_DATA_BOUNDARY_ERROR=${code}`);
}

function singleCheckMode(argumentsList) {
  if (argumentsList.length === 0) return;
  if (argumentsList.length === 1 && argumentsList[0] === "--check") return;
  fail("argument_invalid");
}

function safeProjectionContract(sql) {
  const match = sql.match(
    /returns table\s*\(([\s\S]*?)\)\s*language plpgsql/iu,
  );
  if (!match) fail("safe_projection_missing");
  const resultShape = match[1];
  const expectedColumns = [
    "workspace_id uuid",
    "workspace_name text",
    "plan_id text",
    "membership_role text",
    "member_processing_allowed boolean",
  ];
  for (const column of expectedColumns) {
    if (!resultShape.includes(column)) fail("safe_projection_shape_invalid");
  }
  for (const sensitiveName of [
    "owner_user_id",
    "commercial_option",
    "setup_fee_cents",
    "monthly_fee_cents",
    "commitment_months",
    "billing_status",
    "billing_provider",
    "stripe_",
    "last_invoice_",
    "organization_name",
    "street_address",
    "postal_code",
    "city",
    "country",
    "vat_id",
    "tax_number",
    "company_register_",
    "test_access_flags",
  ]) {
    if (resultShape.includes(sensitiveName)) {
      fail("safe_projection_shape_invalid");
    }
  }
}

function socialConnectionProjectionContract(sql) {
  const match = sql.match(
    /grant select\s*\(([\s\S]*?)\)\s*on table public\.social_connections\s*to authenticated;/iu,
  );
  if (!match) fail("social_connection_projection_missing");
  const actualColumns = match[1]
    .split(",")
    .map((column) => column.trim().toLowerCase())
    .filter(Boolean);
  if (
    actualColumns.length !== SOCIAL_CONNECTION_PUBLIC_COLUMNS.length ||
    actualColumns.some(
      (column, index) => column !== SOCIAL_CONNECTION_PUBLIC_COLUMNS[index],
    )
  ) {
    fail("social_connection_projection_invalid");
  }
}

function sqlStringArray(block, marker) {
  const match = block.match(/array\s*\[([\s\S]*?)\]/iu);
  if (!match) fail(`${marker}_array_missing`);
  return [...match[1].matchAll(/'([^']+)'/gu)].map((entry) => entry[1]);
}

function protectedTableCoverageContract(sql) {
  const preconditionBlock = sql.match(
    /do \$rls_precondition\$([\s\S]*?)\$rls_precondition\$;/iu,
  )?.[1];
  const policyBlock = sql.match(
    /do \$policies\$([\s\S]*?)\$policies\$;/iu,
  )?.[1];
  const postflightBlock = sql.match(
    /do \$policy_postflight\$([\s\S]*?)\$policy_postflight\$;/iu,
  )?.[1];
  if (!preconditionBlock || !policyBlock || !postflightBlock) {
    fail("protected_table_block_missing");
  }

  const preconditionTables = sqlStringArray(
    preconditionBlock,
    "rls_precondition",
  );
  const policyTables = sqlStringArray(policyBlock, "policy");
  const postflightTables = sqlStringArray(postflightBlock, "postflight");
  const expected = [...PROTECTED_MEMBER_WRITABLE_TABLES];

  if (
    !expected.every((table) => preconditionTables.includes(table)) ||
    !preconditionTables.includes("workspace_analysis_settings") ||
    policyTables.length !== expected.length ||
    postflightTables.length !== expected.length ||
    policyTables.some((table, index) => table !== expected[index]) ||
    postflightTables.some((table, index) => table !== expected[index])
  ) {
    fail("protected_table_coverage_invalid");
  }
}

export function evaluateWorkspaceMemberDataBoundarySql(sql) {
  if (typeof sql !== "string") fail("control_unreadable");
  const digest = createHash("sha256").update(sql).digest("hex");
  if (digest !== EXPECTED_CONTROL_SHA256) fail("control_checksum_mismatch");

  safeProjectionContract(sql);
  socialConnectionProjectionContract(sql);
  protectedTableCoverageContract(sql);

  const requiredContracts = [
    /^begin;/iu,
    /create policy workspaces_select_requires_owner[\s\S]*as restrictive[\s\S]*for select[\s\S]*to authenticated[\s\S]*owner_user_id = \(select auth\.uid\(\)\)/iu,
    /create policy workspace_analysis_settings_select_requires_workspace_owner[\s\S]*as restrictive[\s\S]*for select[\s\S]*to authenticated[\s\S]*analysis_settings_owner_boundary\.owner_user_id/iu,
    /workspace_analysis_settings_policy_postflight_failed/iu,
    /create or replace function public\.get_current_workspace_member_safe_dashboard\(\)/iu,
    /create or replace function public\.workspace_processing_allowed_contract\([\s\S]*returns boolean[\s\S]*security invoker/iu,
    /normalized_billing_status in \('cancelled', 'expired', 'refunded'\)[\s\S]*temporary_processing_access[\s\S]*billing_manual_override/iu,
    /processing_contract_terminal_override_failed/iu,
    /processing_contract_terminal_temporary_failed/iu,
    /processing_contract_invalid_temporary_expiry_failed/iu,
    /processing_contract_invalid_grace_failed/iu,
    /processing_contract_suspended_grace_failed/iu,
    /processing_contract_active_failed/iu,
    /processing_contract_fixed_demo_failed/iu,
    /processing_contract_temporary_demo_without_db_expiry_failed/iu,
    /processing_contract_temporary_demo_with_db_expiry_failed/iu,
    /processing_contract_untrusted_demo_failed/iu,
    /create or replace function public\.workspace_owner_active_mutation_allowed\([\s\S]*owned_workspace\.owner_user_id = \(select auth\.uid\(\)\)[\s\S]*workspace_processing_allowed_contract/iu,
    /grant execute on function public\.workspace_owner_active_mutation_allowed\(uuid\)[\s\S]*to authenticated/iu,
    /security definer[\s\S]*set search_path = pg_catalog, public, pg_temp[\s\S]*set row_security = on/iu,
    /current_user_id uuid := auth\.uid\(\)/iu,
    /if membership_count <> 1 then[\s\S]*return;/iu,
    /when lower\(trim\(coalesce\(member\.role, ''\)\)\) = 'owner' then null[\s\S]*else 'member'/iu,
    /revoke all on function public\.get_current_workspace_member_safe_dashboard\(\)[\s\S]*from public, anon, authenticated/iu,
    /grant execute on function public\.get_current_workspace_member_safe_dashboard\(\)[\s\S]*to authenticated/iu,
    /as restrictive for insert to authenticated with check/iu,
    /as restrictive for update to authenticated using[\s\S]*with check/iu,
    /as restrictive for delete to authenticated using/iu,
    /public\.workspace_owner_active_mutation_allowed\(workspace_id\)/iu,
    /create policy social_connections_select_requires_workspace_owner[\s\S]*as restrictive[\s\S]*for select[\s\S]*to authenticated/iu,
    /create policy social_connections_insert_requires_workspace_owner[\s\S]*as restrictive[\s\S]*for insert[\s\S]*to authenticated/iu,
    /create policy social_connections_update_requires_workspace_owner[\s\S]*as restrictive[\s\S]*for update[\s\S]*to authenticated/iu,
    /create policy social_connections_delete_requires_workspace_owner[\s\S]*as restrictive[\s\S]*for delete[\s\S]*to authenticated/iu,
    /revoke all on table public\.social_connections[\s\S]*from public, anon, authenticated/iu,
    /revoke select \(%1\$s\), insert \(%1\$s\), update \(%1\$s\), references \(%1\$s\)[\s\S]*from public, anon, authenticated/iu,
    /grant select, insert, update, delete on table public\.social_connections[\s\S]*to service_role/iu,
    /has_any_column_privilege\('authenticated', 'public\.social_connections', 'INSERT'\)/iu,
    /has_column_privilege\([\s\S]*'page_access_token_encrypted'[\s\S]*'SELECT'/iu,
    /social_connections_service_role_boundary_failed/iu,
    /commit;\s*$/iu,
  ];
  if (requiredContracts.some((contract) => !contract.test(sql))) {
    fail("control_contract_invalid");
  }

  const forbiddenContracts = [
    /\bcreate\s+table\b/iu,
    /\balter\s+table\b/iu,
    /\btruncate\b/iu,
    /\b(?:insert\s+into|update\s+public\.|delete\s+from)\b/iu,
    /\brevoke\b[\s\S]{0,200}\bfrom\s+service_role\b/iu,
    /\bgrant\s+all\b/iu,
    /\bfor\s+all\b/iu,
    /when\s+others/iu,
    /\bstable\s+stable\b/iu,
  ];
  if (forbiddenContracts.some((contract) => contract.test(sql))) {
    fail("control_contract_invalid");
  }

  return Object.freeze({ controlId: CONTROL_ID, digest });
}

function main() {
  singleCheckMode(process.argv.slice(2));
  let sql;
  try {
    sql = readFileSync(CONTROL_PATH, "utf8");
  } catch {
    fail("control_unreadable");
  }
  const evaluation = evaluateWorkspaceMemberDataBoundarySql(sql);
  console.log(`WORKSPACE_MEMBER_DATA_BOUNDARY_CONTROL_ID=${evaluation.controlId}`);
  console.log("WORKSPACE_MEMBER_DATA_BOUNDARY_CHECKSUM=verified");
  console.log("WORKSPACE_MEMBER_DATA_BOUNDARY_CONTRACT=verified");
  console.log("WORKSPACE_MEMBER_DATA_BOUNDARY_DATABASE_WRITE=not_performed");
  console.log("WORKSPACE_MEMBER_DATA_BOUNDARY_READY=CHECKED_NOT_APPLIED");
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    main();
  } catch (error) {
    if (
      error instanceof Error &&
      /^WORKSPACE_MEMBER_DATA_BOUNDARY_ERROR=[a-z0-9_]+$/u.test(error.message)
    ) {
      console.error(error.message);
    } else {
      console.error("WORKSPACE_MEMBER_DATA_BOUNDARY_ERROR=unexpected_failure");
    }
    process.exitCode = 1;
  }
}
