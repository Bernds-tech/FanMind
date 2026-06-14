import { cookies } from "next/headers";
import {
  getRegistrationCommercialTerms,
  isPlanId,
  type ProductiveCommercialOption,
} from "@/lib/plans";
import type { PlanId } from "@/config/plans";
import {
  getSupabaseAuthUrl,
  getSupabaseHeaders,
  getSupabaseRestUrl,
  SUPABASE_ACCESS_TOKEN_COOKIE,
  SUPABASE_REFRESH_TOKEN_COOKIE,
} from "./config";

export type SupabaseServerUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

type SupabaseServerUserResponse = {
  data: { user: SupabaseServerUser | null };
  error: Error | null;
};

type WorkspaceCommercialOption =
  | ProductiveCommercialOption
  | "starter_no_setup_commitment";

export type WorkspaceBackfillRow = {
  id: string;
  name: string;
  owner_user_id: string;
  plan_id: PlanId;
  commercial_option: WorkspaceCommercialOption;
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

export type MemoryRow = {
  id: string;
  workspace_id: string;
  contact_id: string;
  type: string | null;
  content: string;
  importance: string | null;
  created_at: string | null;
};

export type ConversationRow = {
  id: string;
  workspace_id: string;
  contact_id: string;
  status: string;
  priority: string;
  source_platform: string | null;
  source_type: string | null;
  source_url: string | null;
  reply_target_url: string | null;
  external_thread_id: string | null;
  external_message_id: string | null;
  last_inbound_at: string | null;
  last_outbound_at: string | null;
  last_message_preview: string | null;
  assigned_owner: string | null;
  ai_status: string;
  next_step: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type ConversationMessageRow = {
  id: string;
  workspace_id: string;
  conversation_id: string;
  contact_id: string;
  direction: string;
  message_type: string;
  source_platform: string | null;
  source_url: string | null;
  reply_target_url: string | null;
  external_message_id: string | null;
  author_label: string | null;
  content: string;
  created_at: string | null;
};

export type SocialConnectionRow = {
  id: string;
  workspace_id: string;
  platform: string;
  provider: string;
  status: string;
  external_account_id: string | null;
  external_account_name: string | null;
  page_id: string | null;
  page_name: string | null;
  page_access_token_encrypted: string | null;
  token_last_four: string | null;
  scopes: string[] | null;
  webhook_subscribed: boolean;
  connected_by: string | null;
  connected_at: string;
  disconnected_at: string | null;
  last_event_at: string | null;
  created_at: string;
  updated_at: string;
};

export type FollowupRow = {
  id: string;
  workspace_id: string;
  contact_id: string;
  due_date: string | null;
  priority: string | null;
  reason: string;
  status: string | null;
  created_at: string | null;
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

type UpdateContactInput = CreateContactInput & {
  contactId: string;
};

type CreateMemoryInput = {
  workspaceId: string;
  contactId: string;
  type?: string | null;
  content: string;
  importance?: string | null;
};

type ConversationStatus = "open" | "waiting" | "done" | "archived";
type ConversationPriority = "low" | "normal" | "medium" | "high";

type CreateManualConversationMessageInput = {
  workspaceId: string;
  contactId: string;
  direction?: "inbound" | "outbound" | "note";
  messageType?: string | null;
  sourcePlatform?: string | null;
  sourceUrl?: string | null;
  replyTargetUrl?: string | null;
  externalMessageId?: string | null;
  authorLabel?: string | null;
  content: string;
};

type UpsertFacebookSocialConnectionInput = {
  workspaceId: string;
  connectedBy: string;
  externalAccountId?: string | null;
  externalAccountName?: string | null;
  pageId: string;
  pageName: string;
  pageAccessTokenEncrypted?: string | null;
  tokenLastFour?: string | null;
  scopes?: string[];
  webhookSubscribed?: boolean;
};

type CreateFollowupInput = {
  workspaceId: string;
  contactId: string;
  dueDate?: string | null;
  priority?: string | null;
  reason: string;
  status?: string | null;
};

type ContactsResult = {
  contacts: ContactRow[];
  error: Error | null;
};

type ContactCreateResult = {
  contact: ContactRow | null;
  error: Error | null;
};

type ContactUpdateResult = {
  contact: ContactRow | null;
  error: Error | null;
};

type ContactDetailResult = {
  contact: ContactRow | null;
  error: Error | null;
};

type MemoriesResult = {
  memories: MemoryRow[];
  error: Error | null;
};

type MemoryCreateResult = {
  memory: MemoryRow | null;
  error: Error | null;
};

type ConversationsResult = {
  conversations: ConversationRow[];
  error: Error | null;
};

type ConversationMessagesResult = {
  messages: ConversationMessageRow[];
  error: Error | null;
};

type ConversationResult = {
  conversation: ConversationRow | null;
  error: Error | null;
};

type ConversationMessageCreateResult = {
  message: ConversationMessageRow | null;
  conversation: ConversationRow | null;
  error: Error | null;
};

type ConversationUpdateResult = {
  conversation: ConversationRow | null;
  error: Error | null;
};

type SocialConnectionResult = {
  connection: SocialConnectionRow | null;
  error: Error | null;
};

type SocialConnectionsResult = {
  connections: SocialConnectionRow[];
  error: Error | null;
};

type FollowupsResult = {
  followups: FollowupRow[];
  error: Error | null;
};

type FollowupCreateResult = {
  followup: FollowupRow | null;
  error: Error | null;
};

type FollowupCountResult = {
  count: number;
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

type PostgrestCountResult = {
  count: number;
  error: Error | null;
};

type SupabaseFilterValue = string | number | boolean;

const WORKSPACE_COLUMNS =
  "id,name,owner_user_id,plan_id,commercial_option,setup_fee_cents,monthly_fee_cents,commitment_months";
const CONTACT_COLUMNS =
  "id,workspace_id,display_name,handle,source_platform,language,status,tags,summary,created_at,updated_at";
const MEMORY_COLUMNS =
  "id,workspace_id,contact_id,type,content,importance,created_at";
const CONVERSATION_COLUMNS =
  "id,workspace_id,contact_id,status,priority,source_platform,source_type,source_url,reply_target_url,external_thread_id,external_message_id,last_inbound_at,last_outbound_at,last_message_preview,assigned_owner,ai_status,next_step,created_at,updated_at";
const CONVERSATION_MESSAGE_COLUMNS =
  "id,workspace_id,conversation_id,contact_id,direction,message_type,source_platform,source_url,reply_target_url,external_message_id,author_label,content,created_at";
const SOCIAL_CONNECTION_COLUMNS =
  "id,workspace_id,platform,provider,status,external_account_id,external_account_name,page_id,page_name,page_access_token_encrypted,token_last_four,scopes,webhook_subscribed,connected_by,connected_at,disconnected_at,last_event_at,created_at,updated_at";
const FOLLOWUP_COLUMNS =
  "id,workspace_id,contact_id,due_date,priority,reason,status,created_at";
const DEFAULT_WORKSPACE_NAME = "FanMind Workspace";

function getServiceAccessToken(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY;
}
const STARTER_COMMERCIAL_OPTIONS: WorkspaceCommercialOption[] = [
  "starter_paid_setup",
  "starter_no_setup_commitment",
];

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
      return {
        data: { user: null },
        error: await parseSupabaseServerError(response),
      };
    }

    const user = (await response.json()) as SupabaseServerUser;

    return { data: { user }, error: null };
  } catch (error) {
    return {
      data: { user: null },
      error:
        error instanceof Error
          ? error
          : new Error("Unbekannter Supabase-Fehler."),
    };
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

export async function getUserWorkspaceDashboard(
  user: SupabaseServerUser,
): Promise<WorkspaceDashboardResult> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return workspaceDashboardError(
      "Keine aktive Supabase-Session gefunden. Bitte melde dich erneut an.",
    );
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
    return workspaceDashboardError(
      `Workspace-Mitgliedschaft konnte nicht gelesen werden: ${memberResult.error.message}`,
    );
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
      return workspaceDashboardError(
        `Workspace konnte nicht gelesen werden: ${workspaceResult.error.message}`,
      );
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
    return workspaceDashboardError(
      `Workspace konnte nicht gesucht werden: ${ownerWorkspaceResult.error.message}`,
    );
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

export async function getWorkspaceSocialConnections(
  workspaceId: string,
): Promise<SocialConnectionsResult> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return socialConnectionsError(
      "Keine aktive Supabase-Session gefunden. Bitte melde dich erneut an.",
    );
  }

  const result = await postgrestSelect<SocialConnectionRow[]>(
    "social_connections",
    accessToken,
    SOCIAL_CONNECTION_COLUMNS,
    [["workspace_id", workspaceId]],
    undefined,
    false,
    "updated_at.desc",
  );

  if (result.error) {
    return socialConnectionsError(
      `Social Connections konnten nicht geladen werden: ${result.error.message}`,
    );
  }

  return { connections: result.data ?? [], error: null };
}

export async function upsertFacebookSocialConnection(
  input: UpsertFacebookSocialConnectionInput,
): Promise<SocialConnectionResult> {
  const accessToken = await getAccessToken();
  if (!accessToken)
    return socialConnectionError("Keine aktive Supabase-Session gefunden.");

  const result = await postgrestRequest<SocialConnectionRow>(
    "social_connections",
    "POST",
    {
      workspace_id: input.workspaceId,
      platform: "facebook",
      provider: "meta",
      status: "connected",
      external_account_id:
        normalizeOptionalText(input.externalAccountId) ?? input.pageId,
      external_account_name:
        normalizeOptionalText(input.externalAccountName) ?? input.pageName,
      page_id: input.pageId,
      page_name: input.pageName,
      page_access_token_encrypted: normalizeOptionalText(
        input.pageAccessTokenEncrypted,
      ),
      token_last_four: normalizeOptionalText(input.tokenLastFour),
      scopes: input.scopes ?? [],
      webhook_subscribed: input.webhookSubscribed ?? false,
      connected_by: input.connectedBy,
      connected_at: new Date().toISOString(),
      disconnected_at: null,
    },
    accessToken,
    {
      select: SOCIAL_CONNECTION_COLUMNS,
      single: true,
      upsert: true,
      onConflict: "workspace_id,platform,page_id",
    },
  );

  if (result.error)
    return socialConnectionError(
      `Facebook-Verbindung konnte nicht gespeichert werden: ${result.error.message}`,
    );
  return { connection: result.data, error: null };
}

export async function disconnectFacebookSocialConnection(
  workspaceId: string,
): Promise<SocialConnectionResult> {
  const accessToken = await getAccessToken();
  if (!accessToken)
    return socialConnectionError("Keine aktive Supabase-Session gefunden.");

  const result = await postgrestUpdate<SocialConnectionRow>(
    "social_connections",
    {
      status: "disconnected",
      disconnected_at: new Date().toISOString(),
      page_access_token_encrypted: null,
      token_last_four: null,
      webhook_subscribed: false,
    },
    accessToken,
    [
      ["workspace_id", workspaceId],
      ["platform", "facebook"],
      ["status", "connected"],
    ],
    { select: SOCIAL_CONNECTION_COLUMNS, single: true },
  );

  if (result.error)
    return socialConnectionError(
      `Facebook-Verbindung konnte nicht getrennt werden: ${result.error.message}`,
    );
  return { connection: result.data, error: null };
}

export async function findFacebookSocialConnectionByPageId(
  pageId: string,
): Promise<SocialConnectionResult> {
  const serviceAccessToken = getServiceAccessToken();
  if (!serviceAccessToken) {
    return socialConnectionError(
      "SUPABASE_SERVICE_ROLE_KEY ist für Webhook-Zuordnung nicht konfiguriert.",
    );
  }

  const result = await postgrestSelect<SocialConnectionRow>(
    "social_connections",
    serviceAccessToken,
    SOCIAL_CONNECTION_COLUMNS,
    [
      ["platform", "facebook"],
      ["status", "connected"],
      ["page_id", pageId],
    ],
    1,
    true,
  );
  if (result.error) return socialConnectionError(result.error.message);
  return { connection: result.data, error: null };
}

export async function getWorkspaceContacts(
  workspaceId: string,
): Promise<ContactsResult> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return contactsError(
      "Keine aktive Supabase-Session gefunden. Bitte melde dich erneut an.",
    );
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
    return contactsError(
      `Kontakte konnten nicht geladen werden: ${contactsResult.error.message}`,
    );
  }

  return { contacts: contactsResult.data ?? [], error: null };
}

