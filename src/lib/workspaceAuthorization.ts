import {
  getSupabaseServerUser,
  getUserWorkspaceDashboard,
  getUserWorkspaceMembershipDashboard,
  getWorkspaceContact,
  type ContactRow,
  type SupabaseServerUser,
  type WorkspaceDashboardRow,
} from "@/lib/supabase/server";

export class WorkspaceAuthorizationError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "unauthenticated"
      | "workspace_missing"
      | "resource_forbidden",
  ) {
    super(message);
    this.name = "WorkspaceAuthorizationError";
  }
}

export type AuthorizedWorkspaceContext = {
  user: SupabaseServerUser;
  workspace: WorkspaceDashboardRow;
};

function workspaceUnavailableMessage(error: Error | null | undefined): string {
  return error?.message === "TEMPORARY_DEMO_DELETED"
    ? "TEMPORARY_DEMO_DELETED"
    : "Kein autorisierter Workspace gefunden.";
}

export function assertWorkspaceId(
  value: string | null | undefined,
  label = "workspace_id",
): asserts value is string {
  if (!value?.trim()) {
    throw new WorkspaceAuthorizationError(
      `${label} fehlt; workspace-gescopter Zugriff wurde abgebrochen.`,
      "workspace_missing",
    );
  }
}

export function assertResourceInWorkspace(
  resource: { workspace_id?: string | null } | null | undefined,
  workspaceId: string,
  resourceLabel = "Ressource",
) {
  assertWorkspaceId(workspaceId);
  if (!resource || resource.workspace_id !== workspaceId) {
    throw new WorkspaceAuthorizationError(
      `${resourceLabel} wurde im autorisierten Workspace nicht gefunden.`,
      "resource_forbidden",
    );
  }
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
