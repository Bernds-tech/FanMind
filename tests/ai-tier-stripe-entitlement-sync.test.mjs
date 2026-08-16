import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  syncWorkspaceAiTierStripeEntitlement,
} from "../src/lib/aiTierStripeEntitlementSync.mjs";

const workspaceId = "11111111-1111-4111-8111-111111111111";
const environment = {
  NEXT_PUBLIC_SUPABASE_URL: "https://synthetic.supabase.invalid",
  SUPABASE_SERVICE_ROLE_KEY: "sb_secret_DO_NOT_PRINT",
  FANMIND_AI_TIER_STRIPE_PERSISTENCE_ENABLED: "true",
  FANMIND_AI_TIER_WORKSPACE_CONTRACT_CONFIRMED: "true",
  STRIPE_PRICE_AI_PLUS: "price_plus_DO_NOT_PRINT",
  STRIPE_PRICE_AI_ULTRA: "price_ultra_DO_NOT_PRINT",
};

function event({
  id = "evt_current_DO_NOT_PRINT",
  created = 1_753_056_000,
  priceId = environment.STRIPE_PRICE_AI_PLUS,
  items,
} = {}) {
  return {
    id,
    created,
    type: "customer.subscription.updated",
    data: {
      object: {
        id: "sub_current_DO_NOT_PRINT",
        status: "active",
        cancel_at_period_end: false,
        items: {
          has_more: false,
          data: items ?? [
            {
              id: "si_current_DO_NOT_PRINT",
              current_period_start: 1_751_328_000,
              current_period_end: 1_754_006_400,
              price: { id: priceId },
            },
          ],
        },
      },
    },
  };
}

function row(overrides = {}) {
  return {
    workspace_id: workspaceId,
    tier_id: "plus",
    status: "active",
    source: "stripe",
    stripe_subscription_id: "sub_current_DO_NOT_PRINT",
    stripe_subscription_item_id: "si_current_DO_NOT_PRINT",
    stripe_price_id: environment.STRIPE_PRICE_AI_PLUS,
    effective_at: "2025-07-01T00:00:00.000Z",
    expires_at: null,
    last_stripe_event_id: "evt_previous_DO_NOT_PRINT",
    last_stripe_event_created_at: 1_753_055_999,
    ...overrides,
  };
}

function response(payload, ok = true) {
  return {
    ok,
    async json() {
      return payload;
    },
  };
}

test("the lifecycle bridge stays dormant until every persistence gate is configured", async () => {
  for (const missing of [
    "FANMIND_AI_TIER_STRIPE_PERSISTENCE_ENABLED",
    "FANMIND_AI_TIER_WORKSPACE_CONTRACT_CONFIRMED",
    "STRIPE_PRICE_AI_PLUS",
    "STRIPE_PRICE_AI_ULTRA",
  ]) {
    let requests = 0;
    const disabledEnvironment = { ...environment };
    delete disabledEnvironment[missing];
    const result = await syncWorkspaceAiTierStripeEntitlement({
      workspaceId,
      event: event(),
      environment: disabledEnvironment,
      fetchImplementation: async () => {
        requests += 1;
        throw new Error("must not fetch");
      },
    });

    assert.deepEqual(result, { status: "disabled", reason: null });
    assert.equal(requests, 0);
  }
});

test("the service-role bridge rejects cleartext remote URLs and URL credentials", async () => {
  for (const nextPublicSupabaseUrl of [
    "http://synthetic.supabase.invalid",
    "https://user:password@synthetic.supabase.invalid",
  ]) {
    let requests = 0;
    const result = await syncWorkspaceAiTierStripeEntitlement({
      workspaceId,
      event: event(),
      environment: {
        ...environment,
        NEXT_PUBLIC_SUPABASE_URL: nextPublicSupabaseUrl,
      },
      fetchImplementation: async () => {
        requests += 1;
        throw new Error("must not fetch");
      },
    });

    assert.deepEqual(result, {
      status: "retry",
      reason: "storage_configuration",
    });
    assert.equal(requests, 0);
  }
});

test("loopback HTTP remains available for isolated local Supabase", async () => {
  let requests = 0;
  const result = await syncWorkspaceAiTierStripeEntitlement({
    workspaceId,
    event: event({ priceId: "price_starter_DO_NOT_PRINT" }),
    environment: {
      ...environment,
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    },
    fetchImplementation: async () => {
      requests += 1;
      return response([]);
    },
  });

  assert.deepEqual(result, {
    status: "ignored",
    reason: "unrelated_price",
  });
  assert.equal(requests, 1);
});

test("a Starter-only subscription remains a read-only no-op", async () => {
  const requests = [];
  const result = await syncWorkspaceAiTierStripeEntitlement({
    workspaceId,
    event: event({ priceId: "price_starter_DO_NOT_PRINT" }),
    environment,
    fetchImplementation: async (url, options) => {
      requests.push({ url: String(url), options });
      return response([]);
    },
  });

  assert.deepEqual(result, {
    status: "ignored",
    reason: "unrelated_price",
  });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].options.method, undefined);
  assert.match(requests[0].url, /limit=2/u);
  assert.doesNotMatch(JSON.stringify(result), /DO_NOT_PRINT/u);
});

