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
    if (await check()) return;
    await sleep(intervalMs);
  }
  throw new Error("verification_timeout");
}

function requireCondition(condition, code) {
  if (!condition) throw new Error(code);
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

  let scriptRequests = 0;
  let transportRequests = 0;
  let pageViewRequests = 0;
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

    if (
      (url.hostname === "www.facebook.com" ||
        url.hostname === "facebook.com") &&
      (url.pathname === "/tr" || url.pathname === "/tr/")
    ) {
      const id = url.searchParams.get("id");
      if (id !== PIXEL_ID) return;
      transportRequests += 1;
      const eventName = url.searchParams.get("ev") || "missing";
      eventNames.add(eventName);
      if (eventName === "PageView") pageViewRequests += 1;
      for (const key of url.searchParams.keys()) {
        if (SENSITIVE_PARAMETER_PATTERN.test(key)) {
          sensitiveParameterKeys.add(key);
        }
      }
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

    await waitUntil(() => scriptRequests === 1);
    await waitUntil(() => pageViewRequests === 1);
    await sleep(2_000);
    requireCondition(scriptRequests === 1, "meta_script_not_exactly_once");
    requireCondition(pageViewRequests === 1, "initial_pageview_not_exactly_once");
    requireCondition(
      await page.evaluate(() => typeof window.fbq === "function"),
      "fbq_not_available_after_consent",
    );
    await emit("OPT_IN_META_SCRIPT_REQUESTS", scriptRequests);
    await emit("INITIAL_PAGEVIEW_REQUESTS", pageViewRequests);

    await page
      .getByRole("button", { name: "Datenschutz-Einstellungen" })
      .click();
    await page
      .getByRole("link", { name: "Details in der Datenschutzerklärung" })
      .click();
    await page.waitForURL(/\/datenschutz#marketing-messung$/u);
    await waitUntil(() => pageViewRequests === 2);
    await sleep(1_500);
    requireCondition(scriptRequests === 1, "meta_script_duplicated_on_navigation");
    requireCondition(pageViewRequests === 2, "client_navigation_pageview_invalid");
    await emit("CLIENT_NAVIGATION_META_SCRIPT_REQUESTS", scriptRequests);
    await emit("CLIENT_NAVIGATION_PAGEVIEW_REQUESTS", pageViewRequests);

    await page.getByRole("button", { name: "Marketing erlauben" }).click();
    await sleep(1_000);
    requireCondition(pageViewRequests === 2, "duplicate_pageview_after_reconfirm");
    await emit("RECONFIRM_PAGEVIEW_REQUESTS", pageViewRequests);

    await page
      .getByRole("button", { name: "Datenschutz-Einstellungen" })
      .click();
    await page.getByRole("button", { name: "Nur notwendige" }).click();
    await page.goto(`${BASE_URL}/roadmap`, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    await sleep(1_500);
    requireCondition(pageViewRequests === 2, "pageview_after_revoke");
    await emit("POST_REVOKE_PAGEVIEW_REQUESTS", pageViewRequests);

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
      requireCondition(pageViewRequests === 2, "pageview_on_unsafe_url");
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
      await emit("UNSAFE_URL_PAGEVIEW_REQUESTS_ADDED", 0);
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
      "unexpected_meta_event_detected",
    );
    requireCondition(pageViewRequests === 2, "final_pageview_count_invalid");

    await emit("FINAL_META_SCRIPT_REQUESTS", scriptRequests);
    await emit("FINAL_META_TRANSPORT_REQUESTS", transportRequests);
    await emit("FINAL_PAGEVIEW_REQUESTS", pageViewRequests);
    await emit(
      "FINAL_META_EVENT_NAMES",
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
