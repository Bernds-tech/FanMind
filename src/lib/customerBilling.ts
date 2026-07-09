import { getTaxMode, SMALL_BUSINESS_INVOICE_NOTE } from "@/lib/stripeBilling";
import type { WorkspaceDashboardRow } from "@/lib/supabase/server";

export type CustomerInvoiceSummary = {
  id: string;
  number: string | null;
  created: string | null;
  status: string | null;
  currency: string;
  amountDue: number | null;
  amountPaid: number | null;
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
};

function numberField(source: Record<string, unknown>, key: string): number | null {
  return typeof source[key] === "number" ? source[key] : null;
}

function stringField(source: Record<string, unknown>, key: string): string | null {
  return typeof source[key] === "string" ? source[key] : null;
}

function taxAmount(source: Record<string, unknown>): number | null {
  if (!Array.isArray(source.total_tax_amounts)) return null;
  return source.total_tax_amounts.reduce((sum, tax) => {
    const amount = typeof (tax as { amount?: unknown }).amount === "number" ? (tax as { amount: number }).amount : 0;
    return sum + amount;
  }, 0);
}

export function getCustomerBillingTaxNote(): string | null {
  return getTaxMode() === "small_business" ? SMALL_BUSINESS_INVOICE_NOTE : null;
}

export async function listCustomerInvoicesForWorkspace(
  workspace: Pick<WorkspaceDashboardRow, "stripe_customer_id">,
): Promise<{ invoices: CustomerInvoiceSummary[]; error: string | null }> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return { invoices: [], error: "Stripe ist serverseitig noch nicht konfiguriert." };
  if (!workspace.stripe_customer_id) return { invoices: [], error: null };

  const params = new URLSearchParams({
    customer: workspace.stripe_customer_id,
    limit: "24",
  });

  const response = await fetch(`https://api.stripe.com/v1/invoices?${params.toString()}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
    cache: "no-store",
  });
  const json = await response.json().catch(() => ({})) as { data?: Array<Record<string, unknown>>; error?: { message?: string } };

  if (!response.ok) return { invoices: [], error: json.error?.message ?? "Stripe-Rechnungen konnten nicht geladen werden." };

  return {
    invoices: (json.data ?? []).map((invoice) => ({
      id: String(invoice.id),
      number: stringField(invoice, "number"),
      created: typeof invoice.created === "number" ? new Date(invoice.created * 1000).toISOString() : null,
      status: stringField(invoice, "status"),
      currency: (stringField(invoice, "currency") ?? "eur").toUpperCase(),
      amountDue: numberField(invoice, "amount_due"),
      amountPaid: numberField(invoice, "amount_paid"),
      subtotal: numberField(invoice, "subtotal"),
      tax: taxAmount(invoice),
      total: numberField(invoice, "total"),
      hostedInvoiceUrl: stringField(invoice, "hosted_invoice_url"),
      invoicePdf: stringField(invoice, "invoice_pdf"),
    })),
    error: null,
  };
}
