"use server";

import { revalidatePath } from "next/cache";
import {
  buildAttachmentFallbackText,
  getMessageKindFromAttachments,
} from "@/lib/messageAttachments";
import {
  createEmptySocialSyncResult,
  type SocialSyncResult,
} from "@/lib/socialSync";
import {
  decryptToken,
  FACEBOOK_GRAPH_API_VERSION,
  type FacebookConversationFieldProbe,
  type FacebookMessengerMessage,
  type FacebookMessageFieldProbe,
  type FacebookMessengerConversation,
  getFacebookGrantedScopeNames,
  fetchFacebookPagePostsWithComments,
  fetchFacebookMessengerConversationMessages,
  fetchFacebookMessengerConversations,
  probeFacebookMessengerConversationFieldSets,
  probeFacebookMessengerMessageFieldSet,
  FacebookCommentFetchError,
  fetchFacebookPageWebhookStatus,
  fetchFacebookTokenDiagnostics,
  hasFacebookCommentFeedScopes,
  hasFacebookPagesManageEngagementScope,
  hasFacebookPagesMessagingScope,
  hasFacebookPagesReadUserContentScope,
  subscribeFacebookPage,
  type FacebookPageWebhookStatus,
} from "@/lib/facebookIntegration";
import {
  getSupabaseServerUser,
  getUserWorkspaceDashboard,
  getWorkspaceSocialConnections,
  createMetaWebhookConversationMessage,
  updateFacebookCommentFetchStatus,
  updateFacebookMessengerSyncStatus,
  updateFacebookWebhookSubscribed,
  markContactInboundMessagesSeen,
  getWorkspaceContacts,
  type SocialConnectionRow,
} from "@/lib/supabase/server";
import {
  extractBusinessInboxUrlCandidates,
  extractSelectedItemIdFromMetaUrl,
} from "@/lib/sourceContext";

export type FacebookCommentFetchResult = {
  ok: boolean;
  fetchedAt: string;
  postsChecked: number;
  commentsChecked: number;
  importedCount: number;
  error?: string | null;
  endpointType?: string | null;
  usedPageAccessToken?: boolean;
  tokenScopes?: string[];
};

const FACEBOOK_MESSENGER_SYNC_MESSAGE_LIMIT = 50;
const FACEBOOK_MESSENGER_SYNC_CONVERSATION_LIMIT = 10;

export type FacebookMessengerSyncResult = SocialSyncResult & {
  syncedAt: string;
  conversationsChecked: number;
  error?: string | null;
};

export type FacebookPageWebhookActionResult = FacebookPageWebhookStatus & {
  updatedConnection: boolean;
  tokenScopes?: string[];
  pagesMessagingGranted?: boolean;
  commentFeedScopesGranted?: boolean;
  pagesReadUserContentGranted?: boolean;
  pagesManageEngagementGranted?: boolean;
};

export type FacebookDirectLinkSourceDiagnosis = {
  ok: boolean;
  graphApiVersion: string;
  pageIdConfigured: boolean;
  businessIdConfigured: boolean;
  sampledConversations: number;
  conversationLinkAvailable: number;
  conversationLinkWithDirectId: number;
  participantIdsAvailable: number;
  matchedConversationFound: boolean;
  matchedConversationHasDirectId: boolean;
  participantIdMatchesDirectId: boolean | null;
  conversationFieldsetStable: boolean;
  messageFieldsetStable: boolean;
  linkFieldsFound: boolean;
  businessInboxUrlFound: boolean;
  selectedItemIdRecognized: boolean;
  directLinkIdDetected: boolean;
  directLinkIdSource:
    | "conversation.link"
    | "message_field"
    | "share"
    | "attachment"
    | "stored_auto"
    | "not_detected";
  conversationFieldProbes: FacebookConversationFieldProbe[];
  messageFieldProbe: FacebookMessageFieldProbe | null;
  note: string;
};

