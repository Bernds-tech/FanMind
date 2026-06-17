import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  encryptToken,
  exchangeFacebookCode,
  isTokenEncryptionConfigured,
  fetchFacebookGrantedPermissions,
  getFacebookGrantedScopeNames,
  fetchFacebookPages,
  getGrantedFacebookPermissionNames,
  hasRequiredFacebookPagePermissions,
  hasFacebookCommentFeedScopes,
  subscribeFacebookPage,
  fetchFacebookTokenDiagnostics,
  tokenLastFour,
  verifyFacebookOAuthState,
} from "@/lib/facebookIntegration";
import {
  getSupabaseServerUser,
  getUserWorkspaceDashboard,
  upsertFacebookSocialConnection,
} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const appOrigin = getCanonicalAppOrigin(url);
  const code = url.searchParams.get("code");
  const state = verifyFacebookOAuthState(url.searchParams.get("state"));

  const { data } = await getSupabaseServerUser();
  if (!data.user) redirect("/login");
  if (!code || !state || state.userId !== data.user.id) {
    return redirectToChannels(appOrigin, "facebook_error=oauth");
  }

  const workspaceResult = await getUserWorkspaceDashboard(data.user);
  if (
    !workspaceResult.workspace ||
    workspaceResult.workspace.id !== state.workspaceId
  ) {
    return redirectToChannels(appOrigin, "facebook_error=workspace");
  }

  try {
    const userToken = await exchangeFacebookCode(code);
    const permissions = await fetchFacebookGrantedPermissions(userToken);
    const userTokenDiagnostics = await fetchFacebookTokenDiagnostics(userToken);
    const grantedPermissionNames = getGrantedFacebookPermissionNames(permissions);
    const isCommentConnection = state.connectionType === "facebook_comments";
    if (!isCommentConnection && !hasRequiredFacebookPagePermissions(permissions)) {
      console.warn("Facebook callback missing required Messenger page permissions");
      return redirectToChannels(appOrigin, "facebook_error=page_permissions&type=facebook_messages");
    }
    if (isCommentConnection && !hasFacebookCommentFeedScopes(grantedPermissionNames)) {
      console.warn("Facebook callback missing required comment page permissions");
      return redirectToChannels(appOrigin, "facebook_error=comment_review&type=facebook_comments");
    }

    const pages = await fetchFacebookPages(userToken);
    const page = pages[0];
    if (!page) {
      console.warn("Facebook callback did not receive a manageable page", {
        pageCount: pages.length,
      });
      return redirectToChannels(appOrigin, "facebook_error=no_page");
    }

    if (!page.accessToken) {
      console.warn(
        "Facebook callback received a page without page access token",
      );
      return redirectToChannels(appOrigin, "facebook_error=no_page_token");
    }

    if (page.accessToken && !isTokenEncryptionConfigured()) {
      return redirectToChannels(appOrigin, "facebook_error=encryption");
    }

    const encryptedToken = page.accessToken
      ? encryptToken(page.accessToken)
      : null;

    if (page.accessToken && !encryptedToken) {
      return redirectToChannels(appOrigin, "facebook_error=encryption");
    }

    const pageTokenDiagnostics = page.accessToken
      ? await fetchFacebookTokenDiagnostics(page.accessToken)
      : null;
    const grantedScopes = mergeScopes(
      grantedPermissionNames,
      getFacebookGrantedScopeNames(userTokenDiagnostics),
      getFacebookGrantedScopeNames(pageTokenDiagnostics),
      page.scopes,
    );

    const webhookStatus = page.accessToken
      ? await subscribeFacebookPage(page.id, page.accessToken).catch(
          () => null,
        )
      : null;
    const webhookSubscribed = Boolean(webhookStatus?.ok);

    const result = await upsertFacebookSocialConnection({
      workspaceId: state.workspaceId,
      connectedBy: data.user.id,
      externalAccountId: page.id,
      externalAccountName: page.name,
      pageId: page.id,
      pageName: page.name,
      pageAccessTokenEncrypted: encryptedToken,
      tokenLastFour: encryptedToken ? tokenLastFour(page.accessToken) : null,
      scopes: grantedScopes,
      webhookSubscribed,
    });

    if (result.error) {
      console.error("Facebook social connection save failed", {
        message: result.error.message,
        name: result.error.name,
        workspaceIdPresent: Boolean(state.workspaceId),
        pageIdPresent: Boolean(page.id),
        pageNamePresent: Boolean(page.name),
        hasEncryptedToken: Boolean(encryptedToken),
        webhookSubscribed,
      });
      return redirectToChannels(appOrigin, "facebook_error=save");
    }
    revalidatePath("/channels");
    return redirectToChannels(appOrigin, `connected=${isCommentConnection ? "facebook_comments" : "facebook_messages"}`);
  } catch (error) {
    console.error("Facebook OAuth callback failed", {
      message:
        error instanceof Error ? error.message : "Unknown callback error",
    });
    return redirectToChannels(appOrigin, "facebook_error=callback");
  }
}

function mergeScopes(...scopeGroups: Array<string[] | null | undefined>): string[] {
  return [...new Set(scopeGroups.flatMap((scopes) => scopes ?? []))].sort();
}

function redirectToChannels(appOrigin: string, query: string): Response {
  return Response.redirect(new URL(`/channels?${query}`, appOrigin), 302);
}

function getCanonicalAppOrigin(requestUrl: URL): string {
  const configuredAppUrl = parseOrigin(process.env.NEXT_PUBLIC_APP_URL ?? process.env.FANMIND_APP_URL);
  if (configuredAppUrl) return configuredAppUrl;

  const metaRedirectOrigin = parseOrigin(process.env.FACEBOOK_REDIRECT_URI ?? process.env.META_REDIRECT_URI);
  if (metaRedirectOrigin) return metaRedirectOrigin;

  return requestUrl.origin;
}

function parseOrigin(value: string | undefined): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.origin;
  } catch {
    return null;
  }
}
