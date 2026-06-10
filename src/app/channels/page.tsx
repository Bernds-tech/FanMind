import { redirect } from "next/navigation";
import {
  getSupabaseServerUser,
  getUserWorkspaceDashboard,
  getWorkspaceContacts,
  signOutSupabaseServerSession,
  type WorkspaceDashboardRow,
} from "@/lib/supabase/server";
import {
  WorkspaceShell,
  type WorkspaceNavLink,
} from "@/components/WorkspaceShell";
import dashboardStyles from "../dashboard/dashboard.module.css";

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
  const mainNavigation: WorkspaceNavLink[] = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Fans", href: "/fans" },
    { label: "Kanäle", href: "/channels", active: true, badge: "Roadmap" },
  ];
  const settingsNavigation: WorkspaceNavLink[] = [
    { label: "Einstellungen", href: "#workspace", disabled: true },
  ];
  const savedViews: WorkspaceNavLink[] = [
    { label: "Top Fans", href: "/fans#fans-list" },
    { label: "Reaktivierung", href: "/dashboard#followups" },
  ];
  const userLabel = userDisplayName || workspace.name || "Nutzer";

  return (
    <WorkspaceShell
      workspaceName={workspace.name}
      userLabel={userLabel}
      planLabel={workspace.plan_id}
      planMeta={workspace.role}
      planStatus="Roadmap"
      mainNavigation={mainNavigation}
      settingsNavigation={settingsNavigation}
      savedViews={savedViews}
      header={{
        title: "Kanäle",
        subtitle: "Willkommen zurück, Pilot Test 👋",
        searchPlaceholder: "Suche nach Name, Tag, Kanal, Sprache ...",
        primaryActionLabel: "Kanal vormerken",
        primaryActionHref: "#channels-preview",
      }}
      contactCount={contactCount}
      logoutAction={logout}
    >
      <section
        className={dashboardStyles.moduleCard}
        id="channels-preview"
        aria-labelledby="channels-title"
      >
        <div className={dashboardStyles.moduleHeader}>
          <div>
            <p className={dashboardStyles.eyebrow}>Coming Soon</p>
            <h2 id="channels-title">Kanäle vormerken</h2>
          </div>
          <span>Keine Integration aktiv</span>
        </div>
        <p className={dashboardStyles.moduleText}>
          Diese Seite ist eine MVP-Vorschau. FanMind startet hier keine echte
          Social-Media-Integration, synchronisiert keine Plattformdaten und
          sendet nichts automatisch.
        </p>
        <div className={dashboardStyles.emptyState}>
          <strong>Noch keine Kanäle verbunden.</strong>
          <p>
            Kanäle können aktuell nur als Produktbereich vorgemerkt werden.
            Kontakte auf der Fans-Seite bleiben manuell gepflegte
            Workspace-Daten.
          </p>
        </div>
      </section>
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
