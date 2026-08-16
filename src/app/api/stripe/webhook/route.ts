import { NextRequest, NextResponse } from "next/server";
import { syncWorkspaceAiTierStripeEntitlement } from "@/lib/aiTierStripeEntitlementSync.mjs";
import { AI_TIER_STRIPE_EVENT_TYPES } from "@/lib/aiTierStripeLifecycle.mjs";
import { syncReferralAutomationForWorkspace } from "@/lib/referralAutomation";
import {
  billingStatusFromInvoiceFailure,
  billingStatusFromStripeSubscriptionStatus,
  referralBillingStatusFromStripeEvent,
} from "@/lib/referralLifecyclePolicy.mjs";
import {
  findWorkspaceIdByStripeReferences,
  updateWorkspaceBillingDefensively,
  verifyStripeSubscriptionWorkspaceBinding,
  verifyStripeSignature,
  type StripeWorkspaceResolution,
} from "@/lib/stripeBilling";
import {
  STRIPE_BILLING_ALLOWED,
  STRIPE_BILLING_BLOCKED,
  STRIPE_BILLING_RETRYABLE_ERROR,
  STRIPE_BILLING_UPDATED,
  resolveStripeWebhookWorkspaceCandidates,
} from "@/lib/stripeWorkspacePolicy.mjs";
import { isHandledStripeWebhookEventType } from "@/lib/stripeWebhookEventPolicy.mjs";

type StripeObject = Record<string, unknown>;
type StripeEvent = {
  id?: string;
  created?: number;
  type?: string;
  data?: { object?: StripeObject };
};

class StripeWebhookRetryableError extends Error {
  constructor() {
    super("stripe_webhook_billing_update_retryable");
    this.name = "StripeWebhookRetryableError";
  }
}

function objectField(
  object: StripeObject | undefined,
  key: string,
): StripeObject | undefined {
  const value = object?.[key];
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as StripeObject)
    : undefined;
}

function arrayField(
  object: StripeObject | undefined,
  key: string,
): unknown[] | undefined {
  const value = object?.[key];
  return Array.isArray(value) ? value : undefined;
}

function stringField(
  object: StripeObject | undefined,
  key: string,
): string | undefined {
  const value = object?.[key];
  return typeof value === "string" ? value : undefined;
}

function numberField(object: StripeObject, key: string): number | undefined {
  const value = object[key];
  return typeof value === "number" ? value : undefined;
}

function stripeTs(value?: number): string | null | undefined {
  return typeof value === "number"
    ? new Date(value * 1000).toISOString()
    : value;
}

function metadataWorkspaceIdCandidate(
  object: StripeObject | undefined,
): unknown {
  return objectField(object, "metadata")?.workspace_id;
}

function subscriptionStatusFields(object: StripeObject) {
  const status = stringField(object, "status");
  const billingStatus =
    billingStatusFromStripeSubscriptionStatus(status) ?? undefined;

  return {
    billing_status: billingStatus,
    stripe_customer_id: stringField(object, "customer"),
    stripe_subscription_id: stringField(object, "id"),
    billing_contract_started_at: stripeTs(numberField(object, "created")),
    billing_current_period_end_at: stripeTs(numberField(object, "current_period_end")),
    billing_next_invoice_at: stripeTs(numberField(object, "current_period_end")),
    subscription_cancel_at_period_end: Boolean(object.cancel_at_period_end),
    subscription_effective_end_at: stripeTs(numberField(object, "cancel_at")) ?? (object.cancel_at_period_end ? stripeTs(numberField(object, "current_period_end")) : undefined),
    subscription_cancel_requested_at: object.cancel_at_period_end || numberField(object, "cancel_at") ? nowIso() : undefined,
    workspace_access_mode: status === "canceled" ? "archived_readonly" : undefined,
    billing_note: status ? `Stripe-Subscription-Status: ${status}` : undefined,
  };
}

function nowIso() { return new Date().toISOString(); }

function invoiceFields(object: StripeObject) {
  return {
    last_invoice_id: stringField(object, "id"),
    last_invoice_status: stringField(object, "status"),
    last_invoice_amount_due_cents: numberField(object, "amount_due"),
    last_invoice_amount_paid_cents: numberField(object, "amount_paid"),
    last_invoice_hosted_url: stringField(object, "hosted_invoice_url"),
    last_invoice_pdf_url: stringField(object, "invoice_pdf"),
  };
}

function graceUntil(object: StripeObject): string {
  const start =
    numberField(object, "created") ?? Math.floor(Date.now() / 1000);
  return new Date((start + 10 * 24 * 60 * 60) * 1000).toISOString();
}

function retryCount(object: StripeObject): number {
  return Math.max(1, numberField(object, "attempt_count") ?? 1);
}

