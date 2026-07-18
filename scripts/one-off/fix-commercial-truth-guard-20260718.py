#!/usr/bin/env python3
from pathlib import Path

path = Path("scripts/verify-product-truth.mjs")
text = path.read_text(encoding="utf-8")
old = '''requireText(
  "src/app/settings/AccountSections.tsx",
  "höherer Zusatzpreis als KI Plus",
  "KI Ultra muss als höherpreisige Erweiterung oberhalb von KI Plus beschrieben werden.",
);
'''
new = '''requireText(
  "src/app/settings/AccountSections.tsx",
  'price: "+200 €/Monat"',
  "KI Ultra muss mit dem freigegebenen Zusatzpreis ausgewiesen werden.",
);
'''
if text.count(old) != 1:
    raise SystemExit(f"old KI Ultra truth check found {text.count(old)} times")
path.write_text(text.replace(old, new, 1), encoding="utf-8")
print("Commercial truth guard updated.")
