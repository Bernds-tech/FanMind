import { redirect } from "next/navigation";
import {
  createFacebookOAuthState,
  getFacebookOAuthUrl,
} from "@/lib/facebookIntegration";
import { FACEBOOK_COMMENT_FEED_SCOPES, FACEBOOK_MESSAGES_OAUTH_SCOPES } from "@/lib/facebookScopes";
import {
  getSupabaseServerUser,
  getUserWorkspaceDashboard,
} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const connectionType = requestUrl.searchParams.get("type") === "facebook_comments" ? "facebook_comments" : "facebook_messages";
  const { data } = await getSupabaseServerUser();
  if (!data.user) redirect("/login");

  const workspaceResult = await getUserWorkspaceDashboard(data.user);
  if (!workspaceResult.workspace)
    redirect("/channels?facebook_error=workspace");

  try {
    const state = createFacebookOAuthState({
      workspaceId: workspaceResult.workspace.id,
      userId: data.user.id,
      connectionType,
    });
    const scopes = connectionType === "facebook_comments" ? FACEBOOK_COMMENT_FEED_SCOPES : FACEBOOK_MESSAGES_OAUTH_SCOPES;
    return Response.redirect(getFacebookOAuthUrl(state, scopes), 302);
  } catch {
    redirect("/channels?facebook_error=config");
  }
}
