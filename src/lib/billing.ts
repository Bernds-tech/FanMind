import type { PlanId } from "@/config/plans";
import type { CommercialOption, ProductiveCommercialOption } from "@/lib/plans";

export type BillingStatus =
  | "demo_free"
  | "pending_payment_setup"
  | "pending_sepa_mandate"
  | "active"
  | "past_due"
  | "payment_failed"
  | "suspended"
  | "manual_suspended"
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


export const SUSPENDED_BILLING_STATUSES: BillingStatus[] = ["suspended", "manual_suspended"];

export function isWorkspaceBillingSuspended(workspace: { billing_status?: string | null; name?: string | null } | null | undefined): boolean {
  if (!workspace) return false;
  if (workspace.name === "Temporary FanMind Demo") return false;
  return workspace.billing_status === "suspended" || workspace.billing_status === "manual_suspended";
}

export function getBillingStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case "active": return "Aktiv";
    case "past_due": return "Überfällig";
    case "payment_failed": return "Zahlung fehlgeschlagen";
    case "suspended": return "Gesperrt";
    case "manual_suspended": return "Manuell gesperrt";
    case "cancelled": return "Gekündigt";
    case "expired": return "Abgelaufen";
    case "pending_payment_setup": return "Zahlung offen";
    case "pending_sepa_mandate": return "SEPA-Bestätigung offen";
    case "demo_free": return "Demo/Kostenlos";
    default: return "Unbekannt";
  }
}
