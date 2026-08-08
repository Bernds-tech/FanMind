"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  claimConversationAssignment,
  getWorkspaceConversations,
  releaseConversationAssignment,
} from "@/lib/supabase/server";
import { requireAuthorizedWorkspaceMember } from "@/lib/workspaceAuthorization";

export async function claimConversation(formData: FormData) {
  await updateAssignment(formData, "claim");
}

export async function releaseConversation(formData: FormData) {
  await updateAssignment(formData, "release");
}

async function updateAssignment(formData: FormData, mode: "claim" | "release") {
  const conversationId = formValue(formData, "conversation_id");
  if (!conversationId) redirect("/inbox?notice=conversation_missing");

  const { user, workspace } = await requireAuthorizedWorkspaceMember();
  const conversations = await getWorkspaceConversations(workspace.id);
  const conversation = conversations.conversations.find(
    (candidate) => candidate.id === conversationId,
  );

  if (conversations.error || !conversation) {
    redirect("/inbox?notice=conversation_forbidden");
  }

  const result =
    mode === "claim"
      ? await claimConversationAssignment({
          workspaceId: workspace.id,
          conversationId,
          assignedUserId: user.id,
          assignedOwner: getUserLabel(user),
        })
      : await releaseConversationAssignment({
          workspaceId: workspace.id,
          conversationId,
          assignedUserId: user.id,
        });

  if (result.error) redirect("/inbox?notice=assignment_failed");

  revalidatePath("/inbox");
  redirect(
    mode === "claim"
      ? "/inbox?notice=conversation_claimed"
      : "/inbox?notice=conversation_released",
  );
}

function getUserLabel(user: {
  email?: string;
  user_metadata?: Record<string, unknown>;
}): string {
  const metadataLabel =
    user.user_metadata?.display_name ??
    user.user_metadata?.full_name ??
    user.user_metadata?.name;

  if (typeof metadataLabel === "string" && metadataLabel.trim()) {
    return metadataLabel.trim().slice(0, 120);
  }

  return (user.email ?? "Workspace-Team").trim().slice(0, 120);
}

function formValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