export async function getWorkspaceContact(
  workspaceId: string,
  contactId: string,
): Promise<ContactDetailResult> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return contactDetailError(
      "Keine aktive Supabase-Session gefunden. Bitte melde dich erneut an.",
    );
  }

  const contactResult = await postgrestSelect<ContactRow>(
    "contacts",
    accessToken,
    CONTACT_COLUMNS,
    [
      ["workspace_id", workspaceId],
      ["id", contactId],
    ],
    1,
    true,
  );

  if (contactResult.error) {
    return contactDetailError(
      `Kontakt konnte nicht geladen werden: ${contactResult.error.message}`,
    );
  }

  return { contact: contactResult.data, error: null };
}

export async function createWorkspaceContact(
  input: CreateContactInput,
): Promise<ContactCreateResult> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return contactCreateError(
      "Keine aktive Supabase-Session gefunden. Bitte melde dich erneut an.",
    );
  }

  const displayName = input.displayName.trim();

  if (!displayName) {
    return contactCreateError("Name ist erforderlich.");
  }

  const contactResult = await postgrestRequest<ContactRow>(
    "contacts",
    "POST",
    {
      workspace_id: input.workspaceId,
      display_name: displayName,
      handle: normalizeOptionalText(input.handle),
      source_platform: normalizeOptionalText(input.sourcePlatform) ?? "manual",
      language: normalizeOptionalText(input.language) ?? "de",
      status: normalizeOptionalText(input.status) ?? "new",
      tags: input.tags ?? [],
      summary: normalizeOptionalText(input.summary),
    },
    accessToken,
    { select: CONTACT_COLUMNS, single: true },
  );

  if (contactResult.error) {
    return contactCreateError(
      `Kontakt konnte nicht gespeichert werden: ${contactResult.error.message}`,
    );
  }

  return { contact: contactResult.data, error: null };
}

