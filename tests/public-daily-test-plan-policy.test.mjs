import assert from "node:assert/strict";
import test from "node:test";

import {
  createTemporaryPublicDailyTestPlanSettings,
  getTemporaryPublicDailyTestPlanStatus,
  PUBLIC_DAILY_TEST_PLAN_WINDOW_MS,
} from "../src/lib/publicDailyTestPlanPolicy.mjs";
import {
  isInternalDailyTestAdmissionReady,
  isInternalDailyTestStripeReady,
} from "../src/lib/internalDailyTestReadinessPolicy.mjs";

test("public daily test access is a bounded 24-hour window, never a permanent catalog offer", () => {
  const now = new Date("2026-08-08T18:00:00.000Z");
  const settings = createTemporaryPublicDailyTestPlanSettings(true, "admin@example.invalid", now);
  assert.equal(
    Date.parse(settings.publicDailyTestPlanEnabledUntil) - Date.parse(settings.updatedAt),
    PUBLIC_DAILY_TEST_PLAN_WINDOW_MS,
  );
  assert.equal(getTemporaryPublicDailyTestPlanStatus(settings, now).enabled, true);
  assert.equal(
    getTemporaryPublicDailyTestPlanStatus(
      settings,
      new Date(now.getTime() + PUBLIC_DAILY_TEST_PLAN_WINDOW_MS - 1),
    ).enabled,
    true,
  );
  assert.equal(
    getTemporaryPublicDailyTestPlanStatus(
      settings,
      new Date(now.getTime() + PUBLIC_DAILY_TEST_PLAN_WINDOW_MS),
    ).enabled,
    false,
  );
  assert.equal(
    getTemporaryPublicDailyTestPlanStatus(
      settings,
      new Date(now.getTime() + PUBLIC_DAILY_TEST_PLAN_WINDOW_MS + 1),
    ).enabled,
    false,
  );
});

test("legacy, malformed and overlong public daily test flags fail closed", () => {
  const now = new Date("2026-08-08T18:00:00.000Z");
  assert.equal(getTemporaryPublicDailyTestPlanStatus({ publicDailyTestPlanEnabled: true }, now).enabled, false);
  assert.equal(getTemporaryPublicDailyTestPlanStatus({
    publicDailyTestPlanEnabled: true,
    updatedAt: now.toISOString(),
    publicDailyTestPlanEnabledUntil: new Date(now.getTime() + PUBLIC_DAILY_TEST_PLAN_WINDOW_MS * 2).toISOString(),
  }, now).enabled, false);
  assert.equal(getTemporaryPublicDailyTestPlanStatus({
    ...createTemporaryPublicDailyTestPlanSettings(false, "admin@example.invalid", now),
    publicDailyTestPlanEnabled: false,
  }, now).enabled, false);
});

test("future-dated public daily test windows fail closed at the start boundary", () => {
  const now = new Date("2026-08-08T18:00:00.000Z");
  const startsNow = createTemporaryPublicDailyTestPlanSettings(
    true,
    "admin@example.invalid",
    now,
  );
  assert.deepEqual(getTemporaryPublicDailyTestPlanStatus(startsNow, now), {
    enabled: true,
    enabledUntil: startsNow.publicDailyTestPlanEnabledUntil,
  });

  for (const futureOffsetMs of [1, 60_000, PUBLIC_DAILY_TEST_PLAN_WINDOW_MS]) {
    const futureStart = new Date(now.getTime() + futureOffsetMs);
    const futureSettings = createTemporaryPublicDailyTestPlanSettings(
      true,
      "admin@example.invalid",
      futureStart,
    );
    assert.deepEqual(
      getTemporaryPublicDailyTestPlanStatus(futureSettings, now),
      { enabled: false, enabledUntil: null },
    );
  }
});

test("Daily admission requires complete checkout and webhook configuration", () => {
  const stripeConfig = {
    hasSecretKey: true,
    hasWebhookSecret: true,
    hasAppUrl: true,
    hasInternalDailyTestPrice: true,
    readyForWebhook: true,
    readyForTax: true,
  };

  assert.equal(isInternalDailyTestStripeReady(stripeConfig), true);
  assert.equal(isInternalDailyTestAdmissionReady({
    windowEnabled: true,
    workspaceProvisioningReady: true,
    stripeConfig,
  }), true);

  for (const missingField of Object.keys(stripeConfig)) {
    const incompleteConfig = { ...stripeConfig, [missingField]: false };
    assert.equal(
      isInternalDailyTestStripeReady(incompleteConfig),
      false,
      `${missingField} must fail closed`,
    );
    assert.equal(isInternalDailyTestAdmissionReady({
      windowEnabled: true,
      workspaceProvisioningReady: true,
      stripeConfig: incompleteConfig,
    }), false);
  }

  assert.equal(isInternalDailyTestAdmissionReady({
    windowEnabled: false,
    workspaceProvisioningReady: true,
    stripeConfig,
  }), false);
  assert.equal(isInternalDailyTestAdmissionReady({
    windowEnabled: true,
    workspaceProvisioningReady: false,
    stripeConfig,
  }), false);
  assert.equal(isInternalDailyTestAdmissionReady({
    windowEnabled: true,
    workspaceProvisioningReady: true,
  }), false);
});
