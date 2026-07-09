import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { UserPreferenceFallback } from "@/components/UserPreferenceFallback";
import { isPlatformAdminEmail } from "@/lib/admin";
import { getCommercialOptionLabel } from "@/lib/dashboardFeatures";
import { isWorkspaceBillingSuspended } from "@/lib/billing";
import { getPreActivationRedirect } from "@/lib/preActivation";
import { getCustomerBillingTaxNote, listCustomerInvoicesForWorkspace, type CustomerInvoiceSummary } from "@/lib/customerBilling";
import { getOpenFollowupCount, getSupabaseServerUser, getUserWorkspaceDashboard, signOutSupabaseServerSession } from "@/lib/supabase/server";
import { FANMIND_BRIGHTNESS_COOKIE, getUserMetadataBrightness, normalizeFanMindBrightness } from "@/lib/userPreferences";
import { getWorkspaceNavigation } from "@/lib/workspaceNavigation";
import { resolveWorkspaceLocale } from "@/lib/workspaceLocale";
import { wt } from "@/lib/workspaceCopy";
import dashboardStyles from "../dashboard/dashboard.module.css";

export const dynamic = "force-dynamic";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(new Date(value));
}

function formatMoney(cents: number | null, currency: string): string {
  if (typeof cents !== "number") return "—";
  return new Intl.NumberFormat("de-DE", { style: "currency", currency }).format(cents / 100);
}

function planLabel(planId?: string | null): string {
  if (planId === "pilot") return "Pilot / Setup";
  if (planId === "starter") return "Starter";
  if (planId === "growth") return "Growth";
  return "Agency";
}

async function logout() {
  "use server";
  await signOutSupabaseServerSession();
  redirect("/");
}

function InvoiceCard({ invoice, taxNote }: { invoice: CustomerInvoiceSummary; taxNote: string | null }) {
  return (
    <article className={dashboardStyles.moduleCard} aria-labelledby={`invoice-${invoice.id}`}>
      <div className={dashboardStyles.compactModuleHeader}>
        <div>
          <p className={dashboardStyles.eyebrow}>Rechnung</p>
          <h2 id={`invoice-${invoice.id}`}>{invoice.number ?? invoice.id}</h2>
        </div>
        <span>{invoice.status ?? "Status offen"}</span>
      </div>
      <div className={dashboardStyles.referralGrid}>
        <div className={dashboardStyles.referralCard}><span>Stripe Invoice ID</span><strong>{invoice.id}</strong></div>
        <div className={dashboardStyles.referralCard}><span>Datum</span><strong>{formatDate(invoice.created)}</strong></div>
        <div className={dashboardStyles.referralCard}><span>Betrag fällig</span><strong>{formatMoney(invoice.amountDue, invoice.currency)}</strong></div>
        <div className={dashboardStyles.referralCard}><span>Betrag bezahlt</span><strong>{formatMoney(invoice.amountPaid, invoice.currency)}</strong></div>
        <div className={dashboardStyles.referralCard}><span>Netto</span><strong>{formatMoney(invoice.subtotal, invoice.currency)}</strong></div>
        <div className={dashboardStyles.referralCard}><span>Steuer</span><strong>{formatMoney(invoice.tax, invoice.currency)}</strong></div>
        <div className={dashboardStyles.referralCard}><span>Brutto</span><strong>{formatMoney(invoice.total, invoice.currency)}</strong></div>
      </div>
      {taxNote ? <p className={dashboardStyles.compactInfoLine}>{taxNote}</p> : null}
      <div className={dashboardStyles.referralMetaRow}>
        {invoice.hostedInvoiceUrl ? <a className={dashboardStyles.primaryButton} href={invoice.hostedInvoiceUrl} target="_blank" rel="noreferrer">Rechnung öffnen</a> : null}
        {invoice.invoicePdf ? <a className={dashboardStyles.secondaryButton} href={invoice.invoicePdf} target="_blank" rel="noreferrer">PDF herunterladen</a> : null}
      </div>
    </article>
  );
}

