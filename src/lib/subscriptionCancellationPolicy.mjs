export function computeCancellationEffectiveAt({
  commercialOption,
  currentPeriodEnd,
  commitmentStartedAt,
  commitmentMonths = 0,
  now = new Date(),
}) {
  const periodEnd = new Date(currentPeriodEnd ?? now);
  if (Number.isNaN(periodEnd.getTime())) throw new Error("INVALID_PERIOD_END");

  if (commercialOption !== "starter_no_setup_commitment" || commitmentMonths !== 12) {
    return periodEnd.toISOString();
  }

  const start = new Date(commitmentStartedAt ?? now);
  if (Number.isNaN(start.getTime())) throw new Error("INVALID_COMMITMENT_START");
  const commitmentEnd = new Date(start);
  commitmentEnd.setUTCMonth(commitmentEnd.getUTCMonth() + 12);
  return new Date(Math.max(periodEnd.getTime(), commitmentEnd.getTime())).toISOString();
}

export function getCancellationState(workspace) {
  const effectiveAt = workspace?.cancellation_effective_at ?? null;
  const requestedAt = workspace?.cancellation_requested_at ?? null;
  const archiveMode = workspace?.billing_status === "cancelled" || workspace?.archive_mode === true;
  return {
    archiveMode,
    cancellationPending: Boolean(requestedAt && effectiveAt && !archiveMode),
    effectiveAt,
    requestedAt,
  };
}

export function canManageSubscription(workspace, userId) {
  return Boolean(workspace?.owner_user_id && workspace.owner_user_id === userId && workspace?.stripe_subscription_id);
}

export function isWorkspaceArchiveMode(workspace) {
  return Boolean(workspace && (workspace.archive_mode === true || workspace.billing_status === "cancelled" || workspace.billing_status === "expired"));
}
