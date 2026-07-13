#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, text: str) -> None:
    (ROOT / path).write_text(text, encoding="utf-8")


def replace(text: str, old: str, new: str) -> str:
    return text.replace(old, new)


def require(text: str, needle: str, label: str) -> None:
    if needle not in text:
        raise SystemExit(f"{label}: expected text missing: {needle!r}")


def forbid(text: str, needle: str, label: str) -> None:
    if needle in text:
        raise SystemExit(f"{label}: legacy text remains: {needle!r}")


# ---------------------------------------------------------------------------
# Landing page: remove remaining customer-facing MVP/Memory/report jargon.
# ---------------------------------------------------------------------------
path = "src/app/landing-v2/page.tsx"
text = read(path)
for old, new in [
    (
        "FanMind erstellt passende Entwürfe aus Kontext und Memory.",
        "FanMind erstellt passende Entwürfe aus Kontext und Kontaktwissen.",
    ),
    (
        "Demo-Workspace mit realistischem MVP-Workflow",
        "Demo-Workspace mit realistischem Produkt-Workflow",
    ),
    (
        "Kontakte/Fans, CSV-Import, Notizen und Memory testen",
        "Kontakte/Fans, CSV-Import, Notizen und Kontaktwissen testen",
    ),
    (
        "CSV-Import, Notizen und Kontaktwissen / Memory",
        "CSV-Import, Notizen und Kontaktwissen",
    ),
    (
        "Kontakte/Fans, CSV-Import und Memory",
        "Kontakte/Fans, CSV-Import und Kontaktwissen",
    ),
    (
        "Follow-ups, KI-Antwortvorschläge und Fan-Analyse-Report testen",
        "Follow-ups, KI-Antwortvorschläge und Kommunikationsübersicht testen",
    ),
    (
        "KI-Antwortvorschläge und Fan-Analyse-Report",
        "KI-Antwortvorschläge und Kommunikationsübersicht",
    ),
    ("Fan-Analyse-Report", "Kommunikationsübersicht"),
    ("Sicher & DSGVO-konform", "Sicher & datenschutzorientiert"),
    ("DSGVO-konform gedacht", "Datenschutzorientiert entwickelt"),
    (
        "Sind meine Daten DSGVO-konform geschützt?",
        "Wie schützt FanMind meine Daten?",
    ),
    ("MVP-Workflow", "Produkt-Workflow"),
    ("MVP-Workspace", "Workspace"),
    ("MVP-Kern", "Produktkern"),
    ("im MVP", "in der aktuellen Version"),
]:
    text = replace(text, old, new)

# Capitalized Memory in this public file is customer copy, not an identifier.
text = text.replace("Memory", "Kontaktwissen")
write(path, text)

for legacy in [
    "Memory",
    "Fan-Analyse-Report",
    "MVP-Workflow",
    "MVP-Workspace",
    "DSGVO-konform",
]:
    forbid(text, legacy, f"{path} public terminology")
require(text, "Kommunikationsübersicht", f"{path} report terminology")
require(text, "Kontaktwissen", f"{path} contact knowledge terminology")


# ---------------------------------------------------------------------------
# Translation map: keep German and English customer copy aligned.
# ---------------------------------------------------------------------------
path = "src/lib/fanmindCopy.ts"
text = read(path)
for old, new in [
    (
        '"Notizen und Kontaktwissen / Memory": "Notes and contact knowledge"',
        '"Notizen und Kontaktwissen": "Notes and contact knowledge"',
    ),
    (
        '"Kontakte/Fans, CSV-Import und Memory": "Contacts/fans, CSV import and memory"',
        '"Kontakte/Fans, CSV-Import und Kontaktwissen": "Contacts/fans, CSV import and contact knowledge"',
    ),
    (
        '"Demo-Workspace mit realistischem MVP-Workflow": "Demo workspace with a realistic MVP workflow"',
        '"Demo-Workspace mit realistischem Produkt-Workflow": "Demo workspace with a realistic product workflow"',
    ),
    (
        '"Sind meine Daten DSGVO-konform geschützt?": "Is my data protected in a GDPR-minded way?"',
        '"Wie schützt FanMind meine Daten?": "How does FanMind protect my data?"',
    ),
    (
        '"Sicher & DSGVO-konform": "Secure & GDPR-minded"',
        '"Sicher & datenschutzorientiert": "Secure & privacy-oriented"',
    ),
    (
        '"Fan-Analyse-Report": "Fan analysis report"',
        '"Kommunikationsübersicht": "Communication overview"',
    ),
    ("Fan-Analyse-Report", "Kommunikationsübersicht"),
    ("Fan analysis report", "Communication overview"),
    ("fan analysis report", "communication overview"),
    ("Fan memory", "Contact knowledge"),
    ("fan memory", "contact knowledge"),
    ("MVP workflow", "product workflow"),
    ("MVP workspace", "workspace"),
    ("MVP focus", "current-version focus"),
    ("MVP core", "product core"),
    ("in the MVP", "in the current version"),
]:
    text = replace(text, old, new)
