import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

import {
  buildRegistrationHref,
  isDailyTestRegistration,
  isProductiveRegistrationEntry,
  normalizeStarterOfferOption,
} from "../src/lib/registrationEntryPolicy.mjs";

async function source(path) {
  return readFile(path, "utf8");
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function walkFiles(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = `${root}/${entry.name}`;
    if (entry.isDirectory() && ["node_modules", ".expo", ".next"].includes(entry.name)) {
      return [];
    }
    return entry.isDirectory() ? walkFiles(path) : [path];
  }));
  return nested.flat();
}

test("Starter landing entries use valid plan IDs and preserve option, language and referral", () => {
  assert.equal(
    buildRegistrationHref({
      language: "de",
      planId: "starter",
      starterOption: "starter_paid_setup",
    }),
    "/register?plan=starter&option=starter_paid_setup",
  );
  assert.equal(
    buildRegistrationHref({
      language: "en",
      planId: "starter",
      starterOption: "starter_no_setup_commitment",
      referralCode: "FM-ABC123",
    }),
    "/register?plan=starter&option=starter_no_setup_commitment&lang=en&ref=FM-ABC123",
  );
  assert.equal(normalizeStarterOfferOption("starter_no_setup_commitment"), "starter_no_setup_commitment");
  assert.equal(normalizeStarterOfferOption("starter-12"), "starter_paid_setup");
});

test("daily registration is productive only behind the flag and exact daily selector", () => {
  const validDaily = { enabled: true, planId: "pilot", testPlan: "daily" };
  assert.equal(isDailyTestRegistration(validDaily), true);
  assert.equal(isProductiveRegistrationEntry(validDaily), true);
  assert.equal(isDailyTestRegistration({ ...validDaily, enabled: false }), false);
  assert.equal(isDailyTestRegistration({ ...validDaily, testPlan: "Daily" }), false);
  assert.equal(isDailyTestRegistration({ ...validDaily, testPlan: undefined }), false);
  assert.equal(isProductiveRegistrationEntry({ enabled: true, planId: "pilot" }), false);
  assert.equal(isProductiveRegistrationEntry({ planId: "starter" }), true);
});

test("active product surfaces no longer route to retired Pilot registration", async () => {
  const [landing, register, onboarding, dashboard, admin] = await Promise.all([
    source("src/app/landing-v2/page.tsx"),
    source("src/app/register/RegisterClient.tsx"),
    source("src/app/onboarding/page.tsx"),
    source("src/app/dashboard/page.tsx"),
    source("src/app/admin/billing/page.tsx"),
  ]);

  assert.match(landing, /plan=starter&option=starter_paid_setup/u);
  assert.match(landing, /plan=starter&option=starter_no_setup_commitment/u);
  assert.doesNotMatch(landing, /plan=starter-(?:flex|12)/u);
  assert.match(register, /isRetiredPilotRequested \? "starter" : resolvedPlanId/u);
  assert.match(register, /selectedCommercialOption[^=]*= isDailyTestPlanSelected/u);
  assert.match(register, /requiresPaymentTermsAcceptance\(selectedPlanId, selectedCommercialOption\)/u);
  assert.match(register, /required=\{requiresPaymentTermsAcceptance\(selectedPlanId, commercialOption\)\}/u);
  assert.doesNotMatch(onboarding, /<strong>Pilot \/ Setup<\/strong>/u);
  assert.doesNotMatch(dashboard, /Wenn du nach dem Pilot weiter/u);
  assert.doesNotMatch(admin, /href: "\/register\?plan=pilot"/u);
  assert.match(admin, /label="Pilot-Demos"|label: "Pilot-Demos"/u);
  assert.match(admin, /label: "Kostenlose Demo öffnen", href: "\/login"/u);
});

test("FanMind contains no tracked foreign branding or obsolete brand asset path", async () => {
  const foreignBrand = ["well", "fit"].join("");
  const obsoleteBrandAssetPath = ["public/brands", "Logo.png"].join("/");
  const obsoleteSvgAssetPath = ["public/assets", `${foreignBrand}-logo.svg`].join("/");
  const facebookSelector = await source("src/app/channels/facebook/select/page.tsx");
  assert.match(facebookSelector, /import \{ FanMindLogo \}/u);
  assert.match(facebookSelector, /<FanMindLogo/u);
  assert.equal(facebookSelector.includes(obsoleteBrandAssetPath.replace(/^public/u, "")), false);
  assert.doesNotMatch(facebookSelector, /next\/image/iu);

  assert.equal(await exists(obsoleteBrandAssetPath), false);
  assert.equal(await exists(obsoleteSvgAssetPath), false);
  assert.equal(await exists("apps/mobile/assets/branding/fanmind-wordmark.png"), true);
  assert.equal(await exists("public/assets/fanmind-social-avatar.png"), true);

  const files = (
    await Promise.all(["src", "public", "apps/mobile"].map(walkFiles))
  ).flat();
  const textExtensions = /\.(?:css|html|js|json|md|mjs|mts|svg|ts|tsx|txt|xml)$/u;
  const textFiles = files.filter((path) => textExtensions.test(path));
  const text = (await Promise.all(textFiles.map(source))).join("\n");

  assert.equal(files.some((path) => path.toLowerCase().includes(foreignBrand)), false);
  assert.equal(text.toLowerCase().includes(foreignBrand), false);
  assert.equal(text.includes(obsoleteBrandAssetPath.replace(/^public/u, "")), false);
});

test("phase 7 excludes LinkedIn and additional channels and stays outside the current completion scope", async () => {
  const [roadmap, sourceOfTruth, readme, tracker] = await Promise.all([
    source("src/config/roadmap.ts"),
    source("docs/SOURCE_OF_TRUTH.md"),
    source("README.md"),
    source("docs/operations/P0_COMPLETION_TRACKER.md"),
  ]);

  assert.match(roadmap, /phase: "Phase 7"[\s\S]*TikTok[\s\S]*X \/ Twitter[\s\S]*Discord[\s\S]*OnlyFans/u);
  assert.match(roadmap, /label: "OnlyFans", state: "later", status: "Roadmap"/u);
  assert.doesNotMatch(roadmap, /LinkedIn & weitere Kanäle/u);
  assert.doesNotMatch(readme, /LinkedIn und weiteren Kanälen/u);
  for (const document of [sourceOfTruth, readme, tracker]) {
    assert.match(document, /Roadmap-Phase 7/u);
    assert.match(document, /nicht Teil des aktuellen\s+Abschlussumfangs|nicht zum aktuellen Abschlussumfang|vom aktuellen Abschlussumfang[^\n]*ausgenommen/iu);
  }
});
