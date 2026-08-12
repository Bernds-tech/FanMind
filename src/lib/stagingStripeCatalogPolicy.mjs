import { isStripeTestSecretKey } from "./stripeKeyPolicy.mjs";

export const STAGING_STRIPE_CATALOG_CONFIRMATION =
  "verify-staging-stripe-catalog";

export const STAGING_STRIPE_PRICE_CONTRACTS = Object.freeze([
  Object.freeze({
    environmentName: "STRIPE_PRICE_STARTER_SETUP",
    unitAmount: 99_000,
    type: "one_time",
    interval: null,
  }),
  Object.freeze({
    environmentName: "STRIPE_PRICE_STARTER_MONTHLY",
    unitAmount: 31_200,
    type: "recurring",
    interval: "month",
  }),
  Object.freeze({
    environmentName: "STRIPE_PRICE_INTERNAL_DAILY_TEST",
    unitAmount: 100,
    type: "recurring",
    interval: "day",
  }),
  Object.freeze({
    environmentName: "STRIPE_PRICE_AI_PLUS",
    unitAmount: 10_000,
    type: "recurring",
    interval: "month",
  }),
  Object.freeze({
    environmentName: "STRIPE_PRICE_AI_ULTRA",
    unitAmount: 20_000,
    type: "recurring",
    interval: "month",
  }),
]);

const PRICE_ID_PATTERN = /^price_[A-Za-z0-9_]+$/u;
const WEBHOOK_SECRET_PATTERN = /^whsec_[A-Za-z0-9_]+$/u;

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function evaluateStagingStripeCatalogEnvironment(environment = {}) {
  const errors = [];

  if (clean(environment.FANMIND_RUNTIME_ENVIRONMENT) !== "staging") {
    errors.push("runtime_environment");
  }
  if (
    clean(environment.FANMIND_STAGING_STRIPE_CATALOG_CONFIRM) !==
    STAGING_STRIPE_CATALOG_CONFIRMATION
  ) {
    errors.push("confirmation");
  }
  if (!isStripeTestSecretKey(environment.STRIPE_SECRET_KEY)) {
    errors.push("stripe_test_mode");
  }
  if (!WEBHOOK_SECRET_PATTERN.test(clean(environment.STRIPE_WEBHOOK_SECRET))) {
    errors.push("webhook_secret");
  }

  const prices = STAGING_STRIPE_PRICE_CONTRACTS.map((contract) => ({
    ...contract,
    id: clean(environment[contract.environmentName]),
  }));
  if (prices.some((price) => !PRICE_ID_PATTERN.test(price.id))) {
    errors.push("price_configuration");
  }
  if (new Set(prices.map((price) => price.id)).size !== prices.length) {
    errors.push("duplicate_price");
  }

  return Object.freeze({
    ok: errors.length === 0,
    errors: Object.freeze([...new Set(errors)]),
    prices: Object.freeze(prices.map((price) => Object.freeze(price))),
  });
}

export function validateStripeTestPrice(payload, expected) {
  const product =
    payload?.product &&
    typeof payload.product === "object" &&
    !Array.isArray(payload.product)
      ? payload.product
      : null;
  const recurringMatches =
    expected.type === "one_time"
      ? payload?.recurring === null
      : payload?.recurring?.interval === expected.interval &&
        payload?.recurring?.interval_count === 1;

  return Boolean(
    payload &&
      typeof payload === "object" &&
      !Array.isArray(payload) &&
      payload.object === "price" &&
      payload.id === expected.id &&
      payload.livemode === false &&
      payload.active === true &&
      payload.type === expected.type &&
      payload.currency === "eur" &&
      payload.unit_amount === expected.unitAmount &&
      recurringMatches &&
      product?.object === "product" &&
      product.active === true &&
      product.livemode === false,
  );
}

export function classifyStripePriceResponseStatus(status) {
  if (status === 401 || status === 403) {
    return "stripe_catalog_auth_or_permission";
  }
  if (status === 404) return "stripe_catalog_missing";
  if (status === 429 || (status >= 500 && status <= 599)) {
    return "stripe_catalog_unavailable";
  }
  return "stripe_catalog_rejected";
}

async function fetchStripePrice(environment, expected, fetchImplementation) {
  const url = new URL(
    `https://api.stripe.com/v1/prices/${encodeURIComponent(expected.id)}`,
  );
  url.searchParams.append("expand[]", "product");

  let response;
  try {
    response = await fetchImplementation(url, {
      headers: {
        Authorization: `Bearer ${environment.STRIPE_SECRET_KEY}`,
      },
      signal: AbortSignal.timeout(12_000),
    });
  } catch {
    return "stripe_catalog_unavailable";
  }
  if (!response?.ok) {
    return classifyStripePriceResponseStatus(response?.status);
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    return "stripe_catalog_invalid";
  }
  return validateStripeTestPrice(payload, expected)
    ? null
    : "stripe_catalog_invalid";
}

export async function verifyStagingStripeCatalog(
  environment = {},
  { fetchImplementation = globalThis.fetch } = {},
) {
  const evaluation = evaluateStagingStripeCatalogEnvironment(environment);
  if (!evaluation.ok) {
    return Object.freeze({
      ok: false,
      error: "environment_invalid",
      priceCount: 0,
    });
  }
  if (typeof fetchImplementation !== "function") {
    return Object.freeze({
      ok: false,
      error: "stripe_catalog_unavailable",
      priceCount: 0,
    });
  }

  const results = await Promise.all(
    evaluation.prices.map((expected) =>
      fetchStripePrice(environment, expected, fetchImplementation),
    ),
  );
  const errorPriority = [
    "stripe_catalog_auth_or_permission",
    "stripe_catalog_missing",
    "stripe_catalog_invalid",
    "stripe_catalog_rejected",
    "stripe_catalog_unavailable",
  ];
  const error =
    errorPriority.find((candidate) => results.includes(candidate)) ?? null;

  return Object.freeze({
    ok: error === null,
    error,
    priceCount: error === null ? evaluation.prices.length : 0,
  });
}
