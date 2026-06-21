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
      return Response.json({ ok: false, error: "Telegram update could not be processed" }, { status: 500 });
    }

    return Response.json({ ok: true, saved: result.saved, skipped: result.skipped });
  } catch {
    return Response.json({ ok: false, error: "Invalid Telegram webhook payload" }, { status: 400 });
  }
}
