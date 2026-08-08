import test from "node:test";
import assert from "node:assert/strict";
import { isWorkspaceArchivedAfterSubscriptionEnd, resolveSubscriptionCancellation } from "../src/lib/subscriptionCancellationPolicy.mjs";

const base = {
  id: "ws_1",
  plan_id: "starter",
  billing_status: "active",
  stripe_subscription_id: "sub_1",
  billing_contract_started_at: "2026-01-15T00:00:00.000Z",
  billing_current_period_end_at: "2026-08-15T00:00:00.000Z",
};

test("Flex cancellation is enforced for the paid period end", () => {
  const policy = resolveSubscriptionCancellation({ ...base, commercial_option: "starter_paid_setup" });
  assert.equal(policy.currentPackage, "Starter Flex");
  assert.equal(policy.effectiveEndAt, "2026-08-15T00:00:00.000Z");
  assert.equal(policy.stripeCancelAtPeriodEnd, true);
  assert.equal(policy.canSelfService, true);
});

test("12 month cancellation waits until commitment end", () => {
  const policy = resolveSubscriptionCancellation({ ...base, commercial_option: "starter_no_setup_commitment" });
  assert.equal(policy.minimumTermEndsAt, "2027-01-15T00:00:00.000Z");
  assert.equal(policy.effectiveEndAt, "2027-01-15T00:00:00.000Z");
  assert.equal(policy.requiresCancelAtTimestamp, true);
});

test("1 EUR daily beta uses the same self-service period-end cancellation engine", () => {
  const policy = resolveSubscriptionCancellation({
    ...base,
    plan_id: "pilot",
    commercial_option: "internal_daily_test",
    billing_current_period_end_at: "2026-08-09T00:00:00.000Z",
  });
  assert.equal(policy.currentPackage, "Beta · 1 € pro Tag");
  assert.equal(policy.canSelfService, true);
  assert.equal(policy.stripeCancelAtPeriodEnd, true);
  assert.equal(policy.effectiveEndAt, "2026-08-09T00:00:00.000Z");
});

test("revoked or foreign/unpaid workspaces cannot self-service mutate subscriptions", () => {
  assert.equal(resolveSubscriptionCancellation({ ...base, owner_user_id: "other", commercial_option: "growth" }).canSelfService, false);
  assert.equal(resolveSubscriptionCancellation({ ...base, commercial_option: "starter_paid_setup", stripe_subscription_id: null }).canSelfService, false);
});

test("archive mode keeps login/read visibility but fail-closes paid processing", () => {
  assert.equal(isWorkspaceArchivedAfterSubscriptionEnd({ billing_status: "cancelled" }), true);
  assert.equal(isWorkspaceArchivedAfterSubscriptionEnd({ subscription_effective_end_at: "2026-01-01T00:00:00.000Z" }, new Date("2026-02-01T00:00:00.000Z")), true);
  assert.equal(isWorkspaceArchivedAfterSubscriptionEnd({ billing_status: "active", subscription_effective_end_at: "2027-01-01T00:00:00.000Z" }, new Date("2026-02-01T00:00:00.000Z")), false);
});
