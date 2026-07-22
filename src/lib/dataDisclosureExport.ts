import { cookies } from "next/headers";
import {
  getSupabaseHeaders,
  getSupabaseRestUrl,
  SUPABASE_ACCESS_TOKEN_COOKIE,
} from "@/lib/supabase/config";

export const DATA_DISCLOSURE_CONTACT_PAGE_SIZE = 500;
export const DATA_DISCLOSURE_CONTACT_MAX_ROWS = 50_000;

export type DisclosureContactRow = {
  id: string;
  workspace_id: string;
  display_name: string;
  handle: string | null;
  source_platform: string | null;
  language: string | null;
  status: string | null;
  tags: string[] | null;
  summary: string | null;
  internal_notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const DISCLOSURE_CONTACT_COLUMNS = [
  "id",
  "workspace_id",
  "display_name",
  "handle",
  "source_platform",
  "language",
  "status",
  "tags",
  "summary",
  "internal_notes",
  "created_at",
  "updated_at",
].join(",");

export class DataDisclosureExportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DataDisclosureExportError";
  }
}

type FetchContactsInput = {
  workspaceId: string;
  accessToken: string;
  fetchImpl?: typeof fetch;
  pageSize?: number;
  maxRows?: number;
};

function normalizePositiveInteger(
  value: number | undefined,
  fallback: number,
  maximum: number,
): number {
  if (!Number.isInteger(value) || !value || value < 1) return fallback;
  return Math.min(value, maximum);
}

async function fetchContactPage(input: {
  workspaceId: string;
  accessToken: string;
  offset: number;
  limit: number;
  fetchImpl: typeof fetch;
}): Promise<DisclosureContactRow[]> {
  const url = new URL(getSupabaseRestUrl("contacts"));
  url.searchParams.set("select", DISCLOSURE_CONTACT_COLUMNS);
  url.searchParams.set("workspace_id", `eq.${input.workspaceId}`);
  url.searchParams.set("order", "created_at.asc.nullsfirst,id.asc");
  url.searchParams.set("limit", String(input.limit));
  url.searchParams.set("offset", String(input.offset));

  const response = await input.fetchImpl(url, {
    method: "GET",
    headers: getSupabaseHeaders(input.accessToken),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new DataDisclosureExportError(
      `Kontakte konnten nicht vollständig exportiert werden (HTTP ${response.status}).`,
    );
  }

  const payload = (await response.json().catch(() => null)) as unknown;
  if (!Array.isArray(payload)) {
    throw new DataDisclosureExportError(
      "Kontakte konnten nicht vollständig exportiert werden: ungültige Serverantwort.",
    );
  }

  return payload as DisclosureContactRow[];
}

export async function fetchAllWorkspaceContactsForDisclosure({
  workspaceId,
  accessToken,
  fetchImpl = fetch,
  pageSize: requestedPageSize,
  maxRows: requestedMaxRows,
}: FetchContactsInput): Promise<DisclosureContactRow[]> {
  const normalizedWorkspaceId = workspaceId.trim();
  const normalizedAccessToken = accessToken.trim();
  if (!normalizedWorkspaceId || !normalizedAccessToken) {
    throw new DataDisclosureExportError(
      "Autorisierter Workspace oder Sitzung fehlt für die Datenauskunft.",
    );
  }

  const pageSize = normalizePositiveInteger(
    requestedPageSize,
    DATA_DISCLOSURE_CONTACT_PAGE_SIZE,
    1_000,
  );
  const maxRows = normalizePositiveInteger(
    requestedMaxRows,
    DATA_DISCLOSURE_CONTACT_MAX_ROWS,
    250_000,
  );
  const contacts: DisclosureContactRow[] = [];
  const seenIds = new Set<string>();
  let offset = 0;

  while (true) {
    const remaining = maxRows - contacts.length;
    const page = await fetchContactPage({
      workspaceId: normalizedWorkspaceId,
      accessToken: normalizedAccessToken,
      offset,
      limit: Math.min(pageSize, Math.max(remaining, 1)),
      fetchImpl,
    });

    for (const row of page) {
      if (!row || row.workspace_id !== normalizedWorkspaceId || !row.id) {
        throw new DataDisclosureExportError(
          "Datenauskunft wurde abgebrochen, weil eine Kontaktzeile nicht zum autorisierten Workspace gehört.",
        );
      }
      if (seenIds.has(row.id)) {
        throw new DataDisclosureExportError(
          "Datenauskunft wurde abgebrochen, weil die paginierte Kontaktliste nicht stabil war.",
        );
      }
      seenIds.add(row.id);
      contacts.push(row);
    }

    if (page.length < Math.min(pageSize, Math.max(remaining, 1))) break;

    offset += page.length;
    if (contacts.length >= maxRows) {
      const probe = await fetchContactPage({
        workspaceId: normalizedWorkspaceId,
        accessToken: normalizedAccessToken,
        offset,
        limit: 1,
        fetchImpl,
      });
      if (probe.length) {
        throw new DataDisclosureExportError(
          `Der Workspace enthält mehr als ${maxRows} Kontakte. Der Export wurde ohne Datenabschneidung abgebrochen.`,
        );
      }
      break;
    }
  }

  return contacts;
}

export async function getAllWorkspaceContactsForDisclosure(
  workspaceId: string,
): Promise<DisclosureContactRow[]> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(SUPABASE_ACCESS_TOKEN_COOKIE)?.value?.trim();
  if (!accessToken) {
    throw new DataDisclosureExportError(
      "Die FanMind-Sitzung ist für die Datenauskunft nicht verfügbar.",
    );
  }

  return fetchAllWorkspaceContactsForDisclosure({
    workspaceId,
    accessToken,
  });
}
