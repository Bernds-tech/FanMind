export type CsvContactDraft = {
  displayName: string;
  handle: string;
  sourcePlatform: string;
  language: string;
  status: string;
  tags: string[];
  summary: string;
};

export type CsvParseResult = {
  contacts: CsvContactDraft[];
  errors: string[];
  delimiter: "," | ";";
};

const HEADER_ALIASES: Record<string, keyof CsvContactDraft> = {
  name: "displayName",
  display_name: "displayName",
  handle: "handle",
  platform: "sourcePlatform",
  source_platform: "sourcePlatform",
  language: "language",
  status: "status",
  tags: "tags",
  summary: "summary",
};

export function parseCsvContacts(csvText: string): CsvParseResult {
  const normalizedText = csvText.replace(/^\uFEFF/, "").trim();
  const delimiter = detectDelimiter(normalizedText);

  if (!normalizedText) {
    return { contacts: [], errors: ["CSV-Text ist leer."], delimiter };
  }

  const rows = parseRows(normalizedText, delimiter).filter((row) =>
    row.some((cell) => cell.trim().length > 0),
  );

  if (rows.length < 2) {
    return {
      contacts: [],
      errors: ["CSV benötigt eine Kopfzeile und mindestens eine Kontaktzeile."],
      delimiter,
    };
  }

  const headers = rows[0].map((header) => normalizeHeader(header));
  const mappedHeaders = headers.map((header) => HEADER_ALIASES[header] ?? null);
  const errors: string[] = [];

  if (!mappedHeaders.includes("displayName")) {
    errors.push("Spalte name oder display_name fehlt.");
  }

  const contacts = rows.slice(1).flatMap((row, rowIndex) => {
    const raw: Partial<CsvContactDraft> = {};

    row.forEach((cell, cellIndex) => {
      const target = mappedHeaders[cellIndex];

      if (!target) {
        return;
      }

      if (target === "tags") {
        raw.tags = parseTags(cell);
      } else {
        raw[target] = cell.trim() as never;
      }
    });

    const displayName = (raw.displayName ?? "").trim();

    if (!displayName) {
      errors.push(`Zeile ${rowIndex + 2}: Name fehlt, Zeile übersprungen.`);
      return [];
    }

    return [
      {
        displayName,
        handle: (raw.handle ?? "").trim(),
        sourcePlatform: normalizeDefault(raw.sourcePlatform, "manual"),
        language: normalizeDefault(raw.language, "de"),
        status: normalizeDefault(raw.status, "new"),
        tags: raw.tags ?? [],
        summary: (raw.summary ?? "").trim(),
      },
    ];
  });

  return { contacts, errors, delimiter };
}

export function getDuplicateKey(
  handle: string | null | undefined,
  sourcePlatform: string | null | undefined,
): string | null {
  const normalizedHandle = handle?.trim().toLowerCase();

  if (!normalizedHandle) {
    return null;
  }

  return `${normalizedHandle}::${normalizeDefault(sourcePlatform, "manual").toLowerCase()}`;
}

function detectDelimiter(csvText: string): "," | ";" {
  const firstLine = csvText.split(/\r?\n/, 1)[0] ?? "";
  const semicolonCount = countOutsideQuotes(firstLine, ";");
  const commaCount = countOutsideQuotes(firstLine, ",");

  return semicolonCount > commaCount ? ";" : ",";
}

function parseRows(csvText: string, delimiter: "," | ";"): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const char = csvText[index];
    const nextChar = csvText[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell);
  rows.push(row);

  return rows;
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function normalizeDefault(
  value: string | null | undefined,
  fallback: string,
): string {
  const normalized = value?.trim();

  return normalized ? normalized : fallback;
}

function parseTags(value: string): string[] {
  return value
    .split(";")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function countOutsideQuotes(value: string, needle: "," | ";"): number {
  let count = 0;
  let inQuotes = false;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    const nextChar = value[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === needle && !inQuotes) {
      count += 1;
    }
  }

  return count;
}
