import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  ADMIN_AI_USAGE_DAY_RANGES,
  aggregateAiUsageByModel,
  normalizeAdminAiUsageDays,
} from "../src/lib/aiUsageDashboardMetrics.mjs";

test("admin AI usage accepts only the documented quick ranges", () => {
  assert.deepEqual(ADMIN_AI_USAGE_DAY_RANGES, [1, 7, 30, 90]);
  for (const days of ADMIN_AI_USAGE_DAY_RANGES) {
    assert.equal(normalizeAdminAiUsageDays(String(days)), days);
  }
  assert.equal(normalizeAdminAiUsageDays(" 7 "), 7);
  assert.equal(normalizeAdminAiUsageDays("365"), 30);
  assert.equal(normalizeAdminAiUsageDays("-1"), 30);
  assert.equal(normalizeAdminAiUsageDays("invalid"), 30);
  assert.equal(normalizeAdminAiUsageDays(undefined), 30);
});

test("model summaries aggregate requests, costs, tokens, and errors deterministically", () => {
  assert.deepEqual(
    aggregateAiUsageByModel([
      {
        model: "gpt-a",
        estimated_cost_cents: 10,
        estimated_input_tokens: 100,
        estimated_output_tokens: 25,
        status: "ok",
      },
      {
        model: "gpt-b",
        estimated_cost_cents: 20,
        estimated_input_tokens: 80,
        estimated_output_tokens: 20,
        status: "error",
      },
      {
        model: " gpt-a ",
        estimated_cost_cents: 15,
        estimated_input_tokens: 50,
        estimated_output_tokens: 10,
        status: "error",
      },
    ]),
    [
      {
        model: "gpt-a",
        requests: 2,
        estimatedCostCents: 25,
        inputTokens: 150,
        outputTokens: 35,
        errorRequests: 1,
      },
      {
        model: "gpt-b",
        requests: 1,
        estimatedCostCents: 20,
        inputTokens: 80,
        outputTokens: 20,
        errorRequests: 1,
      },
    ],
  );
});

test("admin AI usage exposes quick views and model distribution without stale open claims", async () => {
  const [source, page, monitoring] = await Promise.all([
    readFile("src/lib/adminAiUsage.ts", "utf8"),
    readFile("src/app/admin/ai-usage/page.tsx", "utf8"),
    readFile("docs/AI_COST_MONITORING.md", "utf8"),
  ]);

  assert.match(source, /aggregateAiUsageByModel/u);
  assert.match(source, /byModel/u);
  assert.match(page, /ADMIN_AI_USAGE_DAY_RANGES/u);
  assert.match(page, /aria-current/u);
  assert.match(page, /Verbrauch pro Modell/u);
  assert.match(page, /Ø Kosten\/Anfrage/u);
  const openDisplaySection =
    monitoring.match(/Noch offen:\n\n(?<items>[\s\S]*?)\n\nDie Workspace-Nutzeransicht/u)
      ?.groups?.items ?? "";
  assert.doesNotMatch(openDisplaySection, /Tages-\/Wochen-Schnellansichten/u);
  assert.doesNotMatch(openDisplaySection, /Kosten relativ zur Kontaktanzahl/u);
  assert.doesNotMatch(openDisplaySection, /Modellverteilung/u);
});
