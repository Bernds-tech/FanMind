import { createMetaWebhookConversationMessage } from "@/lib/supabase/server";

export type WhatsAppWebhookEvent = {
  sourcePlatform: "whatsapp";
  sourceType: "whatsapp_messages";
  content: string | null;
  externalMessageId: string | null;
  externalThreadId: string | null;
  sourceUrl: string | null;
  replyTargetUrl: string | null;
  authorLabel: string;
  phoneNumberId: string | null;
  senderId: string | null;
  receivedAt: string | null;
  rawEvent: unknown;
};

export function extractWhatsAppWebhookEvents(payload: unknown): WhatsAppWebhookEvent[] {
  if (!isRecord(payload)) return [];
  const entries = Array.isArray(payload.entry) ? payload.entry : [];
  const events: WhatsAppWebhookEvent[] = [];

  for (const entry of entries) {
    if (!isRecord(entry)) continue;
    const changes = Array.isArray(entry.changes) ? entry.changes : [];

    for (const change of changes) {
      if (!isRecord(change)) continue;
      const value = isRecord(change.value) ? change.value : undefined;
      if (!value || stringValue(value.messaging_product) !== "whatsapp") continue;

      const metadata = isRecord(value.metadata) ? value.metadata : undefined;
      const phoneNumberId = stringValue(metadata?.phone_number_id) ?? stringValue(metadata?.display_phone_number);
      const contacts = Array.isArray(value.contacts) ? value.contacts.filter(isRecord) : [];
      const messages = Array.isArray(value.messages) ? value.messages.filter(isRecord) : [];

      for (const message of messages) {
        const senderId = stringValue(message.from) ?? stringValue(contacts[0]?.wa_id);
        const contact = contacts.find((item) => stringValue(item.wa_id) === senderId) ?? contacts[0];
        const profile = isRecord(contact?.profile) ? contact.profile : undefined;
        const profileName = stringValue(profile?.name);
        const text = extractMessageText(message);
        const url = validUrl(stringValue(message.context_url) ?? stringValue(message.url) ?? stringValue(message.link));

        events.push({
          sourcePlatform: "whatsapp",
          sourceType: "whatsapp_messages",
          content: text,
          externalMessageId: stringValue(message.id),
          externalThreadId: phoneNumberId && senderId ? `${phoneNumberId}:${senderId}` : senderId,
          sourceUrl: url,
          replyTargetUrl: url,
          authorLabel: profileName ?? (senderId ? `WhatsApp Kontakt ${senderId}` : "WhatsApp Kontakt"),
          phoneNumberId,
          senderId,
          receivedAt: stringValue(message.timestamp),
          rawEvent: message,
        });
      }
    }
  }

  return events;
}

export async function processWhatsAppWebhookPayload(input: {
  workspaceId: string;
  payload: unknown;
}) {
  const events = extractWhatsAppWebhookEvents(input.payload);
  let saved = 0;
  let skipped = 0;
  let firstError: string | undefined;

  for (const event of events) {
    if (!event.content) {
      skipped += 1;
      continue;
    }

    const result = await createMetaWebhookConversationMessage({
      workspaceId: input.workspaceId,
      senderId: event.senderId,
      sourcePlatform: "whatsapp",
      authorLabel: event.authorLabel,
      content: event.content,
      messageType: "dm",
      sourceType: "whatsapp_messages",
      sourceUrl: event.sourceUrl,
      replyTargetUrl: event.replyTargetUrl,
      externalMessageId: event.externalMessageId,
      externalThreadId: event.externalThreadId,
      originalAuthorLabel: event.authorLabel,
      originalTextExcerpt: event.content,
      receivedAt: event.receivedAt,
    });

    if (result.error) firstError ??= result.error.message;
    else saved += 1;
  }

  return { received: true, saved: saved > 0, skipped: skipped > 0, eventCount: events.length, error: firstError };
}

function extractMessageText(message: Record<string, unknown>): string | null {
  const text = isRecord(message.text) ? stringValue(message.text.body) : null;
  return text ?? stringValue(message.body) ?? stringValue(message.caption);
}

function validUrl(value: string | null): string | null {
  return value && /^https?:\/\//i.test(value) ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stringValue(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
