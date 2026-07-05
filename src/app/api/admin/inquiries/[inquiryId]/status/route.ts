import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/admin";
import { updatePilotInquiryStatus } from "@/lib/inquiries";

export async function POST(request: NextRequest, context: { params: Promise<{ inquiryId: string }> }) {
  const admin = await requirePlatformAdmin();
  const formData = await request.formData().catch(() => null);
  const status = String(formData?.get("status") ?? "");
  const { inquiryId } = await context.params;
  const result = await updatePilotInquiryStatus(inquiryId, status, admin);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.statusCode });
  return NextResponse.redirect(new URL("/admin/inquiries", request.url), { status: 303 });
}
