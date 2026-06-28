# Stripe-Test-Checkliste für SEPA-Zahlungen

## Benötigte Stripe Webhook Events

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `payment_intent.processing`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `invoice.paid`
- `invoice.updated`
- `invoice.payment_failed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## Benötigte Sandbox-ENV

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PILOT_SETUP`
- `STRIPE_PRICE_STARTER_SETUP`
- `STRIPE_PRICE_STARTER_MONTHLY`
- `NEXT_PUBLIC_APP_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Erwarteter Testablauf

- Pilot/Setup läuft als einmalige Checkout-Zahlung mit SEPA-Lastschrift.
- Starter läuft als Subscription mit Setup-Fee und monatlicher Zahlung.
- Checkout-Sessions tragen die Workspace-ID in `client_reference_id` und Metadata.
- Pilot-Zahlungen tragen dieselbe Metadata zusätzlich am Payment Intent.
- Starter-Subscriptions tragen dieselbe Metadata an der Subscription.
- `payment_intent.processing` markiert einen Workspace nur als `pending_sepa_mandate`.
- `payment_intent.succeeded`, `checkout.session.async_payment_succeeded` und `invoice.paid` dürfen auf `active` setzen, aber keine `manual_suspended`-Sperre überschreiben.
- Fehlgeschlagene asynchrone SEPA-Zahlungen setzen `payment_failed` und dokumentieren Retry-/Grace-Signale.
- FanMind speichert keine IBANs oder Bankdaten; diese bleiben ausschließlich bei Stripe.
