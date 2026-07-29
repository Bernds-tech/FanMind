import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  MOBILE_PUSH_ACTIONS,
  MOBILE_PUSH_MAX_REQUEST_BYTES,
  MOBILE_PUSH_REGISTRATION_DAYS,
  MobilePushRegistrationPolicyError,
  publicMobilePushStatus,
  validateMobilePushAction,
} from "../src/lib/mobilePushRegistrationPolicy.mjs";
import {
  encryptMobilePushToken,
  hashMobilePushToken,
  MobilePushTokenCryptoError,
} from "../src/lib/mobilePushTokenCrypto.mjs";

const TOKEN = "ExponentPushToken[abcdefghijklmnop1234567890_-]";
const PROJECT_ID = "5ab7de62-296e-4e79-9812-3455169e53e5";

test("mobile push registration accepts only bounded exact actions", () => {
  assert.deepEqual(validateMobilePushAction({ action: "status" }), {
    action: MOBILE_PUSH_ACTIONS.status,
  });
  assert.deepEqual(validateMobilePushAction({ action: "unregister" }), {
    action: MOBILE_PUSH_ACTIONS.unregister,
  });
  assert.deepEqual(
    validateMobilePushAction({
      action: "register",
      token: TOKEN,
      projectId: PROJECT_ID.toUpperCase(),
      platform: "android",
    }),
    {
      action: MOBILE_PUSH_ACTIONS.register,
      token: TOKEN,
      projectId: PROJECT_ID,
      platform: "android",
    },
  );
  assert.equal(MOBILE_PUSH_REGISTRATION_DAYS, 30);
  assert.equal(MOBILE_PUSH_MAX_REQUEST_BYTES, 4096);
});

test("mobile push registration rejects extra, malformed and data-rich input", () => {
  const rejected = [
    null,
    [],
    {},
    { action: "unknown" },
    { action: "status", token: TOKEN },
    { action: "unregister", userId: PROJECT_ID },
    {
      action: "register",
      token: "not-a-push-token",
      projectId: PROJECT_ID,
      platform: "android",
    },
    {
      action: "register",
      token: TOKEN,
      projectId: "not-a-project",
      platform: "android",
    },
    {
      action: "register",
      token: TOKEN,
      projectId: PROJECT_ID,
      platform: "web",
    },
    {
      action: "register",
      token: TOKEN,
      projectId: PROJECT_ID,
      platform: "ios",
      contactName: "must not enter registration",
    },
  ];

  for (const value of rejected) {
    assert.throws(
      () => validateMobilePushAction(value),
      (error) => error instanceof MobilePushRegistrationPolicyError,
    );
  }
});

test("public status is redacted, expiry-aware and delivery-disabled", () => {
  const now = new Date("2026-07-29T12:00:00.000Z");
  const active = publicMobilePushStatus(
    {
      status: "active",
      platform: "ios",
      expires_at: "2026-08-28T12:00:00.000Z",
      expo_token_ciphertext: `v1:${TOKEN}`,
      expo_token_hash: "a".repeat(64),
      user_id: PROJECT_ID,
      workspace_id: PROJECT_ID,
    },
    now,
  );
  assert.deepEqual(active, {
    enabled: true,
    platform: "ios",
    expiresAt: "2026-08-28T12:00:00.000Z",
    deliveryEnabled: false,
  });
  assert.deepEqual(
    publicMobilePushStatus(
      {
        status: "active",
        platform: "android",
        expires_at: now.toISOString(),
      },
      now,
    ),
    {
      enabled: false,
      platform: null,
      expiresAt: null,
      deliveryEnabled: false,
    },
  );
  assert.deepEqual(
    publicMobilePushStatus(
      {
        status: "active",
        platform: "unknown",
        expires_at: "2026-08-28T12:00:00.000Z",
      },
      now,
    ),
    {
      enabled: false,
      platform: null,
      expiresAt: null,
      deliveryEnabled: false,
    },
  );
  assert.doesNotMatch(JSON.stringify(active), /ExponentPushToken|user_id|workspace_id/u);
});

test("push tokens use dedicated keyed hashing and authenticated encryption", () => {
  const previous = process.env.FANMIND_PUSH_TOKEN_ENCRYPTION_KEY;
  process.env.FANMIND_PUSH_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString(
    "base64",
  );
  try {
    const firstHash = hashMobilePushToken(TOKEN);
    const secondHash = hashMobilePushToken(TOKEN);
    const encrypted = encryptMobilePushToken(TOKEN);
    assert.equal(firstHash, secondHash);
    assert.match(firstHash, /^[0-9a-f]{64}$/u);
    assert.match(
      encrypted,
      /^v1:[A-Za-z0-9_-]+:[A-Za-z0-9_-]+:[A-Za-z0-9_-]+$/u,
    );
    assert.doesNotMatch(encrypted, /ExponentPushToken/u);
    assert.notEqual(encryptMobilePushToken(TOKEN), encrypted);
  } finally {
    if (previous === undefined) {
      delete process.env.FANMIND_PUSH_TOKEN_ENCRYPTION_KEY;
    } else {
      process.env.FANMIND_PUSH_TOKEN_ENCRYPTION_KEY = previous;
    }
  }
});

