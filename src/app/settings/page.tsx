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

type SettingsWorkspaceProps = {
  workspace: WorkspaceDashboardRow;
  userDisplayName: string;
  contactCount: number;
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

function SettingsWorkspace({
  workspace,
  userDisplayName,
  contactCount,
}: SettingsWorkspaceProps) {
  const { mainNavigation, settingsNavigation, savedViews } =
    getWorkspaceNavigation("settings");
  const userLabel = userDisplayName || workspace.name || "Nutzer";

  return (
    <WorkspaceShell
      workspaceName={workspace.name}
      userLabel={userLabel}
      planLabel={workspace.plan_id}
      planMeta={workspace.role}
      planStatus="MVP"
      mainNavigation={mainNavigation}
      settingsNavigation={settingsNavigation}
      savedViews={savedViews}
      header={{
        title: "Einstellungen",
        subtitle: "Willkommen zurück, Pilot Test 👋",
        searchPlaceholder: "Suche nach Workspace, Profil, Paket ...",
        primaryActionLabel: "Speichern vorbereiten",
        primaryActionHref: "#workspace-settings",
      }}
      contactCount={contactCount}
      logoutAction={logout}
    >
      <section
        className={dashboardStyles.moduleCard}
        id="workspace-settings"
        aria-labelledby="workspace-settings-title"
      >
        <div className={dashboardStyles.moduleHeader}>
          <div>
            <p className={dashboardStyles.eyebrow}>MVP-Vorschau</p>
            <h2 id="workspace-settings-title">Workspace-Einstellungen</h2>
          </div>
          <span>MVP-Vorschau</span>
        </div>
        <p className={dashboardStyles.moduleText}>
          Einstellungen für Workspace, Nutzerprofil und Paketlogik werden hier
          vorbereitet. Im aktuellen MVP werden noch keine komplexen
          Rollen/Rechte oder Zahlungsfunktionen gebaut.
        </p>
        <div className={dashboardStyles.emptyState}>
          <strong>Noch keine bearbeitbaren Einstellungen aktiv.</strong>
          <p>
            Diese Seite hält den geschützten Workspace-Rahmen bereit, ohne echte
            Rollenverwaltung, Zahlungslogik oder Datenbankänderungen
            einzuführen.
          </p>
        </div>
      </section>
    </WorkspaceShell>
  );
}

export default async function SettingsPage() {
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
        <SettingsWorkspace
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
          aria-label="FanMind Einstellungen"
        >
          <div>
            <p className={dashboardStyles.eyebrow}>FanMind Einstellungen</p>
            <h1>Workspace-Status</h1>
            <p>
              Einstellungen ist geschützt: Supabase Auth ist aktiv. Für deinen
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
