export function isInternalDailyTestStripeReady(config) {
  return config?.hasSecretKey === true
    && config?.hasWebhookSecret === true
    && config?.hasAppUrl === true
    && config?.hasInternalDailyTestPrice === true
    && config?.readyForWebhook === true;
}

export function isInternalDailyTestAdmissionReady(input) {
  return input?.windowEnabled === true
    && input?.workspaceProvisioningReady === true
    && isInternalDailyTestStripeReady(input?.stripeConfig);
}