export async function fetchFacebookCommentsNow(): Promise<FacebookCommentFetchResult> {
  const fetchedAt = new Date().toISOString();
  const { connection, error } = await getCurrentFacebookConnection();
  if (error || !connection) {
    return {
      ok: false,
      fetchedAt,
      postsChecked: 0,
      commentsChecked: 0,
      importedCount: 0,
      error: error ?? "Facebook-Verbindung fehlt.",
    };
  }

  const token = connection.page_access_token_encrypted
    ? decryptToken(connection.page_access_token_encrypted)
    : null;

  if (!connection.page_id || !token) {
    const message =
      "Page Access Token fehlt oder konnte nicht entschlüsselt werden.";
    await updateFacebookCommentFetchStatus(connection.id, {
      fetchedAt,
      importedCount: 0,
      error: message,
    });
    revalidatePath("/channels");
    return {
      ok: false,
      fetchedAt,
      postsChecked: 0,
      commentsChecked: 0,
      importedCount: 0,
      error: message,
    };
  }

  try {
    const tokenScopes = await getSafeTokenScopeNames(token);
    const { posts, comments, diagnostics } =
      await fetchFacebookPagePostsWithComments(connection.page_id, token);
    let importedCount = 0;

    for (const comment of comments) {
      if (!comment.message?.trim()) continue;
      const result = await createMetaWebhookConversationMessage({
        workspaceId: connection.workspace_id,
        sourcePlatform: "facebook",
        senderId: comment.from?.id ?? null,
        authorLabel: comment.from?.name ?? "Facebook Nutzer",
        content: comment.message,
        messageType: "comment",
        sourceType: "facebook_comments",
        sourceUrl:
          comment.permalink_url ??
          comment.postPermalinkUrl ??
          `https://www.facebook.com/${comment.postId}`,
        replyTargetUrl:
          comment.permalink_url ??
          comment.postPermalinkUrl ??
          `https://www.facebook.com/${comment.postId}`,
        externalMessageId: comment.id,
        externalThreadId: comment.postId,
      });
      if (result.error) throw result.error;
      if (result.conversation) importedCount += 1;
    }

    await updateFacebookCommentFetchStatus(connection.id, {
      fetchedAt,
      importedCount,
      error: null,
    });
    revalidatePath("/channels");
    revalidatePath("/inbox");
    return {
      ok: true,
      fetchedAt,
      postsChecked: posts.length,
      commentsChecked: comments.length,
      importedCount,
      error: null,
      endpointType: diagnostics.endpointType,
      usedPageAccessToken: diagnostics.usedPageAccessToken,
      tokenScopes,
    };
  } catch (fetchError) {
    const tokenScopes = await getSafeTokenScopeNames(token);
    const message =
      fetchError instanceof Error
        ? fetchError.message
        : "Facebook-Kommentarabruf fehlgeschlagen.";
    await updateFacebookCommentFetchStatus(connection.id, {
      fetchedAt,
      importedCount: 0,
      error: message,
    });
    revalidatePath("/channels");
    return {
      ok: false,
      fetchedAt,
      postsChecked: 0,
      commentsChecked: 0,
      importedCount: 0,
      error: message,
      endpointType:
        fetchError instanceof FacebookCommentFetchError
          ? fetchError.endpointType
          : null,
      usedPageAccessToken:
        fetchError instanceof FacebookCommentFetchError
          ? fetchError.usedPageAccessToken
          : true,
      tokenScopes,
    };
  }
}

export async function syncFacebookMessengerHistory(input?: {
  contactId?: string;
  markInboundSeen?: boolean;
  revalidate?: boolean;
}): Promise<FacebookMessengerSyncResult> {
  const syncedAt = new Date().toISOString();
  const { connection, error } = await getCurrentFacebookConnection();
  if (error || !connection)
    return syncError(syncedAt, error ?? "Facebook-Verbindung fehlt.");
  return syncFacebookMessengerHistoryForConnection(connection, {
    ...input,
    syncedAt,
    revalidate: input?.revalidate ?? true,
  });
}

