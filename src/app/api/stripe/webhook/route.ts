import { NextRequest, NextResponse } from "next/server";
import { syncReferralAutomationForWorkspace } from "@/lib/referralAutomation";
import {
  findWorkspaceIdByStripeReferences,
  updateWorkspaceBillingDefensively,
  verifyStripeSignature,
} from "@/lib/stripeBilling";

type StripeObject = Record<string, unknown>;
type StripeEvent = {
  id?: string;
  type?: string;
  data?: { object?: StripeObject };
};

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

function metadataWorkspaceId(object: StripeObject | undefined): string | undefined {
  return stringField(objectField(object, "metadata"), "workspace_id");
}

function subscriptionStatusFields(object: StripeObject) {
  const status = stringField(object, "status");
  const billingStatus =
    status === "active" || status === "trialing"
      ? "active"
      : status === "past_due"
        ? "past_due"
        : status === "unpaid"
          ? "payment_failed"
          : status === "paused"
            ? "suspended"
            : status === "canceled" || status === "incomplete_expired"
              ? "cancelled"
              : undefined;
  return {
    billing_status: billingStatus,
    stripe_customer_id: stringField(object, "customer"),
    stripe_subscription_id: stringField(object, "id"),
    billing_note: status ? `Stripe-Subscription-Status: ${status}` : undefined,
  };
}

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

function lineWorkspaceId(object: StripeObject): string | undefined {
  const lines = objectField(object, "lines");
  return arrayField(lines, "data")
    ?.map((line) => metadataWorkspaceId(line as StripeObject))
    .find(Boolean);
}

function workspaceIdFromObject(object: StripeObject): string | undefined {
  return (
    metadataWorkspaceId(object) ??
    stringField(object, "client_reference_id") ??
    metadataWorkspaceId(objectField(object, "subscription_details")) ??
    metadataWorkspaceId(
      objectField(objectField(object, "parent"), "subscription_details"),
    ) ??
    metadataWorkspaceId(objectField(object, "payment_intent_data")) ??
    lineWorkspaceId(object)
  );
}

async function resolveWorkspaceId(
  object: StripeObject,
): Promise<string | undefined> {
  const direct = workspaceIdFromObject(object);
  if (direct) return direct;
  return (
    (await findWorkspaceIdByStripeReferences({
      customerId:
        stripeId(object.customer) ?? objectIdWithPrefix(object, "cus_"),
      subscriptionId:
        stripeId(object.subscription) ?? objectIdWithPrefix(object, "sub_"),
      paymentIntentId:
        stripeId(object.payment_intent) ?? objectIdWithPrefix(object, "pi_"),
    })) ?? undefined
  );
}

async function updateOrWarn(input: {
  eventType: string | undefined;
  eventId: string | undefined;
  object: StripeObject;
  fields: Record<string, string | number | boolean | null | undefined>;
  referralBillingStatus?: string | null;
}): Promise<void> {
  const workspaceId = await resolveWorkspaceId(input.object);
  if (!workspaceId) {
    console.warn("Stripe webhook without workspace mapping", {
      eventType: input.eventType,
      eventId: input.eventId,
      objectId: stringField(input.object, "id"),
    });
    return;
  }

  await updateWorkspaceBillingDefensively(workspaceId, input.fields);
  const billingStatus =
    input.referralBillingStatus ??
    (typeof input.fields.billing_status === "string"
      ? input.fields.billing_status
      : undefined);

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
  const object = event.data?.object ?? {};
  const now = new Date().toISOString();
  const update = (
    fields: Record<string, string | number | boolean | null | undefined>,
    referralBillingStatus?: string | null,
  ) =>
    updateOrWarn({
      eventType: event.type,
      eventId: event.id,
      object,
      fields,
      referralBillingStatus,
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
    const suspend = attempts >= 3 || Date.now() > Date.parse(grace);
    const billingStatus = suspend
      ? "suspended"
      : attempts > 1
        ? "payment_failed"
        : "past_due";
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
      stripe_customer_id: stringField(object, "customer"),
      stripe_subscription_id: stringField(object, "id"),
      billing_note: "Stripe-Subscription wurde beendet.",
    });
  }

  if (
    event.type === "charge.refunded" ||
    event.type === "refund.created" ||
    event.type === "charge.dispute.created"
  ) {
    await update(
      {
        stripe_customer_id: stringField(object, "customer"),
        stripe_payment_intent_id: stringField(object, "payment_intent"),
        billing_note:
          event.type === "charge.dispute.created"
            ? "Stripe-Zahlung wurde beanstandet; Referral wird geprüft."
            : "Stripe-Zahlung wurde rückerstattet; Referral wird deaktiviert.",
      },
      "refunded",
    );
  }

  return NextResponse.json({ received: true });
}
