import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/admin";
import { markWorkspaceAsInternalTestAccess } from "@/lib/adminBilling";

export async function POST(request: NextRequest, ctx: RouteContext<"/api/admin/billing/workspaces/[workspaceId]/internal-test">) {
  const admin = await requirePlatformAdmin();
  const { workspaceId } = await ctx.params;
  const result = await markWorkspaceAsInternalTestAccess(workspaceId, admin);
  if (request.headers.get("accept")?.includes("text/html")) return NextResponse.redirect(new URL(`/admin/billing/workspaces/${workspaceId}`, request.url), { status: 303 });
  return NextResponse.json(result.ok ? { ok: true } : { error: result.error }, { status: result.status });
}
