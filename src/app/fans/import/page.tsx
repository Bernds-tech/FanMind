import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { getWorkspaceNavigationForUser } from "@/lib/workspaceNavigation";
import { getWorkspaceKpiStatsFromContacts } from "@/lib/workspaceKpiStats";
import {
  getOpenFollowupCount,
  getSupabaseServerUser,
  getUserWorkspaceDashboard,
  getWorkspaceContacts,
  signOutSupabaseServerSession,
  type WorkspaceDashboardRow,
} from "@/lib/supabase/server";
import dashboardStyles from "../../dashboard/dashboard.module.css";
import { CsvImportClient } from "./CsvImportClient";

export const metadata: Metadata = {
  title: "FanMind | CSV-Import",
  description: "Manueller CSV-Import für FanMind-Kontakte.",
};

async function logout() {
  "use server";

  await signOutSupabaseServerSession();
  redirect("/login");
}

function getUserDisplayName(
  metadata: Record<string, unknown> | undefined,
  fallback: string,
): string {
  const displayName = metadata?.display_name ?? metadata?.full_name;

  return typeof displayName === "string" && displayName.trim()
    ? displayName.trim()
    : fallback;
}

function CsvImportWorkspace({
  workspace,
  userDisplayName,
  contactCount,
  openFollowupCount,
  contactsError,
  userEmail,
}: {
  workspace: WorkspaceDashboardRow;
  userDisplayName: string;
  contactCount: number;
  openFollowupCount: number;
  userEmail: string | null | undefined;
  contactsError?: string;
}) {
  const { mainNavigation, settingsNavigation, savedViews } =
    getWorkspaceNavigationForUser("fans", userEmail);
  const userLabel = userDisplayName || workspace.name || "Nutzer";

  return (
    <WorkspaceShell
      workspaceName={workspace.name}
      userLabel={userLabel}
      planLabel={workspace.plan_id}
      planMeta={workspace.role}
      planStatus="Aktiv"
      mainNavigation={mainNavigation}
      settingsNavigation={settingsNavigation}
      savedViews={savedViews}
      header={{
        title: "CSV-Import",
        subtitle: "Importiere vorbereitete Fan-/Kontaktlisten.",
        searchPlaceholder: "CSV-Spalten, Fans oder Tags suchen ...",
        primaryActionLabel: "Zur Fanliste",
        primaryActionHref: "/fans#fans-list",
      }}
      contactCount={contactCount}
      openFollowupCount={openFollowupCount}
      logoutAction={logout}
    >
      {contactsError ? (
        <p className={dashboardStyles.error}>
          <strong>Kontaktbestand konnte nicht geladen werden.</strong>
          <span>{contactsError}</span>
        </p>
      ) : null}
      <CsvImportClient />
    </WorkspaceShell>
  );
}

export default async function CsvImportPage() {
  const { data, error: userError } = await getSupabaseServerUser();

  if (!data.user) {
    redirect("/login");
  }

  const workspaceResult = await getUserWorkspaceDashboard(data.user);
  if (workspaceResult.error?.message === "TEMPORARY_DEMO_DELETED") {
    redirect("/login?demo_deleted=1");
  }

  const workspace = workspaceResult.workspace;
  const contactsResult = workspace
    ? await getWorkspaceContacts(workspace.id)
    : null;
  const openFollowupCountResult = workspace
    ? await getOpenFollowupCount(workspace.id)
    : null;

  return (
    <main className={dashboardStyles.page}>
      {workspace ? (
        <CsvImportWorkspace
          workspace={workspace}
          userDisplayName={getUserDisplayName(
            data.user.user_metadata,
            workspace.name,
          )}
          contactCount={getWorkspaceKpiStatsFromContacts(contactsResult?.contacts ?? []).totalFans}
          openFollowupCount={openFollowupCountResult?.count ?? 0}
          userEmail={data.user.email}
          contactsError={contactsResult?.error?.message}
        />
      ) : (
        <section
          className={dashboardStyles.fallbackCard}
          aria-label="FanMind CSV-Import"
        >
          <div>
            <p className={dashboardStyles.eyebrow}>FanMind CSV-Import</p>
            <h1>Workspace-Status</h1>
            <p>
              CSV-Import ist geschützt: Supabase Auth ist aktiv. Für deinen Account
              wurde noch kein Workspace gefunden.
            </p>
          </div>
          {userError ? (
            <p className={dashboardStyles.error}>
              <strong>
                Supabase-Session konnte nicht vollständig geprüft werden.
              </strong>
              <span>{userError.message}</span>
            </p>
          ) : null}
          {workspaceResult.error ? (
            <p className={dashboardStyles.error}>
              <strong>Workspace-Daten konnten nicht geladen werden.</strong>
              <span>{workspaceResult.error.message}</span>
            </p>
          ) : null}
          <form action={logout}>
            <button type="submit" className={dashboardStyles.secondaryButton}>
              Abmelden
            </button>
          </form>
        </section>
      )}
    </main>
  );
}
