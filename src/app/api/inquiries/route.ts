import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;
const EMAIL_MAX_LENGTH = 254;
const NAME_MAX_LENGTH = 160;
const MESSAGE_MAX_LENGTH = 2000;
const SOURCE_MAX_LENGTH = 120;
const DEFAULT_FROM = "FanMind <noreply@fanmind.ch>";
const DEFAULT_TO = "kontakt@fanmind.ch";
const SUBJECT = "Neue FanMind Pilot-Anfrage";

type InquiryBody = {
  email?: unknown;
  name?: unknown;
  message?: unknown;
  source?: unknown;
  company?: unknown;
};

function normalizeText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized ? normalized.slice(0, maxLength) : null;
}

function isValidEmail(email: string): boolean {
  return email.length <= EMAIL_MAX_LENGTH && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDisplayValue(value: string | null, fallback: string): string {
  return value && value.length > 0 ? value : fallback;
}

function buildTextEmail(input: { email: string; name: string | null; message: string | null; source: string | null; timestamp: string }): string {
  return [
    "Neue FanMind Pilot-Anfrage",
    "",
    "E-Mail:",
    input.email,
    "",
    "Name:",
    formatDisplayValue(input.name, "Nicht angegeben"),
    "",
    "Nachricht / Use Case:",
    formatDisplayValue(input.message, "Nicht angegeben"),
    "",
    "Quelle:",
    formatDisplayValue(input.source, "unbekannt"),
    "",
    "Zeitpunkt:",
    input.timestamp,
  ].join("\n");
}

function buildHtmlEmail(input: { email: string; name: string | null; message: string | null; source: string | null; timestamp: string }): string {
  const rows = [
    ["E-Mail", input.email],
    ["Name", formatDisplayValue(input.name, "Nicht angegeben")],
    ["Nachricht / Use Case", formatDisplayValue(input.message, "Nicht angegeben")],
    ["Quelle", formatDisplayValue(input.source, "unbekannt")],
    ["Zeitpunkt", input.timestamp],
  ];

  return `<!doctype html>
<html lang="de">
  <body style="margin:0;padding:24px;background:#f6f7fb;color:#111827;font-family:Arial,Helvetica,sans-serif;">
    <main style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:24px;">
      <h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;color:#111827;">Neue FanMind Pilot-Anfrage</h1>
      <table role="presentation" style="width:100%;border-collapse:collapse;">
        <tbody>
          ${rows
            .map(
              ([label, value]) => `<tr>
            <th scope="row" style="width:180px;padding:12px 12px 12px 0;border-top:1px solid #e5e7eb;text-align:left;vertical-align:top;color:#6b7280;font-size:14px;">${escapeHtml(label)}</th>
            <td style="padding:12px 0;border-top:1px solid #e5e7eb;white-space:pre-wrap;font-size:15px;line-height:1.5;color:#111827;">${escapeHtml(value)}</td>
          </tr>`,
            )
            .join("\n")}
        </tbody>
      </table>
    </main>
  </body>
</html>`;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as InquiryBody | null;
  if (!body) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });

  const honeypot = normalizeText(body.company, 160);
  if (honeypot) {
    return NextResponse.json({ ok: true });
  }

  if (!checkRateLimit(`inquiry:${getClientIp(request)}`, { maxRequests: MAX_REQUESTS_PER_WINDOW, windowMs: WINDOW_MS }).allowed) {
    return NextResponse.json({ error: "MAIL_SEND_FAILED" }, { status: 429 });
  }

  const email = normalizeText(body.email, EMAIL_MAX_LENGTH)?.toLowerCase() ?? "";
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  }

  const name = normalizeText(body.name, NAME_MAX_LENGTH);
  const message = normalizeText(body.message, MESSAGE_MAX_LENGTH);
  const source = normalizeText(body.source, SOURCE_MAX_LENGTH);
  const timestamp = new Date().toISOString();
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "MAIL_NOT_CONFIGURED" }, { status: 503 });
    }

    // Local development fallback: allow form/API checks without a real mail provider.
    console.warn("FanMind inquiry mail skipped because RESEND_API_KEY is not configured.");
    return NextResponse.json({ ok: true });
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.FANMIND_NOTIFICATION_FROM || DEFAULT_FROM,
      to: process.env.FANMIND_INQUIRY_TO || DEFAULT_TO,
      subject: SUBJECT,
      reply_to: email,
      text: buildTextEmail({ email, name, message, source, timestamp }),
      html: buildHtmlEmail({ email, name, message, source, timestamp }),
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    console.error(`FanMind inquiry mail failed with Resend status ${response.status}.`);
    return NextResponse.json({ error: "MAIL_SEND_FAILED" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
