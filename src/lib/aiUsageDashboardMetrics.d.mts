export const ADMIN_AI_USAGE_DAY_RANGES: readonly [1, 7, 30, 90];

export type AiUsageModelEvent = {
  model?: string | null;
  estimated_cost_cents?: number | null;
  estimated_input_tokens?: number | null;
  estimated_output_tokens?: number | null;
  status?: string | null;
};

export type AiUsageModelSummary = {
  model: string;
  requests: number;
  estimatedCostCents: number;
  inputTokens: number;
  outputTokens: number;
  errorRequests: number;
};

export function normalizeAdminAiUsageDays(value: unknown): number;
export function aggregateAiUsageByModel(
  events: AiUsageModelEvent[],
): AiUsageModelSummary[];
