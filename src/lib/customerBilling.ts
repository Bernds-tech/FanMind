import { isDemoWorkspace } from "@/lib/demoMode";
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
  description?: string;
  isDemo?: boolean;
  pdfHint?: string;
};

function numberField(
  source: Record<string, unknown>,
  key: string,
): number | null {
  return typeof source[key] === "number" ? source[key] : null;
}

function stringField(
  source: Record<string, unknown>,
  key: string,
): string | null {
  return typeof source[key] === "string" ? source[key] : null;
}

function taxAmount(source: Record<string, unknown>): number | null {
  if (!Array.isArray(source.total_tax_amounts)) return null;
  return source.total_tax_amounts.reduce((sum, tax) => {
    const amount =
      typeof (tax as { amount?: unknown }).amount === "number"
        ? (tax as { amount: number }).amount
        : 0;
    return sum + amount;
  }, 0);
}

export function getCustomerBillingTaxNote(): string | null {
  return getTaxMode() === "small_business" ? SMALL_BUSINESS_INVOICE_NOTE : null;
}

function sortInvoicesNewestFirst(
  invoices: CustomerInvoiceSummary[],
): CustomerInvoiceSummary[] {
  return [...invoices].sort((left, right) => {
    const rightCreated = right.created ? Date.parse(right.created) : 0;
    const leftCreated = left.created ? Date.parse(left.created) : 0;
    return rightCreated - leftCreated;
  });
}

function getDemoInvoicesForFreeWorkspace(
  workspace: Pick<
    WorkspaceDashboardRow,
    "billing_status" | "name" | "commercial_option" | "stripe_customer_id"
  >,
  allowStripeCustomer = false,
): CustomerInvoiceSummary[] {
  if (
    !isDemoWorkspace(workspace) ||
    (workspace.stripe_customer_id && !allowStripeCustomer)
  )
    return [];

  const baseInvoices: CustomerInvoiceSummary[] = [
    {
      id: "demo-invoice-0001",
      number: "Demo-Rechnung 0001",
      created: "2026-07-01T10:00:00.000Z",
      status: "bezahlt",
      currency: "EUR",
      amountDue: 99000,
      amountPaid: 99000,
      subtotal: 99000,
      tax: 0,
      total: 99000,
      hostedInvoiceUrl: null,
      invoicePdf: null,
      description: "Pilot Setup",
      isDemo: true,
      pdfHint:
        "Demo-PDF-Hinweis: Für diese Beispielrechnung gibt es kein echtes PDF und keine Stripe-Rechnung.",
    },
    {
      id: "demo-invoice-0002",
      number: "Demo-Rechnung 0002",
      created: "2026-07-08T10:00:00.000Z",
      status: "offen",
      currency: "EUR",
      amountDue: 31200,
      amountPaid: 0,
      subtotal: 31200,
      tax: 0,
      total: 31200,
      hostedInvoiceUrl: null,
      invoicePdf: null,
      description: "Starter Monat",
      isDemo: true,
      pdfHint:
        "Demo-PDF-Hinweis: Für diese Beispielrechnung gibt es kein echtes PDF und keine Stripe-Rechnung.",
    },
  ];

  if (workspace.commercial_option === "internal_daily_test") {
    baseInvoices.push({
      id: "demo-invoice-beta-test",
      number: "Demo-Rechnung 0003",
      created: "2026-07-09T10:00:00.000Z",
      status: "bezahlt",
      currency: "EUR",
      amountDue: 100,
      amountPaid: 100,
      subtotal: 100,
      tax: 0,
      total: 100,
      hostedInvoiceUrl: null,
      invoicePdf: null,
      description: "Beta-Test",
      isDemo: true,
      pdfHint:
        "Demo-PDF-Hinweis: Für diese Beispielrechnung gibt es kein echtes PDF und keine Stripe-Rechnung.",
    });
  }

  return sortInvoicesNewestFirst(baseInvoices);
}

export async function listCustomerInvoicesForWorkspace(
  workspace: Pick<
    WorkspaceDashboardRow,
    "billing_status" | "name" | "commercial_option" | "stripe_customer_id"
  >,
): Promise<{ invoices: CustomerInvoiceSummary[]; error: string | null }> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!workspace.stripe_customer_id)
    return {
      invoices: getDemoInvoicesForFreeWorkspace(workspace),
      error: null,
    };
  if (!secretKey)
    return {
      invoices: [],
      error: "Stripe ist serverseitig noch nicht konfiguriert.",
    };

  const params = new URLSearchParams({
    customer: workspace.stripe_customer_id,
    limit: "24",
  });

  const response = await fetch(
    `https://api.stripe.com/v1/invoices?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${secretKey}` },
      cache: "no-store",
    },
  );
  const json = (await response.json().catch(() => ({}))) as {
    data?: Array<Record<string, unknown>>;
    error?: { message?: string };
  };

  if (!response.ok)
    return {
      invoices: [],
      error:
        json.error?.message ??
        "Stripe-Rechnungen konnten nicht geladen werden.",
    };

  const invoices = (json.data ?? []).map((invoice) => ({
    id: String(invoice.id),
    number: stringField(invoice, "number"),
    created:
      typeof invoice.created === "number"
        ? new Date(invoice.created * 1000).toISOString()
        : null,
    status: stringField(invoice, "status"),
    currency: (stringField(invoice, "currency") ?? "eur").toUpperCase(),
    amountDue: numberField(invoice, "amount_due"),
    amountPaid: numberField(invoice, "amount_paid"),
    subtotal: numberField(invoice, "subtotal"),
    tax: taxAmount(invoice),
    total: numberField(invoice, "total"),
    hostedInvoiceUrl: stringField(invoice, "hosted_invoice_url"),
    invoicePdf: stringField(invoice, "invoice_pdf"),
  }));

  return {
    invoices: invoices.length
      ? sortInvoicesNewestFirst(invoices)
      : getDemoInvoicesForFreeWorkspace(workspace, true),
    error: null,
  };
}
