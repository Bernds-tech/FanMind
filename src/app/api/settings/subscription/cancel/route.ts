import { NextResponse } from "next/server";
import { getSupabaseRestUrl } from "@/lib/supabase/config";
import { getSupabaseServerUser, getUserWorkspaceDashboard } from "@/lib/supabase/server";
import { canManageSubscription, computeCancellationEffectiveAt } from "@/lib/subscriptionCancellationPolicy.mjs";

export const dynamic = "force-dynamic";

async function updateStripeSubscription(subscriptionId: string, effectiveAt: string) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error("PAYMENT_PROVIDER_NOT_CONFIGURED");
  const effectiveEpoch = Math.floor(new Date(effectiveAt).getTime() / 1000);
  const body = new URLSearchParams();
  body.set("cancel_at", String(effectiveEpoch));
  body.set("metadata[fanmind_cancellation_requested]", "true");
  const response = await fetch(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(subscriptionId)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((json as { error?: { message?: string } }).error?.message ?? "PAYMENT_PROVIDER_REJECTED");
}

async function persistCancellation(input: { workspaceId: string; userId: string; effectiveAt: string; subscriptionId: string }) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error("SERVICE_KEY_MISSING");
  const now = new Date().toISOString();
  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json", Prefer: "return=minimal" };
  const workspaceResponse = await fetch(`${getSupabaseRestUrl("workspaces")}?id=eq.${encodeURIComponent(input.workspaceId)}&owner_user_id=eq.${encodeURIComponent(input.userId)}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ cancellation_requested_at: now, cancellation_effective_at: input.effectiveAt, cancellation_revoked_at: null, billing_updated_at: now }),
  });
  if (!workspaceResponse.ok) throw new Error("WORKSPACE_UPDATE_FAILED");
  await fetch(getSupabaseRestUrl("subscription_audit_log"), {
    method: "POST",
    headers,
    body: JSON.stringify({ workspace_id: input.workspaceId, actor_user_id: input.userId, action: "cancel_requested", effective_at: input.effectiveAt, stripe_subscription_id: input.subscriptionId }),
  });
}

export async function POST() {
  const { data } = await getSupabaseServerUser();
  if (!data.user) return NextResponse.json({ error: "Bitte melde dich erneut an." }, { status: 401 });
  const result = await getUserWorkspaceDashboard(data.user);
  const workspace = result.workspace;
  if (!workspace || !canManageSubscription(workspace, data.user.id)) {
    return NextResponse.json({ error: "Nur der Workspace-Owner kann das Abo verwalten." }, { status: 403 });
  }

  const effectiveAt = computeCancellationEffectiveAt({
    commercialOption: workspace.commercial_option,
    currentPeriodEnd: workspace.current_period_end ?? workspace.billing_updated_at ?? new Date().toISOString(),
    commitmentStartedAt: workspace.commitment_started_at ?? workspace.billing_last_payment_at ?? workspace.billing_updated_at,
    commitmentMonths: workspace.commitment_months ?? 0,
  });

  try {
    await updateStripeSubscription(workspace.stripe_subscription_id!, effectiveAt);
    await persistCancellation({ workspaceId: workspace.id, userId: data.user.id, effectiveAt, subscriptionId: workspace.stripe_subscription_id! });
    return NextResponse.json({ ok: true, effectiveAt });
  } catch (error) {
    console.error("Subscription cancellation failed", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Die Kündigung konnte nicht sicher vorgemerkt werden. Bitte versuche es erneut." }, { status: 502 });
  }
}
