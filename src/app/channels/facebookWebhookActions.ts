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
  getFacebookGrantedScopeNames,
  fetchFacebookPagePostsWithComments,
  fetchFacebookMessengerConversationMessages,
  fetchFacebookMessengerConversations,
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
          sourceUrl: conversation.link,
          replyTargetUrl: conversation.link,
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
