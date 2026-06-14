import {
  createFacebookWebhookConversationMessage,
  createMetaWebhookDebugEvent,
  findFacebookSocialConnectionByPageId,
  findMetaWebhookFallbackWorkspaceId,
} from "@/lib/supabase/server";

export type MetaWebhookEvent = {
  eventType: "feed" | "messages" | "unknown";
  messageType: "dm" | "comment";
  content: string | null;
  externalMessageId: string | null;
  externalThreadId: string | null;
  sourceUrl: string | null;
  replyTargetUrl: string | null;
  authorLabel: string;
  pageId: string | null;
  senderId: string | null;
  recipientId: string | null;
  rawEvent: unknown;
};

export type MetaWebhookProcessResult = {
  received: boolean;
  saved: boolean;
  skipped: boolean;
  eventCount: number;
  error?: string;
};

export function extractMetaWebhookEvents(payload: unknown): MetaWebhookEvent[] {
  if (!isRecord(payload)) return [unknownEvent(null, null, payload)];
  const entries = Array.isArray(payload.entry) ? payload.entry : [];
  const events: MetaWebhookEvent[] = [];

  for (const entry of entries) {
    if (!isRecord(entry)) continue;
    const entryPageId = stringValue(entry.id);
    const messaging = Array.isArray(entry.messaging) ? entry.messaging : [];

    for (const item of messaging) {
      if (!isRecord(item)) continue;
      const message = isRecord(item.message) ? item.message : undefined;
      const text = stringValue(message?.text);
      const mid = stringValue(message?.mid);
      const senderId = isRecord(item.sender) ? stringValue(item.sender.id) : null;
      const pageId = isRecord(item.recipient)
        ? stringValue(item.recipient.id)
        : entryPageId;

      events.push({
        eventType: "messages",
        messageType: "dm",
        content: text,
        externalMessageId: mid,
        externalThreadId: senderId,
        sourceUrl: pageId ? `https://www.facebook.com/${pageId}` : null,
        replyTargetUrl: pageId ? `https://www.facebook.com/${pageId}` : null,
        authorLabel: senderId ? `Facebook Nutzer ${senderId}` : "Facebook Nutzer",
        pageId,
        senderId,
        recipientId: pageId,
        rawEvent: item,
      });
    }

    const changes = Array.isArray(entry.changes) ? entry.changes : [];

    for (const change of changes) {
      if (!isRecord(change)) continue;
      const value = isRecord(change.value) ? change.value : undefined;
      const field = stringValue(change.field);
      const item = stringValue(value?.item) ?? field;
      const content = stringValue(value?.message) ?? stringValue(value?.verb);
      const commentId = stringValue(value?.comment_id) ?? stringValue(value?.id);
      const permalink = stringValue(value?.permalink_url);
      const postId = stringValue(value?.post_id);
      const senderId = stringValue(value?.from_id) ?? stringValue(value?.sender_id);
      const eventType = field === "feed" || field === "comments" ? "feed" : "unknown";

      events.push({
        eventType,
        messageType: item === "comment" || field === "comments" ? "comment" : "comment",
        content,
        externalMessageId: commentId,
        externalThreadId: postId ?? permalink ?? commentId,
        sourceUrl: permalink ?? (postId ? `https://www.facebook.com/${postId}` : null),
        replyTargetUrl: permalink ?? (postId ? `https://www.facebook.com/${postId}` : null),
        authorLabel:
          stringValue(value?.from_name) ?? stringValue(value?.sender_name) ?? "Facebook Nutzer",
        pageId: entryPageId,
        senderId,
        recipientId: entryPageId,
        rawEvent: change,
      });
    }
  }

  return events.length ? events : [unknownEvent(null, null, payload)];
}

export async function processMetaWebhookPayload(
  payload: unknown,
): Promise<MetaWebhookProcessResult> {
  const events = extractMetaWebhookEvents(payload);
  let saved = 0;
  let skipped = 0;
  let firstError: string | undefined;

  for (const event of events) {
    const receivedAt = new Date().toISOString();
    const connection = event.pageId
      ? await findFacebookSocialConnectionByPageId(event.pageId)
      : { connection: null, error: null };

    if (connection.error) firstError ??= connection.error.message;

    if (!connection.connection) {
      const fallbackWorkspace = await findMetaWebhookFallbackWorkspaceId();
      if (fallbackWorkspace.error) firstError ??= fallbackWorkspace.error.message;

      const debugResult = await createMetaWebhookDebugEvent({
        workspaceId: fallbackWorkspace.workspaceId,
        eventType: event.eventType,
        pageId: event.pageId,
        senderId: event.senderId,
        recipientId: event.recipientId,
        messageText: event.content,
        rawPayload: event.rawEvent,
        status: event.pageId ? "ignored_unmapped_page" : "ignored",
        errorReason: event.pageId
          ? "Page-ID konnte keiner Facebook-Verbindung zugeordnet werden."
          : "Keine Page-ID im Meta-Event erkannt.",
        receivedAt,
      });
      if (debugResult.error) firstError ??= debugResult.error.message;
      skipped += 1;
      continue;
    }

    let status = event.eventType === "feed" ? "stored" : "received";
    let errorReason: string | null = null;
    let messageId: string | null = null;

    if (event.eventType === "messages") {
      if (event.content) {
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
          status = "error";
          errorReason = result.error.message;
          firstError ??= result.error.message;
        } else {
          status = "stored";
          messageId = result.message?.id ?? null;
          saved += 1;
        }
      } else {
        status = "ignored";
        errorReason = "Message-Event ohne Nachrichtentext.";
        skipped += 1;
      }
    } else if (event.eventType === "feed") {
      saved += 1;
    } else {
      status = "ignored";
      errorReason = "Unbekannter Meta-Event-Typ.";
      skipped += 1;
    }

    const debugResult = await createMetaWebhookDebugEvent({
      workspaceId: connection.connection.workspace_id,
      socialConnectionId: connection.connection.id,
      eventType: event.eventType,
      pageId: event.pageId,
      senderId: event.senderId,
      recipientId: event.recipientId,
      messageText: event.content,
      rawPayload: event.rawEvent,
      status,
      errorReason,
      messageId,
      receivedAt,
    });
    if (debugResult.error) firstError ??= debugResult.error.message;
  }

  return { received: true, saved: saved > 0, skipped: skipped > 0, eventCount: events.length, error: firstError };
}

function unknownEvent(pageId: string | null, senderId: string | null, rawEvent: unknown): MetaWebhookEvent {
  return { eventType: "unknown", messageType: "comment", content: null, externalMessageId: null, externalThreadId: null, sourceUrl: null, replyTargetUrl: null, authorLabel: "Facebook Nutzer", pageId, senderId, recipientId: pageId, rawEvent };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
