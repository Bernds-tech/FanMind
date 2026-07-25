import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  FOLLOWUP_NOTIFICATION_ROUTE,
  FOLLOWUP_NOTIFICATION_TYPE,
  parseFollowupNotificationData,
} from "../apps/mobile/src/lib/pushNotificationPolicy.mjs";

test("accepts only the minimal follow-up reminder payload", () => {
  const followupId = "5ab7de62-296e-4e79-9812-3455169e53e5";

  assert.deepEqual(
    parseFollowupNotificationData({
      type: FOLLOWUP_NOTIFICATION_TYPE,
      followupId,
    }),
    {
      type: FOLLOWUP_NOTIFICATION_TYPE,
      followupId,
      route: FOLLOWUP_NOTIFICATION_ROUTE,
    },
  );
});

test("rejects malformed, ambiguous and data-rich notification payloads", () => {
  const followupId = "5ab7de62-296e-4e79-9812-3455169e53e5";
  const rejected = [
    null,
    [],
    {},
    { type: FOLLOWUP_NOTIFICATION_TYPE },
    { type: "contact_message", followupId },
    { type: FOLLOWUP_NOTIFICATION_TYPE, followupId: "not-a-uuid" },
    {
      type: FOLLOWUP_NOTIFICATION_TYPE,
      followupId,
      contactName: "Must not enter push data",
    },
    {
      type: FOLLOWUP_NOTIFICATION_TYPE,
      followupId,
      route: "/(app)/contacts",
    },
  ];

  for (const payload of rejected) {
    assert.equal(parseFollowupNotificationData(payload), null);
  }
});

test("mobile push foundation remains permissionless and delivery-free", async () => {
  const [appConfig, source] = await Promise.all([
    readFile(new URL("../apps/mobile/app.json", import.meta.url), "utf8"),
    readFile(
      new URL("../apps/mobile/src/lib/pushNotifications.ts", import.meta.url),
      "utf8",
    ),
  ]);

  assert.match(appConfig, /"expo-notifications"/);
  assert.match(source, /addNotificationResponseReceivedListener/);
  assert.match(source, /setNotificationChannelAsync/);
  assert.doesNotMatch(source, /requestPermissionsAsync/);
  assert.doesNotMatch(source, /getExpoPushTokenAsync/);
  assert.doesNotMatch(source, /scheduleNotificationAsync/);
});
