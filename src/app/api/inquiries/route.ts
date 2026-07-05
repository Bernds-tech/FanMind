import { NextRequest, NextResponse } from "next/server";
import { createPilotInquiry, normalizeInquiryText } from "@/lib/inquiries";
import { sendPilotInquiryNotification } from "@/lib/inquiryNotifications";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;
const buckets = new Map<string, { count: number; resetAt: number }>();

function rateLimitKey(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "anonymous";
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > MAX_REQUESTS_PER_WINDOW;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { email?: unknown; name?: unknown; message?: unknown; source?: unknown; company?: unknown } | null;

  if (!body || normalizeInquiryText(body.company, 80)) {
    return NextResponse.json({ error: "Anfrage konnte gerade nicht gesendet werden." }, { status: 400 });
  }

  if (isRateLimited(rateLimitKey(request))) {
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
