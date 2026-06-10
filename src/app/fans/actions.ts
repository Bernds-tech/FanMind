"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createContactFollowup,
  createContactMemory,
  createWorkspaceContact,
  getSupabaseServerUser,
  getUserWorkspaceDashboard,
  getWorkspaceContact,
  getWorkspaceContacts,
} from "@/lib/supabase/server";
import { getDuplicateKey, parseCsvContacts } from "./import/csv";

type SuggestedSaveResult = {
  ok: boolean;
  message: string;
};

export type CsvImportActionState = {
  ok: boolean;
  message: string;
  importedCount: number;
  skippedDuplicates: number;
  skippedInvalid: number;
};

export async function importCsvContacts(
  _previousState: CsvImportActionState,
  formData: FormData,
): Promise<CsvImportActionState> {
  const workspace = await getCurrentWorkspaceOrThrow();
  const csvText = formValue(formData, "csv_text");
  const parsed = parseCsvContacts(csvText);

  if (!parsed.contacts.length) {
    return {
      ok: false,
      message: parsed.errors.join(" ") || "Keine importierbaren Kontakte erkannt.",
      importedCount: 0,
      skippedDuplicates: 0,
      skippedInvalid: parsed.errors.length,
    };
  }

  const existingContacts = await getWorkspaceContacts(workspace.id);

  if (existingContacts.error) {
    return {
      ok: false,
      message: existingContacts.error.message,
      importedCount: 0,
      skippedDuplicates: 0,
      skippedInvalid: parsed.errors.length,
    };
  }

  const knownDuplicateKeys = new Set(
    existingContacts.contacts
      .map((contact) =>
        getDuplicateKey(contact.handle, contact.source_platform),
      )
      .filter((key): key is string => Boolean(key)),
  );
  let importedCount = 0;
  let skippedDuplicates = 0;

  for (const contact of parsed.contacts) {
    const duplicateKey = getDuplicateKey(
      contact.handle,
      contact.sourcePlatform,
    );

    if (duplicateKey && knownDuplicateKeys.has(duplicateKey)) {
      skippedDuplicates += 1;
      continue;
    }

    const result = await createWorkspaceContact({
      workspaceId: workspace.id,
      displayName: contact.displayName,
      handle: contact.handle,
      sourcePlatform: contact.sourcePlatform,
      language: contact.language,
      status: contact.status,
      tags: contact.tags,
      summary: contact.summary,
    });

    if (result.error) {
      return {
        ok: false,
        message: `${importedCount} Kontakte importiert. Import gestoppt: ${result.error.message}`,
        importedCount,
        skippedDuplicates,
        skippedInvalid: parsed.errors.length,
      };
    }

    importedCount += 1;

    if (duplicateKey) {
      knownDuplicateKeys.add(duplicateKey);
    }
  }

  revalidatePath("/fans");
  revalidatePath("/fans/import");
  revalidatePath("/dashboard");

  return {
    ok: true,
    message: `${importedCount} Kontakte importiert, ${skippedDuplicates} Duplikate übersprungen${
      parsed.errors.length ? `, ${parsed.errors.length} ungültige Zeilen übersprungen` : ""
    }.`,
    importedCount,
    skippedDuplicates,
    skippedInvalid: parsed.errors.length,
  };
}

export async function saveSuggestedMemory(input: {
  contactId: string;
  content: string;
  importance?: string | null;
}): Promise<SuggestedSaveResult> {
  const workspace = await getCurrentWorkspaceOrThrow();
  await ensureContactInWorkspace(workspace.id, input.contactId);

  const result = await createContactMemory({
    workspaceId: workspace.id,
    contactId: input.contactId,
    content: input.content,
    importance: input.importance,
    type: "note",
  });

  if (result.error) {
    return { ok: false, message: result.error.message };
  }

  revalidatePath(`/fans/${input.contactId}`);
  revalidatePath("/dashboard");

  return { ok: true, message: "Memory gespeichert." };
}

export async function saveSuggestedFollowup(input: {
  contactId: string;
  reason: string;
  inDays?: number | null;
}): Promise<SuggestedSaveResult> {
  const workspace = await getCurrentWorkspaceOrThrow();
  await ensureContactInWorkspace(workspace.id, input.contactId);

  const result = await createContactFollowup({
    workspaceId: workspace.id,
    contactId: input.contactId,
    reason: input.reason,
    dueDate: getDueDate(input.inDays),
    priority: "normal",
    status: "open",
  });

  if (result.error) {
    return { ok: false, message: result.error.message };
  }

  revalidatePath(`/fans/${input.contactId}`);
  revalidatePath("/dashboard");

  return { ok: true, message: "Follow-up gespeichert." };
}

export async function createFan(formData: FormData) {
  const { data } = await getSupabaseServerUser();

  if (!data.user) {
    redirect("/login");
  }

  const workspaceResult = await getUserWorkspaceDashboard(data.user);
  const workspace = workspaceResult.workspace;

  if (!workspace) {
    throw new Error(
      workspaceResult.error?.message ??
        "Workspace konnte nicht geladen werden.",
    );
  }

  const result = await createWorkspaceContact({
    workspaceId: workspace.id,
    displayName: formValue(formData, "display_name"),
    handle: formValue(formData, "handle"),
    sourcePlatform: formValue(formData, "source_platform"),
    language: formValue(formData, "language"),
    status: formValue(formData, "status"),
    tags: parseTags(formValue(formData, "tags")),
    summary: formValue(formData, "summary"),
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  revalidatePath("/fans");
  redirect("/fans");
}

function formValue(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function parseTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 12);
}

async function getCurrentWorkspaceOrThrow() {
  const { data } = await getSupabaseServerUser();

  if (!data.user) {
    redirect("/login");
  }

  const workspaceResult = await getUserWorkspaceDashboard(data.user);
  const workspace = workspaceResult.workspace;

  if (!workspace) {
    throw new Error(
      workspaceResult.error?.message ??
        "Workspace konnte nicht geladen werden.",
    );
  }

  return workspace;
}

async function ensureContactInWorkspace(
  workspaceId: string,
  contactId: string,
) {
  const contactResult = await getWorkspaceContact(workspaceId, contactId);

  if (contactResult.error) {
    throw new Error(contactResult.error.message);
  }

  if (!contactResult.contact) {
    throw new Error("Kontakt wurde im aktuellen Workspace nicht gefunden.");
  }
}

function getDueDate(inDays: number | null | undefined): string | null {
  if (typeof inDays !== "number" || !Number.isFinite(inDays) || inDays < 0) {
    return null;
  }

  const dueDate = new Date();
  dueDate.setUTCDate(dueDate.getUTCDate() + Math.floor(inDays));

  return dueDate.toISOString().slice(0, 10);
}
