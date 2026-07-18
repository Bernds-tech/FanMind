#!/usr/bin/env python3
from pathlib import Path
import json
import re

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


def regex_replace_once(text: str, pattern: str, replacement: str, label: str) -> str:
    updated, count = re.subn(pattern, replacement, text, count=1, flags=re.S)
    if count != 1:
        raise SystemExit(f"{label}: expected one regex match, found {count}")
    return updated


# Package UI consumes the central policy instead of hardcoded AI cards.
path = "src/app/settings/AccountSections.tsx"
text = read(path)
import_line = 'import { AI_TIER_IDS, formatAiTierPrice, getAiTierConfig } from "@/config/aiTiers.mjs";\n'
if import_line not in text:
    anchor = 'import { ComingSoonMark } from "@/components/ComingSoonMark";\n'
    text = replace_once(text, anchor, anchor + import_line, "AccountSections AI tier import")

replacement = '''const AI_ADD_ON_CARDS: AddOnCard[] = AI_TIER_IDS.map((tierId) => {
  const tier = getAiTierConfig(tierId);
  return {
    key: `ai_${tier.id}`,
    name: tier.name,
    purpose: tier.description,
    status: tier.publicStatus,
    price: formatAiTierPrice(tier),
    features: [...tier.features],
    showComingSoonMark: tier.publicStatus === "Coming Soon",
  };
});

const ADD_ON_CARDS: AddOnCard[] = [
  ...AI_ADD_ON_CARDS,
  {
    key: "reach_analysis",
    name: "Reichweitenanalyse",
    purpose:
      "Vorbereitete Auswertung für Reichweite und Resonanz ohne Voll-Analytics-Suite.",
    status: "Nicht aktiv",
    price: "auf Anfrage",
    features: ["vorbereitet", "manuelle Prüfung"],
    showComingSoonMark: true,
  },
  {
    key: "campaign_insights",
    name: "Kampagnen-Insights",
    purpose: "Spätere Einordnung von Kampagnenwirkung ohne Versandautomation.",
    status: "Coming Soon",
    price: "auf Anfrage",
    features: ["Roadmap-Vorschau", "keine Versandautomation"],
    showComingSoonMark: true,
  },
  {
    key: "custom",
    name: "Custom Add-on",
    purpose: "Musterplatz für geprüfte Zusatzmodule oder Pilotwünsche.",
    status: "Auf Anfrage",
    price: "auf Anfrage",
    features: ["Pilotwunsch", "manuelle Freigabe"],
    showComingSoonMark: true,
  },
];

function getPackageCards'''
text = regex_replace_once(
    text,
    r"const ADD_ON_CARDS: AddOnCard\[\] = \[.*?\n\];\n\nfunction getPackageCards",
    replacement,
    "AccountSections add-on cards",
)
write(path, text)


# Operations tests include the central AI tier policy.
path = "package.json"
package = json.loads(read(path))
script = package["scripts"]["test:operations"]
test_file = "tests/ai-tier-policy.test.mjs"
if test_file not in script:
    package["scripts"]["test:operations"] = f"{script} {test_file}"
write(path, json.dumps(package, ensure_ascii=False, indent=2) + "\n")


# Product-truth checks follow the central policy rather than UI literals.
path = "scripts/verify-product-truth.mjs"
text = read(path)
if '"src/config/aiTiers.mjs",' not in text:
    text = replace_once(
        text,
        '  ".env.example",\n',
        '  ".env.example",\n  "src/config/aiTiers.mjs",\n  "tests/ai-tier-policy.test.mjs",\n',
        "truth runtime AI tier files",
    )
