import assert from "node:assert/strict";
import test from "node:test";

import {
  shouldShowDemoInvoicesForWorkspace,
  mapStripeInvoiceToCustomerInvoice,
  listPolicyInvoiceResult,
} from "../src/lib/customerBillingPolicy.mjs";
import fs from "node:fs";

test("real account without Stripe customer ID shows an empty invoice state", () => {
  const workspace = {
    billing_status: "demo_free",
    name: "Bernd Real Test Workspace",
    commercial_option: "starter_paid_setup",
    stripe_customer_id: null,
  };

  assert.equal(shouldShowDemoInvoicesForWorkspace(workspace), false);
  assert.deepEqual(listPolicyInvoiceResult({ workspace, stripeInvoices: null }), []);
});

test("public demo workspace keeps demo invoices", () => {
  const workspace = {
    billing_status: "demo_free",
    name: "FanMind Demo Workspace",
    commercial_option: "pilot_only",
    stripe_customer_id: null,
  };

  const invoices = listPolicyInvoiceResult({ workspace, stripeInvoices: null });
  assert.equal(shouldShowDemoInvoicesForWorkspace(workspace), true);
  assert.ok(invoices.length >= 2);
  assert.ok(invoices.every((invoice) => invoice.isDemo === true));
  assert.ok(invoices.some((invoice) => invoice.number === "Demo-Rechnung 0001"));
});

test("real Stripe customer without invoices shows an empty invoice state", () => {
  const workspace = {
    billing_status: "active",
    name: "Bernd Real Test Workspace",
    commercial_option: "starter_paid_setup",
    stripe_customer_id: "cus_real_without_invoices",
  };

  assert.deepEqual(listPolicyInvoiceResult({ workspace, stripeInvoices: [] }), []);
});

test("real Stripe customer with invoices only shows Stripe invoice data", () => {
  const workspace = {
    billing_status: "active",
    name: "Bernd Real Test Workspace",
    commercial_option: "starter_paid_setup",
    stripe_customer_id: "cus_real_with_invoice",
  };
  const invoices = listPolicyInvoiceResult({
    workspace,
    stripeInvoices: [
      {
        id: "in_123",
        number: "FAN-2026-0001",
        created: 1784563200,
        status: "paid",
        currency: "eur",
        amount_due: 31200,
        amount_paid: 31200,
        subtotal: 31200,
        total_tax_amounts: [{ amount: 0 }],
        total: 31200,
        hosted_invoice_url: "https://pay.stripe.com/invoice/test",
        invoice_pdf: "https://pay.stripe.com/invoice/test/pdf",
      },
    ],
  });

  assert.equal(invoices.length, 1);
  assert.deepEqual(invoices[0], mapStripeInvoiceToCustomerInvoice({
    id: "in_123",
    number: "FAN-2026-0001",
    created: 1784563200,
    status: "paid",
    currency: "eur",
    amount_due: 31200,
    amount_paid: 31200,
    subtotal: 31200,
    total_tax_amounts: [{ amount: 0 }],
    total: 31200,
    hosted_invoice_url: "https://pay.stripe.com/invoice/test",
    invoice_pdf: "https://pay.stripe.com/invoice/test/pdf",
  }));
  assert.equal(invoices[0].isDemo, undefined);
});

test("internal 1 EUR daily Stripe subscription plan remains available", () => {
  const stripeBillingSource = fs.readFileSync("src/lib/stripeBilling.ts", "utf8");

  assert.match(stripeBillingSource, /commercialOption === "internal_daily_test"/);
  assert.match(stripeBillingSource, /process\.env\.STRIPE_PRICE_INTERNAL_DAILY_TEST/);
  assert.match(stripeBillingSource, /planId: "pilot"/);
  assert.match(stripeBillingSource, /mode: "subscription"/);
  assert.match(stripeBillingSource, /paymentMethodTypes: \["card"\]/);
  assert.match(stripeBillingSource, /paymentCollectionMethod: "card"/);
});
