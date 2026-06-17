"use server";

import { revalidatePath } from "next/cache";
import {
  decryptToken,
  getFacebookGrantedScopeNames,
  fetchFacebookPagePostsWithComments,
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
  createFacebookWebhookConversationMessage,
  updateFacebookCommentFetchStatus,
  updateFacebookWebhookSubscribed,
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
    return { ok: false, fetchedAt, postsChecked: 0, commentsChecked: 0, importedCount: 0, error: error ?? "Facebook-Verbindung fehlt." };
  }

  const token = connection.page_access_token_encrypted
    ? decryptToken(connection.page_access_token_encrypted)
    : null;

  if (!connection.page_id || !token) {
    const message = "Page Access Token fehlt oder konnte nicht entschlüsselt werden.";
    await updateFacebookCommentFetchStatus(connection.id, { fetchedAt, importedCount: 0, error: message });
    revalidatePath("/channels");
    return { ok: false, fetchedAt, postsChecked: 0, commentsChecked: 0, importedCount: 0, error: message };
  }

  try {
    const tokenScopes = await getSafeTokenScopeNames(token);
    const { posts, comments, diagnostics } = await fetchFacebookPagePostsWithComments(connection.page_id, token);
    let importedCount = 0;

    for (const comment of comments) {
      if (!comment.message?.trim()) continue;
      const result = await createFacebookWebhookConversationMessage({
        workspaceId: connection.workspace_id,
        senderId: comment.from?.id ?? null,
        authorLabel: comment.from?.name ?? "Facebook Nutzer",
        content: comment.message,
        messageType: "comment",
        sourceType: "facebook_comments",
        sourceUrl: comment.permalink_url ?? comment.postPermalinkUrl ?? `https://www.facebook.com/${comment.postId}`,
        replyTargetUrl: comment.permalink_url ?? comment.postPermalinkUrl ?? `https://www.facebook.com/${comment.postId}`,
        externalMessageId: comment.id,
        externalThreadId: comment.postId,
      });
      if (result.error) throw result.error;
      if (result.conversation) importedCount += 1;
    }

    await updateFacebookCommentFetchStatus(connection.id, { fetchedAt, importedCount, error: null });
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
    const message = fetchError instanceof Error ? fetchError.message : "Facebook-Kommentarabruf fehlgeschlagen.";
    await updateFacebookCommentFetchStatus(connection.id, { fetchedAt, importedCount: 0, error: message });
    revalidatePath("/channels");
    return {
      ok: false,
      fetchedAt,
      postsChecked: 0,
      commentsChecked: 0,
      importedCount: 0,
      error: message,
      endpointType: fetchError instanceof FacebookCommentFetchError ? fetchError.endpointType : null,
      usedPageAccessToken: fetchError instanceof FacebookCommentFetchError ? fetchError.usedPageAccessToken : true,
      tokenScopes,
    };
  }
}

export async function checkFacebookPageWebhooks(): Promise<FacebookPageWebhookActionResult> {
  const { connection, error } = await getCurrentFacebookConnection();
  if (error || !connection) return actionError(error ?? "Facebook-Verbindung fehlt.");

  const token = connection.page_access_token_encrypted
    ? decryptToken(connection.page_access_token_encrypted)
    : null;
  const tokenDiagnostics = await getTokenScopeDiagnostics(token);
  const status = await fetchFacebookPageWebhookStatus(connection.page_id, token);
  await updateFacebookWebhookSubscribed(connection.id, status.ok);
  revalidatePath("/channels");
  return { ...status, ...tokenDiagnostics, updatedConnection: true };
}

export async function activateFacebookPageWebhooks(): Promise<FacebookPageWebhookActionResult> {
  const { connection, error } = await getCurrentFacebookConnection();
  if (error || !connection) return actionError(error ?? "Facebook-Verbindung fehlt.");

  const token = connection.page_access_token_encrypted
    ? decryptToken(connection.page_access_token_encrypted)
    : null;
  const tokenDiagnostics = await getTokenScopeDiagnostics(token);
  if (!connection.page_id || !token) {
    const status = await fetchFacebookPageWebhookStatus(connection.page_id, token);
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
    pagesReadUserContentGranted: hasFacebookPagesReadUserContentScope(tokenScopes),
    pagesManageEngagementGranted: hasFacebookPagesManageEngagementScope(tokenScopes),
  };
}

async function getSafeTokenScopeNames(token: string | null): Promise<string[]> {
  if (!token) return [];
  try {
    return getFacebookGrantedScopeNames(await fetchFacebookTokenDiagnostics(token));
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
  if (!workspaceResult.workspace) return { connection: null, error: "Kein Workspace gefunden." };
  const connectionsResult = await getWorkspaceSocialConnections(workspaceResult.workspace.id);
  if (connectionsResult.error) return { connection: null, error: connectionsResult.error.message };
  return {
    connection: connectionsResult.connections.find(
      (entry) => entry.platform === "facebook" && entry.status === "connected",
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
    fields: { feed: "unknown", messages: "unknown" },
    error,
    updatedConnection: false,
  };
}
