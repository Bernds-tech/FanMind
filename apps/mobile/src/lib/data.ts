import { supabase } from "@/lib/supabase";
import type {
  Contact,
  ContactMemory,
  Followup,
  Workspace,
} from "@/types";

const CONTACT_COLUMNS =
  "id,workspace_id,display_name,handle,source_platform,language,status,tags,summary,internal_notes,created_at,updated_at";
const MEMORY_COLUMNS =
  "id,workspace_id,contact_id,type,content,importance,created_at";
const FOLLOWUP_COLUMNS =
  "id,workspace_id,contact_id,due_date,priority,reason,status,created_at";

function message(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error) {
    const value = String((error as { message?: unknown }).message ?? "");
    if (value) return fallback;
  }
  return fallback;
}

export async function loadWorkspace(userId: string): Promise<{
  workspace: Workspace | null;
  error: string | null;
}> {
  const ownerResult = await supabase
    .from("workspaces")
    .select("id,name,owner_user_id,billing_status")
    .eq("owner_user_id", userId)
    .limit(1)
    .maybeSingle();

  if (ownerResult.error) {
    return {
      workspace: null,
      error: message(ownerResult.error, "Workspace konnte nicht geladen werden."),
    };
  }
  if (ownerResult.data) {
    return {
      workspace: { ...ownerResult.data, role: "owner" } as Workspace,
      error: null,
    };
  }

  const membershipResult = await supabase
    .from("workspace_members")
    .select("workspace_id,role")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (membershipResult.error || !membershipResult.data) {
    return {
      workspace: null,
      error: "Kein FanMind-Workspace gefunden. Bitte schließe zuerst das Onboarding im Web ab.",
    };
  }

  const workspaceResult = await supabase
    .from("workspaces")
    .select("id,name,owner_user_id,billing_status")
    .eq("id", membershipResult.data.workspace_id)
    .limit(1)
    .maybeSingle();
  if (workspaceResult.error || !workspaceResult.data) {
    return {
      workspace: null,
      error: "Der zugeordnete Workspace konnte nicht geladen werden.",
    };
  }
  return {
    workspace: {
      ...workspaceResult.data,
      role: membershipResult.data.role ?? "member",
    } as Workspace,
    error: null,
  };
}

export async function listContacts(
  workspaceId: string,
  search = "",
): Promise<{ contacts: Contact[]; error: string | null }> {
  let query = supabase
    .from("contacts")
    .select(CONTACT_COLUMNS)
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false, nullsFirst: false })
    .limit(250);

  const term = search.trim();
  if (term) {
    const escaped = term.replace(/[%_,]/g, "");
    query = query.or(
      `display_name.ilike.%${escaped}%,handle.ilike.%${escaped}%,summary.ilike.%${escaped}%`,
    );
  }

  const result = await query;
  if (result.error) {
    return { contacts: [], error: "Kontakte konnten nicht geladen werden." };
  }
  const contacts = (result.data ?? []).filter(
    (contact) => String(contact.status ?? "").toLowerCase() !== "archived",
  ) as Contact[];
  return { contacts, error: null };
}

export async function getContact(
  workspaceId: string,
  contactId: string,
): Promise<{ contact: Contact | null; error: string | null }> {
  const result = await supabase
    .from("contacts")
    .select(CONTACT_COLUMNS)
    .eq("workspace_id", workspaceId)
    .eq("id", contactId)
    .limit(1)
    .maybeSingle();
  if (result.error || !result.data) {
    return { contact: null, error: "Kontakt konnte nicht geladen werden." };
  }
  return { contact: result.data as Contact, error: null };
}

export async function listContactMemories(
  workspaceId: string,
  contactId: string,
): Promise<{ memories: ContactMemory[]; error: string | null }> {
  const result = await supabase
    .from("memories")
    .select(MEMORY_COLUMNS)
    .eq("workspace_id", workspaceId)
    .eq("contact_id", contactId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (result.error) {
    return { memories: [], error: "Kontaktwissen konnte nicht geladen werden." };
  }
  return { memories: (result.data ?? []) as ContactMemory[], error: null };
}

export async function createContactMemory(input: {
  workspaceId: string;
  contactId: string;
  content: string;
  importance?: "low" | "normal" | "high";
}): Promise<string | null> {
  const content = input.content.trim().slice(0, 1200);
  if (!content) return "Kontaktwissen ist leer.";
  const result = await supabase.from("memories").insert({
    workspace_id: input.workspaceId,
    contact_id: input.contactId,
    type: "preference",
    content,
    importance: input.importance ?? "normal",
  });
  return result.error ? "Kontaktwissen konnte nicht gespeichert werden." : null;
}

export async function listFollowups(
  workspaceId: string,
): Promise<{ followups: Followup[]; error: string | null }> {
  const result = await supabase
    .from("followups")
    .select(`${FOLLOWUP_COLUMNS},contact:contacts(id,display_name,handle)`)
    .eq("workspace_id", workspaceId)
    .neq("status", "done")
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(200);
  if (result.error) {
    return { followups: [], error: "Follow-ups konnten nicht geladen werden." };
  }
  return { followups: (result.data ?? []) as unknown as Followup[], error: null };
}

export async function createFollowup(input: {
  workspaceId: string;
  contactId: string;
  dueDate: string;
  reason: string;
  priority?: "low" | "normal" | "high";
}): Promise<string | null> {
  const reason = input.reason.trim().slice(0, 500);
  if (!reason) return "Ein Grund für das Follow-up ist erforderlich.";
  const result = await supabase.from("followups").insert({
    workspace_id: input.workspaceId,
    contact_id: input.contactId,
    due_date: input.dueDate,
    reason,
    priority: input.priority ?? "normal",
    status: "open",
  });
  return result.error ? "Follow-up konnte nicht gespeichert werden." : null;
}

export async function completeFollowup(
  workspaceId: string,
  followupId: string,
): Promise<string | null> {
  const result = await supabase
    .from("followups")
    .update({ status: "done" })
    .eq("workspace_id", workspaceId)
    .eq("id", followupId);
  return result.error ? "Follow-up konnte nicht abgeschlossen werden." : null;
}

export async function loadDashboardCounts(workspaceId: string): Promise<{
  contacts: number;
  followups: number;
  error: string | null;
}> {
  const [contactsResult, followupsResult] = await Promise.all([
    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId),
    supabase
      .from("followups")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .neq("status", "done"),
  ]);
  if (contactsResult.error || followupsResult.error) {
    return { contacts: 0, followups: 0, error: "Kennzahlen konnten nicht geladen werden." };
  }
  return {
    contacts: contactsResult.count ?? 0,
    followups: followupsResult.count ?? 0,
    error: null,
  };
}
