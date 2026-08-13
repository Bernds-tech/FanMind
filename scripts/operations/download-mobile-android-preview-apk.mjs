#!/usr/bin/env node

import { createHash, randomUUID } from "node:crypto";
import { constants } from "node:fs";
import {
  chmod,
  link,
  lstat,
  open,
  realpath,
  unlink,
} from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { evaluateMobileSignedBuildCompletion } from "./mobile-signed-build-completion.mjs";
import { readStablePrivateFile } from "./verify-full-backup-restore-receipt.mjs";

const MAX_BUILD_REPORT_BYTES = 256 * 1024;
export const MIN_ANDROID_PREVIEW_APK_BYTES = 1 * 1024 * 1024;
export const MAX_ANDROID_PREVIEW_APK_BYTES = 250 * 1024 * 1024;

const EXPO_ARTIFACT_PATH = /^\/artifacts\/eas\/[A-Za-z0-9_-]+\.apk$/u;
const COMMIT_PATTERN = /^[0-9a-f]{40}$/u;

function fail(code) {
  const error = new Error(code);
  error.code = code;
  throw error;
}

function parseJson(bytes, code) {
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    fail(code);
  }
}

function singleRecord(value, code) {
  if (Array.isArray(value)) {
    if (value.length !== 1) fail(code);
    return value[0];
  }
  if (!value || typeof value !== "object") fail(code);
  return value;
}

function validateDownloadEnvironment(environment) {
  if (
    environment.GITHUB_REF !== "refs/heads/main" ||
    !COMMIT_PATTERN.test(String(environment.GITHUB_SHA ?? "")) ||
    environment.FANMIND_MOBILE_RELEASE_ENVIRONMENT !== "preview" ||
    environment.FANMIND_MOBILE_BUILD_PROFILE !== "preview" ||
    environment.FANMIND_MOBILE_BUILD_PLATFORM !== "android" ||
    environment.FANMIND_ENABLE_MOBILE_EAS_BUILD !== "true" ||
    environment.FANMIND_ENABLE_MOBILE_EAS_SUBMIT !== "false" ||
    environment.FANMIND_ENABLE_MOBILE_EAS_UPDATE !== "false"
  ) {
    fail("android_preview_download_environment_invalid");
  }
}

export function validateExpoAndroidPreviewArtifactUrl(value) {
  if (typeof value !== "string" || value.length > 4096) return false;
  let url;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return Boolean(
    url.protocol === "https:" &&
      url.hostname === "expo.dev" &&
      !url.port &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      EXPO_ARTIFACT_PATH.test(url.pathname),
  );
}

function validateFinalDownloadUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  const hostname = url.hostname.toLowerCase();
  return Boolean(
    url.protocol === "https:" &&
      !url.port &&
      !url.username &&
      !url.password &&
      !url.hash &&
      (hostname === "expo.dev" ||
        hostname.endsWith(".expo.dev") ||
        hostname === "storage.googleapis.com" ||
        hostname.endsWith(".googleusercontent.com") ||
        hostname.endsWith(".amazonaws.com")),
  );
}

async function fetchArtifact(artifactUrl, fetchImplementation) {
  let currentUrl = artifactUrl;
  for (let redirectCount = 0; redirectCount <= 5; redirectCount += 1) {
    let response;
    try {
      response = await fetchImplementation(currentUrl, {
        method: "GET",
        redirect: "manual",
        headers: {
          Accept:
            "application/vnd.android.package-archive,application/octet-stream",
          "User-Agent": "FanMind-Mobile-Android-Preview-Handoff/1.0",
        },
        signal: AbortSignal.timeout(120_000),
      });
    } catch {
      fail("android_preview_download_unavailable");
    }

    if ([301, 302, 303, 307, 308].includes(response?.status)) {
      const location = response.headers?.get?.("location");
      if (redirectCount === 5 || typeof location !== "string") {
        fail("android_preview_redirect_invalid");
      }
      let nextUrl;
      try {
        nextUrl = new URL(location, currentUrl).href;
      } catch {
        fail("android_preview_redirect_invalid");
      }
      if (!validateFinalDownloadUrl(nextUrl)) {
        fail("android_preview_redirect_invalid");
      }
      currentUrl = nextUrl;
      continue;
    }

    if (
      response?.status !== 200 ||
      !response.body ||
      !validateFinalDownloadUrl(currentUrl)
    ) {
      fail("android_preview_download_rejected");
    }
    return response;
  }
  fail("android_preview_redirect_invalid");
}

async function assertPrivateOutput(outputPath) {
  if (outputPath !== resolve(outputPath) || !outputPath.endsWith(".apk")) {
    fail("android_preview_output_path_invalid");
  }
  const parent = dirname(outputPath);
  const [metadata, canonical] = await Promise.all([
    lstat(parent).catch(() => fail("android_preview_output_unavailable")),
    realpath(parent).catch(() => fail("android_preview_output_unavailable")),
  ]);
  if (
    !metadata.isDirectory() ||
    canonical !== parent ||
    metadata.uid !== process.getuid() ||
    (metadata.mode & 0o077) !== 0
  ) {
    fail("android_preview_output_unsafe");
  }
  try {
    await lstat(outputPath);
    fail("android_preview_output_exists");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  return parent;
}

function contentLength(response) {
  const value = response.headers?.get?.("content-length");
  if (value == null || value === "") return null;
  if (!/^[0-9]+$/u.test(value)) fail("android_preview_content_length_invalid");
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    fail("android_preview_content_length_invalid");
  }
  if (
    parsed < MIN_ANDROID_PREVIEW_APK_BYTES ||
    parsed > MAX_ANDROID_PREVIEW_APK_BYTES
  ) {
    fail("android_preview_size_invalid");
  }
  return parsed;
}

