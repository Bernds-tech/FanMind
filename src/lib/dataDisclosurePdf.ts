export type DataDisclosureLocale = "de" | "en";

export type DataDisclosurePdfInput = {
  generatedAt: Date;
  locale?: DataDisclosureLocale;
  user: { id: string; email?: string; displayName?: string };
  workspace: {
    id: string;
    name: string;
    planId?: string | null;
    commercialOption?: string | null;
    billingStatus?: string | null;
    setupFeeCents?: number | null;
    monthlyFeeCents?: number | null;
    commitmentMonths?: number | null;
    organizationName?: string | null;
    streetAddress?: string | null;
    postalCode?: string | null;
    city?: string | null;
    country?: string | null;
    vatId?: string | null;
    taxNumber?: string | null;
    companyRegisterNumber?: string | null;
    companyRegisterCourt?: string | null;
    billingCurrentPeriodEndAt?: string | null;
    billingMinimumTermEndsAt?: string | null;
    subscriptionCancelRequestedAt?: string | null;
    subscriptionEffectiveEndAt?: string | null;
    workspaceAccessMode?: string | null;
  };
  contacts: Array<{
    displayName: string;
    handle?: string | null;
    sourcePlatform?: string | null;
    language?: string | null;
    status?: string | null;
    tags?: string[] | null;
    summary?: string | null;
    internalNotes?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  }>;
};

const PAGE_LINE_LIMIT = 47;
const PDF_LINE_WIDTH = 88;

const copy = {
  de: {
    title: "FanMind PDF-Datenauskunft",
    generated: "Erstellt",
    account: "Konto",
    userId: "Nutzer-ID",
    email: "E-Mail",
    name: "Name",
    workspace: "Workspace",
    workspaceId: "Workspace-ID",
    plan: "Paket",
    commercialOption: "Vertragsoption",
    billingStatus: "Billing-Status",
    setupFee: "Einrichtung",
    monthlyFee: "Monatlich",
    commitment: "Mindestlaufzeit",
    organization: "Organisation",
    address: "Adresse",
    vatId: "UID / VAT ID",
    taxNumber: "Steuernummer",
    registerNumber: "Firmenbuchnummer",
    registerCourt: "Firmenbuchgericht",
    currentPeriodEnd: "Aktuelles Periodenende",
    minimumTermEnd: "Ende Mindestlaufzeit",
    cancellationRequested: "Kündigung vorgemerkt am",
    effectiveEnd: "Wirksames Vertragsende",
    accessMode: "Workspace-Zugriffsmodus",
    contacts: "CRM-Kontakte",
    activeContacts: "Exportierte Kontakte",
    handle: "Handle",
    source: "Quelle",
    language: "Sprache",
    status: "Status",
    tags: "Tags",
    summary: "Zusammenfassung",
    notes: "Interne Notizen",
    created: "Angelegt",
    updated: "Aktualisiert",
    noContacts: "Keine Kontakte im Workspace vorhanden.",
    note: "Hinweis: Externe Kanalinhalte sind nur enthalten, soweit sie in FanMind dauerhaft gespeichert wurden. Secrets, Tokens, Sitzungsdaten, Stripe-IDs und Daten anderer Workspaces werden nicht exportiert.",
    page: "Seite",
    months: "Monate",
  },
  en: {
    title: "FanMind PDF data disclosure",
    generated: "Generated",
    account: "Account",
    userId: "User ID",
    email: "Email",
    name: "Name",
    workspace: "Workspace",
    workspaceId: "Workspace ID",
    plan: "Plan",
    commercialOption: "Contract option",
    billingStatus: "Billing status",
    setupFee: "Setup fee",
    monthlyFee: "Monthly fee",
    commitment: "Minimum term",
    organization: "Organization",
    address: "Address",
    vatId: "VAT ID",
    taxNumber: "Tax number",
    registerNumber: "Company register number",
    registerCourt: "Company register court",
    currentPeriodEnd: "Current period end",
    minimumTermEnd: "Minimum term end",
    cancellationRequested: "Cancellation requested on",
    effectiveEnd: "Effective contract end",
    accessMode: "Workspace access mode",
    contacts: "CRM contacts",
    activeContacts: "Exported contacts",
    handle: "Handle",
    source: "Source",
    language: "Language",
    status: "Status",
    tags: "Tags",
    summary: "Summary",
    notes: "Internal notes",
    created: "Created",
    updated: "Updated",
    noContacts: "No contacts are stored in this workspace.",
    note: "Note: External channel content is included only when it has been stored permanently in FanMind. Secrets, tokens, session data, Stripe IDs and data from other workspaces are not exported.",
    page: "Page",
    months: "months",
  },
} as const;

