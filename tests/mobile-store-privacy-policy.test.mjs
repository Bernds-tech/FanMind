import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("iOS privacy manifest config matches the installed native SDK reasons", async () => {
  const appConfig = JSON.parse(await read("apps/mobile/app.json"));
  const manifest = appConfig.expo.ios?.privacyManifests;

  assert.ok(manifest);
  assert.equal(manifest.NSPrivacyTracking, false);
  assert.deepEqual(manifest.NSPrivacyTrackingDomains, []);
  assert.equal(manifest.NSPrivacyCollectedDataTypes, undefined);

  const accessedApiTypes = Object.fromEntries(
    manifest.NSPrivacyAccessedAPITypes.map((entry) => [
      entry.NSPrivacyAccessedAPIType,
      [...entry.NSPrivacyAccessedAPITypeReasons].sort(),
    ]),
  );

  assert.deepEqual(accessedApiTypes, {
    NSPrivacyAccessedAPICategoryDiskSpace: ["85F4.1", "E174.1"],
    NSPrivacyAccessedAPICategoryFileTimestamp: [
      "0A2A.1",
      "3B52.1",
      "C617.1",
    ],
    NSPrivacyAccessedAPICategorySystemBootTime: ["35F9.1"],
    NSPrivacyAccessedAPICategoryUserDefaults: ["CA92.1"],
  });
});
test("native prebuild enforces store API, privacy and least-permission boundaries", async () => {
  const [source, appConfigSource] = await Promise.all([
    read("apps/mobile/scripts/check-native-prebuild.mjs"),
    read("apps/mobile/app.json"),
  ]);
  const appConfig = JSON.parse(appConfigSource);

  assert.match(source, /PrivacyInfo\.xcprivacy/u);
  assert.match(source, /\^compileSdk = "36"\$/u);
  assert.match(source, /\^targetSdk = "36"\$/u);
  assert.match(source, /NSPrivacyAccessedAPICategoryUserDefaults/u);
  assert.match(source, /NSPrivacyAccessedAPICategoryFileTimestamp/u);
  assert.match(source, /NSPrivacyAccessedAPICategorySystemBootTime/u);
  assert.match(source, /NSPrivacyAccessedAPICategoryDiskSpace/u);
  assert.match(source, /READ_CONTACTS\|WRITE_CONTACTS/u);
  assert.match(source, /ACCESS_FINE_LOCATION\|ACCESS_COARSE_LOCATION/u);
  assert.match(source, /CAMERA\|RECORD_AUDIO/u);
  assert.match(source, /READ_EXTERNAL_STORAGE/u);
  assert.match(source, /WRITE_EXTERNAL_STORAGE/u);
  assert.match(source, /tools:node="remove"/u);
  assert.match(source, /READ_MEDIA_IMAGES\|READ_MEDIA_VIDEO/u);
  assert.deepEqual(appConfig.expo.android?.blockedPermissions, [
    "android.permission.READ_EXTERNAL_STORAGE",
    "android.permission.WRITE_EXTERNAL_STORAGE",
  ]);
  assert.match(
    source,
    /NS\(\?:Camera\|Contacts\|Location\|Microphone\|PhotoLibrary\)UsageDescription/u,
  );
});

test("store privacy draft stays synchronized with the current mobile boundary", async () => {
  const [privacyDraft, storeListing, pushSource, registrationSource, aiRoute] =
    await Promise.all([
    read("docs/mobile/STORE_PRIVACY_DECLARATIONS.md"),
    read("docs/mobile/STORE_LISTING.md"),
    read("apps/mobile/src/lib/pushNotifications.ts"),
    read("apps/mobile/src/lib/mobilePushRegistration.ts"),
    read("src/app/api/ai/reply-suggestions/route.ts"),
  ]);

  assert.match(
    privacyDraft,
    /technische, repository-gebundene Arbeitsvorlage/u,
  );
  assert.match(privacyDraft, /keine rechtliche\s+Freigabe/u);
  assert.match(privacyDraft, /https:\/\/fanmind\.ch\/datenschutz/u);
  assert.match(privacyDraft, /https:\/\/fanmind\.ch\/account-deletion/u);
  assert.match(privacyDraft, /kein Mobile-Werbe-SDK/u);
  assert.match(privacyDraft, /greift nicht auf das Geräteadressbuch/u);
  assert.match(
    privacyDraft,
    /fordert eine Push-Berechtigung ausschließlich nach ausdrücklichem Opt-in/u,
  );
  assert.match(privacyDraft, /Identifiers – Device ID \| Ja \| Ja \| Nein/u);
  assert.match(privacyDraft, /Device or other IDs \| Ja \| Vorläufig Nein/u);
  assert.match(privacyDraft, /Zustellung noch deaktiviert/u);
  assert.match(privacyDraft, /Apple App Privacy/u);
  assert.match(privacyDraft, /Google Play Data Safety/u);
  assert.match(privacyDraft, /Contact Info – Name \| Ja/u);
  assert.match(privacyDraft, /Personal info – Name \| Ja/u);
  assert.match(privacyDraft, /In-app search history \| Ja/u);
  assert.match(privacyDraft, /Push-Aktivierungsgrenze/u);
  assert.match(storeListing, /STORE_PRIVACY_DECLARATIONS\.md/u);

  assert.doesNotMatch(pushSource, /requestPermissionsAsync/u);
  assert.doesNotMatch(pushSource, /getExpoPushTokenAsync/u);
  assert.match(registrationSource, /requestPermissionsAsync/u);
  assert.match(registrationSource, /getExpoPushTokenAsync/u);
  assert.doesNotMatch(registrationSource, /scheduleNotificationAsync/u);
  assert.match(aiRoute, /store:\s*false/u);

  await Promise.all([
    access(new URL("../src/app/datenschutz/page.tsx", import.meta.url)),
    access(new URL("../src/app/account-deletion/page.tsx", import.meta.url)),
  ]);
});
