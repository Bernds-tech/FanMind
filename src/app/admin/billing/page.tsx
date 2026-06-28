import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/admin";
import { listAdminBillingWorkspaces } from "@/lib/adminBilling";
import { getBillingStatusLabel } from "@/lib/billing";
import { getCommercialOptionLabel } from "@/lib/dashboardFeatures";
import { getStripeConfigStatus } from "@/lib/stripeBilling";
import { AdminBillingShell } from "./AdminBillingShell";
import styles from "./adminBilling.module.css";

function money(cents?: number | null) { return typeof cents === "number" ? (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" }) : "—"; }
function date(value?: string | null) { return value ? new Date(value).toLocaleDateString("de-DE") : "—"; }
function statusClass(status?: string | null) { if (status === "active") return styles.badgeOk; if (status === "past_due" || status === "payment_failed" || status?.includes("suspended")) return styles.badgeBad; if (status?.startsWith("pending")) return styles.badgeWarn; return styles.badge; }
function StripeBadge({ ok, prepared }: { ok: boolean; prepared?: boolean }) { return <span className={ok ? styles.badgeOk : prepared ? styles.badgeWarn : styles.badgeBad}>{ok ? "aktiv" : prepared ? "vorbereitet" : "fehlt"}</span>; }

export default async function AdminBillingPage() {
  const user = await requirePlatformAdmin();
  const stripe = getStripeConfigStatus();
  const { workspaces, error } = await listAdminBillingWorkspaces();
  const active = workspaces.filter((w) => w.billing_status === "active").length;
  const pending = workspaces.filter((w) => w.billing_status?.startsWith("pending")).length;
  const failed = workspaces.filter((w) => w.billing_status === "past_due" || w.billing_status === "payment_failed").length;
  const suspended = workspaces.filter((w) => w.billing_status === "suspended" || w.billing_status === "manual_suspended").length;
  const cancelled = workspaces.filter((w) => w.billing_status === "cancelled").length;
  const mrr = workspaces.filter((w) => w.billing_status === "active").reduce((sum, w) => sum + (w.monthly_fee_cents ?? 0), 0);
  const stripeItems = [
    ["Secret Key", stripe.hasSecretKey], ["Webhook Secret", stripe.hasWebhookSecret], ["Pilot Price ID", stripe.hasPilotPrice],
    ["Starter Setup Price ID", stripe.hasStarterSetupPrice], ["Starter Monatsabo Price ID", stripe.hasStarterMonthlyPrice],
    ["Growth vorbereitet", stripe.hasGrowthMonthlyPrice], ["Agency vorbereitet", stripe.hasAgencyMonthlyPrice], ["Feature-Flag aktiv", stripe.growthAgencyBillingEnabled],
  ] as const;

  return <AdminBillingShell user={user} title="Adminbereich" subtitle={`Billing & Workspaces · Angemeldet als Admin: ${user.email ?? "Admin"}`}>
    <div className={styles.adminStack}>
      <section className={styles.hero}>
        <div><span className={styles.eyebrow}>FanMind Admin</span><h1>Billing & Workspaces</h1><p>Verwalte Pläne, Zahlungsstatus, Sperren und Rechnungsstatus aller Workspaces.</p></div>
        <span className={styles.badgeOk}>Admin</span>
      </section>
      <section className={styles.kpiGrid}>{[["Gesamt", workspaces.length], ["Aktiv", active], ["Offen", pending], ["Fehlgeschlagen", failed], ["Gesperrt", suspended], ["Gekündigt", cancelled], ["MRR erwartet", money(mrr)]].map(([label, value]) => <article className={styles.kpiCard} key={label}><strong>{value}</strong><span>{label}</span></article>)}</section>
      <section className={styles.card}><div className={styles.cardHeader}><div><span className={styles.eyebrow}>Systemstatus</span><h2>Zahlungsstatus / Stripe-Konfiguration</h2></div><span className={stripe.readyForCheckout ? styles.badgeOk : styles.badgeWarn}>{stripe.readyForCheckout ? "Checkout bereit" : "unvollständig"}</span></div><div className={styles.statusList}>{stripeItems.map(([label, ok]) => <div className={styles.statusItem} key={label}><span>{label}</span><StripeBadge ok={ok} prepared={label.includes("vorbereitet")} /></div>)}</div><p className={styles.muted}>Growth/Agency Checkout bleibt ohne Feature-Flag und Price IDs deaktiviert.</p></section>
      {error ? <p className={styles.badgeWarn}>{error}</p> : null}
      <section className={styles.card}><div className={styles.cardHeader}><div><span className={styles.eyebrow}>CRM-Übersicht</span><h2>Workspace-Liste</h2></div><span className={styles.badge}>{workspaces.length} Workspaces</span></div><div className={styles.tableWrap}><table className={styles.table}><thead><tr>{["Workspace", "Owner", "Plan", "Option", "Status", "Monat", "Retry", "Nächste Aktion", "Rechnung", "Aktionen"].map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{workspaces.map((w) => <tr key={w.id}><td><Link className={styles.workspaceLink} href={`/admin/billing/workspaces/${w.id}`}>{w.name}</Link><span className={styles.subline}>{w.id}</span></td><td>{w.owner_user_id ?? "—"}</td><td><span className={styles.chip}>{w.plan_id ?? "—"}</span></td><td>{getCommercialOptionLabel(w.commercial_option ?? "")}</td><td><span className={statusClass(w.billing_status)}>{getBillingStatusLabel(w.billing_status)}</span></td><td>{money(w.monthly_fee_cents)}</td><td>{w.billing_retry_count ?? 0}</td><td>{date(w.billing_next_retry_at)}</td><td>{w.last_invoice_status ?? "—"}<span className={styles.subline}>{w.last_invoice_hosted_url ? <a href={w.last_invoice_hosted_url}>Hosted</a> : null} {w.last_invoice_pdf_url ? <a href={w.last_invoice_pdf_url}>PDF</a> : null}</span></td><td><div className={styles.actions}><Link className={styles.buttonPrimary} href={`/admin/billing/workspaces/${w.id}`}>Details</Link><form action={`/api/admin/billing/workspaces/${w.id}/suspend`} method="post"><button className={styles.buttonDanger}>Sperren</button></form><form action={`/api/admin/billing/workspaces/${w.id}/unsuspend`} method="post"><button className={styles.buttonSecondary}>Entsperren</button></form><form action={`/api/admin/billing/workspaces/${w.id}/mark-paid`} method="post"><button className={styles.buttonSecondary}>Zahlung</button></form></div></td></tr>)}</tbody></table></div></section>
    </div>
  </AdminBillingShell>;
}
