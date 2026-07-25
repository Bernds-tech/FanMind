export const FOLLOWUP_NOTIFICATION_TYPE = "followup_reminder";
export const FOLLOWUP_NOTIFICATION_ROUTE = "/(app)/followups";
export const MAX_NOTIFICATION_RESPONSE_IDENTIFIER_LENGTH = 256;

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

export function createFollowupNotificationIntent(
  value,
  defaultActionIdentifier,
) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    typeof defaultActionIdentifier !== "string" ||
    value.actionIdentifier !== defaultActionIdentifier ||
    typeof value.requestIdentifier !== "string" ||
    value.requestIdentifier.length === 0 ||
    value.requestIdentifier.length >
      MAX_NOTIFICATION_RESPONSE_IDENTIFIER_LENGTH ||
    /[\u0000-\u001f\u007f]/u.test(value.requestIdentifier)
  ) {
    return null;
  }

  const data = parseFollowupNotificationData(value.data);
  if (!data) return null;

  return {
    ...data,
    responseIdentifier: value.requestIdentifier,
  };
}

export function decideFollowupNotificationIntent({
  authLoading,
  hasSession,
  segments,
  pendingIntent,
}) {
  if (!pendingIntent || authLoading || !hasSession) return "wait";
  if (!Array.isArray(segments)) return "wait";
  if (segments[0] === "(auth)") return "wait";
  if (segments[0] === "(app)" && segments[1] === "followups") {
    return "consume";
  }
  return "navigate";
}
