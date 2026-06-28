import { redirect } from "next/navigation";
import { getBillingStatusLabel, isWorkspaceBillingSuspended } from "@/lib/billing";
import {
  getOpenFollowupCount,
  getSupabaseServerUser,
  getUserWorkspaceDashboard,
  getWorkspaceContacts,
  signOutSupabaseServerSession,
  type SupabaseServerUser,
  type WorkspaceDashboardRow,
} from "@/lib/supabase/server";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { getCommercialOptionLabel } from "@/lib/dashboardFeatures";
import { BillingCheckoutButton } from "@/components/BillingCheckoutButton";
import { isPlatformAdminEmail } from "@/lib/admin";
import { getWorkspaceNavigation } from "@/lib/workspaceNavigation";
import { getWorkspaceKpiStatsFromContacts } from "@/lib/workspaceKpiStats";
import dashboardStyles from "../../dashboard/dashboard.module.css";

type ProfileWorkspaceProps = {
  workspace: WorkspaceDashboardRow;
  user: SupabaseServerUser;
  userDisplayName: string;
  contactCount: number;
  openFollowupCount: number;
  showAdminArea: boolean;
};

type ProfileField = {
  label: string;
  value: string;
  source: "real" | "placeholder";
};

const EMPTY_VALUE = "Noch nicht hinterlegt";

function formatMoney(cents?: number | null): string {
  return typeof cents === "number" ? (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" }) : "—";
}

function formatDate(value?: string | null): string {
  return value ? new Date(value).toLocaleDateString("de-DE") : "—";
}

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
  openFollowupCount,
  showAdminArea,
}: ProfileWorkspaceProps) {
  const { mainNavigation, settingsNavigation, savedViews } =
    getWorkspaceNavigation("settings", "de", 0, showAdminArea);
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
      planLabel={getPlanLabel(workspace)}
      planMeta={getCommercialOptionLabel(workspace.commercial_option)}
      planStatus={workspace.plan_id === "starter" ? "Aktiv" : workspace.plan_id === "pilot" ? "Demo" : "Vorschau"}
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
      openFollowupCount={openFollowupCount}
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
      <section className={dashboardStyles.moduleCard} aria-labelledby="billing-profile-title">
        <div className={dashboardStyles.moduleHeader}>
          <div>
            <p className={dashboardStyles.eyebrow}>Billing</p>
            <h2 id="billing-profile-title">Paket & Rechnungen</h2>
          </div>
          <span>{getBillingStatusLabel(workspace.billing_status)}</span>
        </div>
        <dl className={dashboardStyles.profileDetails}>
          <div><dt>Aktueller Workspace/Plan</dt><dd>{workspace.name} · {getPlanLabel(workspace)}</dd></div>
          <div><dt>Commercial Option</dt><dd>{getCommercialOptionLabel(workspace.commercial_option)}</dd></div>
          <div><dt>Monatlicher Betrag</dt><dd>{formatMoney(workspace.monthly_fee_cents)}</dd></div>
          <div><dt>Setup Fee</dt><dd>{formatMoney(workspace.setup_fee_cents)}</dd></div>
          <div><dt>Bindung/Laufzeit</dt><dd>{workspace.commitment_months ? `${workspace.commitment_months} Monate` : "Keine feste Bindung"}</dd></div>
          <div><dt>Letzte Zahlung</dt><dd>{formatDate(workspace.billing_last_payment_at)}</dd></div>
          <div><dt>Sperrstatus</dt><dd>{workspace.billing_status === "suspended" || workspace.billing_status === "manual_suspended" ? getBillingStatusLabel(workspace.billing_status) : "nicht gesperrt"}</dd></div>
        </dl>
        <div style={{ marginTop: 16 }}>
          <h3>Letzte Rechnung</h3>
          {workspace.last_invoice_id || workspace.last_invoice_status ? (
            <p>Status: {workspace.last_invoice_status ?? "—"} · Betrag: {formatMoney(workspace.last_invoice_amount_due_cents)}<br />
              {workspace.last_invoice_hosted_url ? <a href={workspace.last_invoice_hosted_url} target="_blank" rel="noreferrer">Rechnung öffnen</a> : null}
              {workspace.last_invoice_pdf_url ? <> · <a href={workspace.last_invoice_pdf_url} target="_blank" rel="noreferrer">PDF öffnen</a></> : null}
            </p>
          ) : <p>Noch keine Rechnung vorhanden.</p>}
        </div>
        {["pending_payment_setup", "past_due", "payment_failed", "suspended"].includes(workspace.billing_status ?? "") ? (
          <BillingCheckoutButton planId={workspace.plan_id} commercialOption={workspace.commercial_option} label={workspace.billing_status === "pending_payment_setup" ? "Zahlung starten" : "Zahlung erneut versuchen"} />
        ) : null}
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
  if (workspaceResult.error?.message === "TEMPORARY_DEMO_DELETED") {
    redirect("/login?demo_deleted=1");
  }

  const workspace = workspaceResult.workspace;
  if (isWorkspaceBillingSuspended(workspace)) redirect("/billing/suspended");
  const contactsResult = workspace
    ? await getWorkspaceContacts(workspace.id)
    : null;
  const openFollowupCountResult = workspace
    ? await getOpenFollowupCount(workspace.id)
    : null;

  return (
    <main className={dashboardStyles.page}>
      {workspace ? (
        <ProfileWorkspace
          workspace={workspace}
          user={data.user}
          userDisplayName={getUserDisplayName(data.user.user_metadata)}
          contactCount={getWorkspaceKpiStatsFromContacts(contactsResult?.contacts ?? []).totalFans}
          openFollowupCount={openFollowupCountResult?.count ?? 0}
          showAdminArea={isPlatformAdminEmail(data.user.email)}
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
