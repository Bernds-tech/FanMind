import { redirect } from "next/navigation";
import {
  getBillingCheckoutActionLabel,
  getBillingStatusLabel,
  isWorkspaceBillingSuspended,
  shouldShowBillingCheckoutAction,
} from "@/lib/billing";
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
import { BillingCheckoutButton } from "@/components/BillingCheckoutButton";
import { getCustomerBillingTaxNote, listCustomerInvoicesForWorkspace, type CustomerInvoiceSummary } from "@/lib/customerBilling";
import { isPlatformAdminEmail } from "@/lib/admin";
import { getWorkspaceNavigation } from "@/lib/workspaceNavigation";
import { getWorkspaceKpiStatsFromContacts } from "@/lib/workspaceKpiStats";
import dashboardStyles from "../../dashboard/dashboard.module.css";
import profileStyles from "./profile.module.css";

type ProfileWorkspaceProps = {
  workspace: WorkspaceDashboardRow;
  user: SupabaseServerUser;
  userDisplayName: string;
  contactCount: number;
  openFollowupCount: number;
  showAdminArea: boolean;
  invoices: CustomerInvoiceSummary[];
  invoiceError: string | null;
  taxNote: string | null;
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
  redirect("/");
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

function getBillingProfileStatusLabel(workspace: WorkspaceDashboardRow): string {
  if (workspace.billing_status === "demo_free" && (workspace.plan_id === "pilot" || workspace.plan_id === "starter")) {
    return workspace.monthly_fee_cents || workspace.setup_fee_cents
      ? "Testmodus"
      : "Noch nicht abgerechnet";
  }

  if (workspace.billing_status === "pending_payment_setup") {
    return "Setup vorbereitet";
  }

  return getBillingStatusLabel(workspace.billing_status);
}

function getBillingChipClass(status: string | null | undefined): string {
  if (status === "active") return profileStyles.statusChip;
  if (["past_due", "payment_failed", "suspended", "manual_suspended"].includes(status ?? "")) {
    return profileStyles.warningChip;
  }

  return profileStyles.softChip;
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
  invoices,
  invoiceError,
  taxNote,
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
        title: "Profil & Konto",
        subtitle: "Dein zentraler Bereich für Profil, Workspace, Paket, Billing und Rechnungen.",
        searchPlaceholder: "Suche nach Profil, Workspace, Paket ...",
        primaryActionLabel: "MVP-Vorschau",
        primaryActionHref: "#user-profile",
      }}
      contactCount={contactCount}
      openFollowupCount={openFollowupCount}
      logoutAction={logout}
    >
      <div className={profileStyles.profileStack}>
        <section
          className={profileStyles.compactCard}
          id="user-profile"
          aria-labelledby="user-profile-title"
        >
          <div className={profileStyles.cardHeader}>
            <div>
              <p className={dashboardStyles.eyebrow}>Profil</p>
              <h2 id="user-profile-title">Nutzerprofil</h2>
            </div>
            <span className={profileStyles.softChip}>
              {hasOnlyRealValues ? "Kontodaten" : "Unvollständig"}
            </span>
          </div>
          <p className={profileStyles.headerCopy}>
            Account-Daten aus der geschützten Sitzung. Konto, Billing und Rechnungsarchiv sind hier zentral zusammengeführt.
          </p>
          <dl className={profileStyles.infoGrid}>
            {fields.map((field) => (
              <div className={profileStyles.infoItem} key={field.label}>
                <dt>{field.label}</dt>
                <dd className={field.source === "placeholder" ? profileStyles.placeholderValue : undefined}>
                  {field.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className={profileStyles.compactCard} id="billing" aria-labelledby="billing-profile-title">
          <div className={profileStyles.cardHeader}>
            <div>
              <p className={dashboardStyles.eyebrow}>Billing</p>
              <h2 id="billing-profile-title">Paket & Rechnungen</h2>
            </div>
            <span className={getBillingChipClass(workspace.billing_status)}>
              {getBillingProfileStatusLabel(workspace)}
            </span>
          </div>
          <dl className={profileStyles.billingGrid}>
            <div className={`${profileStyles.billingItem} ${profileStyles.billingItemWide}`}><dt>Workspace / Plan</dt><dd>{workspace.name} · {getPlanLabel(workspace)}</dd></div>
            <div className={profileStyles.billingItem}><dt>Commercial Option</dt><dd>{getCommercialOptionLabel(workspace.commercial_option)}</dd></div>
            <div className={profileStyles.billingItem}><dt>Monatlich</dt><dd>{formatMoney(workspace.monthly_fee_cents)}</dd></div>
            <div className={profileStyles.billingItem}><dt>Setup Fee</dt><dd>{formatMoney(workspace.setup_fee_cents)}</dd></div>
            <div className={profileStyles.billingItem}><dt>Bindung</dt><dd>{workspace.commitment_months ? `${workspace.commitment_months} Monate` : "Keine feste Bindung"}</dd></div>
            <div className={profileStyles.billingItem}><dt>Sperrstatus</dt><dd>{workspace.billing_status === "suspended" || workspace.billing_status === "manual_suspended" ? getBillingStatusLabel(workspace.billing_status) : "Nicht gesperrt"}</dd></div>
            <div className={profileStyles.billingItem}><dt>Letzte Zahlung</dt><dd>{workspace.billing_last_payment_at ? formatDate(workspace.billing_last_payment_at) : "Noch keine Zahlung erfasst."}</dd></div>
            <div className={`${profileStyles.invoicePanel} ${profileStyles.billingItemWide}`}>
              <p className={profileStyles.invoiceLabel}>Letzte Rechnung</p>
              {workspace.last_invoice_id || workspace.last_invoice_status ? (
                <div className={profileStyles.invoiceRow}>
                  <p className={profileStyles.invoiceValue}>
                    {workspace.last_invoice_status ?? "Status offen"} · {formatMoney(workspace.last_invoice_amount_due_cents)}
                  </p>
                  <div className={profileStyles.invoiceLinks}>
                    {workspace.last_invoice_hosted_url ? <a href={workspace.last_invoice_hosted_url} target="_blank" rel="noreferrer">Rechnung öffnen</a> : null}
                    {workspace.last_invoice_pdf_url ? <a href={workspace.last_invoice_pdf_url} target="_blank" rel="noreferrer">PDF öffnen</a> : null}
                  </div>
                </div>
              ) : (
                <p className={profileStyles.invoiceValue}>Noch keine Rechnung vorhanden.</p>
              )}
            </div>
          </dl>
          <div className={profileStyles.planManagement}>
            <div>
              <p className={profileStyles.invoiceLabel}>Paket wechseln / Zusatzpakete</p>
              <p className={profileStyles.invoiceValue}>Starter Flex und Starter 12 Monate sind vorbereitet. Growth, Agency und Enterprise bleiben Coming Soon / auf Anfrage.</p>
            </div>
            <div className={profileStyles.invoiceLinks}>
              {shouldShowBillingCheckoutAction(workspace) ? (
                <BillingCheckoutButton
                  planId={workspace.plan_id}
                  commercialOption={workspace.commercial_option}
                  label={getBillingCheckoutActionLabel(workspace.billing_status)}
                />
              ) : null}
              <a href="/billing/start">Paketoptionen ansehen</a>
            </div>
          </div>
        </section>

        <section className={profileStyles.compactCard} id="invoices" aria-labelledby="invoice-archive-title">
          <div className={profileStyles.cardHeader}>
            <div>
              <p className={dashboardStyles.eyebrow}>Rechnungen</p>
              <h2 id="invoice-archive-title">Rechnungsarchiv</h2>
            </div>
            <span className={profileStyles.softChip}>Stripe</span>
          </div>
          <p className={profileStyles.headerCopy}>Rechnungen werden serverseitig für deinen Workspace geladen. Du kannst sie öffnen, als PDF herunterladen und den Zahlungsstatus prüfen.</p>
          {invoiceError ? <p className={dashboardStyles.error}>{invoiceError}</p> : null}
          {taxNote ? <p className={profileStyles.taxNote}>{taxNote}</p> : null}
          <div className={profileStyles.invoiceArchive}>
            {invoices.length ? invoices.map((invoice) => (
              <article className={profileStyles.invoiceArchiveItem} key={invoice.id}>
                <div>
                  <p className={profileStyles.invoiceLabel}>{invoice.number ?? invoice.id}</p>
                  <p className={profileStyles.invoiceValue}>{formatDate(invoice.created)} · {formatMoney(invoice.total)} · {invoice.status ?? "Status offen"}</p>
                </div>
                <div className={profileStyles.invoiceLinks}>
                  {invoice.hostedInvoiceUrl ? <a href={invoice.hostedInvoiceUrl} target="_blank" rel="noreferrer">Rechnung öffnen</a> : null}
                  {invoice.invoicePdf ? <a href={invoice.invoicePdf} target="_blank" rel="noreferrer">PDF herunterladen</a> : null}
                </div>
              </article>
            )) : (
              <div className={profileStyles.invoiceArchiveItem}>
                <div>
                  <p className={profileStyles.invoiceLabel}>Noch leer</p>
                  <p className={profileStyles.invoiceValue}>Für diesen Workspace liegen noch keine Stripe-Rechnungen vor oder der Stripe-Customer ist noch nicht verknüpft.</p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className={profileStyles.compactCard} aria-labelledby="logout-title">
          <div className={profileStyles.cardHeader}>
            <div>
              <p className={dashboardStyles.eyebrow}>Sitzung</p>
              <h2 id="logout-title">Logout</h2>
            </div>
          </div>
          <form action={logout} className={profileStyles.actionRow}>
            <button type="submit" className={dashboardStyles.secondaryButton}>Abmelden</button>
          </form>
        </section>
      </div>
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
  const preActivationRedirect = getPreActivationRedirect(workspace, data.user.email);
  if (preActivationRedirect) redirect(preActivationRedirect);
  if (isWorkspaceBillingSuspended(workspace)) redirect("/billing/suspended");
  const contactsResult = workspace
    ? await getWorkspaceContacts(workspace.id)
    : null;
  const openFollowupCountResult = workspace
    ? await getOpenFollowupCount(workspace.id)
    : null;
  const invoiceResult = workspace
    ? await listCustomerInvoicesForWorkspace(workspace)
    : { invoices: [], error: null };

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
          invoices={invoiceResult.invoices}
          invoiceError={invoiceResult.error}
          taxNote={getCustomerBillingTaxNote()}
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
