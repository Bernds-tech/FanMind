"use server";

import { getFanMindAiModel, recordAiUsageEvent } from "@/lib/aiUsage";
import { refresh, revalidatePath } from "next/cache";
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
  createWorkspaceContactServer,
  archiveWorkspaceContact,
  archiveWorkspaceContactServer,
  mergeWorkspaceContacts,
  getContactConversationMessages,
  getContactMemories,
  getWorkspaceContact,
  getWorkspaceContacts,
  getWorkspaceConversations,
  updateWorkspaceContactServer,
  updateContactInternalNotesServer,
  upsertContactReplyTarget,
  upsertFanAnalysisReport,
  type ContactRow,
  type ContactUpdateResult,
} from "@/lib/supabase/server";
import {
  requireAuthorizedWorkspace,
  requireContactInAuthorizedWorkspace,
} from "@/lib/workspaceAuthorization";
import { areDemoConnectionsDisabled } from "@/lib/demoMode";
import {
  formatPlatformLabel,
  getDuplicateKey,
  normalizePlatform,
  parseCsvContacts,
  type PlatformValue,
} from "./import/csv";
import {
  getContactGroupIdentity,
  normalizeFanIdentity,
} from "@/lib/fanIdentity";
import { isAllowedManualFacebookThreadUrl } from "@/lib/sourceContext";

type SuggestedSaveResult = {
  ok: boolean;
  message: string;
};

