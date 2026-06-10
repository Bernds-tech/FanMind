import { cookies } from "next/headers";
import { getRegistrationCommercialTerms, isPlanId, type ProductiveCommercialOption } from "@/lib/plans";
import type { PlanId } from "@/config/plans";
import { getSupabaseAuthUrl, getSupabaseHeaders, getSupabaseRestUrl, SUPABASE_ACCESS_TOKEN_COOKIE, SUPABASE_REFRESH_TOKEN_COOKIE } from "./config";

export type SupabaseServerUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

type SupabaseServerUserResponse = {
  data: { user: SupabaseServerUser | null };
  error: Error | null;
};

export type WorkspaceBackfillRow = {
  id: string;
  name: string;
  owner_user_id: string;
  plan_id: PlanId;
  commercial_option: ProductiveCommercialOption;
  setup_fee_cents: number;
  monthly_fee_cents: number;
  commitment_months: 0 | 12;
};

export type WorkspaceDashboardRow = WorkspaceBackfillRow & {
  role: string;
};

type WorkspaceMemberRow = {
  id: string;
  workspace_id: string;
  role: string;
};

export type ContactRow = {
  id: string;
  workspace_id: string;
  display_name: string;
  handle: string | null;
  source_platform: string | null;
  language: string | null;
  status: string | null;
  tags: string[] | null;
  summary: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type CreateContactInput = {
  workspaceId: string;
  displayName: string;
  handle?: string | null;
  sourcePlatform?: string | null;
  language?: string | null;
  status?: string | null;
  tags?: string[];
  summary?: string | null;
};

type ContactsResult = {
  contacts: ContactRow[];
  error: Error | null;
};

type ContactCreateResult = {
  contact: ContactRow | null;
  error: Error | null;
};

type ContactDetailResult = {
  contact: ContactRow | null;
  error: Error | null;
};

type WorkspaceBackfillResult = {
  workspace: WorkspaceBackfillRow | null;
  error: Error | null;
  created: boolean;
};

type WorkspaceDashboardResult = {
  workspace: WorkspaceDashboardRow | null;
  error: Error | null;
};

type PostgrestResult<T> = {
  data: T | null;
  error: Error | null;
};

type SupabaseFilterValue = string | number | boolean;

const WORKSPACE_COLUMNS = "id,name,owner_user_id,plan_id,commercial_option,setup_fee_cents,monthly_fee_cents,commitment_months";
const CONTACT_COLUMNS = "id,workspace_id,display_name,handle,source_platform,language,status,tags,summary,created_at,updated_at";
const DEFAULT_WORKSPACE_NAME = "FanMind Workspace";
const STARTER_COMMERCIAL_OPTIONS: ProductiveCommercialOption[] = ["starter_paid_setup", "starter_12m_setup_waived"];

async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();

  return cookieStore.get(SUPABASE_ACCESS_TOKEN_COOKIE)?.value;
}

export function createSupabaseServerClient() {
  return {
    auth: {
      async getUser(): Promise<SupabaseServerUserResponse> {
        return getSupabaseServerUser();
      },
      async signOut(): Promise<void> {
        await signOutSupabaseServerSession();
      },
    },
  };
}

export async function getSupabaseServerUser(): Promise<SupabaseServerUserResponse> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return { data: { user: null }, error: null };
  }

  try {
    const response = await fetch(getSupabaseAuthUrl("/user"), {
      headers: getSupabaseHeaders(accessToken),
      cache: "no-store",
    });

    if (!response.ok) {
      return { data: { user: null }, error: await parseSupabaseServerError(response) };
    }

    const user = (await response.json()) as SupabaseServerUser;

    return { data: { user }, error: null };
  } catch (error) {
    return { data: { user: null }, error: error instanceof Error ? error : new Error("Unbekannter Supabase-Fehler.") };
  }
}

export async function signOutSupabaseServerSession(): Promise<void> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(SUPABASE_ACCESS_TOKEN_COOKIE)?.value;

  if (accessToken) {
    try {
      await fetch(getSupabaseAuthUrl("/logout"), {
        method: "POST",
        headers: getSupabaseHeaders(accessToken),
      });
    } catch {
      // Logout darf auch dann Cookies entfernen, wenn Supabase-ENV lokal fehlt oder die Session abgelaufen ist.
    }
  }

  cookieStore.delete(SUPABASE_ACCESS_TOKEN_COOKIE);
  cookieStore.delete(SUPABASE_REFRESH_TOKEN_COOKIE);
}