old_checks = '''requireText(
  "src/app/settings/AccountSections.tsx",
  "KI Standard ist im Basispaket enthalten",
  "KI Standard muss als enthalten ausgewiesen werden.",
);
requireText(
  "src/app/settings/AccountSections.tsx",
  'price: "+100 €/Monat"',
  "KI Plus muss den freigegebenen Zusatzpreis ausweisen.",
);
requireText(
  "src/app/settings/AccountSections.tsx",
  'price: "+200 €/Monat"',
  "KI Ultra muss den freigegebenen Zusatzpreis ausweisen.",
);
'''
new_checks = '''requireText(
  "src/config/aiTiers.mjs",
  'monthlyAddOnCents: 10000',
  "Die zentrale KI-Tier-Policy muss KI Plus mit 100 €/Monat führen.",
);
requireText(
  "src/config/aiTiers.mjs",
  'monthlyAddOnCents: 20000',
  "Die zentrale KI-Tier-Policy muss KI Ultra mit 200 €/Monat führen.",
);
requireText(
  "src/config/aiTiers.mjs",
  'includedInBase: true',
  "KI Standard muss in der zentralen Policy im Basispaket enthalten bleiben.",
);
requireText(
  "src/config/aiTiers.mjs",
  'addOnReferralDiscountEligible: false',
  "KI-Add-ons dürfen nicht referral-rabattfähig werden.",
);
requireText(
  "src/config/aiTiers.mjs",
  'automaticSendingEnabled: false',
  "Keine KI-Stufe darf automatische Sendung aktivieren.",
);
requireText(
  "src/app/settings/AccountSections.tsx",
  'from "@/config/aiTiers.mjs"',
  "Die Paketansicht muss die zentrale KI-Tier-Policy verwenden.",
);
requireText(
  "tests/ai-tier-policy.test.mjs",
  "Plus and Ultra cannot be automatically booked before models, limits and billing are approved",
  "Die nicht freigegebene Auto-Buchung von Plus/Ultra muss automatisiert getestet werden.",
);
'''
text = replace_once(text, old_checks, new_checks, "truth AI tier checks")
write(path, text)


# Source of Truth documents the technical policy and explicit unknowns.
path = "docs/SOURCE_OF_TRUTH.md"
text = read(path)
marker = "#### Zentrale technische KI-Stufen-Policy"
if marker not in text:
    block = '''#### Zentrale technische KI-Stufen-Policy

- `src/config/aiTiers.mjs` ist die technische Source of Truth für KI Standard, Plus und Ultra.
- KI Standard ist enthalten; KI Plus kostet 100 €/Monat zusätzlich; KI Ultra kostet 200 €/Monat zusätzlich.
- Einrichtung und KI-Add-ons sind nicht referral-rabattfähig.
- Keine KI-Stufe aktiviert automatische Sendung.
- Plus und Ultra bleiben `Coming Soon` und nicht automatisch buchbar, bis Modellklasse, Kontingente, Kontextgrenzen und getrennte Stripe-Subscription-Items ausdrücklich freigegeben sind.
- Nicht festgelegte Modelle oder Limits werden als `null` geführt und dürfen nicht durch erfundene Werte ersetzt werden.

'''
    text = replace_once(text, "### Betreiber- und Steuerstatus\n", block + "### Betreiber- und Steuerstatus\n", "Source of Truth AI tier policy")
write(path, text)


# Reader and contributor instructions stay synchronized.
path = "README.md"
text = read(path)
reader_line = "- Zentrale KI-Stufen-Policy: `src/config/aiTiers.mjs` führt Standard, Plus und Ultra; Plus/Ultra bleiben bis zur Modell-, Kontingent- und Billing-Freigabe nicht automatisch buchbar.\n"
if reader_line not in text:
    anchor = "- KI-Stufen: KI Standard ist in 312 €/Monat enthalten; KI Plus kostet zusätzlich 100 €/Monat; KI Ultra kostet zusätzlich 200 €/Monat.\n"
    text = replace_once(text, anchor, anchor + reader_line, "README AI tier policy")
write(path, text)

path = "AGENTS.md"
text = read(path)
old_truth = "- Current commercial truth: `Pilot / Setup = 990 € einmalig`, `Starter = 312 €/Monat`. Starter has two options: `Starter Flex = 990 € Setup + 312 €/Monat` and `Starter 12 Monate = 0 € Setup + 312 €/Monat bei 12 Monaten Laufzeit`. Do not reintroduce the old `299 €/Monat` pricing."
new_truth = "- Current commercial truth: the paid Pilot/Setup package is retired. Public paid offers are `Starter Flex = 990 € one-time setup + 312 €/month` and `Starter 12 Monate = 0 € setup + 312 €/month with a 12-month minimum term, then monthly renewal`. KI Standard is included; KI Plus is +100 €/month; KI Ultra is +200 €/month. Do not reintroduce the old Pilot or 299 €/month pricing."
text = replace_once(text, old_truth, new_truth, "AGENTS commercial truth")
ai_rule = "- Canonical AI tier policy lives in `src/config/aiTiers.mjs`; do not duplicate prices, referral eligibility, auto-send rules or automatic-booking readiness across UI files.\n"
if ai_rule not in text:
    anchor = "- AI usage/cost monitoring requirements live in `docs/AI_COST_MONITORING.md`.\n"
    text = replace_once(text, anchor, anchor + ai_rule, "AGENTS AI tier policy")
write(path, text)

print("Central AI tier policy integrated.")