function amountReceived(object: StripeObject): number | undefined {
  return (
    numberField(object, "amount_received") ??
    numberField(object, "amount") ??
    numberField(object, "amount_due") ??
    numberField(object, "amount_paid")
  );
}

function stripeId(value: unknown): string | undefined {
  return typeof value === "string"
    ? value
    : stringField(value as StripeObject | undefined, "id");
}

function objectIdWithPrefix(
  object: StripeObject,
  prefix: string,
): string | undefined {
  const id = stringField(object, "id");
  return id?.startsWith(prefix) ? id : undefined;
}

function lineWorkspaceIdCandidates(object: StripeObject): unknown[] {
  const lines = objectField(object, "lines");
  return (arrayField(lines, "data") ?? []).map((line) =>
    metadataWorkspaceIdCandidate(line as StripeObject),
  );
}

function workspaceIdCandidatesFromObject(object: StripeObject): unknown[] {
  return [
    metadataWorkspaceIdCandidate(object),
    object.client_reference_id,
    metadataWorkspaceIdCandidate(objectField(object, "subscription_details")),
    metadataWorkspaceIdCandidate(
      objectField(objectField(object, "parent"), "subscription_details"),
    ),
    metadataWorkspaceIdCandidate(objectField(object, "payment_intent_data")),
    ...lineWorkspaceIdCandidates(object),
  ];
}

async function resolveWorkspaceId(
  object: StripeObject,
  eventType: string | undefined,
): Promise<StripeWorkspaceResolution> {
  const referenceResolution = await findWorkspaceIdByStripeReferences({
    customerId:
      stripeId(object.customer) ?? objectIdWithPrefix(object, "cus_"),
    subscriptionId:
      stripeId(object.subscription) ?? objectIdWithPrefix(object, "sub_"),
    paymentIntentId:
      stripeId(object.payment_intent) ?? objectIdWithPrefix(object, "pi_"),
  });
  return resolveStripeWebhookWorkspaceCandidates({
    directCandidates: workspaceIdCandidatesFromObject(object),
    referenceResolution,
    allowDirectBootstrap: eventType?.startsWith("checkout.session.") === true,
  });
}

