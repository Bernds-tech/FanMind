import { redirect } from "next/navigation";
import {
  getOpenFollowupCount,
  getSupabaseServerUser,
  getUserWorkspaceDashboard,
  getWorkspaceContacts,
  signOutSupabaseServerSession,
  type WorkspaceDashboardRow,
} from "@/lib/supabase/server";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { getWorkspaceNavigation } from "@/lib/workspaceNavigation";
import { getWorkspaceKpiStatsFromContacts } from "@/lib/workspaceKpiStats";
import dashboardStyles from "../dashboard/dashboard.module.css";

type ReactivationWorkspaceProps = {
  workspace: WorkspaceDashboardRow;
  userDisplayName: string;
  contactCount: number;
  openFollowupCount: number;
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

function ReactivationWorkspace({
  workspace,
  userDisplayName,
  contactCount,
  openFollowupCount,
}: ReactivationWorkspaceProps) {
  const { mainNavigation, settingsNavigation, savedViews } =
    getWorkspaceNavigation("reactivation");
  const userLabel = userDisplayName || workspace.name || "Nutzer";

  return (
    <WorkspaceShell
      workspaceName={workspace.name}
      userLabel={userLabel}
      planLabel={workspace.plan_id}
      planMeta={workspace.role}
      planStatus="Coming Soon"
      mainNavigation={mainNavigation}
      settingsNavigation={settingsNavigation}
      savedViews={savedViews}
      header={{
        title: "Reaktivierung",
        subtitle: "Willkommen zurück, Pilot Test 👋",
        searchPlaceholder: "Suche nach Name, Tag, Status ...",
        primaryActionLabel: "Coming Soon",
        primaryActionHref: "#reactivation-preview",
      }}
      contactCount={contactCount}
      openFollowupCount={openFollowupCount}
      logoutAction={logout}
    >
      <section
        className={dashboardStyles.moduleCard}
        id="reactivation-preview"
        aria-labelledby="reactivation-title"
      >
        <div className={dashboardStyles.moduleHeader}>
          <div>
            <p className={dashboardStyles.eyebrow}>Coming Soon</p>
            <h2 id="reactivation-title">Reaktivierung vorbereiten</h2>
          </div>
          <span>Coming Soon</span>
        </div>
        <p className={dashboardStyles.moduleText}>
          Reaktivierungslogik ist im MVP noch nicht aktiv. Später werden hier
          inaktive Fans, manuelle nächste Schritte und sichere
          Kontaktvorschläge vorbereitet.
        </p>
        <div className={dashboardStyles.emptyState}>
          <strong>Noch keine Reaktivierungslogik aktiv.</strong>
          <p>
            FanMind startet hier keine automatische Kontaktaufnahme und zeigt
            keine erfundenen Reaktivierungsfälle.
          </p>
        </div>
      </section>
    </WorkspaceShell>
  );
}

export default async function ReactivationPage() {
  const { data, error: userError } = await getSupabaseServerUser();

  if (!data.user) {
    redirect("/login");
  }

  const workspaceResult = await getUserWorkspaceDashboard(data.user);
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
        <ReactivationWorkspace
          workspace={workspace}
          userDisplayName={getUserDisplayName(
            data.user.user_metadata,
            workspace.name,
          )}
          contactCount={getWorkspaceKpiStatsFromContacts(contactsResult?.contacts ?? []).totalFans}
          openFollowupCount={openFollowupCountResult?.count ?? 0}
        />
      ) : (
        <section
          className={dashboardStyles.fallbackCard}
          aria-label="FanMind Reaktivierung"
        >
          <div>
            <p className={dashboardStyles.eyebrow}>FanMind Reaktivierung</p>
            <h1>Workspace-Status</h1>
            <p>
              Reaktivierung ist geschützt: Supabase Auth ist aktiv. Für deinen
              Account wurde noch kein Workspace gefunden.
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