export async function syncFacebookMessengerConversationForContact(input: {
  connection: SocialConnectionRow;
  contactId?: string | null;
  fanSenderId?: string | null;
  markInboundSeen?: boolean;
  revalidate?: boolean;
}): Promise<FacebookMessengerSyncResult> {
  return syncFacebookMessengerHistoryForConnection(input.connection, {
    contactId: input.contactId ?? undefined,
    fanSenderId: input.fanSenderId ?? undefined,
    markInboundSeen: input.markInboundSeen,
    revalidate: input.revalidate ?? true,
    syncedAt: new Date().toISOString(),
  });
}

export async function diagnoseFacebookDirectLinkSource(input: {
  connection: SocialConnectionRow;
  contactHandle?: string | null;
  limit?: number;
}): Promise<FacebookDirectLinkSourceDiagnosis> {
  const token = input.connection.page_access_token_encrypted
    ? decryptToken(input.connection.page_access_token_encrypted)
    : null;

  if (!input.connection.page_id || !token) {
    return {
      ok: false,
      graphApiVersion: FACEBOOK_GRAPH_API_VERSION,
      pageIdConfigured: Boolean(input.connection.page_id),
      businessIdConfigured: Boolean(
        process.env.META_BUSINESS_ID ?? process.env.NEXT_PUBLIC_META_BUSINESS_ID,
      ),
      sampledConversations: 0,
      conversationLinkAvailable: 0,
      conversationLinkWithDirectId: 0,
      participantIdsAvailable: 0,
      matchedConversationFound: false,
      matchedConversationHasDirectId: false,
      participantIdMatchesDirectId: null,
      conversationFieldsetStable: false,
      messageFieldsetStable: false,
      linkFieldsFound: false,
      businessInboxUrlFound: false,
      selectedItemIdRecognized: false,
      directLinkIdDetected: false,
      directLinkIdSource: "not_detected",
      conversationFieldProbes: [],
      messageFieldProbe: null,
      note: "Meta-Verbindung ist vorhanden, aber die Direktlink-Quelle konnte gerade nicht geprüft werden.",
    };
  }

  try {
    const limit = Math.max(1, Math.min(input.limit ?? 5, 10));
    const [conversations, conversationFieldProbes] = await Promise.all([
      fetchFacebookMessengerConversations(
        input.connection.page_id,
        token,
        limit,
      ),
      probeFacebookMessengerConversationFieldSets({
        pageId: input.connection.page_id,
        pageAccessToken: token,
        knownParticipantId: input.contactHandle ?? null,
        limit,
      }),
    ]);
    const messageFieldProbe = conversations[0]?.id
      ? await probeFacebookMessengerMessageFieldSet({
          conversationId: conversations[0].id,
          pageAccessToken: token,
          limit: 5,
        })
      : null;
    return summarizeFacebookDirectLinkDiagnosis({
      pageId: input.connection.page_id,
      businessId:
        process.env.META_BUSINESS_ID ?? process.env.NEXT_PUBLIC_META_BUSINESS_ID ?? null,
      contactHandle: input.contactHandle ?? null,
      conversations,
      conversationFieldProbes,
      messageFieldProbe,
    });
  } catch {
    return {
      ok: false,
      graphApiVersion: FACEBOOK_GRAPH_API_VERSION,
      pageIdConfigured: Boolean(input.connection.page_id),
      businessIdConfigured: Boolean(
        process.env.META_BUSINESS_ID ?? process.env.NEXT_PUBLIC_META_BUSINESS_ID,
      ),
      sampledConversations: 0,
      conversationLinkAvailable: 0,
      conversationLinkWithDirectId: 0,
      participantIdsAvailable: 0,
      matchedConversationFound: false,
      matchedConversationHasDirectId: false,
      participantIdMatchesDirectId: null,
      conversationFieldsetStable: false,
      messageFieldsetStable: false,
      linkFieldsFound: false,
      businessInboxUrlFound: false,
      selectedItemIdRecognized: false,
      directLinkIdDetected: false,
      directLinkIdSource: "not_detected",
      conversationFieldProbes: [],
      messageFieldProbe: null,
      note: "Meta-Direktlink-Quelle konnte gerade nicht geprüft werden.",
    };
  }
}

