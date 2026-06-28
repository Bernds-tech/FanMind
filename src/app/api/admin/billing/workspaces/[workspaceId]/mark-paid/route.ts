import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/admin";
import { updateAdminBillingWorkspace } from "@/lib/adminBilling";

export async function POST(request: NextRequest, ctx: RouteContext<"/api/admin/billing/workspaces/[workspaceId]/mark-paid">) {
  const admin = await requirePlatformAdmin();
  const { workspaceId } = await ctx.params;
  const result = await updateAdminBillingWorkspace(workspaceId, admin, { billing_status: "active", billing_last_payment_at: new Date().toISOString(), billing_retry_count: 0, billing_next_retry_at: null, billing_grace_until: null, billing_admin_note: "Manuelle Zahlung eingegangen" });
  return NextResponse.json(result.ok ? { ok: true } : { error: result.error }, { status: result.status });
}
