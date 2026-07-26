import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

import {
  AI_TIER_CONFIG,
  assertAiTierPolicy,
  evaluateAiTierReadiness,
  formatAiTierPrice,
  getAiTierTotalMonthlyCents,
  isAiTierAutomaticallyBookable,
} from "../src/config/aiTiers.mjs";

test("approved AI tier prices and package totals remain stable", () => {
  assert.equal(AI_TIER_CONFIG.standard.monthlyAddOnCents, 0);
  assert.equal(AI_TIER_CONFIG.plus.monthlyAddOnCents, 10000);
  assert.equal(AI_TIER_CONFIG.ultra.monthlyAddOnCents, 20000);

  assert.equal(getAiTierTotalMonthlyCents("standard", 31200), 31200);
  assert.equal(getAiTierTotalMonthlyCents("plus", 31200), 41200);
  assert.equal(getAiTierTotalMonthlyCents("ultra", 31200), 51200);
});

test("KI Standard remains included and Plus/Ultra remain separate add-ons", () => {
  assert.equal(AI_TIER_CONFIG.standard.includedInBase, true);
  assert.equal(AI_TIER_CONFIG.plus.includedInBase, false);
  assert.equal(AI_TIER_CONFIG.ultra.includedInBase, false);
  assert.equal(formatAiTierPrice("standard"), "im Basispaket enthalten");
  assert.equal(formatAiTierPrice("plus"), "+100 €/Monat");
  assert.equal(formatAiTierPrice("ultra"), "+200 €/Monat");
});

test("no AI add-on is referral-discount eligible or allowed to send automatically", () => {
  for (const tier of Object.values(AI_TIER_CONFIG)) {
    assert.equal(tier.addOnReferralDiscountEligible, false);
    assert.equal(tier.automaticSendingEnabled, false);
  }
  assert.equal(assertAiTierPolicy(), true);
});

test("Plus and Ultra cannot be automatically booked before models, limits and billing are approved", () => {
  assert.equal(isAiTierAutomaticallyBookable("standard"), false);
  assert.equal(isAiTierAutomaticallyBookable("plus"), false);
  assert.equal(isAiTierAutomaticallyBookable("ultra"), false);

  assert.equal(AI_TIER_CONFIG.plus.modelClass, null);
  assert.equal(AI_TIER_CONFIG.plus.monthlyRequestLimit, null);
  assert.equal(AI_TIER_CONFIG.ultra.modelClass, null);
  assert.equal(AI_TIER_CONFIG.ultra.monthlyTokenLimit, null);
});

test("current tier readiness is explicit and fail-closed", () => {
  const standard = evaluateAiTierReadiness("standard");
  const plus = evaluateAiTierReadiness("plus", {
    stripePriceConfigured: true,
    workspaceContractConfirmed: true,
  });
  const ultra = evaluateAiTierReadiness("ultra", {
    stripePriceConfigured: true,
    workspaceContractConfirmed: true,
  });

  assert.equal(standard.ready, true);
  assert.equal(standard.automaticallyBookable, false);
  assert.deepEqual(standard.blockers, []);

  for (const readiness of [plus, ultra]) {
    assert.equal(readiness.ready, false);
    assert.equal(readiness.automaticallyBookable, false);
    assert.ok(readiness.blockers.includes("public_status"));
    assert.ok(readiness.blockers.includes("billing_status"));
    assert.ok(readiness.blockers.includes("booking_flag"));
    assert.ok(readiness.blockers.includes("model_class"));
    assert.ok(readiness.blockers.includes("monthly_request_limit"));
    assert.ok(readiness.blockers.includes("monthly_token_limit"));
    assert.ok(readiness.blockers.includes("context_message_limit"));
    assert.ok(!readiness.blockers.includes("stripe_price"));
    assert.ok(!readiness.blockers.includes("workspace_contract"));
  }

  assert.equal(
    isAiTierAutomaticallyBookable("plus", {
      stripePriceConfigured: true,
      workspaceContractConfirmed: true,
    }),
    false,
  );
});

test("readiness command reports only stable status and blocker codes", () => {
  const fakePlusPrice = "price_plus_DO_NOT_PRINT";
  const fakeUltraPrice = "price_ultra_DO_NOT_PRINT";
  const result = spawnSync(
    process.execPath,
    ["scripts/operations/verify-ai-tier-readiness.mjs"],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      env: {
        ...process.env,
        STRIPE_PRICE_AI_PLUS: fakePlusPrice,
        STRIPE_PRICE_AI_ULTRA: fakeUltraPrice,
        FANMIND_AI_TIER_WORKSPACE_CONTRACT_CONFIRMED: "true",
      },
    },
  );

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /AI_TIER_STANDARD=READY blockers=none/u);
  assert.match(result.stdout, /AI_TIER_PLUS=BLOCKED/u);
  assert.match(result.stdout, /AI_TIER_ULTRA=BLOCKED/u);
  assert.match(result.stdout, /AI_TIER_READINESS=PASS/u);
  assert.doesNotMatch(result.stdout, /DO_NOT_PRINT/u);
  assert.equal(result.stderr, "");
});
