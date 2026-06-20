import { redirect } from "next/navigation";
import {
  checkMetaWebhookStorageHealth,
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
import { getWorkspaceKpiStatsFromContacts } from "@/lib/workspaceKpiStats";
import dashboardStyles from "../dashboard/dashboard.module.css";
import { ChannelsGrid } from "./ChannelsGrid";

type SafeFacebookConnection = Pick<
  SocialConnectionRow,
  "page_name" | "page_id" | "webhook_subscribed" | "last_event_at" | "scopes" | "last_comment_fetch_at" | "last_comment_fetch_count" | "last_comment_fetch_error" | "last_messenger_sync_at" | "last_messenger_sync_checked_count" | "last_messenger_sync_imported_inbound_count" | "last_messenger_sync_imported_outbound_count" | "last_messenger_sync_imported_media_count" | "last_messenger_sync_skipped_count" | "last_messenger_sync_error" | "last_messenger_sync_outbound_at"
> & { has_page_access_token: boolean };

type FacebookLiveSetupStatus = {
  facebookAppIdConfigured: boolean;
  facebookAppSecretConfigured: boolean;
  webhookVerifyTokenConfigured: boolean;
  publicBaseUrlConfigured: boolean;
  metaBusinessIdConfigured: boolean;
  oauthCallbackUrl: string | null;
};

type ChannelsWorkspaceProps = {
  workspace: WorkspaceDashboardRow;
  userDisplayName: string;
  contactCount: number;
  facebookConnection: SafeFacebookConnection | null;
  facebookError?: boolean;
  metaWebhookEvents: MetaWebhookEventRow[];
  metaWebhookError?: string | null;
  metaWebhookStorageHealth: {
    serviceRoleConfigured: boolean;
    tableReadable: boolean;
    error: string | null;
  };
  facebookLiveSetupStatus: FacebookLiveSetupStatus;
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
  metaWebhookStorageHealth,
  facebookLiveSetupStatus,
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
        metaWebhookStorageHealth={metaWebhookStorageHealth}
        facebookLiveSetupStatus={facebookLiveSetupStatus}
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
  const metaWebhookStorageHealthResult = workspace
    ? await checkMetaWebhookStorageHealth()
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
          contactCount={getWorkspaceKpiStatsFromContacts(contactsResult?.contacts ?? []).totalFans}
          facebookConnection={facebookConnection ? {
            page_name: facebookConnection.page_name,
            page_id: facebookConnection.page_id,
            webhook_subscribed: facebookConnection.webhook_subscribed,
            last_event_at: facebookConnection.last_event_at,
            has_page_access_token: Boolean(facebookConnection.page_access_token_encrypted),
            scopes: facebookConnection.scopes ?? [],
            last_comment_fetch_at: facebookConnection.last_comment_fetch_at,
            last_comment_fetch_count: facebookConnection.last_comment_fetch_count,
            last_comment_fetch_error: facebookConnection.last_comment_fetch_error,
            last_messenger_sync_at: facebookConnection.last_messenger_sync_at,
            last_messenger_sync_checked_count: facebookConnection.last_messenger_sync_checked_count,
            last_messenger_sync_imported_inbound_count: facebookConnection.last_messenger_sync_imported_inbound_count,
            last_messenger_sync_imported_outbound_count: facebookConnection.last_messenger_sync_imported_outbound_count,
            last_messenger_sync_imported_media_count: facebookConnection.last_messenger_sync_imported_media_count,
            last_messenger_sync_skipped_count: facebookConnection.last_messenger_sync_skipped_count,
            last_messenger_sync_error: facebookConnection.last_messenger_sync_error,
            last_messenger_sync_outbound_at: facebookConnection.last_messenger_sync_outbound_at,
          } : null}
          facebookError={Boolean(params.facebook_error)}
          metaWebhookEvents={metaWebhookEventsResult?.events ?? []}
          metaWebhookError={metaWebhookEventsResult?.error?.message ?? null}
          metaWebhookStorageHealth={{
            serviceRoleConfigured:
              metaWebhookStorageHealthResult?.serviceRoleConfigured ?? false,
            tableReadable: metaWebhookStorageHealthResult?.tableReadable ?? false,
            error: metaWebhookStorageHealthResult?.error?.message ?? null,
          }}
          facebookLiveSetupStatus={getFacebookLiveSetupStatus()}
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

function getFacebookLiveSetupStatus(): FacebookLiveSetupStatus {
  const publicBaseUrl = firstConfiguredEnv("NEXT_PUBLIC_APP_URL", "FANMIND_APP_URL");
  const explicitCallbackUrl = firstConfiguredEnv("FACEBOOK_REDIRECT_URI", "META_REDIRECT_URI");
  const oauthCallbackUrl = explicitCallbackUrl ?? (publicBaseUrl ? `${publicBaseUrl.replace(/\/$/, "")}/api/integrations/facebook/callback` : null);

  return {
    facebookAppIdConfigured: Boolean(firstConfiguredEnv("FACEBOOK_APP_ID", "META_APP_ID")),
    facebookAppSecretConfigured: Boolean(firstConfiguredEnv("FACEBOOK_APP_SECRET", "META_APP_SECRET", "META_WEBHOOK_APP_SECRET")),
    webhookVerifyTokenConfigured: Boolean(firstConfiguredEnv("FACEBOOK_WEBHOOK_VERIFY_TOKEN", "META_WEBHOOK_VERIFY_TOKEN")),
    publicBaseUrlConfigured: Boolean(publicBaseUrl),
    metaBusinessIdConfigured: Boolean(firstConfiguredEnv("META_BUSINESS_ID", "NEXT_PUBLIC_META_BUSINESS_ID")),
    oauthCallbackUrl,
  };
}

function firstConfiguredEnv(...names: string[]): string | null {
  for (const name of names) {
    const value = process.env[name];
    if (value?.trim()) return value.trim();
  }
  return null;
}
