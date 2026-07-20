import crypto from "node:crypto";
import { getSupabaseRestUrl } from "@/lib/supabase/config";
import type { PlanId } from "@/config/plans";

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

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  const json = (await response.json().catch(() => ({}))) as {
    id?: string;
    url?: string;
    error?: { message?: string };
  };
  if (!response.ok) {
    return {
      error: json.error?.message ?? "Stripe Checkout konnte nicht gestartet werden.",
    };
  }
  return { id: json.id, url: json.url };
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
): Promise<string | null> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return null;
  const lookups: Array<[string, string | undefined]> = [
    ["stripe_customer_id", references.customerId],
    ["stripe_subscription_id", references.subscriptionId],
    ["stripe_payment_intent_id", references.paymentIntentId],
  ];
  for (const [column, value] of lookups) {
    if (!value) continue;
    try {
      const url = `${getSupabaseRestUrl("workspaces")}?select=id&${column}=eq.${encodeURIComponent(value)}&limit=1`;
      const response = await fetch(url, {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      });
      if (!response.ok) {
        console.warn("Stripe workspace lookup skipped", column, response.status);
        continue;
      }
      const rows = (await response.json().catch(() => [])) as Array<{
        id?: string;
      }>;
      const id = rows[0]?.id;
      if (typeof id === "string" && id) return id;
    } catch (error) {
      console.warn(
        "Stripe workspace lookup skipped",
        column,
        error instanceof Error ? error.message : "unknown error",
      );
    }
  }
  return null;
}

export async function updateWorkspaceBillingDefensively(
  workspaceId: string | undefined,
  fields: Record<string, string | number | boolean | null | undefined>,
): Promise<void> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!workspaceId || !serviceKey) return;
  const body = Object.fromEntries(
    Object.entries({
      ...fields,
      billing_provider: "stripe",
      billing_updated_at: new Date().toISOString(),
    }).filter(([, value]) => value !== undefined),
  );
  try {
    const manualGuard =
      fields.billing_status && fields.billing_status !== "manual_suspended"
        ? "&billing_status=not.eq.manual_suspended"
        : "";
    const response = await fetch(
      `${getSupabaseRestUrl("workspaces")}?id=eq.${encodeURIComponent(workspaceId)}${manualGuard}`,
      {
        method: "PATCH",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(body),
      },
    );
    if (!response.ok) {
      console.warn("Stripe billing update skipped", response.status);
    }
  } catch (error) {
    console.warn(
      "Stripe billing update skipped",
      error instanceof Error ? error.message : "unknown error",
    );
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
    },
  );
  const json = (await response.json().catch(() => ({}))) as Record<string, unknown> & { error?: { message?: string } };
  if (!response.ok) return { error: json.error?.message ?? "Stripe-Subscription konnte nicht aktualisiert werden." };
  return { subscription: json };
}
