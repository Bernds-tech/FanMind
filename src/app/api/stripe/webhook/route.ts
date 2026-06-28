import { NextRequest, NextResponse } from "next/server";
import { findWorkspaceIdByStripeReferences, updateWorkspaceBillingDefensively, verifyStripeSignature } from "@/lib/stripeBilling";

type StripeObject = Record<string, unknown>;
type StripeEvent = { type?: string; data?: { object?: StripeObject } };

function objectField(object: StripeObject | undefined, key: string): StripeObject | undefined { const value = object?.[key]; return value && typeof value === "object" && !Array.isArray(value) ? value as StripeObject : undefined; }
function arrayField(object: StripeObject | undefined, key: string): unknown[] | undefined { const value = object?.[key]; return Array.isArray(value) ? value : undefined; }
function stringField(object: StripeObject | undefined, key: string): string | undefined { const value = object?.[key]; return typeof value === "string" ? value : undefined; }
function numberField(object: StripeObject, key: string): number | undefined { const value = object[key]; return typeof value === "number" ? value : undefined; }
function stripeTs(value?: number): string | null | undefined { return typeof value === "number" ? new Date(value * 1000).toISOString() : value; }
function metadataWorkspaceId(object: StripeObject | undefined): string | undefined { return stringField(objectField(object, "metadata"), "workspace_id"); }
function invoiceFields(object: StripeObject) { return { last_invoice_id: stringField(object, "id"), last_invoice_status: stringField(object, "status"), last_invoice_amount_due_cents: numberField(object, "amount_due"), last_invoice_amount_paid_cents: numberField(object, "amount_paid"), last_invoice_hosted_url: stringField(object, "hosted_invoice_url"), last_invoice_pdf_url: stringField(object, "invoice_pdf") }; }
function graceUntil(object: StripeObject): string { const start = numberField(object, "created") ?? Math.floor(Date.now() / 1000); return new Date((start + 10 * 24 * 60 * 60) * 1000).toISOString(); }
function retryCount(object: StripeObject): number { return Math.max(1, numberField(object, "attempt_count") ?? 1); }
function amountReceived(object: StripeObject): number | undefined { return numberField(object, "amount_received") ?? numberField(object, "amount") ?? numberField(object, "amount_due") ?? numberField(object, "amount_paid"); }
function stripeId(value: unknown): string | undefined { return typeof value === "string" ? value : stringField(value as StripeObject | undefined, "id"); }
function objectIdWithPrefix(object: StripeObject, prefix: string): string | undefined { const id = stringField(object, "id"); return id?.startsWith(prefix) ? id : undefined; }
function lineWorkspaceId(object: StripeObject): string | undefined {
  const lines = objectField(object, "lines");
  return arrayField(lines, "data")?.map((line) => metadataWorkspaceId(line as StripeObject)).find(Boolean);
}
function workspaceIdFromObject(object: StripeObject): string | undefined {
  return metadataWorkspaceId(object)
    ?? stringField(object, "client_reference_id")
    ?? metadataWorkspaceId(objectField(object, "subscription_details"))
    ?? metadataWorkspaceId(objectField(objectField(object, "parent"), "subscription_details"))
    ?? metadataWorkspaceId(objectField(object, "payment_intent_data"))
    ?? lineWorkspaceId(object);
}
async function resolveWorkspaceId(object: StripeObject): Promise<string | undefined> {
  const direct = workspaceIdFromObject(object);
  if (direct) return direct;
  return await findWorkspaceIdByStripeReferences({ customerId: stripeId(object.customer) ?? objectIdWithPrefix(object, "cus_"), subscriptionId: stripeId(object.subscription) ?? objectIdWithPrefix(object, "sub_"), paymentIntentId: stripeId(object.payment_intent) ?? objectIdWithPrefix(object, "pi_") }) ?? undefined;
}
async function updateOrWarn(eventType: string | undefined, object: StripeObject, fields: Record<string, string | number | boolean | null | undefined>): Promise<void> {
  const workspaceId = await resolveWorkspaceId(object);
  if (!workspaceId) {
    console.warn("Stripe webhook without workspace mapping", { eventType, objectId: stringField(object, "id") });
    return;
  }
  await updateWorkspaceBillingDefensively(workspaceId, fields);
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  if (!verifyStripeSignature(rawBody, request.headers.get("stripe-signature"))) return NextResponse.json({ error: "Ungültige Stripe-Signatur." }, { status: 400 });
  const event = JSON.parse(rawBody) as StripeEvent;
  const object = event.data?.object ?? {};
  const now = new Date().toISOString();

  if (event.type === "checkout.session.completed") await updateOrWarn(event.type, object, { billing_status: "pending_sepa_mandate", stripe_customer_id: stringField(object, "customer"), stripe_subscription_id: stringField(object, "subscription"), stripe_checkout_session_id: stringField(object, "id"), stripe_payment_intent_id: stringField(object, "payment_intent"), stripe_mandate_id: stringField(object, "setup_intent"), billing_note: "Zahlung gestartet; SEPA-Bestätigung ausstehend." });
  if (event.type === "checkout.session.async_payment_succeeded") await updateOrWarn(event.type, object, { billing_status: "active", billing_last_payment_at: now, billing_last_payment_failed_at: null, billing_retry_count: 0, billing_next_retry_at: null, billing_grace_until: null, billing_suspended_at: null, billing_suspended_reason: null, stripe_customer_id: stringField(object, "customer"), stripe_subscription_id: stringField(object, "subscription"), stripe_checkout_session_id: stringField(object, "id"), stripe_payment_intent_id: stringField(object, "payment_intent"), billing_note: "SEPA-Zahlung von Stripe bestätigt." });
  if (event.type === "checkout.session.async_payment_failed") await updateOrWarn(event.type, object, { billing_status: "payment_failed", billing_last_payment_failed_at: now, billing_retry_count: retryCount(object), billing_grace_until: graceUntil(object), stripe_customer_id: stringField(object, "customer"), stripe_subscription_id: stringField(object, "subscription"), stripe_checkout_session_id: stringField(object, "id"), stripe_payment_intent_id: stringField(object, "payment_intent"), billing_note: "SEPA-Zahlung ist fehlgeschlagen." });
  if (event.type === "payment_intent.processing") await updateOrWarn(event.type, object, { billing_status: "pending_sepa_mandate", stripe_customer_id: stringField(object, "customer"), stripe_payment_intent_id: stringField(object, "id"), last_invoice_amount_due_cents: amountReceived(object), billing_note: "SEPA-Zahlung wird verarbeitet; Bestätigung steht aus." });
  if (event.type === "payment_intent.succeeded") await updateOrWarn(event.type, object, { billing_status: "active", billing_last_payment_at: now, billing_last_payment_failed_at: null, billing_retry_count: 0, billing_next_retry_at: null, billing_grace_until: null, billing_suspended_at: null, billing_suspended_reason: null, stripe_customer_id: stringField(object, "customer"), stripe_payment_intent_id: stringField(object, "id"), last_invoice_amount_paid_cents: amountReceived(object), billing_note: "Einmalzahlung von Stripe bestätigt." });
  if (event.type === "payment_intent.payment_failed") await updateOrWarn(event.type, object, { billing_status: "payment_failed", billing_last_payment_failed_at: now, billing_retry_count: retryCount(object), billing_grace_until: graceUntil(object), stripe_customer_id: stringField(object, "customer"), stripe_payment_intent_id: stringField(object, "id"), billing_note: "Einmalzahlung ist fehlgeschlagen." });
  if (event.type === "invoice.paid") await updateOrWarn(event.type, object, { ...invoiceFields(object), billing_status: "active", billing_last_payment_at: now, billing_last_payment_failed_at: null, billing_retry_count: 0, billing_next_retry_at: null, billing_grace_until: null, billing_suspended_at: null, billing_suspended_reason: null, stripe_customer_id: stringField(object, "customer"), stripe_subscription_id: stringField(object, "subscription") });
  if (event.type === "invoice.updated") await updateOrWarn(event.type, object, { ...invoiceFields(object), stripe_customer_id: stringField(object, "customer"), stripe_subscription_id: stringField(object, "subscription") });
  if (event.type === "invoice.payment_failed") { const attempts = retryCount(object); const grace = graceUntil(object); const suspend = attempts >= 3 || Date.now() > Date.parse(grace); await updateOrWarn(event.type, object, { ...invoiceFields(object), billing_status: suspend ? "suspended" : attempts > 1 ? "payment_failed" : "past_due", billing_retry_count: attempts, billing_next_retry_at: stripeTs(numberField(object, "next_payment_attempt")), billing_grace_until: grace, billing_last_payment_failed_at: now, billing_suspended_at: suspend ? now : null, billing_suspended_reason: suspend ? "payment_failed_after_retries" : null, stripe_customer_id: stringField(object, "customer"), stripe_subscription_id: stringField(object, "subscription") }); }
  if (event.type === "customer.subscription.updated") await updateOrWarn(event.type, object, { stripe_customer_id: stringField(object, "customer"), stripe_subscription_id: stringField(object, "id") });
  if (event.type === "customer.subscription.deleted") await updateOrWarn(event.type, object, { billing_status: "cancelled", stripe_customer_id: stringField(object, "customer"), stripe_subscription_id: stringField(object, "id") });
  return NextResponse.json({ received: true });
}
