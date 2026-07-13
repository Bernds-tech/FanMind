#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

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


def append_once(text: str, addition: str) -> str:
    if addition.strip() in text:
        return text
    return text.rstrip() + "\n\n" + addition.strip() + "\n"


# ---------------------------------------------------------------------------
# Contact detail: truthful naming, real author labels and overlap guards.
# ---------------------------------------------------------------------------
path = "src/app/fans/[id]/page.tsx"
text = read(path)
text = replace_once(
    text,
    """          <FanDetailContent
            contact={contact}
""",
    """          <FanDetailContent
            workspaceName={workspace.name}
            contact={contact}
""",
    label="contact detail prop",
)
text = replace_once(
    text,
    """function FanDetailContent({
  contact,
""",
    """function FanDetailContent({
  workspaceName,
  contact,
""",
    label="contact detail destructuring",
)
text = replace_once(
    text,
    """  demoConnectionsDisabled,
  locale,
}: {
  contact: ContactRow;
""",
    """  demoConnectionsDisabled,
  locale,
}: {
  workspaceName: string;
  contact: ContactRow;
""",
    label="contact detail type",
)
text = replace_once(
    text,
    """  const timeline = filteredMessages.length
    ? buildMessageTimeline(filteredMessages, contact, facebookReplyTarget)
    : [];
""",
    """  const timeline = filteredMessages.length
    ? buildMessageTimeline(
        filteredMessages,
        contact,
        facebookReplyTarget,
        workspaceName,
        locale,
      )
    : [];
""",
    label="timeline call",
)
text = replace_once(
    text,
    """              <strong>Team Inbox</strong>
""",
    """              <strong>
                {workspaceName ||
                  (locale === "en" ? "Workspace team" : "Workspace-Team")}
              </strong>
""",
    label="owner label",
)
text = replace_once(
    text,
    """          aria-label={wt(locale, "Kanalübergreifender Verlauf")}
""",
    """          aria-label={wt(locale, "Kanalübergreifender Nachrichtenverlauf")}
""",
    label="timeline aria",
)
text = replace_once(
    text,
    """                <p className={dashboardStyles.eyebrow}>
                  Unified Inbox Timeline
                </p>
                <h3>{wt(locale, "Kanalübergreifender Verlauf")}</h3>
""",
    """                <p className={dashboardStyles.eyebrow}>
                  {wt(locale, "Nachrichtenverlauf")}
                </p>
                <h3>{wt(locale, "Kanalübergreifender Nachrichtenverlauf")}</h3>
""",
    label="timeline heading",
)
text = replace_once(
    text,
    """                    className={`${styles.message} ${item.direction === "Fan" ? styles.messageFan : styles.messageTeam}`}
""",
    """                    className={`${styles.message} ${item.directionKind === "inbound" ? styles.messageFan : styles.messageTeam}`}
""",
    label="timeline direction class",
)
text = replace_once(
    text,
    """function buildMessageTimeline(
  messages: ConversationMessageRow[],
  contact: ContactRow,
  facebookReplyTarget: ContactReplyTargetRow | null,
) {
  return messages.map((message) => ({
    id: message.id,
    createdAt: message.created_at,
    avatar:
      message.direction === "inbound"
        ? "F"
        : message.direction === "note"
          ? "N"
          : "T",
    direction: formatDirection(message.direction, message.author_label),
""",
    """function buildMessageTimeline(
  messages: ConversationMessageRow[],
  contact: ContactRow,
  facebookReplyTarget: ContactReplyTargetRow | null,
  workspaceName: string,
  locale: FanMindLanguage,
) {
  return messages.map((message) => ({
    id: message.id,
    createdAt: message.created_at,
    avatar:
      message.direction === "inbound"
        ? (contact.display_name || contact.handle || "K")
            .trim()
            .charAt(0)
            .toUpperCase()
        : message.direction === "note"
          ? "N"
          : (workspaceName || "T").trim().charAt(0).toUpperCase(),
    directionKind: message.direction,
    direction: formatTimelineDirection(message, contact, workspaceName, locale),
""",
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
)
write(path, text)


# ---------------------------------------------------------------------------
# Landing page/customer language.
# ---------------------------------------------------------------------------
path = "src/app/landing-v2/page.tsx"
text = read(path)
for old, new, label in [
    ('{ label: "MVP", href: "#features" }', '{ label: "Funktionen", href: "#features" }', "landing navigation"),
    ('title: "Ehrliche Roadmap"', 'title: "Roadmap"', "roadmap title"),
    ('title: "CSV-Import & Memory"', 'title: "CSV-Import & Kontaktwissen"', "contact knowledge feature"),
    ('"DSGVO-konform gedacht"', '"Datenschutzorientiert entwickelt"', "privacy wording"),
]:
    text = replace_once(text, old, new, label=label)
