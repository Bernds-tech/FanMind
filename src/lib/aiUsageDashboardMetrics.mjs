export const ADMIN_AI_USAGE_DAY_RANGES = Object.freeze([1, 7, 30, 90]);

export function normalizeAdminAiUsageDays(value) {
  const normalized = typeof value === "string" ? value.trim() : String(value ?? "");
  if (!/^\d+$/u.test(normalized)) return 30;
  const days = Number(normalized);
  return ADMIN_AI_USAGE_DAY_RANGES.includes(days) ? days : 30;
}

function nonNegativeNumber(value) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function positiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function roundedRatio(numerator, denominator) {
  if (denominator <= 0) return null;
  return Number((numerator / denominator).toFixed(4));
}

export function aggregateAiUsageByModel(events) {
  if (!Array.isArray(events)) {
    throw new TypeError("events must be an array");
  }

  const models = new Map();
  for (const event of events) {
    const model =
      typeof event?.model === "string" && event.model.trim()
        ? event.model.trim()
        : "unbekannt";
    const summary = models.get(model) ?? {
      model,
      requests: 0,
      estimatedCostCents: 0,
      inputTokens: 0,
      outputTokens: 0,
      errorRequests: 0,
    };
    summary.requests += 1;
    summary.estimatedCostCents += nonNegativeNumber(event?.estimated_cost_cents);
    summary.inputTokens += nonNegativeNumber(event?.estimated_input_tokens);
    summary.outputTokens += nonNegativeNumber(event?.estimated_output_tokens);
    if (event?.status === "error") summary.errorRequests += 1;
    models.set(model, summary);
  }

  return [...models.values()].sort(
    (a, b) =>
      b.estimatedCostCents - a.estimatedCostCents ||
      b.requests - a.requests ||
      a.model.localeCompare(b.model),
  );
}

export function calculateAiBudgetIndicator(input) {
  const currentCostCents = nonNegativeNumber(input?.currentCostCents);
  const budgetCents = positiveNumber(input?.budgetCents);

  if (budgetCents === null) {
    return {
      configured: false,
      level: "unconfigured",
      currentCostCents,
      budgetCents: null,
      usageRatio: null,
      usagePercent: null,
      blocking: false,
    };
  }

  if (input?.truncated === true) {
    return {
      configured: true,
      level: "incomplete",
      currentCostCents,
      budgetCents,
      usageRatio: null,
      usagePercent: null,
      blocking: false,
    };
  }

  const usageRatio = currentCostCents / budgetCents;
  const level =
    usageRatio >= 1
      ? "attention"
      : usageRatio >= 0.8
        ? "warning"
        : usageRatio >= 0.5
          ? "observe"
          : "normal";

  return {
    configured: true,
    level,
    currentCostCents,
    budgetCents,
    usageRatio,
    usagePercent: Math.round(usageRatio * 100),
    blocking: false,
  };
}

export function calculateAiUsageSpikeIndicator(input) {
  const currentRequests = nonNegativeNumber(input?.currentRequests);
  const previousRequests = nonNegativeNumber(input?.previousRequests);
  const currentCostCents = nonNegativeNumber(input?.currentCostCents);
  const previousCostCents = nonNegativeNumber(input?.previousCostCents);
  const ratioThreshold = positiveNumber(input?.ratioThreshold) ?? 2;
  const minRequests = positiveNumber(input?.minRequests) ?? 10;
  const minCostCents = positiveNumber(input?.minCostCents) ?? 100;

  if (input?.currentTruncated === true || input?.previousTruncated === true) {
    return {
      level: "incomplete",
      currentRequests,
      previousRequests,
      currentCostCents,
      previousCostCents,
      requestRatio: null,
      costRatio: null,
      ratioThreshold,
      triggeredBy: [],
      blocking: false,
    };
  }

  const requestRatio = roundedRatio(currentRequests, previousRequests);
  const costRatio = roundedRatio(currentCostCents, previousCostCents);
  const hasBaseline = previousRequests > 0 || previousCostCents > 0;
  const hasMaterialCurrentUsage =
    currentRequests >= minRequests || currentCostCents >= minCostCents;

  if (!hasBaseline) {
    return {
      level: hasMaterialCurrentUsage ? "insufficient_basis" : "normal",
      currentRequests,
      previousRequests,
      currentCostCents,
      previousCostCents,
      requestRatio,
      costRatio,
      ratioThreshold,
      triggeredBy: [],
      blocking: false,
    };
  }

  const triggeredBy = [];
  if (
    requestRatio !== null &&
    currentRequests >= minRequests &&
    requestRatio >= ratioThreshold
  ) {
    triggeredBy.push("requests");
  }
  if (
    costRatio !== null &&
    currentCostCents >= minCostCents &&
    costRatio >= ratioThreshold
  ) {
    triggeredBy.push("cost");
  }

  return {
    level: triggeredBy.length ? "warning" : "normal",
    currentRequests,
    previousRequests,
    currentCostCents,
    previousCostCents,
    requestRatio,
    costRatio,
    ratioThreshold,
    triggeredBy,
    blocking: false,
  };
}
