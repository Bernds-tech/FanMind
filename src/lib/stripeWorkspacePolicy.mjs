export const FIXED_DEMO_EMAIL = "sandra.m@fanmind.ch";

export const STRIPE_BILLING_ALLOWED = "allowed";
export const STRIPE_BILLING_BLOCKED = "blocked";
export const STRIPE_BILLING_RETRYABLE_ERROR = "retryable_error";
export const STRIPE_BILLING_UPDATED = "updated";
export const STRIPE_BILLING_ZERO_ROWS = "zero_rows";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const STRIPE_CUSTOMER_PATTERN = /^cus_[A-Za-z0-9_]+$/u;
const STRIPE_SUBSCRIPTION_PATTERN = /^sub_[A-Za-z0-9_]+$/u;

export function resolveStripeWebhookWorkspaceCandidates({
  directCandidates,
  referenceResolution,
  allowDirectBootstrap = false,
}) {
  if (!Array.isArray(directCandidates)) {
    return { status: "retryable_error" };
  }
  const presentCandidates = directCandidates.filter(
    (candidate) => candidate !== null && candidate !== undefined,
  );
  if (
    presentCandidates.some(
      (candidate) =>
        typeof candidate !== "string" || !UUID_PATTERN.test(candidate),
    )
  ) {
    return { status: "retryable_error" };
  }

  const directWorkspaceIds = new Set(presentCandidates);
  if (directWorkspaceIds.size > 1) {
    return { status: "retryable_error" };
  }
  if (
    !referenceResolution ||
    !["found", "not_found", "retryable_error"].includes(
      referenceResolution.status,
    )
  ) {
    return { status: "retryable_error" };
  }
  if (referenceResolution.status === "retryable_error") {
    return { status: "retryable_error" };
  }

  const [directWorkspaceId] = directWorkspaceIds;
  if (
    directWorkspaceId &&
    referenceResolution.status === "found" &&
    referenceResolution.workspaceId !== directWorkspaceId
  ) {
    return { status: "retryable_error" };
  }
  if (directWorkspaceId) {
    if (
      referenceResolution.status === "not_found" &&
      allowDirectBootstrap !== true
    ) {
      return { status: "retryable_error" };
    }
    return { status: "found", workspaceId: directWorkspaceId };
  }
  return referenceResolution;
}

export function stripeSubscriptionWorkspaceBindingDecision({
  responseOk,
  bodyParsed,
  rows,
  workspaceId,
  customerId,
  subscriptionId,
}) {
  if (
    responseOk !== true ||
    bodyParsed !== true ||
    !Array.isArray(rows) ||
    typeof workspaceId !== "string" ||
    !UUID_PATTERN.test(workspaceId) ||
    typeof customerId !== "string" ||
    !STRIPE_CUSTOMER_PATTERN.test(customerId) ||
    typeof subscriptionId !== "string" ||
    !STRIPE_SUBSCRIPTION_PATTERN.test(subscriptionId)
  ) {
    return STRIPE_BILLING_RETRYABLE_ERROR;
  }

  const row = rows[0];
  return rows.length === 1 &&
    row &&
    typeof row === "object" &&
    row.id === workspaceId &&
    row.stripe_customer_id === customerId &&
    row.stripe_subscription_id === subscriptionId
    ? STRIPE_BILLING_ALLOWED
    : STRIPE_BILLING_RETRYABLE_ERROR;
}

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