async function updateOrWarn(input: {
  eventType: string | undefined;
  eventId: string | undefined;
  object: StripeObject;
  event: StripeEvent;
  fields: Record<string, string | number | boolean | null | undefined>;
  referralBillingStatus?: string | null;
}): Promise<void> {
  const workspaceResolution = await resolveWorkspaceId(
    input.object,
    input.eventType,
  );
  if (workspaceResolution.status === "retryable_error") {
    console.error("Stripe webhook workspace lookup needs retry", {
      eventType: input.eventType,
      eventId: input.eventId,
    });
    throw new StripeWebhookRetryableError();
  }
  if (workspaceResolution.status === "not_found") {
    console.warn("Stripe webhook without workspace mapping", {
      eventType: input.eventType,
      eventId: input.eventId,
      objectId: stringField(input.object, "id"),
    });
    return;
  }
  const workspaceId = workspaceResolution.workspaceId;

  if (input.eventType?.startsWith("customer.subscription.") === true) {
    const bindingDecision =
      await verifyStripeSubscriptionWorkspaceBinding({
        workspaceId,
        customerId: stripeId(input.object.customer),
        subscriptionId: objectIdWithPrefix(input.object, "sub_"),
      });
    if (bindingDecision !== STRIPE_BILLING_ALLOWED) {
      console.error("Stripe subscription workspace binding needs retry", {
        eventType: input.eventType,
        eventId: input.eventId,
      });
      throw new StripeWebhookRetryableError();
    }
  }

  const billingUpdateDecision = await updateWorkspaceBillingDefensively(
    workspaceId,
    input.fields,
  );
  if (billingUpdateDecision === STRIPE_BILLING_BLOCKED) {
    console.warn("Stripe webhook workspace update blocked", {
      eventType: input.eventType,
      eventId: input.eventId,
    });
    return;
  }
  if (billingUpdateDecision === STRIPE_BILLING_RETRYABLE_ERROR) {
    console.error("Stripe webhook workspace update needs retry", {
      eventType: input.eventType,
      eventId: input.eventId,
    });
    throw new StripeWebhookRetryableError();
  }
  if (billingUpdateDecision !== STRIPE_BILLING_UPDATED) {
    throw new StripeWebhookRetryableError();
  }

  if (AI_TIER_STRIPE_EVENT_TYPES.includes(input.eventType ?? "")) {
    const aiTierSync = await syncWorkspaceAiTierStripeEntitlement({
      workspaceId,
      event: input.event,
    });
    if (aiTierSync.status === "retry") {
      console.error("Stripe webhook AI tier update needs retry", {
        eventType: input.eventType,
        eventId: input.eventId,
        reason: aiTierSync.reason,
      });
      throw new StripeWebhookRetryableError();
    }
  }

  const billingStatus =
    input.referralBillingStatus ??
    (typeof input.fields.billing_status === "string"
      ? input.fields.billing_status
      : undefined);

  if (!billingStatus) return;

  const referralResult = await syncReferralAutomationForWorkspace({
    workspaceId,
    billingStatus,
    eventId: input.eventId,
    eventType: input.eventType,
  });
  if (referralResult.error) {
    // Billing updates must remain successful even if the referral migration,
    // reconciliation, or Stripe discount sync needs admin attention.
    console.warn("Referral automation did not complete", {
      eventType: input.eventType,
      eventId: input.eventId,
      workspaceId,
      error: referralResult.error,
    });
  }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  if (!verifyStripeSignature(rawBody, request.headers.get("stripe-signature"))) {
    return NextResponse.json(
      { error: "Ungültige Stripe-Signatur." },
      { status: 400 },
    );
  }

  const event = JSON.parse(rawBody) as StripeEvent;
  if (!isHandledStripeWebhookEventType(event.type)) {
    return NextResponse.json({ received: true });
  }
  const object = event.data?.object ?? {};
  const now = new Date().toISOString();
  const defaultReferralBillingStatus = referralBillingStatusFromStripeEvent({
    eventType: event.type,
    paymentStatus: stringField(object, "payment_status"),
    subscriptionStatus: stringField(object, "status"),
    refundStatus:
      event.type === "refund.created" ||
      event.type === "refund.updated" ||
      event.type === "refund.failed"
        ? stringField(object, "status")
        : undefined,
    attemptCount: numberField(object, "attempt_count"),
    graceExpired:
      event.type === "invoice.payment_failed"
        ? Date.now() > Date.parse(graceUntil(object))
        : false,
  });
  const update = (
    fields: Record<string, string | number | boolean | null | undefined>,
    referralBillingStatus?: string | null,
  ) =>
    updateOrWarn({
      eventType: event.type,
      eventId: event.id,
      object,
      event,
      fields,
      referralBillingStatus:
        referralBillingStatus ?? defaultReferralBillingStatus,
    });

  if (event.type === "checkout.session.completed") {
    const paid = stringField(object, "payment_status") === "paid";
    await update({
      billing_status: paid ? "active" : "pending_sepa_mandate",
      billing_last_payment_at: paid ? now : undefined,
      stripe_customer_id: stringField(object, "customer"),
      stripe_subscription_id: stringField(object, "subscription"),
      stripe_checkout_session_id: stringField(object, "id"),
      stripe_payment_intent_id: stringField(object, "payment_intent"),
      stripe_mandate_id: stringField(object, "setup_intent"),
      billing_note: paid
        ? "Stripe Checkout erfolgreich bezahlt."
        : "Zahlung gestartet; Bestätigung ausstehend.",
    });
  }

  if (event.type === "checkout.session.async_payment_succeeded") {
    await update({
      billing_status: "active",
      billing_last_payment_at: now,
      workspace_access_mode: "active",
      billing_last_payment_failed_at: null,
      billing_retry_count: 0,
      billing_next_retry_at: null,
      billing_grace_until: null,
      billing_suspended_at: null,
      billing_suspended_reason: null,
      stripe_customer_id: stringField(object, "customer"),
      stripe_subscription_id: stringField(object, "subscription"),
      stripe_checkout_session_id: stringField(object, "id"),
      stripe_payment_intent_id: stringField(object, "payment_intent"),
      billing_note: "Asynchrone Zahlung von Stripe bestätigt.",
    });
  }

  if (event.type === "checkout.session.async_payment_failed") {
    await update({
      billing_status: "payment_failed",
      billing_last_payment_failed_at: now,
      billing_retry_count: retryCount(object),
      billing_grace_until: graceUntil(object),
      stripe_customer_id: stringField(object, "customer"),
      stripe_subscription_id: stringField(object, "subscription"),
      stripe_checkout_session_id: stringField(object, "id"),
      stripe_payment_intent_id: stringField(object, "payment_intent"),
      billing_note: "Asynchrone Zahlung ist fehlgeschlagen.",
    });
  }

  if (event.type === "payment_intent.processing") {
    await update({
      billing_status: "pending_sepa_mandate",
      stripe_customer_id: stringField(object, "customer"),
      stripe_payment_intent_id: stringField(object, "id"),
      last_invoice_amount_due_cents: amountReceived(object),
      billing_note: "Zahlung wird verarbeitet; Bestätigung steht aus.",
    });
  }

  if (event.type === "payment_intent.succeeded") {
    await update({
      billing_status: "active",
      billing_last_payment_at: now,
      workspace_access_mode: "active",
      billing_last_payment_failed_at: null,
      billing_retry_count: 0,
      billing_next_retry_at: null,
      billing_grace_until: null,
      billing_suspended_at: null,
      billing_suspended_reason: null,
      stripe_customer_id: stringField(object, "customer"),
      stripe_payment_intent_id: stringField(object, "id"),
      last_invoice_amount_paid_cents: amountReceived(object),
      billing_note: "Einmalzahlung von Stripe bestätigt.",
    });
  }

  if (event.type === "payment_intent.payment_failed") {
    await update({
      billing_status: "payment_failed",
      billing_last_payment_failed_at: now,
      billing_retry_count: retryCount(object),
      billing_grace_until: graceUntil(object),
      stripe_customer_id: stringField(object, "customer"),
      stripe_payment_intent_id: stringField(object, "id"),
      billing_note: "Einmalzahlung ist fehlgeschlagen.",
    });
  }

  if (event.type === "invoice.paid") {
    await update({
      ...invoiceFields(object),
      billing_status: "active",
      billing_last_payment_at: now,
      workspace_access_mode: "active",
      billing_last_payment_failed_at: null,
      billing_retry_count: 0,
      billing_next_retry_at: null,
      billing_grace_until: null,
      billing_suspended_at: null,
      billing_suspended_reason: null,
      stripe_customer_id: stringField(object, "customer"),
      stripe_subscription_id: stringField(object, "subscription"),
    });
  }

  if (event.type === "invoice.updated") {
    await update({
      ...invoiceFields(object),
      stripe_customer_id: stringField(object, "customer"),
      stripe_subscription_id: stringField(object, "subscription"),
    });
  }

  if (event.type === "invoice.payment_failed") {
    const attempts = retryCount(object);
    const grace = graceUntil(object);
    const billingStatus = billingStatusFromInvoiceFailure({
      attemptCount: attempts,
      graceExpired: Date.now() > Date.parse(grace),
    });
    const suspend = billingStatus === "suspended";
    await update({
      ...invoiceFields(object),
      billing_status: billingStatus,
      billing_retry_count: attempts,
      billing_next_retry_at: stripeTs(
        numberField(object, "next_payment_attempt"),
      ),
      billing_grace_until: grace,
      billing_last_payment_failed_at: now,
      billing_suspended_at: suspend ? now : null,
      billing_suspended_reason: suspend
        ? "payment_failed_after_retries"
        : null,
      stripe_customer_id: stringField(object, "customer"),
      stripe_subscription_id: stringField(object, "subscription"),
    });
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.resumed" ||
    event.type === "customer.subscription.paused"
  ) {
    await update(subscriptionStatusFields(object));
  }

  if (event.type === "customer.subscription.deleted") {
    await update({
      billing_status: "cancelled",
      workspace_access_mode: "archived_readonly",
      subscription_effective_end_at: now,
      stripe_customer_id: stringField(object, "customer"),
      stripe_subscription_id: stringField(object, "id"),
      billing_note: "Stripe-Subscription wurde beendet.",
    });
  }

  if (
    event.type === "charge.refunded" ||
    event.type === "refund.created" ||
    event.type === "refund.updated" ||
    event.type === "refund.failed" ||
    event.type === "charge.dispute.created"
  ) {
    const refundStatus = stringField(object, "status");
    const refundSucceeded =
      event.type === "charge.refunded" ||
      event.type === "charge.dispute.created" ||
      refundStatus === "succeeded";
    await update(
      {
        stripe_customer_id: stringField(object, "customer"),
        stripe_payment_intent_id: stringField(object, "payment_intent"),
        billing_note:
          event.type === "charge.dispute.created"
            ? "Stripe-Zahlung wurde beanstandet; Referral wird geprüft."
            : refundSucceeded
              ? "Stripe-Zahlung wurde rückerstattet; Referral wird deaktiviert."
              : refundStatus === "failed" || refundStatus === "canceled"
                ? "Stripe-Rückerstattung wurde nicht abgeschlossen; Referral bleibt unverändert."
                : "Stripe-Rückerstattung wird verarbeitet; Referral bleibt bis zur Bestätigung unverändert.",
      },
      refundSucceeded ? "refunded" : null,
    );
  }

  if (
    event.type === "customer.tax_id.created" ||
    event.type === "customer.tax_id.updated" ||
    event.type === "customer.tax_id.deleted"
  ) {
    const verification = objectField(object, "verification");
    const verificationStatus = stringField(verification, "status");
    const billingNote = event.type === "customer.tax_id.deleted"
      ? "Stripe-Steuer-ID wurde entfernt."
      : verificationStatus === "verified"
        ? "Stripe-Steuer-ID wurde verifiziert."
        : verificationStatus === "pending"
          ? "Stripe-Steuer-ID-Prüfung ist ausstehend."
          : "Stripe-Steuer-ID ist noch nicht verifiziert.";
    await update({ billing_note: billingNote }, null);
  }

  return NextResponse.json({ received: true });
}
