export type DataDisclosurePdfInput = {
  generatedAt: Date;
  user: { id: string; email?: string; displayName?: string };
  workspace: { id: string; name: string; planId?: string | null; billingStatus?: string | null };
  contacts: Array<{ displayName: string; handle?: string | null; sourcePlatform?: string | null; language?: string | null; status?: string | null; summary?: string | null }>;
};

function escapePdfText(value: string) {
  return value.replace(/[\\()]/g, "\\$&").replace(/[\r\n]+/g, " ");
}

function sanitizeLine(value: string, fallback = "—") {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized || fallback;
}

function formatDate(date: Date) {
  return date.toISOString().replace(/\.\d{3}Z$/u, "Z");
}

export function buildDataDisclosurePdfLines(input: DataDisclosurePdfInput): string[] {
  const lines = [
    "FanMind PDF-Datenauskunft",
    `Erstellt: ${formatDate(input.generatedAt)}`,
    "",
    "Konto",
    `Nutzer-ID: ${input.user.id}`,
    `E-Mail: ${input.user.email ?? "—"}`,
    `Name: ${input.user.displayName ?? "—"}`,
    "",
    "Workspace",
    `Workspace-ID: ${input.workspace.id}`,
    `Name: ${input.workspace.name}`,
    `Paket: ${input.workspace.planId ?? "—"}`,
    `Billing-Status: ${input.workspace.billingStatus ?? "—"}`,
    "",
    "CRM-Daten im Export",
    `Aktive Kontakte: ${input.contacts.length}`,
  ];

  for (const contact of input.contacts.slice(0, 80)) {
    lines.push(
      `- ${sanitizeLine(contact.displayName)} · ${sanitizeLine(contact.handle ?? "")} · ${sanitizeLine(contact.sourcePlatform ?? "")} · ${sanitizeLine(contact.language ?? "")} · ${sanitizeLine(contact.status ?? "")}`,
    );
    if (contact.summary) lines.push(`  Zusammenfassung: ${sanitizeLine(contact.summary).slice(0, 140)}`);
  }

  if (input.contacts.length > 80) lines.push(`Weitere Kontakte: ${input.contacts.length - 80} nicht im kompakten PDF gelistet.`);
  lines.push("", "Hinweis: Externe Kanalinhalte sind nur enthalten, soweit sie in FanMind dauerhaft gespeichert wurden.");

  return lines;
}

export function createDataDisclosurePdf(input: DataDisclosurePdfInput): Uint8Array {
  const lines = buildDataDisclosurePdfLines(input).slice(0, 110);
  const content = ["BT", "/F1 11 Tf", "50 790 Td", "14 TL", ...lines.map((line, index) => `${index === 0 ? "" : "T*"} (${escapePdfText(line)}) Tj`), "ET"].join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(content, "utf8")} >>\nstream\n${content}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return new TextEncoder().encode(pdf);
}