export async function getUserWorkspaceDashboard(user: SupabaseServerUser): Promise<WorkspaceDashboardResult> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return workspaceDashboardError("Keine aktive Supabase-Session gefunden. Bitte melde dich erneut an.");
  }

  const memberResult = await postgrestSelect<WorkspaceMemberRow>(
    "workspace_members",
    accessToken,
    "id,workspace_id,role",
    [["user_id", user.id]],
    1,
    true,
  );

  if (memberResult.error) {
    return workspaceDashboardError(`Workspace-Mitgliedschaft konnte nicht gelesen werden: ${memberResult.error.message}`);
  }

  if (memberResult.data?.workspace_id) {
    const workspaceResult = await postgrestSelect<WorkspaceBackfillRow>(
      "workspaces",
      accessToken,
      WORKSPACE_COLUMNS,
      [["id", memberResult.data.workspace_id]],
      1,
      true,
    );

    if (workspaceResult.error) {
      return workspaceDashboardError(`Workspace konnte nicht gelesen werden: ${workspaceResult.error.message}`);
    }

    if (workspaceResult.data) {
      return {
        workspace: {
          ...workspaceResult.data,
          role: memberResult.data.role,
        },
        error: null,
      };
    }
  }

  const ownerWorkspaceResult = await postgrestSelect<WorkspaceBackfillRow>(
    "workspaces",
    accessToken,
    WORKSPACE_COLUMNS,
    [["owner_user_id", user.id]],
    1,
    true,
  );

  if (ownerWorkspaceResult.error) {
    return workspaceDashboardError(`Workspace konnte nicht gesucht werden: ${ownerWorkspaceResult.error.message}`);
  }

  if (ownerWorkspaceResult.data) {
    return {
      workspace: {
        ...ownerWorkspaceResult.data,
        role: "owner",
      },
      error: null,
    };
  }

  return workspaceDashboardError("Workspace konnte noch nicht geladen werden.");
}

export async function getWorkspaceContacts(workspaceId: string): Promise<ContactsResult> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return contactsError("Keine aktive Supabase-Session gefunden. Bitte melde dich erneut an.");
  }

  const contactsResult = await postgrestSelect<ContactRow[]>(
    "contacts",
    accessToken,
    CONTACT_COLUMNS,
    [["workspace_id", workspaceId]],
    undefined,
    false,
    "created_at.desc",
  );

  if (contactsResult.error) {
    return contactsError(`Kontakte konnten nicht geladen werden: ${contactsResult.error.message}`);
  }

  return { contacts: contactsResult.data ?? [], error: null };
}

export async function getWorkspaceContact(workspaceId: string, contactId: string): Promise<ContactDetailResult> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return contactDetailError("Keine aktive Supabase-Session gefunden. Bitte melde dich erneut an.");
  }

  const contactResult = await postgrestSelect<ContactRow>(
    "contacts",
    accessToken,
    CONTACT_COLUMNS,
    [["workspace_id", workspaceId], ["id", contactId]],
    1,
    true,
  );

  if (contactResult.error) {
    return contactDetailError(`Kontakt konnte nicht geladen werden: ${contactResult.error.message}`);
  }

  return { contact: contactResult.data, error: null };
}

export async function createWorkspaceContact(input: CreateContactInput): Promise<ContactCreateResult> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return contactCreateError("Keine aktive Supabase-Session gefunden. Bitte melde dich erneut an.");
  }

  const displayName = input.displayName.trim();

  if (!displayName) {
    return contactCreateError("Name ist erforderlich.");
  }

  const contactResult = await postgrestRequest<ContactRow>("contacts", "POST", {
    workspace_id: input.workspaceId,
    display_name: displayName,
    handle: normalizeOptionalText(input.handle),
    source_platform: normalizeOptionalText(input.sourcePlatform) ?? "manual",
    language: normalizeOptionalText(input.language) ?? "de",
    status: normalizeOptionalText(input.status) ?? "new",
    tags: input.tags ?? [],
    summary: normalizeOptionalText(input.summary),
  }, accessToken, { select: CONTACT_COLUMNS, single: true });

  if (contactResult.error) {
    return contactCreateError(`Kontakt konnte nicht gespeichert werden: ${contactResult.error.message}`);
  }

  return { contact: contactResult.data, error: null };
}

