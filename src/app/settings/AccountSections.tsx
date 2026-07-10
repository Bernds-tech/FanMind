import Link from "next/link";
import { BillingCheckoutButton } from "@/components/BillingCheckoutButton";
import {
  getBillingCheckoutActionLabel,
  getBillingStatusLabel,
  shouldShowBillingCheckoutAction,
} from "@/lib/billing";
import { getCommercialOptionLabel } from "@/lib/dashboardFeatures";
import type { CustomerInvoiceSummary } from "@/lib/customerBilling";
import type { SupabaseServerUser, WorkspaceDashboardRow } from "@/lib/supabase/server";
import dashboardStyles from "../dashboard/dashboard.module.css";
import profileStyles from "./profile/profile.module.css";
export type SettingsAccountPage = "profile" | "package" | "invoices";
export type ProfileField = { label: string; value: string; source: "real" | "placeholder" };

export const SETTINGS_ACCOUNT_TABS: Array<{ key: SettingsAccountPage; label: string; href: string; meta: string }> = [
  { key: "profile", label: "Profil", href: "/settings/profile", meta: "Profil & Workspace" },
  { key: "package", label: "Paket", href: "/settings/package", meta: "Status & Optionen" },
  { key: "invoices", label: "Rechnungen", href: "/settings/invoices", meta: "Archiv & PDF" },
];

const EMPTY_VALUE = "Noch nicht hinterlegt";

export function getSettingsAccountPageTitle(activePage: SettingsAccountPage): string {
  if (activePage === "profile") return "Profil";
  if (activePage === "package") return "Paket";
  return "Rechnungen";
}

export function getSettingsAccountPageHref(activePage: SettingsAccountPage): string {
  return SETTINGS_ACCOUNT_TABS.find((item) => item.key === activePage)?.href ?? "/settings/profile";
}

export function getPlanLabel(workspace: WorkspaceDashboardRow): string {
  if (workspace.plan_id === "pilot" && workspace.commercial_option === "pilot_only") return "Pilot / Setup";
  return getCommercialOptionLabel(workspace.commercial_option);
}

export function getProfileFields(user: SupabaseServerUser, workspace: WorkspaceDashboardRow, userDisplayName: string): ProfileField[] {
  const email = typeof user.email === "string" && user.email.trim() ? user.email.trim() : EMPTY_VALUE;
  const workspaceName = workspace.name?.trim() || EMPTY_VALUE;

  return [
    { label: "Anzeigename", value: userDisplayName, source: userDisplayName === EMPTY_VALUE ? "placeholder" : "real" },
    { label: "E-Mail", value: email, source: email === EMPTY_VALUE ? "placeholder" : "real" },
    { label: "Workspace-Name", value: workspaceName, source: workspaceName === EMPTY_VALUE ? "placeholder" : "real" },
  ];
}

export function SettingsHeaderBar({ activePage }: { activePage: SettingsAccountPage }) {
  return (
    <nav className={profileStyles.profileTabs} aria-label="Profil-, Paket- und Rechnungsseiten">
      {SETTINGS_ACCOUNT_TABS.map((item) => (
        <Link
          key={item.key}
          className={`${profileStyles.profileTab} ${activePage === item.key ? profileStyles.profileTabActive : ""}`}
          href={item.href}
          aria-current={activePage === item.key ? "page" : undefined}
        >
          <span>{item.label}</span>
          <small>{item.meta}</small>
        </Link>
      ))}
    </nav>
  );
}

