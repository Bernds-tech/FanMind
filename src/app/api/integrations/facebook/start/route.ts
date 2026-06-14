import { redirect } from "next/navigation";
import {
  createFacebookOAuthState,
  getFacebookOAuthUrl,
} from "@/lib/facebookIntegration";
import {
  getSupabaseServerUser,
  getUserWorkspaceDashboard,
} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data } = await getSupabaseServerUser();
  if (!data.user) redirect("/login");

  const workspaceResult = await getUserWorkspaceDashboard(data.user);
  if (!workspaceResult.workspace)
    redirect("/channels?facebook_error=workspace");

  try {
    const state = createFacebookOAuthState({
      workspaceId: workspaceResult.workspace.id,
      userId: data.user.id,
    });
    return Response.redirect(getFacebookOAuthUrl(state), 302);
  } catch {
    redirect("/channels?facebook_error=config");
  }
}