text = text.replace("Fan-Gedächtnis", "Kontaktwissen")
text = text.replace("MVP-Workspace", "Workspace")
text = text.replace("MVP-Ansicht", "aktuelle Ansicht")
text = text.replace("MVP-Kern", "Produktkern")
text = text.replace("keine Vollsuite im MVP", "keine Vollsuite in der aktuellen Version")
text = text.replace("im MVP", "in der aktuellen Version")
write(path, text)

path = "src/lib/fanmindCopy.ts"
text = read(path)
text = text.replace("Fan-Gedächtnis", "Kontaktwissen")
text = text.replace("Fan memory", "Contact knowledge")
text = text.replace("fan memory", "contact knowledge")
text = text.replace("AI-Infos / Kontaktwissen", "Kontaktwissen")
text = text.replace("AI info / contact knowledge", "Contact knowledge")
text = text.replace("Fan-Analyse-Report", "Kommunikationsübersicht")
text = text.replace("Fan analysis report", "Communication overview")
text = text.replace("fan analysis report", "communication overview")
text = text.replace("MVP-Workspace", "Workspace")
text = text.replace("MVP workspace", "workspace")
text = text.replace("MVP-Kern", "Produktkern")
text = text.replace("MVP core", "product core")
text = text.replace("keine Vollsuite im MVP", "keine Vollsuite in der aktuellen Version")
text = text.replace("no full suite in the MVP", "no full suite in the current version")
text = text.replace("im MVP", "in der aktuellen Version")
text = text.replace("in the MVP", "in the current version")
text = text.replace(
    '"DSGVO-konform gedacht": "Designed with GDPR in mind"',
    '"Datenschutzorientiert entwickelt": "Designed with privacy in mind"',
)
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
# KI Standard/Plus/Ultra as included / paid / premium add-ons.
# ---------------------------------------------------------------------------
path = "src/app/settings/AccountSections.tsx"
text = read(path)
text = text.replace("mailto:hello@fanmind.ch", "mailto:kontakt@fanmind.ch")
text = replace_once(
    text,
    """  {
    key: "ai_standard",
    name: "KI Standard",
    purpose: "Antwortvorschläge für den normalen CRM-Alltag.",
    status: "Aktiv",
    price: "inklusive nach Paket",
    features: ["Basis-KI", "Antwortvorschläge", "CRM-Workflow"],
  },
""",
    """  {
    key: "ai_standard",
    name: "KI Standard",
    purpose:
      "Im Basispaket enthaltene KI für Antwortvorschläge, Kontaktwissen und Follow-ups.",
    status: "Aktiv",
    price: "im Basispaket enthalten",
    features: [
      "Standard-Kontingent",
      "Antwortvorschläge",
      "Kontaktwissen & Follow-ups",
      "manuelle Prüfung vor dem Versand",
    ],
  },
""",
    label="KI Standard card",
)
text = replace_once(
    text,
    """  {
    key: "ai_plus",
    name: "KI Plus",
    purpose:
      "Mehr Vorschläge, feinere Memory- und Follow-up-Unterstützung nach manueller Freigabe.",
    status: "Auf Anfrage",
    price: "auf Anfrage",
    features: ["manuelle Prüfung", "keine automatische Buchung"],
    showComingSoonMark: true,
  },
""",
    """  {
    key: "ai_plus",
    name: "KI Plus",
    purpose:
      "Kostenpflichtige Erweiterung mit leistungsstärkerer KI, mehr Nutzung und größerem Gesprächskontext.",
    status: "Coming Soon",
    price: "Zusatzpreis wird vor Freigabe festgelegt",
    features: [
      "leistungsstärkere Modellklasse",
      "höheres KI-Kontingent",
      "größerer Gesprächskontext",
      "weiterhin manuelle Freigabe",
    ],
    showComingSoonMark: true,
  },
""",
    label="KI Plus card",
)
text = replace_once(
    text,
    """  {
    key: "ai_ultra",
    name: "KI Ultra",
    purpose: "Erweiterter KI-Spielraum für größere Workspaces nach Prüfung.",
    status: "Coming Soon",
    price: "auf Anfrage",
    features: ["Roadmap-Vorschau", "spätere Freigabe"],
    showComingSoonMark: true,
  },
""",
    """  {
    key: "ai_ultra",
    name: "KI Ultra",
    purpose:
      "Höherpreisige Premium-Erweiterung mit der stärksten freigegebenen KI, den höchsten Kontingenten und erweitertem Funktionsumfang.",
    status: "Coming Soon",
    price: "höherer Zusatzpreis als KI Plus",
    features: [
      "stärkste freigegebene Modellklasse",
      "höchstes KI-Kontingent",
      "größter Gesprächskontext",
      "keine automatische Sendung",
    ],
    showComingSoonMark: true,
  },
""",
    label="KI Ultra card",
)
text = replace_once(
    text,
    """          <p className={profileStyles.invoiceValue}>
            Vorbereitete Erweiterungen bleiben klar als verfügbar, vorbereitet
            oder Coming Soon markiert.
          </p>
""",
    """          <p className={profileStyles.invoiceValue}>
            KI Standard ist im Basispaket enthalten. KI Plus und KI Ultra sind
            separat berechnete Erweiterungen und bleiben bis zur Preis-,
            Kontingent- und Billing-Freigabe als Coming Soon markiert.
          </p>
""",
    label="add-on section copy",
)
text = replace_once(
    text,
    """        {ADD_ON_CARDS.map((addOn) => {
          const showStatusBadge = addOn.status === "Aktiv";
""",
    """        {ADD_ON_CARDS.map((addOn) => {
          const showStatusBadge = true;
""",
    label="add-on status badges",
)
text = replace_once(
    text,
    """              {addOn.showComingSoonMark ? (
                <div className={profileStyles.cardMarkSlot}>
                  <ComingSoonMark
                    size="small"
                    className={profileStyles.settingsComingSoonMark}
                  />
                </div>
              ) : (
                <p className={profileStyles.addOnPrice}>{addOn.price}</p>
              )}
""",
    """              <p className={profileStyles.addOnPrice}>{addOn.price}</p>
              {addOn.showComingSoonMark ? (
                <div className={profileStyles.cardMarkSlot}>
                  <ComingSoonMark
                    size="small"
                    className={profileStyles.settingsComingSoonMark}
                  />
                </div>
              ) : null}
""",
    label="add-on price display",
)
write(path, text)

