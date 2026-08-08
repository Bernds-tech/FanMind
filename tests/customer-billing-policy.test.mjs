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

test("a user-editable demo-like workspace name never grants demo invoice behavior", () => {
  const workspace = {
    billing_status: "active",
    name: "FanMind Demo Workspace",
    commercial_option: "starter_paid_setup",
    stripe_customer_id: null,
  };

  assert.equal(shouldShowDemoInvoicesForWorkspace(workspace), false);
  assert.deepEqual(
    listPolicyInvoiceResult({ workspace, stripeInvoices: null }),
    [],
  );
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
  const billingStartSource = fs.readFileSync("src/app/billing/start/page.tsx", "utf8");

  assert.match(stripeBillingSource, /commercialOption === "internal_daily_test"/);
  assert.match(stripeBillingSource, /process\.env\.STRIPE_PRICE_INTERNAL_DAILY_TEST/);
  assert.match(stripeBillingSource, /planId: "pilot"/);
  assert.match(stripeBillingSource, /mode: "subscription"/);
  assert.match(stripeBillingSource, /if \(commercialOption === "internal_daily_test"\)[\s\S]*?paymentMethodTypes: \["card"\]/u);
  assert.match(stripeBillingSource, /commercialOption,[\s\S]*paymentCollectionMethod: "card"/u);
  assert.match(billingStartSource, /workspace\?\.commercial_option === "internal_daily_test"/u);
  assert.match(
    billingStartSource,
    /isCardOnlyDailyTestCheckout[\s\S]*\? "Kartenzahlung im nächsten Schritt"[\s\S]*: "Kartenzahlung im nächsten Schritt · SEPA optional, wenn freigeschaltet"/u,
  );
  assert.equal(
    billingStartSource.match(/<dd>\{checkoutPaymentMethodText\}<\/dd>/gu)?.length,
    1,
  );
  assert.equal(
    billingStartSource.match(/<li>\{checkoutPaymentMethodText\}<\/li>/gu)?.length,
    1,
  );
});