write(path, text)

for legacy in [
    "Notizen und Kontaktwissen / Memory",
    "Fan analysis report",
    "fan analysis report",
    "fan memory",
    "MVP workspace",
    "DSGVO-konform geschützt",
]:
    forbid(text, legacy, f"{path} translation consistency")


# ---------------------------------------------------------------------------
# FAQ compact labels follow the new non-guaranteeing privacy question.
# ---------------------------------------------------------------------------
path = "src/app/landing-v2/FaqAccordion.tsx"
text = read(path)
text = replace(
    text,
    '  "Sind meine Daten DSGVO-konform geschützt?":\n    "Wie schützt FanMind meine Daten?",',
    '  "Wie schützt FanMind meine Daten?": "Wie schützt FanMind meine Daten?",',
)
text = replace(
    text,
    '  "Is my data protected in a GDPR-minded way?":\n    "How does FanMind protect my data?",',
    '  "How does FanMind protect my data?": "How does FanMind protect my data?",',
)
write(path, text)
forbid(text, "DSGVO-konform", f"{path} privacy wording")


# ---------------------------------------------------------------------------
# Site metadata and social preview use the same customer terminology.
# ---------------------------------------------------------------------------
path = "src/app/brandMetadata.ts"
text = read(path)
text = replace(
    text,
    "KI-Antwortvorschläge, Memory und Follow-ups",
    "KI-Antwortvorschläge, Kontaktwissen und Follow-ups",
)
write(path, text)
forbid(text, "Memory", f"{path} metadata terminology")

path = "src/app/opengraph-image.tsx"
text = read(path)
text = replace(
    text,
    "['Kontakte', 'KI-Antwortvorschläge', 'Memory', 'Follow-ups']",
    "['Kontakte', 'KI-Antwortvorschläge', 'Kontaktwissen', 'Follow-ups']",
)
write(path, text)
forbid(text, "'Memory'", f"{path} preview terminology")


# ---------------------------------------------------------------------------
# Legal product-status copy: keep the already corrected staged integration
# and billing statement, while supporting an older branch state idempotently.
# ---------------------------------------------------------------------------
path = "src/app/impressum/page.tsx"
text = read(path)
old_block = """            <h3>Keine aktiven Social-Media-Integrationen</h3>
            <p>
              Aktuell bestehen keine produktiven Social-Media-Synchronisierungen und keine
              automatischen Integrationen mit Instagram, TikTok, Facebook, X / Twitter, WhatsApp
              oder Discord. Ebenfalls nicht Bestandteil der aktuellen Version sind Scraping,
              automatische Nachrichtenversendung, autonome Kommunikation und Zahlungslogik.
            </p>
"""
current_block = """            <h3>Integrationen und Abrechnung</h3>
            <p>
              Produktive Social-Media-Synchronisierungen sind nur dort verfügbar, wo sie ausdrücklich
              als freigegeben ausgewiesen werden. Scraping, autonome Kommunikation und automatischer
              Nachrichtenversand sind nicht Bestandteil des Standard-Workflows. Freigegebene
              Checkout-, Zahlungs- und Rechnungsprozesse werden getrennt vom Kommunikationsworkflow
              über den jeweils ausgewiesenen Zahlungsanbieter abgewickelt.
            </p>
"""
if old_block in text:
    text = text.replace(old_block, current_block, 1)
write(path, text)
forbid(text, "Keine aktiven Social-Media-Integrationen", f"{path} integration truth")
forbid(text, "autonome Kommunikation und Zahlungslogik", f"{path} billing truth")
require(text, "Integrationen und Abrechnung", f"{path} integration truth")
require(text, "Checkout-, Zahlungs- und Rechnungsprozesse", f"{path} billing truth")


# ---------------------------------------------------------------------------
# Normalize every channel asset inside the shared PlatformLogo component.
# ---------------------------------------------------------------------------
path = "src/components/PlatformLogo.module.css"
text = read(path)
text = replace(
    text,
    """.assetIcon {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}
""",
    """.assetIcon {
  width: 100%;
  height: 100%;
  display: block;
  box-sizing: border-box;
  object-fit: contain;
  padding: max(2px, calc((var(--platform-logo-size) - var(--platform-logo-icon-size)) / 2));
}
""",
)
write(path, text)
require(text, "object-fit: contain", f"{path} normalized channel assets")
forbid(text, "object-fit: cover", f"{path} cropped channel assets")


