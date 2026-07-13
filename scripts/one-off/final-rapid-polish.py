#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, text: str) -> None:
    (ROOT / path).write_text(text, encoding="utf-8")


def replace_once(text: str, old: str, new: str, *, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one occurrence, found {count}")
    return text.replace(old, new, 1)


def replace_all(text: str, old: str, new: str, *, label: str, minimum: int = 1) -> str:
    count = text.count(old)
    if count < minimum:
        raise SystemExit(f"{label}: expected at least {minimum} occurrence(s), found {count}")
    return text.replace(old, new)


def append_once(text: str, marker: str, addition: str, *, label: str) -> str:
    if addition.strip() in text:
        return text
    if marker not in text:
        raise SystemExit(f"{label}: append marker not found")
    return text.rstrip() + "\n\n" + addition.strip() + "\n"


# ---------------------------------------------------------------------------
# Contact detail: real author labels, truthful timeline name and overlap guards.
# ---------------------------------------------------------------------------
path = "src/app/fans/[id]/page.tsx"
text = read(path)
text = replace_once(
    text,
    """          <FanDetailContent\n            contact={contact}\n""",
    """          <FanDetailContent\n            workspaceName={workspace.name}\n            contact={contact}\n""",
    label="contact detail prop",
)
text = replace_once(
    text,
    """function FanDetailContent({\n  contact,\n""",
    """function FanDetailContent({\n  workspaceName,\n  contact,\n""",
    label="contact detail destructuring",
)
text = replace_once(
    text,
    """}: {\n  contact: ContactRow;\n""",
    """}: {\n  workspaceName: string;\n  contact: ContactRow;\n""",
    label="contact detail type",
)
text = replace_once(
    text,
    """  const timeline = filteredMessages.length\n    ? buildMessageTimeline(filteredMessages, contact, facebookReplyTarget)\n    : [];\n""",
    """  const timeline = filteredMessages.length\n    ? buildMessageTimeline(\n        filteredMessages,\n        contact,\n        facebookReplyTarget,\n        workspaceName,\n        locale,\n      )\n    : [];\n""",
    label="timeline call",
)
text = replace_once(
    text,
    """              <strong>Team Inbox</strong>\n""",
    """              <strong>\n                {workspaceName ||\n                  (locale === \"en\" ? \"Workspace team\" : \"Workspace-Team\")}\n              </strong>\n""",
    label="owner label",
)
text = replace_once(
    text,
    """          aria-label={wt(locale, \"Kanalübergreifender Verlauf\")}\n""",
    """          aria-label={wt(locale, \"Kanalübergreifender Nachrichtenverlauf\")}\n""",
    label="timeline aria",
)
text = replace_once(
    text,
    """                <p className={dashboardStyles.eyebrow}>\n                  Unified Inbox Timeline\n                </p>\n                <h3>{wt(locale, \"Kanalübergreifender Verlauf\")}</h3>\n""",
    """                <p className={dashboardStyles.eyebrow}>\n                  {wt(locale, \"Nachrichtenverlauf\")}\n                </p>\n                <h3>{wt(locale, \"Kanalübergreifender Nachrichtenverlauf\")}</h3>\n""",
    label="timeline heading",
)
text = replace_once(
    text,
    """                    className={`${styles.message} ${item.direction === \"Fan\" ? styles.messageFan : styles.messageTeam}`}\n""",
    """                    className={`${styles.message} ${item.directionKind === \"inbound\" ? styles.messageFan : styles.messageTeam}`}\n""",
    label="timeline direction class",
)
text = replace_once(
    text,
    """function buildMessageTimeline(\n  messages: ConversationMessageRow[],\n  contact: ContactRow,\n  facebookReplyTarget: ContactReplyTargetRow | null,\n) {\n  return messages.map((message) => ({\n    id: message.id,\n    createdAt: message.created_at,\n    avatar:\n      message.direction === \"inbound\"\n        ? \"F\"\n        : message.direction === \"note\"\n          ? \"N\"\n          : \"T\",\n    direction: formatDirection(message.direction, message.author_label),\n""",
    """function buildMessageTimeline(\n  messages: ConversationMessageRow[],\n  contact: ContactRow,\n  facebookReplyTarget: ContactReplyTargetRow | null,\n  workspaceName: string,\n  locale: FanMindLanguage,\n) {\n  return messages.map((message) => ({\n    id: message.id,\n    createdAt: message.created_at,\n    avatar:\n      message.direction === \"inbound\"\n        ? (contact.display_name || contact.handle || \"K\")\n            .trim()\n            .charAt(0)\n            .toUpperCase()\n        : message.direction === \"note\"\n          ? \"N\"\n          : (workspaceName || \"T\").trim().charAt(0).toUpperCase(),\n    directionKind: message.direction,\n    direction: formatTimelineDirection(message, contact, workspaceName, locale),\n""",
    label="timeline builder",
)
helper = """
function formatTimelineDirection(
  message: ConversationMessageRow,
  contact: ContactRow,
  workspaceName: string,
  locale: FanMindLanguage,
): string {
  const author = message.author_label?.trim();
  const genericAuthors = new Set([
    "Fan",
    "FanMind Team",
    "Team",
    "Demo",
    "Demo User",
    "Demo Nutzer",
  ]);

  if (message.direction === "note") {
    if (author && author !== "Antwortentwurf" && !genericAuthors.has(author)) {
      return author;
    }
    return locale === "en" ? "Note" : "Notiz";
  }

  if (message.direction === "inbound") {
    if (author && !genericAuthors.has(author)) return author;
    return (
      contact.display_name ||
      contact.handle ||
      (locale === "en" ? "Contact" : "Kontakt")
    );
  }

  if (author && !genericAuthors.has(author)) return author;
  return workspaceName || (locale === "en" ? "Workspace team" : "Workspace-Team");
}
"""
text = replace_once(
    text,
    "\nfunction formatDirection(value: string, authorLabel?: string | null): string {\n",
    helper + "\nfunction formatDirection(value: string, authorLabel?: string | null): string {\n",
    label="timeline author helper",
)
text = text.replace(
    'return "Fan-Analyse-Report wurde aktualisiert.";',
    'return "Kommunikationsübersicht wurde aktualisiert.";',
)
write(path, text)

path = "src/lib/workspaceCopy.ts"
text = read(path)
text = replace_once(
    text,
    '  "Kanalübergreifender Verlauf": "Cross-channel message history",\n',
    '  "Kanalübergreifender Verlauf": "Cross-channel message history",\n  "Nachrichtenverlauf": "Message history",\n',
    label="workspace timeline translation",
)
write(path, text)

path = "src/app/fans/[id]/fan-detail.module.css"
text = read(path)
text = append_once(
    text,
    ".detailStack",
    """
/* Final overlap guard for narrow laptops, zoomed browsers and long labels. */
.contactHeaderTop,
.cardHeader,
.messageMeta,
.replyFooter {
  min-width: 0;
}

.contactHeaderTop > *,
.cardHeader > *,
.messageMeta > * {
  min-width: 0;
  max-width: 100%;
}

.channelTabs,
.sourceTabs {
  max-width: 100%;
  overflow-x: auto;
  scrollbar-width: thin;
}

.messageBubble,
.messageBubble p,
.syncHint,
.demoCompactNotice,
.reportIntro {
  min-width: 0;
  overflow-wrap: anywhere;
  word-break: break-word;
}

@media (max-width: 1320px) {
  .workbenchGrid {
    grid-template-columns: minmax(0, 1fr) minmax(290px, 360px);
  }
}

@media (max-width: 1160px) {
  .workbenchGrid {
    grid-template-columns: 1fr;
  }

  .copilot {
    width: 100%;
  }
}
""",
    label="contact detail css",
)
write(path, text)


# ---------------------------------------------------------------------------
# Landing page/customer language: one roadmap, no customer-facing MVP jargon,
# privacy wording without a blanket guarantee, and Kontaktwissen terminology.
# ---------------------------------------------------------------------------
path = "src/app/landing-v2/page.tsx"
text = read(path)
replacements = [
    ('{ label: "MVP", href: "#features" }', '{ label: "Funktionen", href: "#features" }'),
    ('title: "Ehrliche Roadmap"', 'title: "Roadmap"'),
    ('title: "CSV-Import & Memory"', 'title: "CSV-Import & Kontaktwissen"'),
    ('"DSGVO-konform gedacht"', '"Datenschutzorientiert entwickelt"'),
]
for old, new in replacements:
    text = replace_once(text, old, new, label=f"landing replacement {old}")
text = text.replace("Fan-Gedächtnis", "Kontaktwissen")
text = text.replace("MVP-Kern", "Produktkern")
text = text.replace("MVP-Workspace", "Workspace")
text = text.replace("MVP-Ansicht", "aktuelle Ansicht")
text = text.replace("keine Vollsuite im MVP", "keine Vollsuite in der aktuellen Version")
text = text.replace("im MVP", "in der aktuellen Version")
write(path, text)

path = "src/lib/fanmindCopy.ts"
text = read(path)
text = text.replace("Fan-Gedächtnis", "Kontaktwissen")
text = text.replace("fan memory", "contact knowledge")
text = text.replace("AI-Infos / Kontaktwissen", "Kontaktwissen")
text = text.replace("AI info / contact knowledge", "Contact knowledge")
text = text.replace("Fan-Analyse-Report", "Kommunikationsübersicht")
text = text.replace("fan analysis report", "communication overview")
text = text.replace("MVP-Kern", "Produktkern")
text = text.replace("MVP core", "product core")
text = text.replace("MVP-Workspace", "Workspace")
text = text.replace("MVP workspace", "workspace")
text = text.replace("keine Vollsuite im MVP", "keine Vollsuite in der aktuellen Version")
text = text.replace("no full suite in the MVP", "no full suite in the current version")
text = text.replace("im MVP", "in der aktuellen Version")
text = text.replace("in the MVP", "in the current version")
text = text.replace('"DSGVO-konform gedacht": "Designed with GDPR in mind"', '"Datenschutzorientiert entwickelt": "Designed with privacy in mind"')
text = replace_once(
    text,
    '  "Produkt": "Product",\n',
    '  "Produkt": "Product",\n  "Funktionen": "Features",\n  "CSV-Import & Kontaktwissen": "CSV import & contact knowledge",\n',
    label="landing translation additions",
)
write(path, text)

path = "src/app/impressum/page.tsx"
text = read(path)
text = text.replace("Antwort- und Memory-Assistent", "Antwort- und Kontaktwissen-Assistent")
text = text.replace("MVP- und Pilotphase", "Produkt- und Pilotphase")
text = text.replace("Memory-Funktionen", "Kontaktwissen")
text = text.replace(
    "oder Discord. Ebenfalls nicht Bestandteil der aktuellen Version sind Scraping,\n               automatische Nachrichtenversendung, autonome Kommunikation und Zahlungslogik.",
    "oder Discord. Ebenfalls nicht Bestandteil der aktuellen Version sind Scraping,\n               automatische Nachrichtenversendung und autonome Kommunikation. Freigegebene\n               Checkout- und Rechnungsprozesse werden davon getrennt und transparent ausgewiesen.",
)
write(path, text)


# ---------------------------------------------------------------------------
# AI tiers: Standard included, Plus paid upgrade, Ultra higher-priced premium.
# Prices/credits remain intentionally undecided until commercial approval.
# ---------------------------------------------------------------------------
path = "src/app/settings/AccountSections.tsx"
text = read(path)
text = text.replace("mailto:hello@fanmind.ch", "mailto:kontakt@fanmind.ch")
text = replace_once(
    text,
    """  {\n    key: \"ai_standard\",\n    name: \"KI Standard\",\n    purpose: \"Antwortvorschläge für den normalen CRM-Alltag.\",\n    status: \"Aktiv\",\n    price: \"inklusive nach Paket\",\n    features: [\"Basis-KI\", \"Antwortvorschläge\", \"CRM-Workflow\"],\n  },\n""",
    """  {\n    key: \"ai_standard\",\n    name: \"KI Standard\",\n    purpose:\n      \"Im Basispaket enthaltene KI für Antwortvorschläge, Kontaktwissen und Follow-ups.\",\n    status: \"Aktiv\",\n    price: \"im Basispaket enthalten\",\n    features: [\n      \"Standard-Kontingent\",\n      \"Antwortvorschläge\",\n      \"Kontaktwissen & Follow-ups\",\n      \"manuelle Prüfung vor dem Versand\",\n    ],\n  },\n""",
    label="AI standard card",
)
text = replace_once(
    text,
    """  {\n    key: \"ai_plus\",\n    name: \"KI Plus\",\n    purpose:\n      \"Mehr Vorschläge, feinere Memory- und Follow-up-Unterstützung nach manueller Freigabe.\",\n    status: \"Auf Anfrage\",\n    price: \"auf Anfrage\",\n    features: [\"manuelle Prüfung\", \"keine automatische Buchung\"],\n    showComingSoonMark: true,\n  },\n""",
    """  {\n    key: \"ai_plus\",\n    name: \"KI Plus\",\n    purpose:\n      \"Kostenpflichtige Erweiterung mit leistungsstärkerer KI, mehr Nutzung und größerem Gesprächskontext.\",\n    status: \"Coming Soon\",\n    price: \"Zusatzpreis wird vor Freigabe festgelegt\",\n    features: [\n      \"leistungsstärkere Modellklasse\",\n      \"höheres KI-Kontingent\",\n      \"größerer Gesprächskontext\",\n      \"weiterhin manuelle Freigabe\",\n    ],\n    showComingSoonMark: true,\n  },\n""",
    label="AI plus card",
)
text = replace_once(
    text,
    """  {\n    key: \"ai_ultra\",\n    name: \"KI Ultra\",\n    purpose: \"Erweiterter KI-Spielraum für größere Workspaces nach Prüfung.\",\n    status: \"Coming Soon\",\n    price: \"auf Anfrage\",\n    features: [\"Roadmap-Vorschau\", \"spätere Freigabe\"],\n    showComingSoonMark: true,\n  },\n""",
    """  {\n    key: \"ai_ultra\",\n    name: \"KI Ultra\",\n    purpose:\n      \"Höherpreisige Premium-Erweiterung mit der stärksten freigegebenen KI, den höchsten Kontingenten und erweitertem Funktionsumfang.\",\n    status: \"Coming Soon\",\n    price: \"höherer Zusatzpreis als KI Plus\",\n    features: [\n      \"stärkste freigegebene Modellklasse\",\n      \"höchstes KI-Kontingent\",\n      \"größter Gesprächskontext\",\n      \"keine automatische Sendung\",\n    ],\n    showComingSoonMark: true,\n  },\n""",
    label="AI ultra card",
)
text = replace_once(
    text,
    """          <p className={profileStyles.invoiceValue}>\n            Vorbereitete Erweiterungen bleiben klar als verfügbar, vorbereitet\n            oder Coming Soon markiert.\n          </p>\n""",
    """          <p className={profileStyles.invoiceValue}>\n            KI Standard ist im Basispaket enthalten. KI Plus und KI Ultra sind\n            separat berechnete Erweiterungen und bleiben bis zur Preis-,\n            Kontingent- und Billing-Freigabe als Coming Soon markiert.\n          </p>\n""",
    label="add-on section copy",
)
text = replace_once(
    text,
    """        {ADD_ON_CARDS.map((addOn) => {\n          const showStatusBadge = addOn.status === \"Aktiv\";\n""",
    """        {ADD_ON_CARDS.map((addOn) => {\n          const showStatusBadge = true;\n""",
    label="add-on status badges",
)
text = replace_once(
    text,
    """              {addOn.showComingSoonMark ? (\n                <div className={profileStyles.cardMarkSlot}>\n                  <ComingSoonMark\n                    size=\"small\"\n                    className={profileStyles.settingsComingSoonMark}\n                  />\n                </div>\n              ) : (\n                <p className={profileStyles.addOnPrice}>{addOn.price}</p>\n              )}\n""",
    """              <p className={profileStyles.addOnPrice}>{addOn.price}</p>\n              {addOn.showComingSoonMark ? (\n                <div className={profileStyles.cardMarkSlot}>\n                  <ComingSoonMark\n                    size=\"small\"\n                    className={profileStyles.settingsComingSoonMark}\n                  />\n                </div>\n              ) : null}\n""",
    label="add-on price display",
)
write(path, text)

path = "src/config/roadmap.ts"
text = read(path)
text = replace_once(
    text,
    '    title: "KI Plus, Ultra & Prompts",\n',
    '    title: "Kostenpflichtige KI-Erweiterungen",\n',
    label="roadmap AI tier title",
)
text = text.replace(
    '{ label: "KI Plus", state: "later", status: "Roadmap" }',
    '{ label: "KI Plus", state: "later", status: "bezahlte Erweiterung" }',
)
text = text.replace(
    '{ label: "KI Ultra", state: "later", status: "Roadmap" }',
    '{ label: "KI Ultra", state: "later", status: "Premium-Erweiterung" }',
)
write(path, text)

path = "docs/SOURCE_OF_TRUTH.md"
text = read(path)
anchor = """Begründung für 312 €/Monat: FanMind ist kein Billig-Tool und der Aufwand liegt in sicherer CRM-Struktur, KI, Memory, Follow-ups, Datenpflege, Demo-Setup, Support, Security/RLS und späterer kontrollierter Integrationsfähigkeit. Die Preislogik soll diesen Arbeitsaufwand und B2B-Charakter widerspiegeln.\n"""
addition = """

### KI-Leistungsstufen / Add-ons

KI Standard, KI Plus und KI Ultra sind keine eigenständigen CRM-Hauptpakete. Sie sind KI-Leistungsstufen innerhalb eines gebuchten FanMind-Pakets:

- **KI Standard** ist im Basispaket enthalten und deckt den normalen Antwort-, Kontaktwissen- und Follow-up-Workflow ab.
- **KI Plus** ist eine separat berechnete Erweiterung mit leistungsstärkerer KI, höherem Kontingent und größerem Gesprächskontext.
- **KI Ultra** ist eine höherpreisige Premium-Erweiterung mit der stärksten freigegebenen Modellklasse, den höchsten Kontingenten und erweitertem Funktionsumfang.
- Plus und Ultra dürfen erst automatisch buchbar werden, wenn Zusatzpreise, Kontingente, Modellklassen, Wechsel/Kündigung und Stripe-Subscription-Items freigegeben sind.
- Für alle Stufen gilt: keine automatische Sendung; der Mensch prüft und sendet final selbst.
"""
if "### KI-Leistungsstufen / Add-ons" not in text:
    if anchor not in text:
        raise SystemExit("source of truth AI tier anchor missing")
    text = text.replace(anchor, anchor + addition, 1)
text = text.replace("KI, Memory, Follow-ups", "KI, Kontaktwissen, Follow-ups")
write(path, text)


# ---------------------------------------------------------------------------
# Truth guardrails for the final visible-polish decisions.
# ---------------------------------------------------------------------------
path = "scripts/verify-product-truth.mjs"
text = read(path)
text = replace_once(
    text,
    'forbid(/Fanmind@fanmind\\.ch/u, "Uneinheitliche Anfrageadresse gefunden; nutze kontakt@fanmind.ch.");\n',
    'forbid(/Fanmind@fanmind\\.ch/u, "Uneinheitliche Anfrageadresse gefunden; nutze kontakt@fanmind.ch.");\nforbid(/hello@fanmind\\.ch/iu, "Uneinheitliche Kontaktadresse gefunden; nutze kontakt@fanmind.ch.");\nforbid(/Ehrliche Roadmap/iu, "Öffentliche Roadmap darf nicht mehrfach oder werblich als Ehrliche Roadmap bezeichnet werden.");\nforbid(/Unified Inbox Timeline/iu, "Nicht aktive Inbox-Synchronisierung darf nicht als Unified Inbox bezeichnet werden.");\n',
    label="truth forbidden terms",
)
insert_anchor = """requireText(\n  \"src/lib/referrals.ts\",\n  \"REFERRAL_GROWTH_WINDOW_CAP = 2000\",\n  \"Das Referral Growth Window muss bei 2.000 aktiven zahlenden Workspaces gedeckelt sein.\",\n);\n"""
insert = insert_anchor + """
requireText(
  "src/app/settings/AccountSections.tsx",
  "KI Standard ist im Basispaket enthalten",
  "Die Paketansicht muss KI Standard als enthalten und Plus/Ultra als separate Erweiterungen einordnen.",
);
requireText(
  "src/app/settings/AccountSections.tsx",
  "höherer Zusatzpreis als KI Plus",
  "KI Ultra muss als höherpreisige Erweiterung oberhalb von KI Plus beschrieben werden.",
);
requireText(
  "docs/SOURCE_OF_TRUTH.md",
  "### KI-Leistungsstufen / Add-ons",
  "Die Source of Truth muss die beschlossenen KI-Leistungsstufen dokumentieren.",
);
"""
text = replace_once(text, insert_anchor, insert, label="truth AI tier checks")
write(path, text)


# Report residual customer-facing terms. These are warnings for manual review,
# not automatic replacements of internal identifiers/document history.
checks = {
    "src/app/landing-v2/page.tsx": ["Ehrliche Roadmap", "Unified Inbox Timeline", 'label: "MVP"'],
    "src/app/fans/[id]/page.tsx": ["Unified Inbox Timeline", "Team Inbox"],
    "src/app/settings/AccountSections.tsx": ["hello@fanmind.ch"],
}
for filename, needles in checks.items():
    content = read(filename)
    for needle in needles:
        if needle in content:
            raise SystemExit(f"residual public term in {filename}: {needle}")

print("Final FanMind rapid-polish codemod applied successfully.")
