import crypto from "node:crypto";
import {
  getSupabaseAuthUrl,
  getSupabaseRestUrl,
} from "@/lib/supabase/config";
import type { PlanId } from "@/config/plans";
import {
  isMissingWorkspaceExpandColumn,
  withoutWorkspaceExpandColumns,
} from "@/lib/workspaceProvisioning";
import {
  STRIPE_BILLING_ALLOWED,
  STRIPE_BILLING_BLOCKED,
  STRIPE_BILLING_RETRYABLE_ERROR,
  STRIPE_BILLING_UPDATED,
  STRIPE_BILLING_ZERO_ROWS,
  stripeBillingManualSuspensionDecision,
  stripeBillingPatchDecision,
  stripeBillingWorkspaceDecision,
  type StripeBillingUpdateDecision,
  type StripeBillingWorkspaceDecision,
} from "@/lib/stripeWorkspacePolicy.mjs";

export type CheckoutCommercialOption =
  | "pilot_only"
  | "starter_paid_setup"
  | "starter_no_setup_commitment"
  | "internal_daily_test";

export type TaxMode = "small_business" | "stripe_tax";

export const SMALL_BUSINESS_INVOICE_NOTE =
  "Umsatzsteuerfrei aufgrund Kleinunternehmerregelung gemäß § 6 Abs. 1 Z 27 UStG.";

export type StripeConfigStatus = {
  taxMode: TaxMode;
  stripeTaxEnabled: boolean;
  taxModeLabel: string;
  invoiceNote: string | null;
  hasSecretKey: boolean;
  hasWebhookSecret: boolean;
  hasPilotPrice: boolean;
  hasStarterSetupPrice: boolean;
  hasStarterMonthlyPrice: boolean;
  hasGrowthMonthlyPrice: boolean;
  hasAgencyMonthlyPrice: boolean;
  hasInternalDailyTestPrice: boolean;
  growthAgencyBillingEnabled: boolean;
  hasAppUrl: boolean;
  readyForCheckout: boolean;
  readyForWebhook: boolean;
};

export type CheckoutPlan = {
  planId: Extract<PlanId, "pilot" | "starter">;
  commercialOption: CheckoutCommercialOption;
  mode: "payment" | "subscription";
  priceIds: string[];
  paymentMethodTypes?: string[];
  setupFeeCents: number;
  monthlyFeeCents: number;
  commitmentMonths: 0 | 12;
  paymentCollectionMethod: "sepa_direct_debit" | "card";
};

export type StripeWorkspaceReferences = {
  customerId?: string;
  subscriptionId?: string;
  paymentIntentId?: string;
};

export type StripeWorkspaceResolution =
  | { status: "found"; workspaceId: string }
  | { status: "not_found" }
  | { status: "retryable_error" };

export function getTaxMode(): TaxMode {
  return process.env.FANMIND_TAX_MODE === "stripe_tax"
    ? "stripe_tax"
    : "small_business";
}

export function getTaxModeLabel(mode: TaxMode = getTaxMode()): string {
  return mode === "stripe_tax"
    ? "Stripe Tax"
    : "Kleinunternehmer / keine USt ausgewiesen";
}

