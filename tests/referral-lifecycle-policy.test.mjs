import assert from "node:assert/strict";
import test from "node:test";

import {
  billingStatusFromInvoiceFailure,
  billingStatusFromStripeSubscriptionStatus,
  referralBillingStatusFromStripeEvent,
} from "../src/lib/referralLifecyclePolicy.mjs";

test("subscription lifecycle maps only eligible paid states to active", () => {
  assert.equal(billingStatusFromStripeSubscriptionStatus("active"), "active");
  assert.equal(billingStatusFromStripeSubscriptionStatus("trialing"), "active");
  assert.equal(billingStatusFromStripeSubscriptionStatus("past_due"), "past_due");
  assert.equal(
    billingStatusFromStripeSubscriptionStatus("unpaid"),
    "payment_failed",
  );
  assert.equal(billingStatusFromStripeSubscriptionStatus("paused"), "suspended");
  assert.equal(billingStatusFromStripeSubscriptionStatus("canceled"), "cancelled");
  assert.equal(
    billingStatusFromStripeSubscriptionStatus("incomplete_expired"),
    "cancelled",
  );
  assert.equal(billingStatusFromStripeSubscriptionStatus("incomplete"), null);
});

test("invoice failure escalates from past due to payment failed and suspended", () => {
  assert.equal(
    billingStatusFromInvoiceFailure({ attemptCount: 1, graceExpired: false }),
    "past_due",
  );
  assert.equal(
    billingStatusFromInvoiceFailure({ attemptCount: 2, graceExpired: false }),
    "payment_failed",
  );
  assert.equal(
    billingStatusFromInvoiceFailure({ attemptCount: 3, graceExpired: false }),
    "suspended",
  );
  assert.equal(
    billingStatusFromInvoiceFailure({ attemptCount: 1, graceExpired: true }),
    "suspended",
  );
});

test("successful Stripe payments activate referral eligibility", () => {
  for (const eventType of [
    "checkout.session.async_payment_succeeded",
    "payment_intent.succeeded",
    "invoice.paid",
  ]) {
    assert.equal(referralBillingStatusFromStripeEvent({ eventType }), "active");
  }

  assert.equal(
    referralBillingStatusFromStripeEvent({
      eventType: "checkout.session.completed",
      paymentStatus: "paid",
    }),
    "active",
  );
});

test("pending and failed Stripe payments cannot create active referrals", () => {
  assert.equal(
    referralBillingStatusFromStripeEvent({
      eventType: "checkout.session.completed",
      paymentStatus: "unpaid",
    }),
    "pending_sepa_mandate",
  );
  assert.equal(
    referralBillingStatusFromStripeEvent({ eventType: "payment_intent.processing" }),
    "pending_sepa_mandate",
  );

  for (const eventType of [
    "checkout.session.async_payment_failed",
    "payment_intent.payment_failed",
  ]) {
    assert.equal(
      referralBillingStatusFromStripeEvent({ eventType }),
      "payment_failed",
    );
  }
});

test("invoice retries and subscription changes drive deterministic deactivation", () => {
  assert.equal(
    referralBillingStatusFromStripeEvent({
      eventType: "invoice.payment_failed",
      attemptCount: 1,
    }),
    "past_due",
  );
  assert.equal(
    referralBillingStatusFromStripeEvent({
      eventType: "invoice.payment_failed",
      attemptCount: 2,
    }),
    "payment_failed",
  );
  assert.equal(
    referralBillingStatusFromStripeEvent({
      eventType: "invoice.payment_failed",
      attemptCount: 3,
    }),
    "suspended",
  );
  assert.equal(
    referralBillingStatusFromStripeEvent({
      eventType: "customer.subscription.paused",
      subscriptionStatus: "paused",
    }),
    "suspended",
  );
  assert.equal(
    referralBillingStatusFromStripeEvent({
      eventType: "customer.subscription.deleted",
    }),
    "cancelled",
  );
  assert.equal(
    referralBillingStatusFromStripeEvent({
      eventType: "customer.subscription.resumed",
      subscriptionStatus: "active",
    }),
    "active",
  );
});

test("refunds and disputes deactivate referral eligibility", () => {
  for (const eventType of [
    "charge.refunded",
    "refund.created",
    "charge.dispute.created",
  ]) {
    assert.equal(
      referralBillingStatusFromStripeEvent({ eventType }),
      "refunded",
    );
  }
});

test("unrelated Stripe events do not invent a referral billing status", () => {
  assert.equal(
    referralBillingStatusFromStripeEvent({ eventType: "invoice.updated" }),
    null,
  );
  assert.equal(referralBillingStatusFromStripeEvent({}), null);
});
