import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/admin";
import { updateAdminBillingWorkspace } from "@/lib/adminBilling";
import { redirectAdminHtml } from "@/lib/adminRedirects";

export async function POST(request: NextRequest, ctx: RouteContext<"/api/admin/billing/workspaces/[workspaceId]/note">) {
  const admin = await requirePlatformAdmin();
  const { workspaceId } = await ctx.params;
  const contentType = request.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? ((await request.json().catch(() => ({}))) as { note?: string })
    : { note: (await request.formData().catch(() => new FormData())).get("note")?.toString() };
  const result = await updateAdminBillingWorkspace(workspaceId, admin, { billing_admin_note: String(payload.note ?? "").slice(0, 2000) });
  const htmlRedirect = redirectAdminHtml(request, `/admin/billing/workspaces/${workspaceId}`);
  if (htmlRedirect) return htmlRedirect;
  return NextResponse.json(result.ok ? { ok: true } : { error: result.error }, { status: result.status });
}