# ---------------------------------------------------------------------------
# Product-truth CI guards the newly completed public-copy decisions.
# ---------------------------------------------------------------------------
path = "scripts/verify-product-truth.mjs"
text = read(path)
if '  "src/app/landing-v2/FaqAccordion.tsx",\n' not in text:
    text = replace(
        text,
        '  "src/app/landing-v2/page.tsx",\n',
        '  "src/app/landing-v2/page.tsx",\n  "src/app/landing-v2/FaqAccordion.tsx",\n  "src/app/brandMetadata.ts",\n  "src/app/opengraph-image.tsx",\n  "src/components/PlatformLogo.module.css",\n',
    )

forbid_function = """function forbidIn(file, pattern, explanation) {
  const text = content(file);
  if (pattern.test(text)) {
    errors.push(`${file}: ${explanation}`);
  }
}

"""
if "function forbidIn(" not in text:
    anchor = """function warn(pattern, explanation) {
"""
    if anchor not in text:
        raise SystemExit("truth helper anchor missing")
    text = text.replace(anchor, forbid_function + anchor, 1)

truth_checks = """
forbidIn(
  "src/app/landing-v2/page.tsx",
  /(?:Fan-Analyse-Report|Memory|MVP-Workflow|MVP-Workspace|DSGVO-konform)/iu,
  "Öffentliche Landingpage enthält veraltete oder missverständliche Produktbegriffe.",
);
forbidIn(
  "src/app/landing-v2/FaqAccordion.tsx",
  /DSGVO-konform/iu,
  "Die FAQ darf Datenschutz nicht als pauschale Konformitätsgarantie formulieren.",
);
forbidIn(
  "src/app/brandMetadata.ts",
  /(?:Memory|MVP)/iu,
  "Öffentliche Metadaten müssen Kontaktwissen und aktuelle Produktbegriffe verwenden.",
);
forbidIn(
  "src/app/opengraph-image.tsx",
  /['\"]Memory['\"]/iu,
  "Das Social-Preview darf Memory nicht als sichtbaren Produktbegriff verwenden.",
);
forbidIn(
  "src/app/impressum/page.tsx",
  /Keine aktiven Social-Media-Integrationen|autonome Kommunikation und Zahlungslogik/iu,
  "Das Impressum muss den gestuften Integrations- und aktiven Billing-Stand korrekt beschreiben.",
);
requireText(
  "src/app/impressum/page.tsx",
  "Integrationen und Abrechnung",
  "Das Impressum muss den gestuften Integrations- und Billing-Status erklären.",
);
requireText(
  "src/components/PlatformLogo.module.css",
  "object-fit: contain",
  "Kanal-Logos müssen in der gemeinsamen Komponente einheitlich und ohne Beschneidung dargestellt werden.",
);
"""
if "Kanal-Logos müssen in der gemeinsamen Komponente" not in text:
    anchor = r"""warn(
  /\[BITTE FINAL EINTRAGEN/iu,
"""
    if anchor not in text:
        raise SystemExit("truth check insertion anchor missing")
    text = text.replace(anchor, truth_checks + "\n" + anchor, 1)
write(path, text)
require(text, "function forbidIn", f"{path} file-specific guard")
require(text, "object-fit: contain", f"{path} logo guard")


# ---------------------------------------------------------------------------
# Source of Truth records the public terminology and shared logo rule.
# ---------------------------------------------------------------------------
path = "docs/SOURCE_OF_TRUTH.md"
text = read(path)
section = """
### Verbindliche öffentliche Terminologie und Plattform-Logos

- Deutsche Oberfläche: **KI**; englische Oberfläche: **AI**.
- Nutzerseitig heißt der gespeicherte Kontext **Kontaktwissen**, nicht Memory oder Fan-Gedächtnis.
- Der Analysebereich heißt **Kommunikationsübersicht**, nicht Fan-Analyse-Report.
- Kundenseitige Seiten verwenden **Produkt**, **aktuelle Version** oder **Pilot**, nicht MVP-Jargon.
- Datenschutz wird konkret und überprüfbar beschrieben; es gibt keine pauschale DSGVO-Konformitätsgarantie in Marketingtexten.
- Alle Kanal-Logos werden über die gemeinsame `PlatformLogo`-Komponente dargestellt. Assets werden einheitlich skaliert und nicht beschnitten.
"""
if "### Verbindliche öffentliche Terminologie und Plattform-Logos" not in text:
    anchor = "## 4. Referral Growth Window"
    if anchor not in text:
        raise SystemExit("source-of-truth insertion anchor missing")
    text = text.replace(anchor, section.strip() + "\n\n" + anchor, 1)
write(path, text)
require(text, "Verbindliche öffentliche Terminologie", f"{path} terminology section")

print("Public copy, legal product-status wording and shared channel-logo sizing updated.")
