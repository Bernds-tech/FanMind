export type WorkspaceAuthorizationErrorCode =
  | "unauthenticated"
  | "workspace_missing"
  | "resource_forbidden";

export class WorkspaceAuthorizationError extends Error {
  constructor(message: string, code: WorkspaceAuthorizationErrorCode);
  readonly code: WorkspaceAuthorizationErrorCode;
}

export function assertWorkspaceId(
  value: string | null | undefined,
  label?: string,
): asserts value is string;

export function assertResourceInWorkspace(
  resource: { workspace_id?: string | null } | null | undefined,
  workspaceId: string,
  resourceLabel?: string,
): void;
