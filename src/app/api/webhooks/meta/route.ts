import { createHmac, timingSafeEqual } from "node:crypto";
import { processMetaWebhookPayload } from "@/lib/metaWebhook";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const verifyToken = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    verifyToken &&
    verifyToken === process.env.META_WEBHOOK_VERIFY_TOKEN &&
    challenge
  ) {
    return new Response(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return new Response("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  if (
    !isValidMetaSignature(rawBody, request.headers.get("x-hub-signature-256"))
  ) {
    return Response.json(
      { received: false, error: "Invalid signature" },
      { status: 403 },
    );
  }

  let payload: unknown;

  try {
    payload = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    return Response.json({ received: false, error: "Invalid JSON" }, { status: 400 });
  }

  const result = await processMetaWebhookPayload(payload);

  if (result.error) {
    console.error("Meta webhook could not save minimized event", {
      eventCount: result.eventCount,
      error: result.error,
    });
  } else {
    console.info("Meta webhook processed", {
      eventCount: result.eventCount,
      saved: result.saved,
      skipped: result.skipped,
    });
  }

  return Response.json({
    received: true,
    saved: result.saved,
    skipped: result.skipped,
  });
}

function isValidMetaSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  const appSecret = process.env.META_WEBHOOK_APP_SECRET;

  if (!appSecret) return true;
  if (!signatureHeader?.startsWith("sha256=")) return false;

  const expected = createHmac("sha256", appSecret)
    .update(rawBody)
    .digest("hex");
  const received = signatureHeader.slice("sha256=".length);
  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(received, "hex");

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}
