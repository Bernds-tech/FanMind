import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateAiUsageIndicator,
  normalizeAiUsageThreshold,
} from "../src/lib/aiUsagePolicy.mjs";

test("usage thresholds are optional positive integers", () => {
  assert.equal(normalizeAiUsageThreshold(undefined), null);
  assert.equal(normalizeAiUsageThreshold(null), null);
  assert.equal(normalizeAiUsageThreshold(0), null);
  assert.equal(normalizeAiUsageThreshold(-1), null);
  assert.equal(normalizeAiUsageThreshold("not-a-number"), null);
  assert.equal(normalizeAiUsageThreshold(125.6), 126);
});

test("unconfigured thresholds never imply a quota or automatic block", () => {
  assert.deepEqual(
    calculateAiUsageIndicator({ requests: 500, tokens: 1_000_000 }),
    {
      configured: false,
      level: "unconfigured",
      usageRatio: null,
      usagePercent: null,
      requestWarning: null,
      tokenWarning: null,
    },
  );
});

test("usage indicator uses the highest configured soft-threshold ratio", () => {
  const normal = calculateAiUsageIndicator({
    requests: 40,
    tokens: 20_000,
    requestWarning: 100,
    tokenWarning: 100_000,
  });
  assert.equal(normal.configured, true);
  assert.equal(normal.level, "normal");
  assert.equal(normal.usagePercent, 40);

  const warning = calculateAiUsageIndicator({
    requests: 85,
    tokens: 20_000,
    requestWarning: 100,
    tokenWarning: 100_000,
  });
  assert.equal(warning.level, "warning");
  assert.equal(warning.usagePercent, 85);

  const attention = calculateAiUsageIndicator({
    requests: 101,
    tokens: 20_000,
    requestWarning: 100,
    tokenWarning: 100_000,
  });
  assert.equal(attention.level, "attention");
  assert.equal(attention.usagePercent, 100);
  assert.equal(attention.usageRatio, 1.01);
});

test("one configured threshold is sufficient and negative usage is normalized", () => {
  const tokenOnly = calculateAiUsageIndicator({
    requests: -10,
    tokens: 80_000,
    tokenWarning: 100_000,
  });
  assert.equal(tokenOnly.level, "warning");
  assert.equal(tokenOnly.usagePercent, 80);
  assert.equal(tokenOnly.requestWarning, null);
  assert.equal(tokenOnly.tokenWarning, 100_000);
});
