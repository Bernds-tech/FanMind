const GRACE_ELIGIBLE_BILLING_STATUSES = new Set([
  "past_due",
  "payment_failed",
  "suspended",
]);
const TERMINAL_BILLING_STATUSES = new Set([
  "cancelled",
  "expired",
  "refunded",
]);

const TEMPORARY_ACCESS_FLAG = "temporary_processing_access";
const TEMPORARY_ACCESS_EXPIRY_FLAG =
  "temporary_processing_access_expires_at";

function clean(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function timestamp(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function nowTimestamp(now) {
  if (now instanceof Date && Number.isFinite(now.getTime())) {
    return now.getTime();
  }
  return Date.now();
}

export function evaluateWorkspaceProcessingEntitlement(
  workspace,
  now = new Date(),
) {
  if (!workspace || typeof workspace !== "object") {
    return { allowed: false, reason: "workspace_missing" };
  }

  const accessMode = clean(workspace.workspace_access_mode);
  if (accessMode !== "active") {
    return {
      allowed: false,
      reason:
        accessMode === "archived_readonly"
          ? "workspace_archived"
          : "workspace_state_unknown",
    };
  }

  const nowMs = nowTimestamp(now);
  const effectiveEnd = timestamp(workspace.subscription_effective_end_at);
  if (Number.isNaN(effectiveEnd)) {
    return { allowed: false, reason: "contract_end_invalid" };
  }
  if (effectiveEnd !== null && effectiveEnd <= nowMs) {
    return { allowed: false, reason: "contract_ended" };
  }

  const billingStatus = clean(workspace.billing_status);
  if (TERMINAL_BILLING_STATUSES.has(billingStatus)) {
    return { allowed: false, reason: "billing_ended" };
  }

  const flags =
    workspace.test_access_flags &&
    typeof workspace.test_access_flags === "object" &&
    !Array.isArray(workspace.test_access_flags)
      ? workspace.test_access_flags
      : {};
  if (flags[TEMPORARY_ACCESS_FLAG] === true) {
    const temporaryExpiry = timestamp(flags[TEMPORARY_ACCESS_EXPIRY_FLAG]);
    if (temporaryExpiry === null || Number.isNaN(temporaryExpiry)) {
      return { allowed: false, reason: "temporary_access_invalid" };
    }
    if (temporaryExpiry <= nowMs) {
      return { allowed: false, reason: "temporary_access_expired" };
    }
    return { allowed: true, reason: "temporary_access" };
  }

  if (workspace.billing_manual_override === true) {
    return { allowed: true, reason: "manual_override" };
  }

  const graceUntil = timestamp(workspace.billing_grace_until);
  if (Number.isNaN(graceUntil)) {
    return { allowed: false, reason: "billing_grace_invalid" };
  }
  const graceActive = graceUntil !== null && graceUntil > nowMs;
  const suspended =
    billingStatus === "suspended" ||
    (typeof workspace.billing_suspended_at === "string" &&
      workspace.billing_suspended_at.trim().length > 0);

  if (
    GRACE_ELIGIBLE_BILLING_STATUSES.has(billingStatus) &&
    graceActive
  ) {
    return { allowed: true, reason: "billing_grace" };
  }
  if (suspended) {
    return { allowed: false, reason: "billing_suspended" };
  }
  if (billingStatus === "active") {
    return { allowed: true, reason: "active_billing" };
  }
  if (GRACE_ELIGIBLE_BILLING_STATUSES.has(billingStatus)) {
    return { allowed: false, reason: "billing_grace_expired" };
  }

  return { allowed: false, reason: "billing_ineligible" };
}
