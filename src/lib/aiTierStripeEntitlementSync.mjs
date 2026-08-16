import {
  decideAiTierStripeLifecycleEvent,
  getAiTierStripePriceAllowlistStatus,
  redactAiTierStripeLifecycleDecision,
} from "./aiTierStripeLifecycle.mjs";
import { buildSupabaseApiKeyHeaders } from "./supabase/apiKeyPolicy.mjs";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const TABLE = "workspace_ai_tier_entitlements";
const CURRENT_COLUMNS = [
  "workspace_id",
  "tier_id",
  "status",
  "source",
  "stripe_subscription_id",
  "stripe_subscription_item_id",
  "stripe_price_id",
  "effective_at",
  "expires_at",
  "last_stripe_event_id",
  "last_stripe_event_created_at",
].join(",");
const WRITE_RESPONSE_COLUMNS = [
  "workspace_id",
  "last_stripe_event_id",
  "last_stripe_event_created_at",
].join(",");

function result(status, reason = null) {
  return Object.freeze({ status, reason });
}

function record(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : null;
}

function normalizedBaseUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    const loopbackHost =
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      url.hostname === "[::1]";
    if (
      url.username ||
      url.password ||
      (url.protocol !== "https:" &&
        !(url.protocol === "http:" && loopbackHost))
    ) {
      return null;
    }
    url.pathname = url.pathname.replace(/\/$/u, "");
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/u, "");
  } catch {
    return null;
  }
}

function serviceConfiguration(environment) {
  const baseUrl = normalizedBaseUrl(environment?.NEXT_PUBLIC_SUPABASE_URL);
  const serviceKey =
    typeof environment?.SUPABASE_SERVICE_ROLE_KEY === "string"
      ? environment.SUPABASE_SERVICE_ROLE_KEY.trim()
      : "";
  return baseUrl && serviceKey ? { baseUrl, serviceKey } : null;
}

function tableUrl(baseUrl) {
  return new URL(`${baseUrl}/rest/v1/${TABLE}`);
}

function currentFromRow(row, workspaceId) {
  const value = record(row);
  if (!value || value.workspace_id !== workspaceId) return null;
  return {
    tierId: value.tier_id,
    status: value.status,
    source: value.source,
    stripeSubscriptionId: value.stripe_subscription_id,
    stripeSubscriptionItemId: value.stripe_subscription_item_id,
    stripePriceId: value.stripe_price_id,
    effectiveAt: value.effective_at,
    expiresAt: value.expires_at,
    lastStripeEventId: value.last_stripe_event_id,
    lastStripeEventCreatedAt: value.last_stripe_event_created_at,
  };
}

function mutationBody(workspaceId, mutation) {
  return {
    workspace_id: workspaceId,
    tier_id: mutation.tierId,
    status: mutation.status,
    source: mutation.source,
    stripe_subscription_id: mutation.stripeSubscriptionId,
    stripe_subscription_item_id: mutation.stripeSubscriptionItemId,
    stripe_price_id: mutation.stripePriceId,
    effective_at: mutation.effectiveAt,
    expires_at: mutation.expiresAt,
    last_stripe_event_id: mutation.lastStripeEventId,
    last_stripe_event_created_at: mutation.lastStripeEventCreatedAt,
  };
}

async function jsonRows(response) {
  const payload = await response.json().catch(() => null);
  return Array.isArray(payload) ? payload : null;
}

function writeConfirmed(rows, workspaceId, mutation) {
  const row = rows?.[0];
  return (
    rows?.length === 1 &&
    record(row)?.workspace_id === workspaceId &&
    row.last_stripe_event_id === mutation.lastStripeEventId &&
    row.last_stripe_event_created_at === mutation.lastStripeEventCreatedAt
  );
}

function lifecycleEnabled(environment) {
  return (
    environment?.FANMIND_AI_TIER_STRIPE_PERSISTENCE_ENABLED === "true" &&
    environment?.FANMIND_AI_TIER_WORKSPACE_CONTRACT_CONFIRMED === "true" &&
    getAiTierStripePriceAllowlistStatus(environment).ready
  );
}

export async function syncWorkspaceAiTierStripeEntitlement({
  workspaceId,
  event,
  environment = process.env,
  fetchImplementation = fetch,
} = {}) {
  // This deploy-before-migrate bridge is intentionally dormant unless its
  // dedicated persistence gate, the server-owned Workspace contract and both
  // distinct Price IDs are present. A normal Starter subscription therefore
  // keeps its existing semantics.
  if (!lifecycleEnabled(environment)) return result("disabled");
  if (
    typeof workspaceId !== "string" ||
    !UUID_PATTERN.test(workspaceId) ||
    typeof fetchImplementation !== "function"
  ) {
    return result("retry", "workspace_target");
  }

  const configuration = serviceConfiguration(environment);
  if (!configuration) return result("retry", "storage_configuration");
  const headers = buildSupabaseApiKeyHeaders(configuration.serviceKey);

  try {
    const readUrl = tableUrl(configuration.baseUrl);
    readUrl.searchParams.set("select", CURRENT_COLUMNS);
    readUrl.searchParams.set("workspace_id", `eq.${workspaceId}`);
    readUrl.searchParams.set("limit", "2");
    const readResponse = await fetchImplementation(readUrl, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    if (!readResponse.ok) return result("retry", "storage_read");
    const currentRows = await jsonRows(readResponse);
    if (!currentRows || currentRows.length > 1) {
      return result("retry", "storage_state");
    }
    const current =
      currentRows.length === 1
        ? currentFromRow(currentRows[0], workspaceId)
        : null;
    if (currentRows.length === 1 && !current) {
      return result("retry", "storage_state");
    }

    const decision = decideAiTierStripeLifecycleEvent({
      event,
      current,
      workspaceTargetVerified: true,
      environment,
    });
    const redacted = redactAiTierStripeLifecycleDecision(decision);
    if (decision.decision === "ignore") {
      return result("ignored", redacted.reason);
    }
    if (decision.decision !== "apply" || !decision.mutation) {
      return result("retry", redacted.reason);
    }

    const writeUrl = tableUrl(configuration.baseUrl);
    writeUrl.searchParams.set("select", WRITE_RESPONSE_COLUMNS);
    let method = "POST";
    if (current) {
      method = "PATCH";
      writeUrl.searchParams.set("workspace_id", `eq.${workspaceId}`);
      writeUrl.searchParams.set(
        "last_stripe_event_id",
        `eq.${current.lastStripeEventId}`,
      );
      writeUrl.searchParams.set(
        "last_stripe_event_created_at",
        `eq.${current.lastStripeEventCreatedAt}`,
      );
      writeUrl.searchParams.set(
        "stripe_subscription_id",
        `eq.${current.stripeSubscriptionId}`,
      );
    }

    // POST is deliberately not an upsert and PATCH compares the previously
    // read event boundary. Concurrent deliveries therefore cannot silently
    // replace a newer row; a conflict/zero-row result is retried by Stripe.
    const writeResponse = await fetchImplementation(writeUrl, {
      method,
      headers: {
        ...headers,
        Prefer: "return=representation",
      },
      body: JSON.stringify(mutationBody(workspaceId, decision.mutation)),
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    if (!writeResponse.ok) return result("retry", "storage_write");
    const writtenRows = await jsonRows(writeResponse);
    if (!writeConfirmed(writtenRows, workspaceId, decision.mutation)) {
      return result("retry", "storage_write");
    }
    return result("applied");
  } catch {
    return result("retry", "storage_unavailable");
  }
}
