#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

files = [
    "src/app/landing-v2/page.tsx",
    "src/components/landing/FooterInquiryForm.tsx",
    "src/lib/fanmindCopy.ts",
    "src/config/plans.ts",
    "src/components/onboarding/OnboardingMaster.tsx",
    "src/app/channels/ChannelsGrid.tsx",
    "src/app/settings/AccountSections.tsx",
]

replacements = {
    "Pilot anfragen": "Beratung anfragen",
    "Request pilot": "Request consultation",
    "Pilot%20anfragen": "Beratung%20anfragen",
    "passenden Pilot-Setup": "passenden FanMind-Einstieg",
    "vom ersten Pilot bis zum wachsenden Team": "vom produktiven Start bis zum wachsenden Team",
    "Im Pilot klären wir gemeinsam": "In einer Beratung klären wir gemeinsam",
    "Pilot-Feedback bestimmt den Ausbau": "Kundenfeedback bestimmt den Ausbau",
    "Pilotwunsch": "individueller Wunsch",
}

changed = 0
for relative in files:
    path = ROOT / relative
    text = path.read_text(encoding="utf-8")
    original = text
    for old, new in replacements.items():
        text = text.replace(old, new)
    if text != original:
        path.write_text(text, encoding="utf-8")
        changed += 1
        print(f"updated {relative}")

if changed < 3:
    raise SystemExit(f"Expected several public copy files to change, changed {changed}")

print(f"Public pilot CTA cleanup updated {changed} files.")
