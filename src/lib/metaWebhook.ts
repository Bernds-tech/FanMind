import {
  createMetaWebhookConversationMessage,
  createMetaWebhookDebugEvent,
  findMetaSocialConnectionByPageId,
  findMetaWebhookFallbackWorkspaceId,
  type ConversationMessageAttachment,
  type SocialConnectionRow,
} from "@/lib/supabase/server";
import { decryptToken } from "@/lib/facebookIntegration";
import { syncFacebookMessengerConversationForContact } from "@/app/channels/facebookWebhookActions";

export type MetaWebhookEvent = {
  eventType: "feed" | "feed_comment" | "messages" | "comments" | "unknown";
  messageType: "dm" | "comment";
  channelType:
    | "facebook_messages"
    | "facebook_comments"
    | "instagram_messages"
    | "instagram_comments";
  sourcePlatform: "facebook" | "instagram";
  content: string | null;
  attachments: ConversationMessageAttachment[] | null;
  messageKind:
    | "text"
    | "image"
    | "video"
    | "audio"
    | "file"
    | "mixed"
    | "unknown";
  direction: "inbound" | "outbound";
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
      const isEcho = Boolean(message?.is_echo) || Boolean(item.message_echoes);
      const attachments = extractMessengerAttachments(message);
      const content = text ?? getAttachmentFallbackText(attachments);
      const mid = stringValue(message?.mid);
      const rawSenderId = isRecord(item.sender)
        ? stringValue(item.sender.id)
        : null;
      const rawRecipientId = isRecord(item.recipient)
        ? stringValue(item.recipient.id)
        : null;
      const pageId = isEcho
        ? (rawSenderId ?? entryPageId)
        : (rawRecipientId ?? entryPageId);
      const senderId = isEcho ? rawRecipientId : rawSenderId;

      const isInstagram = isInstagramMessagingItem(item, payload);
      events.push({
        eventType: "messages",
        messageType: "dm",
        channelType: isInstagram ? "instagram_messages" : "facebook_messages",
        sourcePlatform: isInstagram ? "instagram" : "facebook",
        content,
        attachments,
        messageKind: getMessageKind(text, attachments),
        direction: isEcho ? "outbound" : "inbound",
        externalMessageId: mid,
        externalThreadId:
          senderId && pageId ? `${pageId}:${senderId}` : senderId,
        externalPostId: null,
        externalCommentId: null,
        sourceUrl: validUrl(
          stringValue(message?.link) ?? stringValue(message?.url),
        ),
        replyTargetUrl: validUrl(
          stringValue(message?.link) ?? stringValue(message?.url),
        ),
        authorLabel: isEcho
          ? "Page"
          : ((isRecord(item.sender)
              ? stringValue(item.sender.username)
              : null) ??
            (senderId
              ? `${isInstagram ? "Instagram Nutzer" : "Facebook Nutzer"} ${senderId}`
              : isInstagram
                ? "Instagram Nutzer"
                : "Facebook Nutzer")),
        pageId,
        senderId,
        recipientId: isEcho ? rawSenderId : pageId,
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
      const content =
        stringValue(value?.message) ??
        stringValue(value?.comment_message) ??
        stringValue(value?.text) ??
        stringValue(value?.caption);
      const commentId =
        stringValue(value?.comment_id) ?? stringValue(value?.id);
      const permalink = validUrl(
        stringValue(value?.permalink_url) ??
          stringValue(value?.link) ??
          (isRecord(value?.media) ? stringValue(value.media.permalink) : null),
      );
      const postId =
        stringValue(value?.post_id) ??
        stringValue(value?.media_id) ??
        (isRecord(value?.media) ? stringValue(value.media.id) : null) ??
        stringValue(value?.parent_id);
      const from = isRecord(value?.from) ? value.from : undefined;
      const senderId =
        stringValue(value?.from_id) ??
        stringValue(value?.sender_id) ??
        stringValue(from?.id);
      const senderName =
        stringValue(value?.from_name) ??
        stringValue(value?.sender_name) ??
        stringValue(from?.username) ??
        stringValue(from?.name) ??
        stringValue(value?.username);
      const isFeedField =
        field === "feed" || field === "comments" || field === "mentions";
      const isCommentItem =
        item === "comment" || Boolean(commentId) || field === "comments";
      const eventType =
        isInstagram && isCommentItem
          ? "comments"
          : isFeedField
            ? isCommentItem
              ? "feed_comment"
              : "feed"
            : "unknown";

      events.push({
        eventType,
        messageType: "comment",
        channelType: isInstagram ? "instagram_comments" : "facebook_comments",
        sourcePlatform: isInstagram ? "instagram" : "facebook",
        content,
        attachments: null,
        messageKind: "text",
        direction: "inbound",
        externalMessageId: commentId,
        externalThreadId: postId ?? permalink ?? commentId,
        externalPostId: postId,
        externalCommentId: commentId,
        sourceUrl: permalink,
        replyTargetUrl: permalink,
        authorLabel:
          senderName ?? (isInstagram ? "Instagram Nutzer" : "Facebook Nutzer"),
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
      ? await findMetaSocialConnectionByPageId(
          event.sourcePlatform,
          event.pageId,
        )
      : { connection: null, error: null };

    if (connection.error) firstError ??= connection.error.message;

    if (!connection.connection) {
      const fallbackWorkspace = await findMetaWebhookFallbackWorkspaceId();
      if (fallbackWorkspace.error)
        firstError ??= fallbackWorkspace.error.message;

      const debugResult = await createMetaWebhookDebugEvent({
        workspaceId: fallbackWorkspace.workspaceId,
        platform: event.sourcePlatform,
        eventType: event.eventType,
        pageId: event.pageId,
        senderId: event.senderId,
        recipientId: event.recipientId,
        messageText: formatDebugMessageText(event),
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

    if (
      connection.connection &&
      event.eventType === "messages" &&
      event.sourcePlatform === "facebook" &&
      event.direction === "inbound" &&
      event.senderId
    ) {
      const profile = await fetchFacebookMessengerProfile(
        event.senderId,
        connection.connection,
      );
      if (profile.displayName) event.authorLabel = profile.displayName;
    }

    let status =
      event.eventType === "feed" || event.eventType === "feed_comment"
        ? "stored"
        : "received";
    let errorReason: string | null = null;
    let messageId: string | null = null;

    if (
      event.eventType === "messages" ||
      event.eventType === "feed" ||
      event.eventType === "feed_comment" ||
      event.eventType === "comments"
    ) {
      if (event.content) {
        const result = await createMetaWebhookConversationMessage({
          workspaceId: connection.connection.workspace_id,
          senderId: event.senderId,
          content: event.content,
          sourcePlatform: event.sourcePlatform,
          messageType:
            event.eventType === "feed" ||
            event.eventType === "feed_comment" ||
            event.eventType === "comments"
              ? "comment"
              : event.messageType,
          sourceType: event.channelType,
          sourceUrl: event.sourceUrl,
          replyTargetUrl: event.replyTargetUrl,
          externalMessageId: event.externalMessageId,
          externalThreadId: event.externalThreadId,
          externalPostId: event.externalPostId,
          externalCommentId: event.externalCommentId,
          originalTextExcerpt: event.content,
          authorLabel:
            event.direction === "outbound"
              ? (connection.connection.page_name ?? event.authorLabel)
              : event.authorLabel,
          direction: event.direction,
          attachments: event.attachments,
          messageKind: event.messageKind,
        });
        if (result.error) {
          status = "error";
          errorReason = result.error.message;
          firstError ??= result.error.message;
        } else {
          status =
            event.eventType === "feed" || event.eventType === "feed_comment"
              ? "feed_comment_stored"
              : "stored";
          messageId = result.message?.id ?? null;
          saved += 1;

          if (
            event.eventType === "messages" &&
            event.sourcePlatform === "facebook" &&
            event.direction === "inbound" &&
            event.senderId
          ) {
            const syncResult =
              await syncFacebookMessengerConversationForContact({
                connection: connection.connection,
                contactId: result.message?.contact_id ?? null,
                fanSenderId: event.senderId,
              });
            if (!syncResult.ok && syncResult.error)
              firstError ??= syncResult.error;
          }
        }
      } else {
        status = "ignored";
        errorReason =
          event.eventType === "feed" || event.eventType === "feed_comment"
            ? "Feed/comment-Event ohne Kommentartext."
            : "Message-Event ohne Nachrichtentext.";
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
      messageText: formatDebugMessageText(event),
      rawPayload: event.rawEvent,
      status: formatDebugStatus(status, event),
      errorReason,
      messageId,
      receivedAt,
    });
    if (debugResult.error) firstError ??= debugResult.error.message;
  }

  return {
    received: true,
    saved: saved > 0,
    skipped: skipped > 0,
    eventCount: events.length,
    error: firstError,
  };
}

function unknownEvent(
  pageId: string | null,
  senderId: string | null,
  rawEvent: unknown,
): MetaWebhookEvent {
  return {
    eventType: "unknown",
    messageType: "comment",
    channelType: "facebook_comments",
    sourcePlatform: "facebook",
    content: null,
    attachments: null,
    messageKind: "text",
    externalMessageId: null,
    externalThreadId: null,
    externalPostId: null,
    externalCommentId: null,
    sourceUrl: null,
    replyTargetUrl: null,
    authorLabel: "Facebook Nutzer",
    pageId,
    senderId,
    recipientId: pageId,
    rawEvent,
    direction: "inbound",
  };
}

function isInstagramMessagingItem(
  item: Record<string, unknown>,
  payload: Record<string, unknown>,
): boolean {
  return (
    stringValue(payload.object) === "instagram" ||
    stringValue(item.object) === "instagram" ||
    Boolean(
      isRecord(item.message) &&
      (item.message.attachments || item.message.is_echo === false) &&
      (item.sender as Record<string, unknown> | undefined)?.username,
    )
  );
}

function isInstagramChange(
  change: Record<string, unknown>,
  payload: Record<string, unknown>,
): boolean {
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

type FacebookMessengerProfile = {
  displayName: string | null;
};

async function fetchFacebookMessengerProfile(
  psid: string,
  connection: SocialConnectionRow,
): Promise<FacebookMessengerProfile> {
  const encryptedToken = connection.page_access_token_encrypted;
  const pageToken = encryptedToken ? decryptToken(encryptedToken) : null;

  if (!pageToken) return { displayName: null };

  try {
    const url = new URL(
      `https://graph.facebook.com/v20.0/${encodeURIComponent(psid)}`,
    );
    url.searchParams.set("fields", "first_name,last_name,name");
    url.searchParams.set("access_token", pageToken);

    const response = await fetch(url.toString(), { cache: "no-store" });
    if (!response.ok) return { displayName: null };

    const profile = await response.json();
    if (!isRecord(profile)) return { displayName: null };

    const firstName = stringValue(profile.first_name);
    const lastName = stringValue(profile.last_name);
    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
    return { displayName: fullName || stringValue(profile.name) };
  } catch {
    return { displayName: null };
  }
}

function extractMessengerAttachments(
  message: Record<string, unknown> | undefined,
): ConversationMessageAttachment[] | null {
  const rawAttachments = Array.isArray(message?.attachments)
    ? message.attachments
    : [];
  const attachments = rawAttachments.filter(isRecord).map((attachment) => {
    const payload = isRecord(attachment.payload)
      ? attachment.payload
      : undefined;
    const url = validUrl(stringValue(payload?.url));
    return {
      type: normalizeMessengerAttachmentType(stringValue(attachment.type)),
      ...(url ? { url } : {}),
      ...(stringValue(payload?.sticker_id)
        ? { sticker_id: stringValue(payload?.sticker_id)! }
        : {}),
      ...(stringValue(attachment.title)
        ? { title: stringValue(attachment.title)! }
        : {}),
      ...(stringValue(attachment.name)
        ? { name: stringValue(attachment.name)! }
        : {}),
      ...(stringValue(attachment.mime_type)
        ? { mime_type: stringValue(attachment.mime_type)! }
        : {}),
      ...(numberValue(attachment.size)
        ? { size: numberValue(attachment.size)! }
        : {}),
    } satisfies ConversationMessageAttachment;
  });

  return attachments.length ? attachments : null;
}

function normalizeMessengerAttachmentType(
  type: string | null,
): ConversationMessageAttachment["type"] {
  if (
    type === "image" ||
    type === "video" ||
    type === "audio" ||
    type === "file"
  )
    return type;
  return "unknown";
}

function getAttachmentFallbackText(
  attachments: ConversationMessageAttachment[] | null,
): string | null {
  const firstType = attachments?.[0]?.type;
  if (!firstType) return null;
  return {
    image: "Bild empfangen",
    video: "Video empfangen",
    audio: "Audio empfangen",
    file: "Datei empfangen",
    unknown: "Anhang empfangen",
  }[firstType];
}

function getMessageKind(
  text: string | null,
  attachments: ConversationMessageAttachment[] | null,
): MetaWebhookEvent["messageKind"] {
  if (text && attachments?.length) return "mixed";
  if (!attachments?.length) return "text";
  const types = Array.from(
    new Set(attachments.map((attachment) => attachment.type)),
  );
  return types.length === 1 ? types[0] : "mixed";
}

function formatDebugStatus(status: string, event: MetaWebhookEvent): string {
  const directionLabel =
    event.direction === "outbound"
      ? "message_echoes · outbound"
      : "messages · inbound";
  const baseStatus =
    event.eventType === "messages" ? `${directionLabel} · ${status}` : status;
  if (!event.attachments?.length) return baseStatus;
  return `${baseStatus} · Attachment: ${event.attachments.map((attachment) => attachment.type).join(", ")} · Text: ${event.content ?? "Anhang empfangen"}`;
}

function formatDebugMessageText(event: MetaWebhookEvent): string | null {
  const directionLabel =
    event.eventType === "messages"
      ? `${event.direction === "outbound" ? "message_echoes / outbound" : "messages / inbound"}: `
      : "";
  if (!event.attachments?.length)
    return event.content ? `${directionLabel}${event.content}` : null;
  return `${directionLabel}Attachment: ${event.attachments.map((attachment) => attachment.type).join(", ")} · Text: ${event.content ?? "Anhang empfangen"}`;
}

function numberValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
