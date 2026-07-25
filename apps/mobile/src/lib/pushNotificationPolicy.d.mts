export const FOLLOWUP_NOTIFICATION_TYPE: "followup_reminder";
export const FOLLOWUP_NOTIFICATION_ROUTE: "/(app)/followups";

export type FollowupNotificationData = {
  type: typeof FOLLOWUP_NOTIFICATION_TYPE;
  followupId: string;
  route: typeof FOLLOWUP_NOTIFICATION_ROUTE;
};

export function parseFollowupNotificationData(
  value: unknown,
): FollowupNotificationData | null;
