import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/admin";
import { cancelInternalDailyTestSubscription } from "@/lib/adminBilling";
import { redirectAdminHtml } from "@/lib/adminRedirects";

export async function POST(request: NextRequest, ctx: RouteContext<"/api/admin/billing/workspaces/[workspaceId]/internal-daily-test/cancel">) {
  const admin = await requirePlatformAdmin();
  const { workspaceId } = await ctx.params;
  const result = await cancelInternalDailyTestSubscription(workspaceId, admin);
  const htmlRedirect = redirectAdminHtml(request, `/admin/billing/workspaces/${workspaceId}`);
  if (htmlRedirect) return htmlRedirect;
  return NextResponse.json(result.ok ? { ok: true } : { error: result.error }, { status: result.status });
}
