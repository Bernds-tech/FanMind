export const CANCELLATION_STATUSES = ["active", "past_due", "payment_failed"];

function asDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function addMonthsIso(startIso, months) {
  const start = asDate(startIso) ?? new Date();
  const result = new Date(start.getTime());
  const day = result.getUTCDate();
  result.setUTCMonth(result.getUTCMonth() + months, 1);
  const maxDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, maxDay));
  return result.toISOString();
}

export function resolveSubscriptionCancellation(workspace, stripeSubscription = {}) {
  const option = workspace?.commercial_option;
  const currentPeriodEnd = asDate(stripeSubscription.current_period_end_iso ?? workspace?.billing_current_period_end_at ?? workspace?.billing_next_invoice_at);
  const created = asDate(stripeSubscription.created_iso ?? workspace?.billing_contract_started_at ?? workspace?.billing_last_payment_at ?? workspace?.billing_updated_at);
  const minimumEnd = option === "starter_no_setup_commitment" ? asDate(workspace?.billing_minimum_term_ends_at) ?? asDate(addMonthsIso(created?.toISOString(), 12)) : null;
  const effective = new Date(Math.max(currentPeriodEnd?.getTime() ?? 0, minimumEnd?.getTime() ?? 0, Date.now()));
  const requiresSchedule = Boolean(minimumEnd && minimumEnd.getTime() > (currentPeriodEnd?.getTime() ?? 0));
  return {
    canSelfService: workspace?.plan_id === "starter" && ["starter_paid_setup", "starter_no_setup_commitment"].includes(option) && CANCELLATION_STATUSES.includes(workspace?.billing_status) && Boolean(workspace?.stripe_subscription_id),
    currentPackage: option === "starter_no_setup_commitment" ? "Starter 12 Monate" : option === "starter_paid_setup" ? "Starter Flex" : "—",
    minimumTermEndsAt: minimumEnd?.toISOString() ?? null,
    nextBillingAt: currentPeriodEnd?.toISOString() ?? null,
    possibleCancellationAt: effective.toISOString(),
    effectiveEndAt: effective.toISOString(),
    stripeCancelAtPeriodEnd: !requiresSchedule,
    requiresCancelAtTimestamp: requiresSchedule,
  };
}

export function isWorkspaceArchivedAfterSubscriptionEnd(workspace, now = new Date()) {
  if (!workspace) return false;
  const end = asDate(workspace.subscription_effective_end_at);
  return workspace.billing_status === "cancelled" || workspace.billing_status === "expired" || Boolean(end && end.getTime() <= now.getTime());
}