test("invalid or missing push encryption configuration fails closed", () => {
  const previous = process.env.FANMIND_PUSH_TOKEN_ENCRYPTION_KEY;
  try {
    delete process.env.FANMIND_PUSH_TOKEN_ENCRYPTION_KEY;
    assert.throws(
      () => hashMobilePushToken(TOKEN),
      (error) =>
        error instanceof MobilePushTokenCryptoError &&
        error.code === "push_encryption_not_configured",
    );
    process.env.FANMIND_PUSH_TOKEN_ENCRYPTION_KEY = "too-short";
    assert.throws(
      () => encryptMobilePushToken(TOKEN),
      (error) =>
        error instanceof MobilePushTokenCryptoError &&
        error.code === "push_encryption_not_configured",
    );
  } finally {
    if (previous === undefined) {
      delete process.env.FANMIND_PUSH_TOKEN_ENCRYPTION_KEY;
    } else {
      process.env.FANMIND_PUSH_TOKEN_ENCRYPTION_KEY = previous;
    }
  }
});

test("server registration is service-role-only, one-device and delivery-free", async () => {
  const [migration, route, service, mobile, settings, auth, envExample] =
    await Promise.all([
      readFile(
        new URL(
          "../supabase/migrations/20260729120000_mobile_push_registrations.sql",
          import.meta.url,
        ),
        "utf8",
      ),
      readFile(
        new URL(
          "../src/app/api/mobile/push-registration/route.ts",
          import.meta.url,
        ),
        "utf8",
      ),
      readFile(
        new URL("../src/lib/mobilePushRegistrations.ts", import.meta.url),
        "utf8",
      ),
      readFile(
        new URL(
          "../apps/mobile/src/lib/mobilePushRegistration.ts",
          import.meta.url,
        ),
        "utf8",
      ),
      readFile(
        new URL("../apps/mobile/app/(app)/settings.tsx", import.meta.url),
        "utf8",
      ),
      readFile(
        new URL(
          "../apps/mobile/src/providers/AuthProvider.tsx",
          import.meta.url,
        ),
        "utf8",
      ),
      readFile(new URL("../.env.example", import.meta.url), "utf8"),
    ]);

  assert.match(migration, /references auth\.users\(id\) on delete cascade/u);
  assert.match(migration, /references public\.workspaces\(id\) on delete cascade/u);
  assert.match(migration, /unique \(user_id\)/u);
  assert.match(migration, /enable row level security/u);
  assert.match(
    migration,
    /revoke all on table public\.mobile_push_registrations[\s\S]*from public, anon, authenticated/u,
  );
  assert.match(
    migration,
    /grant select, insert, update, delete[\s\S]*to service_role/u,
  );
  assert.doesNotMatch(migration, /grant\s+\w+[\s\S]{0,80}to authenticated/u);
  assert.match(migration, /no delivery job is enabled/u);

  assert.match(route, /getOptionalBearerAccessToken/u);
  assert.match(route, /x-fanmind-client/u);
  assert.match(route, /MOBILE_PUSH_MAX_REQUEST_BYTES/u);
  assert.match(route, /isTemporaryDemoUser/u);
  assert.match(route, /Cache-Control": "private, no-store"/u);
  assert.doesNotMatch(route, /console\.(?:log|error|warn)/u);

  assert.match(service, /FANMIND_PUSH_TOKEN_ENCRYPTION_KEY|encryptMobilePushToken/u);
  assert.match(service, /on_conflict=user_id/u);
  assert.match(service, /resolution=merge-duplicates,return=representation/u);
  assert.match(service, /expires_at=lte/u);
  assert.match(service, /removeExpiredUserRegistration/u);
  assert.doesNotMatch(service, /console\.(?:log|error|warn)/u);

  assert.match(mobile, /requestPermissionsAsync/u);
  assert.match(mobile, /getExpoPushTokenAsync\(\{\s*projectId/u);
  assert.match(mobile, /AbortController/u);
  assert.match(mobile, /1_500/u);
  assert.match(mobile, /X-FanMind-Client": "mobile"/u);
  assert.match(settings, /Push auf diesem Gerät vorbereiten/u);
  assert.match(settings, /serverseitige Zustellung ist noch deaktiviert/u);
  assert.match(auth, /bestEffortDisableMobilePushRegistration/u);
  assert.match(envExample, /FANMIND_PUSH_TOKEN_ENCRYPTION_KEY=/u);

  for (const source of [route, service, mobile, settings, auth]) {
    assert.doesNotMatch(source, /scheduleNotificationAsync/u);
    assert.doesNotMatch(source, /sendPushNotificationsAsync/u);
  }
});
