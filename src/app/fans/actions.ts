"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createWorkspaceContact,
  getSupabaseServerUser,
  getUserWorkspaceDashboard,
} from "@/lib/supabase/server";

export async function createFan(formData: FormData) {
  const { data } = await getSupabaseServerUser();

  if (!data.user) {
    redirect("/login");
  }

  const workspaceResult = await getUserWorkspaceDashboard(data.user);
  const workspace = workspaceResult.workspace;

  if (!workspace) {
    throw new Error(workspaceResult.error?.message ?? "Workspace konnte nicht geladen werden.");
  }

  const result = await createWorkspaceContact({
    workspaceId: workspace.id,
    displayName: formValue(formData, "display_name"),
    handle: formValue(formData, "handle"),
    sourcePlatform: formValue(formData, "source_platform"),
    language: formValue(formData, "language"),
    status: formValue(formData, "status"),
    tags: parseTags(formValue(formData, "tags")),
    summary: formValue(formData, "summary"),
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  revalidatePath("/fans");
  redirect("/fans");
}

function formValue(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function parseTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 12);
}
