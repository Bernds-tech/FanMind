import type { AiTierStripeLifecycleReason } from "./aiTierStripeLifecycle.mjs";

export type AiTierStripeEntitlementSyncReason =
  | AiTierStripeLifecycleReason
  | "storage_configuration"
  | "storage_read"
  | "storage_state"
  | "storage_write"
  | "storage_unavailable";

export type AiTierStripeEntitlementSyncResult = Readonly<{
  status: "disabled" | "ignored" | "applied" | "retry";
  reason: AiTierStripeEntitlementSyncReason | null;
}>;

export function syncWorkspaceAiTierStripeEntitlement(input?: Readonly<{
  workspaceId?: unknown;
  event?: unknown;
  environment?: Readonly<Record<string, string | undefined>>;
  fetchImplementation?: typeof fetch;
}>): Promise<AiTierStripeEntitlementSyncResult>;
