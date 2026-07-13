#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
STRING_LITERAL = re.compile(r'"(?:\\.|[^"\\])*"')


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, text: str) -> None:
    (ROOT / path).write_text(text, encoding="utf-8")


def transform_literals(text: str, replacements: list[tuple[str, str]]) -> str:
    def transform(match: re.Match[str]) -> str:
        literal = match.group(0)
        body = literal[1:-1]
        for old, new in replacements:
            body = body.replace(old, new)
        return f'"{body}"'

    return STRING_LITERAL.sub(transform, text)


def residual_literals(text: str, needles: tuple[str, ...]) -> list[str]:
    results: list[str] = []
    for match in STRING_LITERAL.finditer(text):
        literal = match.group(0)
        if any(needle in literal for needle in needles):
            results.append(literal)
    return results


# ---------------------------------------------------------------------------
# Landing page: transform visible string literals only, never TS/CSS identifiers.
# ---------------------------------------------------------------------------
path = "src/app/landing-v2/page.tsx"
text = read(path)
text = text.replace("styles.sandraKontaktwissenList", "styles.sandraKnowledgeList")
text = text.replace("styles.sandraMemoryList", "styles.sandraKnowledgeList")
text = transform_literals(
    text,
    [
        ("Aktiv / MVP", "Aktiv / verfügbar"),
        ("MVP klar gekennzeichnet", "Produktstatus klar gekennzeichnet"),
        ("MVP-Workflow", "Produkt-Workflow"),
        ("MVP-Workspace", "Workspace"),
        ("MVP-Kern", "Produktkern"),
        ("Dieses MVP", "Diese aktuelle Version"),
        ("dieses MVP", "diese aktuelle Version"),
        ("im MVP", "in der aktuellen Version"),
        ("Memory", "Kontaktwissen"),
        ("Fan-Analyse-Report", "Kommunikationsübersicht"),
        ("DSGVO-konform", "datenschutzorientiert"),
    ],
)
write(path, text)
residual = residual_literals(
    text,
    ("Memory", "Fan-Analyse-Report", "MVP-Workflow", "MVP-Workspace", "DSGVO-konform"),
)
if residual:
    raise SystemExit(f"landing page still contains legacy public literals: {residual[:20]}")
if "styles.sandraKnowledgeList" not in text:
    raise SystemExit("landing page knowledge-list class was not normalized")


# Keep the matching CSS-module identifier aligned with the TSX component.
path = "src/app/landing-v2/landing-v2.module.css"
text = read(path)
text = text.replace(".sandraMemoryList", ".sandraKnowledgeList")
text = text.replace(".sandraKontaktwissenList", ".sandraKnowledgeList")
write(path, text)
if ".sandraKnowledgeList" not in text:
    raise SystemExit("landing CSS knowledge-list class was not normalized")
if ".sandraMemoryList" in text or ".sandraKontaktwissenList" in text:
    raise SystemExit("legacy landing CSS knowledge-list class remains")


# ---------------------------------------------------------------------------
# Translation map: update both keys and English values in quoted copy only.
# ---------------------------------------------------------------------------
path = "src/lib/fanmindCopy.ts"
text = read(path)
text = transform_literals(
    text,
    [
        ("Aktiv / MVP", "Aktiv / verfügbar"),
        ("MVP klar gekennzeichnet", "Produktstatus klar gekennzeichnet"),
        ("MVP clearly labeled", "Product status clearly labeled"),
        ("MVP-Workflow", "Produkt-Workflow"),
        ("MVP workflow", "product workflow"),
        ("MVP-Workspace", "Workspace"),
        ("MVP workspace", "workspace"),
        ("MVP-Kern", "Produktkern"),
        ("MVP core", "product core"),
        ("Dieses MVP", "Diese aktuelle Version"),
        ("This MVP", "This current version"),
        ("dieses MVP", "diese aktuelle Version"),
        ("the MVP", "the current version"),
        ("im MVP", "in der aktuellen Version"),
        ("in the MVP", "in the current version"),
        ("MVP focus", "current-version focus"),
        ("Memory", "Kontaktwissen"),
        ("memory", "contact knowledge"),
        ("Fan-Analyse-Report", "Kommunikationsübersicht"),
        ("Fan analysis report", "Communication overview"),
        ("fan analysis report", "communication overview"),
        ("DSGVO-konform", "datenschutzorientiert"),
        ("GDPR-minded", "privacy-oriented"),
    ],
)
write(path, text)
residual = residual_literals(
    text,
    (
        "Memory",
        "memory",
        "Fan-Analyse-Report",
        "Fan analysis report",
        "fan analysis report",
        "MVP-Workflow",
        "MVP workspace",
        "MVP focus",
        "DSGVO-konform",
    ),
)
if residual:
    raise SystemExit(f"translation map still contains legacy public literals: {residual[:30]}")
for required in [
    '"✓ Produktstatus klar gekennzeichnet": "✓ Product status clearly labeled"',
    '"mit Kontaktwissen": "with contact knowledge"',
    '"Kommunikationsübersicht": "Communication overview"',
    '"Wie schützt FanMind meine Daten?": "How does FanMind protect my data?"',
]:
    if required not in text:
        raise SystemExit(f"translation mapping missing: {required}")


# ---------------------------------------------------------------------------
# Strengthen truth checks now that internal identifiers are also aligned.
# ---------------------------------------------------------------------------
path = "scripts/verify-product-truth.mjs"
text = read(path)
text = text.replace(
    "/(?:Fan-Analyse-Report|Memory|MVP-Workflow|MVP-Workspace|DSGVO-konform)/iu",
    "/(?:Fan-Analyse-Report|Memory|\\bMVP\\b|DSGVO-konform)/iu",
)
translation_guard = """forbidIn(
  "src/lib/fanmindCopy.ts",
  /(?:Fan-Analyse-Report|Fan analysis report|Memory|\\bMVP\\b|DSGVO-konform)/iu,
  "Öffentliche Übersetzungen enthalten veraltete oder missverständliche Produktbegriffe.",
);
"""
if "Öffentliche Übersetzungen enthalten veraltete" not in text:
    anchor = """forbidIn(
  "src/app/landing-v2/FaqAccordion.tsx",
"""
    if anchor not in text:
        raise SystemExit("truth translation guard anchor missing")
    text = text.replace(anchor, translation_guard + anchor, 1)
write(path, text)
if "Öffentliche Übersetzungen enthalten veraltete" not in text:
    raise SystemExit("translation truth guard was not added")

print("Landing identifiers, visible copy and translation keys are aligned.")
