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

export const AI_TIER_IDS: readonly AiTierId[];
export const AI_TIER_CONFIG: Readonly<Record<AiTierId, AiTierConfig>>;
export function getAiTierConfig(tierId: AiTierId): AiTierConfig;
export function formatAiTierPrice(tierOrId: AiTierConfig | AiTierId): string;
export function getAiTierTotalMonthlyCents(tierId: AiTierId, baseMonthlyFeeCents: number): number;
export function isAiTierAutomaticallyBookable(tierId: AiTierId): boolean;
export function assertAiTierPolicy(): true;
