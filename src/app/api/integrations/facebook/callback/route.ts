import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  encryptToken,
  exchangeFacebookCode,
  fetchFacebookPages,
  subscribeFacebookPage,
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
  const code = url.searchParams.get("code");
  const state = verifyFacebookOAuthState(url.searchParams.get("state"));

  const { data } = await getSupabaseServerUser();
  if (!data.user) redirect("/login");
  if (!code || !state || state.userId !== data.user.id) {
    redirect("/channels?facebook_error=oauth");
  }

  const workspaceResult = await getUserWorkspaceDashboard(data.user);
  if (
    !workspaceResult.workspace ||
    workspaceResult.workspace.id !== state.workspaceId
  ) {
    redirect("/channels?facebook_error=workspace");
  }

  try {
    const userToken = await exchangeFacebookCode(code);
    const pages = await fetchFacebookPages(userToken);
    const page = pages[0];
    if (!page)
      return Response.redirect(
        new URL("/channels?facebook_error=no_page", url),
        302,
      );

    const encryptedToken = page.accessToken
      ? encryptToken(page.accessToken)
      : null;
    const webhookSubscribed = page.accessToken
      ? await subscribeFacebookPage(page.id, page.accessToken).catch(
          () => false,
        )
      : false;

    const result = await upsertFacebookSocialConnection({
      workspaceId: state.workspaceId,
      connectedBy: data.user.id,
      externalAccountId: page.id,
      externalAccountName: page.name,
      pageId: page.id,
      pageName: page.name,
      pageAccessTokenEncrypted: encryptedToken,
      tokenLastFour: encryptedToken ? tokenLastFour(page.accessToken) : null,
      scopes: page.scopes,
      webhookSubscribed,
    });

    if (result.error)
      return Response.redirect(
        new URL("/channels?facebook_error=save", url),
        302,
      );
    revalidatePath("/channels");
    return Response.redirect(new URL("/channels?connected=facebook", url), 302);
  } catch {
    return Response.redirect(
      new URL("/channels?facebook_error=callback", url),
      302,
    );
  }
}
