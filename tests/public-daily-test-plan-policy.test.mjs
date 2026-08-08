import assert from "node:assert/strict";
import test from "node:test";

import {
  createTemporaryPublicDailyTestPlanSettings,
  getTemporaryPublicDailyTestPlanStatus,
  PUBLIC_DAILY_TEST_PLAN_WINDOW_MS,
} from "../src/lib/publicDailyTestPlanPolicy.mjs";

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
