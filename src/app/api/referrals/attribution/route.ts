import { NextResponse } from "next/server";
import { createReferralAttribution } from "@/lib/referrals";
import { getSupabaseServerUser, getUserWorkspaceDashboard } from "@/lib/supabase/server";

type ReferralAttributionRequest = {
  referralCode?: string;
};

export async function POST(request: Request) {
  const { data } = await getSupabaseServerUser();
  if (!data.user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const body = await request.json().catch(() => ({})) as ReferralAttributionRequest;
  const referralCode = String(body.referralCode ?? "").trim();
  if (!referralCode) return NextResponse.json({ ok: true });

  const workspaceResult = await getUserWorkspaceDashboard(data.user);
  if (!workspaceResult.workspace) return NextResponse.json({ error: "Workspace nicht gefunden." }, { status: 404 });

  const result = await createReferralAttribution({
    referralCode,
    referredWorkspaceId: workspaceResult.workspace.id,
    referredUserId: data.user.id,
  });

  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
