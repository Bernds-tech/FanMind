import test from "node:test";
import assert from "node:assert/strict";
import { computeCancellationEffectiveAt, getCancellationState, canManageSubscription, isWorkspaceArchiveMode } from "../src/lib/subscriptionCancellationPolicy.mjs";

test("Starter Flex cancels at current period end", () => {
  const effective = computeCancellationEffectiveAt({
    commercialOption: "starter_paid_setup",
    currentPeriodEnd: "2026-08-20T00:00:00.000Z",
    commitmentMonths: 0,
  });
  assert.equal(effective, "2026-08-20T00:00:00.000Z");
});

test("Starter 12 months cannot end before commitment end", () => {
  const effective = computeCancellationEffectiveAt({
    commercialOption: "starter_no_setup_commitment",
    currentPeriodEnd: "2026-08-20T00:00:00.000Z",
    commitmentStartedAt: "2026-07-20T00:00:00.000Z",
    commitmentMonths: 12,
  });
  assert.equal(effective, "2027-07-20T00:00:00.000Z");
});

test("only owner with mapped subscription can manage", () => {
  assert.equal(canManageSubscription({ owner_user_id: "u1", stripe_subscription_id: "sub_1" }, "u1"), true);
  assert.equal(canManageSubscription({ owner_user_id: "u1", stripe_subscription_id: "sub_1" }, "u2"), false);
  assert.equal(canManageSubscription({ owner_user_id: "u1", stripe_subscription_id: null }, "u1"), false);
});

test("cancelled workspace is archive mode and pending cancellation remains active until effective", () => {
  assert.equal(isWorkspaceArchiveMode({ billing_status: "cancelled" }), true);
  assert.deepEqual(getCancellationState({ billing_status: "active", cancellation_requested_at: "2026-07-20T00:00:00Z", cancellation_effective_at: "2026-08-20T00:00:00Z" }), {
    archiveMode: false,
    cancellationPending: true,
    effectiveAt: "2026-08-20T00:00:00Z",
    requestedAt: "2026-07-20T00:00:00Z",
  });
});
