import {
  AI_TIER_IDS,
  evaluateAiTierReadiness,
} from "../../src/config/aiTiers.mjs";

const ADD_ON_PRICE_ENV = Object.freeze({
  plus: "STRIPE_PRICE_AI_PLUS",
  ultra: "STRIPE_PRICE_AI_ULTRA",
});

function hasStripePrice(value) {
  return typeof value === "string" && /^price_[A-Za-z0-9_]+$/u.test(value);
}

function runtimeForTier(tierId) {
  const priceEnvName = ADD_ON_PRICE_ENV[tierId];
  return {
    stripePriceConfigured:
      typeof priceEnvName === "string" &&
      hasStripePrice(process.env[priceEnvName]),
    workspaceContractConfirmed:
      process.env.FANMIND_AI_TIER_WORKSPACE_CONTRACT_CONFIRMED === "true",
  };
}

function expectedReady(publicStatus) {
  return publicStatus === "Aktiv";
}

let contractPasses = true;

for (const tierId of AI_TIER_IDS) {
  const readiness = evaluateAiTierReadiness(tierId, runtimeForTier(tierId));
  const status = readiness.ready ? "READY" : "BLOCKED";
  const blockers =
    readiness.blockers.length === 0
      ? "none"
      : readiness.blockers.join(",");

  console.log(
    `AI_TIER_${tierId.toUpperCase()}=${status} blockers=${blockers}`,
  );

  if (readiness.ready !== expectedReady(readiness.publicStatus)) {
    contractPasses = false;
  }
}

if (!contractPasses) {
  console.error("AI_TIER_READINESS=FAIL");
  process.exitCode = 1;
} else {
  console.log("AI_TIER_READINESS=PASS");
}
