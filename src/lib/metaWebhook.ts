import {
  createFacebookWebhookConversationMessage,
  createMetaTestConversationMessage,
  findFacebookSocialConnectionByPageId,
} from "@/lib/supabase/server";

export type MetaWebhookEvent = {
  messageType: "dm" | "comment";
  content: string;
  externalMessageId: string | null;
  externalThreadId: string | null;
  sourceUrl: string | null;
  replyTargetUrl: string | null;
  authorLabel: string;
  pageId: string | null;
  senderId: string | null;
};

export type MetaWebhookProcessResult = {
  received: boolean;
  saved: boolean;
  skipped: boolean;
  eventCount: number;
  error?: string;
};

export function extractMetaWebhookEvents(payload: unknown): MetaWebhookEvent[] {
  if (!isRecord(payload)) return [];
  const entries = Array.isArray(payload.entry) ? payload.entry : [];
  const events: MetaWebhookEvent[] = [];

  for (const entry of entries) {
    if (!isRecord(entry)) continue;
    const messaging = Array.isArray(entry.messaging) ? entry.messaging : [];

    for (const item of messaging) {
      if (!isRecord(item)) continue;
      const message = isRecord(item.message) ? item.message : undefined;
      const text = stringValue(message?.text);
      const mid = stringValue(message?.mid);
      const senderId = isRecord(item.sender)
        ? stringValue(item.sender.id)
        : null;
      const pageId = isRecord(item.recipient)
        ? stringValue(item.recipient.id)
        : stringValue(entry.id);

      events.push({
        messageType: "dm",
        content: text ?? "Facebook Messenger Event ohne Nachrichtentext",
        externalMessageId: mid,
        externalThreadId: senderId,
        sourceUrl: pageId ? `https://www.facebook.com/${pageId}` : null,
        replyTargetUrl: pageId ? `https://www.facebook.com/${pageId}` : null,
        authorLabel: senderId
          ? `Facebook Nutzer ${senderId}`
          : "Facebook Nutzer",
        pageId,
        senderId,
      });
    }

    const changes = Array.isArray(entry.changes) ? entry.changes : [];

    for (const change of changes) {
      if (!isRecord(change)) continue;
      const value = isRecord(change.value) ? change.value : undefined;
      const item = stringValue(value?.item) ?? stringValue(change.field);
      const isComment =
        item === "comment" || stringValue(change.field) === "comments";

      if (!isComment) continue;

      const content =
        stringValue(value?.message) ??
        stringValue(value?.verb) ??
        "Facebook Page Kommentar-Event ohne Nachrichtentext";
      const commentId =
        stringValue(value?.comment_id) ?? stringValue(value?.id);
      const permalink = stringValue(value?.permalink_url);
      const postId = stringValue(value?.post_id);

      const pageId = stringValue(entry.id);
      const senderId =
        stringValue(value?.from_id) ?? stringValue(value?.sender_id);

      events.push({
        messageType: "comment",
        content,
        externalMessageId: commentId,
        externalThreadId: postId ?? permalink ?? commentId,
        sourceUrl: permalink,
        replyTargetUrl: permalink,
        authorLabel:
          stringValue(value?.from_name) ??
          stringValue(value?.sender_name) ??
          "Facebook Nutzer",
        pageId,
        senderId,
      });

      if (!permalink && postId) {
        events[events.length - 1].sourceUrl =
          `https://www.facebook.com/${postId}`;
        events[events.length - 1].replyTargetUrl =
          `https://www.facebook.com/${postId}`;
      }
    }
  }

  return events;
}

export async function processMetaWebhookPayload(
  payload: unknown,
): Promise<MetaWebhookProcessResult> {
  const events = extractMetaWebhookEvents(payload);

  if (events.length === 0) {
    return { received: true, saved: false, skipped: true, eventCount: 0 };
  }

  let saved = 0;
  let skipped = 0;

  for (const event of events) {
    const connection = event.pageId
      ? await findFacebookSocialConnectionByPageId(event.pageId)
      : { connection: null, error: null };

    if (connection.error) {
      return {
        received: true,
        saved: saved > 0,
        skipped: skipped > 0,
        eventCount: events.length,
        error: connection.error.message,
      };
    }

    if (!connection.connection) {
      const fallbackResult = await tryLocalDevFallback(event);
      if (fallbackResult === "saved") {
        saved += 1;
      } else {
        skipped += 1;
      }
      continue;
    }

    const result = await createFacebookWebhookConversationMessage({
      workspaceId: connection.connection.workspace_id,
      senderId: event.senderId,
      content: event.content,
      messageType: event.messageType,
      sourceUrl: event.sourceUrl,
      replyTargetUrl: event.replyTargetUrl,
      externalMessageId: event.externalMessageId,
      externalThreadId: event.externalThreadId,
      authorLabel: event.authorLabel,
    });

    if (result.error) {
      return {
        received: true,
        saved: saved > 0,
        skipped: skipped > 0,
        eventCount: events.length,
        error: result.error.message,
      };
    }

    saved += 1;
  }

  return {
    received: true,
    saved: saved > 0,
    skipped: skipped > 0,
    eventCount: events.length,
  };
}

async function tryLocalDevFallback(
  event: MetaWebhookEvent,
): Promise<"saved" | "skipped"> {
  if (process.env.NODE_ENV === "production") return "skipped";

  const workspaceId = process.env.FANMIND_DEFAULT_WORKSPACE_ID_FOR_META_TEST;
  const contactId = process.env.FANMIND_DEFAULT_CONTACT_ID_FOR_META_TEST;
  if (!workspaceId || !contactId) return "skipped";

  const result = await createMetaTestConversationMessage({
    workspaceId,
    contactId,
    content: event.content,
    messageType: event.messageType,
    sourceUrl: event.sourceUrl,
    replyTargetUrl: event.replyTargetUrl,
    externalMessageId: event.externalMessageId,
    externalThreadId: event.externalThreadId,
    authorLabel: event.authorLabel,
  });

  return result.error ? "skipped" : "saved";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