function formatMoney(cents?: number | null): string {
  return typeof cents === "number" ? (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" }) : "—";
}

function formatDate(value?: string | null): string {
  return value ? new Date(value).toLocaleDateString("de-DE") : "—";
}

function getBillingProfileStatusLabel(workspace: WorkspaceDashboardRow): string {
  if (workspace.billing_status === "demo_free" && (workspace.plan_id === "pilot" || workspace.plan_id === "starter")) {
    return workspace.monthly_fee_cents || workspace.setup_fee_cents ? "Testmodus" : "Noch nicht abgerechnet";
  }
  if (workspace.billing_status === "pending_payment_setup") return "Setup vorbereitet";
  return getBillingStatusLabel(workspace.billing_status);
}

function getBillingChipClass(status: string | null | undefined): string {
  if (status === "active") return profileStyles.statusChip;
  if (["past_due", "payment_failed", "suspended", "manual_suspended"].includes(status ?? "")) return profileStyles.warningChip;
  return profileStyles.softChip;
}

export function ProfileSettingsSection({ fields, hasOnlyRealValues, logoutAction }: { fields: ProfileField[]; hasOnlyRealValues: boolean; logoutAction: () => Promise<void> }) {
  return (
    <section className={profileStyles.compactCard} aria-labelledby="user-profile-title">
      <div className={profileStyles.cardHeader}>
        <div>
          <p className={dashboardStyles.eyebrow}>Profil</p>
          <h2 id="user-profile-title">Profil & Workspace-Basisdaten</h2>
        </div>
        <span className={profileStyles.softChip}>{hasOnlyRealValues ? "Kontodaten" : "Unvollständig"}</span>
      </div>
      <p className={profileStyles.headerCopy}>Nur persönliche Daten, E-Mail und Workspace-Basisdaten aus der geschützten Sitzung.</p>
      <dl className={profileStyles.infoGrid}>
        {fields.map((field) => (
          <div className={profileStyles.infoItem} key={field.label}>
            <dt>{field.label}</dt>
            <dd className={field.source === "placeholder" ? profileStyles.placeholderValue : undefined}>{field.value}</dd>
          </div>
        ))}
      </dl>
      <form action={logoutAction} className={profileStyles.actionRow}>
        <button type="submit" className={dashboardStyles.secondaryButton}>Abmelden</button>
      </form>
    </section>
  );
}

export function PackageSettingsSection({ workspace }: { workspace: WorkspaceDashboardRow }) {
  return (
    <section className={profileStyles.compactCard} aria-labelledby="package-profile-title">
      <div className={profileStyles.cardHeader}>
        <div>
          <p className={dashboardStyles.eyebrow}>Paket</p>
          <h2 id="package-profile-title">Paket, Status & Optionen</h2>
        </div>
        <span className={getBillingChipClass(workspace.billing_status)}>{getBillingProfileStatusLabel(workspace)}</span>
      </div>
      <dl className={profileStyles.billingGrid}>
        <div className={`${profileStyles.billingItem} ${profileStyles.billingItemWide}`}><dt>Workspace / Plan</dt><dd>{workspace.name} · {getPlanLabel(workspace)}</dd></div>
        <div className={profileStyles.billingItem}><dt>Commercial Option</dt><dd>{getCommercialOptionLabel(workspace.commercial_option)}</dd></div>
        <div className={profileStyles.billingItem}><dt>Monatlich</dt><dd>{formatMoney(workspace.monthly_fee_cents)}</dd></div>
        <div className={profileStyles.billingItem}><dt>Setup Fee</dt><dd>{formatMoney(workspace.setup_fee_cents)}</dd></div>
        <div className={profileStyles.billingItem}><dt>Bindung</dt><dd>{workspace.commitment_months ? `${workspace.commitment_months} Monate` : "Keine feste Bindung"}</dd></div>
        <div className={profileStyles.billingItem}><dt>Sperrstatus</dt><dd>{workspace.billing_status === "suspended" || workspace.billing_status === "manual_suspended" ? getBillingStatusLabel(workspace.billing_status) : "Nicht gesperrt"}</dd></div>
        <div className={profileStyles.billingItem}><dt>Letzte Zahlung</dt><dd>{workspace.billing_last_payment_at ? formatDate(workspace.billing_last_payment_at) : "Noch keine Zahlung erfasst."}</dd></div>
      </dl>
      <div className={profileStyles.planManagement}>
        <div>
          <p className={profileStyles.invoiceLabel}>Paketwechsel / Zusatzpakete</p>
          <p className={profileStyles.invoiceValue}>Starter Flex und Starter 12 Monate sind vorbereitet. Growth, Agency und Enterprise bleiben Coming Soon / auf Anfrage. Kein automatischer Planwechsel ohne Stripe-Flow.</p>
        </div>
        <div className={profileStyles.invoiceLinks}>
          {shouldShowBillingCheckoutAction(workspace) ? <BillingCheckoutButton planId={workspace.plan_id} commercialOption={workspace.commercial_option} label={getBillingCheckoutActionLabel(workspace.billing_status)} /> : null}
          <Link href="/billing/start">Paketoptionen ansehen</Link>
        </div>
      </div>
    </section>
  );
}

export function InvoicesSettingsSection({ workspace, invoices, invoiceError, taxNote }: { workspace: WorkspaceDashboardRow; invoices: CustomerInvoiceSummary[]; invoiceError: string | null; taxNote: string | null }) {
  return (
    <section className={profileStyles.compactCard} aria-labelledby="invoice-archive-title">
      <div className={profileStyles.cardHeader}>
        <div>
          <p className={dashboardStyles.eyebrow}>Rechnungen</p>
          <h2 id="invoice-archive-title">Rechnungsarchiv</h2>
        </div>
        <span className={profileStyles.softChip}>Stripe serverseitig</span>
      </div>
      <p className={profileStyles.headerCopy}>Rechnungen werden serverseitig für deinen Workspace geladen. Du kannst sie öffnen, als PDF herunterladen und den Zahlungsstatus prüfen.</p>
      {invoiceError ? <p className={dashboardStyles.error}>{invoiceError}</p> : null}
      {taxNote ? <p className={profileStyles.taxNote}>{taxNote}</p> : null}
      {workspace.last_invoice_id || workspace.last_invoice_status ? (
        <div className={profileStyles.latestInvoicePanel}>
          <div>
            <p className={profileStyles.invoiceLabel}>Letzte Rechnung</p>
            <p className={profileStyles.invoiceValue}>{workspace.last_invoice_status ?? "Status offen"} · {formatMoney(workspace.last_invoice_amount_due_cents)}</p>
          </div>
          <div className={profileStyles.invoiceLinks}>
            {workspace.last_invoice_hosted_url ? <a href={workspace.last_invoice_hosted_url} target="_blank" rel="noreferrer">Rechnung öffnen</a> : null}
            {workspace.last_invoice_pdf_url ? <a href={workspace.last_invoice_pdf_url} target="_blank" rel="noreferrer">PDF herunterladen</a> : null}
          </div>
        </div>
      ) : null}
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
  );
}
