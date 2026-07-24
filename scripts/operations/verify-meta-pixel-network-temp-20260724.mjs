#!/usr/bin/env node

import { appendFile, chmod, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const BASE_URL = "https://fanmind.ch";
const PIXEL_ID = "2069553844439892";
const EXPECTED_RELEASE = "6b8ba61a1786651713b2507340dc7b673811159d";
const REPORT_PATH = process.argv[2] || "fanmind-meta-pixel-network-verification.txt";
const SENSITIVE_PARAMETER_PATTERN =
  /^(?:em|ph|fn|ln|db|ge|ct|st|zp|country|external_id|user_data|ud\[|cd\[)/iu;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitUntil(check, timeoutMs = 20_000, intervalMs = 250) {
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

function createTransportObserver(context) {
  const state = {
    scriptRequests: 0,
    scriptResponseStatus: 0,
    pageViewRequests: 0,
    transportRequests: 0,
    metaNonScriptRequests: 0,
    metaRequestFailures: 0,
    eventNames: new Set(),
    sensitiveParameterKeys: new Set(),
    metaRequestPaths: new Set(),
    metaRequestMethods: new Set(),
    metaParameterKeys: new Set(),
  };

  const parameterSets = (request, url) => {
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
  };

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
      state.scriptRequests += 1;
      return;
    }
    if (!isMetaHost(url.hostname)) return;

    state.metaNonScriptRequests += 1;
    state.metaRequestPaths.add(`${url.hostname}${url.pathname}`);
    state.metaRequestMethods.add(request.method());

    for (const parameters of parameterSets(request, url)) {
      for (const key of parameters.keys()) {
        state.metaParameterKeys.add(key);
        if (SENSITIVE_PARAMETER_PATTERN.test(key)) {
          state.sensitiveParameterKeys.add(key);
        }
      }
      const id = parameters.get("id");
      const eventName = parameters.get("ev");
      if (id !== PIXEL_ID || !eventName) continue;
      state.transportRequests += 1;
      state.eventNames.add(eventName);
      if (eventName === "PageView") state.pageViewRequests += 1;
      break;
    }
  });

  context.on("requestfailed", (request) => {
    try {
      const url = new URL(request.url());
      if (isMetaHost(url.hostname)) state.metaRequestFailures += 1;
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
      state.scriptResponseStatus = response.status();
    }
  });

  return state;
}

async function emit(key, value) {
  const line = `${key}=${value}`;
  process.stdout.write(`${line}\n`);
  await appendFile(REPORT_PATH, `${line}\n`, { mode: 0o600 });
}

async function emitObserver(prefix, state) {
  await emit(`${prefix}_META_SCRIPT_REQUESTS`, state.scriptRequests);
  await emit(`${prefix}_META_SCRIPT_RESPONSE_STATUS`, state.scriptResponseStatus);
  await emit(`${prefix}_META_NON_SCRIPT_REQUESTS`, state.metaNonScriptRequests);
  await emit(`${prefix}_META_REQUEST_FAILURES`, state.metaRequestFailures);
  await emit(`${prefix}_META_TRANSPORT_REQUESTS`, state.transportRequests);
  await emit(`${prefix}_PAGEVIEW_TRANSPORT_REQUESTS`, state.pageViewRequests);
  await emit(`${prefix}_META_EVENT_NAMES`, [...state.eventNames].sort().join(",") || "none");
  await emit(`${prefix}_META_REQUEST_PATHS`, [...state.metaRequestPaths].sort().join(",") || "none");
  await emit(`${prefix}_META_REQUEST_METHODS`, [...state.metaRequestMethods].sort().join(",") || "none");
  await emit(`${prefix}_META_PARAMETER_KEYS`, [...state.metaParameterKeys].sort().join(",") || "none");
  await emit(`${prefix}_SENSITIVE_PARAMETER_KEY_COUNT`, state.sensitiveParameterKeys.size);
}

async function runAppFlow(browser) {
  const context = await browser.newContext({
    locale: "de-CH",
    timezoneId: "Europe/Zurich",
  });
  const observer = createTransportObserver(context);
  const page = await context.newPage();
  let consoleErrorCount = 0;
  let pageErrorCount = 0;
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
    requireCondition(observer.scriptRequests === 0, "script_before_consent");
    requireCondition(observer.transportRequests === 0, "transport_before_consent");

    await page.getByRole("button", { name: "Marketing erlauben" }).click();
    requireCondition(
      await waitUntil(() => observer.scriptRequests === 1),
      "script_request_timeout",
    );
    requireCondition(
      await waitUntil(
        () => observer.scriptResponseStatus >= 200 && observer.scriptResponseStatus < 400,
      ),
      "script_response_timeout",
    );

    const appTransportObserved = await waitUntil(
      () => observer.pageViewRequests >= 1,
      10_000,
    );
    const runtime = await page.evaluate((pixelId) => {
      const state = typeof window.fbq?.getState === "function" ? window.fbq.getState() : null;
      const pixels = Array.isArray(state?.pixels) ? state.pixels : [];
      return {
        fbqType: typeof window.fbq,
        callMethodType: typeof window.fbq?.callMethod,
        loaded: window.fbq?.loaded === true,
        queueLength: Array.isArray(window.fbq?.queue) ? window.fbq.queue.length : -1,
        markerMatches: window.__fanmindMetaPixelId === pixelId,
        stateAvailable: state !== null,
        pixelCount: pixels.length,
        expectedPixelPresent: pixels.some((pixel) => String(pixel?.id ?? "") === pixelId),
        stateKeys: state && typeof state === "object" ? Object.keys(state).sort() : [],
        pixelKeys:
          pixels[0] && typeof pixels[0] === "object"
            ? Object.keys(pixels[0]).filter((key) => !/user|email|phone|data/iu.test(key)).sort()
            : [],
      };
    }, PIXEL_ID);

    await emitObserver("APP", observer);
    await emit("APP_BROWSER_CONSOLE_ERROR_COUNT", consoleErrorCount);
    await emit("APP_BROWSER_PAGE_ERROR_COUNT", pageErrorCount);
    await emit("APP_FBQ_TYPE", runtime.fbqType);
    await emit("APP_FBQ_CALL_METHOD_TYPE", runtime.callMethodType);
    await emit("APP_FBQ_LOADED", runtime.loaded ? "yes" : "no");
    await emit("APP_FBQ_QUEUE_LENGTH", runtime.queueLength);
    await emit("APP_FBQ_PIXEL_MARKER_MATCH", runtime.markerMatches ? "yes" : "no");
    await emit("APP_FBQ_STATE_AVAILABLE", runtime.stateAvailable ? "yes" : "no");
    await emit("APP_FBQ_STATE_PIXEL_COUNT", runtime.pixelCount);
    await emit("APP_FBQ_STATE_EXPECTED_PIXEL_PRESENT", runtime.expectedPixelPresent ? "yes" : "no");
    await emit("APP_FBQ_STATE_KEYS", runtime.stateKeys.join(",") || "none");
    await emit("APP_FBQ_PIXEL_KEYS", runtime.pixelKeys.join(",") || "none");
    await emit("APP_PAGEVIEW_TRANSPORT_OBSERVED", appTransportObserved ? "yes" : "no");
    return appTransportObserved;
  } finally {
    await context.close();
  }
}

