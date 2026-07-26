export const FIXED_DEMO_EMAIL = "sandra.m@fanmind.ch";

export const STRIPE_BILLING_ALLOWED = "allowed";
export const STRIPE_BILLING_BLOCKED = "blocked";
export const STRIPE_BILLING_RETRYABLE_ERROR = "retryable_error";
export const STRIPE_BILLING_UPDATED = "updated";
export const STRIPE_BILLING_ZERO_ROWS = "zero_rows";

export function stripeBillingWorkspaceDecision({
  workspace,
  ownerEmail,
  hasTemporaryDemoSession,
}) {
  if (
    !workspace ||
    typeof workspace.owner_user_id !== "string" ||
    !workspace.owner_user_id ||
    typeof ownerEmail !== "string" ||
    !ownerEmail.trim() ||
    typeof hasTemporaryDemoSession !== "boolean"
  ) {
    return STRIPE_BILLING_RETRYABLE_ERROR;
  }

  if (
    ownerEmail.trim().toLowerCase() === FIXED_DEMO_EMAIL ||
    hasTemporaryDemoSession
  ) {
    return STRIPE_BILLING_BLOCKED;
  }

  return STRIPE_BILLING_ALLOWED;
}

export function isStripeBillingWorkspaceEligible(input) {
  return stripeBillingWorkspaceDecision(input) === STRIPE_BILLING_ALLOWED;
}

export function stripeBillingPatchDecision({
  responseOk,
  bodyParsed,
  rows,
  workspaceId,
}) {
  if (!responseOk || !bodyParsed || !Array.isArray(rows)) {
    return STRIPE_BILLING_RETRYABLE_ERROR;
  }
  if (
    rows.length === 1 &&
    rows[0] &&
    typeof rows[0] === "object" &&
    rows[0].id === workspaceId
  ) {
    return STRIPE_BILLING_UPDATED;
  }
  if (rows.length === 0) return STRIPE_BILLING_ZERO_ROWS;
  return STRIPE_BILLING_RETRYABLE_ERROR;
}

export function stripeBillingManualSuspensionDecision({
  responseOk,
  bodyParsed,
  rows,
  workspaceId,
}) {
  if (!responseOk || !bodyParsed || !Array.isArray(rows)) {
    return STRIPE_BILLING_RETRYABLE_ERROR;
  }
  if (
    rows.length === 1 &&
    rows[0] &&
    typeof rows[0] === "object" &&
    rows[0].id === workspaceId &&
    rows[0].billing_status === "manual_suspended"
  ) {
    return STRIPE_BILLING_BLOCKED;
  }
  return STRIPE_BILLING_RETRYABLE_ERROR;
}
