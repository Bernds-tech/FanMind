"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createContactFollowup,
  createContactMemory,
  createManualConversationMessage,
  ensureConversationForContact,
  saveReplyDraftAsNote,
  updateConversationPriority,
  updateConversationStatus,
  createWorkspaceContact,
  getSupabaseServerUser,
  getUserWorkspaceDashboard,
  getWorkspaceContact,
  getWorkspaceContacts,
  getWorkspaceConversations,
  updateWorkspaceContact,
} from "@/lib/supabase/server";
import {
  getDuplicateKey,
  normalizePlatform,
  parseCsvContacts,
} from "./import/csv";

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
      message:
        parsed.errors.join(" ") || "Keine importierbaren Kontakte erkannt.",
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
      parsed.errors.length
        ? `, ${parsed.errors.length} ungültige Zeilen übersprungen`
        : ""
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

export async function saveInboundMessage(formData: FormData) {
  const workspace = await getCurrentWorkspaceOrThrow();
  const contactId = formValue(formData, "contact_id");
  await ensureContactInWorkspace(workspace.id, contactId);

  const result = await createManualConversationMessage({
    workspaceId: workspace.id,
    contactId,
    direction: "inbound",
    sourcePlatform: formValue(formData, "source_platform") || "manual",
    messageType: formValue(formData, "message_type") || "dm",
    sourceUrl: formValue(formData, "source_url"),
    replyTargetUrl: formValue(formData, "source_url"),
    authorLabel: "Fan",
    content: formValue(formData, "content"),
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  revalidatePath(`/fans/${contactId}`);
  revalidatePath("/inbox");
  redirect(`/fans/${contactId}`);
}

export async function saveManualSentReply(formData: FormData) {
  const workspace = await getCurrentWorkspaceOrThrow();
  const user = await getSupabaseServerUser();
  const contactId = formValue(formData, "contact_id");
  await ensureContactInWorkspace(workspace.id, contactId);
  const conversation = await getExistingOrNewConversation(
    workspace.id,
    contactId,
    formValue(formData, "conversation_id"),
  );

  const result = await createManualConversationMessage({
    workspaceId: workspace.id,
    contactId,
    direction: "outbound",
    messageType: "manual",
    sourcePlatform: conversation.source_platform || formValue(formData, "source_platform") || "manual",
    sourceUrl: conversation.source_url,
    replyTargetUrl: conversation.reply_target_url,
    authorLabel: getActionUserLabel(user.data.user, workspace.name),
    userId: user.data.user?.id,
    content: formValue(formData, "content"),
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  revalidatePath(`/fans/${contactId}`);
  revalidatePath("/inbox");
  redirect(`/fans/${contactId}?focus=reply&notice=manual_sent_saved`);
}

export async function saveReplyDraft(formData: FormData) {
  const workspace = await getCurrentWorkspaceOrThrow();
  const contactId = formValue(formData, "contact_id");
  await ensureContactInWorkspace(workspace.id, contactId);
  const conversation = await getExistingOrNewConversation(
    workspace.id,
    contactId,
    formValue(formData, "conversation_id"),
  );

  const result = await saveReplyDraftAsNote({
    workspaceId: workspace.id,
    conversationId: conversation.id,
    contactId,
    content: formValue(formData, "content"),
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  revalidatePath(`/fans/${contactId}`);
  revalidatePath("/inbox");
  redirect(`/fans/${contactId}?focus=reply&notice=draft_saved`);
}

export async function markConversationDone(formData: FormData) {
  await updateConversationStatusAction(
    formData,
    "done",
    "Konversation erledigt",
    "done",
  );
}

export async function markConversationWaiting(formData: FormData) {
  await updateConversationStatusAction(
    formData,
    "waiting",
    "Wartet auf Antwort im Originalkanal",
    "waiting",
  );
}

export async function reopenConversation(formData: FormData) {
  await updateConversationStatusAction(
    formData,
    "open",
    "Antwort vorbereiten",
    "open",
  );
}

export async function setConversationPriority(formData: FormData) {
  const workspace = await getCurrentWorkspaceOrThrow();
  const contactId = formValue(formData, "contact_id");
  await ensureContactInWorkspace(workspace.id, contactId);
  const conversation = await getExistingOrNewConversation(
    workspace.id,
    contactId,
    formValue(formData, "conversation_id"),
  );
  const priority = formValue(formData, "priority");

  if (!["low", "normal", "medium", "high"].includes(priority)) {
    throw new Error("Ungültige Priorität.");
  }

  const result = await updateConversationPriority({
    workspaceId: workspace.id,
    conversationId: conversation.id,
    priority: priority as "low" | "normal" | "medium" | "high",
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  revalidatePath(`/fans/${contactId}`);
  revalidatePath("/inbox");
  redirect(`/fans/${contactId}?focus=reply&notice=priority_saved`);
}

export async function createFan(formData: FormData) {
  const workspace = await getCurrentWorkspaceOrThrow();
  const platforms = formPlatforms(formData, "source_platforms");
  const baseContact = getContactFormValues(formData);

  for (const platform of platforms) {
    const result = await createWorkspaceContact({
      ...baseContact,
      workspaceId: workspace.id,
      sourcePlatform: platform,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  revalidatePath("/fans");
  revalidatePath("/dashboard");
  redirect("/fans");
}

export async function updateFan(formData: FormData) {
  const workspace = await getCurrentWorkspaceOrThrow();
  const contactIds = formData
    .getAll("contact_ids")
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
  const platforms = formPlatforms(formData, "source_platforms");
  const baseContact = getContactFormValues(formData);

  if (!contactIds.length) {
    throw new Error("Mindestens ein Kontakt muss zur Fan-Gruppe gehören.");
  }

  const contactsResult = await getWorkspaceContacts(workspace.id);

  if (contactsResult.error) {
    throw new Error(contactsResult.error.message);
  }

  const contactsById = new Map(
    contactsResult.contacts.map((contact) => [contact.id, contact]),
  );
  const editableContacts = contactIds.map((contactId) => {
    const contact = contactsById.get(contactId);

    if (!contact) {
      throw new Error("Kontakt wurde im aktuellen Workspace nicht gefunden.");
    }

    return contact;
  });
  const existingPlatforms = new Set(
    editableContacts.map((contact) =>
      normalizePlatform(contact.source_platform),
    ),
  );

  for (const contact of editableContacts) {
    const result = await updateWorkspaceContact({
      ...baseContact,
      workspaceId: workspace.id,
      contactId: contact.id,
      sourcePlatform: normalizePlatform(contact.source_platform),
    });

    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  for (const platform of platforms) {
    if (existingPlatforms.has(platform)) {
      continue;
    }

    const result = await createWorkspaceContact({
      ...baseContact,
      workspaceId: workspace.id,
      sourcePlatform: platform,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  revalidatePath("/fans");
  revalidatePath("/dashboard");
  redirect("/fans");
}

async function getExistingOrNewConversation(
  workspaceId: string,
  contactId: string,
  conversationId: string,
) {
  if (conversationId) {
    const conversations = await getWorkspaceConversations(workspaceId);

    if (conversations.error) {
      throw new Error(conversations.error.message);
    }

    const existing = conversations.conversations.find(
      (conversation) =>
        conversation.id === conversationId && conversation.contact_id === contactId,
    );

    if (!existing) {
      throw new Error("Conversation gehört nicht zum aktuellen Kontakt.");
    }

    return existing;
  }

  const ensured = await ensureConversationForContact({ workspaceId, contactId });

  if (ensured.error || !ensured.conversation) {
    throw new Error(
      ensured.error?.message ?? "Conversation konnte nicht geladen werden.",
    );
  }

  return ensured.conversation;
}

async function updateConversationStatusAction(
  formData: FormData,
  status: "open" | "waiting" | "done" | "archived",
  nextStep: string,
  notice: string,
) {
  const workspace = await getCurrentWorkspaceOrThrow();
  const contactId = formValue(formData, "contact_id");
  await ensureContactInWorkspace(workspace.id, contactId);
  const conversation = await getExistingOrNewConversation(
    workspace.id,
    contactId,
    formValue(formData, "conversation_id"),
  );
  const result = await updateConversationStatus({
    workspaceId: workspace.id,
    conversationId: conversation.id,
    status,
    nextStep,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  revalidatePath(`/fans/${contactId}`);
  revalidatePath("/inbox");

  const returnTo = formValue(formData, "return_to");
  redirect(returnTo === "inbox" ? `/inbox?notice=${notice}` : `/fans/${contactId}?focus=reply&notice=${notice}`);
}

function getActionUserLabel(user: { email?: string; user_metadata?: Record<string, unknown> } | null, fallback: string): string {
  const label = user?.user_metadata?.display_name ?? user?.user_metadata?.full_name;

  if (typeof label === "string" && label.trim()) return label.trim();
  if (user?.email) return user.email;
  return fallback || "Team";
}

function formValue(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function formPlatforms(formData: FormData, key: string) {
  const platforms = formData
    .getAll(key)
    .filter((value): value is string => typeof value === "string")
    .map((value) => normalizePlatform(value));

  return Array.from(new Set(platforms)).slice(0, 9).length
    ? Array.from(new Set(platforms)).slice(0, 9)
    : ["manual" as const];
}

function getContactFormValues(formData: FormData) {
  return {
    displayName: formValue(formData, "display_name"),
    handle: formValue(formData, "handle"),
    language: formValue(formData, "language"),
    status: formValue(formData, "status"),
    tags: parseTags(formValue(formData, "tags")),
    summary: formValue(formData, "summary"),
  };
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
