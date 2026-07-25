export const FOLLOWUP_NOTIFICATION_TYPE = "followup_reminder";
export const FOLLOWUP_NOTIFICATION_ROUTE = "/(app)/followups";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseFollowupNotificationData(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const keys = Object.keys(value);
  if (
    keys.length !== 2 ||
    !keys.includes("type") ||
    !keys.includes("followupId") ||
    value.type !== FOLLOWUP_NOTIFICATION_TYPE ||
    typeof value.followupId !== "string" ||
    !UUID_PATTERN.test(value.followupId)
  ) {
    return null;
  }

  return {
    type: FOLLOWUP_NOTIFICATION_TYPE,
    followupId: value.followupId,
    route: FOLLOWUP_NOTIFICATION_ROUTE,
  };
}