test("daily test registration is controlled by an explicit fail-closed server flag", () => {
  const registerPageSource = fs.readFileSync("src/app/register/page.tsx", "utf8");
  const registerClientSource = fs.readFileSync("src/app/register/RegisterClient.tsx", "utf8");
  const registrationWindowRouteSource = fs.readFileSync("src/app/api/register/daily-test-window/route.ts", "utf8");
  const registrationWorkspaceRouteSource = fs.readFileSync("src/app/api/register/workspace/route.ts", "utf8");
  const supabaseServerSource = fs.readFileSync("src/lib/supabase/server.ts", "utf8");

  const runtimeSettingsSource = fs.readFileSync("src/lib/runtimeProductSettings.ts", "utf8");
  const publicDailyTestPolicySource = fs.readFileSync("src/lib/publicDailyTestPlanPolicy.mjs", "utf8");
  const adminRouteSource = fs.readFileSync("src/app/api/admin/settings/daily-test-plan/route.ts", "utf8");
  const adminSettingsSource = fs.readFileSync("src/app/admin/settings/page.tsx", "utf8");
  const workspaceSetupSource = fs.readFileSync("src/app/workspace/setup/page.tsx", "utf8");
  const deploySource = fs.readFileSync(".github/workflows/deploy-fanmind.yml", "utf8");

  assert.match(registerPageSource, /getPublicDailyTestPlanEnabled/);
  assert.match(registerPageSource, /isInternalDailyTestWorkspaceProvisioningReady/);
  const checkoutRouteSource = fs.readFileSync("src/app/api/billing/checkout/route.ts", "utf8");
  assert.match(checkoutRouteSource, /await getPublicDailyTestPlanEnabled\(\)/);
  assert.match(runtimeSettingsSource, /publicDailyTestPlanEnabled/);
  assert.match(runtimeSettingsSource, /getTemporaryPublicDailyTestPlanStatus/);
  assert.match(publicDailyTestPolicySource, /PUBLIC_DAILY_TEST_PLAN_WINDOW_MS = 24 \* 60 \* 60 \* 1000/);
  assert.match(publicDailyTestPolicySource, /enabledUntilMs - updatedAtMs <= PUBLIC_DAILY_TEST_PLAN_WINDOW_MS/);
  assert.doesNotMatch(runtimeSettingsSource, /FANMIND_ENABLE_PUBLIC_DAILY_TEST_PLAN/);
  assert.match(runtimeSettingsSource, /rename\(temporaryPath, settingsPath\)/);
  assert.match(adminRouteSource, /requirePlatformAdmin/);
  assert.match(
    adminRouteSource,
    /enabled && !\(await isInternalDailyTestWorkspaceProvisioningReady\(\)\)[\s\S]*daily_test_plan", "not_ready"[\s\S]*setPublicDailyTestPlanEnabled/u,
  );
  assert.match(
    adminSettingsSource,
    /windowEnabled && provisioningReady[\s\S]*Sichere Registrierung[\s\S]*Rollout ausstehend/u,
  );
  assert.match(deploySource, /if \[ ! -e "\$RUNTIME_SETTINGS_FILE" \]/);
  assert.doesNotMatch(deploySource, /sed -i.*FANMIND_ENABLE_PUBLIC_DAILY_TEST_PLAN/);
  assert.doesNotMatch(registerPageSource, /enablePublicDailyTestPlan=\{false\}/);
  assert.match(
    registerClientSource,
    /isDailyTestRegistration\(\{[\s\S]*enabled: enablePublicDailyTestPlan,[\s\S]*planId: resolvedPlanId,[\s\S]*testPlan: requestedTestPlan/u,
  );
  assert.match(registerClientSource, /isRetiredPilotRequested \? "starter" : resolvedPlanId/u);
  assert.match(registerClientSource, /commercialOption = isDailyTestPlanSelected \? "internal_daily_test"/);
  assert.match(registerClientSource, /fanmind_locale: language/u);
  assert.match(registrationWindowRouteSource, /export const dynamic = "force-dynamic"/u);
  assert.match(registrationWindowRouteSource, /isTrustedFanMindMutationRequest\(request\)/u);
  assert.match(registrationWindowRouteSource, /readBoundedJsonRequest\([\s\S]*MAX_DAILY_TEST_WINDOW_BODY_BYTES/u);
  assert.match(registrationWindowRouteSource, /Object\.keys\(payload\)\.length !== 1/u);
  assert.match(registrationWindowRouteSource, /getPublicDailyTestPlanEnabled\(\)[\s\S]*isInternalDailyTestWorkspaceProvisioningReady\(\)/u);
  assert.match(registrationWindowRouteSource, /daily_test_window_closed/u);
  assert.match(registrationWindowRouteSource, /"Cache-Control": "no-store"/u);
  assert.doesNotMatch(registrationWindowRouteSource, /Stripe|createStripeCheckoutSession/u);
  const windowCheckIndex = registerClientSource.indexOf('fetch("/api/register/daily-test-window"');
  const signUpIndex = registerClientSource.indexOf("supabase.auth.signUp");
  assert.ok(windowCheckIndex >= 0 && signUpIndex > windowCheckIndex);
  assert.match(registerClientSource, /selectedCommercialOption === "internal_daily_test"[\s\S]*fetch\("\/api\/register\/daily-test-window"/u);
  assert.match(registerClientSource, /windowResponse\.json\(\)\.catch\(\(\) => null\)[\s\S]*!windowResponse\.ok \|\| windowPayload\?\.ok !== true[\s\S]*setError\(DAILY_TEST_WINDOW_CLOSED_MESSAGES\[language\]\)[\s\S]*return;/u);
  assert.doesNotMatch(registerClientSource, /DAILY_TEST_WINDOW_CLOSED_MESSAGES[\s\S]*selectedCommercialOption\s*=\s*"starter/u);
  const sessionSyncIndex = registerClientSource.indexOf("await syncSupabaseSessionForServer(data.session)");
  const workspaceMutationIndex = registerClientSource.indexOf('fetch("/api/register/workspace"');
  assert.ok(sessionSyncIndex > signUpIndex && workspaceMutationIndex > sessionSyncIndex);
  assert.doesNotMatch(registerClientSource, /supabase\.rpc|\.from\("workspaces"\)|\.from\("workspace_members"\)/u);
  assert.match(registrationWorkspaceRouteSource, /getSupabaseServerUser\(\)[\s\S]*ensureUserWorkspace\(data\.user\)/u);
  assert.match(registrationWorkspaceRouteSource, /daily_test_window_closed/u);
  assert.match(registrationWorkspaceRouteSource, /"Cache-Control": "no-store"/u);
  const dailyGateIndex = supabaseServerSource.indexOf('workspaceTerms.commercialOption === "internal_daily_test"');
  const provisioningRpcIndex = supabaseServerSource.indexOf("INTERNAL_DAILY_TEST_WORKSPACE_PROVISIONING_RPC", dailyGateIndex);
  const legacyBridgeIndex = supabaseServerSource.indexOf("// Compatibility bridge for the deploy-before-migrate rollout.", dailyGateIndex);
  assert.ok(dailyGateIndex >= 0 && provisioningRpcIndex > dailyGateIndex && legacyBridgeIndex > provisioningRpcIndex);
  assert.match(supabaseServerSource, /isInternalDailyTest[\s\S]*isInternalDailyTestWorkspaceProvisioningReady\(\)[\s\S]*getPublicDailyTestPlanEnabled\(\)[\s\S]*getServiceAccessToken\(\)/u);
  assert.match(supabaseServerSource, /if \(!workspace && !isInternalDailyTest\)/u);
  assert.match(supabaseServerSource, /planId === "pilot" && commercialOption === "internal_daily_test"[\s\S]*getRegistrationCommercialTerms\("pilot", "internal_daily_test"\)/u);
  assert.match(
    workspaceSetupSource,
    /resolveWorkspaceLocale\([\s\S]*lang: params\?\.lang,[\s\S]*user: data\.user[\s\S]*PUBLIC_DAILY_TEST_PLAN_UNAVAILABLE_ERROR[\s\S]*PUBLIC_DAILY_TEST_PROVISIONING_UNAVAILABLE_ERROR[\s\S]*No workspace was created[\s\S]*Es wurde kein Workspace angelegt/u,
  );
  assert.doesNotMatch(
    workspaceSetupSource,
    /\{setupResult\.error\.message\}/u,
  );
  assert.match(
    registerClientSource,
    /DAILY_TEST_WORKSPACE_RECOVERY_MESSAGES[\s\S]*Do not register again[\s\S]*workspacePayload\?\.code === "daily_test_window_closed"[\s\S]*DAILY_TEST_WORKSPACE_RECOVERY_MESSAGES\[language\]/u,
  );
});

test("daily beta admin checkout targets the workspace owner and cancels at paid-day end", () => {
  const adminBillingSource = fs.readFileSync("src/lib/adminBilling.ts", "utf8");
  assert.match(adminBillingSource, /userId: workspace\.owner_user_id/);
  assert.match(adminBillingSource, /userEmail: workspace\.owner_email/);
  assert.match(adminBillingSource, /cancel_at_period_end: "true"/);
  assert.match(adminBillingSource, /const persisted = await updateAdminBillingWorkspace/u);
  assert.match(adminBillingSource, /if \(!persisted\.ok\)[\s\S]*expireStripeCheckoutSession\(session\.id\)[\s\S]*ok: false/u);
  assert.match(adminBillingSource, /!workspace\.stripe_subscription_id[\s\S]*!workspace\.stripe_checkout_session_id[\s\S]*ok: false[\s\S]*await expireStripeCheckoutSession\(workspace\.stripe_checkout_session_id\)[\s\S]*if \(!checkoutExpired\)[\s\S]*ok: false[\s\S]*updateAdminBillingWorkspace/u);
  assert.match(adminBillingSource, /!workspace\.stripe_subscription_id[\s\S]*billing_status: "demo_free"[\s\S]*stripe_checkout_session_id: null[\s\S]*stripe_live_daily_test: false/u);
  const stripeBillingSource = fs.readFileSync("src/lib/stripeBilling.ts", "utf8");
  assert.match(stripeBillingSource, /checkout\/sessions\/\$\{encodeURIComponent\(normalizedId\)\}\/expire[\s\S]*signal: AbortSignal\.timeout\(12_000\)/u);
  assert.doesNotMatch(adminBillingSource, /subscriptions\/\$\{encodeURIComponent\(workspace\.stripe_subscription_id\)\}`, \{ method: "DELETE"/);
});
