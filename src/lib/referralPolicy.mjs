export const REFERRAL_DISCOUNT_STEP_PERCENT = 5;
export const REFERRAL_MAX_ACTIVE_COUNT = 20;
export const REFERRAL_GROWTH_WINDOW_CAP = 2000;

function finiteInteger(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.trunc(numeric);
}

export function normalizeReferralCount(value) {
  return Math.max(0, finiteInteger(value));
}

export function clampReferralDiscountPercent(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(Math.round(numeric), 100));
}

export function calculateReferralPercent(
  activeReferralCount,
  overrideDiscountPercent = null,
) {
  const normalizedActiveCount = normalizeReferralCount(activeReferralCount);
  const billableActiveReferralCount = Math.min(
    normalizedActiveCount,
    REFERRAL_MAX_ACTIVE_COUNT,
  );
  const calculatedPercent =
    billableActiveReferralCount * REFERRAL_DISCOUNT_STEP_PERCENT;
  const discountPercent =
    overrideDiscountPercent == null
      ? clampReferralDiscountPercent(calculatedPercent)
      : clampReferralDiscountPercent(overrideDiscountPercent);

  return {
    activeReferralCount: normalizedActiveCount,
    billableActiveReferralCount,
    discountPercent,
  };
}

export function calculateReferralMonthlyAmounts(
  monthlyFeeCents,
  activeReferralCount,
  overrideDiscountPercent = null,
) {
  const monthlyFeeCentsBeforeDiscount = Math.max(
    0,
    finiteInteger(monthlyFeeCents),
  );
  const referral = calculateReferralPercent(
    activeReferralCount,
    overrideDiscountPercent,
  );
  const monthlyDiscountCents = Math.min(
    monthlyFeeCentsBeforeDiscount,
    Math.round(
      (monthlyFeeCentsBeforeDiscount * referral.discountPercent) / 100,
    ),
  );

  return {
    ...referral,
    monthlyFeeCentsBeforeDiscount,
    monthlyDiscountCents,
    monthlyFeeCentsAfterDiscount:
      monthlyFeeCentsBeforeDiscount - monthlyDiscountCents,
  };
}

export function isReferralGrowthWindowOpen(
  status,
  activePaidWorkspaceCount,
  activePaidWorkspaceCap = REFERRAL_GROWTH_WINDOW_CAP,
) {
  const normalizedStatus = String(status ?? "").trim().toLowerCase();
  const count = normalizeReferralCount(activePaidWorkspaceCount);
  const cap = Math.max(1, normalizeReferralCount(activePaidWorkspaceCap));

  return ["open", "reopened"].includes(normalizedStatus) && count < cap;
}

export function evaluateReferralWorkspaceEligibility(workspace) {
  if (!workspace) {
    return {
      eligible: false,
      reason:
        "Workspace konnte für das Empfehlungsprogramm nicht geprüft werden.",
    };
  }

  const billingStatus = String(workspace.billing_status ?? "")
    .trim()
    .toLowerCase();
  const commercialOption = String(workspace.commercial_option ?? "")
    .trim()
    .toLowerCase();
  const name = String(workspace.name ?? "");
  const isDemo =
    billingStatus === "demo_free" ||
    /demo/i.test(name) ||
    commercialOption === "internal_daily_test";

  if (isDemo) {
    return {
      eligible: false,
      reason:
        "Demo- und interne Test-Workspaces nehmen nicht am Empfehlungsprogramm teil.",
    };
  }

  const setupFeeCents = Math.max(0, finiteInteger(workspace.setup_fee_cents));
  const monthlyFeeCents = Math.max(
    0,
    finiteInteger(workspace.monthly_fee_cents),
  );
  if (setupFeeCents <= 0 && monthlyFeeCents <= 0) {
    return {
      eligible: false,
      reason:
        "Für diesen Workspace ist noch kein zahlungspflichtiges Paket hinterlegt.",
    };
  }

  if (billingStatus !== "active") {
    return {
      eligible: false,
      reason:
        "Der Workspace wird nach erfolgreicher Zahlung für Empfehlungen freigeschaltet.",
    };
  }

  return { eligible: true, reason: null };
}
