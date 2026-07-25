export const FOLLOWUP_NOTIFICATION_TYPE: "followup_reminder";
export const FOLLOWUP_NOTIFICATION_ROUTE: "/(app)/followups";
export const MAX_NOTIFICATION_RESPONSE_IDENTIFIER_LENGTH: number;

export type FollowupNotificationData = {
  type: typeof FOLLOWUP_NOTIFICATION_TYPE;
  followupId: string;
  route: typeof FOLLOWUP_NOTIFICATION_ROUTE;
};

export type FollowupNotificationIntent = FollowupNotificationData & {
  responseIdentifier: string;
};

export function parseFollowupNotificationData(
  value: unknown,
): FollowupNotificationData | null;
export function createFollowupNotificationIntent(
  value: unknown,
  defaultActionIdentifier: string,
): FollowupNotificationIntent | null;
export function decideFollowupNotificationIntent(input: {
  authLoading: boolean;
  hasSession: boolean;
  segments: readonly string[];
  pendingIntent: FollowupNotificationIntent | null;
}): "wait" | "navigate" | "consume";
