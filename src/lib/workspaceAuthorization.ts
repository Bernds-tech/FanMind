import {
  getSupabaseServerUser,
  getUserWorkspaceDashboard,
  getUserWorkspaceMembershipDashboard,
  getWorkspaceContact,
  type ContactRow,
  type SupabaseServerUser,
  type WorkspaceDashboardRow,
} from "@/lib/supabase/server";
import {
  assertResourceInWorkspace,
  assertWorkspaceId,
  WorkspaceAuthorizationError,
} from "@/lib/workspaceAuthorizationPolicy.mjs";

export {
  assertResourceInWorkspace,
  assertWorkspaceId,
  WorkspaceAuthorizationError,
} from "@/lib/workspaceAuthorizationPolicy.mjs";

export type AuthorizedWorkspaceContext = {
  user: SupabaseServerUser;
  workspace: WorkspaceDashboardRow;
};

function workspaceUnavailableMessage(error: Error | null | undefined): string {
  return error?.message === "TEMPORARY_DEMO_DELETED"
    ? "TEMPORARY_DEMO_DELETED"
    : "Kein autorisierter Workspace gefunden.";
}

export async function getAuthorizedWorkspaceForCurrentUser(
  accessToken?: string,
): Promise<AuthorizedWorkspaceContext | null> {
  const { data, error } = await getSupabaseServerUser(accessToken);
  if (error || !data.user) return null;

  const workspaceResult = await getUserWorkspaceDashboard(data.user, accessToken);
  if (!workspaceResult.workspace) return null;

  return { user: data.user, workspace: workspaceResult.workspace };
}

export async function requireAuthorizedWorkspace(
  accessToken?: string,
): Promise<AuthorizedWorkspaceContext> {
  const { data } = await getSupabaseServerUser(accessToken);
  if (!data.user) {
    throw new WorkspaceAuthorizationError(
      "Keine aktive User-Session gefunden.",
      "unauthenticated",
    );
  }

  const workspaceResult = await getUserWorkspaceDashboard(data.user, accessToken);
  if (!workspaceResult.workspace) {
    throw new WorkspaceAuthorizationError(
      workspaceUnavailableMessage(workspaceResult.error),
      "workspace_missing",
    );
  }

  assertWorkspaceId(workspaceResult.workspace.id);
  return { user: data.user, workspace: workspaceResult.workspace };
}

export async function requireAuthorizedWorkspaceMember(
  accessToken?: string,
): Promise<AuthorizedWorkspaceContext> {
  const { data } = await getSupabaseServerUser(accessToken);
  if (!data.user) {
    throw new WorkspaceAuthorizationError(
      "Keine aktive User-Session gefunden.",
      "unauthenticated",
    );
  }

  const ownerWorkspaceResult = await getUserWorkspaceDashboard(
    data.user,
    accessToken,
  );
  if (ownerWorkspaceResult.workspace) {
    assertWorkspaceId(ownerWorkspaceResult.workspace.id);
    return { user: data.user, workspace: ownerWorkspaceResult.workspace };
  }

  const memberWorkspaceResult = await getUserWorkspaceMembershipDashboard(
    data.user,
    accessToken,
  );
  if (!memberWorkspaceResult.workspace) {
    throw new WorkspaceAuthorizationError(
      workspaceUnavailableMessage(
        memberWorkspaceResult.error ?? ownerWorkspaceResult.error,
      ),
      "workspace_missing",
    );
  }

  assertWorkspaceId(memberWorkspaceResult.workspace.id);
  return { user: data.user, workspace: memberWorkspaceResult.workspace };
}

export async function requireContactInAuthorizedWorkspace(
  contactId: string,
  accessToken?: string,
): Promise<AuthorizedWorkspaceContext & { contact: ContactRow }> {
  const context = await requireAuthorizedWorkspace(accessToken);
  const contactResult = await getWorkspaceContact(
    context.workspace.id,
    contactId,
    accessToken,
  );
  if (contactResult.error) {
    throw new WorkspaceAuthorizationError(
      "Kontakt konnte nicht autorisiert geladen werden.",
      "resource_forbidden",
    );
  }
  assertResourceInWorkspace(contactResult.contact, context.workspace.id, "Kontakt");
  return { ...context, contact: contactResult.contact as ContactRow };
}

export function requireResourceInAuthorizedWorkspace<
  T extends { workspace_id?: string | null },
>(
  resource: T | null | undefined,
  workspaceId: string,
  resourceLabel?: string,
): T {
  assertResourceInWorkspace(resource, workspaceId, resourceLabel);
  return resource as T;
}