export async function updateWorkspaceContact(
  input: UpdateContactInput,
): Promise<ContactUpdateResult> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return contactUpdateError(
      "Keine aktive Supabase-Session gefunden. Bitte melde dich erneut an.",
    );
  }

  const displayName = input.displayName.trim();

  if (!displayName) {
    return contactUpdateError("Name ist erforderlich.");
  }

  const contactResult = await postgrestUpdate<ContactRow>(
    "contacts",
    {
      display_name: displayName,
      handle: normalizeOptionalText(input.handle),
      source_platform: normalizeOptionalText(input.sourcePlatform) ?? "manual",
      language: normalizeOptionalText(input.language) ?? "de",
      status: normalizeOptionalText(input.status) ?? "new",
      tags: input.tags ?? [],
      summary: normalizeOptionalText(input.summary),
    },
    accessToken,
    [
      ["workspace_id", input.workspaceId],
      ["id", input.contactId],
    ],
    { select: CONTACT_COLUMNS, single: true },
  );

  if (contactResult.error) {
    return contactUpdateError(
      `Kontakt konnte nicht aktualisiert werden: ${contactResult.error.message}`,
    );
  }

  return { contact: contactResult.data, error: null };
}

export async function getContactMemories(
  workspaceId: string,
  contactId: string,
): Promise<MemoriesResult> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return memoriesError(
      "Keine aktive Supabase-Session gefunden. Bitte melde dich erneut an.",
    );
  }

  const memoriesResult = await postgrestSelect<MemoryRow[]>(
    "memories",
    accessToken,
    MEMORY_COLUMNS,
    [
      ["workspace_id", workspaceId],
      ["contact_id", contactId],
    ],
    undefined,
    false,
    "created_at.desc",
  );

  if (memoriesResult.error) {
    return memoriesError(
      `Memories konnten nicht geladen werden: ${withOptionalSchemaHint(memoriesResult.error.message, "memories")}`,
    );
  }

  return { memories: memoriesResult.data ?? [], error: null };
}

export async function createContactMemory(
  input: CreateMemoryInput,
): Promise<MemoryCreateResult> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return memoryCreateError(
      "Keine aktive Supabase-Session gefunden. Bitte melde dich erneut an.",
    );
  }

  const content = input.content.trim();

  if (!content) {
    return memoryCreateError("Memory-Inhalt ist erforderlich.");
  }

  const memoryResult = await postgrestRequest<MemoryRow>(
    "memories",
    "POST",
    {
      workspace_id: input.workspaceId,
      contact_id: input.contactId,
      type: normalizeOptionalText(input.type) ?? "note",
      content,
      importance: normalizeOptionalText(input.importance) ?? "normal",
    },
    accessToken,
    { select: MEMORY_COLUMNS, single: true },
  );

  if (memoryResult.error) {
    return memoryCreateError(
      `Memory konnte nicht gespeichert werden: ${withOptionalSchemaHint(memoryResult.error.message, "memories")}`,
    );
  }

  return { memory: memoryResult.data, error: null };
}

export async function getWorkspaceConversations(
  workspaceId: string,
): Promise<ConversationsResult> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return conversationsError(
      "Keine aktive Supabase-Session gefunden. Bitte melde dich erneut an.",
    );
  }

  const result = await postgrestSelect<ConversationRow[]>(
    "conversations",
    accessToken,
    CONVERSATION_COLUMNS,
    [["workspace_id", workspaceId]],
    undefined,
    false,
    "updated_at.desc",
  );

  if (result.error) {
    return conversationsError(
      `Conversations konnten nicht geladen werden: ${withOptionalSchemaHint(result.error.message, "conversations")}`,
    );
  }

  return {
    conversations: (result.data ?? []).filter(
      (conversation) => conversation.status !== "archived",
    ),
    error: null,
  };
}

export async function getContactConversationMessages(
  workspaceId: string,
  contactId: string,
): Promise<ConversationMessagesResult> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return conversationMessagesError(
      "Keine aktive Supabase-Session gefunden. Bitte melde dich erneut an.",
    );
  }

  const result = await postgrestSelect<ConversationMessageRow[]>(
    "conversation_messages",
    accessToken,
    CONVERSATION_MESSAGE_COLUMNS,
    [
      ["workspace_id", workspaceId],
      ["contact_id", contactId],
    ],
    undefined,
    false,
    "created_at.asc",
  );

  if (result.error) {
    return conversationMessagesError(
      `Nachrichten konnten nicht geladen werden: ${withOptionalSchemaHint(result.error.message, "conversation_messages")}`,
    );
  }

  return { messages: result.data ?? [], error: null };
}

