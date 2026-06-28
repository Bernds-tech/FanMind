import { getSupabaseHeaders, getSupabaseRestUrl } from "@/lib/supabase/config";
import type { SupabaseServerUser } from "@/lib/supabase/server";

export type AdminBillingWorkspace = {
  id: string; name: string; owner_user_id: string | null; plan_id: string | null; commercial_option: string | null;
  setup_fee_cents: number | null; monthly_fee_cents: number | null; commitment_months: number | null;
  billing_status: string | null; billing_suspended_at: string | null; billing_suspended_reason: string | null; billing_manual_override: boolean | null;
  billing_last_payment_failed_at: string | null; billing_last_payment_at: string | null; billing_retry_count: number | null; billing_next_retry_at: string | null; billing_grace_until: string | null; billing_admin_note: string | null; billing_updated_at: string | null; billing_updated_by_user_id: string | null;
  stripe_customer_id: string | null; stripe_subscription_id: string | null; stripe_checkout_session_id: string | null;
  last_invoice_id: string | null; last_invoice_status: string | null; last_invoice_amount_due_cents: number | null; last_invoice_amount_paid_cents: number | null; last_invoice_hosted_url: string | null; last_invoice_pdf_url: string | null;
};

const ADMIN_BILLING_COLUMNS = "id,name,owner_user_id,plan_id,commercial_option,setup_fee_cents,monthly_fee_cents,commitment_months,billing_status,billing_suspended_at,billing_suspended_reason,billing_manual_override,billing_last_payment_failed_at,billing_last_payment_at,billing_retry_count,billing_next_retry_at,billing_grace_until,billing_admin_note,billing_updated_at,billing_updated_by_user_id,stripe_customer_id,stripe_subscription_id,stripe_checkout_session_id,last_invoice_id,last_invoice_status,last_invoice_amount_due_cents,last_invoice_amount_paid_cents,last_invoice_hosted_url,last_invoice_pdf_url";

function serviceKey() { return process.env.SUPABASE_SERVICE_ROLE_KEY; }
function validUuid(id: string) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id); }

export async function listAdminBillingWorkspaces(): Promise<{ workspaces: AdminBillingWorkspace[]; error: string | null }> {
  const key = serviceKey();
  if (!key) return { workspaces: [], error: "Supabase Service Role ist nicht konfiguriert." };
  try {
    const url = new URL(getSupabaseRestUrl("workspaces"));
    url.searchParams.set("select", ADMIN_BILLING_COLUMNS);
    url.searchParams.set("order", "billing_updated_at.desc.nullslast,name.asc");
    const response = await fetch(url, { headers: getSupabaseHeaders(key), cache: "no-store" });
    if (!response.ok) return { workspaces: [], error: `Workspaces konnten nicht geladen werden (${response.status}). Migration evtl. noch nicht live.` };
    return { workspaces: await response.json() as AdminBillingWorkspace[], error: null };
  } catch (error) { return { workspaces: [], error: error instanceof Error ? error.message : "Unbekannter Fehler" }; }
}

export async function updateAdminBillingWorkspace(workspaceId: string, admin: SupabaseServerUser, values: Record<string, unknown>) {
  const key = serviceKey();
  if (!key) return { ok: false, status: 503, error: "Supabase Service Role ist nicht konfiguriert." };
  if (!validUuid(workspaceId)) return { ok: false, status: 400, error: "Ungültige Workspace-ID." };
  const body = { ...values, billing_updated_at: new Date().toISOString(), billing_updated_by_user_id: admin.id };
  const url = new URL(getSupabaseRestUrl("workspaces"));
  url.searchParams.set("id", `eq.${workspaceId}`);
  const response = await fetch(url, { method: "PATCH", headers: { ...getSupabaseHeaders(key), Prefer: "return=minimal" }, body: JSON.stringify(body), cache: "no-store" });
  if (!response.ok) return { ok: false, status: response.status, error: "Billing-Aktion konnte nicht gespeichert werden." };
  return { ok: true, status: 200, error: null };
}

export async function getAdminBillingWorkspace(workspaceId: string): Promise<{ workspace: (AdminBillingWorkspace & { owner_email?: string | null }) | null; error: string | null }> {
  const key = serviceKey();
  if (!key) return { workspace: null, error: "Supabase Service Role ist nicht konfiguriert." };
  if (!validUuid(workspaceId)) return { workspace: null, error: "Ungültige Workspace-ID." };
  try {
    const url = new URL(getSupabaseRestUrl("workspaces"));
    url.searchParams.set("select", ADMIN_BILLING_COLUMNS);
    url.searchParams.set("id", `eq.${workspaceId}`);
    url.searchParams.set("limit", "1");
    const response = await fetch(url, { headers: getSupabaseHeaders(key), cache: "no-store" });
    if (!response.ok) return { workspace: null, error: `Workspace konnte nicht geladen werden (${response.status}).` };
    const rows = await response.json() as AdminBillingWorkspace[];
    return { workspace: rows[0] ?? null, error: null };
  } catch (error) { return { workspace: null, error: error instanceof Error ? error.message : "Unbekannter Fehler" }; }
}

export type StripeInvoiceSummary = { id: string; status?: string | null; created?: string | null; amount_due?: number | null; hosted_invoice_url?: string | null; invoice_pdf?: string | null };

export async function listStripeInvoicesForWorkspace(workspace: Pick<AdminBillingWorkspace, "stripe_customer_id">): Promise<{ invoices: StripeInvoiceSummary[]; error: string | null }> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || !workspace.stripe_customer_id) return { invoices: [], error: null };
  const params = new URLSearchParams({ customer: workspace.stripe_customer_id, limit: "10" });
  const response = await fetch(`https://api.stripe.com/v1/invoices?${params.toString()}`, { headers: { Authorization: `Bearer ${secretKey}` }, cache: "no-store" });
  const json = await response.json().catch(() => ({})) as { data?: Array<Record<string, unknown>>; error?: { message?: string } };
  if (!response.ok) return { invoices: [], error: json.error?.message ?? "Stripe-Rechnungen konnten nicht geladen werden." };
  return { invoices: (json.data ?? []).map((invoice) => ({ id: String(invoice.id), status: typeof invoice.status === "string" ? invoice.status : null, created: typeof invoice.created === "number" ? new Date(invoice.created * 1000).toISOString() : null, amount_due: typeof invoice.amount_due === "number" ? invoice.amount_due : null, hosted_invoice_url: typeof invoice.hosted_invoice_url === "string" ? invoice.hosted_invoice_url : null, invoice_pdf: typeof invoice.invoice_pdf === "string" ? invoice.invoice_pdf : null })), error: null };
}
