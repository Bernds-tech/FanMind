import { NextRequest, NextResponse } from "next/server";
import { isTemporaryDemoUser } from "@/lib/demoMode";
import { createStripeCheckoutSession, getStripeConfigStatus, resolveCheckoutPlan } from "@/lib/stripeBilling";
import { getSupabaseServerUser, getUserWorkspaceDashboard } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const { data } = await getSupabaseServerUser();
  if (!data.user) return NextResponse.json({ error: "Deine Sitzung ist abgelaufen. Bitte melde dich erneut an, um die Zahlung fortzusetzen." }, { status: 401 });
  if (isTemporaryDemoUser(data.user)) return NextResponse.json({ error: "Demo-User können keinen Checkout starten." }, { status: 403 });

  const payload = await request.json().catch(() => ({})) as { planId?: string; commercialOption?: string };
  if (!payload.planId || !payload.commercialOption) return NextResponse.json({ error: "Deine Zahlungsoption konnte nicht eindeutig zugeordnet werden. Bitte kontaktiere FanMind." }, { status: 400 });

  const config = getStripeConfigStatus();
  if (!config.readyForCheckout) return NextResponse.json({ error: "Die Zahlung ist aktuell noch nicht vollständig konfiguriert. Bitte kontaktiere FanMind." }, { status: 503 });

  const plan = resolveCheckoutPlan(payload.planId, payload.commercialOption);
  if (!plan) return NextResponse.json({ error: "Deine Zahlungsoption konnte nicht eindeutig zugeordnet werden. Bitte kontaktiere FanMind." }, { status: 400 });

  const workspaceResult = await getUserWorkspaceDashboard(data.user);
  if (!workspaceResult.workspace) return NextResponse.json({ error: workspaceResult.error?.message ?? "Workspace konnte nicht geladen werden." }, { status: 400 });
  if (workspaceResult.workspace.plan_id !== plan.planId || workspaceResult.workspace.commercial_option !== plan.commercialOption) {
    return NextResponse.json({ error: "Deine Zahlungsoption konnte nicht eindeutig zugeordnet werden. Bitte kontaktiere FanMind." }, { status: 400 });
  }

  const session = await createStripeCheckoutSession({ plan, userId: data.user.id, workspaceId: workspaceResult.workspace.id, userEmail: data.user.email });
  if (!session.url) return NextResponse.json({ error: session.error ?? "Stripe Checkout konnte nicht gestartet werden." }, { status: 502 });
  return NextResponse.json({ url: session.url, sessionId: session.id });
}