export function getStripeConfigStatus(): StripeConfigStatus {
  const taxMode = getTaxMode();
  const hasSecretKey = Boolean(process.env.STRIPE_SECRET_KEY);
  const hasWebhookSecret = Boolean(process.env.STRIPE_WEBHOOK_SECRET);
  const hasPilotPrice = Boolean(process.env.STRIPE_PRICE_PILOT_SETUP);
  const hasStarterSetupPrice = Boolean(process.env.STRIPE_PRICE_STARTER_SETUP);
  const hasStarterMonthlyPrice = Boolean(process.env.STRIPE_PRICE_STARTER_MONTHLY);
  const hasGrowthMonthlyPrice = Boolean(process.env.STRIPE_PRICE_GROWTH_MONTHLY);
  const hasAgencyMonthlyPrice = Boolean(process.env.STRIPE_PRICE_AGENCY_MONTHLY);
  const hasInternalDailyTestPrice = Boolean(
    process.env.STRIPE_PRICE_INTERNAL_DAILY_TEST,
  );
  const growthAgencyBillingEnabled =
    process.env.FANMIND_ENABLE_GROWTH_AGENCY_BILLING === "true";
  const hasAppUrl = Boolean(getAppUrl());

  return {
    taxMode,
    stripeTaxEnabled: taxMode === "stripe_tax",
    taxModeLabel: getTaxModeLabel(taxMode),
    invoiceNote:
      taxMode === "small_business" ? SMALL_BUSINESS_INVOICE_NOTE : null,
    hasSecretKey,
    hasWebhookSecret,
    hasPilotPrice,
    hasStarterSetupPrice,
    hasStarterMonthlyPrice,
    hasGrowthMonthlyPrice,
    hasAgencyMonthlyPrice,
    hasInternalDailyTestPrice,
    growthAgencyBillingEnabled,
    hasAppUrl,
    // Das frühere Pilot-/Setup-Produkt ist nicht mehr Teil der öffentlichen
    // Checkout-Bereitschaft. Aktiv sind nur die beiden Starter-Varianten.
    readyForCheckout:
      hasSecretKey &&
      hasAppUrl &&
      hasStarterSetupPrice &&
      hasStarterMonthlyPrice,
    readyForWebhook: hasSecretKey && hasWebhookSecret,
  };
}

export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    ""
  ).replace(/\/$/, "");
}

export function getCheckoutPaymentMethodTypes(): string[] {
  const types = ["card"];
  if (process.env.FANMIND_ENABLE_SEPA_CHECKOUT === "true") {
    types.push("sepa_debit");
  }
  return types;
}

export function resolveCheckoutPlan(
  planId: unknown,
  commercialOption: unknown,
): CheckoutPlan | null {
  // Legacy-Workspaces mit dem früheren entgeltlichen Pilot-Paket dürfen keinen
  // neuen Checkout mehr erhalten. Kostenlose Demo und interne Tests bleiben getrennt.
  if (planId === "pilot" && commercialOption === "pilot_only") return null;

  if (planId === "starter" && commercialOption === "starter_paid_setup") {
    const setupPrice = process.env.STRIPE_PRICE_STARTER_SETUP;
    const monthlyPrice = process.env.STRIPE_PRICE_STARTER_MONTHLY;
    return setupPrice && monthlyPrice
      ? {
          planId,
          commercialOption,
          mode: "subscription",
          priceIds: [setupPrice, monthlyPrice],
          setupFeeCents: 99000,
          monthlyFeeCents: 31200,
          commitmentMonths: 0,
          paymentCollectionMethod: "card",
        }
      : null;
  }

  if (
    planId === "starter" &&
    commercialOption === "starter_no_setup_commitment"
  ) {
    const monthlyPrice = process.env.STRIPE_PRICE_STARTER_MONTHLY;
    return monthlyPrice
      ? {
          planId,
          commercialOption,
          mode: "subscription",
          priceIds: [monthlyPrice],
          setupFeeCents: 0,
          monthlyFeeCents: 31200,
          commitmentMonths: 12,
          paymentCollectionMethod: "card",
        }
      : null;
  }

  if (commercialOption === "internal_daily_test") {
    const dailyPrice = process.env.STRIPE_PRICE_INTERNAL_DAILY_TEST;
    return dailyPrice
      ? {
          planId: "pilot",
          commercialOption,
          mode: "subscription",
          priceIds: [dailyPrice],
          // The daily internal beta records `card`; never offer SEPA here and
          // then persist a payment method that was not actually selected.
          paymentMethodTypes: ["card"],
          setupFeeCents: 0,
          monthlyFeeCents: 0,
          commitmentMonths: 0,
          paymentCollectionMethod: "card",
        }
      : null;
  }

  return null;
}