export async function ensureUserWorkspace(user: SupabaseServerUser): Promise<WorkspaceBackfillResult> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return workspaceBackfillError("Keine aktive Supabase-Session gefunden. Bitte melde dich erneut an.");
  }

  const email = user.email ?? stringMetadataValue(user.user_metadata, "email") ?? "";
  const displayName = stringMetadataValue(user.user_metadata, "display_name") ?? stringMetadataValue(user.user_metadata, "full_name");
  const workspaceName = stringMetadataValue(user.user_metadata, "organization") ?? displayName ?? DEFAULT_WORKSPACE_NAME;
  const workspaceTerms = resolveWorkspaceTerms(user.user_metadata);

  const profileResult = await postgrestRequest("profiles", "POST", {
    id: user.id,
    email,
    display_name: displayName ?? null,
  }, accessToken, { upsert: true });

  if (profileResult.error) {
    return workspaceBackfillError(`Profil konnte nicht vorbereitet werden: ${profileResult.error.message}`);
  }

  const memberResult = await postgrestSelect<WorkspaceMemberRow>(
    "workspace_members",
    accessToken,
    "id,workspace_id",
    [["user_id", user.id]],
    1,
    true,
  );

  if (memberResult.error) {
    return workspaceBackfillError(`Workspace-Mitgliedschaft konnte nicht gelesen werden: ${memberResult.error.message}`);
  }

  if (memberResult.data?.workspace_id) {
    const memberWorkspaceResult = await postgrestSelect<WorkspaceBackfillRow>(
      "workspaces",
      accessToken,
      WORKSPACE_COLUMNS,
      [["id", memberResult.data.workspace_id]],
      1,
      true,
    );

    if (memberWorkspaceResult.error) {
      return workspaceBackfillError(`Workspace konnte nicht gelesen werden: ${memberWorkspaceResult.error.message}`);
    }

    if (memberWorkspaceResult.data) {
      return { workspace: memberWorkspaceResult.data, error: null, created: false };
    }
  }

  const ownerWorkspaceResult = await postgrestSelect<WorkspaceBackfillRow>(
    "workspaces",
    accessToken,
    WORKSPACE_COLUMNS,
    [["owner_user_id", user.id]],
    1,
    true,
  );

  if (ownerWorkspaceResult.error) {
    return workspaceBackfillError(`Workspace konnte nicht gesucht werden: ${ownerWorkspaceResult.error.message}`);
  }

  let workspace = ownerWorkspaceResult.data;
  let created = false;

  if (!workspace) {
    const insertWorkspaceResult = await postgrestRequest<WorkspaceBackfillRow>("workspaces", "POST", {
      name: workspaceName,
      owner_user_id: user.id,
      plan_id: workspaceTerms.planId,
      commercial_option: workspaceTerms.commercialOption,
      setup_fee_cents: workspaceTerms.setupFeeCents,
      monthly_fee_cents: workspaceTerms.monthlyFeeCents,
      commitment_months: workspaceTerms.commitmentMonths,
    }, accessToken, { select: WORKSPACE_COLUMNS, single: true });

    if (insertWorkspaceResult.error) {
      return workspaceBackfillError(`Workspace konnte nicht angelegt werden: ${insertWorkspaceResult.error.message}`);
    }

    workspace = insertWorkspaceResult.data;
    created = true;
  }

  if (!workspace?.id) {
    return workspaceBackfillError("Workspace konnte nicht erstellt oder geladen werden.");
  }

  const existingMemberResult = await postgrestSelect<WorkspaceMemberRow>(
    "workspace_members",
    accessToken,
    "id,workspace_id",
    [["workspace_id", workspace.id], ["user_id", user.id]],
    1,
    true,
  );

  if (existingMemberResult.error) {
    return workspaceBackfillError(`Workspace-Mitgliedschaft konnte nicht geprüft werden: ${existingMemberResult.error.message}`);
  }

  if (!existingMemberResult.data) {
    const insertMemberResult = await postgrestRequest("workspace_members", "POST", {
      workspace_id: workspace.id,
      user_id: user.id,
      role: "owner",
    }, accessToken);

    if (insertMemberResult.error) {
      return workspaceBackfillError(`Workspace-Mitgliedschaft konnte nicht angelegt werden: ${insertMemberResult.error.message}`);
    }
  }

  return { workspace, error: null, created };
}

async function parseSupabaseServerError(response: Response): Promise<Error> {
  const payload = (await response.json().catch(() => null)) as { msg?: string; message?: string; error_description?: string; error?: string } | null;
  const message = payload?.msg ?? payload?.message ?? payload?.error_description ?? payload?.error ?? "Die Supabase-Session ist ungültig oder abgelaufen.";

  return new Error(message);
}

