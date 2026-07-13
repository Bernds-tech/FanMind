#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, text: str) -> None:
    (ROOT / path).write_text(text, encoding="utf-8")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


def replace_all(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count < 1:
        raise SystemExit(f"{label}: expected at least one match, found {count}")
    return text.replace(old, new)


path = "src/lib/referrals.ts"
text = read(path)

text = replace_once(
    text,
    '''import type {
  ReferralProgramStatus,
  ReferralStatus,
} from "@/lib/adminReferrals";

export const REFERRAL_DISCOUNT_STEP_PERCENT = 5;
export const REFERRAL_MAX_ACTIVE_COUNT = 20;
export const REFERRAL_GROWTH_WINDOW_CAP = 2000;
''',
    '''import type {
  ReferralProgramStatus,
  ReferralStatus,
} from "@/lib/adminReferrals";
import {
  REFERRAL_DISCOUNT_STEP_PERCENT,
  REFERRAL_GROWTH_WINDOW_CAP,
  REFERRAL_MAX_ACTIVE_COUNT,
  calculateReferralPercent,
  evaluateReferralWorkspaceEligibility,
  isReferralGrowthWindowOpen,
} from "@/lib/referralPolicy.mjs";

export {
  REFERRAL_DISCOUNT_STEP_PERCENT,
  REFERRAL_GROWTH_WINDOW_CAP,
  REFERRAL_MAX_ACTIVE_COUNT,
  calculateReferralPercent,
};
''',
    "referral policy imports",
)

text = replace_once(
    text,
    '''export function calculateReferralPercent(
  activeReferralCount: number,
  overrideDiscountPercent?: number | null,
) {
  const billableActiveReferralCount = Math.max(
    0,
    Math.min(activeReferralCount, REFERRAL_MAX_ACTIVE_COUNT),
  );
  const discountPercent =
    overrideDiscountPercent ??
    Math.min(
      billableActiveReferralCount * REFERRAL_DISCOUNT_STEP_PERCENT,
      100,
    );
  return { billableActiveReferralCount, discountPercent };
}

''',
    "",
    "remove duplicate percentage function",
)

text = replace_once(
    text,
    '''function evaluateEligibility(
  workspace: WorkspaceEligibilityRow | null,
): ReferralEligibility {
  if (!workspace) {
    return {
      eligible: false,
      reason: "Workspace konnte für das Empfehlungsprogramm nicht geprüft werden.",
      workspace,
    };
  }

  const billingStatus = workspace.billing_status ?? "";
  const isDemo =
    billingStatus === "demo_free" ||
    /demo/i.test(workspace.name ?? "") ||
    workspace.commercial_option === "internal_daily_test";
  if (isDemo) {
    return {
      eligible: false,
      reason: "Demo- und interne Test-Workspaces nehmen nicht am Empfehlungsprogramm teil.",
      workspace,
    };
  }

  const hasPaidCommercialValue =
    (workspace.setup_fee_cents ?? 0) > 0 ||
    (workspace.monthly_fee_cents ?? 0) > 0;
  if (!hasPaidCommercialValue) {
    return {
      eligible: false,
      reason: "Für diesen Workspace ist noch kein zahlungspflichtiges Paket hinterlegt.",
      workspace,
    };
  }

  if (!["active", "past_due"].includes(billingStatus)) {
    return {
      eligible: false,
      reason: "Der Workspace wird nach erfolgreicher Zahlung für Empfehlungen freigeschaltet.",
      workspace,
    };
  }

  return { eligible: true, reason: null, workspace };
}
''',
    '''function evaluateEligibility(
  workspace: WorkspaceEligibilityRow | null,
): ReferralEligibility {
  const policy = evaluateReferralWorkspaceEligibility(workspace);
  return { ...policy, workspace };
}
''',
    "centralize referral eligibility",
)

text = replace_all(
    text,
    '''  const windowOpen =
    ["open", "reopened"].includes(state.status) &&
    state.active_paid_workspace_count < state.active_paid_workspace_cap;
''',
    '''  const windowOpen = isReferralGrowthWindowOpen(
    state.status,
    state.active_paid_workspace_count,
    state.active_paid_workspace_cap,
  );
''',
    "growth window policy",
)

write(path, text)

for forbidden in [
    'export const REFERRAL_DISCOUNT_STEP_PERCENT = 5;',
    '["active", "past_due"].includes(billingStatus)',
]:
    if forbidden in text:
        raise SystemExit(f"legacy referral policy remains: {forbidden}")
for required in [
    'from "@/lib/referralPolicy.mjs"',
    "evaluateReferralWorkspaceEligibility(workspace)",
    "isReferralGrowthWindowOpen(",
]:
    if required not in text:
        raise SystemExit(f"referral integration missing: {required}")


path = "scripts/verify-product-truth.mjs"
text = read(path)
if '  "src/lib/referralPolicy.mjs",\n' not in text:
    text = replace_once(
        text,
        '  "src/lib/stripeBilling.ts",\n  "src/lib/referrals.ts",\n',
        '  "src/lib/stripeBilling.ts",\n  "src/lib/referrals.ts",\n  "src/lib/referralPolicy.mjs",\n',
        "truth runtime referral policy",
    )

text = text.replace(
    '''requireText(
  "src/lib/referrals.ts",
  "REFERRAL_DISCOUNT_STEP_PERCENT = 5",
  "Referral muss 5 Prozent je aktivem geworbenem Workspace verwenden.",
);''',
    '''requireText(
  "src/lib/referralPolicy.mjs",
  "REFERRAL_DISCOUNT_STEP_PERCENT = 5",
  "Referral muss 5 Prozent je aktivem geworbenem Workspace verwenden.",
);''',
)
text = text.replace(
    '''requireText(
  "src/lib/referrals.ts",
  "REFERRAL_MAX_ACTIVE_COUNT = 20",
  "Referral muss maximal 20 aktive Empfehlungen berücksichtigen.",
);''',
    '''requireText(
  "src/lib/referralPolicy.mjs",
  "REFERRAL_MAX_ACTIVE_COUNT = 20",
  "Referral muss maximal 20 aktive Empfehlungen berücksichtigen.",
);''',
)
text = text.replace(
    '''requireText(
  "src/lib/referrals.ts",
  "REFERRAL_GROWTH_WINDOW_CAP = 2000",
  "Das Referral Growth Window muss bei 2.000 aktiven zahlenden Workspaces gedeckelt sein.",
);''',
    '''requireText(
  "src/lib/referralPolicy.mjs",
  "REFERRAL_GROWTH_WINDOW_CAP = 2000",
  "Das Referral Growth Window muss bei 2.000 aktiven zahlenden Workspaces gedeckelt sein.",
);''',
)

policy_checks = '''requireText(
  "src/lib/referralPolicy.mjs",
  "billingStatus !== \"active\"",
  "Nur aktiv zahlende Workspaces dürfen für Referral freigeschaltet werden.",
);
requireText(
  "src/lib/referralPolicy.mjs",
  "monthlyFeeCentsAfterDiscount",
  "Die wiederkehrende Referral-Berechnung muss einen nicht negativen Monatsbetrag liefern.",
);
requireText(
  "tests/referral-policy.test.mjs",
  "growth window closes at 2000 active paid workspaces",
  "Die Referral-Policy muss den 2.000er-Cap automatisiert testen.",
);
'''
if "Nur aktiv zahlende Workspaces dürfen" not in text:
    anchor = '''requireText(
  "src/app/settings/AccountSections.tsx",
'''
    if anchor not in text:
        raise SystemExit("truth policy insertion anchor missing")
    text = text.replace(anchor, policy_checks + anchor, 1)

if '  "tests/referral-policy.test.mjs",\n' not in text:
    text = replace_once(
        text,
        '  "src/app/avv/page.tsx",\n',
        '  "src/app/avv/page.tsx",\n  "tests/referral-policy.test.mjs",\n',
        "truth runtime referral test",
    )

write(path, text)

print("Referral policy integration and truth checks updated.")
