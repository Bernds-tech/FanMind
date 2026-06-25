import type { SupabaseServerUser, WorkspaceDashboardRow } from "@/lib/supabase/server";

export const DEMO_WORKSPACE_EMAIL = "sandra.m@fanmind.ch";
export const DEMO_WORKSPACE_NAME = "Sandra M. Demo Workspace";
export const TEMPORARY_DEMO_WORKSPACE_NAME = "FanMind Demo Workspace";

export function isTemporaryDemoUser(user: Pick<SupabaseServerUser, "user_metadata"> | null | undefined): boolean {
  return user?.user_metadata?.fanmind_demo === true && user.user_metadata.demo_type === "temporary";
}

export function isPublicDemoWorkspace({
  userEmail,
  workspaceName,
  user,
}: {
  userEmail?: string | null;
  workspaceName?: string | null;
  user?: Pick<SupabaseServerUser, "user_metadata"> | null;
}): boolean {
  return (
    (userEmail ?? "").trim().toLowerCase() === DEMO_WORKSPACE_EMAIL ||
    (workspaceName ?? "").trim() === DEMO_WORKSPACE_NAME ||
    (workspaceName ?? "").trim() === TEMPORARY_DEMO_WORKSPACE_NAME ||
    isTemporaryDemoUser(user)
  );
}

export function areDemoConnectionsDisabled(
  user: Pick<SupabaseServerUser, "email" | "user_metadata"> | null | undefined,
  workspace: Pick<WorkspaceDashboardRow, "name"> | null | undefined,
): boolean {
  return isPublicDemoWorkspace({
    userEmail: user?.email,
    workspaceName: workspace?.name,
    user,
  });
}


export type TemporaryDemoExpiryState =
  | { isTemporaryDemo: false; isExpired: false; expiresAt: null }
  | { isTemporaryDemo: true; isExpired: boolean; expiresAt: Date };

export function getTemporaryDemoExpiryState(
  user: Pick<SupabaseServerUser, "user_metadata"> | null | undefined,
  now = new Date(),
): TemporaryDemoExpiryState {
  if (!isTemporaryDemoUser(user)) {
    return { isTemporaryDemo: false, isExpired: false, expiresAt: null };
  }

  const rawExpiresAt = user?.user_metadata?.demo_expires_at;
  if (typeof rawExpiresAt !== "string") {
    return { isTemporaryDemo: true, isExpired: true, expiresAt: new Date(0) };
  }

  const expiresAt = new Date(rawExpiresAt);
  if (Number.isNaN(expiresAt.getTime())) {
    return { isTemporaryDemo: true, isExpired: true, expiresAt: new Date(0) };
  }

  return { isTemporaryDemo: true, isExpired: expiresAt <= now, expiresAt };
}
