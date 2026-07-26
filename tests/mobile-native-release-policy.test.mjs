import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const mobileRoot = new URL("../apps/mobile/", import.meta.url);
const packageJson = JSON.parse(
  await readFile(new URL("package.json", mobileRoot), "utf8"),
);
const appConfig = JSON.parse(
  await readFile(new URL("app.json", mobileRoot), "utf8"),
);
const easConfig = JSON.parse(
  await readFile(new URL("eas.json", mobileRoot), "utf8"),
);
const nativeVerifier = await readFile(
  new URL("scripts/check-native-prebuild.mjs", mobileRoot),
  "utf8",
);
const mobileCi = await readFile(
  new URL("../.github/workflows/ci-mobile.yml", import.meta.url),
  "utf8",
);
const mobileNativeCi = await readFile(
  new URL("../.github/workflows/ci-mobile-native.yml", import.meta.url),
  "utf8",
);
const gitignore = await readFile(
  new URL("../.gitignore", import.meta.url),
  "utf8",
);
const mobileReadme = await readFile(
  new URL("README.md", mobileRoot),
  "utf8",
);
const betaRelease = await readFile(
  new URL("../docs/mobile/BETA_RELEASE.md", import.meta.url),
  "utf8",
);

test("Mobile has an explicit SDK-compatible development-client workflow", () => {
  assert.equal(packageJson.dependencies["expo-dev-client"], "~57.0.9");
  assert.equal(packageJson.dependencies["expo-system-ui"], "~57.0.1");
  assert.ok(appConfig.expo.plugins.includes("expo-dev-client"));
  assert.ok(appConfig.expo.plugins.includes("expo-system-ui"));

  assert.equal(packageJson.scripts.start, "expo start --dev-client");
  assert.equal(packageJson.scripts["start:dev-client"], "expo start --dev-client");
  assert.equal(packageJson.scripts["start:go"], "expo start --go");
  assert.equal(packageJson.scripts.android, "expo run:android");
  assert.equal(packageJson.scripts.ios, "expo run:ios");
  assert.match(packageJson.scripts.check, /native:prebuild:check/u);
});

test("EAS profiles bind every release class to an explicit environment", () => {
  const { development, preview, production } = easConfig.build;

  assert.equal(development.developmentClient, true);
  assert.equal(development.distribution, "internal");
  assert.equal(development.environment, "development");
  assert.equal(development.node, "22.13.1");
  assert.equal(development.android.buildType, "apk");

  assert.equal(preview.distribution, "internal");
  assert.equal(preview.environment, "preview");
  assert.equal(preview.node, "22.13.1");
  assert.equal(preview.android.buildType, "apk");

  assert.equal(production.environment, "production");
  assert.equal(production.node, "22.13.1");
  assert.equal(production.autoIncrement, true);
});

test("credential-free validation profiles cannot be mistaken for signed betas", () => {
  assert.deepEqual(easConfig.build["native-validation"], {
    extends: "development",
    withoutCredentials: true,
    ios: {
      simulator: true,
    },
  });
  assert.equal(easConfig.build["preview-simulator"], undefined);
  assert.equal(easConfig.build.development.withoutCredentials, undefined);
  assert.equal(easConfig.build.preview.withoutCredentials, undefined);
  assert.equal(easConfig.build.production.withoutCredentials, undefined);
  for (const [name, profile] of Object.entries(easConfig.build)) {
    if (name === "native-validation") continue;
    assert.equal(profile.withoutCredentials, undefined, name);
    assert.equal(profile.android?.withoutCredentials, undefined, name);
    assert.equal(profile.ios?.withoutCredentials, undefined, name);
  }

  assert.equal(appConfig.expo.owner, undefined);
  assert.equal(appConfig.expo.extra?.eas?.projectId, undefined);
  assert.doesNotMatch(
    JSON.stringify(easConfig),
    /ascAppId|appleTeamId|credentialsSource|EXPO_PUBLIC_|projectId/u,
  );
  assert.match(betaRelease, /kein signierter Beta-Build/iu);
});

test("native configuration is regenerated in isolation and checked on both platforms", () => {
  assert.equal(packageJson.scripts["export:ios"], "expo export --platform ios --output-dir dist-ios");
  assert.equal(
    packageJson.scripts["native:prebuild:check"],
    "node scripts/check-native-prebuild.mjs",
  );
  assert.match(nativeVerifier, /mkdtemp/u);
  assert.match(nativeVerifier, /"prebuild"/u);
  assert.match(nativeVerifier, /"--platform",\s*"all"/u);
  assert.match(nativeVerifier, /__UNSAFE_EXPO_HOME_DIRECTORY/u);
  assert.match(nativeVerifier, /forbiddenNativeSecretIdentifiers/u);
  assert.match(nativeVerifier, /serverOnlyEnvironmentKeys/u);
  assert.match(nativeVerifier, /delete prebuildEnvironment\[key\]/u);
  assert.match(nativeVerifier, /await rm\(temporaryRoot/u);

  assert.match(gitignore, /\/apps\/mobile\/android\//u);
  assert.match(gitignore, /\/apps\/mobile\/ios\//u);
  assert.match(gitignore, /\/apps\/mobile\/dist-ios\//u);
});

test("Mobile CI proves Android and iOS config without claiming release-signed binaries", () => {
  assert.match(mobileCi, /npm run export:android/u);
  assert.match(mobileCi, /npm run export:ios/u);
  assert.match(mobileCi, /npm run native:prebuild:check/u);
  assert.match(mobileCi, /fanmind-mobile-native-prebuild-report/u);
  assert.match(mobileCi, /fanmind-mobile-android-javascript-export/u);
  assert.match(mobileCi, /fanmind-mobile-ios-javascript-export/u);
  assert.doesNotMatch(mobileCi, /fanmind-mobile-(?:android|ios)-bundle/u);
  assert.doesNotMatch(mobileCi, /eas (?:build|submit)|EXPO_TOKEN/u);

  assert.match(mobileNativeCi, /\.\/gradlew :app:assembleDebug/u);
  assert.match(mobileNativeCi, /xcodebuild/u);
  assert.match(mobileNativeCi, /CODE_SIGNING_ALLOWED=NO/u);
  assert.match(mobileNativeCi, /FanMind\.app/u);
  assert.match(mobileNativeCi, /not-for-release/u);
  assert.doesNotMatch(
    mobileNativeCi,
    /EXPO_TOKEN|eas (?:build|submit)|keystore|appleTeamId|ascAppId/u,
  );

  assert.match(mobileReadme, /Development-Client/u);
  assert.match(mobileReadme, /keine\s+EAS-Projekt-ID/u);
  assert.match(betaRelease, /native-validation/u);
  assert.match(betaRelease, /Expo-Konto und eine\s+echte EAS-Projekt-ID/u);
});
