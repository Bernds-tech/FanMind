function exactNonNegativeInteger(value) {
  return typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0
    ? value
    : null;
}

export function normalizeOpenAiResponseUsage(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const inputTokens = exactNonNegativeInteger(value.input_tokens);
  const outputTokens = exactNonNegativeInteger(value.output_tokens);
  const totalTokens = exactNonNegativeInteger(value.total_tokens);

  if (
    inputTokens === null ||
    outputTokens === null ||
    totalTokens === null ||
    totalTokens !== inputTokens + outputTokens
  ) {
    return null;
  }

  return {
    inputTokens,
    outputTokens,
    totalTokens,
  };
}
