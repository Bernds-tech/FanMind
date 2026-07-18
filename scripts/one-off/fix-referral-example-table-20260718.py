#!/usr/bin/env python3
from pathlib import Path

path = Path("docs/REFERRAL_PROGRAM.md")
text = path.read_text(encoding="utf-8")
replacements = {
    "| 0 | 0 % | voller laufender Preis |": "| 0 | 0 % | volle Starter-Grundgebühr; Add-ons zusätzlich |",
    "| 1 | 5 % | 95 % des laufenden Preises |": "| 1 | 5 % | 95 % der Starter-Grundgebühr; Add-ons zusätzlich |",
    "| 5 | 25 % | 75 % des laufenden Preises |": "| 5 | 25 % | 75 % der Starter-Grundgebühr; Add-ons zusätzlich |",
    "| 10 | 50 % | 50 % des laufenden Preises |": "| 10 | 50 % | 50 % der Starter-Grundgebühr; Add-ons zusätzlich |",
}
for old, new in replacements.items():
    if text.count(old) != 1:
        raise SystemExit(f"expected one table row, found {text.count(old)}: {old}")
    text = text.replace(old, new, 1)
path.write_text(text, encoding="utf-8")
print("Referral example table aligned with base-only discount truth.")
