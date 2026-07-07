import { redirect } from "next/navigation";
import { isWorkspaceBillingSuspended } from "@/lib/billing";
import { getPreActivationRedirect } from "@/lib/preActivation";
import { isPlatformAdminEmail } from "@/lib/admin";
import {
  getOpenFollowupCount,
  getSupabaseServerUser,
  getUserWorkspaceDashboard,
  getWorkspaceContacts,
  signOutSupabaseServerSession,
  type WorkspaceDashboardRow,
} from "@/lib/supabase/server";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { getCommercialOptionLabel } from "@/lib/dashboardFeatures";
import { getWorkspaceNavigation } from "@/lib/workspaceNavigation";
import { getWorkspaceReferralSummary, type WorkspaceReferralSummary } from "@/lib/referrals";
import { getWorkspaceKpiStatsFromContacts } from "@/lib/workspaceKpiStats";
import dashboardStyles from "../dashboard/dashboard.module.css";
import { ReferralCopyButton } from "./ReferralCopyButton";

type SettingsWorkspaceProps = {
  workspace: WorkspaceDashboardRow;
  userDisplayName: string;
  contactCount: number;
  openFollowupCount: number;
  showAdminArea: boolean;
  referralSummary: WorkspaceReferralSummary | null;
};

async function logout() {
  "use server";

  await signOutSupabaseServerSession();
  redirect("/");
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
  openFollowupCount,
  showAdminArea,
  referralSummary,
}: SettingsWorkspaceProps) {
  const { mainNavigation, settingsNavigation, savedViews } =
    getWorkspaceNavigation("settings", "de", 0, showAdminArea);
  const userLabel = userDisplayName || workspace.name || "Nutzer";
  const planLabel = workspace.plan_id === "pilot" ? "Pilot / Setup" : workspace.plan_id === "starter" ? "Starter" : workspace.plan_id === "growth" ? "Growth" : "Agency";

  return (
    <WorkspaceShell
      workspaceName={workspace.name}
      userLabel={userLabel}
      planLabel={planLabel}
      planMeta={getCommercialOptionLabel(workspace.commercial_option)}
      planStatus={workspace.plan_id === "starter" ? "Aktiv" : workspace.plan_id === "pilot" ? "Demo" : "Vorschau"}
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
      openFollowupCount={openFollowupCount}
      logoutAction={logout}
    >


      <section
        className={`${dashboardStyles.moduleCard} ${dashboardStyles.referralPanel}`}
        id="referral-growth-window"
        aria-labelledby="referral-growth-window-title"
      >
        <div className={dashboardStyles.referralHeader}>
          <div>
            <p className={dashboardStyles.eyebrow}>Referral Growth Window</p>
            <h2 id="referral-growth-window-title">Referral-Link &amp; Status</h2>
            <p>Link teilen, Attribution erfassen, Billing-Verrechnung bleibt geprüft und manuell.</p>
          </div>
          <span className={dashboardStyles.referralBadge}>{referralSummary?.state?.status ?? "Vorbereitet"}</span>
        </div>
        {referralSummary?.error ? <p className={dashboardStyles.error}>{referralSummary.error}</p> : null}
        <div className={dashboardStyles.referralGrid}>
          <article className={`${dashboardStyles.referralCard} ${dashboardStyles.referralPrimaryCard}`}>
            <span>Referral-Code</span>
            <strong>{referralSummary?.member?.referral_code ?? "Noch nicht verfügbar"}</strong>
            <div className={dashboardStyles.referralMetaRow}>
              <span className={dashboardStyles.referralBadge}>{referralSummary?.member?.status ?? "wird vorbereitet"}</span>
              <ReferralCopyButton value={referralSummary?.member?.referral_code} label="Code kopieren" />
            </div>
          </article>
          <article className={`${dashboardStyles.referralCard} ${dashboardStyles.referralLinkCard}`}>
            <span>Persönlicher Link</span>
            <strong>{referralSummary?.referralUrl ?? "Migration/Service Role prüfen"}</strong>
            <div className={dashboardStyles.referralMetaRow}>
              <small>Füllt den Code bei der Registrierung vor.</small>
              <ReferralCopyButton value={referralSummary?.referralUrl} label="Link kopieren" />
            </div>
          </article>
          <article className={dashboardStyles.referralCard}>
            <span>Aktive Referrals</span>
            <strong>{referralSummary?.activeReferralCount ?? 0} / 20</strong>
            <small>{referralSummary?.discountPercent ?? 0} % Rabatt vorbereitet · nicht automatisch verrechnet.</small>
          </article>
          <article className={dashboardStyles.referralCard}>
            <span>Growth-Window-Cap</span>
            <strong>{referralSummary?.state?.active_paid_workspace_count ?? 0} / {referralSummary?.state?.active_paid_workspace_cap ?? 2000}</strong>
            <small>Neue rabattwirksame Referrals nur solange das Window offen ist.</small>
          </article>
        </div>
      </section>

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
  if (workspaceResult.error?.message === "TEMPORARY_DEMO_DELETED") {
    redirect("/login?demo_deleted=1");
  }

  const workspace = workspaceResult.workspace;
  const preActivationRedirect = getPreActivationRedirect(workspace, data.user.email);
  if (preActivationRedirect) redirect(preActivationRedirect);
  if (isWorkspaceBillingSuspended(workspace)) redirect("/billing/suspended");
  const contactsResult = workspace
    ? await getWorkspaceContacts(workspace.id)
    : null;
  const openFollowupCountResult = workspace
    ? await getOpenFollowupCount(workspace.id)
    : null;
  const referralSummary = workspace
    ? await getWorkspaceReferralSummary(workspace.id, data.user.id)
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
          contactCount={getWorkspaceKpiStatsFromContacts(contactsResult?.contacts ?? []).totalFans}
          openFollowupCount={openFollowupCountResult?.count ?? 0}
          showAdminArea={isPlatformAdminEmail(data.user.email)}
          referralSummary={referralSummary}
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