async function syncFacebookMessengerHistoryForConnection(
  connection: SocialConnectionRow,
  input: {
    contactId?: string;
    fanSenderId?: string;
    markInboundSeen?: boolean;
    revalidate: boolean;
    syncedAt: string;
  },
): Promise<FacebookMessengerSyncResult> {
  const { syncedAt } = input;
  const token = connection.page_access_token_encrypted
    ? decryptToken(connection.page_access_token_encrypted)
    : null;

  if (!connection.page_id || !token) {
    const message =
      "Page Access Token fehlt oder konnte nicht entschlüsselt werden.";
    await updateFacebookMessengerSyncStatus(connection.id, {
      syncedAt,
      checkedConversations: 0,
      importedInbound: 0,
      importedOutbound: 0,
      skippedDuplicates: 0,
      error: message,
    });
    if (input.revalidate) revalidatePath("/channels");
    return syncError(syncedAt, message);
  }

  try {
    const workspaceContacts =
      input.contactId || input.fanSenderId
        ? (await getWorkspaceContacts(connection.workspace_id)).contacts
        : [];
    const contact = input.contactId
      ? workspaceContacts.find((entry) => entry.id === input.contactId)
      : null;
    const targetFanSenderId = input.fanSenderId ?? contact?.handle ?? null;
    const conversations = await fetchFacebookMessengerConversations(
      connection.page_id,
      token,
      FACEBOOK_MESSENGER_SYNC_CONVERSATION_LIMIT,
    );
    let conversationsChecked = 0;
    let importedInbound = 0;
    let importedOutbound = 0;
    let skippedDuplicates = 0;
    let checkedMessages = 0;
    let importedMedia = 0;
    let lastOutboundAt: string | null = null;

    for (const conversation of conversations) {
      const fanParticipant = conversation.participants.find(
        (participant) => participant.id !== connection.page_id,
      );
      if (targetFanSenderId && fanParticipant?.id !== targetFanSenderId)
        continue;
      conversationsChecked += 1;

      const messages = await fetchFacebookMessengerConversationMessages(
        conversation.id,
        token,
        FACEBOOK_MESSENGER_SYNC_MESSAGE_LIMIT,
      );
      const chronologicalMessages = [...messages].sort(
        (a, b) =>
          (Date.parse(a.createdTime ?? "") || 0) -
          (Date.parse(b.createdTime ?? "") || 0),
      );
      for (const message of chronologicalMessages) {
        checkedMessages += 1;
        const senderId = message.from?.id ?? fanParticipant?.id ?? null;
        const direction =
          senderId === connection.page_id ? "outbound" : "inbound";
        const fanSenderId =
          direction === "outbound"
            ? (fanParticipant?.id ?? targetFanSenderId)
            : senderId;
        const normalizedFanSenderId = fanSenderId?.trim() || null;
        const externalThreadId =
          conversation.id ||
          (connection.page_id && normalizedFanSenderId
            ? `${connection.page_id}:${normalizedFanSenderId}`
            : null);
        const content =
          message.message ??
          buildAttachmentFallbackText(message.attachments, direction);
        if (!content) continue;

        const metaUrlCandidates = collectFacebookMetaUrlCandidates(
          conversation,
          message,
        );
        const inboxCandidates = extractBusinessInboxUrlCandidates(metaUrlCandidates);
        const preferredMetaUrl =
          inboxCandidates[0] ??
          message.replyTargetUrl ??
          message.sourceUrl ??
          message.link ??
          conversation.link;
        const sourceMetaUrl =
          message.sourceUrl ?? message.link ?? conversation.link ?? preferredMetaUrl;

        const result = await createMetaWebhookConversationMessage({
          workspaceId: connection.workspace_id,
          senderId: normalizedFanSenderId,
          pageId: connection.page_id,
          recipientId: connection.page_id,
          sourcePlatform: "facebook",
          authorLabel:
            direction === "outbound"
              ? (connection.page_name ?? "Team")
              : (message.from?.name ??
                fanParticipant?.name ??
                "Facebook Nutzer"),
          content,
          messageType: "dm",
          sourceType: "facebook_messages",
          sourceUrl: sourceMetaUrl,
          replyTargetUrl: preferredMetaUrl,
          metaUrlCandidates,
          externalMessageId: message.id,
          externalThreadId,
          sourceConversationId: conversation.id,
          originalTextExcerpt: content,
          direction,
          attachments: message.attachments,
          messageKind: getMessageKindFromAttachments(
            message.message,
            message.attachments,
          ),
          receivedAt: message.createdTime,
        });
        if (result.error) throw result.error;
        if (result.conversation) {
          if (direction === "outbound") {
            importedOutbound += 1;
            lastOutboundAt = message.createdTime ?? syncedAt;
          } else {
            importedInbound += 1;
          }
          if (message.attachments?.length)
            importedMedia += message.attachments.length;
        } else {
          skippedDuplicates += 1;
        }
      }
    }

    await updateFacebookMessengerSyncStatus(connection.id, {
      syncedAt,
      checkedConversations: conversationsChecked,
      importedInbound,
      importedOutbound,
      skippedDuplicates,
      importedMedia,
      error: null,
      lastOutboundAt,
    });
    if (input.contactId && input.markInboundSeen)
      await markContactInboundMessagesSeen({
        workspaceId: connection.workspace_id,
        contactId: input.contactId,
      });
    if (input.revalidate) {
      revalidatePath("/channels");
      revalidatePath("/inbox");
      if (input.contactId) revalidatePath(`/fans/${input.contactId}`);
    }
    return {
      ok: true,
      syncedAt,
      conversationsChecked,
      checkedConversations: conversationsChecked,
      checkedMessages,
      importedInbound,
      importedOutbound,
      importedMedia,
      skippedDuplicates,
      errors: [],
      syncLimit: FACEBOOK_MESSENGER_SYNC_MESSAGE_LIMIT,
      lastSyncAt: syncedAt,
      error: null,
    };
  } catch (syncErrorValue) {
    const message =
      syncErrorValue instanceof Error
        ? syncErrorValue.message
        : "Facebook-Verlauf konnte nicht abgerufen werden. Prüfe Page Access Token und Messenger-Berechtigungen.";
    await updateFacebookMessengerSyncStatus(connection.id, {
      syncedAt,
      checkedConversations: 0,
      importedInbound: 0,
      importedOutbound: 0,
      skippedDuplicates: 0,
      error: message,
    });
    if (input.revalidate) revalidatePath("/channels");
    return syncError(syncedAt, message);
  }
}

