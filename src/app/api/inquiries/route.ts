import { NextRequest, NextResponse } from "next/server";
import { createPilotInquiry, normalizeInquiryText } from "@/lib/inquiries";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { sendPilotInquiryNotification } from "@/lib/inquiryNotifications";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { email?: unknown; name?: unknown; message?: unknown; source?: unknown; company?: unknown } | null;

  if (!body || normalizeInquiryText(body.company, 80)) {
    return NextResponse.json({ error: "Anfrage konnte gerade nicht gesendet werden." }, { status: 400 });
  }

  if (!checkRateLimit(`inquiry:${getClientIp(request)}`, { maxRequests: MAX_REQUESTS_PER_WINDOW, windowMs: WINDOW_MS }).allowed) {
    return NextResponse.json({ error: "Anfrage konnte gerade nicht gesendet werden." }, { status: 429 });
  }

  const email = normalizeInquiryText(body.email, 254);
  if (!email) {
    return NextResponse.json({ error: "Anfrage konnte gerade nicht gesendet werden." }, { status: 400 });
  }

  const result = await createPilotInquiry({
    email,
    name: normalizeInquiryText(body.name, 120),
    message: normalizeInquiryText(body.message, 2000),
    source: normalizeInquiryText(body.source, 80) ?? "landing_footer",
  });

  if (result.error || !result.inquiry) {
    return NextResponse.json({ error: "Anfrage konnte gerade nicht gesendet werden." }, { status: 500 });
  }

  const notification = await sendPilotInquiryNotification(result.inquiry);
  return NextResponse.json({ ok: true, notificationSent: notification.sent });
}
