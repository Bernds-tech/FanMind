export type AiTierId = "standard" | "plus" | "ultra";
export type AiTierPublicStatus = "Aktiv" | "Coming Soon";
export type AiTierBillingStatus = "included" | "not_configured" | "enabled";

export type AiTierConfig = Readonly<{
  id: AiTierId;
  name: string;
  monthlyAddOnCents: number;
  includedInBase: boolean;
  publicStatus: AiTierPublicStatus;
  billingStatus: AiTierBillingStatus;
  automaticallyBookable: boolean;
  addOnReferralDiscountEligible: boolean;
  automaticSendingEnabled: boolean;
  modelClass: string | null;
  monthlyRequestLimit: number | null;
  monthlyTokenLimit: number | null;
  contextMessageLimit: number | null;
  description: string;
  features: readonly string[];
}>;

export type AiTierReadinessBlocker =
  | "automatic_sending"
  | "referral_discount"
  | "base_price"
  | "public_status"
  | "billing_status"
  | "booking_flag"
  | "model_class"
  | "monthly_request_limit"
  | "monthly_token_limit"
  | "context_message_limit"
  | "stripe_price"
  | "workspace_contract";

export type AiTierReadiness = Readonly<{
  tierId: AiTierId;
  publicStatus: AiTierPublicStatus;
  ready: boolean;
  automaticallyBookable: boolean;
  blockers: readonly AiTierReadinessBlocker[];
}>;

export const AI_TIER_IDS: readonly AiTierId[];
export const AI_TIER_CONFIG: Readonly<Record<AiTierId, AiTierConfig>>;
export function getAiTierConfig(tierId: AiTierId): AiTierConfig;
export function formatAiTierPrice(tierOrId: AiTierConfig | AiTierId): string;
export function getAiTierTotalMonthlyCents(tierId: AiTierId, baseMonthlyFeeCents: number): number;
export type AiTierRuntimeReadiness = Readonly<{
  stripePriceConfigured?: boolean;
  workspaceContractConfirmed?: boolean;
}>;
export function isAiTierAutomaticallyBookable(
  tierId: AiTierId,
  runtime?: AiTierRuntimeReadiness,
): boolean;
export function evaluateAiTierReadiness(
  tierId: AiTierId,
  runtime?: AiTierRuntimeReadiness,
): AiTierReadiness;
export function assertAiTierPolicy(): true;
