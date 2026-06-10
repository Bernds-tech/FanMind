import { redirect } from "next/navigation";
import {
  getSupabaseServerUser,
  getUserWorkspaceDashboard,
  getWorkspaceContacts,
  signOutSupabaseServerSession,
  type SupabaseServerUser,
  type WorkspaceDashboardRow,
} from "@/lib/supabase/server";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { getCommercialOptionLabel } from "@/lib/dashboardFeatures";
import { getWorkspaceNavigation } from "@/lib/workspaceNavigation";
import dashboardStyles from "../../dashboard/dashboard.module.css";

type ProfileWorkspaceProps = {
  workspace: WorkspaceDashboardRow;
  user: SupabaseServerUser;
  userDisplayName: string;
  contactCount: number;
};

type ProfileField = {
  label: string;
  value: string;
  source: "real" | "placeholder";
};

const EMPTY_VALUE = "Noch nicht hinterlegt";

async function logout() {
  "use server";

  await signOutSupabaseServerSession();
  redirect("/login");
}

function getUserDisplayName(
  metadata: Record<string, unknown> | undefined,
): string {
  const displayName = metadata?.display_name ?? metadata?.full_name;

  return typeof displayName === "string" && displayName.trim()
    ? displayName.trim()
    : EMPTY_VALUE;
}

function getSidebarUserLabel(
  userDisplayName: string,
  userEmail: string | undefined,
  workspaceName: string,
): string {
  if (userDisplayName !== EMPTY_VALUE) {
    return userDisplayName;
  }

  return userEmail || workspaceName || "Nutzer";
}

function getPlanLabel(workspace: WorkspaceDashboardRow): string {
  if (
    workspace.plan_id === "pilot" &&
    workspace.commercial_option === "pilot_only"
  ) {
    return "Pilot / Setup";
  }

  return getCommercialOptionLabel(workspace.commercial_option);
}

function getProfileFields(
  user: SupabaseServerUser,
  workspace: WorkspaceDashboardRow,
  userDisplayName: string,
): ProfileField[] {
  const email = typeof user.email === "string" && user.email.trim()
    ? user.email.trim()
    : EMPTY_VALUE;
  const workspaceName = workspace.name?.trim() || EMPTY_VALUE;
  const planLabel = getPlanLabel(workspace);

  return [
    {
      label: "Anzeigename",
      value: userDisplayName,
      source: userDisplayName === EMPTY_VALUE ? "placeholder" : "real",
    },
    {
      label: "E-Mail",
      value: email,
      source: email === EMPTY_VALUE ? "placeholder" : "real",
    },
    {
      label: "Workspace-Name",
      value: workspaceName,
      source: workspaceName === EMPTY_VALUE ? "placeholder" : "real",
    },
    {
      label: "Paket / Plan",
      value: planLabel || EMPTY_VALUE,
      source: planLabel ? "real" : "placeholder",
    },
  ];
}

function ProfileWorkspace({
  workspace,
  user,
  userDisplayName,
  contactCount,
}: ProfileWorkspaceProps) {
  const { mainNavigation, settingsNavigation, savedViews } =
    getWorkspaceNavigation("settings");
  const fields = getProfileFields(user, workspace, userDisplayName);
  const hasOnlyRealValues = fields.every((field) => field.source === "real");
  const userLabel = getSidebarUserLabel(
    userDisplayName,
    user.email,
    workspace.name,
  );

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
        title: "Profil-Einstellungen",
        subtitle: "Willkommen zurück, Pilot Test 👋",
        searchPlaceholder: "Suche nach Profil, Workspace, Paket ...",
        primaryActionLabel: "MVP-Vorschau",
        primaryActionHref: "#user-profile",
      }}
      contactCount={contactCount}
      logoutAction={logout}
    >
      <section
        className={dashboardStyles.moduleCard}
        id="user-profile"
        aria-labelledby="user-profile-title"
      >
        <div className={dashboardStyles.moduleHeader}>
          <div>
            <p className={dashboardStyles.eyebrow}>Profil</p>
            <h2 id="user-profile-title">Nutzerprofil</h2>
          </div>
          <span>{hasOnlyRealValues ? "Echte Kontodaten" : "MVP-Vorschau"}</span>
        </div>
        <p className={dashboardStyles.moduleText}>
          Diese Profilseite zeigt vorhandene Account- und Workspace-Daten aus
          der bestehenden geschützten Sitzung. Bearbeitung, Passwortänderung,
          Rollenverwaltung und Zahlungslogik sind im MVP nicht aktiv.
        </p>
        <dl className={dashboardStyles.profileDetails}>
          {fields.map((field) => (
            <div key={field.label}>
              <dt>{field.label}</dt>
              <dd>{field.value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </WorkspaceShell>
  );
}

export default async function ProfileSettingsPage() {
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
        <ProfileWorkspace
          workspace={workspace}
          user={data.user}
          userDisplayName={getUserDisplayName(data.user.user_metadata)}
          contactCount={contactsResult?.contacts.length ?? 0}
        />
      ) : (
        <section
          className={dashboardStyles.fallbackCard}
          aria-label="FanMind Profil-Einstellungen"
        >
          <div>
            <p className={dashboardStyles.eyebrow}>Profil-Einstellungen</p>
            <h1>Workspace-Status</h1>
            <p>
              Profil-Einstellungen sind geschützt: Supabase Auth ist aktiv. Für
              deinen Account wurde noch kein Workspace gefunden.
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