export async function ensureConversationForContact(input: {
  workspaceId: string;
  contactId: string;
  sourcePlatform?: string | null;
  sourceType?: string | null;
  sourceUrl?: string | null;
  replyTargetUrl?: string | null;
}): Promise<ConversationResult> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return conversationError(
      "Keine aktive Supabase-Session gefunden. Bitte melde dich erneut an.",
    );
  }

  const existing = await postgrestSelect<ConversationRow[]>(
    "conversations",
    accessToken,
    CONVERSATION_COLUMNS,
    [
      ["workspace_id", input.workspaceId],
      ["contact_id", input.contactId],
    ],
    undefined,
    false,
    "updated_at.desc",
  );

  if (existing.error) {
    return conversationError(
      `Conversation konnte nicht geprüft werden: ${withOptionalSchemaHint(existing.error.message, "conversations")}`,
    );
  }

  const openConversation = (existing.data ?? []).find((conversation) =>
    ["open", "waiting"].includes(conversation.status),
  );

  if (openConversation) {
    return { conversation: openConversation, error: null };
  }

  const created = await postgrestRequest<ConversationRow>(
    "conversations",
    "POST",
    {
      workspace_id: input.workspaceId,
      contact_id: input.contactId,
      status: "open",
      priority: "normal",
      source_platform: normalizeOptionalText(input.sourcePlatform),
      source_type: normalizeMessageType(input.sourceType),
      source_url: normalizeUrl(input.sourceUrl),
      reply_target_url:
        normalizeUrl(input.replyTargetUrl) ?? normalizeUrl(input.sourceUrl),
      ai_status: "not_ready",
      next_step: "Antwort vorbereiten",
    },
    accessToken,
    { select: CONVERSATION_COLUMNS, single: true },
  );

  if (created.error) {
    return conversationError(
      `Conversation konnte nicht erstellt werden: ${withOptionalSchemaHint(created.error.message, "conversations")}`,
    );
  }

  return { conversation: created.data, error: null };
}

export async function createManualConversationMessage(
  input: CreateManualConversationMessageInput,
): Promise<ConversationMessageCreateResult> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return conversationMessageCreateError(
      "Keine aktive Supabase-Session gefunden. Bitte melde dich erneut an.",
    );
  }

  const content = input.content.trim();

  if (!content) {
    return conversationMessageCreateError("Nachrichtentext ist erforderlich.");
  }

  const sourceUrl = normalizeUrl(input.sourceUrl);
  const replyTargetUrl = normalizeUrl(input.replyTargetUrl) ?? sourceUrl;
  const messageType = normalizeMessageType(input.messageType);
  const direction = input.direction ?? "inbound";
  const conversationResult = await ensureConversationForContact({
    workspaceId: input.workspaceId,
    contactId: input.contactId,
    sourcePlatform: input.sourcePlatform,
    sourceType: messageType,
    sourceUrl,
    replyTargetUrl,
  });

  if (conversationResult.error || !conversationResult.conversation) {
    return {
      message: null,
      conversation: null,
      error:
        conversationResult.error ??
        new Error("Conversation konnte nicht erstellt werden."),
    };
  }

  const messageResult = await postgrestRequest<ConversationMessageRow>(
    "conversation_messages",
    "POST",
    {
      workspace_id: input.workspaceId,
      conversation_id: conversationResult.conversation.id,
      contact_id: input.contactId,
      direction,
      message_type: messageType,
      source_platform: normalizeOptionalText(input.sourcePlatform) ?? "manual",
      source_url: sourceUrl,
      reply_target_url: replyTargetUrl,
      external_message_id: normalizeOptionalText(input.externalMessageId),
      author_label:
        normalizeOptionalText(input.authorLabel) ??
        (direction === "inbound" ? "Fan" : "Team"),
      content,
    },
    accessToken,
    { select: CONVERSATION_MESSAGE_COLUMNS, single: true },
  );

  if (messageResult.error) {
    return conversationMessageCreateError(
      `Nachricht konnte nicht gespeichert werden: ${withOptionalSchemaHint(messageResult.error.message, "conversation_messages")}`,
    );
  }

  const updateValues: Record<string, string | null> = {
    last_message_preview: content.slice(0, 240),
    source_platform:
      normalizeOptionalText(input.sourcePlatform) ??
      conversationResult.conversation.source_platform,
    source_type: messageType,
    source_url: sourceUrl ?? conversationResult.conversation.source_url,
    reply_target_url:
      replyTargetUrl ?? conversationResult.conversation.reply_target_url,
    ai_status: "partial",
    next_step: "Antwort vorbereiten",
  };

  if (direction === "inbound")
    updateValues.last_inbound_at = new Date().toISOString();
  if (direction === "outbound")
    updateValues.last_outbound_at = new Date().toISOString();

  const updatedConversation = await postgrestUpdate<ConversationRow>(
    "conversations",
    updateValues,
    accessToken,
    [
      ["workspace_id", input.workspaceId],
      ["id", conversationResult.conversation.id],
    ],
    { select: CONVERSATION_COLUMNS, single: true },
  );

  return {
    message: messageResult.data,
    conversation: updatedConversation.data ?? conversationResult.conversation,
    error: updatedConversation.error,
  };
}

