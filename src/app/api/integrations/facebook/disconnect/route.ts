import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  disconnectFacebookSocialConnection,
  getSupabaseServerUser,
  getUserWorkspaceDashboard,
} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const { data } = await getSupabaseServerUser();
  if (!data.user) redirect("/login");

  const workspaceResult = await getUserWorkspaceDashboard(data.user);
  if (!workspaceResult.workspace)
    redirect("/channels?facebook_error=workspace");

  await disconnectFacebookSocialConnection(workspaceResult.workspace.id);
  revalidatePath("/channels");
  redirect("/channels?disconnected=facebook");
}