function syncError(
  syncedAt: string,
  error: string,
): FacebookMessengerSyncResult {
  return {
    ...createEmptySocialSyncResult({
      ok: false,
      lastSyncAt: syncedAt,
      syncLimit: FACEBOOK_MESSENGER_SYNC_MESSAGE_LIMIT,
      error,
    }),
    syncedAt,
    conversationsChecked: 0,
    error,
  };
}

function summarizeFacebookDirectLinkDiagnosis(input: {
  pageId: string;
  businessId: string | null;
  contactHandle: string | null;
  conversations: FacebookMessengerConversation[];
  conversationFieldProbes: FacebookConversationFieldProbe[];
  messageFieldProbe: FacebookMessageFieldProbe | null;
}): FacebookDirectLinkSourceDiagnosis {
  let conversationLinkAvailable = 0;
  let conversationLinkWithDirectId = 0;
  let participantIdsAvailable = 0;
  let matchedConversationFound = false;
  let matchedConversationHasDirectId = false;
  let participantIdMatchesDirectId: boolean | null = null;
  let businessInboxUrlFound = false;
  let selectedItemIdRecognized = false;
  let selectedItemSource: FacebookDirectLinkSourceDiagnosis["directLinkIdSource"] =
    "not_detected";

  for (const conversation of input.conversations) {
    const fanParticipant = conversation.participants.find(
      (participant) => participant.id !== input.pageId,
    );
    if (fanParticipant?.id) participantIdsAvailable += 1;

    const selectedItemId = extractSelectedItemIdFromMetaUrl(conversation.link);
    if (conversation.link) conversationLinkAvailable += 1;
    if (conversation.link?.includes("business.facebook.com/latest/inbox")) {
      businessInboxUrlFound = true;
    }
    if (selectedItemId) {
      conversationLinkWithDirectId += 1;
      selectedItemIdRecognized = true;
      selectedItemSource = "conversation.link";
    }

    if (input.contactHandle && fanParticipant?.id === input.contactHandle) {
      matchedConversationFound = true;
      if (selectedItemId) {
        matchedConversationHasDirectId = true;
        participantIdMatchesDirectId = fanParticipant.id === selectedItemId;
      }
    }
  }

  if (
    !selectedItemIdRecognized &&
    input.messageFieldProbe?.selectedItemIdFound &&
    input.messageFieldProbe.selectedItemIdSource !== "not_detected"
  ) {
    selectedItemIdRecognized = true;
    selectedItemSource = input.messageFieldProbe.selectedItemIdSource;
  }

  if (input.messageFieldProbe?.businessInboxUrlFound) {
    businessInboxUrlFound = true;
  }

  const conversationFieldsetStable = input.conversationFieldProbes.some(
    (probe) =>
      probe.ok &&
      probe.participantsPresent &&
      probe.canReplyFieldPresent &&
      probe.scopedThreadKeyFieldPresent,
  );
  const messageFieldsetStable =
    input.messageFieldProbe?.ok === true &&
    input.messageFieldProbe.fromFieldPresent &&
    input.messageFieldProbe.attachmentsFieldPresent;
  const linkFieldsFound =
    conversationLinkAvailable > 0 ||
    Boolean(input.messageFieldProbe?.linkFieldPresent) ||
    Boolean(input.messageFieldProbe?.sharesFieldPresent) ||
    Boolean(input.messageFieldProbe?.attachmentsFieldPresent);

  const directLinkIdDetected = matchedConversationHasDirectId || selectedItemIdRecognized;
  const note = directLinkIdDetected
    ? "Direktlink-ID erkannt. FanMind kann den direkten Chat automatisch aufbauen."
    : matchedConversationFound
      ? "Conversation gefunden, aber keine eindeutige Direktlink-ID im Link erkannt."
      : conversationLinkWithDirectId > 0
        ? "Meta liefert Direktlink-IDs in der Stichprobe, aber nicht für diesen Kontakt in der geprüften Auswahl."
        : "In der geprüften Auswahl wurde keine eindeutige Direktlink-ID erkannt.";

  return {
    ok: true,
    graphApiVersion: FACEBOOK_GRAPH_API_VERSION,
    pageIdConfigured: Boolean(input.pageId),
    businessIdConfigured: Boolean(input.businessId),
    sampledConversations: input.conversations.length,
    conversationLinkAvailable,
    conversationLinkWithDirectId,
    participantIdsAvailable,
    matchedConversationFound,
    matchedConversationHasDirectId,
    participantIdMatchesDirectId,
    conversationFieldsetStable,
    messageFieldsetStable,
    linkFieldsFound,
    businessInboxUrlFound,
    selectedItemIdRecognized,
    directLinkIdDetected,
    directLinkIdSource: directLinkIdDetected ? selectedItemSource : "not_detected",
    conversationFieldProbes: input.conversationFieldProbes,
    messageFieldProbe: input.messageFieldProbe,
    note,
  };
}