function escapePdfText(value: string) {
  return value.replace(/[\\()]/g, "\\$&").replace(/[\r\n]+/g, " ");
}

function sanitizeLine(value: string, fallback = "-") {
  const normalized = value
    .replace(/[–—]/g, "-")
    .replace(/€/g, "EUR")
    .replace(/[“”]/g, '"')
    .replace(/[’]/g, "'")
    .replace(/·/g, "-")
    .replace(/[^\x20-\x7e\xa0-\xff]/g, "?")
    .replace(/\s+/g, " ")
    .trim();
  return normalized || fallback;
}

function formatDate(value: Date | string | null | undefined, locale: DataDisclosureLocale) {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return sanitizeLine(String(value));
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "de-AT", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);
}

function formatMoney(cents: number | null | undefined, locale: DataDisclosureLocale) {
  if (typeof cents !== "number" || !Number.isFinite(cents)) return "-";
  return new Intl.NumberFormat(locale === "en" ? "en-GB" : "de-AT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

function wrapLine(value: string, width = PDF_LINE_WIDTH): string[] {
  const text = sanitizeLine(value);
  if (text.length <= width) return [text];

  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (word.length > width) {
      if (current) {
        lines.push(current);
        current = "";
      }
      for (let index = 0; index < word.length; index += width) {
        lines.push(word.slice(index, index + width));
      }
      continue;
    }

    const next = current ? `${current} ${word}` : word;
    if (next.length > width) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines;
}

function pushField(lines: string[], label: string, value: string | null | undefined) {
  lines.push(...wrapLine(`${label}: ${sanitizeLine(value ?? "")}`));
}

function pushOptionalField(
  lines: string[],
  label: string,
  value: string | null | undefined,
) {
  if (typeof value !== "string" || !value.trim()) return;
  pushField(lines, label, value);
}

export function buildDataDisclosurePdfLines(input: DataDisclosurePdfInput): string[] {
  const locale = input.locale === "en" ? "en" : "de";
  const text = copy[locale];
  const lines: string[] = [
    text.title,
    `${text.generated}: ${formatDate(input.generatedAt, locale)}`,
    "",
    text.account,
  ];

  pushField(lines, text.userId, input.user.id);
  pushField(lines, text.email, input.user.email);
  pushField(lines, text.name, input.user.displayName);
  lines.push("", text.workspace);
  pushField(lines, text.workspaceId, input.workspace.id);
  pushField(lines, text.name, input.workspace.name);
  pushField(lines, text.plan, input.workspace.planId);
  pushField(lines, text.commercialOption, input.workspace.commercialOption);
  pushField(lines, text.billingStatus, input.workspace.billingStatus);
  pushField(lines, text.setupFee, formatMoney(input.workspace.setupFeeCents, locale));
  pushField(lines, text.monthlyFee, formatMoney(input.workspace.monthlyFeeCents, locale));
  pushField(
    lines,
    text.commitment,
    typeof input.workspace.commitmentMonths === "number"
      ? `${input.workspace.commitmentMonths} ${text.months}`
      : "-",
  );
  pushOptionalField(lines, text.organization, input.workspace.organizationName);
  const address = [
    input.workspace.streetAddress,
    [input.workspace.postalCode, input.workspace.city].filter(Boolean).join(" "),
    input.workspace.country,
  ]
    .filter((value) => typeof value === "string" && value.trim())
    .join(", ");
  pushOptionalField(lines, text.address, address);
  pushOptionalField(lines, text.vatId, input.workspace.vatId);
  pushOptionalField(lines, text.taxNumber, input.workspace.taxNumber);
  pushOptionalField(lines, text.registerNumber, input.workspace.companyRegisterNumber);
  pushOptionalField(lines, text.registerCourt, input.workspace.companyRegisterCourt);
  pushOptionalField(
    lines,
    text.currentPeriodEnd,
    input.workspace.billingCurrentPeriodEndAt
      ? formatDate(input.workspace.billingCurrentPeriodEndAt, locale)
      : null,
  );
  pushOptionalField(
    lines,
    text.minimumTermEnd,
    input.workspace.billingMinimumTermEndsAt
      ? formatDate(input.workspace.billingMinimumTermEndsAt, locale)
      : null,
  );
  pushOptionalField(
    lines,
    text.cancellationRequested,
    input.workspace.subscriptionCancelRequestedAt
      ? formatDate(input.workspace.subscriptionCancelRequestedAt, locale)
      : null,
  );
  pushOptionalField(
    lines,
    text.effectiveEnd,
    input.workspace.subscriptionEffectiveEndAt
      ? formatDate(input.workspace.subscriptionEffectiveEndAt, locale)
      : null,
  );
  pushOptionalField(lines, text.accessMode, input.workspace.workspaceAccessMode);

  lines.push("", text.contacts, `${text.activeContacts}: ${input.contacts.length}`);

  if (!input.contacts.length) {
    lines.push(text.noContacts);
  }

  input.contacts.forEach((contact, index) => {
    lines.push("", `${index + 1}. ${sanitizeLine(contact.displayName)}`);
    pushOptionalField(lines, text.handle, contact.handle);
    pushOptionalField(lines, text.source, contact.sourcePlatform);
    pushOptionalField(lines, text.language, contact.language);
    pushOptionalField(lines, text.status, contact.status);
    if (contact.tags?.length) pushField(lines, text.tags, contact.tags.join(", "));
    pushOptionalField(lines, text.summary, contact.summary);
    pushOptionalField(lines, text.notes, contact.internalNotes);
    if (contact.createdAt) {
      pushField(lines, text.created, formatDate(contact.createdAt, locale));
    }
    if (contact.updatedAt) {
      pushField(lines, text.updated, formatDate(contact.updatedAt, locale));
    }
  });

  lines.push("", ...wrapLine(text.note));
  return lines;
}

function buildContentStream(lines: string[], pageNumber: number, pageCount: number, locale: DataDisclosureLocale) {
  const pageLabel = copy[locale].page;
  const commands = ["BT", "/F1 10 Tf", "50 790 Td", "14 TL"];
  lines.forEach((line, index) => {
    commands.push(`${index === 0 ? "" : "T*"} (${escapePdfText(line)}) Tj`);
  });
  commands.push("ET", "BT", "/F1 9 Tf", "50 38 Td");
  commands.push(`(${escapePdfText(`${pageLabel} ${pageNumber} / ${pageCount}`)}) Tj`);
  commands.push("ET");
  return commands.join("\n");
}

export function createDataDisclosurePdf(input: DataDisclosurePdfInput): Uint8Array {
  const locale = input.locale === "en" ? "en" : "de";
  const lines = buildDataDisclosurePdfLines(input);
  const pages = Array.from(
    { length: Math.max(1, Math.ceil(lines.length / PAGE_LINE_LIMIT)) },
    (_, index) => lines.slice(index * PAGE_LINE_LIMIT, (index + 1) * PAGE_LINE_LIMIT),
  );

  const objects: string[] = [];
  const pageRefs = pages.map((_, index) => `${4 + index * 2} 0 R`);
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push(`<< /Type /Pages /Kids [${pageRefs.join(" ")}] /Count ${pages.length} >>`);
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");

  pages.forEach((pageLines, index) => {
    const pageObjectNumber = 4 + index * 2;
    const contentObjectNumber = pageObjectNumber + 1;
    const content = buildContentStream(pageLines, index + 1, pages.length, locale);
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`,
    );
    objects.push(
      `<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`,
    );
  });

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
    .join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return new Uint8Array(Buffer.from(pdf, "latin1"));
}