export async function createStripeCheckoutSession(input: {
  plan: CheckoutPlan;
  userId: string;
  workspaceId: string;
  userEmail?: string;
}): Promise<{ url?: string; id?: string; error?: string }> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const appUrl = getAppUrl();
  if (!secretKey || !appUrl) {
    return {
      error:
        "Zahlung ist noch nicht aktiv konfiguriert. Bitte FanMind kontaktieren.",
    };
  }

  const params = new URLSearchParams();
  params.set("mode", input.plan.mode);
  params.set(
    "success_url",
    `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
  );
  params.set("cancel_url", `${appUrl}/billing/cancel`);
  (input.plan.paymentMethodTypes ?? getCheckoutPaymentMethodTypes()).forEach(
    (type) => params.append("payment_method_types[]", type),
  );
  if (input.workspaceId) {
    params.set("client_reference_id", input.workspaceId);
  }
  if (input.userEmail) params.set("customer_email", input.userEmail);
  params.set("billing_address_collection", "required");
  params.set("tax_id_collection[enabled]", "true");
  const taxMode = getTaxMode();
  if (taxMode === "stripe_tax") {
    params.set("automatic_tax[enabled]", "true");
  } else {
    params.set("custom_text[submit][message]", SMALL_BUSINESS_INVOICE_NOTE);
    if (input.plan.mode === "payment") {
      params.set("invoice_creation[enabled]", "true");
      params.set(
        "invoice_creation[invoice_data][footer]",
        SMALL_BUSINESS_INVOICE_NOTE,
      );
    }
    if (input.plan.mode === "subscription") {
      params.set("subscription_data[description]", SMALL_BUSINESS_INVOICE_NOTE);
    }
  }
  input.plan.priceIds.forEach((price, index) => {
    params.set(`line_items[${index}][price]`, price);
    params.set(`line_items[${index}][quantity]`, "1");
  });
  const metadata = {
    user_id: input.userId,
    workspace_id: input.workspaceId,
    plan_id: input.plan.planId,
    commercial_option: input.plan.commercialOption,
    setup_fee_cents: String(input.plan.setupFeeCents),
    monthly_fee_cents: String(input.plan.monthlyFeeCents),
    commitment_months: String(input.plan.commitmentMonths),
    internal_live_test:
      input.plan.commercialOption === "internal_daily_test" ? "true" : "false",
  };
  Object.entries(metadata).forEach(([key, value]) =>
    params.set(`metadata[${key}]`, value),
  );
  if (input.plan.mode === "payment") {
    Object.entries(metadata).forEach(([key, value]) =>
      params.set(`payment_intent_data[metadata][${key}]`, value),
    );
  }
  if (input.plan.mode === "subscription") {
    Object.entries(metadata).forEach(([key, value]) =>
      params.set(`subscription_data[metadata][${key}]`, value),
    );
  }

  try {
    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
      signal: AbortSignal.timeout(12000),
    });
    const json = (await response.json().catch(() => ({}))) as {
      id?: string;
      url?: string;
    };
    if (!response.ok || !json.id || !json.url) {
      return { error: "Stripe Checkout konnte nicht gestartet werden." };
    }
    return { id: json.id, url: json.url };
  } catch {
    return { error: "Stripe Checkout konnte nicht gestartet werden." };
  }
}

export async function expireStripeCheckoutSession(sessionId: unknown): Promise<boolean> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const normalizedId = typeof sessionId === "string" ? sessionId.trim() : "";
  if (!secretKey || !/^cs_(?:test|live)_[A-Za-z0-9]+$/.test(normalizedId)) return false;
  const sessionUrl = `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(normalizedId)}`;
  const response = await fetch(
    `${sessionUrl}/expire`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${secretKey}` },
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    },
  ).catch(() => null);
  if (response?.ok === true) return true;

  // Stripe expiration is irreversible. If it succeeded but our following
  // local workspace update failed, a retry must reconcile the already-expired
  // session instead of remaining permanently stuck on the POST error.
  const statusResponse = await fetch(sessionUrl, {
    method: "GET",
    headers: { Authorization: `Bearer ${secretKey}` },
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  }).catch(() => null);
  if (!statusResponse?.ok) return false;
  const statusPayload = (await statusResponse.json().catch(() => null)) as {
    status?: unknown;
  } | null;
  return statusPayload?.status === "expired";
}