export type FanAnalysisActionState = {
  ok: boolean;
  message: string;
  generatedAt?: string;
  report?: {
    report_json: Record<string, unknown> | null;
    summary: string | null;
    source_message_count: number | null;
    generated_at: string | null;
    updated_at?: string | null;
  } | null;
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

export async function saveFacebookReplyTarget(formData: FormData) {
  const { user, workspace } = await requireAuthorizedWorkspace();
  const contactId = formValue(formData, "contact_id");
  if (areDemoConnectionsDisabled(user, workspace)) {
    redirect(`/fans/${contactId}?notice=demo_external_actions_disabled`);
  }
  await ensureContactInWorkspace(workspace.id, contactId);

  const url = formValue(formData, "reply_target_url");
  if (!isAllowedManualFacebookThreadUrl(url)) {
    redirect(`/fans/${contactId}?notice=reply_target_invalid`);
  }

  const result = await upsertContactReplyTarget({
    workspaceId: workspace.id,
    contactId,
    sourcePlatform: "facebook",
    sourceType: "facebook_messages",
    label: "Exakter Facebook-Chat-Link",
    url,
    quality: "manual_exact_thread",
  });

  if (result.error) {
    if (
      result.error.message.includes(
        "Der exakte Chat-Link kann derzeit nicht gespeichert werden.",
      )
    ) {
      redirect(`/fans/${contactId}?notice=reply_target_storage_unavailable`);
    }
    redirect(`/fans/${contactId}?notice=reply_target_save_failed`);
  }
  revalidatePath(`/fans/${contactId}`);
  redirect(`/fans/${contactId}?notice=reply_target_saved`);
}

export async function saveContactInternalNotes(formData: FormData) {
  const workspace = await getCurrentWorkspaceOrThrow();
  const contactId = formValue(formData, "contact_id");
  const locale = formValue(formData, "lang") === "en" ? "en" : "de";
  const langParam = locale === "en" ? "&lang=en" : "";

  await ensureContactInWorkspace(workspace.id, contactId);

  const internalNotes = formValue(formData, "internal_notes");
  if (!internalNotes.trim()) {
    redirect(`/fans/${contactId}?notice=notes_empty${langParam}`);
  }

  const result = await updateContactInternalNotesServer({
    workspaceId: workspace.id,
    contactId,
    internalNotes,
  });

  if (result.error || result.contact?.internal_notes !== internalNotes.trim()) {
    revalidatePath(`/fans/${contactId}`);
    redirect(`/fans/${contactId}?notice=notes_save_failed${langParam}`);
  }

  revalidatePath(`/fans/${contactId}`);
  revalidatePath("/fans/[id]", "page");
  revalidatePath("/fans");
  refresh();
  redirect(`/fans/${contactId}?notice=notes_saved${langParam}`);
}

export async function analyzeFan(
  _previousState: FanAnalysisActionState,
  formData: FormData,
): Promise<FanAnalysisActionState> {
  const { workspace, user } = await requireAuthorizedWorkspace();
  const contactId = formValue(formData, "contact_id");
  await ensureContactInWorkspace(workspace.id, contactId);

  const locale = formValue(formData, "locale") === "en" ? "en" : "de";

  const [contactResult, messagesResult, memoriesResult] = await Promise.all([
    getWorkspaceContact(workspace.id, contactId),
    getContactConversationMessages(workspace.id, contactId),
    getContactMemories(workspace.id, contactId),
  ]);

  if (contactResult.error) {
    return { ok: false, message: contactResult.error.message };
  }
  if (messagesResult.error) {
    return { ok: false, message: messagesResult.error.message };
  }
  if (memoriesResult.error) {
    return { ok: false, message: memoriesResult.error.message };
  }

  const sourceMessages = messagesResult.messages.slice(-50).map((message) => ({
    direction: message.direction,
    channel: message.source_platform ?? "unbekannter Kanal",
    origin:
      message.source_type ?? message.message_type ?? "unbekannter Ursprung",
    author: message.author_label ?? message.original_author_label ?? null,
    text: message.content || message.original_text_excerpt || "",
    mediaHint: message.attachments?.length
      ? `Medien/Anhänge vorhanden (${message.attachments.length}); nur als Hinweis nutzen, keine Bildanalyse.`
      : null,
    createdAt: message.created_at,
  }));

  const contactContext = {
    displayName: contactResult.contact?.display_name ?? null,
    handle: contactResult.contact?.handle ?? null,
    sourcePlatform: contactResult.contact?.source_platform ?? null,
    contactLanguage: contactResult.contact?.language ?? null,
    status: contactResult.contact?.status ?? null,
    tags: contactResult.contact?.tags ?? [],
    summary: contactResult.contact?.summary ?? null,
    internalNotes: contactResult.contact?.internal_notes ?? "",
  };
  const memories = memoriesResult.memories.slice(0, 20).map((memory) => ({
    type: memory.type,
    content: memory.content,
    importance: memory.importance,
    createdAt: memory.created_at,
  }));

  const lowDataHint =
    sourceMessages.length < 3
      ? locale === "en"
        ? "Not enough saved messages yet for a complete analysis. Use the message history or manual messages to improve the analysis."
        : "Noch zu wenig gespeicherte Nachrichten für eine vollständige Analyse. Nutze den Nachrichtenverlauf oder manuelle Nachrichten, um die Analyse zu verbessern."
      : "";
  const fallback = {
    kurzprofil:
      lowDataHint ||
      "Aus dem bisherigen Austausch ableitbarer vorsichtiger Kommunikationsüberblick.",
    kommunikationsstil:
      "Nur aus expliziten Nachrichten ableiten; vorsichtig formulieren und weitere Nachrichten berücksichtigen.",
    stimmung:
      "Aus den vorhandenen Nachrichten nicht sicher bestimmbar; höchstens als möglicher Eindruck formulieren.",
    interessen_trigger:
      "Nur ausdrücklich genannte Themen, Kanalhinweise und Ursprünge berücksichtigen.",
    kauf_reaktion:
      "Keine harte Prognose; mögliche Reaktion hängt vom nächsten manuellen Kontakt und Kontext ab.",
    antwortstil:
      "Freundlich, klar, respektvoll und ohne Druck antworten. Keine automatische Sendung auslösen.",
    no_gos:
      "Keine Diagnosen, keine sensiblen Eigenschaften als Tatsache, keine psychologischen Gewissheiten und keine Bildanalyse behaupten.",
    spirituell:
      "Aus dem Chat kein belastbarer Hinweis auf spirituelle Interessen oder Motive; Fokus liegt auf Organisation, Entscheidungssicherheit und konkreten Buchungsdetails.",
    language: locale,
  };

  let report = fallback;
  const model = getFanMindAiModel();
  const apiKey = process.env.OPENAI_API_KEY;
  const aiInputPayload = {
    language: locale,
    contact: contactContext,
    memories,
    messages: sourceMessages,
  };
  const aiInputChars = JSON.stringify(aiInputPayload).length;
  let userMessage = lowDataHint;

  if (!apiKey) {
    userMessage =
      "OPENAI_API_KEY ist serverseitig nicht gesetzt. FanMind hat deshalb einen einfachen Kurzreport ohne KI-Aufruf gespeichert.";
  } else if (sourceMessages.length >= 3) {
    const latencyStartedAt = Date.now();
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        store: false,
        input: [
          {
            role: "system",
            content:
              locale === "en"
                ? "Create a careful fan analysis report in English. Use only the provided contact data, stored messages, notes, and memories. Do not state medical, psychological, diagnostic, protected, or sensitive attributes as facts. Use cautious wording such as seems, based on the chat, possible hint, could indicate. Keep every section detailed but readable and fitted to the actual conversation. Media may only be mentioned as a hint; do not analyze images. Fill spiritual/energetic notes only if the chat supports it; otherwise write that there is no reliable indication and the focus is practical context. Return only valid JSON with keys kurzprofil, kommunikationsstil, stimmung, interessen_trigger, kauf_reaktion, antwortstil, no_gos, spirituell, language."
                : "Erzeuge einen vorsichtigen Fan-Analyse-Report auf Deutsch. Nutze ausschließlich die gelieferten Kontaktdaten, gespeicherten Nachrichten, Notizen und Memories. Keine medizinischen, psychologischen oder diagnostischen Aussagen als Tatsache, keine geschützten Merkmale, keine sensiblen Eigenschaften als Tatsache. Nutze vorsichtige Formulierungen wie wirkt/könnte/möglicher Hinweis/aus dem Chat ableitbar. Jeder Abschnitt soll ausführlich, klar lesbar und passend zur tatsächlichen Kommunikation sein. Medien nur als Hinweis erwähnen, keine Bildanalyse. Spirituelle/energetische Hinweise nur ausfüllen, wenn der Chat dafür Hinweise enthält; sonst klar schreiben, dass kein belastbarer Hinweis vorliegt und der Fokus auf praktischem Kontext liegt. Gib nur valides JSON mit Keys kurzprofil, kommunikationsstil, stimmung, interessen_trigger, kauf_reaktion, antwortstil, no_gos, spirituell, language zurück.",
          },
          {
            role: "user",
            content: JSON.stringify(aiInputPayload),
          },
        ],
      }),
    });
    const data = (await response.json().catch(() => null)) as {
      error?: { message?: string };
      output_text?: string;
      output?: Array<{ content?: Array<{ text?: string }> }>;
    } | null;
    const text =
      data?.output_text ??
      data?.output
        ?.flatMap((o) => o.content ?? [])
        .map((c) => c.text)
        .find(Boolean);
    if (!response.ok) {
      await recordAiUsageEvent({
        workspaceId: workspace.id,
        userId: user.id,
        contactId,
        feature: "fan_analysis",
        model,
        inputChars: aiInputChars,
        outputChars: text?.length ?? 0,
        status: "error",
        errorCode: String(response.status),
        latencyMs: Date.now() - latencyStartedAt,
        sourceRoute: "src/app/fans/actions.ts#analyzeFan",
      });
      return {
        ok: false,
        message:
          data?.error?.message ||
          "OpenAI konnte den Fan-Analyse-Report gerade nicht erstellen.",
      };
    }
    if (!text) {
      await recordAiUsageEvent({
        workspaceId: workspace.id,
        userId: user.id,
        contactId,
        feature: "fan_analysis",
        model,
        inputChars: aiInputChars,
        outputChars: 0,
        status: "error",
        errorCode: "missing_output",
        latencyMs: Date.now() - latencyStartedAt,
        sourceRoute: "src/app/fans/actions.ts#analyzeFan",
      });
      return {
        ok: false,
        message:
          "OpenAI hat keinen auswertbaren Fan-Analyse-Report zurückgegeben.",
      };
    }
    try {
      report = { ...fallback, ...JSON.parse(text) };
    } catch {
      await recordAiUsageEvent({
        workspaceId: workspace.id,
        userId: user.id,
        contactId,
        feature: "fan_analysis",
        model,
        inputChars: aiInputChars,
        outputChars: text.length,
        status: "error",
        errorCode: "invalid_json",
        latencyMs: Date.now() - latencyStartedAt,
        sourceRoute: "src/app/fans/actions.ts#analyzeFan",
      });
      return {
        ok: false,
        message:
          "OpenAI hat keinen gültigen JSON-Report zurückgegeben. Bitte erneut versuchen.",
      };
    }
    await recordAiUsageEvent({
      workspaceId: workspace.id,
      userId: user.id,
      contactId,
      feature: "fan_analysis",
      model,
      inputChars: aiInputChars,
      outputChars: text.length,
      status: "ok",
      latencyMs: Date.now() - latencyStartedAt,
      sourceRoute: "src/app/fans/actions.ts#analyzeFan",
    });
    userMessage = "Fan-Analyse-Report wurde gespeichert und aktualisiert.";
  } else {
    userMessage =
      locale === "en"
        ? `${lowDataHint} FanMind saved a simple low-data interim report.`
        : `${lowDataHint} FanMind hat einen einfachen Kurzreport gespeichert.`;
  }

  const result = await upsertFanAnalysisReport({
    workspaceId: workspace.id,
    contactId,
    reportJson: report,
    summary: report.kurzprofil,
    model:
      apiKey && sourceMessages.length >= 3
        ? model
        : apiKey
          ? "fallback-low-message-count"
          : "fallback-no-api-key",
    sourceMessageCount: sourceMessages.length,
  });
  if (result.error) return { ok: false, message: result.error.message };
  revalidatePath(`/fans/${contactId}`);
  return {
    ok: true,
    message: userMessage,
    generatedAt: result.report?.generated_at ?? undefined,
    report: result.report
      ? {
          report_json: result.report.report_json as Record<
            string,
            unknown
          > | null,
          summary: result.report.summary,
          source_message_count: result.report.source_message_count,
          generated_at: result.report.generated_at,
          updated_at: result.report.updated_at,
        }
      : null,
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

export async function saveManualFanMessage(formData: FormData) {
  const workspace = await getCurrentWorkspaceOrThrow();
  const contactId = formValue(formData, "contact_id");
  const locale = formValue(formData, "lang") === "en" ? "en" : "de";
  const langParam = locale === "en" ? "?lang=en" : "";
  await ensureContactInWorkspace(workspace.id, contactId);

  const direction =
    formValue(formData, "direction") === "outbound" ? "outbound" : "inbound";
  const result = await createManualConversationMessage({
    workspaceId: workspace.id,
    contactId,
    direction,
    sourcePlatform: formValue(formData, "source_platform") || "manual",
    messageType: "manual",
    sourceType: "manual_note",
    authorLabel: direction === "inbound" ? "Fan" : "Team",
    content: formValue(formData, "content"),
  });

  if (result.error) {
    redirect(
      `/fans/${contactId}${langParam ? `${langParam}&` : "?"}notice=message_save_failed`,
    );
  }

  revalidatePath(`/fans/${contactId}`);
  revalidatePath("/fans");
  revalidatePath("/dashboard");
  redirect(
    `/fans/${contactId}${langParam ? `${langParam}&` : "?"}notice=message_saved`,
  );
}

export async function saveManualMemory(formData: FormData) {
  const workspace = await getCurrentWorkspaceOrThrow();
  const contactId = formValue(formData, "contact_id");
  const locale = formValue(formData, "lang") === "en" ? "en" : "de";
  const langParam = locale === "en" ? "?lang=en" : "";
  await ensureContactInWorkspace(workspace.id, contactId);

  const content = formValue(formData, "content").trim();
  if (!content) {
    redirect(
      `/fans/${contactId}${langParam ? `${langParam}&` : "?"}notice=memory_empty`,
    );
  }

  const result = await createContactMemory({
    workspaceId: workspace.id,
    contactId,
    content,
    importance: formValue(formData, "importance") || "normal",
    type: formValue(formData, "type") || "note",
  });

  if (result.error) {
    redirect(
      `/fans/${contactId}${langParam ? `${langParam}&` : "?"}notice=memory_save_failed`,
    );
  }

  revalidatePath(`/fans/${contactId}`);
  revalidatePath("/dashboard");
  redirect(
    `/fans/${contactId}${langParam ? `${langParam}&` : "?"}notice=memory_saved`,
  );
}

export async function saveManualFollowup(formData: FormData) {
  const workspace = await getCurrentWorkspaceOrThrow();
  const contactId = formValue(formData, "contact_id");
  const locale = formValue(formData, "lang") === "en" ? "en" : "de";
  const langParam = locale === "en" ? "?lang=en" : "";
  await ensureContactInWorkspace(workspace.id, contactId);

  const result = await createContactFollowup({
    workspaceId: workspace.id,
    contactId,
    reason: formValue(formData, "reason"),
    dueDate: formValue(formData, "due_date"),
    priority: formValue(formData, "priority") || "normal",
    status: "open",
  });

  if (result.error) {
    redirect(
      `/fans/${contactId}${langParam ? `${langParam}&` : "?"}notice=followup_save_failed`,
    );
  }

  revalidatePath(`/fans/${contactId}`);
  revalidatePath("/fans");
  revalidatePath("/followups");
  revalidatePath("/dashboard");
  redirect(
    `/fans/${contactId}${langParam ? `${langParam}&` : "?"}notice=followup_saved`,
  );
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
  const { workspace, user } = await requireAuthorizedWorkspace();
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
    messageType: "dm",
    sourcePlatform:
      conversation.source_platform ||
      formValue(formData, "source_platform") ||
      "manual",
    sourceType: conversation.source_type || undefined,
    sourceUrl: conversation.source_url,
    replyTargetUrl: conversation.reply_target_url,
    authorLabel:
      conversation.source_platform === "facebook"
        ? workspace.name || "Team"
        : getActionUserLabel(user, workspace.name),
    originalAuthorLabel:
      conversation.source_platform === "facebook"
        ? workspace.name || "Team"
        : undefined,
    userId: user.id,
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
  const platforms = formPlatforms(formData, "source_platforms", {
    fallbackManual: true,
  });
  const baseContact = getContactFormValues(formData);

  for (const platform of platforms) {
    const result = await createWorkspaceContactServer({
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
  redirect("/fans?notice=fan_created#fans-list");
}

export async function updateFan(formData: FormData) {
  const workspace = await getCurrentWorkspaceOrThrow();
  const primaryContactId =
    formValue(formData, "primary_contact_id") ||
    formValue(formData, "group_primary_contact_id");
  const submittedGroupKey = formValue(formData, "fan_group_key");
  const platforms = formPlatforms(formData, "source_platforms", {
    fallbackManual: false,
  });
  const baseContact = getContactFormValues(formData);

  if (!primaryContactId) {
    redirectFanUpdateFailed(
      new Error("Primärer Kontakt der Fan-Gruppe fehlt."),
    );
  }

  if (!platforms.length) {
    redirectFanUpdateFailed(
      new Error(
        "Mindestens ein aktiver Kanal muss ausgewählt bleiben oder der Kontakt muss archiviert werden.",
      ),
    );
  }

  let successRedirect = "/fans?notice=fan_updated#fans-list";

  try {
    const [primaryResult, contactsResult] = await Promise.all([
      getWorkspaceContact(workspace.id, primaryContactId),
      getWorkspaceContacts(workspace.id),
    ]);

    if (primaryResult.error) {
      throw new Error(primaryResult.error.message);
    }
    if (!primaryResult.contact) {
      throw new Error("Primärer Kontakt wurde nicht gefunden.");
    }
    if (contactsResult.error) {
      throw new Error(contactsResult.error.message);
    }

    const primaryContact = primaryResult.contact;
    const editableContacts = resolveServerFanGroup(
      primaryContact,
      contactsResult.contacts,
      submittedGroupKey,
    );
    const selectedPlatforms = new Set(platforms);
    const contactsByPlatform = new Map<PlatformValue, ContactRow[]>();

    for (const contact of editableContacts) {
      const platform = normalizePlatform(contact.source_platform);
      contactsByPlatform.set(platform, [
        ...(contactsByPlatform.get(platform) ?? []),
        contact,
      ]);
    }

    const archivedPlatforms: PlatformValue[] = [];

    for (const [platform, platformContacts] of contactsByPlatform) {
      const sortedPlatformContacts = [...platformContacts].sort(
        compareContactAgeAsc,
      );

      if (!selectedPlatforms.has(platform)) {
        for (const contact of sortedPlatformContacts) {
          const archived = await archiveWorkspaceContactServer({
            workspaceId: workspace.id,
            contactId: contact.id,
            reason: `Kanal ${formatPlatformLabel(platform)} in der Fan-Bearbeitung abgewählt.`,
          });
          assertUpdatedContact(
            archived,
            `Kanal ${formatPlatformLabel(platform)} konnte nicht archiviert werden.`,
          );
        }
        archivedPlatforms.push(platform);
        continue;
      }

      const [keptContact, ...duplicateContacts] = sortedPlatformContacts;
      const updated = await updateWorkspaceContactServer({
        ...baseContact,
        workspaceId: workspace.id,
        contactId: keptContact.id,
        sourcePlatform: platform,
      });
      assertUpdatedContact(
        updated,
        `Kanal ${formatPlatformLabel(platform)} konnte nicht aktualisiert werden.`,
      );

      for (const duplicate of duplicateContacts) {
        const archived = await archiveWorkspaceContactServer({
          workspaceId: workspace.id,
          contactId: duplicate.id,
          reason: `Doppelter aktiver Kontakt für ${formatPlatformLabel(platform)} in der Fan-Bearbeitung archiviert; Kontakt ${keptContact.id} bleibt aktiv.`,
        });
        assertUpdatedContact(
          archived,
          `Doppelter Kanal ${formatPlatformLabel(platform)} konnte nicht archiviert werden.`,
        );
      }
    }

    for (const platform of platforms) {
      if ((contactsByPlatform.get(platform) ?? []).length > 0) continue;
      const created = await createWorkspaceContactServer({
        ...baseContact,
        workspaceId: workspace.id,
        sourcePlatform: platform,
      });
      if (created.error || !created.contact) {
        throw new Error(
          created.error?.message ??
            `Kanal ${formatPlatformLabel(platform)} konnte nicht erstellt werden.`,
        );
      }
    }

    const verificationResult = await getWorkspaceContacts(workspace.id);
    if (verificationResult.error) {
      throw new Error(verificationResult.error.message);
    }
    const verifyGroup = resolveServerFanGroup(
      { ...primaryContact, ...baseContact },
      verificationResult.contacts,
      submittedGroupKey,
    );
    const activePlatforms = uniqueActionPlatforms(verifyGroup);
    const expectedPlatforms = [...selectedPlatforms].sort();

    if (activePlatforms.join(",") !== expectedPlatforms.join(",")) {
      throw new Error(
        `Kanäle konnten nicht aktualisiert werden: aktiv sind ${formatActionPlatformList(activePlatforms)}, erwartet war ${formatActionPlatformList(expectedPlatforms)}.`,
      );
    }

    revalidatePath("/fans");
    revalidatePath("/dashboard");
    revalidatePath("/inbox");
    for (const contact of editableContacts) {
      revalidatePath(`/fans/${contact.id}`);
    }
    successRedirect = `/fans?notice=fan_updated&active=${encodeURIComponent(activePlatforms.join(","))}&archived=${archivedPlatforms.length}#fans-list`;
  } catch (error) {
    redirectFanUpdateFailed(error);
  }

  redirect(successRedirect);
}

export async function archiveFan(formData: FormData) {
  const workspace = await getCurrentWorkspaceOrThrow();
  const contactId = formValue(formData, "contact_id");
  await ensureContactInWorkspace(workspace.id, contactId);
  const result = await archiveWorkspaceContact({
    workspaceId: workspace.id,
    contactId,
    reason: "Kontakt wurde über FanMind archiviert.",
  });
  if (result.error) throw new Error(result.error.message);
  revalidatePath("/fans");
  revalidatePath("/dashboard");
  revalidatePath("/inbox");
  redirect("/fans?notice=contact_archived#fans-list");
}

export async function mergeFanContacts(formData: FormData) {
  const returnTo = getMergeReturnPath(formValue(formData, "return_to"));
  let targetContactId = "";

  try {
    const workspace = await getCurrentWorkspaceOrThrow();
    const sourceContactId = formValue(formData, "source_contact_id");
    targetContactId = formValue(formData, "target_contact_id");

    if (!sourceContactId) {
      throw new Error("Der Quell-Fan fehlt.");
    }

    if (!targetContactId) {
      throw new Error("Bitte wähle einen Ziel-Fan aus.");
    }

    if (sourceContactId === targetContactId) {
      throw new Error("Quelle und Ziel dürfen nicht identisch sein.");
    }

    const [sourceResult, targetResult, contactsResult] = await Promise.all([
      getWorkspaceContact(workspace.id, sourceContactId),
      getWorkspaceContact(workspace.id, targetContactId),
      getWorkspaceContacts(workspace.id),
    ]);

    if (sourceResult.error) throw new Error(sourceResult.error.message);
    if (targetResult.error) throw new Error(targetResult.error.message);
    if (contactsResult.error) throw new Error(contactsResult.error.message);
    if (!sourceResult.contact || !targetResult.contact) {
      throw new Error("Quelle oder Ziel wurde nicht gefunden.");
    }

    const sourceGroup = resolveServerFanGroup(
      sourceResult.contact,
      contactsResult.contacts,
      "",
    ).filter((contact) => contact.id !== targetContactId);

    if (!sourceGroup.length) {
      throw new Error("Keine Quellkontakte zum Zusammenführen gefunden.");
    }

    for (const sourceContact of sourceGroup) {
      const result = await mergeWorkspaceContacts({
        workspaceId: workspace.id,
        sourceContactId: sourceContact.id,
        targetContactId,
      });
      assertUpdatedContact(
        result,
        `Kontakt ${sourceContact.id} konnte nicht zusammengeführt werden.`,
      );
    }
  } catch (error) {
    redirectMergeFailed(error, returnTo);
  }

  revalidatePath("/fans");
  revalidatePath("/dashboard");
  revalidatePath("/inbox");
  revalidatePath(`/fans/${targetContactId}`);
  redirect(`${returnTo}?notice=contacts_merged#fans-list`);
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
        conversation.id === conversationId &&
        conversation.contact_id === contactId,
    );

    if (!existing) {
      throw new Error("Conversation gehört nicht zum aktuellen Kontakt.");
    }

    return existing;
  }

  const ensured = await ensureConversationForContact({
    workspaceId,
    contactId,
  });

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
  redirect(
    returnTo === "inbox"
      ? `/inbox?notice=${notice}`
      : `/fans/${contactId}?focus=reply&notice=${notice}`,
  );
}

function getActionUserLabel(
  user: { email?: string; user_metadata?: Record<string, unknown> } | null,
  fallback: string,
): string {
  const label =
    user?.user_metadata?.display_name ?? user?.user_metadata?.full_name;

  if (typeof label === "string" && label.trim()) return label.trim();
  if (user?.email) return user.email;
  return fallback || "Team";
}

function resolveServerFanGroup(
  primaryContact: ContactRow,
  contacts: ContactRow[],
  submittedGroupKey: string,
): ContactRow[] {
  const activeContacts = contacts.filter(
    (contact) => contact.status?.trim().toLowerCase() !== "archived",
  );
  const contactsById = new Map(
    activeContacts.map((contact) => [contact.id, contact]),
  );
  const primary = contactsById.get(primaryContact.id) ?? primaryContact;
  const groupIdentity = getContactGroupIdentity(primary);
  const normalizedName = normalizeFanIdentity(primary.display_name);
  const normalizedHandle = normalizeFanIdentity(primary.handle);
  const exactName = primary.display_name?.trim();
  const exactNameKey = exactName?.toLowerCase() ?? "";

  const group = activeContacts.filter((contact) => {
    if (contact.id === primary.id) return true;

    const contactGroupIdentity = getContactGroupIdentity(contact);
    if (groupIdentity && contactGroupIdentity === groupIdentity) return true;
    if (submittedGroupKey && contactGroupIdentity === submittedGroupKey)
      return true;

    const contactName = normalizeFanIdentity(contact.display_name);
    const contactHandle = normalizeFanIdentity(contact.handle);
    if (normalizedName && normalizedHandle) {
      if (
        contactName === normalizedName &&
        contactHandle === normalizedHandle
      ) {
        return true;
      }
      if (contactHandle === normalizedHandle) return true;
    }

    if (
      exactNameKey &&
      contact.display_name?.trim().toLowerCase() === exactNameKey &&
      !normalizedHandle
    ) {
      return true;
    }

    return false;
  });

  return group.length ? group : [primary];
}

function assertUpdatedContact(
  result: ContactUpdateResult,
  fallbackMessage: string,
): asserts result is ContactUpdateResult & { contact: ContactRow } {
  if (result.error || !result.contact) {
    throw new Error(result.error?.message ?? fallbackMessage);
  }
}

function redirectFanUpdateFailed(error: unknown): never {
  console.error("Fan-Kanal-Bearbeitung fehlgeschlagen.", error);
  redirect(
    "/fans?notice=fan_update_failed&error=contact_update_failed#fans-list",
  );
}

function redirectMergeFailed(error: unknown, returnTo = "/fans"): never {
  console.error("Fan-Merge fehlgeschlagen.", error);
  const message = error instanceof Error ? error.message : "merge_failed";
  redirect(
    `${returnTo}?notice=contacts_merge_failed&error=${encodeURIComponent(message)}#fans-list`,
  );
}

function getMergeReturnPath(value: string): string {
  if (value.startsWith("/fans/")) return value;
  return "/fans";
}

function compareContactAgeAsc(left: ContactRow, right: ContactRow): number {
  return getActionTime(left.created_at) - getActionTime(right.created_at);
}

function uniqueActionPlatforms(contacts: ContactRow[]): PlatformValue[] {
  return Array.from(
    new Set(
      contacts
        .filter(
          (contact) => contact.status?.trim().toLowerCase() !== "archived",
        )
        .map((contact) => normalizePlatform(contact.source_platform)),
    ),
  ).sort();
}

function formatActionPlatformList(platforms: PlatformValue[]): string {
  return platforms.length
    ? platforms.map(formatPlatformLabel).join(", ")
    : "keine Kanäle";
}

function getActionTime(value: string | null): number {
  return value ? new Date(value).getTime() : 0;
}

function formValue(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function formPlatforms(
  formData: FormData,
  key: string,
  options: { fallbackManual: boolean },
) {
  const platforms = formData
    .getAll(key)
    .filter((value): value is string => typeof value === "string")
    .map((value) => normalizePlatform(value));

  const uniquePlatforms = Array.from(new Set(platforms)).slice(0, 9);

  return uniquePlatforms.length || !options.fallbackManual
    ? uniquePlatforms
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
  try {
    const { workspace } = await requireAuthorizedWorkspace();
    return workspace;
  } catch (error) {
    if (error instanceof Error && error.message.includes("User-Session")) {
      redirect("/login");
    }
    throw error;
  }
}

async function ensureContactInWorkspace(
  workspaceId: string,
  contactId: string,
) {
  const authorized = await requireContactInAuthorizedWorkspace(contactId);
  if (authorized.workspace.id !== workspaceId) {
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

export async function syncFacebookChatForContact(contactId: string) {
  const { user, workspace } =
    await requireContactInAuthorizedWorkspace(contactId);
  if (areDemoConnectionsDisabled(user, workspace)) {
    redirect(`/fans/${contactId}?notice=demo_external_actions_disabled`);
  }
  const { syncFacebookMessengerHistory } =
    await import("@/app/channels/facebookWebhookActions");
  const result = await syncFacebookMessengerHistory({
    contactId,
    markInboundSeen: true,
  });
  const params = new URLSearchParams();
  params.set(
    "notice",
    result.ok
      ? `Facebook-Chat synchronisiert: ${result.importedInbound} inbound, ${result.importedOutbound} outbound neu.`
      : "Facebook-Verlauf konnte nicht abgerufen werden. Prüfe Page Access Token und Messenger-Berechtigungen.",
  );
  revalidatePath(`/fans/${contactId}`);
  redirect(`/fans/${contactId}?${params.toString()}`);
}
