import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { Platform } from "react-native";

import {
  FOLLOWUP_NOTIFICATION_ROUTE,
  parseFollowupNotificationData,
} from "@/lib/pushNotificationPolicy.mjs";

export const FOLLOWUP_NOTIFICATION_CHANNEL_ID = "followup-reminders";

export async function configureNotificationChannel() {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(
    FOLLOWUP_NOTIFICATION_CHANNEL_ID,
    {
      name: "Follow-up-Erinnerungen",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#149EF2",
    },
  );
}

export function handleNotificationResponse(
  response: Notifications.NotificationResponse,
) {
  const data = parseFollowupNotificationData(
    response.notification.request.content.data,
  );
  if (!data) return false;

  router.push(FOLLOWUP_NOTIFICATION_ROUTE);
  return true;
}

export function registerNotificationResponseListener() {
  return Notifications.addNotificationResponseReceivedListener(
    handleNotificationResponse,
  );
}
