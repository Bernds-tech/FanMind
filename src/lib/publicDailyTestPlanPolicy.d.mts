export const PUBLIC_DAILY_TEST_PLAN_WINDOW_MS: number;
export function getTemporaryPublicDailyTestPlanStatus(
  settings: unknown,
  now?: Date,
): { enabled: boolean; enabledUntil: string | null };
export function createTemporaryPublicDailyTestPlanSettings(
  enabled: boolean,
  updatedBy: string,
  now?: Date,
): {
  publicDailyTestPlanEnabled: boolean;
  publicDailyTestPlanEnabledUntil: string | null;
  updatedAt: string;
  updatedBy: string;
};
