import { NextResponse } from "next/server";
import { shouldShowBillingCheckoutAction, isWorkspaceBillingSuspended } from "@/lib/billing";
import { isTemporaryDemoUser } from "@/lib/demoMode";
import { getPreActivationRedirect } from "@/lib/preActivation";
import { createStripeCheckoutSession, getAppUrl, getStripeConfigStatus, resolveCheckoutPlan } from "@/lib/stripeBilling";
import { getSupabaseServerUser, getUserWorkspaceDashboard } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const FANMIND_PUBLIC_APP_URL = "https://fanmind.ch";

function getPublicAppUrl() {
  const configuredAppUrl = getAppUrl() || FANMIND_PUBLIC_APP_URL;

  try {
    const url = new URL(configuredAppUrl);
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return FANMIND_PUBLIC_APP_URL;
    return url.origin;
  } catch {
    return FANMIND_PUBLIC_APP_URL;
  }
}

function getInternalRedirectUrl(path: string) {
  return new URL(path, getPublicAppUrl());
}

function redirectTo(path: string) {
  return NextResponse.redirect(getInternalRedirectUrl(path), { status: 303 });
}

export async function POST() {
  const { data } = await getSupabaseServerUser();
  if (!data.user) return redirectTo("/login?returnTo=/billing/start");
  if (isTemporaryDemoUser(data.user)) return redirectTo("/billing/start");

  const workspaceResult = await getUserWorkspaceDashboard(data.user);
  if (workspaceResult.error?.message === "TEMPORARY_DEMO_DELETED") return redirectTo("/login?demo_deleted=1");

  const workspace = workspaceResult.workspace;
  if (!workspace) return redirectTo("/workspace/setup");

  const redirectTarget = getPreActivationRedirect(workspace);
  if (workspace.billing_status === "active" || redirectTarget === "/dashboard") return redirectTo("/dashboard");
  if (redirectTarget === "/billing/pending") return redirectTo("/billing/pending");
  if (isWorkspaceBillingSuspended(workspace) || redirectTarget === "/billing/suspended") return redirectTo("/billing/suspended");
  if (redirectTarget === "/workspace/setup") return redirectTo("/workspace/setup");

  const isDemo = workspace.billing_status === "demo_free" || workspace.name === "Temporary FanMind Demo";
  if (isDemo || !shouldShowBillingCheckoutAction(workspace)) return redirectTo("/billing/start");

  const plan = resolveCheckoutPlan(workspace.plan_id, workspace.commercial_option);
  if (!plan) return redirectTo("/billing/start?error=payment-option");

  const config = getStripeConfigStatus();
  if (!config.readyForCheckout) return redirectTo("/billing/start?error=payment-start");

  const session = await createStripeCheckoutSession({ plan, userId: data.user.id, workspaceId: workspace.id, userEmail: data.user.email });
  if (!session.url) return redirectTo("/billing/start?error=payment-start");

  return NextResponse.redirect(session.url, { status: 303 });
}
