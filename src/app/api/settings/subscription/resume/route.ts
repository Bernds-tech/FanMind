import { NextResponse } from "next/server";
import { getSupabaseRestUrl } from "@/lib/supabase/config";
import { getSupabaseServerUser, getUserWorkspaceDashboard } from "@/lib/supabase/server";
import { canManageSubscription } from "@/lib/subscriptionCancellationPolicy.mjs";

export const dynamic = "force-dynamic";

type ManagedWorkspace = {
  id: string;
  owner_user_id: string;
  stripe_subscription_id?: string | null;
};

async function resumeStripeSubscription(subscriptionId: string) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error("PAYMENT_PROVIDER_NOT_CONFIGURED");
  const body = new URLSearchParams();
  body.set("cancel_at", "");
  body.set("cancel_at_period_end", "false");
  body.set("metadata[fanmind_cancellation_requested]", "false");
  const response = await fetch(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(subscriptionId)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((json as { error?: { message?: string } }).error?.message ?? "PAYMENT_PROVIDER_REJECTED");
}

export async function POST() {
  const { data } = await getSupabaseServerUser();
  if (!data.user) return NextResponse.json({ error: "Bitte melde dich erneut an." }, { status: 401 });
  const result = await getUserWorkspaceDashboard(data.user);
  const workspace = result.workspace as ManagedWorkspace | null;
  if (!workspace || !canManageSubscription(workspace, data.user.id)) {
    return NextResponse.json({ error: "Nur der Workspace-Owner kann das Abo verwalten." }, { status: 403 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "Die Aboverwaltung ist aktuell nicht verfügbar." }, { status: 503 });

  try {
    await resumeStripeSubscription(workspace.stripe_subscription_id!);
    const now = new Date().toISOString();
    const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json", Prefer: "return=minimal" };
    const response = await fetch(`${getSupabaseRestUrl("workspaces")}?id=eq.${encodeURIComponent(workspace.id)}&owner_user_id=eq.${encodeURIComponent(data.user.id)}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ cancellation_requested_at: null, cancellation_effective_at: null, cancellation_revoked_at: now, billing_updated_at: now }),
    });
    if (!response.ok) throw new Error("WORKSPACE_UPDATE_FAILED");
    await fetch(getSupabaseRestUrl("subscription_audit_log"), {
      method: "POST",
      headers,
      body: JSON.stringify({ workspace_id: workspace.id, actor_user_id: data.user.id, action: "cancel_revoked", stripe_subscription_id: workspace.stripe_subscription_id }),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Subscription resume failed", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Die Kündigung konnte nicht sicher zurückgenommen werden." }, { status: 502 });
  }
}
