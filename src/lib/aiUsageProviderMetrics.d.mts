export type NormalizedOpenAiResponseUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export function normalizeOpenAiResponseUsage(
  value: unknown,
): NormalizedOpenAiResponseUsage | null;
