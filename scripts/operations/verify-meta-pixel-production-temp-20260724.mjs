#!/usr/bin/env node

import { appendFile, chmod, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const BASE_URL = "https://fanmind.ch";
const PIXEL_ID = "2069553844439892";
const REPORT_PATH = process.argv[2] || "fanmind-meta-pixel-production-browser.txt";
const CONSENT_COOKIE = "fanmind_marketing_consent";
const SENSITIVE_PARAMETER_PATTERN =
  /^(?:em|ph|fn|ln|db|ge|ct|st|zp|country|external_id|user_data|ud\[|cd\[)/iu;

async function emit(key, value) {
  const line = `${key}=${value}`;
  process.stdout.write(`${line}\n`);
  await appendFile(REPORT_PATH, `${line}\n`, { mode: 0o600 });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitUntil(check, timeoutMs = 20_000, intervalMs = 200) {
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

function requestParameters(request, url) {
  const parameters = [url.searchParams];
  const body = request.postData();
  if (body && body.length <= 64_000) {
    try {
      parameters.push(new URLSearchParams(body));
    } catch {
      // A non-form body is ignored and never logged.
    }
  }
  return parameters;
}

async function observedMetaCalls(page) {
  return page.evaluate(() =>
    Array.isArray(window.__fanmindObservedMetaCalls)
      ? window.__fanmindObservedMetaCalls
      : [],
  );
}

function countObserved(calls, command, value) {
  return calls.filter(
    (call) => call?.[0] === command && (value === undefined || call?.[1] === value),
  ).length;
}

async function main() {
  await writeFile(REPORT_PATH, "", { mode: 0o600 });
  await emit("BROWSER_VERIFICATION_UTC", new Date().toISOString());
  await emit("TARGET_DOMAIN", "fanmind.ch");
  await emit("EXPECTED_PIXEL_ID", PIXEL_ID);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    locale: "de-CH",
    timezoneId: "Europe/Zurich",
    serviceWorkers: "block",
  });

  await context.addInitScript(() => {
    window.__fanmindObservedMetaCalls = [];
    window.addEventListener("fanmind:meta-pixel-ready", () => {
      const current = window.fbq;
      if (typeof current !== "function") return;

      for (const queued of current.queue ?? []) {
        const call = Array.from(queued);
        window.__fanmindObservedMetaCalls.push(call.slice(0, 4));
      }

      if (current.__fanmindObservationWrapped) return;
      const proxy = new Proxy(current, {
        apply(target, thisArgument, argumentsList) {
          window.__fanmindObservedMetaCalls.push(
            Array.from(argumentsList).slice(0, 4),
          );
          return Reflect.apply(target, thisArgument, argumentsList);
        },
      });
      proxy.__fanmindObservationWrapped = true;
      window.fbq = proxy;
      window._fbq = proxy;
    });
  });

  let scriptRequests = 0;
  let scriptResponseStatus = 0;
  let scriptRequestFailed = false;
  let transportRequests = 0;
  let pageViewTransportRequests = 0;
  const eventNames = new Set();
  const sensitiveParameterKeys = new Set();

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

    for (const parameters of requestParameters(request, url)) {
      const id = parameters.get("id");
      const eventName = parameters.get("ev");
      for (const key of parameters.keys()) {
        if (SENSITIVE_PARAMETER_PATTERN.test(key)) {
          sensitiveParameterKeys.add(key);
        }
      }
      if (id !== PIXEL_ID || !eventName) continue;
      transportRequests += 1;
      eventNames.add(eventName);
      if (eventName === "PageView") pageViewTransportRequests += 1;
      break;
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

  context.on("requestfailed", (request) => {
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
      scriptRequestFailed = true;
    }
  });

  const page = await context.newPage();
  try {
    const initialResponse = await page.goto(`${BASE_URL}/`, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    requireCondition(initialResponse?.ok() === true, "landing_unavailable");
    await page.getByRole("button", { name: "Nur notwendige" }).waitFor();
    await sleep(1_500);
    requireCondition(scriptRequests === 0, "script_loaded_before_consent");
    requireCondition(transportRequests === 0, "transport_before_consent");
    await emit("PRE_CONSENT_META_SCRIPT_REQUESTS", scriptRequests);
    await emit("PRE_CONSENT_META_TRANSPORT_REQUESTS", transportRequests);

    await page.getByRole("button", { name: "Nur notwendige" }).click();
    await page
      .getByRole("button", { name: "Datenschutz-Einstellungen" })
      .waitFor();
    await sleep(1_000);
    requireCondition(scriptRequests === 0, "script_loaded_after_reject");
    requireCondition(transportRequests === 0, "transport_after_reject");
    await emit("REJECTED_META_SCRIPT_REQUESTS", scriptRequests);
    await emit("REJECTED_META_TRANSPORT_REQUESTS", transportRequests);

    await page
      .getByRole("button", { name: "Datenschutz-Einstellungen" })
      .click();
    await page.getByRole("button", { name: "Marketing erlauben" }).click();

    requireCondition(
      await waitUntil(() => scriptRequests === 1),
      "meta_script_request_timeout",
    );
    requireCondition(
      await waitUntil(
        async () =>
          (await observedMetaCalls(page)).some(
            (call) => call?.[0] === "track" && call?.[1] === "PageView",
          ),
      ),
      "initial_pageview_call_timeout",
    );
    await waitUntil(() => scriptResponseStatus > 0 || scriptRequestFailed, 15_000);
    await sleep(2_000);

    let calls = await observedMetaCalls(page);
    requireCondition(scriptRequests === 1, "meta_script_not_exactly_once");
    requireCondition(
      countObserved(calls, "init", PIXEL_ID) === 1,
      "meta_init_not_exactly_once",
    );
    requireCondition(
      calls.filter(
        (call) =>
          call?.[0] === "set" &&
          call?.[1] === "autoConfig" &&
          call?.[2] === false &&
          call?.[3] === PIXEL_ID,
      ).length === 1,
      "meta_autoconfig_not_disabled",
    );
    requireCondition(
      countObserved(calls, "track", "PageView") === 1,
      "initial_pageview_call_not_exactly_once",
    );
    requireCondition(
      await page.evaluate(
        () =>
          typeof window.fbq === "function" &&
          typeof window.fbq.callMethod === "function",
      ),
      "meta_library_not_loaded",
    );
    requireCondition(
      !scriptRequestFailed && scriptResponseStatus >= 200 && scriptResponseStatus < 400,
      "meta_script_response_invalid",
    );

    await emit("OPT_IN_META_SCRIPT_REQUESTS", scriptRequests);
    await emit("OPT_IN_META_SCRIPT_RESPONSE_STATUS", scriptResponseStatus);
    await emit("INITIAL_PAGEVIEW_CALLS", countObserved(calls, "track", "PageView"));
    await emit("INITIAL_PAGEVIEW_TRANSPORT_REQUESTS", pageViewTransportRequests);

    await page
      .getByRole("button", { name: "Datenschutz-Einstellungen" })
      .click();
    await page
      .getByRole("link", { name: "Details in der Datenschutzerklärung" })
      .click();
    await page.waitForURL(/\/datenschutz#marketing-messung$/u);
    requireCondition(
      await waitUntil(
        async () =>
          countObserved(await observedMetaCalls(page), "track", "PageView") === 2,
      ),
      "client_navigation_pageview_call_timeout",
    );
    await sleep(1_500);
    calls = await observedMetaCalls(page);
    requireCondition(scriptRequests === 1, "meta_script_duplicated_on_navigation");
    requireCondition(
      countObserved(calls, "track", "PageView") === 2,
      "client_navigation_pageview_call_invalid",
    );
    await emit("CLIENT_NAVIGATION_META_SCRIPT_REQUESTS", scriptRequests);
    await emit("CLIENT_NAVIGATION_PAGEVIEW_CALLS", 2);
    await emit("CLIENT_NAVIGATION_PAGEVIEW_TRANSPORT_REQUESTS", pageViewTransportRequests);

    await page.getByRole("button", { name: "Marketing erlauben" }).click();
    await sleep(1_000);
    calls = await observedMetaCalls(page);
    requireCondition(
      countObserved(calls, "track", "PageView") === 2,
      "duplicate_pageview_after_reconfirm",
    );
    await emit("RECONFIRM_PAGEVIEW_CALLS", 2);

    await page
      .getByRole("button", { name: "Datenschutz-Einstellungen" })
      .click();
    await page.getByRole("button", { name: "Nur notwendige" }).click();
    await page.goto(`${BASE_URL}/roadmap`, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    await sleep(1_500);
    requireCondition(
      countObserved(await observedMetaCalls(page), "track", "PageView") === 0,
      "pageview_after_revoke",
    );
    await emit("POST_REVOKE_NEW_DOCUMENT_PAGEVIEW_CALLS", 0);

    await context.addCookies([
      {
        name: CONSENT_COOKIE,
        value: "granted",
        domain: "fanmind.ch",
        path: "/",
        secure: true,
        sameSite: "Lax",
      },
    ]);
    const protectedPage = await context.newPage();
    try {
      await protectedPage.goto(
        `${BASE_URL}/login?returnTo=%2Ffans%2Fsynthetic-contact-reference`,
        { waitUntil: "domcontentloaded", timeout: 30_000 },
      );
      await sleep(1_500);
      requireCondition(scriptRequests === 1, "script_loaded_on_unsafe_url");
      requireCondition(
        (await protectedPage
          .getByRole("button", { name: "Datenschutz-Einstellungen" })
          .count()) === 0,
        "consent_ui_visible_on_unsafe_url",
      );
      requireCondition(
        await protectedPage.evaluate(() => typeof window.fbq === "undefined"),
        "fbq_available_on_unsafe_url",
      );
      await emit("UNSAFE_URL_META_SCRIPT_REQUESTS_ADDED", 0);
      await emit("UNSAFE_URL_PAGEVIEW_CALLS", 0);
      await emit("UNSAFE_URL_CONSENT_UI", "absent");
    } finally {
      await protectedPage.close();
    }

    requireCondition(
      sensitiveParameterKeys.size === 0,
      "sensitive_meta_parameter_detected",
    );
    requireCondition(
      [...eventNames].every((eventName) => eventName === "PageView"),
      "unexpected_meta_transport_event_detected",
    );

    await emit("FINAL_META_SCRIPT_REQUESTS", scriptRequests);
    await emit("FINAL_META_TRANSPORT_REQUESTS", transportRequests);
    await emit("FINAL_PAGEVIEW_TRANSPORT_REQUESTS", pageViewTransportRequests);
    await emit(
      "NETWORK_PAGEVIEW_TRANSPORT_OBSERVED",
      pageViewTransportRequests > 0 ? "yes" : "no",
    );
    await emit(
      "FINAL_META_TRANSPORT_EVENT_NAMES",
      [...eventNames].sort().join(",") || "none",
    );
    await emit("SENSITIVE_META_PARAMETER_KEY_COUNT", sensitiveParameterKeys.size);
    await emit("ADVANCED_MATCHING_OBSERVED", "no");
    await emit("CONVERSION_EVENTS_OBSERVED", "no");
    await emit("RESPONSE_BODIES_WERE_NOT_READ", "true");
    await emit("CUSTOMER_DATA_WAS_NOT_USED", "true");
    await emit("META_PIXEL_PRODUCTION_BROWSER_RESULT", "success");
  } finally {
    await context.close();
    await browser.close();
  }

  await chmod(REPORT_PATH, 0o600);
}

main().catch(async (error) => {
  const code =
    error instanceof Error && /^[a-z0-9_]+$/u.test(error.message)
      ? error.message
      : "meta_pixel_production_browser_failed";
  try {
    await emit("META_PIXEL_PRODUCTION_BROWSER_RESULT", "failed");
    await emit("META_PIXEL_PRODUCTION_BROWSER_REASON", code);
  } catch {
    // Keep failure output bounded if the report cannot be written.
  }
  process.stderr.write("meta_pixel_production_browser_failed\n");
  process.exit(1);
});
