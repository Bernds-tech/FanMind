import { redirect } from "next/navigation";
import { isWorkspaceBillingSuspended } from "@/lib/billing";
import { getPreActivationRedirect } from "@/lib/preActivation";
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
import { getCustomerBillingTaxNote, listCustomerInvoicesForWorkspace, type CustomerInvoiceSummary } from "@/lib/customerBilling";
import { isPlatformAdminEmail } from "@/lib/admin";
import { getWorkspaceNavigation } from "@/lib/workspaceNavigation";
import { getWorkspaceKpiStatsFromContacts } from "@/lib/workspaceKpiStats";
import dashboardStyles from "../dashboard/dashboard.module.css";
import profileStyles from "./profile/profile.module.css";
import {
  type SettingsAccountPage,
  getPlanLabel,
  getProfileFields,
  getSettingsAccountPageHref,
  getSettingsAccountPageTitle,
  InvoicesSettingsSection,
  PackageSettingsSection,
  ProfileSettingsSection,
  SettingsHeaderBar,
} from "./AccountSections";

type AccountWorkspaceProps = {
  workspace: WorkspaceDashboardRow;
  user: SupabaseServerUser;
  activePage: SettingsAccountPage;
  userDisplayName: string;
  contactCount: number;
  openFollowupCount: number;
  showAdminArea: boolean;
  invoices: CustomerInvoiceSummary[];
  invoiceError: string | null;
  taxNote: string | null;
};

const EMPTY_VALUE = "Noch nicht hinterlegt";

async function logout() {
  "use server";

  await signOutSupabaseServerSession();
  redirect("/");
}

function getUserDisplayName(metadata: Record<string, unknown> | undefined): string {
  const displayName = metadata?.display_name ?? metadata?.full_name;
  return typeof displayName === "string" && displayName.trim() ? displayName.trim() : EMPTY_VALUE;
}

function getSidebarUserLabel(userDisplayName: string, userEmail: string | undefined, workspaceName: string): string {
  return userDisplayName !== EMPTY_VALUE ? userDisplayName : userEmail || workspaceName || "Nutzer";
}

function AccountWorkspace({ workspace, user, activePage, userDisplayName, contactCount, openFollowupCount, showAdminArea, invoices, invoiceError, taxNote }: AccountWorkspaceProps) {
  const { mainNavigation, settingsNavigation, savedViews } = getWorkspaceNavigation("settings", "de", 0, showAdminArea);
  const fields = getProfileFields(user, workspace, userDisplayName);
  const hasOnlyRealValues = fields.every((field) => field.source === "real");
  const userLabel = getSidebarUserLabel(userDisplayName, user.email, workspace.name);
  const pageTitle = getSettingsAccountPageTitle(activePage);

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
        title: pageTitle,
        subtitle: "Kompakter CRM-Kontobereich mit getrennten Seiten für Profil, Paket und Rechnungen.",
        searchPlaceholder: "Suche nach Profil, Workspace, Paket ...",
        primaryActionLabel: activePage === "invoices" ? "Rechnungen" : pageTitle,
        primaryActionHref: getSettingsAccountPageHref(activePage),
      }}
      contactCount={contactCount}
      openFollowupCount={openFollowupCount}
      logoutAction={logout}
    >
      <div className={profileStyles.profileStack}>
        <SettingsHeaderBar activePage={activePage} />
        {activePage === "profile" ? <ProfileSettingsSection fields={fields} hasOnlyRealValues={hasOnlyRealValues} logoutAction={logout} /> : null}
        {activePage === "package" ? <PackageSettingsSection workspace={workspace} /> : null}
        {activePage === "invoices" ? <InvoicesSettingsSection workspace={workspace} invoices={invoices} invoiceError={invoiceError} taxNote={taxNote} /> : null}
      </div>
    </WorkspaceShell>
  );
}

export async function renderSettingsAccountPage(activePage: SettingsAccountPage) {
  const { data, error: userError } = await getSupabaseServerUser();
  if (!data.user) redirect("/login");

  const workspaceResult = await getUserWorkspaceDashboard(data.user);
  if (workspaceResult.error?.message === "TEMPORARY_DEMO_DELETED") redirect("/login?demo_deleted=1");

  const workspace = workspaceResult.workspace;
  const preActivationRedirect = getPreActivationRedirect(workspace, data.user.email);
  if (preActivationRedirect) redirect(preActivationRedirect);
  if (isWorkspaceBillingSuspended(workspace)) redirect("/billing/suspended");

  const contactsResult = workspace ? await getWorkspaceContacts(workspace.id) : null;
  const openFollowupCountResult = workspace ? await getOpenFollowupCount(workspace.id) : null;
  const invoiceResult = workspace && activePage === "invoices" ? await listCustomerInvoicesForWorkspace(workspace) : { invoices: [], error: null };

  return (
    <main className={dashboardStyles.page}>
      {workspace ? (
        <AccountWorkspace
          workspace={workspace}
          user={data.user}
          activePage={activePage}
          userDisplayName={getUserDisplayName(data.user.user_metadata)}
          contactCount={getWorkspaceKpiStatsFromContacts(contactsResult?.contacts ?? []).totalFans}
          openFollowupCount={openFollowupCountResult?.count ?? 0}
          showAdminArea={isPlatformAdminEmail(data.user.email)}
          invoices={invoiceResult.invoices}
          invoiceError={invoiceResult.error}
          taxNote={activePage === "invoices" ? getCustomerBillingTaxNote() : null}
        />
      ) : (
        <section className={dashboardStyles.fallbackCard} aria-label="FanMind Profil-Einstellungen">
          <div>
            <p className={dashboardStyles.eyebrow}>Profil-Einstellungen</p>
            <h1>Workspace-Status</h1>
            <p>Profil-Einstellungen sind geschützt: Supabase Auth ist aktiv. Für deinen Account wurde noch kein Workspace gefunden.</p>
          </div>
          {userError ? <p className={dashboardStyles.error}><strong>Supabase-Session konnte nicht vollständig geprüft werden.</strong><span>{userError.message}</span></p> : null}
          {workspaceResult.error ? <p className={dashboardStyles.error}><strong>Workspace-Daten konnten nicht geladen werden.</strong><span>{workspaceResult.error.message}</span></p> : null}
          <form action={logout}><button type="submit" className={dashboardStyles.secondaryButton}>Abmelden</button></form>
        </section>
      )}
    </main>
  );
}
