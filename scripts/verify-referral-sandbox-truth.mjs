#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const files = [
  ".env.example",
  "src/lib/referralLifecyclePolicy.mjs",
  "src/lib/referralSandboxPolicy.mjs",
  "src/app/api/stripe/webhook/route.ts",
  "scripts/referral-sandbox-preflight.mjs",
  "tests/referral-lifecycle-policy.test.mjs",
  "tests/referral-sandbox-policy.test.mjs",
  "docs/operations/referral-stripe-sandbox-runbook.md",
];

const contents = new Map();
const errors = [];

for (const file of files) {
  try {
    contents.set(file, await readFile(resolve(root, file), "utf8"));
  } catch (error) {
    errors.push(
      `${file}: Datei konnte nicht gelesen werden (${error instanceof Error ? error.message : "unbekannter Fehler"}).`,
    );
  }
}

function content(file) {
  return contents.get(file) ?? "";
}

function requireText(file, value, explanation) {
  if (!content(file).includes(value)) {
    errors.push(
      `${file}: ${explanation} Erwarteter Wert fehlt: ${JSON.stringify(value)}.`,
    );
  }
}

function forbidIn(file, pattern, explanation) {
  if (pattern.test(content(file))) errors.push(`${file}: ${explanation}`);
}

requireText(
  ".env.example",
  "FANMIND_ENABLE_REFERRAL_BILLING=false",
  "Referral-Billing muss standardmäßig deaktiviert bleiben.",
);
requireText(
  ".env.example",
  "FANMIND_REFERRAL_SANDBOX_ACK=",
  "Die ausdrückliche Sandbox-Schreibfreigabe muss dokumentiert sein.",
);
requireText(
  "src/lib/referralLifecyclePolicy.mjs",
  'type === "charge.refunded"',
  "Refunds müssen im zentralen Lifecycle-Mapping berücksichtigt werden.",
);
requireText(
  "src/lib/referralLifecyclePolicy.mjs",
  'type === "customer.subscription.deleted"',
  "Kündigungen müssen im zentralen Lifecycle-Mapping berücksichtigt werden.",
);
requireText(
  "src/app/api/stripe/webhook/route.ts",
  'from "@/lib/referralLifecyclePolicy.mjs"',
  "Der Stripe-Webhook muss das getestete Lifecycle-Mapping verwenden.",
);
requireText(
  "src/lib/referralSandboxPolicy.mjs",
  'key.startsWith("sk_live_")',
  "Der Preflight muss Live-Stripe-Schlüssel erkennen und blockieren.",
);
requireText(
  "src/lib/referralSandboxPolicy.mjs",
  'hostname === "fanmind.ch"',
  "Schreibende Sandbox-Tests müssen das Production-Ziel erkennen.",
);
requireText(
  "scripts/referral-sandbox-preflight.mjs",
  "SECRETS_WURDEN_NICHT_AUSGEGEBEN=true",
  "Der Preflight muss ausdrücklich bestätigen, dass keine Secrets ausgegeben wurden.",
);
requireText(
  "tests/referral-lifecycle-policy.test.mjs",
  "refunds and disputes deactivate referral eligibility",
  "Refunds und Disputes müssen automatisiert getestet werden.",
);
requireText(
  "tests/referral-sandbox-policy.test.mjs",
  "live Stripe keys are rejected in every sandbox mode",
  "Live-Schlüssel müssen automatisiert als unzulässig getestet werden.",
);
requireText(
  "docs/operations/referral-stripe-sandbox-runbook.md",
  "FANMIND_ENABLE_REFERRAL_BILLING=false",
  "Das Runbook muss Production-Billing ausdrücklich deaktiviert lassen.",
);
requireText(
  "docs/operations/referral-stripe-sandbox-runbook.md",
  "Diesen Test niemals in Production ausführen.",
  "Der Cap-Test muss klar auf die isolierte Sandbox begrenzt sein.",
);
forbidIn(
  "scripts/referral-sandbox-preflight.mjs",
  /console\.(?:log|warn|error)\([^\n]*(?:STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|SUPABASE_SERVICE_ROLE_KEY)\s*\)/u,
  "Der Preflight darf Secret-Werte nicht direkt ausgeben.",
);

if (errors.length) {
  for (const error of errors) console.error(`REFERRAL_TRUTH_ERROR: ${error}`);
  console.error(
    `Referral sandbox truth verification failed with ${errors.length} error(s).`,
  );
  process.exit(1);
}

console.log(
  `Referral sandbox truth verified across ${files.length} checked files.`,
);