export async function createFacebookWebhookConversationMessage(input: {
  workspaceId: string;
  senderId?: string | null;
  authorLabel: string;
  content: string;
  messageType: "dm" | "comment";
  sourceUrl?: string | null;
  replyTargetUrl?: string | null;
  externalMessageId?: string | null;
}): Promise<ConversationMessageCreateResult> {
  const handle = normalizeOptionalText(input.senderId);
  let contact: ContactRow | null = null;

  if (handle) {
    const existing = await postgrestSelect<ContactRow>(
      "contacts",
      getServiceAccessToken(),
      CONTACT_COLUMNS,
      [
        ["workspace_id", input.workspaceId],
        ["handle", handle],
      ],
      1,
      true,
    );
    if (existing.error)
      return conversationMessageCreateError(existing.error.message);
    contact = existing.data;
  }

  if (!contact) {
    const created = await postgrestRequest<ContactRow>(
      "contacts",
      "POST",
      {
        workspace_id: input.workspaceId,
        display_name: input.authorLabel || "Facebook Nutzer",
        handle,
        source_platform: "facebook",
        language: "de",
        status: "new",
        tags: ["facebook"],
        summary: "Automatisch aus einem eingehenden Facebook-Webhook angelegt.",
      },
      getServiceAccessToken(),
      { select: CONTACT_COLUMNS, single: true },
    );
    if (created.error || !created.data)
      return conversationMessageCreateError(
        created.error?.message ?? "Kontakt konnte nicht angelegt werden.",
      );
    contact = created.data;
  }

  const result = await createMetaTestConversationMessage({
    workspaceId: input.workspaceId,
    contactId: contact.id,
    content: input.content,
    messageType: input.messageType,
    sourceUrl: input.sourceUrl,
    replyTargetUrl: input.replyTargetUrl,
    externalMessageId: input.externalMessageId,
    authorLabel: input.authorLabel,
  });

  await postgrestUpdate(
    "social_connections",
    { last_event_at: new Date().toISOString() },
    getServiceAccessToken(),
    [
      ["workspace_id", input.workspaceId],
      ["platform", "facebook"],
      ["status", "connected"],
    ],
  );

  return result;
}

export async function createMetaTestConversationMessage(input: {
  workspaceId: string;
  contactId: string;
  content: string;
  messageType: "dm" | "comment";
  sourceUrl?: string | null;
  replyTargetUrl?: string | null;
  externalMessageId?: string | null;
  authorLabel?: string | null;
}): Promise<ConversationMessageCreateResult> {
  const content = input.content.trim();

  if (!content) {
    return conversationMessageCreateError("Nachrichtentext ist erforderlich.");
  }

  const sourceUrl = normalizeUrl(input.sourceUrl);
  const replyTargetUrl = normalizeUrl(input.replyTargetUrl) ?? sourceUrl;
  const conversationResult = await ensureMetaTestConversation({
    workspaceId: input.workspaceId,
    contactId: input.contactId,
    sourceType: input.messageType,
    sourceUrl,
    replyTargetUrl,
    externalMessageId: input.externalMessageId,
  });

  if (conversationResult.error || !conversationResult.conversation) {
    return {
      message: null,
      conversation: null,
      error:
        conversationResult.error ??
        new Error("Conversation konnte nicht erstellt werden."),
    };
  }

  const messageResult = await postgrestRequest<ConversationMessageRow>(
    "conversation_messages",
    "POST",
    {
      workspace_id: input.workspaceId,
      conversation_id: conversationResult.conversation.id,
      contact_id: input.contactId,
      direction: "inbound",
      message_type: input.messageType,
      source_platform: "facebook",
      source_url: sourceUrl,
      reply_target_url: replyTargetUrl,
      external_message_id: normalizeOptionalText(input.externalMessageId),
      author_label:
        normalizeOptionalText(input.authorLabel) ?? "Facebook Nutzer",
      content,
    },
    getServiceAccessToken(),
    { select: CONVERSATION_MESSAGE_COLUMNS, single: true },
  );

  if (messageResult.error) {
    return conversationMessageCreateError(
      `Nachricht konnte nicht gespeichert werden: ${withOptionalSchemaHint(messageResult.error.message, "conversation_messages")}`,
    );
  }

  const updatedConversation = await postgrestUpdate<ConversationRow>(
    "conversations",
    {
      last_message_preview: content.slice(0, 240),
      last_inbound_at: new Date().toISOString(),
      source_platform: "facebook",
      source_type: input.messageType,
      source_url: sourceUrl ?? conversationResult.conversation.source_url,
      reply_target_url:
        replyTargetUrl ?? conversationResult.conversation.reply_target_url,
      external_message_id:
        normalizeOptionalText(input.externalMessageId) ??
        conversationResult.conversation.external_message_id,
      ai_status: "partial",
      next_step: "Antwort vorbereiten",
    },
    getServiceAccessToken(),
    [
      ["workspace_id", input.workspaceId],
      ["id", conversationResult.conversation.id],
    ],
    { select: CONVERSATION_COLUMNS, single: true },
  );

  return {
    message: messageResult.data,
    conversation: updatedConversation.data ?? conversationResult.conversation,
    error: updatedConversation.error,
  };
}

async function ensureMetaTestConversation(input: {
  workspaceId: string;
  contactId: string;
  sourceType: string;
  sourceUrl?: string | null;
  replyTargetUrl?: string | null;
  externalMessageId?: string | null;
}): Promise<ConversationResult> {
  const existing = await postgrestSelect<ConversationRow[]>(
    "conversations",
    getServiceAccessToken(),
    CONVERSATION_COLUMNS,
    [
      ["workspace_id", input.workspaceId],
      ["contact_id", input.contactId],
    ],
    undefined,
    false,
    "updated_at.desc",
  );

  if (existing.error) {
    return conversationError(
      `Conversation konnte nicht geprüft werden: ${withOptionalSchemaHint(existing.error.message, "conversations")}`,
    );
  }

  const openConversation = (existing.data ?? []).find((conversation) =>
    ["open", "waiting"].includes(conversation.status),
  );

  if (openConversation) return { conversation: openConversation, error: null };

  const created = await postgrestRequest<ConversationRow>(
    "conversations",
    "POST",
    {
      workspace_id: input.workspaceId,
      contact_id: input.contactId,
      status: "open",
      priority: "normal",
      source_platform: "facebook",
      source_type: normalizeMessageType(input.sourceType),
      source_url: normalizeUrl(input.sourceUrl),
      reply_target_url:
        normalizeUrl(input.replyTargetUrl) ?? normalizeUrl(input.sourceUrl),
      external_message_id: normalizeOptionalText(input.externalMessageId),
      ai_status: "partial",
      next_step: "Antwort vorbereiten",
    },
    getServiceAccessToken(),
    { select: CONVERSATION_COLUMNS, single: true },
  );

  if (created.error) {
    return conversationError(
      `Conversation konnte nicht erstellt werden: ${withOptionalSchemaHint(created.error.message, "conversations")}`,
    );
  }

  return { conversation: created.data, error: null };
}

