export const PUBLIC_DAILY_TEST_PLAN_WINDOW_MS = 24 * 60 * 60 * 1000;

export function getTemporaryPublicDailyTestPlanStatus(settings, now = new Date()) {
  const nowMs = now instanceof Date ? now.getTime() : Number.NaN;
  const updatedAtMs = Date.parse(typeof settings?.updatedAt === "string" ? settings.updatedAt : "");
  const enabledUntilMs = Date.parse(
    typeof settings?.publicDailyTestPlanEnabledUntil === "string"
      ? settings.publicDailyTestPlanEnabledUntil
      : "",
  );
  const validWindow = Number.isFinite(nowMs)
    && Number.isFinite(updatedAtMs)
    && Number.isFinite(enabledUntilMs)
    && enabledUntilMs > nowMs
    && enabledUntilMs > updatedAtMs
    && enabledUntilMs - updatedAtMs <= PUBLIC_DAILY_TEST_PLAN_WINDOW_MS;

  return {
    enabled: settings?.publicDailyTestPlanEnabled === true && validWindow,
    enabledUntil: validWindow ? new Date(enabledUntilMs).toISOString() : null,
  };
}

export function createTemporaryPublicDailyTestPlanSettings(enabled, updatedBy, now = new Date()) {
  const updatedAtMs = now instanceof Date ? now.getTime() : Number.NaN;
  if (!Number.isFinite(updatedAtMs)) throw new TypeError("invalid_now");
  const updatedAt = new Date(updatedAtMs).toISOString();
  return {
    publicDailyTestPlanEnabled: enabled === true,
    publicDailyTestPlanEnabledUntil: enabled === true
      ? new Date(updatedAtMs + PUBLIC_DAILY_TEST_PLAN_WINDOW_MS).toISOString()
      : null,
    updatedAt,
    updatedBy,
  };
}
