export type PdfSection = { title: string; rows: Array<[string, string | number | boolean | null | undefined]>; lines?: string[] };

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 44;
const LINE_HEIGHT = 14;
const MAX_CHARS = 92;

function clean(value: unknown): string {
  if (value === null || value === undefined || value === "") return "Keine Daten vorhanden";
  if (typeof value === "boolean") return value ? "Ja" : "Nein";
  return String(value).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, " ");
}

function escapePdfText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapLine(line: string): string[] {
  const words = clean(line).split(/\s+/u);
  const output: string[] = [];
  let current = "";
  for (const word of words) {
    if (`${current} ${word}`.trim().length > MAX_CHARS) {
      if (current) output.push(current);
      current = word;
    } else {
      current = `${current} ${word}`.trim();
    }
  }
  if (current) output.push(current);
  return output.length ? output : ["Keine Daten vorhanden"];
}

export function buildFanMindDataExportPdf(input: { title: string; createdAt: Date; sections: PdfSection[] }): Buffer {
  const pages: string[][] = [[]];
  let y = PAGE_HEIGHT - MARGIN;
  const push = (text: string, size = 10) => {
    if (y < MARGIN + LINE_HEIGHT) {
      pages.push([]);
      y = PAGE_HEIGHT - MARGIN;
    }
    pages[pages.length - 1].push(`BT /F1 ${size} Tf ${MARGIN} ${y} Td (${escapePdfText(text)}) Tj ET`);
    y -= size + 5;
  };
  push("FanMind", 22);
  push(input.title, 16);
  push(`Erstellt am: ${input.createdAt.toISOString().slice(0, 10)}`, 10);
  y -= 8;
  for (const section of input.sections) {
    push(section.title, 13);
    const lines = [
      ...section.rows.map(([key, value]) => `${key}: ${clean(value)}`),
      ...(section.lines?.length ? section.lines : section.rows.length ? [] : ["Keine Daten vorhanden"]),
    ];
    for (const line of lines) for (const wrapped of wrapLine(line)) push(wrapped, 9);
    y -= 6;
  }

  const objects = ["<< /Type /Catalog /Pages 2 0 R >>"];
  const kids = pages.map((_, i) => `${3 + i * 2} 0 R`).join(" ");
  objects.push(`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`);
  pages.forEach((commands, i) => {
    const pageObj = 3 + i * 2;
    const contentObj = pageObj + 1;
    const stream = commands.join("\n");
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /Contents ${contentObj} 0 R >>`);
    objects.push(`<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`);
  });
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((obj, i) => { offsets.push(Buffer.byteLength(pdf, "utf8")); pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, "utf8");
}