async function runMinimalSequence(browser) {
  const context = await browser.newContext({
    locale: "de-CH",
    timezoneId: "Europe/Zurich",
  });
  await context.addCookies([
    {
      name: "fanmind_marketing_consent",
      value: "denied",
      url: BASE_URL,
      sameSite: "Lax",
      secure: true,
    },
  ]);
  const observer = createTransportObserver(context);
  const page = await context.newPage();

  try {
    const response = await page.goto(`${BASE_URL}/`, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    requireCondition(response?.ok() === true, "minimal_landing_unavailable");
    await sleep(750);
    requireCondition(observer.scriptRequests === 0, "minimal_app_script_unexpected");

    await page.evaluate((pixelId) => {
      const f = window;
      const b = document;
      const e = "script";
      const v = "https://connect.facebook.net/en_US/fbevents.js";
      if (f.fbq) return;
      const n = function (...args) {
        if (n.callMethod) n.callMethod(...args);
        else n.queue.push(args);
      };
      n.push = n;
      n.loaded = true;
      n.version = "2.0";
      n.queue = [];
      f.fbq = n;
      f._fbq = n;
      const t = b.createElement(e);
      t.async = true;
      t.referrerPolicy = "no-referrer";
      t.src = v;
      const s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
      f.fbq("set", "autoConfig", false, pixelId);
      f.fbq("init", pixelId);
      f.fbq("track", "PageView");
    }, PIXEL_ID);

    requireCondition(
      await waitUntil(() => observer.scriptRequests === 1),
      "minimal_script_request_timeout",
    );
    requireCondition(
      await waitUntil(
        () => observer.scriptResponseStatus >= 200 && observer.scriptResponseStatus < 400,
      ),
      "minimal_script_response_timeout",
    );
    const observed = await waitUntil(() => observer.pageViewRequests >= 1, 15_000);
    await emitObserver("MINIMAL", observer);
    await emit("MINIMAL_PAGEVIEW_TRANSPORT_OBSERVED", observed ? "yes" : "no");
    return observed;
  } finally {
    await context.close();
  }
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
  try {
    const appObserved = await runAppFlow(browser);
    const minimalObserved = appObserved ? true : await runMinimalSequence(browser);

    await emit("REQUEST_VALUES_WERE_NOT_LOGGED", "true");
    await emit("RESPONSE_BODIES_WERE_NOT_READ", "true");
    await emit("CUSTOMER_DATA_WAS_NOT_USED", "true");

    if (!appObserved) {
      await emit("META_PIXEL_REAL_NETWORK_RESULT", "failed");
      await emit(
        "META_PIXEL_REAL_NETWORK_REASON",
        minimalObserved
          ? "app_sequence_suppressed_transport"
          : "meta_transport_not_observed_in_runner",
      );
      process.exitCode = 1;
      return;
    }

    await emit("META_PIXEL_REAL_NETWORK_RESULT", "success");
  } finally {
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
