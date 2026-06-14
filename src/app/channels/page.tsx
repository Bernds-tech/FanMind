import { redirect } from "next/navigation";
import {
  getSupabaseServerUser,
  getUserWorkspaceDashboard,
  getWorkspaceContacts,
  getWorkspaceMetaWebhookEvents,
  getWorkspaceSocialConnections,
  signOutSupabaseServerSession,
  type MetaWebhookEventRow,
  type SocialConnectionRow,
  type WorkspaceDashboardRow,
} from "@/lib/supabase/server";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { getWorkspaceNavigation } from "@/lib/workspaceNavigation";
import dashboardStyles from "../dashboard/dashboard.module.css";
import { ChannelsGrid } from "./ChannelsGrid";

type ChannelsWorkspaceProps = {
  workspace: WorkspaceDashboardRow;
  userDisplayName: string;
  contactCount: number;
  facebookConnection: SocialConnectionRow | null;
  facebookError?: boolean;
  metaWebhookEvents: MetaWebhookEventRow[];
  metaWebhookError?: string | null;
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
  facebookConnection,
  facebookError,
  metaWebhookEvents,
  metaWebhookError,
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
      <ChannelsGrid
        facebookConnection={facebookConnection}
        facebookError={facebookError}
        metaWebhookEvents={metaWebhookEvents}
        metaWebhookError={metaWebhookError}
      />
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

export default async function ChannelsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const { data, error: userError } = await getSupabaseServerUser();

  if (!data.user) {
    redirect("/login");
  }

  const workspaceResult = await getUserWorkspaceDashboard(data.user);
  const workspace = workspaceResult.workspace;
  const contactsResult = workspace
    ? await getWorkspaceContacts(workspace.id)
    : null;
  const socialConnectionsResult = workspace
    ? await getWorkspaceSocialConnections(workspace.id)
    : null;
  const metaWebhookEventsResult = workspace
    ? await getWorkspaceMetaWebhookEvents(workspace.id, 20)
    : null;
  const facebookConnection =
    socialConnectionsResult?.connections.find(
      (connection) =>
        connection.platform === "facebook" && connection.status === "connected",
    ) ?? null;

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
          facebookConnection={facebookConnection}
          facebookError={Boolean(params.facebook_error)}
          metaWebhookEvents={metaWebhookEventsResult?.events ?? []}
          metaWebhookError={metaWebhookEventsResult?.error?.message ?? null}
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
