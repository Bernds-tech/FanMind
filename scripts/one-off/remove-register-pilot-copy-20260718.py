#!/usr/bin/env python3
from pathlib import Path

path = Path("src/app/register/RegisterClient.tsx")
text = path.read_text(encoding="utf-8")
text = text.replace('"Compact overview for Pilot, Starter and roadmap."', '"Compact overview for Starter and roadmap."')
text = text.replace('"Kompakte Paketübersicht für Pilot, Starter und Roadmap."', '"Kompakte Paketübersicht für Starter und Roadmap."')
text = text.replace('selectedPlanId === "pilot" ? "Pilot / Setup" : "Starter-Paket"', 'selectedPlanId === "pilot" ? "Interne Demo" : "Starter-Paket"')
text = text.replace('selectedPlanId === "pilot" ? (language === "en" ? "Start Pilot / Setup" : "Pilot / Setup starten") :', 'selectedPlanId === "pilot" ? (language === "en" ? "Start internal demo" : "Interne Demo starten") :')
path.write_text(text, encoding="utf-8")
print("Remaining public Pilot/Setup registration copy removed.")
