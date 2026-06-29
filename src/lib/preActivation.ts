import type { WorkspaceDashboardRow } from "@/lib/supabase/server";
import { isWorkspaceBillingSuspended } from "@/lib/billing";

const ASYNC_BILLING_STATUSES = new Set(["pending_sepa_mandate"]);
const PRE_ACTIVATION_BILLING_STATUSES = new Set(["pending_payment_setup", "past_due", "payment_failed"]);

export function getPreActivationRedirect(workspace: Pick<WorkspaceDashboardRow, "billing_status" | "plan_id" | "name"> | null | undefined): string | null {
  if (!workspace) return "/workspace/setup";
  if (workspace.name === "Temporary FanMind Demo" || workspace.billing_status === "demo_free") return null;
  if (isWorkspaceBillingSuspended(workspace)) return "/billing/suspended";
  if (workspace.billing_status === "active") return null;
  if (ASYNC_BILLING_STATUSES.has(String(workspace.billing_status))) return "/billing/pending";
  if (PRE_ACTIVATION_BILLING_STATUSES.has(String(workspace.billing_status)) || (workspace.plan_id === "pilot" || workspace.plan_id === "starter")) {
    return "/billing/start";
  }
  return null;
}

export function getBillingContinuationHref(workspace: Pick<WorkspaceDashboardRow, "billing_status" | "plan_id" | "name"> | null | undefined): string {
  return getPreActivationRedirect(workspace) ?? "/dashboard";
}
