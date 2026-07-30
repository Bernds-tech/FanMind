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
