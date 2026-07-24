#!/usr/bin/env node

import { appendFile, chmod, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const BASE_URL = "https://fanmind.ch";
const PIXEL_ID = "2069553844439892";
const EXPECTED_RELEASE = "6b8ba61a1786651713b2507340dc7b673811159d";
const REPORT_PATH = process.argv[2] || "fanmind-meta-pixel-network-verification.txt";
const SENSITIVE_PARAMETER_PATTERN =
  /^(?:em|ph|fn|ln|db|ge|ct|st|zp|country|external_id|user_data|ud\[|cd\[)/iu;

let scriptRequests = 0;
let scriptResponseStatus = 0;
let pageViewRequests = 0;
let transportRequests = 0;
let metaNonScriptRequests = 0;
let metaRequestFailures = 0;
let consoleErrorCount = 0;
let pageErrorCount = 0;
const eventNames = new Set();
const sensitiveParameterKeys = new Set();
const metaRequestPaths = new Set();
const metaRequestMethods = new Set();
const metaParameterKeys = new Set();
let runtimeState = {
  fbqType: "unknown",
  callMethodType: "unknown",
  loaded: false,
  queueLength: -1,
  markerMatches: false,
};
let manualPostLoadPageViewObserved = false;

async function emit(key, value) {
  const line = `${key}=${value}`;
  process.stdout.write(`${line}\n`);
  await appendFile(REPORT_PATH, `${line}\n`, { mode: 0o600 });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitUntil(check, timeoutMs = 25_000, intervalMs = 250) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await check()) return true;
    await sleep(intervalMs);
  }
  return false;
}

function requireCondition(condition, code) {
  if (!condition) throw new Error(code);
}

function isMetaHost(hostname) {
  return /(^|\.)facebook\.(?:com|net)$/iu.test(hostname);
}

function parameterSets(request, url) {
  const sets = [url.searchParams];
  const body = request.postData();
  if (body && body.length <= 64_000) {
    try {
      sets.push(new URLSearchParams(body));
    } catch {
      // Non-form request bodies are ignored and never logged.
    }
  }
  return sets;
}

async function emitDiagnostics() {
  await emit("REAL_META_SCRIPT_REQUESTS", scriptRequests);
  await emit("REAL_META_SCRIPT_RESPONSE_STATUS", scriptResponseStatus);
  await emit("REAL_META_NON_SCRIPT_REQUESTS", metaNonScriptRequests);
  await emit("REAL_META_REQUEST_FAILURES", metaRequestFailures);
  await emit("REAL_META_TRANSPORT_REQUESTS", transportRequests);
  await emit("REAL_PAGEVIEW_TRANSPORT_REQUESTS", pageViewRequests);
  await emit("REAL_META_EVENT_NAMES", [...eventNames].sort().join(",") || "none");
  await emit("REAL_META_REQUEST_PATHS", [...metaRequestPaths].sort().join(",") || "none");
  await emit("REAL_META_REQUEST_METHODS", [...metaRequestMethods].sort().join(",") || "none");
  await emit("REAL_META_PARAMETER_KEYS", [...metaParameterKeys].sort().join(",") || "none");
  await emit("SENSITIVE_META_PARAMETER_KEY_COUNT", sensitiveParameterKeys.size);
  await emit("BROWSER_CONSOLE_ERROR_COUNT", consoleErrorCount);
  await emit("BROWSER_PAGE_ERROR_COUNT", pageErrorCount);
  await emit("FBQ_TYPE", runtimeState.fbqType);
  await emit("FBQ_CALL_METHOD_TYPE", runtimeState.callMethodType);
  await emit("FBQ_LOADED", runtimeState.loaded ? "yes" : "no");
  await emit("FBQ_QUEUE_LENGTH", runtimeState.queueLength);
  await emit("FBQ_PIXEL_MARKER_MATCH", runtimeState.markerMatches ? "yes" : "no");
  await emit(
    "POST_LOAD_MANUAL_PAGEVIEW_TRANSPORT_OBSERVED",
    manualPostLoadPageViewObserved ? "yes" : "no",
  );
}

async function main() {
  await writeFile(REPORT_PATH, "", { mode: 0o600 });
  await emit("NETWORK_VERIFICATION_UTC", new Date().toISOString());
  await emit("EXPECTED_RELEASE", EXPECTED_RELEASE);

  const versionResponse = await fetch(`${BASE_URL}/api/version`, {
    signal: AbortSignal.timeout(15_000),
  });
  const version = await versionResponse.json();
  requireCondition(
    versionResponse.ok && version?.releaseCommit === EXPECTED_RELEASE,
    "release_mismatch",
  );

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    locale: "de-CH",
    timezoneId: "Europe/Zurich",
  });

  context.on("request", (request) => {
    let url;
    try {
      url = new URL(request.url());
    } catch {
      return;
    }

    if (
      url.hostname === "connect.facebook.net" &&
      url.pathname === "/en_US/fbevents.js"
    ) {
      scriptRequests += 1;
      return;
    }
    if (!isMetaHost(url.hostname)) return;

    metaNonScriptRequests += 1;
    metaRequestPaths.add(`${url.hostname}${url.pathname}`);
    metaRequestMethods.add(request.method());

    for (const parameters of parameterSets(request, url)) {
      for (const key of parameters.keys()) {
        metaParameterKeys.add(key);
        if (SENSITIVE_PARAMETER_PATTERN.test(key)) {
          sensitiveParameterKeys.add(key);
        }
      }
      const id = parameters.get("id");
      const eventName = parameters.get("ev");
      if (id !== PIXEL_ID || !eventName) continue;
      transportRequests += 1;
      eventNames.add(eventName);
      if (eventName === "PageView") pageViewRequests += 1;
      break;
    }
  });

  context.on("requestfailed", (request) => {
    try {
      const url = new URL(request.url());
      if (isMetaHost(url.hostname)) metaRequestFailures += 1;
    } catch {
      // Ignore malformed URLs.
    }
  });

  context.on("response", (response) => {
    let url;
    try {
      url = new URL(response.url());
    } catch {
      return;
    }
    if (
      url.hostname === "connect.facebook.net" &&
      url.pathname === "/en_US/fbevents.js"
    ) {
      scriptResponseStatus = response.status();
    }
  });

  const page = await context.newPage();
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrorCount += 1;
  });
  page.on("pageerror", () => {
    pageErrorCount += 1;
  });

  try {
    const response = await page.goto(`${BASE_URL}/`, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    requireCondition(response?.ok() === true, "landing_unavailable");
    await page.getByRole("button", { name: "Marketing erlauben" }).waitFor();
    await sleep(1_000);
    requireCondition(scriptRequests === 0, "script_before_consent");
    requireCondition(transportRequests === 0, "transport_before_consent");

    await page.getByRole("button", { name: "Marketing erlauben" }).click();
    requireCondition(
      await waitUntil(() => scriptRequests === 1),
      "script_request_timeout",
    );
    requireCondition(
      await waitUntil(() => scriptResponseStatus >= 200 && scriptResponseStatus < 400),
      "script_response_timeout",
    );

    let initialTransportObserved = await waitUntil(() => pageViewRequests >= 1, 10_000);
    await sleep(1_000);
    runtimeState = await page.evaluate((pixelId) => ({
      fbqType: typeof window.fbq,
      callMethodType: typeof window.fbq?.callMethod,
      loaded: window.fbq?.loaded === true,
      queueLength: Array.isArray(window.fbq?.queue) ? window.fbq.queue.length : -1,
      markerMatches: window.__fanmindMetaPixelId === pixelId,
    }), PIXEL_ID);

    if (!initialTransportObserved && runtimeState.callMethodType === "function") {
      const beforeManual = pageViewRequests;
      await page.evaluate(() => window.fbq?.("track", "PageView"));
      manualPostLoadPageViewObserved = await waitUntil(
        () => pageViewRequests > beforeManual,
        10_000,
      );
      initialTransportObserved = false;
    }

    await emitDiagnostics();
    requireCondition(initialTransportObserved, "initial_pageview_transport_timeout");
    requireCondition(scriptRequests === 1, "script_request_not_exactly_once");
    requireCondition(pageViewRequests === 1, "initial_pageview_not_exactly_once");

    await page
      .getByRole("button", { name: "Datenschutz-Einstellungen" })
      .click();
    await page
      .getByRole("link", { name: "Details in der Datenschutzerklärung" })
      .click();
    await page.waitForURL(/\/datenschutz#marketing-messung$/u);
    requireCondition(
      await waitUntil(() => pageViewRequests >= 2),
      "client_navigation_transport_timeout",
    );
    await sleep(1_500);
    requireCondition(scriptRequests === 1, "script_duplicated_on_navigation");
    requireCondition(pageViewRequests === 2, "client_navigation_pageview_invalid");
    requireCondition(
      sensitiveParameterKeys.size === 0,
      "sensitive_parameter_detected",
    );
    requireCondition(
      [...eventNames].every((eventName) => eventName === "PageView"),
      "unexpected_event_detected",
    );

    await emit("ADVANCED_MATCHING_OBSERVED", "no");
    await emit("CONVERSION_EVENTS_OBSERVED", "no");
    await emit("REQUEST_VALUES_WERE_NOT_LOGGED", "true");
    await emit("RESPONSE_BODIES_WERE_NOT_READ", "true");
    await emit("META_PIXEL_REAL_NETWORK_RESULT", "success");
  } finally {
    await context.close();
    await browser.close();
  }

  await chmod(REPORT_PATH, 0o600);
}

main().catch(async (error) => {
  const reason =
    error instanceof Error && /^[a-z0-9_]+$/u.test(error.message)
      ? error.message
      : "meta_pixel_real_network_failed";
  try {
    await emit("META_PIXEL_REAL_NETWORK_RESULT", "failed");
    await emit("META_PIXEL_REAL_NETWORK_REASON", reason);
  } catch {
    // Keep failure output bounded.
  }
  process.stderr.write("meta_pixel_real_network_failed\n");
  process.exit(1);
});
