import {
  getSupabaseServerUser,
  getUserWorkspaceDashboard,
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

export async function getAuthorizedWorkspaceForCurrentUser(): Promise<AuthorizedWorkspaceContext | null> {
  const { data, error } = await getSupabaseServerUser();
  if (error || !data.user) return null;

  const workspaceResult = await getUserWorkspaceDashboard(data.user);
  if (!workspaceResult.workspace) return null;

  return { user: data.user, workspace: workspaceResult.workspace };
}

export async function requireAuthorizedWorkspace(): Promise<AuthorizedWorkspaceContext> {
  const { data } = await getSupabaseServerUser();
  if (!data.user) {
    throw new WorkspaceAuthorizationError(
      "Keine aktive User-Session gefunden.",
      "unauthenticated",
    );
  }

  const workspaceResult = await getUserWorkspaceDashboard(data.user);
  if (!workspaceResult.workspace) {
    throw new WorkspaceAuthorizationError(
      workspaceResult.error?.message ?? "Kein autorisierter Workspace gefunden.",
      "workspace_missing",
    );
  }

  assertWorkspaceId(workspaceResult.workspace.id);
  return { user: data.user, workspace: workspaceResult.workspace };
}

export async function requireContactInAuthorizedWorkspace(
  contactId: string,
): Promise<AuthorizedWorkspaceContext & { contact: ContactRow }> {
  const context = await requireAuthorizedWorkspace();
  const contactResult = await getWorkspaceContact(context.workspace.id, contactId);
  if (contactResult.error) throw contactResult.error;
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
