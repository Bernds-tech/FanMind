"use server";

import { revalidatePath } from "next/cache";
import {
  decryptToken,
  getFacebookGrantedScopeNames,
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
  updateFacebookWebhookSubscribed,
} from "@/lib/supabase/server";

export type FacebookPageWebhookActionResult = FacebookPageWebhookStatus & {
  updatedConnection: boolean;
  tokenScopes?: string[];
  pagesMessagingGranted?: boolean;
  commentFeedScopesGranted?: boolean;
  pagesReadUserContentGranted?: boolean;
  pagesManageEngagementGranted?: boolean;
};

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
  const tokenScopes = token
    ? getFacebookGrantedScopeNames(await fetchFacebookTokenDiagnostics(token))
    : [];
  return {
    tokenScopes,
    pagesMessagingGranted: hasFacebookPagesMessagingScope(tokenScopes),
    commentFeedScopesGranted: hasFacebookCommentFeedScopes(tokenScopes),
    pagesReadUserContentGranted: hasFacebookPagesReadUserContentScope(tokenScopes),
    pagesManageEngagementGranted: hasFacebookPagesManageEngagementScope(tokenScopes),
  };
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
