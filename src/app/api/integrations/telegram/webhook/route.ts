import { processTelegramWebhookUpdate } from "@/lib/telegramWebhook";

export async function POST(request: Request) {
  const configuredSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (configuredSecret) {
    const incomingSecret = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
    if (incomingSecret !== configuredSecret) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const update = (await request.json()) as unknown;
    const result = await processTelegramWebhookUpdate(update);

    if (result.error && !result.skipped) {
      console.error("Telegram webhook processing failed", {
        reason: result.reason ?? "processing_error",
        error: result.error,
      });
      return Response.json({ ok: false, error: "Telegram update could not be processed" }, { status: 500 });
    }

    if (result.skipped && result.reason === "no_workspace") {
      console.warn("Telegram webhook skipped without workspace mapping", {
        reason: result.reason,
        error: result.error,
      });
    }

    return Response.json({ ok: true, saved: result.saved, skipped: result.skipped });
  } catch {
    return Response.json({ ok: false, error: "Invalid Telegram webhook payload" }, { status: 400 });
  }
}
