import type { SupabaseServerUser, WorkspaceDashboardRow } from "@/lib/supabase/server";

export const DEMO_WORKSPACE_EMAIL = "sandra.m@fanmind.ch";
export const DEMO_WORKSPACE_NAME = "Sandra M. Demo Workspace";

export function isPublicDemoWorkspace({
  userEmail,
  workspaceName,
}: {
  userEmail?: string | null;
  workspaceName?: string | null;
}): boolean {
  return (
    (userEmail ?? "").trim().toLowerCase() === DEMO_WORKSPACE_EMAIL ||
    (workspaceName ?? "").trim() === DEMO_WORKSPACE_NAME
  );
}

export function areDemoConnectionsDisabled(
  user: Pick<SupabaseServerUser, "email"> | null | undefined,
  workspace: Pick<WorkspaceDashboardRow, "name"> | null | undefined,
): boolean {
  return isPublicDemoWorkspace({
    userEmail: user?.email,
    workspaceName: workspace?.name,
  });
}
