import { NextRequest, NextResponse } from "next/server";
import { shouldShowBillingCheckoutAction, isWorkspaceBillingSuspended } from "@/lib/billing";
import { isTemporaryDemoUser } from "@/lib/demoMode";
import { getPreActivationRedirect } from "@/lib/preActivation";
import { createStripeCheckoutSession, getStripeConfigStatus, resolveCheckoutPlan } from "@/lib/stripeBilling";
import { getSupabaseServerUser, getUserWorkspaceDashboard } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function redirectTo(path: string, request: NextRequest) {
  return NextResponse.redirect(new URL(path, request.url), { status: 303 });
}

export async function POST(request: NextRequest) {
  const { data } = await getSupabaseServerUser();
  if (!data.user) return redirectTo("/login?returnTo=/billing/start", request);
  if (isTemporaryDemoUser(data.user)) return redirectTo("/billing/start", request);

  const workspaceResult = await getUserWorkspaceDashboard(data.user);
  if (workspaceResult.error?.message === "TEMPORARY_DEMO_DELETED") return redirectTo("/login?demo_deleted=1", request);

  const workspace = workspaceResult.workspace;
  if (!workspace) return redirectTo("/workspace/setup", request);

  const redirectTarget = getPreActivationRedirect(workspace);
  if (workspace.billing_status === "active" || redirectTarget === "/dashboard") return redirectTo("/dashboard", request);
  if (redirectTarget === "/billing/pending") return redirectTo("/billing/pending", request);
  if (isWorkspaceBillingSuspended(workspace) || redirectTarget === "/billing/suspended") return redirectTo("/billing/suspended", request);
  if (redirectTarget === "/workspace/setup") return redirectTo("/workspace/setup", request);

  const isDemo = workspace.billing_status === "demo_free" || workspace.name === "Temporary FanMind Demo";
  if (isDemo || !shouldShowBillingCheckoutAction(workspace)) return redirectTo("/billing/start", request);

  const plan = resolveCheckoutPlan(workspace.plan_id, workspace.commercial_option);
  if (!plan) return redirectTo("/billing/start?error=payment-option", request);

  const config = getStripeConfigStatus();
  if (!config.readyForCheckout) return redirectTo("/billing/start?error=payment-start", request);

  const session = await createStripeCheckoutSession({ plan, userId: data.user.id, workspaceId: workspace.id, userEmail: data.user.email });
  if (!session.url) return redirectTo("/billing/start?error=payment-start", request);

  return NextResponse.redirect(session.url, { status: 303 });
}
