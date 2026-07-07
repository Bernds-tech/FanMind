import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/admin";
import { confirmAdminBillingUserEmail } from "@/lib/adminBilling";
import { getSafeAdminRefererPath, redirectAdminHtml } from "@/lib/adminRedirects";

export async function POST(request: NextRequest, ctx: RouteContext<"/api/admin/billing/users/[userId]/confirm-email">) {
  await requirePlatformAdmin();
  const { userId } = await ctx.params;
  const result = await confirmAdminBillingUserEmail(userId);
  const htmlRedirect = redirectAdminHtml(request, getSafeAdminRefererPath(request) ?? "/admin/billing?tab=customers");
  if (htmlRedirect) return htmlRedirect;
  return NextResponse.json(result.ok ? { ok: true } : { error: result.error }, { status: result.status });
}
