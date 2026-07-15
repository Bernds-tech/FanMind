#!/usr/bin/env python3
from pathlib import Path

path = Path("scripts/one-off/integrate-demo-turnstile.py")
text = path.read_text(encoding="utf-8")

old = '''for entry, anchor in [
    ('  "src/lib/demoProtection.ts",\\n', '  "src/lib/demoTurnstilePolicy.mjs",\\n'),
    ('  "src/app/login/page.tsx",\\n', '  "src/app/landing-v2/page.tsx",\\n'),
    ('  "tests/demo-turnstile-policy.test.mjs",\\n', '  "tests/ai-usage-policy.test.mjs",\\n'),
]:
    if entry not in text:
        text = replace_once(text, anchor, anchor + entry, f"truth runtime {entry.strip()}")
'''

new = """policy_runtime_anchor = '''  \"src/lib/aiUsagePolicy.mjs\",
  \"src/lib/demoTurnstilePolicy.mjs\",
  \"src/lib/workspaceAiUsage.ts\",
'''
policy_runtime_replacement = '''  \"src/lib/aiUsagePolicy.mjs\",
  \"src/lib/demoTurnstilePolicy.mjs\",
  \"src/lib/demoProtection.ts\",
  \"src/lib/workspaceAiUsage.ts\",
'''
if '  \"src/lib/demoProtection.ts\",\\n' not in text:
    text = replace_once(
        text,
        policy_runtime_anchor,
        policy_runtime_replacement,
        \"truth runtime demo protection\",
    )

login_runtime_anchor = '''  \"src/lib/workspaceNavigation.ts\",
  \"src/app/landing-v2/page.tsx\",
  \"src/app/landing-v2/FaqAccordion.tsx\",
'''
login_runtime_replacement = '''  \"src/lib/workspaceNavigation.ts\",
  \"src/app/login/page.tsx\",
  \"src/app/landing-v2/page.tsx\",
  \"src/app/landing-v2/FaqAccordion.tsx\",
'''
if '  \"src/app/login/page.tsx\",\\n' not in text:
    text = replace_once(
        text,
        login_runtime_anchor,
        login_runtime_replacement,
        \"truth runtime login\",
    )

test_runtime_anchor = '''  \"tests/referral-policy.test.mjs\",
  \"tests/ai-usage-policy.test.mjs\",
  \"docs/SOURCE_OF_TRUTH.md\",
'''
test_runtime_replacement = '''  \"tests/referral-policy.test.mjs\",
  \"tests/ai-usage-policy.test.mjs\",
  \"tests/demo-turnstile-policy.test.mjs\",
  \"docs/SOURCE_OF_TRUTH.md\",
'''
if '  \"tests/demo-turnstile-policy.test.mjs\",\\n' not in text:
    text = replace_once(
        text,
        test_runtime_anchor,
        test_runtime_replacement,
        \"truth runtime Turnstile test\",
    )
"""

if old not in text:
    raise SystemExit("ambiguous Product Truth insertion loop not found")

path.write_text(text.replace(old, new, 1), encoding="utf-8")
print("Prepared unique Turnstile Product Truth insertion anchors.")
