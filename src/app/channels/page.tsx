import { redirect } from "next/navigation";
import {
  getSupabaseServerUser,
  getUserWorkspaceDashboard,
  getWorkspaceContacts,
  signOutSupabaseServerSession,
  type WorkspaceDashboardRow,
} from "@/lib/supabase/server";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { getWorkspaceNavigation } from "@/lib/workspaceNavigation";
import dashboardStyles from "../dashboard/dashboard.module.css";
import { ChannelsGrid } from "./ChannelsGrid";
import styles from "./channels.module.css";

type ChannelsWorkspaceProps = {
  workspace: WorkspaceDashboardRow;
  userDisplayName: string;
  contactCount: number;
};

async function logout() {
  "use server";

  await signOutSupabaseServerSession();
  redirect("/login");
}

function ChannelsWorkspace({
  workspace,
  userDisplayName,
  contactCount,
}: ChannelsWorkspaceProps) {
  const { mainNavigation, settingsNavigation, savedViews } =
    getWorkspaceNavigation("channels");
  const userLabel = userDisplayName || workspace.name || "Nutzer";

  return (
    <WorkspaceShell
      workspaceName={workspace.name}
      userLabel={userLabel}
      planLabel={workspace.plan_id}
      planMeta={workspace.role}
      planStatus="Sync"
      mainNavigation={mainNavigation}
      settingsNavigation={settingsNavigation}
      savedViews={savedViews}
      header={{
        title: "Kanäle",
        subtitle:
          "Verbinde Quellen für Nachrichten, Kommentare, Leads und Support-Anfragen.",
        searchPlaceholder: "Suche nach Plattform, Status oder Anschlussart ...",
        primaryActionLabel: "Sync vorbereiten",
        primaryActionHref: "#channel-grid-title",
      }}
      contactCount={contactCount}
      logoutAction={logout}
    >
      <section className={styles.introCard} aria-labelledby="channels-title">
        <div>
          <p className={styles.eyebrow}>Pflichtbereich · Social-Media-Synchronisation</p>
          <h2 id="channels-title">Kanäle verbinden und Eingänge kontrollieren</h2>
          <p>
            Verbinde Quellen für eingehende Nachrichten, Kommentare, Leads und
            Support-Anfragen. FanMind importiert und ordnet Eingänge dem
            Arbeits-Eingang zu; Antworten werden nie automatisch gesendet.
          </p>
        </div>
        <div className={styles.safetyPills} aria-label="Freigabe-Regeln">
          <span>Manuelle Prüfung vor Antwort</span>
          <span>Kein Kampagnenversand</span>
          <span>Automatisches Senden: deaktiviert</span>
        </div>
      </section>

      <ChannelsGrid />
    </WorkspaceShell>
  );
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

export default async function ChannelsPage() {
  const { data, error: userError } = await getSupabaseServerUser();

  if (!data.user) {
    redirect("/login");
  }

  const workspaceResult = await getUserWorkspaceDashboard(data.user);
  const workspace = workspaceResult.workspace;
  const contactsResult = workspace
    ? await getWorkspaceContacts(workspace.id)
    : null;

  return (
    <main className={dashboardStyles.page}>
      {workspace ? (
        <ChannelsWorkspace
          workspace={workspace}
          userDisplayName={getUserDisplayName(
            data.user.user_metadata,
            workspace.name,
          )}
          contactCount={contactsResult?.contacts.length ?? 0}
        />
      ) : (
        <section
          className={dashboardStyles.fallbackCard}
          aria-label="FanMind Kanäle"
        >
          <div>
            <p className={dashboardStyles.eyebrow}>FanMind Kanäle</p>
            <h1>Workspace-Status</h1>
            <p>
              Kanäle ist geschützt: Supabase Auth ist aktiv. Für deinen Account
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
