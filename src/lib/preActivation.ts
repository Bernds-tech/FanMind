import type { WorkspaceDashboardRow } from "@/lib/supabase/server";
import { isWorkspaceBillingSuspended } from "@/lib/billing";
import { isPlatformAdminEmail } from "@/lib/admin";
import { isDemoWorkspace } from "@/lib/demoMode";

const ASYNC_BILLING_STATUSES = new Set(["pending_sepa_mandate"]);
const PRE_ACTIVATION_BILLING_STATUSES = new Set(["pending_payment_setup", "past_due", "payment_failed"]);

export function getPreActivationRedirect(
  workspace: Pick<WorkspaceDashboardRow, "billing_status" | "plan_id" | "name"> | null | undefined,
  userEmail?: string | null,
): string | null {
  if (!workspace) return "/workspace/setup";
  if (isPlatformAdminEmail(userEmail)) return null;
  if (isDemoWorkspace(workspace)) return null;
  if (isWorkspaceBillingSuspended(workspace)) return "/billing/suspended";
  if (workspace.billing_status === "active") return null;
  if (ASYNC_BILLING_STATUSES.has(String(workspace.billing_status))) return "/billing/pending";
  if (PRE_ACTIVATION_BILLING_STATUSES.has(String(workspace.billing_status)) || (workspace.plan_id === "pilot" || workspace.plan_id === "starter")) {
    return "/billing/start";
  }
  return null;
}

export function getBillingContinuationHref(
  workspace: Pick<WorkspaceDashboardRow, "billing_status" | "plan_id" | "name"> | null | undefined,
  userEmail?: string | null,
): string {
  return getPreActivationRedirect(workspace, userEmail) ?? "/dashboard";
}