path = "src/config/roadmap.ts"
text = read(path)
text = replace_once(
    text,
    '    title: "KI Plus, Ultra & Prompts",\n',
    '    title: "Kostenpflichtige KI-Erweiterungen",\n',
    label="roadmap KI title",
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
anchor = """Begründung für 312 €/Monat: FanMind ist kein Billig-Tool und der Aufwand liegt in sicherer CRM-Struktur, KI, Memory, Follow-ups, Datenpflege, Demo-Setup, Support, Security/RLS und späterer kontrollierter Integrationsfähigkeit. Die Preislogik soll diesen Arbeitsaufwand und B2B-Charakter widerspiegeln.
"""
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
# Automated truth guardrails.
# ---------------------------------------------------------------------------
path = "scripts/verify-product-truth.mjs"
text = read(path)
text = replace_once(
    text,
    '  "src/app/impressum/page.tsx",\n];\n',
    '  "src/app/impressum/page.tsx",\n  "docs/SOURCE_OF_TRUTH.md",\n];\n',
    label="truth runtime source-of-truth file",
)
text = replace_once(
    text,
    'forbid(/Fanmind@fanmind\\.ch/u, "Uneinheitliche Anfrageadresse gefunden; nutze kontakt@fanmind.ch.");\n',
    'forbid(/Fanmind@fanmind\\.ch/u, "Uneinheitliche Anfrageadresse gefunden; nutze kontakt@fanmind.ch.");\nforbid(/hello@fanmind\\.ch/iu, "Uneinheitliche Kontaktadresse gefunden; nutze kontakt@fanmind.ch.");\nforbid(/Ehrliche Roadmap/iu, "Öffentliche Roadmap darf nicht als Ehrliche Roadmap bezeichnet werden.");\nforbid(/Unified Inbox Timeline/iu, "Nicht aktive Inbox-Synchronisierung darf nicht als Unified Inbox bezeichnet werden.");\n',
    label="truth forbidden terms",
)
insert_anchor = """requireText(
  "src/lib/referrals.ts",
  "REFERRAL_GROWTH_WINDOW_CAP = 2000",
  "Das Referral Growth Window muss bei 2.000 aktiven zahlenden Workspaces gedeckelt sein.",
);
"""
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
text = replace_once(text, insert_anchor, insert, label="truth KI tier checks")
write(path, text)

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