export default async function BillingPage() {
  const { data } = await getSupabaseServerUser();
  if (!data.user) redirect("/login?returnTo=/billing");

  const locale = await resolveWorkspaceLocale({ user: data.user });
  const cookieStore = await cookies();
  const brightness = getUserMetadataBrightness(data.user) ?? normalizeFanMindBrightness(cookieStore.get(FANMIND_BRIGHTNESS_COOKIE)?.value);
  const workspaceResult = await getUserWorkspaceDashboard(data.user);
  if (workspaceResult.error?.message === "TEMPORARY_DEMO_DELETED") redirect("/login?demo_deleted=1");
  const workspace = workspaceResult.workspace;
  const preActivationRedirect = getPreActivationRedirect(workspace, data.user.email);
  if (preActivationRedirect && preActivationRedirect !== "/billing/start") redirect(preActivationRedirect);
  if (isWorkspaceBillingSuspended(workspace)) redirect("/billing/suspended");
  if (!workspace) redirect("/workspace/setup");

  const [openFollowupCountResult, invoiceResult] = await Promise.all([
    getOpenFollowupCount(workspace.id),
    listCustomerInvoicesForWorkspace(workspace),
  ]);
  const { mainNavigation, settingsNavigation, savedViews } = getWorkspaceNavigation("billing", locale, openFollowupCountResult.count ?? 0, isPlatformAdminEmail(data.user.email));
  const taxNote = getCustomerBillingTaxNote();

  return (
    <main className={dashboardStyles.page}>
      <UserPreferenceFallback locale={locale} brightness={brightness} />
      <WorkspaceShell
        workspaceName={workspace.name}
        userLabel={data.user.email ?? workspace.name}
        planLabel={planLabel(workspace.plan_id)}
        planMeta={getCommercialOptionLabel(workspace.commercial_option)}
        planStatus={workspace.billing_status ?? wt(locale, "Aktiv")}
        mainNavigation={mainNavigation}
        settingsNavigation={settingsNavigation}
        savedViews={savedViews}
        header={{ title: "Rechnungen & Billing", subtitle: "Öffne und lade deine FanMind-Rechnungen direkt aus deinem Workspace.", searchPlaceholder: "Rechnung, Status, Betrag ...", primaryActionLabel: "Zahlungsstatus ansehen", primaryActionHref: "/billing/start" }}
        contactCount={0}
        openFollowupCount={openFollowupCountResult.count ?? 0}
        logoutAction={logout}
        locale={locale}
      >
        <section className={dashboardStyles.moduleCard} aria-labelledby="billing-overview-title">
          <div className={dashboardStyles.compactModuleHeader}>
            <div>
              <p className={dashboardStyles.eyebrow}>Kundenbereich</p>
              <h2 id="billing-overview-title">Dein Rechnungsarchiv</h2>
            </div>
            <span>{workspace.name}</span>
          </div>
          <p className={dashboardStyles.compactInfoLine}>Stripe wird ausschließlich serverseitig mit dem Secret Key abgefragt. FanMind speichert hier keine Kartendaten, keine BIC und keine externen Zahlungszugänge.</p>
          {invoiceResult.error ? <p className={dashboardStyles.error}>{invoiceResult.error}</p> : null}
        </section>

        {invoiceResult.invoices.length ? invoiceResult.invoices.map((invoice) => <InvoiceCard key={invoice.id} invoice={invoice} taxNote={taxNote} />) : (
          <section className={dashboardStyles.moduleCard}>
            <div className={dashboardStyles.compactModuleHeader}><div><p className={dashboardStyles.eyebrow}>Noch leer</p><h2>Keine Rechnungen gefunden</h2></div><span>Stripe</span></div>
            <p className={dashboardStyles.compactInfoLine}>Für diesen Workspace liegen noch keine Stripe-Rechnungen vor oder der Stripe-Customer ist noch nicht verknüpft.</p>
            <Link className={dashboardStyles.secondaryButton} href="/settings">Zurück zu Einstellungen</Link>
          </section>
        )}
      </WorkspaceShell>
    </main>
  );
}
