import type { PlanId } from "@/config/plans";
import type { CommercialOption, ProductiveCommercialOption } from "@/lib/plans";

export type BillingStatus =
  | "demo_free"
  | "pending_payment_setup"
  | "pending_sepa_mandate"
  | "active"
  | "past_due"
  | "payment_failed"
  | "cancelled"
  | "expired";

export type BillingProvider = "manual" | "stripe";

export type PaymentCollectionMethod = "none" | "manual_invoice" | "sepa_direct_debit";

export const PAYMENT_TERMS_VERSION = "2026-06-v1";

export function isPaidPlan(planId: PlanId): boolean {
  return planId === "pilot" || planId === "starter";
}

export function requiresPaymentTermsAcceptance(planId: PlanId): boolean {
  return isPaidPlan(planId);
}

export function getInitialBillingStatus(
  planId: PlanId,
  commercialOption?: CommercialOption | ProductiveCommercialOption | string,
): BillingStatus {
  if (planId === "pilot" || planId === "starter") {
    return "pending_payment_setup";
  }

  if (commercialOption === "growth_preview" || commercialOption === "agency_preview") {
    return "demo_free";
  }

  return "demo_free";
}

export function getPaymentCollectionMethod(
  planId: PlanId,
  commercialOption?: CommercialOption | ProductiveCommercialOption | string,
): PaymentCollectionMethod {
  if (planId === "pilot" || planId === "starter" || commercialOption === "pilot_only" || commercialOption === "starter_paid_setup" || commercialOption === "starter_no_setup_commitment") {
    return "sepa_direct_debit";
  }

  return "none";
}

export function getBillingProvider(): BillingProvider {
  return "stripe";
}
