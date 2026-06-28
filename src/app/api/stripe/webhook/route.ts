import { NextRequest, NextResponse } from "next/server";
import { updateWorkspaceBillingDefensively, verifyStripeSignature } from "@/lib/stripeBilling";

type StripeEvent = { type?: string; data?: { object?: Record<string, unknown> } };
function stringField(object: Record<string, unknown>, key: string): string | undefined { const value = object[key]; return typeof value === "string" ? value : undefined; }
function numberField(object: Record<string, unknown>, key: string): number | undefined { const value = object[key]; return typeof value === "number" ? value : undefined; }
function stripeTs(value?: number): string | null | undefined { return typeof value === "number" ? new Date(value * 1000).toISOString() : value; }
function metadataWorkspaceId(object: Record<string, unknown>): string | undefined { const metadata = object.metadata; return metadata && typeof metadata === "object" ? stringField(metadata as Record<string, unknown>, "workspace_id") : undefined; }
function invoiceFields(object: Record<string, unknown>) { return { last_invoice_id: stringField(object, "id"), last_invoice_status: stringField(object, "status"), last_invoice_amount_due_cents: numberField(object, "amount_due"), last_invoice_amount_paid_cents: numberField(object, "amount_paid"), last_invoice_hosted_url: stringField(object, "hosted_invoice_url"), last_invoice_pdf_url: stringField(object, "invoice_pdf") }; }
function graceUntil(object: Record<string, unknown>): string { const start = numberField(object, "created") ?? Math.floor(Date.now() / 1000); return new Date((start + 10 * 24 * 60 * 60) * 1000).toISOString(); }

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  if (!verifyStripeSignature(rawBody, request.headers.get("stripe-signature"))) return NextResponse.json({ error: "Ungültige Stripe-Signatur." }, { status: 400 });
  const event = JSON.parse(rawBody) as StripeEvent;
  const object = event.data?.object ?? {};
  const workspaceId = metadataWorkspaceId(object);

  if (event.type === "checkout.session.completed") await updateWorkspaceBillingDefensively(workspaceId, { billing_status: "pending_sepa_mandate", stripe_customer_id: stringField(object, "customer"), stripe_subscription_id: stringField(object, "subscription"), stripe_checkout_session_id: stringField(object, "id"), stripe_payment_intent_id: stringField(object, "payment_intent"), stripe_mandate_id: stringField(object, "setup_intent"), billing_note: "Stripe Checkout abgeschlossen; SEPA-Bestätigung kann einige Tage dauern." });
  if (event.type === "invoice.paid") await updateWorkspaceBillingDefensively(workspaceId, { ...invoiceFields(object), billing_status: "active", billing_last_payment_at: new Date().toISOString(), billing_last_payment_failed_at: null, billing_retry_count: 0, billing_next_retry_at: null, billing_suspended_at: null, billing_suspended_reason: null, stripe_customer_id: stringField(object, "customer"), stripe_subscription_id: stringField(object, "subscription") });
  if (event.type === "invoice.updated") await updateWorkspaceBillingDefensively(workspaceId, { ...invoiceFields(object), stripe_customer_id: stringField(object, "customer"), stripe_subscription_id: stringField(object, "subscription") });
  if (event.type === "invoice.payment_failed") { const attempts = numberField(object, "attempt_count") ?? 1; const grace = graceUntil(object); const suspend = attempts >= 3 || Date.now() > Date.parse(grace); await updateWorkspaceBillingDefensively(workspaceId, { ...invoiceFields(object), billing_status: suspend ? "suspended" : attempts > 1 ? "payment_failed" : "past_due", billing_retry_count: attempts, billing_next_retry_at: stripeTs(numberField(object, "next_payment_attempt")), billing_grace_until: grace, billing_last_payment_failed_at: new Date().toISOString(), billing_suspended_at: suspend ? new Date().toISOString() : null, billing_suspended_reason: suspend ? "payment_failed_after_retries" : null, stripe_customer_id: stringField(object, "customer"), stripe_subscription_id: stringField(object, "subscription") }); }
  if (event.type === "customer.subscription.updated") await updateWorkspaceBillingDefensively(workspaceId, { stripe_customer_id: stringField(object, "customer"), stripe_subscription_id: stringField(object, "id") });
  if (event.type === "customer.subscription.deleted") await updateWorkspaceBillingDefensively(workspaceId, { billing_status: "cancelled", stripe_customer_id: stringField(object, "customer"), stripe_subscription_id: stringField(object, "id") });
  return NextResponse.json({ received: true });
}