async function postgrestRequest<T = unknown>(
  table: string,
  method: "POST" | "PATCH",
  values: unknown,
  accessToken: string,
  options: { select?: string; single?: boolean; upsert?: boolean } = {},
): Promise<PostgrestResult<T>> {
  try {
    const url = new URL(getSupabaseRestUrl(table));

    if (options.select) {
      url.searchParams.set("select", options.select);
    }

    if (options.upsert && typeof values === "object" && values && "id" in values) {
      url.searchParams.set("on_conflict", "id");
    }

    const response = await fetch(url.toString(), {
      method,
      headers: {
        ...getSupabaseHeaders(accessToken),
        Prefer: `${options.upsert ? "resolution=merge-duplicates," : ""}${options.select ? "return=representation" : "return=minimal"}`,
      },
      body: JSON.stringify(values),
      cache: "no-store",
    });

    if (!response.ok) {
      return { data: null, error: await parseSupabaseServerError(response) };
    }

    if (!options.select) {
      return { data: null, error: null };
    }

    const payload = (await response.json()) as T[];

    return { data: options.single ? payload[0] ?? null : (payload as T), error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error("Unbekannter Supabase-Fehler.") };
  }
}

async function postgrestSelect<T>(
  table: string,
  accessToken: string,
  columns: string,
  filters: [string, SupabaseFilterValue][],
  limitCount?: number,
  single?: boolean,
  order?: string,
): Promise<PostgrestResult<T>> {
  try {
    const url = new URL(getSupabaseRestUrl(table));
    url.searchParams.set("select", columns);

    for (const [column, value] of filters) {
      url.searchParams.set(column, `eq.${String(value)}`);
    }

    if (limitCount) {
      url.searchParams.set("limit", String(limitCount));
    }

    if (order) {
      url.searchParams.set("order", order);
    }

    const response = await fetch(url.toString(), {
      headers: getSupabaseHeaders(accessToken),
      cache: "no-store",
    });

    if (!response.ok) {
      return { data: null, error: await parseSupabaseServerError(response) };
    }

    const payload = (await response.json()) as T[];

    return { data: single ? payload[0] ?? null : (payload as T), error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error("Unbekannter Supabase-Fehler.") };
  }
}

function workspaceBackfillError(message: string): WorkspaceBackfillResult {
  return { workspace: null, error: new Error(message), created: false };
}

function workspaceDashboardError(message: string): WorkspaceDashboardResult {
  return { workspace: null, error: new Error(message) };
}

function contactsError(message: string): ContactsResult {
  return { contacts: [], error: new Error(message) };
}

function contactCreateError(message: string): ContactCreateResult {
  return { contact: null, error: new Error(message) };
}

function contactDetailError(message: string): ContactDetailResult {
  return { contact: null, error: new Error(message) };
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function stringMetadataValue(metadata: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = metadata?.[key];

  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function resolveWorkspaceTerms(metadata: Record<string, unknown> | undefined) {
  const rawPlanId = stringMetadataValue(metadata, "plan") ?? stringMetadataValue(metadata, "plan_id");
  const rawCommercialOption = stringMetadataValue(metadata, "commercialOption") ?? stringMetadataValue(metadata, "commercial_option");
  const planId = isPlanId(rawPlanId) && (rawPlanId === "pilot" || rawPlanId === "starter") ? rawPlanId : "starter";
  const commercialOption = isProductiveCommercialOption(rawCommercialOption) ? rawCommercialOption : "starter_paid_setup";

  if (planId === "pilot" && commercialOption === "pilot_only") {
    return { planId, ...getRegistrationCommercialTerms("pilot")! };
  }

  if (planId === "starter" && isStarterCommercialOption(commercialOption)) {
    return { planId, ...getRegistrationCommercialTerms("starter", commercialOption)! };
  }

  return { planId: "starter" as PlanId, ...getRegistrationCommercialTerms("starter", "starter_paid_setup")! };
}

function isStarterCommercialOption(value: ProductiveCommercialOption): value is Extract<ProductiveCommercialOption, "starter_paid_setup" | "starter_12m_setup_waived"> {
  return STARTER_COMMERCIAL_OPTIONS.includes(value);
}

function isProductiveCommercialOption(value: unknown): value is ProductiveCommercialOption {
  return value === "pilot_only" || value === "starter_paid_setup" || value === "starter_12m_setup_waived";
}