async function downloadAndroidApk({
  artifactUrl,
  outputPath,
  fetchImplementation,
}) {
  const parent = await assertPrivateOutput(outputPath);
  const response = await fetchArtifact(artifactUrl, fetchImplementation);
  const declaredLength = contentLength(response);

  const temporaryPath = join(
    parent,
    `.${basename(outputPath)}.${randomUUID()}.tmp`,
  );
  const digest = createHash("sha256");
  let handle;
  let bytes = 0;
  let prefix = Buffer.alloc(0);
  try {
    handle = await open(
      temporaryPath,
      constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL,
      0o600,
    );
    for await (const chunk of response.body) {
      const buffer = Buffer.from(chunk);
      bytes += buffer.length;
      if (bytes > MAX_ANDROID_PREVIEW_APK_BYTES) {
        fail("android_preview_size_invalid");
      }
      if (prefix.length < 4) {
        prefix = Buffer.concat([prefix, buffer.subarray(0, 4 - prefix.length)]);
      }
      digest.update(buffer);
      await handle.write(buffer);
    }
    if (
      bytes < MIN_ANDROID_PREVIEW_APK_BYTES ||
      (declaredLength !== null && declaredLength !== bytes) ||
      prefix.length !== 4 ||
      !prefix.equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))
    ) {
      fail("android_preview_apk_invalid");
    }
    await handle.sync();
    await handle.close();
    handle = undefined;
    await chmod(temporaryPath, 0o600);
    await link(temporaryPath, outputPath);
  } finally {
    await handle?.close().catch(() => undefined);
    await unlink(temporaryPath).catch(() => undefined);
  }

  return Object.freeze({
    bytes,
    sha256: digest.digest("hex"),
  });
}

export async function downloadMobileAndroidPreviewApk({
  queuePath,
  completionPath,
  outputPath,
  environment = process.env,
  fetchImplementation = globalThis.fetch,
}) {
  validateDownloadEnvironment(environment);
  if (typeof fetchImplementation !== "function") {
    fail("android_preview_download_unavailable");
  }

  const [queueBytes, completionBytes] = await Promise.all([
    readStablePrivateFile(
      queuePath,
      "mobile_android_preview_queue",
      MAX_BUILD_REPORT_BYTES,
    ),
    readStablePrivateFile(
      completionPath,
      "mobile_android_preview_completion",
      MAX_BUILD_REPORT_BYTES,
    ),
  ]);
  try {
    const queueOutput = parseJson(
      queueBytes,
      "android_preview_queue_json_invalid",
    );
    const completionOutput = parseJson(
      completionBytes,
      "android_preview_completion_json_invalid",
    );
    const verified = evaluateMobileSignedBuildCompletion({
      queueOutput,
      completionOutput,
      environment,
    });
    if (
      verified.state !== "verified" ||
      verified.platform !== "android" ||
      verified.buildProfile !== "preview" ||
      verified.distribution !== "internal" ||
      verified.artifact !== "available"
    ) {
      fail("android_preview_build_not_verified");
    }
    const completion = singleRecord(
      completionOutput,
      "android_preview_completion_record_invalid",
    );
    const artifactUrl = completion?.artifacts?.applicationArchiveUrl;
    if (!validateExpoAndroidPreviewArtifactUrl(artifactUrl)) {
      fail("android_preview_artifact_url_invalid");
    }
    return await downloadAndroidApk({
      artifactUrl,
      outputPath,
      fetchImplementation,
    });
  } finally {
    queueBytes.fill(0);
    completionBytes.fill(0);
  }
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--queue" && args.queuePath === undefined) {
      args.queuePath = argv[++index];
    } else if (value === "--completion" && args.completionPath === undefined) {
      args.completionPath = argv[++index];
    } else if (value === "--output" && args.outputPath === undefined) {
      args.outputPath = argv[++index];
    } else {
      fail("usage_invalid");
    }
  }
  for (const field of ["queuePath", "completionPath", "outputPath"]) {
    if (
      typeof args[field] !== "string" ||
      !args[field] ||
      args[field].startsWith("-")
    ) {
      fail("usage_invalid");
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = await downloadMobileAndroidPreviewApk(args);
  console.log(`MOBILE_ANDROID_PREVIEW_APK_BYTES=${result.bytes}`);
  console.log("MOBILE_ANDROID_PREVIEW_APK_SHA256=verified");
  console.log("MOBILE_ANDROID_PREVIEW_APK_SOURCE=verified-eas-internal-build");
  console.log("MOBILE_ANDROID_PREVIEW_APK_HANDOFF=PASS");
  console.log("MOBILE_ANDROID_PREVIEW_PRIVATE_VALUES_OUTPUT=false");
}

const isDirectRun = process.argv[1]
  ? import.meta.url === pathToFileURL(resolve(process.argv[1])).href
  : false;

if (isDirectRun) {
  main().catch((error) => {
    const code =
      typeof error?.code === "string" && /^[a-z0-9_]+$/u.test(error.code)
        ? error.code
        : "android_preview_handoff_failed";
    console.error(`MOBILE_ANDROID_PREVIEW_APK_ERROR=${code}`);
    console.error("MOBILE_ANDROID_PREVIEW_PRIVATE_VALUES_OUTPUT=false");
    process.exitCode = 1;
  });
}
