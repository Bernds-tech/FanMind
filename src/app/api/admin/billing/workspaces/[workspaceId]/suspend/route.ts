import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/admin";
import { updateAdminBillingWorkspace } from "@/lib/adminBilling";

export async function POST(request: NextRequest, ctx: RouteContext<"/api/admin/billing/workspaces/[workspaceId]/suspend">) {
  const admin = await requirePlatformAdmin();
  const { workspaceId } = await ctx.params;
  const result = await updateAdminBillingWorkspace(workspaceId, admin, { billing_status: "manual_suspended", billing_suspended_at: new Date().toISOString(), billing_suspended_reason: "admin_manual", billing_manual_override: true });
  return NextResponse.json(result.ok ? { ok: true } : { error: result.error }, { status: result.status });
}