export async function updateConversationStatus(input: {
  workspaceId: string;
  conversationId: string;
  status: ConversationStatus;
  nextStep?: string | null;
}): Promise<ConversationUpdateResult> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return conversationUpdateError(
      "Keine aktive Supabase-Session gefunden. Bitte melde dich erneut an.",
    );
  }

  const now = new Date().toISOString();
  const values: Record<string, string | null> = {
    status: input.status,
    updated_at: now,
  };

  if (input.nextStep !== undefined) {
    values.next_step = normalizeOptionalText(input.nextStep);
  }

  const result = await postgrestUpdate<ConversationRow>(
    "conversations",
    values,
    accessToken,
    [
      ["workspace_id", input.workspaceId],
      ["id", input.conversationId],
    ],
    { select: CONVERSATION_COLUMNS, single: true },
  );

  if (result.error) {
    return conversationUpdateError(
      `Conversation-Status konnte nicht gespeichert werden: ${withOptionalSchemaHint(result.error.message, "conversations")}`,
    );
  }

  return { conversation: result.data, error: null };
}

export async function updateConversationPriority(input: {
  workspaceId: string;
  conversationId: string;
  priority: ConversationPriority;
}): Promise<ConversationUpdateResult> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return conversationUpdateError(
      "Keine aktive Supabase-Session gefunden. Bitte melde dich erneut an.",
    );
  }

  const result = await postgrestUpdate<ConversationRow>(
    "conversations",
    { priority: input.priority, updated_at: new Date().toISOString() },
    accessToken,
    [
      ["workspace_id", input.workspaceId],
      ["id", input.conversationId],
    ],
    { select: CONVERSATION_COLUMNS, single: true },
  );

  if (result.error) {
    return conversationUpdateError(
      `Conversation-Priorität konnte nicht gespeichert werden: ${withOptionalSchemaHint(result.error.message, "conversations")}`,
    );
  }

  return { conversation: result.data, error: null };
}

export async function saveReplyDraftAsNote(input: {
  workspaceId: string;
  conversationId: string;
  contactId: string;
  content: string;
}): Promise<ConversationMessageCreateResult> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return conversationMessageCreateError(
      "Keine aktive Supabase-Session gefunden. Bitte melde dich erneut an.",
    );
  }

  const content = input.content.trim();

  if (!content) {
    return conversationMessageCreateError("Antwortentwurf ist erforderlich.");
  }

  const messageResult = await postgrestRequest<ConversationMessageRow>(
    "conversation_messages",
    "POST",
    {
      workspace_id: input.workspaceId,
      conversation_id: input.conversationId,
      contact_id: input.contactId,
      direction: "note",
      message_type: "note",
      source_platform: "manual",
      author_label: "Antwortentwurf",
      content,
    },
    accessToken,
    { select: CONVERSATION_MESSAGE_COLUMNS, single: true },
  );

  if (messageResult.error) {
    return conversationMessageCreateError(
      `Antwortentwurf konnte nicht gespeichert werden: ${withOptionalSchemaHint(messageResult.error.message, "conversation_messages")}`,
    );
  }

  const updatedConversation = await postgrestUpdate<ConversationRow>(
    "conversations",
    {
      last_message_preview: "Antwortentwurf gespeichert",
      ai_status: content.length > 20 ? "ready" : "partial",
      next_step: "Im Originalkanal manuell senden",
      updated_at: new Date().toISOString(),
    },
    accessToken,
    [
      ["workspace_id", input.workspaceId],
      ["id", input.conversationId],
      ["contact_id", input.contactId],
    ],
    { select: CONVERSATION_COLUMNS, single: true },
  );

  return {
    message: messageResult.data,
    conversation: updatedConversation.data,
    error: updatedConversation.error,
  };
}

export async function getContactFollowups(
  workspaceId: string,
  contactId: string,
): Promise<FollowupsResult> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return followupsError(
      "Keine aktive Supabase-Session gefunden. Bitte melde dich erneut an.",
    );
  }

  const followupsResult = await postgrestSelect<FollowupRow[]>(
    "followups",
    accessToken,
    FOLLOWUP_COLUMNS,
    [
      ["workspace_id", workspaceId],
      ["contact_id", contactId],
    ],
    undefined,
    false,
    "created_at.desc",
  );

  if (followupsResult.error) {
    return followupsError(
      `Follow-ups konnten nicht geladen werden: ${withOptionalSchemaHint(followupsResult.error.message, "followups")}`,
    );
  }

  return { followups: followupsResult.data ?? [], error: null };
}

export async function createContactFollowup(
  input: CreateFollowupInput,
): Promise<FollowupCreateResult> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return followupCreateError(
      "Keine aktive Supabase-Session gefunden. Bitte melde dich erneut an.",
    );
  }

  const reason = input.reason.trim();

  if (!reason) {
    return followupCreateError("Follow-up-Grund ist erforderlich.");
  }

  const followupResult = await postgrestRequest<FollowupRow>(
    "followups",
    "POST",
    {
      workspace_id: input.workspaceId,
      contact_id: input.contactId,
      due_date: normalizeOptionalText(input.dueDate),
      priority: normalizeOptionalText(input.priority) ?? "normal",
      reason,
      status: normalizeOptionalText(input.status) ?? "open",
    },
    accessToken,
    { select: FOLLOWUP_COLUMNS, single: true },
  );

  if (followupResult.error) {
    return followupCreateError(
      `Follow-up konnte nicht gespeichert werden: ${withOptionalSchemaHint(followupResult.error.message, "followups")}`,
    );
  }

  return { followup: followupResult.data, error: null };
}

export async function getOpenFollowupCount(
  workspaceId: string,
): Promise<FollowupCountResult> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return {
      count: 0,
      error: new Error(
        "Keine aktive Supabase-Session gefunden. Bitte melde dich erneut an.",
      ),
    };
  }

  const countResult = await postgrestCount("followups", accessToken, [
    ["workspace_id", workspaceId],
    ["status", "open"],
  ]);

  if (countResult.error) {
    return {
      count: 0,
      error: new Error(
        `Offene Follow-ups konnten nicht gezählt werden: ${withOptionalSchemaHint(countResult.error.message, "followups")}`,
      ),
    };
  }

  return { count: countResult.count, error: null };
}

