const STARTER_OFFER_OPTIONS = new Set([
  "starter_paid_setup",
  "starter_no_setup_commitment",
]);

export function normalizeStarterOfferOption(value) {
  const normalized = String(value ?? "").trim();
  return STARTER_OFFER_OPTIONS.has(normalized)
    ? normalized
    : "starter_paid_setup";
}

export function isDailyTestRegistration({ enabled, planId, testPlan }) {
  return (
    enabled === true &&
    planId === "pilot" &&
    testPlan === "daily"
  );
}

export function isProductiveRegistrationEntry(input) {
  return (
    input?.planId === "starter" ||
    isDailyTestRegistration(input ?? {})
  );
}

export function buildRegistrationHref({
  language = "de",
  planId,
  starterOption,
  referralCode,
  testPlan,
}) {
  const query = new URLSearchParams();
  query.set("plan", String(planId));

  if (planId === "starter") {
    query.set("option", normalizeStarterOfferOption(starterOption));
  }
  if (language === "en") query.set("lang", "en");
  if (String(referralCode ?? "").trim()) {
    query.set("ref", String(referralCode).trim());
  }
  if (testPlan === "daily") query.set("test_plan", "daily");

  return `/register?${query.toString()}`;
}