function collectFacebookMetaUrlCandidates(
  conversation: FacebookMessengerConversation,
  message: FacebookMessengerMessage,
): string[] {
  const values = [
    conversation.link,
    message.link,
    message.sourceUrl,
    message.replyTargetUrl,
    ...message.shares.map((share) => share.url),
    ...(message.attachments?.map((attachment) => attachment.url ?? null) ?? []),
  ];

  return Array.from(
    new Set(values.filter((value): value is string => isFacebookUrl(value))),
  );
}

function isFacebookUrl(value: string | null | undefined): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.hostname.toLowerCase().endsWith("facebook.com");
  } catch {
    return false;
  }
}

export async function checkFacebookPageWebhooks(): Promise<FacebookPageWebhookActionResult> {
  const { connection, error } = await getCurrentFacebookConnection();
  if (error || !connection)
    return actionError(error ?? "Facebook-Verbindung fehlt.");

  const token = connection.page_access_token_encrypted
    ? decryptToken(connection.page_access_token_encrypted)
    : null;
  const tokenDiagnostics = await getTokenScopeDiagnostics(token);
  const status = await fetchFacebookPageWebhookStatus(
    connection.page_id,
    token,
  );
  await updateFacebookWebhookSubscribed(connection.id, status.ok);
  revalidatePath("/channels");
  return { ...status, ...tokenDiagnostics, updatedConnection: true };
}

