import { NextRequest, NextResponse } from "next/server";
import { updateWorkspaceBillingDefensively, verifyStripeSignature } from "@/lib/stripeBilling";

type StripeEvent = { type?: string; data?: { object?: Record<string, unknown> } };

function stringField(object: Record<string, unknown>, key: string): string | undefined {
  const value = object[key];
  return typeof value === "string" ? value : undefined;
}

function metadataWorkspaceId(object: Record<string, unknown>): string | undefined {
  const metadata = object.metadata;
  return metadata && typeof metadata === "object" ? stringField(metadata as Record<string, unknown>, "workspace_id") : undefined;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  if (!verifyStripeSignature(rawBody, request.headers.get("stripe-signature"))) {
    return NextResponse.json({ error: "Ungültige Stripe-Signatur." }, { status: 400 });
  }

  const event = JSON.parse(rawBody) as StripeEvent;
  const object = event.data?.object ?? {};
  const workspaceId = metadataWorkspaceId(object);

  if (event.type === "checkout.session.completed") {
    await updateWorkspaceBillingDefensively(workspaceId, {
      billing_status: "pending_sepa_mandate",
      stripe_customer_id: stringField(object, "customer"),
      stripe_subscription_id: stringField(object, "subscription"),
      stripe_checkout_session_id: stringField(object, "id"),
      stripe_payment_intent_id: stringField(object, "payment_intent"),
      stripe_mandate_id: stringField(object, "setup_intent"),
      billing_note: "Stripe Checkout abgeschlossen; SEPA-Bestätigung kann einige Tage dauern.",
    });
  }

  if (event.type === "invoice.paid") {
    await updateWorkspaceBillingDefensively(workspaceId, { billing_status: "active", stripe_customer_id: stringField(object, "customer"), stripe_subscription_id: stringField(object, "subscription") });
  }

  if (event.type === "invoice.payment_failed") {
    await updateWorkspaceBillingDefensively(workspaceId, { billing_status: "payment_failed", stripe_customer_id: stringField(object, "customer"), stripe_subscription_id: stringField(object, "subscription") });
  }

  if (event.type === "customer.subscription.updated") {
    await updateWorkspaceBillingDefensively(workspaceId, { stripe_customer_id: stringField(object, "customer"), stripe_subscription_id: stringField(object, "id") });
  }

  if (event.type === "customer.subscription.deleted") {
    await updateWorkspaceBillingDefensively(workspaceId, { billing_status: "cancelled", stripe_customer_id: stringField(object, "customer"), stripe_subscription_id: stringField(object, "id") });
  }

  return NextResponse.json({ received: true });
}
