import {
  createMetaWebhookConversationMessage,
  createMetaWebhookDebugEvent,
  findMetaSocialConnectionByPageId,
  findMetaWebhookFallbackWorkspaceId,
} from "@/lib/supabase/server";

export type MetaWebhookEvent = {
  eventType: "feed" | "feed_comment" | "messages" | "comments" | "unknown";
  messageType: "dm" | "comment";
  channelType: "facebook_messages" | "facebook_comments" | "instagram_messages" | "instagram_comments";
  sourcePlatform: "facebook" | "instagram";
  content: string | null;
  externalMessageId: string | null;
  externalThreadId: string | null;
  externalPostId: string | null;
  externalCommentId: string | null;
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

      const isInstagram = isInstagramMessagingItem(item, payload);
      events.push({
        eventType: "messages",
        messageType: "dm",
        channelType: isInstagram ? "instagram_messages" : "facebook_messages",
        sourcePlatform: isInstagram ? "instagram" : "facebook",
        content: text,
        externalMessageId: mid,
        externalThreadId: senderId && pageId ? `${pageId}:${senderId}` : senderId,
        externalPostId: null,
        externalCommentId: null,
        sourceUrl: validUrl(stringValue(message?.link) ?? stringValue(message?.url)),
        replyTargetUrl: validUrl(stringValue(message?.link) ?? stringValue(message?.url)),
        authorLabel: (isRecord(item.sender) ? stringValue(item.sender.username) : null) ?? (senderId ? `${isInstagram ? "Instagram Nutzer" : "Facebook Nutzer"} ${senderId}` : (isInstagram ? "Instagram Nutzer" : "Facebook Nutzer")),
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
      const isInstagram = isInstagramChange(change, payload);
      const content = stringValue(value?.message) ?? stringValue(value?.comment_message) ?? stringValue(value?.text) ?? stringValue(value?.caption);
      const commentId = stringValue(value?.comment_id) ?? stringValue(value?.id);
      const permalink = validUrl(stringValue(value?.permalink_url) ?? stringValue(value?.link) ?? (isRecord(value?.media) ? stringValue(value.media.permalink) : null));
      const postId = stringValue(value?.post_id) ?? stringValue(value?.media_id) ?? (isRecord(value?.media) ? stringValue(value.media.id) : null) ?? stringValue(value?.parent_id);
      const from = isRecord(value?.from) ? value.from : undefined;
      const senderId = stringValue(value?.from_id) ?? stringValue(value?.sender_id) ?? stringValue(from?.id);
      const senderName = stringValue(value?.from_name) ?? stringValue(value?.sender_name) ?? stringValue(from?.username) ?? stringValue(from?.name) ?? stringValue(value?.username);
      const isFeedField = field === "feed" || field === "comments" || field === "mentions";
      const isCommentItem = item === "comment" || Boolean(commentId) || field === "comments";
      const eventType = isInstagram && isCommentItem ? "comments" : isFeedField ? (isCommentItem ? "feed_comment" : "feed") : "unknown";

      events.push({
        eventType,
        messageType: "comment",
        channelType: isInstagram ? "instagram_comments" : "facebook_comments",
        sourcePlatform: isInstagram ? "instagram" : "facebook",
        content,
        externalMessageId: commentId,
        externalThreadId: postId ?? permalink ?? commentId,
        externalPostId: postId,
        externalCommentId: commentId,
        sourceUrl: permalink,
        replyTargetUrl: permalink,
        authorLabel: senderName ?? (isInstagram ? "Instagram Nutzer" : "Facebook Nutzer"),
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
      ? await findMetaSocialConnectionByPageId(event.sourcePlatform, event.pageId)
      : { connection: null, error: null };

    if (connection.error) firstError ??= connection.error.message;

    if (!connection.connection) {
      const fallbackWorkspace = await findMetaWebhookFallbackWorkspaceId();
      if (fallbackWorkspace.error) firstError ??= fallbackWorkspace.error.message;

      const debugResult = await createMetaWebhookDebugEvent({
        workspaceId: fallbackWorkspace.workspaceId,
        platform: event.sourcePlatform,
        eventType: event.eventType,
        pageId: event.pageId,
        senderId: event.senderId,
        recipientId: event.recipientId,
        messageText: event.content,
        rawPayload: event.rawEvent,
        status: event.pageId ? "ignored_unmapped_page" : "ignored",
        errorReason: event.pageId
          ? "Page-ID konnte keiner Meta-Verbindung zugeordnet werden."
          : "Keine Page-ID im Meta-Event erkannt.",
        receivedAt,
      });
      if (debugResult.error) firstError ??= debugResult.error.message;
      skipped += 1;
      continue;
    }

    let status = event.eventType === "feed" || event.eventType === "feed_comment" ? "stored" : "received";
    let errorReason: string | null = null;
    let messageId: string | null = null;

    if (event.eventType === "messages" || event.eventType === "feed" || event.eventType === "feed_comment" || event.eventType === "comments") {
      if (event.content) {
        const result = await createMetaWebhookConversationMessage({
          workspaceId: connection.connection.workspace_id,
          senderId: event.senderId,
          content: event.content,
          sourcePlatform: event.sourcePlatform,
          messageType: event.eventType === "feed" || event.eventType === "feed_comment" || event.eventType === "comments" ? "comment" : event.messageType,
          sourceType: event.channelType,
          sourceUrl: event.sourceUrl,
          replyTargetUrl: event.replyTargetUrl,
          externalMessageId: event.externalMessageId,
          externalThreadId: event.externalThreadId,
          externalPostId: event.externalPostId,
          externalCommentId: event.externalCommentId,
          originalTextExcerpt: event.content,
          authorLabel: event.authorLabel,
        });
        if (result.error) {
          status = "error";
          errorReason = result.error.message;
          firstError ??= result.error.message;
        } else {
          status = event.eventType === "feed" || event.eventType === "feed_comment" ? "feed_comment_stored" : "stored";
          messageId = result.message?.id ?? null;
          saved += 1;
        }
      } else {
        status = "ignored";
        errorReason = event.eventType === "feed" || event.eventType === "feed_comment" ? "Feed/comment-Event ohne Kommentartext." : "Message-Event ohne Nachrichtentext.";
        skipped += 1;
      }
    } else {
      status = "ignored";
      errorReason = "Unbekannter Meta-Event-Typ.";
      skipped += 1;
    }

    const debugResult = await createMetaWebhookDebugEvent({
      workspaceId: connection.connection.workspace_id,
      platform: event.sourcePlatform,
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
  return { eventType: "unknown", messageType: "comment", channelType: "facebook_comments", sourcePlatform: "facebook", content: null, externalMessageId: null, externalThreadId: null, externalPostId: null, externalCommentId: null, sourceUrl: null, replyTargetUrl: null, authorLabel: "Facebook Nutzer", pageId, senderId, recipientId: pageId, rawEvent };
}

function isInstagramMessagingItem(item: Record<string, unknown>, payload: Record<string, unknown>): boolean {
  return stringValue(payload.object) === "instagram" || stringValue(item.object) === "instagram" || Boolean(isRecord(item.message) && (item.message.attachments || item.message.is_echo === false) && (item.sender as Record<string, unknown> | undefined)?.username);
}

function isInstagramChange(change: Record<string, unknown>, payload: Record<string, unknown>): boolean {
  const value = isRecord(change.value) ? change.value : undefined;
  return (
    stringValue(payload.object) === "instagram" ||
    stringValue(value?.object) === "instagram" ||
    Boolean(value?.media_id) ||
    Boolean(isRecord(value?.media))
  );
}

function validUrl(value: string | null): string | null {
  return value && /^https?:\/\//i.test(value) ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
