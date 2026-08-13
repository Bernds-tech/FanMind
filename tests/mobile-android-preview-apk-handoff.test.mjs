import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  chmod,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import test from "node:test";

import {
  downloadMobileAndroidPreviewApk,
  MIN_ANDROID_PREVIEW_APK_BYTES,
  validateExpoAndroidPreviewArtifactUrl,
} from "../scripts/operations/download-mobile-android-preview-apk.mjs";

const releaseCommit = "a".repeat(40);
const artifactUrl =
  "https://expo.dev/artifacts/eas/synthetic-internal-build.apk";

function environment(overrides = {}) {
  return {
    GITHUB_REF: "refs/heads/main",
    GITHUB_SHA: releaseCommit,
    FANMIND_MOBILE_EXPECTED_RELEASE_COMMIT: releaseCommit,
    FANMIND_MOBILE_RELEASE_ENVIRONMENT: "preview",
    FANMIND_MOBILE_BUILD_PROFILE: "preview",
    FANMIND_MOBILE_BUILD_PLATFORM: "android",
    FANMIND_MOBILE_SIGNED_BUILD_CONFIRM: "queue-one-signed-mobile-build",
    FANMIND_ENABLE_MOBILE_EAS_BUILD: "true",
    FANMIND_ENABLE_MOBILE_EAS_SUBMIT: "false",
    FANMIND_ENABLE_MOBILE_EAS_UPDATE: "false",
    ...overrides,
  };
}

function queuedBuild() {
  return {
    id: "123e4567-e89b-42d3-a456-426614174000",
    platform: "ANDROID",
    buildProfile: "preview",
    gitCommitHash: releaseCommit,
  };
}

function completedBuild(overrides = {}) {
  return {
    ...queuedBuild(),
    status: "FINISHED",
    distribution: "INTERNAL",
    completedAt: "2026-08-13T09:00:00.000Z",
    artifacts: { applicationArchiveUrl: artifactUrl },
    ...overrides,
  };
}

async function privateFixture(completion = completedBuild()) {
  const directory = await mkdtemp(join(tmpdir(), "fanmind-android-apk-"));
  await chmod(directory, 0o700);
  const queuePath = join(directory, "queue.json");
  const completionPath = join(directory, "completion.json");
  const outputPath = join(directory, "fanmind-preview.apk");
  await writeFile(queuePath, JSON.stringify([queuedBuild()]), { mode: 0o600 });
  await writeFile(completionPath, JSON.stringify(completion), { mode: 0o600 });
  await Promise.all([chmod(queuePath, 0o600), chmod(completionPath, 0o600)]);
  return { directory, queuePath, completionPath, outputPath };
}

function apkBytes({ validMagic = true, bytes = MIN_ANDROID_PREVIEW_APK_BYTES } = {}) {
  const value = Buffer.alloc(bytes, 0x41);
  if (validMagic) value.set([0x50, 0x4b, 0x03, 0x04]);
  return value;
}

function response(status, headers = {}, body = null) {
  const normalized = new Map(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
  );
  return {
    status,
    headers: { get: (key) => normalized.get(key.toLowerCase()) ?? null },
    body,
  };
}

test("Android preview handoff downloads the exact verified APK through an allowlisted redirect", async () => {
  const fixture = await privateFixture();
  const bytes = apkBytes();
  const calls = [];
  try {
    const result = await downloadMobileAndroidPreviewApk({
      ...fixture,
      environment: environment(),
      fetchImplementation: async (url, options) => {
        calls.push({ url, options });
        if (calls.length === 1) {
          return response(302, {
            location:
              "https://storage.googleapis.com/expo-preview/fanmind.apk?signature=synthetic",
          });
        }
        return response(
          200,
          { "content-length": String(bytes.length) },
          Readable.from([bytes]),
        );
      },
    });

    assert.equal(result.bytes, bytes.length);
    assert.equal(
      result.sha256,
      createHash("sha256").update(bytes).digest("hex"),
    );
    assert.deepEqual(await readFile(fixture.outputPath), bytes);
    assert.equal((await stat(fixture.outputPath)).mode & 0o777, 0o600);
    assert.equal(calls.length, 2);
    assert.equal(calls[0].url, artifactUrl);
    assert.equal(calls[0].options.method, "GET");
    assert.equal(calls[0].options.redirect, "manual");
    assert.match(calls[1].url, /^https:\/\/storage\.googleapis\.com\//u);
    assert.deepEqual((await readdir(fixture.directory)).sort(), [
      "completion.json",
      "fanmind-preview.apk",
      "queue.json",
    ]);
  } finally {
    await rm(fixture.directory, { recursive: true, force: true });
  }
});

test("Android preview handoff rejects unverified environments and non-Expo artifact URLs", async () => {
  assert.equal(validateExpoAndroidPreviewArtifactUrl(artifactUrl), true);
  for (const invalid of [
    "http://expo.dev/artifacts/eas/build.apk",
    "https://expo.dev/artifacts/eas/build.aab",
    "https://expo.dev/artifacts/eas/build.apk?token=value",
    "https://example.test/artifacts/eas/build.apk",
  ]) {
    assert.equal(validateExpoAndroidPreviewArtifactUrl(invalid), false);
  }

  const fixture = await privateFixture(
    completedBuild({
      artifacts: { applicationArchiveUrl: "https://example.test/build.apk" },
    }),
  );
  try {
    await assert.rejects(
      downloadMobileAndroidPreviewApk({
        ...fixture,
        environment: environment(),
        fetchImplementation: async () => assert.fail("must not fetch"),
      }),
      { code: "android_preview_artifact_url_invalid" },
    );
    await assert.rejects(
      downloadMobileAndroidPreviewApk({
        ...fixture,
        environment: environment({ GITHUB_REF: "refs/heads/feature" }),
        fetchImplementation: async () => assert.fail("must not fetch"),
      }),
      { code: "android_preview_download_environment_invalid" },
    );
  } finally {
    await rm(fixture.directory, { recursive: true, force: true });
  }
});

test("Android preview handoff rejects unsafe redirects, truncated bodies and non-APK payloads", async () => {
  const cases = [
    {
      expected: "android_preview_redirect_invalid",
      fetchImplementation: async () =>
        response(302, { location: "https://example.test/fanmind.apk" }),
    },
    {
      expected: "android_preview_size_invalid",
      fetchImplementation: async () => {
        const bytes = apkBytes({ bytes: 1024 });
        return response(
          200,
          { "content-length": String(bytes.length) },
          Readable.from([bytes]),
        );
      },
    },
    {
      expected: "android_preview_apk_invalid",
      fetchImplementation: async () => {
        const bytes = apkBytes({ validMagic: false });
        return response(
          200,
          { "content-length": String(bytes.length) },
          Readable.from([bytes]),
        );
      },
    },
  ];

  for (const entry of cases) {
    const fixture = await privateFixture();
    try {
      await assert.rejects(
        downloadMobileAndroidPreviewApk({
          ...fixture,
          environment: environment(),
          fetchImplementation: entry.fetchImplementation,
        }),
        { code: entry.expected },
      );
      await assert.rejects(stat(fixture.outputPath), { code: "ENOENT" });
    } finally {
      await rm(fixture.directory, { recursive: true, force: true });
    }
  }
});