test("a verified paid item is inserted once without upsert semantics", async () => {
  const requests = [];
  const result = await syncWorkspaceAiTierStripeEntitlement({
    workspaceId,
    event: event(),
    environment,
    fetchImplementation: async (url, options) => {
      requests.push({ url: String(url), options });
      if (requests.length === 1) return response([]);
      const body = JSON.parse(options.body);
      return response([
        {
          workspace_id: body.workspace_id,
          last_stripe_event_id: body.last_stripe_event_id,
          last_stripe_event_created_at:
            body.last_stripe_event_created_at,
        },
      ]);
    },
  });

  assert.deepEqual(result, { status: "applied", reason: null });
  assert.equal(requests.length, 2);
  assert.equal(requests[1].options.method, "POST");
  assert.doesNotMatch(requests[1].url, /on_conflict/u);
  const body = JSON.parse(requests[1].options.body);
  assert.equal(body.tier_id, "plus");
  assert.equal(body.status, "active");
  assert.equal(body.workspace_id, workspaceId);
});

test("paid-item removal uses an optimistic event-boundary PATCH and persists cancellation", async () => {
  const requests = [];
  const removedEvent = event({
    id: "evt_removed_DO_NOT_PRINT",
    created: 1_753_056_001,
    items: [
      {
        id: "si_starter_DO_NOT_PRINT",
        current_period_start: 1_751_328_000,
        current_period_end: 1_754_006_400,
        price: { id: "price_starter_DO_NOT_PRINT" },
      },
    ],
  });
  const result = await syncWorkspaceAiTierStripeEntitlement({
    workspaceId,
    event: removedEvent,
    environment,
    fetchImplementation: async (url, options) => {
      requests.push({ url: String(url), options });
      if (requests.length === 1) return response([row()]);
      const body = JSON.parse(options.body);
      return response([
        {
          workspace_id: body.workspace_id,
          last_stripe_event_id: body.last_stripe_event_id,
          last_stripe_event_created_at:
            body.last_stripe_event_created_at,
        },
      ]);
    },
  });

  assert.deepEqual(result, { status: "applied", reason: null });
  assert.equal(requests[1].options.method, "PATCH");
  assert.match(
    requests[1].url,
    /last_stripe_event_id=eq\.evt_previous_DO_NOT_PRINT/u,
  );
  assert.match(
    requests[1].url,
    /last_stripe_event_created_at=eq\.1753055999/u,
  );
  const body = JSON.parse(requests[1].options.body);
  assert.equal(body.status, "canceled");
  assert.equal(body.stripe_subscription_item_id, "si_current_DO_NOT_PRINT");
  assert.equal(body.last_stripe_event_id, "evt_removed_DO_NOT_PRINT");
});

test("a concurrent zero-row update retries instead of overwriting a newer event", async () => {
  let requests = 0;
  const result = await syncWorkspaceAiTierStripeEntitlement({
    workspaceId,
    event: event(),
    environment,
    fetchImplementation: async () => {
      requests += 1;
      return requests === 1 ? response([row()]) : response([]);
    },
  });

  assert.deepEqual(result, { status: "retry", reason: "storage_write" });
  assert.equal(requests, 2);
});

test("ambiguous or unavailable storage never produces a mutation", async () => {
  for (const [payload, ok, reason] of [
    [[row(), row()], true, "storage_state"],
    [{ error: "synthetic" }, true, "storage_state"],
    [[], false, "storage_read"],
  ]) {
    let requests = 0;
    const result = await syncWorkspaceAiTierStripeEntitlement({
      workspaceId,
      event: event(),
      environment,
      fetchImplementation: async () => {
        requests += 1;
        return response(payload, ok);
      },
    });
    assert.deepEqual(result, { status: "retry", reason });
    assert.equal(requests, 1);
  }
});

test("the verified Workspace webhook path invokes the lifecycle bridge and retries failed persistence", async () => {
  const route = await readFile(
    "src/app/api/stripe/webhook/route.ts",
    "utf8",
  );
  const billingUpdate = route.indexOf(
    "await updateWorkspaceBillingDefensively(",
  );
  const lifecycleSync = route.indexOf(
    "await syncWorkspaceAiTierStripeEntitlement(",
  );
  const referralSync = route.indexOf(
    "await syncReferralAutomationForWorkspace(",
  );

  assert.ok(billingUpdate >= 0);
  assert.ok(lifecycleSync > billingUpdate);
  assert.ok(referralSync > lifecycleSync);
  assert.match(
    route,
    /AI_TIER_STRIPE_EVENT_TYPES\.includes\(input\.eventType \?\? ""\)[\s\S]*workspaceId,[\s\S]*event: input\.event[\s\S]*aiTierSync\.status === "retry"[\s\S]*throw new StripeWebhookRetryableError\(\)/u,
  );
});
