import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/admin";
import { startInternalDailyTestCheckout } from "@/lib/adminBilling";

export async function POST(_request: NextRequest, ctx: RouteContext<"/api/admin/billing/workspaces/[workspaceId]/internal-daily-test">) {
  const admin = await requirePlatformAdmin();
  const { workspaceId } = await ctx.params;
  const result = await startInternalDailyTestCheckout(workspaceId, admin);
  if (result.url) return NextResponse.redirect(result.url, { status: 303 });
  return NextResponse.json({ error: result.error }, { status: result.status });
}
