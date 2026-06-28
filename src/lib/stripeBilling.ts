import crypto from "node:crypto";
import { getSupabaseRestUrl } from "@/lib/supabase/config";
import type { PlanId } from "@/config/plans";

export type CheckoutCommercialOption = "pilot_only" | "starter_paid_setup" | "starter_no_setup_commitment";

export type StripeConfigStatus = {
  hasSecretKey: boolean;
  hasWebhookSecret: boolean;
  hasPilotPrice: boolean;
  hasStarterSetupPrice: boolean;
  hasStarterMonthlyPrice: boolean;
  hasGrowthMonthlyPrice: boolean;
  hasAgencyMonthlyPrice: boolean;
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
  setupFeeCents: number;
  monthlyFeeCents: number;
  commitmentMonths: 0 | 12;
};

export function getStripeConfigStatus(): StripeConfigStatus {
  const hasSecretKey = Boolean(process.env.STRIPE_SECRET_KEY);
  const hasWebhookSecret = Boolean(process.env.STRIPE_WEBHOOK_SECRET);
  const hasPilotPrice = Boolean(process.env.STRIPE_PRICE_PILOT_SETUP);
  const hasStarterSetupPrice = Boolean(process.env.STRIPE_PRICE_STARTER_SETUP);
  const hasStarterMonthlyPrice = Boolean(process.env.STRIPE_PRICE_STARTER_MONTHLY);
  const hasGrowthMonthlyPrice = Boolean(process.env.STRIPE_PRICE_GROWTH_MONTHLY);
  const hasAgencyMonthlyPrice = Boolean(process.env.STRIPE_PRICE_AGENCY_MONTHLY);
  const growthAgencyBillingEnabled = process.env.FANMIND_ENABLE_GROWTH_AGENCY_BILLING === "true";
  const hasAppUrl = Boolean(getAppUrl());

  return {
    hasSecretKey,
    hasWebhookSecret,
    hasPilotPrice,
    hasStarterSetupPrice,
    hasStarterMonthlyPrice,
    hasGrowthMonthlyPrice,
    hasAgencyMonthlyPrice,
    growthAgencyBillingEnabled,
    hasAppUrl,
    readyForCheckout: hasSecretKey && hasAppUrl && hasPilotPrice && hasStarterSetupPrice && hasStarterMonthlyPrice,
    readyForWebhook: hasSecretKey && hasWebhookSecret,
  };
}

export function getAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
}

export function resolveCheckoutPlan(planId: unknown, commercialOption: unknown): CheckoutPlan | null {
  if (planId === "pilot" && commercialOption === "pilot_only") {
    const priceId = process.env.STRIPE_PRICE_PILOT_SETUP;
    return priceId ? { planId, commercialOption, mode: "payment", priceIds: [priceId], setupFeeCents: 99000, monthlyFeeCents: 0, commitmentMonths: 0 } : null;
  }

  if (planId === "starter" && commercialOption === "starter_paid_setup") {
    const setupPrice = process.env.STRIPE_PRICE_STARTER_SETUP;
    const monthlyPrice = process.env.STRIPE_PRICE_STARTER_MONTHLY;
    return setupPrice && monthlyPrice ? { planId, commercialOption, mode: "subscription", priceIds: [setupPrice, monthlyPrice], setupFeeCents: 99000, monthlyFeeCents: 31200, commitmentMonths: 0 } : null;
  }

  if (planId === "starter" && commercialOption === "starter_no_setup_commitment") {
    const monthlyPrice = process.env.STRIPE_PRICE_STARTER_MONTHLY;
    return monthlyPrice ? { planId, commercialOption, mode: "subscription", priceIds: [monthlyPrice], setupFeeCents: 0, monthlyFeeCents: 31200, commitmentMonths: 12 } : null;
  }

  return null;
}

export async function createStripeCheckoutSession(input: { plan: CheckoutPlan; userId: string; workspaceId: string; userEmail?: string }): Promise<{ url?: string; id?: string; error?: string }> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const appUrl = getAppUrl();
  if (!secretKey || !appUrl) return { error: "Zahlung ist noch nicht aktiv konfiguriert. Bitte FanMind kontaktieren." };

  const params = new URLSearchParams();
  params.set("mode", input.plan.mode);
  params.set("success_url", `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`);
  params.set("cancel_url", `${appUrl}/billing/cancel`);
  params.append("payment_method_types[]", "sepa_debit");
  if (input.userEmail) params.set("customer_email", input.userEmail);
  input.plan.priceIds.forEach((price, index) => {
    params.set(`line_items[${index}][price]`, price);
    params.set(`line_items[${index}][quantity]`, "1");
  });
  const metadata = { user_id: input.userId, workspace_id: input.workspaceId, plan_id: input.plan.planId, commercial_option: input.plan.commercialOption, setup_fee_cents: String(input.plan.setupFeeCents), monthly_fee_cents: String(input.plan.monthlyFeeCents), commitment_months: String(input.plan.commitmentMonths) };
  Object.entries(metadata).forEach(([key, value]) => params.set(`metadata[${key}]`, value));
  if (input.plan.mode === "subscription") Object.entries(metadata).forEach(([key, value]) => params.set(`subscription_data[metadata][${key}]`, value));

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", { method: "POST", headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/x-www-form-urlencoded" }, body: params });
  const json = await response.json().catch(() => ({})) as { id?: string; url?: string; error?: { message?: string } };
  if (!response.ok) return { error: json.error?.message ?? "Stripe Checkout konnte nicht gestartet werden." };
  return { id: json.id, url: json.url };
}

export function verifyStripeSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;
  const parts = Object.fromEntries(signatureHeader.split(",").map((part) => {
    const [key, value] = part.split("=", 2);
    return [key, value];
  }));
  if (!parts.t || !parts.v1) return false;
  const signedPayload = `${parts.t}.${rawBody}`;
  const expected = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1));
}

export async function updateWorkspaceBillingDefensively(workspaceId: string | undefined, fields: Record<string, string | number | boolean | null | undefined>): Promise<void> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!workspaceId || !serviceKey) return;
  const body = Object.fromEntries(Object.entries({ ...fields, billing_provider: "stripe", payment_collection_method: "sepa_direct_debit", billing_updated_at: new Date().toISOString() }).filter(([, value]) => value !== undefined));
  try {
    const manualGuard = fields.billing_status === "active" ? "&billing_status=not.eq.manual_suspended" : "";
    const response = await fetch(`${getSupabaseRestUrl("workspaces")}?id=eq.${encodeURIComponent(workspaceId)}${manualGuard}`, { method: "PATCH", headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify(body) });
    if (!response.ok) console.warn("Stripe billing update skipped", response.status);
  } catch (error) {
    console.warn("Stripe billing update skipped", error instanceof Error ? error.message : "unknown error");
  }
}
