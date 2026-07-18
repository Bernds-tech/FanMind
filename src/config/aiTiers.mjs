export const AI_TIER_IDS = Object.freeze(["standard", "plus", "ultra"]);

function freezeTier(tier) {
  return Object.freeze({
    ...tier,
    features: Object.freeze([...tier.features]),
  });
}

export const AI_TIER_CONFIG = Object.freeze({
  standard: freezeTier({
    id: "standard",
    name: "KI Standard",
    monthlyAddOnCents: 0,
    includedInBase: true,
    publicStatus: "Aktiv",
    billingStatus: "included",
    automaticallyBookable: false,
    addOnReferralDiscountEligible: false,
    automaticSendingEnabled: false,
    modelClass: null,
    monthlyRequestLimit: null,
    monthlyTokenLimit: null,
    contextMessageLimit: null,
    description:
      "Im Starter-Basispaket enthaltene KI für Antwortvorschläge, Kontaktwissen und Follow-ups.",
    features: [
      "im Basispaket enthalten",
      "Antwortvorschläge",
      "Kontaktwissen & Follow-ups",
      "manuelle Prüfung vor dem Versand",
    ],
  }),
  plus: freezeTier({
    id: "plus",
    name: "KI Plus",
    monthlyAddOnCents: 10000,
    includedInBase: false,
    publicStatus: "Coming Soon",
    billingStatus: "not_configured",
    automaticallyBookable: false,
    addOnReferralDiscountEligible: false,
    automaticSendingEnabled: false,
    modelClass: null,
    monthlyRequestLimit: null,
    monthlyTokenLimit: null,
    contextMessageLimit: null,
    description:
      "Kostenpflichtige Erweiterung mit leistungsstärkerer KI, mehr Nutzung und größerem Gesprächskontext.",
    features: [
      "leistungsstärkere Modellklasse nach Freigabe",
      "höheres KI-Kontingent nach Freigabe",
      "größerer Gesprächskontext nach Freigabe",
      "weiterhin manuelle Prüfung",
    ],
  }),
  ultra: freezeTier({
    id: "ultra",
    name: "KI Ultra",
    monthlyAddOnCents: 20000,
    includedInBase: false,
    publicStatus: "Coming Soon",
    billingStatus: "not_configured",
    automaticallyBookable: false,
    addOnReferralDiscountEligible: false,
    automaticSendingEnabled: false,
    modelClass: null,
    monthlyRequestLimit: null,
    monthlyTokenLimit: null,
    contextMessageLimit: null,
    description:
      "Premium-Erweiterung mit der stärksten freigegebenen KI, den höchsten Kontingenten und erweitertem Funktionsumfang.",
    features: [
      "stärkste freigegebene Modellklasse nach Freigabe",
      "höchstes KI-Kontingent nach Freigabe",
      "größter Gesprächskontext nach Freigabe",
      "keine automatische Sendung",
    ],
  }),
});

export function getAiTierConfig(tierId) {
  const tier = AI_TIER_CONFIG[tierId];
  if (!tier) throw new Error(`Unknown AI tier: ${String(tierId)}`);
  return tier;
}

export function formatAiTierPrice(tierOrId) {
  const tier = typeof tierOrId === "string" ? getAiTierConfig(tierOrId) : tierOrId;
  if (tier.includedInBase) return "im Basispaket enthalten";
  return `+${tier.monthlyAddOnCents / 100} €/Monat`;
}

export function getAiTierTotalMonthlyCents(tierId, baseMonthlyFeeCents) {
  if (!Number.isInteger(baseMonthlyFeeCents) || baseMonthlyFeeCents < 0) {
    throw new Error("baseMonthlyFeeCents must be a non-negative integer");
  }
  return baseMonthlyFeeCents + getAiTierConfig(tierId).monthlyAddOnCents;
}

export function isAiTierAutomaticallyBookable(tierId) {
  const tier = getAiTierConfig(tierId);
  if (tier.includedInBase) return false;
  return Boolean(
    tier.automaticallyBookable &&
      tier.billingStatus === "enabled" &&
      tier.modelClass &&
      Number.isInteger(tier.monthlyRequestLimit) &&
      Number.isInteger(tier.monthlyTokenLimit) &&
      Number.isInteger(tier.contextMessageLimit),
  );
}

export function assertAiTierPolicy() {
  const standard = getAiTierConfig("standard");
  const plus = getAiTierConfig("plus");
  const ultra = getAiTierConfig("ultra");

  if (!standard.includedInBase || standard.monthlyAddOnCents !== 0) {
    throw new Error("KI Standard must remain included in the base package");
  }
  if (plus.monthlyAddOnCents !== 10000 || ultra.monthlyAddOnCents !== 20000) {
    throw new Error("KI Plus/Ultra prices do not match the approved commercial truth");
  }
  for (const tier of Object.values(AI_TIER_CONFIG)) {
    if (tier.automaticSendingEnabled) {
      throw new Error(`${tier.name} must not enable automatic sending`);
    }
    if (tier.addOnReferralDiscountEligible) {
      throw new Error(`${tier.name} add-on must not be referral-discount eligible`);
    }
  }
  return true;
}

assertAiTierPolicy();