export async function getWorkspaceOpenFollowups(
  workspaceId: string,
): Promise<FollowupsResult> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return followupsError(
      "Keine aktive Supabase-Session gefunden. Bitte melde dich erneut an.",
    );
  }

  const followupsResult = await postgrestSelect<FollowupRow[]>(
    "followups",
    accessToken,
    FOLLOWUP_COLUMNS,
    [
      ["workspace_id", workspaceId],
      ["status", "open"],
    ],
    undefined,
    false,
    "due_date.asc.nullslast,created_at.desc",
  );

  if (followupsResult.error) {
    return followupsError(
      `Follow-ups konnten nicht geladen werden: ${withOptionalSchemaHint(followupsResult.error.message, "followups")}`,
    );
  }

  return { followups: followupsResult.data ?? [], error: null };
}

export async function ensureUserWorkspace(
  user: SupabaseServerUser,
): Promise<WorkspaceBackfillResult> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return workspaceBackfillError(
      "Keine aktive Supabase-Session gefunden. Bitte melde dich erneut an.",
    );
  }

  const email =
    user.email ?? stringMetadataValue(user.user_metadata, "email") ?? "";
  const displayName =
    stringMetadataValue(user.user_metadata, "display_name") ??
    stringMetadataValue(user.user_metadata, "full_name");
  const workspaceName =
    stringMetadataValue(user.user_metadata, "organization") ??
    displayName ??
    DEFAULT_WORKSPACE_NAME;
  const workspaceTerms = resolveWorkspaceTerms(user.user_metadata);

  const profileResult = await postgrestRequest(
    "profiles",
    "POST",
    {
      id: user.id,
      email,
      display_name: displayName ?? null,
    },
    accessToken,
    { upsert: true },
  );

  if (profileResult.error) {
    return workspaceBackfillError(
      `Profil konnte nicht vorbereitet werden: ${profileResult.error.message}`,
    );
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
    return workspaceBackfillError(
      `Workspace-Mitgliedschaft konnte nicht gelesen werden: ${memberResult.error.message}`,
    );
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
      return workspaceBackfillError(
        `Workspace konnte nicht gelesen werden: ${memberWorkspaceResult.error.message}`,
      );
    }

    if (memberWorkspaceResult.data) {
      return {
        workspace: memberWorkspaceResult.data,
        error: null,
        created: false,
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
    return workspaceBackfillError(
      `Workspace konnte nicht gesucht werden: ${ownerWorkspaceResult.error.message}`,
    );
  }

  let workspace = ownerWorkspaceResult.data;
  let created = false;

  if (!workspace) {
    const insertWorkspaceResult = await postgrestRequest<WorkspaceBackfillRow>(
      "workspaces",
      "POST",
      {
        name: workspaceName,
        owner_user_id: user.id,
        plan_id: workspaceTerms.planId,
        commercial_option: workspaceTerms.commercialOption,
        setup_fee_cents: workspaceTerms.setupFeeCents,
        monthly_fee_cents: workspaceTerms.monthlyFeeCents,
        commitment_months: workspaceTerms.commitmentMonths,
      },
      accessToken,
      { select: WORKSPACE_COLUMNS, single: true },
    );

    if (insertWorkspaceResult.error) {
      return workspaceBackfillError(
        `Workspace konnte nicht angelegt werden: ${insertWorkspaceResult.error.message}`,
      );
    }

    workspace = insertWorkspaceResult.data;
    created = true;
  }

  if (!workspace?.id) {
    return workspaceBackfillError(
      "Workspace konnte nicht erstellt oder geladen werden.",
    );
  }

  const existingMemberResult = await postgrestSelect<WorkspaceMemberRow>(
    "workspace_members",
    accessToken,
    "id,workspace_id",
    [
      ["workspace_id", workspace.id],
      ["user_id", user.id],
    ],
    1,
    true,
  );

  if (existingMemberResult.error) {
    return workspaceBackfillError(
      `Workspace-Mitgliedschaft konnte nicht geprüft werden: ${existingMemberResult.error.message}`,
    );
  }

  if (!existingMemberResult.data) {
    const insertMemberResult = await postgrestRequest(
      "workspace_members",
      "POST",
      {
        workspace_id: workspace.id,
        user_id: user.id,
        role: "owner",
      },
      accessToken,
    );

    if (insertMemberResult.error) {
      return workspaceBackfillError(
        `Workspace-Mitgliedschaft konnte nicht angelegt werden: ${insertMemberResult.error.message}`,
      );
    }
  }

  return { workspace, error: null, created };
}

async function parseSupabaseServerError(response: Response): Promise<Error> {
  const payload = (await response.json().catch(() => null)) as {
    msg?: string;
    message?: string;
    error_description?: string;
    error?: string;
  } | null;
  const message =
    payload?.msg ??
    payload?.message ??
    payload?.error_description ??
    payload?.error ??
    "Die Supabase-Session ist ungültig oder abgelaufen.";

  return new Error(message);
}

