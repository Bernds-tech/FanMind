import assert from "node:assert/strict";
import test from "node:test";

import {
  AI_TIER_CONFIG,
  assertAiTierPolicy,
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
