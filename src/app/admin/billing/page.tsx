import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/admin";
import { listAdminBillingWorkspaces } from "@/lib/adminBilling";
import { getBillingStatusLabel } from "@/lib/billing";
import { getStripeConfigStatus } from "@/lib/stripeBilling";

function Status({ ok }: { ok: boolean }) { return <strong>{ok ? "ja" : "nein"}</strong>; }
function money(cents?: number | null) { return typeof cents === "number" ? `${(cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}` : "—"; }
function date(value?: string | null) { return value ? new Date(value).toLocaleDateString("de-DE") : "—"; }

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

  return (
    <main style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 20px", fontFamily: "var(--font-geist-sans)" }}>
      <p style={{ color: "#64748b", textTransform: "uppercase", letterSpacing: "0.12em" }}>FanMind Admin</p>
      <h1>Billing-Konfiguration & Workspaces</h1>
      <p>Admin-Status: <strong>aktiv</strong> für {user.email}</p>
      <section style={{ border: "1px solid #e2e8f0", borderRadius: 16, padding: 24, marginTop: 24 }}>
        <h2>Stripe-Konfiguration</h2>
        <ul>
          <li>Secret Key vorhanden: <Status ok={stripe.hasSecretKey} /></li><li>Webhook Secret vorhanden: <Status ok={stripe.hasWebhookSecret} /></li>
          <li>Pilot Price ID vorhanden: <Status ok={stripe.hasPilotPrice} /></li><li>Starter Setup Price ID vorhanden: <Status ok={stripe.hasStarterSetupPrice} /></li><li>Starter Monatsabo Price ID vorhanden: <Status ok={stripe.hasStarterMonthlyPrice} /></li>
          <li>Growth Monatsabo vorbereitet: <Status ok={stripe.hasGrowthMonthlyPrice} /></li><li>Agency Monatsabo vorbereitet: <Status ok={stripe.hasAgencyMonthlyPrice} /></li><li>Growth/Agency Feature Flag aktiv: <Status ok={stripe.growthAgencyBillingEnabled} /></li>
        </ul>
        <p>{stripe.readyForCheckout ? "Checkout ist technisch konfiguriert." : "Stripe-Testmodus/Live-Konfiguration ist noch unvollständig."} Growth/Agency Checkout bleibt ohne Feature-Flag und Price IDs deaktiviert.</p>
      </section>
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginTop: 24 }}>
        {[ ["Gesamt", workspaces.length], ["Aktiv", active], ["Offen", pending], ["Fehlgeschlagen", failed], ["Gesperrt", suspended], ["Gekündigt", cancelled], ["MRR erwartet", money(mrr)] ].map(([label,value]) => <div key={label} style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 16 }}><strong>{value}</strong><br/><span>{label}</span></div>)}
      </section>
      {error ? <p style={{ color: "#b45309" }}>{error}</p> : null}
      <div style={{ overflowX: "auto", marginTop: 24 }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}><thead><tr>{["Workspace","Owner","Plan","Option","Setup","Monat","Bindung","Status","Retry","Next Retry","Grace","Last Payment","Invoice","Stripe Customer","Stripe Subscription","Aktionen"].map((h) => <th key={h} style={{ textAlign: "left", borderBottom: "1px solid #cbd5e1", padding: 8 }}>{h}</th>)}</tr></thead><tbody>{workspaces.map((w) => <tr key={w.id}><td style={{ padding: 8 }}>{w.name}</td><td style={{ padding: 8 }}>{w.owner_user_id ?? "—"}</td><td style={{ padding: 8 }}>{w.plan_id}</td><td style={{ padding: 8 }}>{w.commercial_option}</td><td style={{ padding: 8 }}>{money(w.setup_fee_cents)}</td><td style={{ padding: 8 }}>{money(w.monthly_fee_cents)}</td><td style={{ padding: 8 }}>{w.commitment_months ?? 0} Monate</td><td style={{ padding: 8 }}>{getBillingStatusLabel(w.billing_status)}</td><td style={{ padding: 8 }}>{w.billing_retry_count ?? 0}</td><td style={{ padding: 8 }}>{date(w.billing_next_retry_at)}</td><td style={{ padding: 8 }}>{date(w.billing_grace_until)}</td><td style={{ padding: 8 }}>{date(w.billing_last_payment_at)}</td><td style={{ padding: 8 }}>{w.last_invoice_status ?? "—"}<br/>{w.last_invoice_hosted_url ? <a href={w.last_invoice_hosted_url}>Hosted</a> : null} {w.last_invoice_pdf_url ? <a href={w.last_invoice_pdf_url}>PDF</a> : null}</td><td style={{ padding: 8 }}>{w.stripe_customer_id ?? "—"}</td><td style={{ padding: 8 }}>{w.stripe_subscription_id ?? "—"}</td><td style={{ padding: 8 }}><form action={`/api/admin/billing/workspaces/${w.id}/suspend`} method="post"><button>Manuell sperren</button></form><form action={`/api/admin/billing/workspaces/${w.id}/unsuspend`} method="post"><button>Entsperren</button></form><form action={`/api/admin/billing/workspaces/${w.id}/mark-paid`} method="post"><button>Manuell bezahlt</button></form>{w.stripe_customer_id ? <a href={`https://dashboard.stripe.com/customers/${w.stripe_customer_id}`}>Stripe</a> : null}<details><summary>Details/Notiz</summary><p>{w.billing_admin_note ?? "Keine Notiz"}</p><form action={`/api/admin/billing/workspaces/${w.id}/note`} method="post"><textarea name="note" defaultValue={w.billing_admin_note ?? ""}/><button>Notiz speichern</button></form><p>Invoice ID: {w.last_invoice_id ?? "—"}<br/>Due: {money(w.last_invoice_amount_due_cents)} Paid: {money(w.last_invoice_amount_paid_cents)}</p></details></td></tr>)}</tbody></table></div>
      <p style={{ marginTop: 24 }}><Link href="/dashboard">Zurück zum Dashboard</Link></p>
    </main>
  );
}
