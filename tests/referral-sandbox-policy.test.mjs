import assert from "node:assert/strict";
import test from "node:test";

import {
  WRITE_ACKNOWLEDGEMENT,
  evaluateReferralSandboxConfiguration,
} from "../src/lib/referralSandboxPolicy.mjs";

const completeReadOnlyEnvironment = {
  STRIPE_SECRET_KEY: "sk_test_example",
  STRIPE_WEBHOOK_SECRET: "whsec_example",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-example",
  FANMIND_REFERRAL_RECONCILE_SECRET: "x".repeat(48),
  FANMIND_ENABLE_REFERRAL_BILLING: "false",
  NEXT_PUBLIC_APP_URL: "https://fanmind.ch",
};

test("read-only preflight accepts test credentials without exposing write mode", () => {
  const result = evaluateReferralSandboxConfiguration(
    completeReadOnlyEnvironment,
  );

  assert.equal(result.ok, true);
  assert.equal(result.mode, "read-only");
  assert.equal(result.stripeKeyMode, "test");
  assert.equal(result.billingEnabled, false);
  assert.equal(result.productionHostname, true);
});

test("live Stripe keys are rejected in every sandbox mode", () => {
  const result = evaluateReferralSandboxConfiguration({
    ...completeReadOnlyEnvironment,
    STRIPE_SECRET_KEY: "sk_live_forbidden",
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /Live-Stripe-Schlüssel/);
});

test("read-only preflight fails when referral billing is enabled", () => {
  const result = evaluateReferralSandboxConfiguration({
    ...completeReadOnlyEnvironment,
    FANMIND_ENABLE_REFERRAL_BILLING: "true",
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /Read-only Preflight/);
});

test("write mode requires explicit acknowledgement and non-production target", () => {
  const unsafe = evaluateReferralSandboxConfiguration(
    {
      ...completeReadOnlyEnvironment,
      FANMIND_ENABLE_REFERRAL_BILLING: "true",
    },
    { allowWrite: true },
  );

  assert.equal(unsafe.ok, false);
  assert.match(unsafe.errors.join("\n"), /SANDBOX_ACK/);
  assert.match(unsafe.errors.join("\n"), /nicht gegen fanmind\.ch/);

  const safe = evaluateReferralSandboxConfiguration(
    {
      ...completeReadOnlyEnvironment,
      FANMIND_ENABLE_REFERRAL_BILLING: "true",
      FANMIND_REFERRAL_SANDBOX_ACK: WRITE_ACKNOWLEDGEMENT,
      NEXT_PUBLIC_APP_URL: "https://staging.fanmind.example",
    },
    { allowWrite: true },
  );

  assert.equal(safe.ok, true);
  assert.equal(safe.mode, "sandbox-write");
  assert.equal(safe.productionHostname, false);
});

test("missing webhook, service role and reconcile secrets fail without revealing values", () => {
  const result = evaluateReferralSandboxConfiguration({
    STRIPE_SECRET_KEY: "sk_test_example",
    FANMIND_ENABLE_REFERRAL_BILLING: "false",
    NEXT_PUBLIC_APP_URL: "https://fanmind.ch",
  });

  assert.equal(result.ok, false);
  assert.equal(result.webhookConfigured, false);
  assert.equal(result.serviceRoleConfigured, false);
  assert.equal(result.reconcileSecretConfigured, false);
  assert.match(result.errors.join("\n"), /STRIPE_WEBHOOK_SECRET/);
  assert.match(result.errors.join("\n"), /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(result.errors.join("\n"), /FANMIND_REFERRAL_RECONCILE_SECRET/);
});
