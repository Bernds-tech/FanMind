import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  FANMIND_MARKETING_CONSENT_COOKIE,
  META_PIXEL_ACTIVE_EVENTS,
  META_PIXEL_PREPARED_EVENTS,
  buildMetaPixelBootstrap,
  isMetaPixelEnabled,
  normalizeMarketingConsent,
  normalizeMetaPixelId,
  normalizeMetaPixelRoute,
} from "../src/lib/metaPixelPolicy.mjs";

const PIXEL_ID = "2069553844439892";

async function source(path) {
  return readFile(path, "utf8");
}

test("Meta Pixel ID and consent fail closed", () => {
  assert.equal(normalizeMetaPixelId(PIXEL_ID), PIXEL_ID);
  assert.equal(normalizeMetaPixelId(""), null);
  assert.equal(normalizeMetaPixelId("pixel-2069553844439892"), null);
  assert.equal(normalizeMetaPixelId("2069553844439892\nalert(1)"), null);

  assert.equal(normalizeMarketingConsent("granted"), "granted");
  assert.equal(normalizeMarketingConsent("denied"), "denied");
  assert.equal(normalizeMarketingConsent("anything"), "unset");
  assert.equal(
    isMetaPixelEnabled({ pixelId: PIXEL_ID, consent: "granted" }),
    true,
  );
  assert.equal(
    isMetaPixelEnabled({ pixelId: PIXEL_ID, consent: "denied" }),
    false,
  );
  assert.equal(
    isMetaPixelEnabled({ pixelId: "", consent: "granted" }),
    false,
  );
});

test("bootstrap initializes exactly once without firing PageView or noscript tracking", () => {
  const bootstrap = buildMetaPixelBootstrap(PIXEL_ID);
  assert.equal(typeof bootstrap, "string");
  assert.match(bootstrap, /connect\.facebook\.net\/en_US\/fbevents\.js/u);
  assert.match(bootstrap, /fbq\('init','2069553844439892'\)/u);
  assert.equal((bootstrap.match(/fbq\('init'/gu) ?? []).length, 1);
  assert.doesNotMatch(bootstrap, /PageView|facebook\.com\/tr|noscript/iu);
  assert.doesNotMatch(bootstrap, /email|phone|external_id|em|ph/iu);
});

test("only PageView is active and conversion names remain prepared", () => {
  assert.deepEqual([...META_PIXEL_ACTIVE_EVENTS], ["PageView"]);
  assert.deepEqual([...META_PIXEL_PREPARED_EVENTS], [
    "ViewContent",
    "Lead",
    "CompleteRegistration",
    "Contact",
    "Schedule",
    "StartTrial",
    "Purchase",
  ]);
  assert.equal(FANMIND_MARKETING_CONSENT_COOKIE, "fanmind_marketing_consent");
  assert.equal(normalizeMetaPixelRoute("/login"), "/login");
  assert.equal(normalizeMetaPixelRoute("//evil.example"), "/");
});

test("root layout mounts one global consent manager and reads only public configuration", async () => {
  const layout = await source("src/app/layout.tsx");
  assert.match(layout, /MarketingConsentManager/u);
  assert.match(layout, /FANMIND_MARKETING_CONSENT_COOKIE/u);
  assert.match(layout, /NEXT_PUBLIC_META_PIXEL_ID/u);
  assert.equal((layout.match(/<MarketingConsentManager/gu) ?? []).length, 1);
  assert.doesNotMatch(
    layout,
    /SUPABASE_SERVICE_ROLE_KEY|RESEND_API_KEY|STRIPE_SECRET_KEY|OPENAI_API_KEY/u,
  );
});

test("consent controls gate loading and allow later withdrawal", async () => {
  const [manager, loader, helper] = await Promise.all([
    source("src/components/marketing/MarketingConsentManager.tsx"),
    source("src/components/marketing/MetaPixelLoader.tsx"),
    source("src/lib/metaPixel.ts"),
  ]);

  assert.match(manager, /Nur notwendige/u);
  assert.match(manager, /Marketing erlauben/u);
  assert.match(manager, /Datenschutz-Einstellungen/u);
  assert.match(manager, /isMetaPixelEnabled/u);
  assert.match(manager, /revokeMetaPixelConsent/u);
  assert.match(manager, /SameSite=Lax/u);
  assert.match(loader, /strategy="afterInteractive"/u);
  assert.match(loader, /trackMetaPixelPageView\(pathname\)/u);
  assert.match(helper, /__fanmindMetaPixelLastRoute/u);
  assert.match(helper, /window\.fbq\("consent", "revoke"\)/u);
  assert.match(helper, /expireFirstPartyMetaCookie\("_fbp"\)/u);
  assert.match(helper, /expireFirstPartyMetaCookie\("_fbc"\)/u);
  assert.doesNotMatch(
    `${manager}\n${loader}\n${helper}`,
    /user\.email|display_name|contactId|messageContent|advancedMatching|external_id/u,
  );
});

test("event helper accepts no arbitrary payload and no conversions are wired", async () => {
  const helper = await source("src/lib/metaPixel.ts");
  const repositorySources = await Promise.all([
    source("src/app/layout.tsx"),
    source("src/components/marketing/MarketingConsentManager.tsx"),
    source("src/components/marketing/MetaPixelLoader.tsx"),
  ]);

  assert.match(
    helper,
    /trackMetaPixelEvent\(eventName: MetaPixelEventName\): boolean/u,
  );
  assert.doesNotMatch(helper, /parameters|customData|userData/u);
  assert.doesNotMatch(
    repositorySources.join("\n"),
    /trackMetaPixelEvent\("(?:ViewContent|Lead|CompleteRegistration|Contact|Schedule|StartTrial|Purchase)"\)/u,
  );
});

test("environment, privacy and runbook document the inactive-by-default rollout", async () => {
  const [envExample, stagingExample, privacy, runbook] = await Promise.all([
    source(".env.example"),
    source(".env.staging.example"),
    source("src/app/datenschutz/page.tsx"),
    source("docs/analytics/META_PIXEL.md"),
  ]);

  assert.match(envExample, /NEXT_PUBLIC_META_PIXEL_ID=2069553844439892/u);
  assert.match(stagingExample, /NEXT_PUBLIC_META_PIXEL_ID=/u);
  assert.match(privacy, /marketing-messung/u);
  assert.match(privacy, /Meta Pixel/u);
  assert.match(privacy, /ausdrücklicher Einwilligung/u);
  assert.match(runbook, /Nur `PageView`/u);
  assert.match(runbook, /keine Conversions API/iu);
  assert.match(runbook, /kein erweitertes Matching/iu);
  assert.match(runbook, /Die Codeintegration allein bedeutet nicht, dass der Pixel bereits auf Production aktiv ist/u);
});

test("browser E2E uses a synthetic Meta script and proves consent-gated PageView", async () => {
  const [workflow, spec] = await Promise.all([
    source(".github/workflows/browser-e2e.yml"),
    source("e2e/public-critical.spec.ts"),
  ]);

  assert.match(workflow, /NEXT_PUBLIC_META_PIXEL_ID: 2069553844439892/u);
  assert.match(spec, /connect\.facebook\.net\/en_US\/fbevents\.js/u);
  assert.match(spec, /Marketing erlauben/u);
  assert.match(spec, /Nur notwendige/u);
  assert.match(spec, /2069553844439892/u);
  assert.match(spec, /PageView/u);
  assert.match(spec, /Datenschutz-Einstellungen/u);
  assert.doesNotMatch(spec, /facebook\.com\/tr/u);
});
