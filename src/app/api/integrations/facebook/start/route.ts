import { redirect } from "next/navigation";
import {
  createFacebookOAuthState,
  getFacebookOAuthUrl,
} from "@/lib/facebookIntegration";
import {
  FACEBOOK_COMMENT_FEED_SCOPES,
  FACEBOOK_INSIGHTS_OAUTH_SCOPES,
  FACEBOOK_MESSAGES_OAUTH_SCOPES,
} from "@/lib/facebookScopes";
import { canManageMetaConnections } from "@/lib/metaIntegrationPolicy.mjs";
import {
  getSupabaseServerUser,
  getUserWorkspaceDashboard,
} from "@/lib/supabase/server";
import { areDemoConnectionsDisabled } from "@/lib/demoMode";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const requestedType = requestUrl.searchParams.get("type");
  const connectionType =
    requestedType === "facebook_comments" ||
    requestedType === "facebook_insights"
      ? requestedType
      : "facebook_messages";
  const { data } = await getSupabaseServerUser();
  if (!data.user) redirect("/login");

  const workspaceResult = await getUserWorkspaceDashboard(data.user);
  if (!workspaceResult.workspace)
    redirect("/channels?facebook_error=workspace");
  if (!canManageMetaConnections(workspaceResult.workspace.role))
    redirect("/channels?facebook_error=role");
  if (areDemoConnectionsDisabled(data.user, workspaceResult.workspace))
    redirect("/channels?facebook_error=demo_disabled");

  try {
    const state = createFacebookOAuthState({
      workspaceId: workspaceResult.workspace.id,
      userId: data.user.id,
      connectionType,
    });
    const scopes =
      connectionType === "facebook_comments"
        ? FACEBOOK_COMMENT_FEED_SCOPES
        : connectionType === "facebook_insights"
          ? FACEBOOK_INSIGHTS_OAUTH_SCOPES
          : FACEBOOK_MESSAGES_OAUTH_SCOPES;
    return Response.redirect(getFacebookOAuthUrl(state, scopes), 302);
  } catch {
    redirect("/channels?facebook_error=config");
  }
}
