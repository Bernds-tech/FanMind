import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/admin";
import { confirmAdminBillingUserEmail } from "@/lib/adminBilling";

export async function POST(request: NextRequest, ctx: RouteContext<"/api/admin/billing/users/[userId]/confirm-email">) {
  await requirePlatformAdmin();
  const { userId } = await ctx.params;
  const result = await confirmAdminBillingUserEmail(userId);
  const referer = request.headers.get("referer");
  if (request.headers.get("accept")?.includes("text/html")) return NextResponse.redirect(referer ? new URL(referer) : new URL("/admin/billing?tab=customers", request.url), { status: 303 });
  return NextResponse.json(result.ok ? { ok: true } : { error: result.error }, { status: result.status });
}