async function postgrestRequest<T = unknown>(
  table: string,
  method: "POST" | "PATCH",
  values: unknown,
  accessToken: string | undefined,
  options: {
    select?: string;
    single?: boolean;
    upsert?: boolean;
    onConflict?: string;
  } = {},
): Promise<PostgrestResult<T>> {
  try {
    const url = new URL(getSupabaseRestUrl(table));

    if (options.select) {
      url.searchParams.set("select", options.select);
    }

    if (options.upsert) {
      url.searchParams.set("on_conflict", options.onConflict ?? "id");
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

    return {
      data: options.single ? (payload[0] ?? null) : (payload as T),
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error
          : new Error("Unbekannter Supabase-Fehler."),
    };
  }
}

async function postgrestUpdate<T = unknown>(
  table: string,
  values: unknown,
  accessToken: string | undefined,
  filters: [string, SupabaseFilterValue][],
  options: { select?: string; single?: boolean } = {},
): Promise<PostgrestResult<T>> {
  try {
    const url = new URL(getSupabaseRestUrl(table));

    if (options.select) {
      url.searchParams.set("select", options.select);
    }

    for (const [column, value] of filters) {
      url.searchParams.set(column, `eq.${String(value)}`);
    }

    const response = await fetch(url.toString(), {
      method: "PATCH",
      headers: {
        ...getSupabaseHeaders(accessToken),
        Prefer: options.select ? "return=representation" : "return=minimal",
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

    return {
      data: options.single ? (payload[0] ?? null) : (payload as T),
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error
          : new Error("Unbekannter Supabase-Fehler."),
    };
  }
}

async function postgrestCount(
  table: string,
  accessToken: string,
  filters: [string, SupabaseFilterValue][],
): Promise<PostgrestCountResult> {
  try {
    const url = new URL(getSupabaseRestUrl(table));
    url.searchParams.set("select", "id");

    for (const [column, value] of filters) {
      url.searchParams.set(column, `eq.${String(value)}`);
    }

    const response = await fetch(url.toString(), {
      method: "HEAD",
      headers: {
        ...getSupabaseHeaders(accessToken),
        Prefer: "count=exact",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return { count: 0, error: await parseSupabaseServerError(response) };
    }

    const contentRange = response.headers.get("content-range");
    const count = contentRange ? Number(contentRange.split("/").at(-1)) : 0;

    return {
      count: Number.isFinite(count) ? count : 0,
      error: null,
    };
  } catch (error) {
    return {
      count: 0,
      error:
        error instanceof Error
          ? error
          : new Error("Unbekannter Supabase-Fehler."),
    };
  }
}

async function postgrestSelect<T>(
  table: string,
  accessToken: string | undefined,
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

    return {
      data: single ? (payload[0] ?? null) : (payload as T),
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error
          : new Error("Unbekannter Supabase-Fehler."),
    };
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

function contactUpdateError(message: string): ContactUpdateResult {
  return { contact: null, error: new Error(message) };
}

function contactDetailError(message: string): ContactDetailResult {
  return { contact: null, error: new Error(message) };
}

function memoriesError(message: string): MemoriesResult {
  return { memories: [], error: new Error(message) };
}

function memoryCreateError(message: string): MemoryCreateResult {
  return { memory: null, error: new Error(message) };
}

function conversationsError(message: string): ConversationsResult {
  return { conversations: [], error: new Error(message) };
}

function conversationMessagesError(
  message: string,
): ConversationMessagesResult {
  return { messages: [], error: new Error(message) };
}

function conversationError(message: string): ConversationResult {
  return { conversation: null, error: new Error(message) };
}

function conversationMessageCreateError(
  message: string,
): ConversationMessageCreateResult {
  return { message: null, conversation: null, error: new Error(message) };
}

function conversationUpdateError(message: string): ConversationUpdateResult {
  return { conversation: null, error: new Error(message) };
}

function socialConnectionError(message: string): SocialConnectionResult {
  return { connection: null, error: new Error(message) };
}

function socialConnectionsError(message: string): SocialConnectionsResult {
  return { connections: [], error: new Error(message) };
}

function followupsError(message: string): FollowupsResult {
  return { followups: [], error: new Error(message) };
}

function followupCreateError(message: string): FollowupCreateResult {
  return { followup: null, error: new Error(message) };
}

function withOptionalSchemaHint(
  message: string,
  tableName:
    | "memories"
    | "followups"
    | "conversations"
    | "conversation_messages",
): string {
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes(tableName) ||
    lowerMessage.includes("relation") ||
    lowerMessage.includes("schema cache")
  ) {
    return `${message} Bitte spiele docs/database/fanmind_memory_followups_schema.sql in Supabase ein.`;
  }

  return message;
}

function normalizeMessageType(value: string | null | undefined): string {
  const normalized = normalizeOptionalText(value)?.toLowerCase();
  return ["dm", "comment", "post", "email", "form", "note", "manual"].includes(
    normalized ?? "",
  )
    ? normalized!
    : "dm";
}

function normalizeUrl(value: string | null | undefined): string | null {
  const normalized = normalizeOptionalText(value);
  return normalized && /^https?:\/\//i.test(normalized) ? normalized : null;
}

function normalizeOptionalText(
  value: string | null | undefined,
): string | null {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function stringMetadataValue(
  metadata: Record<string, unknown> | undefined,
  key: string,
): string | undefined {
  const value = metadata?.[key];

  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function resolveWorkspaceTerms(metadata: Record<string, unknown> | undefined) {
  const rawPlanId =
    stringMetadataValue(metadata, "plan") ??
    stringMetadataValue(metadata, "plan_id");
  const rawCommercialOption =
    stringMetadataValue(metadata, "commercialOption") ??
    stringMetadataValue(metadata, "commercial_option");
  const planId =
    isPlanId(rawPlanId) && (rawPlanId === "pilot" || rawPlanId === "starter")
      ? rawPlanId
      : "starter";
  const commercialOption = isProductiveCommercialOption(rawCommercialOption)
    ? rawCommercialOption
    : "starter_paid_setup";

  if (planId === "pilot" && commercialOption === "pilot_only") {
    return { planId, ...getRegistrationCommercialTerms("pilot")! };
  }

  if (
    planId === "starter" &&
    commercialOption === "starter_no_setup_commitment"
  ) {
    return {
      planId,
      commercialOption,
      setupFeeCents: 0,
      monthlyFeeCents: 29900,
      commitmentMonths: 12 as const,
    };
  }

  if (planId === "starter" && isStarterCommercialOption(commercialOption)) {
    return {
      planId,
      ...getRegistrationCommercialTerms("starter", "starter_paid_setup")!,
    };
  }

  return {
    planId: "starter" as PlanId,
    ...getRegistrationCommercialTerms("starter", "starter_paid_setup")!,
  };
}

function isStarterCommercialOption(
  value: WorkspaceCommercialOption,
): value is Extract<
  WorkspaceCommercialOption,
  "starter_paid_setup" | "starter_no_setup_commitment"
> {
  return STARTER_COMMERCIAL_OPTIONS.includes(value);
}

function isProductiveCommercialOption(
  value: unknown,
): value is WorkspaceCommercialOption {
  return (
    value === "pilot_only" ||
    value === "starter_paid_setup" ||
    value === "starter_no_setup_commitment"
  );
}
