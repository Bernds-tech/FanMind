import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/admin";
import { getAdminBillingWorkspace, listStripeInvoicesForWorkspace } from "@/lib/adminBilling";
import { getBillingStatusLabel } from "@/lib/billing";
import { getCommercialOptionLabel } from "@/lib/dashboardFeatures";
import { getStripeConfigStatus } from "@/lib/stripeBilling";

function money(cents?: number | null) { return typeof cents === "number" ? `${(cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}` : "—"; }
function date(value?: string | null) { return value ? new Date(value).toLocaleString("de-DE") : "—"; }
function Field({ label, value }: { label: string; value: React.ReactNode }) { return <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 12 }}><dt style={{ color: "#64748b", fontSize: 12 }}>{label}</dt><dd style={{ margin: 0, fontWeight: 700, wordBreak: "break-word" }}>{value || "—"}</dd></div>; }

export default async function AdminBillingWorkspaceDetailPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  await requirePlatformAdmin();
  const { workspaceId } = await params;
  const { workspace, error } = await getAdminBillingWorkspace(workspaceId);
  if (!workspace && !error) notFound();
  const stripe = getStripeConfigStatus();
  const invoices = workspace ? await listStripeInvoicesForWorkspace(workspace) : { invoices: [], error: null };

  return <main style={{ maxWidth: 1120, margin: "0 auto", padding: "48px 20px", fontFamily: "var(--font-geist-sans)" }}>
    <p style={{ color: "#64748b", textTransform: "uppercase", letterSpacing: "0.12em" }}>FanMind Admin</p>
    <h1>{workspace?.name ?? "Workspace"}</h1>
    <p><Link href="/admin/billing">← Zurück zur Übersicht</Link></p>
    {error ? <p style={{ color: "#b45309" }}>{error}</p> : null}
    {workspace ? <>
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginTop: 24 }}>
        <Field label="Workspace Name" value={workspace.name} /><Field label="Owner E-Mail" value={workspace.owner_email ?? "—"} /><Field label="User ID" value={workspace.owner_user_id} /><Field label="Workspace ID" value={workspace.id} />
        <Field label="Plan" value={workspace.plan_id} /><Field label="Commercial Option" value={getCommercialOptionLabel(workspace.commercial_option ?? "")} /><Field label="Setup Fee" value={money(workspace.setup_fee_cents)} /><Field label="Monthly Fee" value={money(workspace.monthly_fee_cents)} />
        <Field label="Commitment" value={`${workspace.commitment_months ?? 0} Monate`} /><Field label="Billing Status" value={getBillingStatusLabel(workspace.billing_status)} /><Field label="Suspended Status / Grund" value={`${date(workspace.billing_suspended_at)} · ${workspace.billing_suspended_reason ?? "—"}`} /><Field label="Retry Count" value={workspace.billing_retry_count ?? 0} />
        <Field label="Next Retry" value={date(workspace.billing_next_retry_at)} /><Field label="Grace Until" value={date(workspace.billing_grace_until)} /><Field label="Last Payment" value={date(workspace.billing_last_payment_at)} /><Field label="Last Invoice" value={`${workspace.last_invoice_status ?? "—"} · ${money(workspace.last_invoice_amount_due_cents)}`} />
        <Field label="Stripe Customer ID" value={workspace.stripe_customer_id} /><Field label="Stripe Subscription ID" value={workspace.stripe_subscription_id} /><Field label="Stripe Checkout Session ID" value={workspace.stripe_checkout_session_id} /><Field label="Admin Note" value={workspace.billing_admin_note} />
      </section>
      <section style={{ border: "1px solid #e2e8f0", borderRadius: 16, padding: 20, marginTop: 24 }}><h2>Aktionen</h2>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}><form action={`/api/admin/billing/workspaces/${workspace.id}/suspend`} method="post"><button>Manuell sperren</button></form><form action={`/api/admin/billing/workspaces/${workspace.id}/unsuspend`} method="post"><button>Entsperren</button></form></div>
        <form action={`/api/admin/billing/workspaces/${workspace.id}/mark-paid`} method="post" style={{ display: "grid", gap: 10, maxWidth: 520, marginTop: 16 }}>
          <h3>Zahlung verbuchen</h3><label>Zahlungsquelle<select name="payment_source" defaultValue="bank_transfer"><option value="bank_transfer">Banküberweisung</option><option value="stripe_confirmed">Stripe bestätigt</option><option value="cash_or_other">Bar/anderer Weg</option><option value="credit_note">Gutschrift/Kulanz</option><option value="correction">Korrektur</option></select></label>
          <label>Betrag optional<input name="amount" inputMode="decimal" /></label><label>Referenz/Notiz optional<input name="reference" /></label><label>Datum optional<input name="paid_at" type="date" /></label>
          <label><input type="checkbox" name="lift_payment_suspension" value="true" defaultChecked={workspace.billing_status !== "manual_suspended"} disabled={workspace.billing_status === "manual_suspended"} /> Zahlungsbedingte Sperre aufheben</label>{workspace.billing_status === "manual_suspended" ? <p>Dieser Workspace ist manuell gesperrt. Bitte separat entsperren.</p> : null}<button>Zahlung verbuchen</button>
        </form>
        <form action={`/api/admin/billing/workspaces/${workspace.id}/note`} method="post" style={{ marginTop: 16 }}><textarea name="note" defaultValue={workspace.billing_admin_note ?? ""} rows={4} style={{ width: "100%" }} /><button>Admin-Notiz speichern</button></form>
      </section>
      <section style={{ border: "1px solid #e2e8f0", borderRadius: 16, padding: 20, marginTop: 24 }}><h2>Rechnungen</h2>{!stripe.hasSecretKey ? <p>Stripe ist nicht konfiguriert. Es werden nur lokal gespeicherte Rechnungsdaten angezeigt.</p> : null}<p>Lokal: {workspace.last_invoice_status ?? "Noch keine Rechnung vorhanden."} {workspace.last_invoice_hosted_url ? <a href={workspace.last_invoice_hosted_url}>Hosted Invoice</a> : null} {workspace.last_invoice_pdf_url ? <a href={workspace.last_invoice_pdf_url}>PDF</a> : null}</p>{invoices.error ? <p style={{ color: "#b45309" }}>{invoices.error}</p> : null}<ul>{invoices.invoices.map((i) => <li key={i.id}>{date(i.created)} · {i.status ?? "—"} · {money(i.amount_due)} {i.hosted_invoice_url ? <a href={i.hosted_invoice_url}>Hosted</a> : null} {i.invoice_pdf ? <a href={i.invoice_pdf}>PDF</a> : null}</li>)}</ul></section>
    </> : null}
  </main>;
}