export async function activateFacebookPageWebhooks(): Promise<FacebookPageWebhookActionResult> {
  const { connection, error } = await getCurrentFacebookConnection();
  if (error || !connection)
    return actionError(error ?? "Facebook-Verbindung fehlt.");

  const token = connection.page_access_token_encrypted
    ? decryptToken(connection.page_access_token_encrypted)
    : null;
  const tokenDiagnostics = await getTokenScopeDiagnostics(token);
  if (!connection.page_id || !token) {
    const status = await fetchFacebookPageWebhookStatus(
      connection.page_id,
      token,
    );
    await updateFacebookWebhookSubscribed(connection.id, false);
    revalidatePath("/channels");
    return { ...status, ...tokenDiagnostics, updatedConnection: true };
  }

  const status = await subscribeFacebookPage(connection.page_id, token);
  await updateFacebookWebhookSubscribed(connection.id, status.ok);
  revalidatePath("/channels");
  return { ...status, ...tokenDiagnostics, updatedConnection: true };
}

async function getTokenScopeDiagnostics(token: string | null) {
  const tokenScopes = await getSafeTokenScopeNames(token);
  return {
    tokenScopes,
    pagesMessagingGranted: hasFacebookPagesMessagingScope(tokenScopes),
    commentFeedScopesGranted: hasFacebookCommentFeedScopes(tokenScopes),
    pagesReadUserContentGranted:
      hasFacebookPagesReadUserContentScope(tokenScopes),
    pagesManageEngagementGranted:
      hasFacebookPagesManageEngagementScope(tokenScopes),
  };
}

async function getSafeTokenScopeNames(token: string | null): Promise<string[]> {
  if (!token) return [];
  try {
    return getFacebookGrantedScopeNames(
      await fetchFacebookTokenDiagnostics(token),
    );
  } catch (error) {
    console.error("Facebook token scope diagnostics failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return [];
  }
}

async function getCurrentFacebookConnection() {
  const { data } = await getSupabaseServerUser();
  if (!data.user) return { connection: null, error: "Nicht angemeldet." };
  const workspaceResult = await getUserWorkspaceDashboard(data.user);
  if (!workspaceResult.workspace)
    return { connection: null, error: "Kein Workspace gefunden." };
  const connectionsResult = await getWorkspaceSocialConnections(
    workspaceResult.workspace.id,
  );
  if (connectionsResult.error)
    return { connection: null, error: connectionsResult.error.message };
  return {
    connection:
      connectionsResult.connections.find(
        (entry) =>
          entry.platform === "facebook" && entry.status === "connected",
      ) ?? null,
    error: null,
  };
}

function actionError(error: string): FacebookPageWebhookActionResult {
  return {
    ok: false,
    pageId: null,
    hasPageAccessToken: false,
    subscribedAppsStatus: "error",
    fields: { feed: "unknown", messages: "unknown", message_echoes: "unknown" },
    error,
    updatedConnection: false,
  };
}
