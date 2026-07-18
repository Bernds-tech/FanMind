import type { PlanId } from "@/config/plans";
import type { CommercialOption, ProductiveCommercialOption } from "@/lib/plans";
import { isDemoWorkspace } from "@/lib/demoMode";

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

export type PaymentCollectionMethod =
  | "none"
  | "manual_invoice"
  | "sepa_direct_debit"
  | "card";

export const PAYMENT_TERMS_VERSION = "2026-06-v1";

export function isPaidPlan(planId: PlanId): boolean {
  return planId === "starter";
}

export function requiresPaymentTermsAcceptance(
  planId: PlanId,
  commercialOption?: CommercialOption | ProductiveCommercialOption | string,
): boolean {
  return isPaidPlan(planId) || commercialOption === "internal_daily_test";
}

export function getInitialBillingStatus(
  planId: PlanId,
  commercialOption?: CommercialOption | ProductiveCommercialOption | string,
): BillingStatus {
  if (commercialOption === "internal_daily_test" || planId === "starter") {
    return "pending_payment_setup";
  }

  if (
    commercialOption === "growth_preview" ||
    commercialOption === "agency_preview" ||
    commercialOption === "pilot_only" ||
    planId === "pilot"
  ) {
    return "demo_free";
  }

  return "demo_free";
}

export function getPaymentCollectionMethod(
  planId: PlanId,
  commercialOption?: CommercialOption | ProductiveCommercialOption | string,
): PaymentCollectionMethod {
  if (commercialOption === "internal_daily_test") {
    return "card";
  }

  if (
    planId === "starter" ||
    commercialOption === "starter_paid_setup" ||
    commercialOption === "starter_no_setup_commitment"
  ) {
    return "sepa_direct_debit";
  }

  // Das frühere entgeltliche Pilot-/Setup-Paket ist nicht mehr buchbar.
  return "none";
}

export function getBillingProvider(): BillingProvider {
  return "stripe";
}

export const SUSPENDED_BILLING_STATUSES: BillingStatus[] = [
  "suspended",
  "manual_suspended",
];

export function isWorkspaceBillingSuspended(
  workspace: { billing_status?: string | null; name?: string | null } | null | undefined,
): boolean {
  if (!workspace) return false;
  if (isDemoWorkspace(workspace)) return false;
  return (
    workspace.billing_status === "suspended" ||
    workspace.billing_status === "manual_suspended"
  );
}

export function getBillingStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case "active":
      return "Aktiv";
    case "past_due":
      return "Überfällig";
    case "payment_failed":
      return "Zahlung fehlgeschlagen";
    case "suspended":
      return "Gesperrt";
    case "manual_suspended":
      return "Manuell gesperrt";
    case "cancelled":
      return "Gekündigt";
    case "expired":
      return "Abgelaufen";
    case "pending_payment_setup":
      return "Zahlung offen";
    case "pending_sepa_mandate":
      return "SEPA-Bestätigung offen";
    case "demo_free":
      return "Demo/Kostenlos";
    default:
      return "Unbekannt";
  }
}

export const CHECKOUT_ACTION_BILLING_STATUSES = new Set<string>([
  "pending_payment_setup",
  "pending_sepa_mandate",
  "past_due",
  "payment_failed",
  "suspended",
]);

export function shouldShowBillingCheckoutAction(
  workspace:
    | {
        plan_id?: string | null;
        commercial_option?: string | null;
        billing_status?: string | null;
        name?: string | null;
      }
    | null
    | undefined,
): boolean {
  if (!workspace) return false;
  if (isDemoWorkspace(workspace)) return false;

  const option = workspace.commercial_option;
  if (option === "pilot_only") return false;

  const isInternalDailyTest = option === "internal_daily_test";
  const isStarterOption =
    workspace.plan_id === "starter" &&
    (!option ||
      option === "starter_paid_setup" ||
      option === "starter_no_setup_commitment");

  if (!isInternalDailyTest && !isStarterOption) return false;
  if (
    workspace.billing_status === "active" ||
    workspace.billing_status === "cancelled" ||
    workspace.billing_status === "manual_suspended"
  ) {
    return false;
  }
  if (!workspace.billing_status) return true;
  return CHECKOUT_ACTION_BILLING_STATUSES.has(workspace.billing_status);
}

export function getBillingCheckoutActionLabel(
  status: string | null | undefined,
): string {
  if (
    status === "past_due" ||
    status === "payment_failed" ||
    status === "suspended"
  ) {
    return "Zahlung erneut versuchen";
  }
  return "Zahlung starten";
}
