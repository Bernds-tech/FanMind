export type PlatformValue =
  | "whatsapp"
  | "instagram"
  | "tiktok"
  | "facebook"
  | "x"
  | "discord"
  | "telegram"
  | "email"
  | "onlyfans"
  | "manual";

export const PLATFORM_OPTIONS: Array<{
  value: PlatformValue;
  label: string;
  shortLabel: string;
}> = [
  { value: "whatsapp", label: "WhatsApp", shortLabel: "WA" },
  { value: "instagram", label: "Instagram", shortLabel: "IG" },
  { value: "tiktok", label: "TikTok", shortLabel: "TT" },
  { value: "facebook", label: "Facebook", shortLabel: "FB" },
  { value: "x", label: "X / Twitter", shortLabel: "X" },
  { value: "discord", label: "Discord", shortLabel: "DC" },
  { value: "telegram", label: "Telegram", shortLabel: "TG" },
  { value: "email", label: "E-Mail", shortLabel: "@" },
  { value: "onlyfans", label: "OnlyFans", shortLabel: "OF" },
  { value: "manual", label: "Manuell", shortLabel: "M" },
];

const PLATFORM_ALIAS_MAP: Record<string, PlatformValue> = {
  whatsapp: "whatsapp",
  whats_app: "whatsapp",
  instagram: "instagram",
  instagram_messages: "instagram",
  instagram_comments: "instagram",
  insta: "instagram",
  ig: "instagram",
  tiktok: "tiktok",
  tik_tok: "tiktok",
  facebook: "facebook",
  fb: "facebook",
  twitter: "x",
  x: "x",
  x_com: "x",
  discord: "discord",
  telegram: "telegram",
  tg: "telegram",
  telegram_messages: "telegram",
  mail: "email",
  e_mail: "email",
  email: "email",
  onlyfans: "onlyfans",
  only_fans: "onlyfans",
  manual: "manual",
  manuell: "manual",
  other: "manual",
  sonstiges: "manual",
};

export function normalizePlatform(
  value: string | null | undefined,
): PlatformValue {
  const key = value
    ?.trim()
    .toLowerCase()
    .replace(/@/g, "email")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (!key) {
    return "manual";
  }

  return PLATFORM_ALIAS_MAP[key] ?? "manual";
}

export function formatPlatformLabel(value: string | null | undefined): string {
  const platform = normalizePlatform(value);

  return (
    PLATFORM_OPTIONS.find((option) => option.value === platform)?.label ??
    "Manuell"
  );
}

export function getPlatformShortLabel(
  value: string | null | undefined,
): string {
  const platform = normalizePlatform(value);

  return (
    PLATFORM_OPTIONS.find((option) => option.value === platform)?.shortLabel ??
    "M"
  );
}

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

export function parseCsvContacts(
  csvText: string,
  defaultSourcePlatform: string = "manual",
): CsvParseResult {
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
        sourcePlatform: normalizePlatform(
          raw.sourcePlatform || defaultSourcePlatform,
        ),
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

  return `${normalizePlatform(sourcePlatform)}::${normalizedHandle}`;
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
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
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

export function csvHasPlatformColumn(csvText: string): boolean {
  const normalizedText = csvText.replace(/^\uFEFF/, "").trim();

  if (!normalizedText) {
    return false;
  }

  const delimiter = detectDelimiter(normalizedText);
  const [headerRow] = parseRows(normalizedText, delimiter);

  return headerRow
    .map((header) => normalizeHeader(header))
    .some((header) => header === "platform" || header === "source_platform");
}

export function withDefaultSourcePlatform(
  csvText: string,
  defaultSourcePlatform: string,
): string {
  const normalizedText = csvText.replace(/^\uFEFF/, "").trim();

  if (!normalizedText || csvHasPlatformColumn(normalizedText)) {
    return csvText;
  }

  const delimiter = detectDelimiter(normalizedText);
  const rows = parseRows(normalizedText, delimiter);
  const normalizedPlatform = normalizePlatform(defaultSourcePlatform);
  const serializedRows = rows.map((row, index) => [
    ...row,
    index === 0 ? "source_platform" : normalizedPlatform,
  ]);

  return serializedRows
    .map((row) =>
      row.map((cell) => serializeCell(cell, delimiter)).join(delimiter),
    )
    .join("\n");
}

function serializeCell(value: string, delimiter: "," | ";"): string {
  if (!value.includes(delimiter) && !/["\r\n]/.test(value)) {
    return value;
  }

  return `"${value.replace(/"/g, '""')}"`;
}
