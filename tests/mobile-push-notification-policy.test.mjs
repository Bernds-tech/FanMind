import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  createFollowupNotificationIntent,
  decideFollowupNotificationIntent,
  FOLLOWUP_NOTIFICATION_ROUTE,
  FOLLOWUP_NOTIFICATION_TYPE,
  MAX_NOTIFICATION_RESPONSE_IDENTIFIER_LENGTH,
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

test("accepts only a bounded default notification response", () => {
  const followupId = "5ab7de62-296e-4e79-9812-3455169e53e5";
  const defaultActionIdentifier = "default";
  const response = {
    actionIdentifier: defaultActionIdentifier,
    requestIdentifier: "notification-123",
    data: {
      type: FOLLOWUP_NOTIFICATION_TYPE,
      followupId,
    },
  };

  assert.deepEqual(
    createFollowupNotificationIntent(response, defaultActionIdentifier),
    {
      type: FOLLOWUP_NOTIFICATION_TYPE,
      followupId,
      route: FOLLOWUP_NOTIFICATION_ROUTE,
      responseIdentifier: "notification-123",
    },
  );

  assert.equal(
    createFollowupNotificationIntent(
      { ...response, actionIdentifier: "custom" },
      defaultActionIdentifier,
    ),
    null,
  );
  assert.equal(
    createFollowupNotificationIntent(
      { ...response, requestIdentifier: "" },
      defaultActionIdentifier,
    ),
    null,
  );
  assert.equal(
    createFollowupNotificationIntent(
      {
        ...response,
        requestIdentifier: "x".repeat(
          MAX_NOTIFICATION_RESPONSE_IDENTIFIER_LENGTH + 1,
        ),
      },
      defaultActionIdentifier,
    ),
    null,
  );
  assert.equal(
    createFollowupNotificationIntent(
      {
        ...response,
        data: { ...response.data, contactName: "Must stay out" },
      },
      defaultActionIdentifier,
    ),
    null,
  );
});

test("notification intent waits for auth and is consumed only at follow-ups", () => {
  const pendingIntent = {
    type: FOLLOWUP_NOTIFICATION_TYPE,
    followupId: "5ab7de62-296e-4e79-9812-3455169e53e5",
    route: FOLLOWUP_NOTIFICATION_ROUTE,
    responseIdentifier: "notification-123",
  };
  const decide = (overrides = {}) =>
    decideFollowupNotificationIntent({
      authLoading: false,
      hasSession: true,
      segments: ["(app)", "contacts"],
      pendingIntent,
      ...overrides,
    });

  assert.equal(decide({ authLoading: true }), "wait");
  assert.equal(decide({ hasSession: false }), "wait");
  assert.equal(decide({ segments: ["(auth)", "login"] }), "wait");
  assert.equal(decide({ segments: ["(auth)", "reset-password"] }), "wait");
  assert.equal(decide(), "navigate");
  assert.equal(decide({ segments: ["(app)", "followups"] }), "consume");
  assert.equal(decide({ pendingIntent: null }), "wait");
});

test("mobile push foundation remains permissionless and delivery-free", async () => {
  const [appConfig, source, provider, authLayout, indexRoute] =
    await Promise.all([
    readFile(new URL("../apps/mobile/app.json", import.meta.url), "utf8"),
    readFile(
      new URL("../apps/mobile/src/lib/pushNotifications.ts", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL(
        "../apps/mobile/src/providers/NotificationIntentProvider.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL("../apps/mobile/app/(auth)/_layout.tsx", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../apps/mobile/app/index.tsx", import.meta.url),
      "utf8",
    ),
  ]);

  assert.match(appConfig, /"expo-notifications"/);
  assert.match(source, /addNotificationResponseReceivedListener/);
  assert.match(source, /setNotificationChannelAsync/);
  assert.match(source, /getLastNotificationResponse\(\)/);
  assert.match(source, /clearLastNotificationResponse\(\)/);
  assert.doesNotMatch(source, /router\.(?:push|replace)/);
  assert.doesNotMatch(source, /requestPermissionsAsync/);
  assert.doesNotMatch(source, /getExpoPushTokenAsync/);
  assert.doesNotMatch(source, /scheduleNotificationAsync/);
  assert.ok(
    provider.indexOf(
      "const subscription = registerNotificationResponseListener",
    ) <
      provider.indexOf("const initialIntent = getLastNotificationIntent"),
  );
  assert.match(provider, /MAX_CONSUMED_RESPONSE_IDENTIFIERS = 32/);
  assert.match(authLayout, /pendingIntent\?\.route \?\? "\/\(app\)"/);
  assert.match(indexRoute, /pendingIntent\?\.route \?\? "\/\(app\)"/);

  const consumeIdentifier = provider.indexOf(
    "const responseIdentifier = pendingIntent.responseIdentifier",
  );
  const clearNativeResponse = provider.indexOf(
    "clearLastNotificationIntent()",
    consumeIdentifier,
  );
  const consumeEffectEnd = provider.indexOf(
    "}, [loading, pendingIntent, router, segments, session])",
    clearNativeResponse,
  );
  assert.ok(consumeIdentifier >= 0);
  assert.ok(clearNativeResponse > consumeIdentifier);
  assert.ok(consumeEffectEnd > clearNativeResponse);
  assert.doesNotMatch(
    provider.slice(consumeIdentifier, consumeEffectEnd),
    /catch\s*\{\s*return;/u,
  );
});