export function verifyStripeSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, value] = part.split("=", 2);
      return [key, value];
    }),
  );
  if (!parts.t || !parts.v1) return false;
  const signedPayload = `${parts.t}.${rawBody}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1));
}

export async function findWorkspaceIdByStripeReferences(
  references: StripeWorkspaceReferences,
): Promise<StripeWorkspaceResolution> {
  const lookups = (
    [
      ["stripe_customer_id", references.customerId],
      ["stripe_subscription_id", references.subscriptionId],
      ["stripe_payment_intent_id", references.paymentIntentId],
    ] as Array<[string, string | undefined]>
  ).filter((entry): entry is [string, string] => Boolean(entry[1]));
  if (lookups.length === 0) return { status: "not_found" };

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return { status: "retryable_error" };

  const matchedWorkspaceIds = new Set<string>();
  for (const [column, value] of lookups) {
    try {
      const url = `${getSupabaseRestUrl("workspaces")}?select=id&${column}=eq.${encodeURIComponent(value)}&limit=2`;
      const response = await fetch(url, {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
      });
      if (!response.ok) {
        console.warn(
          "Stripe workspace lookup unavailable",
          column,
          response.status,
        );
        return { status: "retryable_error" };
      }
      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        return { status: "retryable_error" };
      }
      if (!Array.isArray(payload)) return { status: "retryable_error" };
      if (payload.length === 0) continue;
      if (payload.length !== 1) return { status: "retryable_error" };
      const id = (payload[0] as { id?: unknown } | undefined)?.id;
      if (typeof id !== "string" || !id) {
        return { status: "retryable_error" };
      }
      matchedWorkspaceIds.add(id);
      if (matchedWorkspaceIds.size > 1) {
        return { status: "retryable_error" };
      }
    } catch {
      console.warn(
        "Stripe workspace lookup unavailable",
        column,
        "request_failed",
      );
      return { status: "retryable_error" };
    }
  }
  const [workspaceId] = matchedWorkspaceIds;
  if (matchedWorkspaceIds.size === 1 && workspaceId) {
    return { status: "found", workspaceId };
  }
  return { status: "not_found" };
}

type StripeBillingWorkspaceRow = {
  id?: string;
  owner_user_id?: string | null;
};

async function isStripeBillingTargetAllowed(
  workspaceId: string,
  serviceKey: string,
): Promise<StripeBillingWorkspaceDecision> {
  try {
    const serviceHeaders = {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    };
    const workspaceUrl = new URL(getSupabaseRestUrl("workspaces"));
    workspaceUrl.searchParams.set("select", "id,owner_user_id");
    workspaceUrl.searchParams.set("id", `eq.${workspaceId}`);
    workspaceUrl.searchParams.set("limit", "1");
    const workspaceResponse = await fetch(workspaceUrl, {
      headers: serviceHeaders,
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    if (!workspaceResponse.ok) {
      console.warn(
        "Stripe billing workspace guard unavailable",
        workspaceResponse.status,
      );
      return STRIPE_BILLING_RETRYABLE_ERROR;
    }
    let workspaceRows: StripeBillingWorkspaceRow[];
    try {
      const payload = await workspaceResponse.json();
      if (!Array.isArray(payload)) return STRIPE_BILLING_RETRYABLE_ERROR;
      workspaceRows = payload as StripeBillingWorkspaceRow[];
    } catch {
      return STRIPE_BILLING_RETRYABLE_ERROR;
    }
    const workspace = workspaceRows[0];
    if (
      workspaceRows.length !== 1 ||
      !workspace ||
      workspace.id !== workspaceId ||
      typeof workspace.owner_user_id !== "string" ||
      !workspace.owner_user_id
    ) {
      return STRIPE_BILLING_RETRYABLE_ERROR;
    }

    const sessionUrl = new URL(getSupabaseRestUrl("demo_start_sessions"));
    sessionUrl.searchParams.set("select", "id");
    sessionUrl.searchParams.set("workspace_id", `eq.${workspaceId}`);
    sessionUrl.searchParams.set("limit", "1");
    const sessionResponse = await fetch(sessionUrl, {
      headers: serviceHeaders,
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    if (!sessionResponse.ok) {
      console.warn(
        "Stripe billing demo-session guard unavailable",
        sessionResponse.status,
      );
      return STRIPE_BILLING_RETRYABLE_ERROR;
    }
    let sessionRows: Array<{ id?: string }>;
    try {
      const payload = await sessionResponse.json();
      if (!Array.isArray(payload)) return STRIPE_BILLING_RETRYABLE_ERROR;
      sessionRows = payload as Array<{ id?: string }>;
    } catch {
      return STRIPE_BILLING_RETRYABLE_ERROR;
    }

    const ownerResponse = await fetch(
      getSupabaseAuthUrl(
        `/admin/users/${encodeURIComponent(workspace.owner_user_id)}`,
      ),
      {
        headers: serviceHeaders,
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
      },
    );
    if (!ownerResponse.ok) {
      console.warn(
        "Stripe billing owner guard unavailable",
        ownerResponse.status,
      );
      return STRIPE_BILLING_RETRYABLE_ERROR;
    }
    let ownerPayload:
      | {
          user?: { id?: string; email?: string | null };
          id?: string;
          email?: string | null;
        }
      | null;
    try {
      ownerPayload = (await ownerResponse.json()) as typeof ownerPayload;
    } catch {
      return STRIPE_BILLING_RETRYABLE_ERROR;
    }
    const owner = ownerPayload?.user ?? ownerPayload;
    if (
      owner?.id !== workspace.owner_user_id ||
      typeof owner.email !== "string" ||
      !owner.email.trim()
    ) {
      return STRIPE_BILLING_RETRYABLE_ERROR;
    }

    return stripeBillingWorkspaceDecision({
      workspace,
      ownerEmail: owner.email,
      hasTemporaryDemoSession: sessionRows.length > 0,
    });
  } catch {
    console.warn(
      "Stripe billing workspace guard unavailable",
      "request_failed",
    );
    return STRIPE_BILLING_RETRYABLE_ERROR;
  }
}

async function verifyManualSuspendedBillingState(
  workspaceId: string,
  serviceKey: string,
): Promise<StripeBillingUpdateDecision> {
  try {
    const statusUrl = new URL(getSupabaseRestUrl("workspaces"));
    statusUrl.searchParams.set("select", "id,billing_status");
    statusUrl.searchParams.set("id", `eq.${workspaceId}`);
    statusUrl.searchParams.set("limit", "1");
    const response = await fetch(statusUrl, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    let rows: unknown = [];
    let bodyParsed = true;
    try {
      rows = await response.json();
    } catch {
      bodyParsed = false;
    }
    return stripeBillingManualSuspensionDecision({
      responseOk: response.ok,
      bodyParsed,
      rows,
      workspaceId,
    });
  } catch {
    console.warn(
      "Stripe billing manual-suspension check unavailable",
      "request_failed",
    );
    return STRIPE_BILLING_RETRYABLE_ERROR;
  }
}

export async function updateWorkspaceBillingDefensively(
  workspaceId: string | undefined,
  fields: Record<string, string | number | boolean | null | undefined>,
): Promise<StripeBillingUpdateDecision> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!workspaceId || !serviceKey) return STRIPE_BILLING_RETRYABLE_ERROR;
  const targetDecision = await isStripeBillingTargetAllowed(
    workspaceId,
    serviceKey,
  );
  if (targetDecision === STRIPE_BILLING_BLOCKED) {
    console.warn("Stripe billing update blocked by workspace policy");
    return STRIPE_BILLING_BLOCKED;
  }
  if (targetDecision !== STRIPE_BILLING_ALLOWED) {
    console.warn("Stripe billing update guard unavailable");
    return STRIPE_BILLING_RETRYABLE_ERROR;
  }
  const body = Object.fromEntries(
    Object.entries({
      ...fields,
      billing_provider: "stripe",
      billing_updated_at: new Date().toISOString(),
    }).filter(([, value]) => value !== undefined),
  );
  try {
    const manualGuardApplied =
      typeof fields.billing_status === "string" &&
      fields.billing_status !== "manual_suspended";
    const updateUrl = new URL(getSupabaseRestUrl("workspaces"));
    updateUrl.searchParams.set("id", `eq.${workspaceId}`);
    updateUrl.searchParams.set("select", "id");
    if (manualGuardApplied) {
      updateUrl.searchParams.set(
        "billing_status",
        "not.eq.manual_suspended",
      );
    }
    const patch = async (patchBody: Record<string, unknown>) => {
      const response = await fetch(updateUrl, {
        method: "PATCH",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(patchBody),
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
      });
      let responseRows: unknown = [];
      let bodyParsed = true;
      try {
        responseRows = await response.json();
      } catch {
        bodyParsed = false;
      }
      return { response, responseRows, bodyParsed };
    };
    let patchResult = await patch(body);
    const errorMessage =
      patchResult.bodyParsed &&
      patchResult.responseRows &&
      typeof patchResult.responseRows === "object" &&
      "message" in patchResult.responseRows &&
      typeof patchResult.responseRows.message === "string"
        ? patchResult.responseRows.message
        : "";
    if (
      !patchResult.response.ok &&
      isMissingWorkspaceExpandColumn(new Error(errorMessage))
    ) {
      // Deploy-before-migrate bridge: PostgREST rejects the complete PATCH
      // atomically when Step A columns are not yet in its schema cache. Retry
      // once with only the already-deployed billing columns so Stripe state is
      // still persisted during the compatibility window.
      patchResult = await patch(withoutWorkspaceExpandColumns(body));
    }
    const updateDecision = stripeBillingPatchDecision({
      responseOk: patchResult.response.ok,
      bodyParsed: patchResult.bodyParsed,
      rows: patchResult.responseRows,
      workspaceId,
    });
    if (updateDecision === STRIPE_BILLING_ZERO_ROWS) {
      const zeroRowDecision = manualGuardApplied
        ? await verifyManualSuspendedBillingState(workspaceId, serviceKey)
        : STRIPE_BILLING_RETRYABLE_ERROR;
      console.warn(
        zeroRowDecision === STRIPE_BILLING_BLOCKED
          ? "Stripe billing update blocked by verified manual suspension"
          : "Stripe billing zero-row update needs retry",
      );
      return zeroRowDecision;
    }
    if (updateDecision !== STRIPE_BILLING_UPDATED) {
      console.warn(
        "Stripe billing update unavailable",
        patchResult.response.status,
      );
    }
    return updateDecision;
  } catch {
    console.warn(
      "Stripe billing update unavailable",
      "request_failed",
    );
    return STRIPE_BILLING_RETRYABLE_ERROR;
  }
}

export async function updateStripeSubscriptionCancellation(input: {
  subscriptionId: string;
  cancelAtPeriodEnd: boolean;
  cancelAt?: string | null;
  workspaceId: string;
  action: "request" | "revoke";
}): Promise<{ error?: string; subscription?: Record<string, unknown> }> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return { error: "Stripe ist serverseitig noch nicht konfiguriert." };

  const params = new URLSearchParams();
  params.set("cancel_at_period_end", input.cancelAtPeriodEnd ? "true" : "false");
  if (input.action === "request" && input.cancelAt) {
    params.set("cancel_at", String(Math.floor(Date.parse(input.cancelAt) / 1000)));
  }
  if (input.action === "revoke") {
    params.set("cancel_at", "");
  }
  params.set("metadata[workspace_id]", input.workspaceId);
  params.set("metadata[fanmind_cancellation_action]", input.action);

  try {
    const response = await fetch(
      `https://api.stripe.com/v1/subscriptions/${encodeURIComponent(input.subscriptionId)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
      },
    );
    const json = (await response.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    if (!response.ok) {
      return { error: "Stripe-Subscription konnte nicht aktualisiert werden." };
    }
    return { subscription: json };
  } catch {
    return { error: "Stripe-Subscription konnte nicht aktualisiert werden." };
  }
}
