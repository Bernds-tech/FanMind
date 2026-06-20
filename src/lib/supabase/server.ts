import {
  getMessageKindFromAttachments,
  normalizeMessageAttachments,
  type NormalizedMessageAttachment as ConversationMessageAttachment,
} from "@/lib/messageAttachments";
export type { NormalizedMessageAttachment as ConversationMessageAttachment } from "@/lib/messageAttachments";

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
  internal_notes: string | null;
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

export type ContactReplyTargetRow = {
  id: string;
  workspace_id: string;
  contact_id: string;
  source_platform: string;
  source_type: string;
  label: string | null;
  url: string;
  quality: string;
  created_at: string | null;
  updated_at: string | null;
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
  external_post_id: string | null;
  external_video_id: string | null;
  external_comment_id: string | null;
  original_author_label: string | null;
  original_text_excerpt: string | null;
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
  source_type: string | null;
  source_url: string | null;
  reply_target_url: string | null;
  external_thread_id: string | null;
  external_message_id: string | null;
  external_post_id: string | null;
  external_video_id: string | null;
  external_comment_id: string | null;
  original_author_label: string | null;
  original_text_excerpt: string | null;
  author_label: string | null;
  content: string;
  attachments: ConversationMessageAttachment[] | null;
  message_kind: string | null;
  created_at: string | null;
  seen_at: string | null;
};

export type ConversationSummaryRow = {
  id: string;
  workspace_id: string;
  conversation_id: string;
  contact_id: string;
  summary: string | null;
  key_points: string[] | null;
  open_questions: string[] | null;
  last_summarized_message_at: string | null;
  message_count_seen: number;
  updated_at: string | null;
  created_at: string | null;
};

export type FanAnalysisReportRow = {
  id: string;
  workspace_id: string;
  contact_id: string;
  report_json: Record<string, unknown>;
  summary: string | null;
  model: string | null;
  source_message_count: number;
  generated_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type ContactAiProfileRow = {
  id: string;
  workspace_id: string;
  contact_id: string;
  language: string | null;
  tone: string | null;
  sentiment: string | null;
  interests: string[] | null;
  buying_signals: string[] | null;
  no_gos: string[] | null;
  preferred_style: string | null;
  response_triggers: string[] | null;
  risk_notes: string[] | null;
  confidence_score: number | null;
  source_message_count: number | null;
  updated_at: string | null;
  created_at: string | null;
};

export type WorkspaceVoiceProfileRow = {
  id: string;
  workspace_id: string;
  user_id: string | null;
  owner_label: string | null;
  language: string | null;
  tone: string | null;
  sentence_length: string | null;
  emoji_style: string | null;
  greeting_style: string | null;
  closing_style: string | null;
  common_phrases: string[] | null;
  avoided_phrases: string[] | null;
  sales_style: string | null;
  examples_count: number | null;
  confidence_score: number | null;
  updated_at: string | null;
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
  last_comment_fetch_at: string | null;
  last_comment_fetch_count: number | null;
  last_comment_fetch_error: string | null;
  last_messenger_sync_at: string | null;
  last_messenger_sync_checked_count: number | null;
  last_messenger_sync_imported_inbound_count: number | null;
  last_messenger_sync_imported_outbound_count: number | null;
  last_messenger_sync_imported_media_count: number | null;
  last_messenger_sync_skipped_count: number | null;
  last_messenger_sync_error: string | null;
  last_messenger_sync_outbound_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MetaWebhookEventRow = {
  id: string;
  workspace_id: string | null;
  social_connection_id: string | null;
  platform: string;
  source: string;
  event_type: string;
  page_id: string | null;
  sender_id: string | null;
  recipient_id: string | null;
  text: string | null;
  message_text: string | null;
  raw_payload: unknown;
  status: string;
  error_reason: string | null;
  message_id: string | null;
  received_at: string;
  created_at: string;
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
  sourceType?: string | null;
  sourceUrl?: string | null;
  replyTargetUrl?: string | null;
  externalMessageId?: string | null;
  externalThreadId?: string | null;
  externalPostId?: string | null;
  externalCommentId?: string | null;
  originalAuthorLabel?: string | null;
  originalTextExcerpt?: string | null;
  authorLabel?: string | null;
  userId?: string | null;
  content: string;
  attachments?: ConversationMessageAttachment[] | null;
  messageKind?: string | null;
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

type ContactReplyTargetResult = {
  target: ContactReplyTargetRow | null;
  error: Error | null;
};

type FanAnalysisReportResult = {
  report: FanAnalysisReportRow | null;
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

export type MetaWebhookEventsResult = {
  events: MetaWebhookEventRow[];
  error: Error | null;
};

type MetaWebhookEventCreateResult = {
  event: MetaWebhookEventRow | null;
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

type SupabaseFilterValue = string | number | boolean | null;

const WORKSPACE_COLUMNS =
  "id,name,owner_user_id,plan_id,commercial_option,setup_fee_cents,monthly_fee_cents,commitment_months";
const CONTACT_COLUMNS =
  "id,workspace_id,display_name,handle,source_platform,language,status,tags,summary,internal_notes,created_at,updated_at";
const MEMORY_COLUMNS =
  "id,workspace_id,contact_id,type,content,importance,created_at";
const CONTACT_REPLY_TARGET_COLUMNS =
  "id,workspace_id,contact_id,source_platform,source_type,label,url,quality,created_at,updated_at";
const CONVERSATION_COLUMNS =
  "id,workspace_id,contact_id,status,priority,source_platform,source_type,source_url,reply_target_url,external_thread_id,external_message_id,external_post_id,external_video_id,external_comment_id,original_author_label,original_text_excerpt,last_inbound_at,last_outbound_at,last_message_preview,assigned_owner,ai_status,next_step,created_at,updated_at";
const CONVERSATION_MESSAGE_COLUMNS =
  "id,workspace_id,conversation_id,contact_id,direction,message_type,source_platform,source_type,source_url,reply_target_url,external_thread_id,external_message_id,external_post_id,external_video_id,external_comment_id,original_author_label,original_text_excerpt,author_label,content,attachments,message_kind,created_at,seen_at";
const CONVERSATION_SUMMARY_COLUMNS =
  "id,workspace_id,conversation_id,contact_id,summary,key_points,open_questions,last_summarized_message_at,message_count_seen,updated_at,created_at";
const CONTACT_AI_PROFILE_COLUMNS =
  "id,workspace_id,contact_id,language,tone,sentiment,interests,buying_signals,no_gos,preferred_style,response_triggers,risk_notes,confidence_score,source_message_count,updated_at,created_at";
const FAN_ANALYSIS_REPORT_COLUMNS =
  "id,workspace_id,contact_id,report_json,summary,model,source_message_count,generated_at,created_at,updated_at";
const WORKSPACE_VOICE_PROFILE_COLUMNS =
  "id,workspace_id,user_id,owner_label,language,tone,sentence_length,emoji_style,greeting_style,closing_style,common_phrases,avoided_phrases,sales_style,examples_count,confidence_score,updated_at,created_at";
const SOCIAL_CONNECTION_COLUMNS =
  "id,workspace_id,platform,provider,status,external_account_id,external_account_name,page_id,page_name,page_access_token_encrypted,token_last_four,scopes,webhook_subscribed,connected_by,connected_at,disconnected_at,last_event_at,last_comment_fetch_at,last_comment_fetch_count,last_comment_fetch_error,last_messenger_sync_at,last_messenger_sync_checked_count,last_messenger_sync_imported_inbound_count,last_messenger_sync_imported_outbound_count,last_messenger_sync_imported_media_count,last_messenger_sync_skipped_count,last_messenger_sync_error,last_messenger_sync_outbound_at,created_at,updated_at";
const META_WEBHOOK_EVENT_COLUMNS =
  "id,workspace_id,social_connection_id,platform,source,event_type,page_id,sender_id,recipient_id,text,message_text,raw_payload,status,error_reason,message_id,received_at,created_at";
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

  const values = {
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
  };

  const existingResult = await postgrestSelect<SocialConnectionRow>(
    "social_connections",
    accessToken,
    SOCIAL_CONNECTION_COLUMNS,
    [
      ["workspace_id", input.workspaceId],
      ["platform", "facebook"],
      ["page_id", input.pageId],
    ],
    1,
    true,
  );

  if (existingResult.error) {
    return socialConnectionError(
      `Facebook-Verbindung konnte nicht geprüft werden: ${existingResult.error.message}`,
    );
  }

  const result = existingResult.data
    ? await postgrestUpdate<SocialConnectionRow>(
        "social_connections",
        values,
        accessToken,
        [["id", existingResult.data.id]],
        { select: SOCIAL_CONNECTION_COLUMNS, single: true },
      )
    : await postgrestRequest<SocialConnectionRow>(
        "social_connections",
        "POST",
        values,
        accessToken,
        { select: SOCIAL_CONNECTION_COLUMNS, single: true },
      );

  if (result.error)
    return socialConnectionError(
      `Facebook-Verbindung konnte nicht gespeichert werden: ${result.error.message}`,
    );
  return { connection: result.data, error: null };
}

export async function updateFacebookWebhookSubscribed(
  connectionId: string,
  webhookSubscribed: boolean,
): Promise<SocialConnectionResult> {
  const accessToken = (await getAccessToken()) ?? getServiceAccessToken();

  const result = await postgrestUpdate<SocialConnectionRow>(
    "social_connections",
    { webhook_subscribed: webhookSubscribed },
    accessToken,
    [
      ["id", connectionId],
      ["platform", "facebook"],
    ],
    { select: SOCIAL_CONNECTION_COLUMNS, single: true },
  );

  if (result.error)
    return socialConnectionError(
      `Facebook-Webhook-Status konnte nicht gespeichert werden: ${result.error.message}`,
    );
  return { connection: result.data, error: null };
}
export async function updateFacebookCommentFetchStatus(
  connectionId: string,
  input: { fetchedAt: string; importedCount: number; error?: string | null },
): Promise<SocialConnectionResult> {
  const accessToken = await getAccessToken();
  if (!accessToken)
    return socialConnectionError("Keine aktive Supabase-Session gefunden.");

  const result = await postgrestUpdate<SocialConnectionRow>(
    "social_connections",
    {
      last_comment_fetch_at: input.fetchedAt,
      last_comment_fetch_count: input.importedCount,
      last_comment_fetch_error: normalizeOptionalText(input.error),
    },
    accessToken,
    [
      ["id", connectionId],
      ["platform", "facebook"],
    ],
    { select: SOCIAL_CONNECTION_COLUMNS, single: true },
  );

  if (result.error)
    return socialConnectionError(
      `Facebook-Kommentarabruf konnte nicht aktualisiert werden: ${result.error.message}`,
    );
  return { connection: result.data, error: null };
}

export async function updateFacebookMessengerSyncStatus(
  connectionId: string,
  input: {
    syncedAt: string;
    checkedConversations: number;
    importedInbound: number;
    importedOutbound: number;
    importedMedia?: number;
    skippedDuplicates: number;
    error?: string | null;
    lastOutboundAt?: string | null;
  },
): Promise<SocialConnectionResult> {
  const accessToken = (await getAccessToken()) ?? getServiceAccessToken();

  const result = await postgrestUpdate<SocialConnectionRow>(
    "social_connections",
    {
      last_messenger_sync_at: input.syncedAt,
      last_messenger_sync_checked_count: input.checkedConversations,
      last_messenger_sync_imported_inbound_count: input.importedInbound,
      last_messenger_sync_imported_outbound_count: input.importedOutbound,
      last_messenger_sync_imported_media_count: input.importedMedia ?? 0,
      last_messenger_sync_skipped_count: input.skippedDuplicates,
      last_messenger_sync_error: normalizeOptionalText(input.error),
      last_messenger_sync_outbound_at: normalizeIsoTimestamp(
        input.lastOutboundAt,
      ),
    },
    accessToken,
    [
      ["id", connectionId],
      ["platform", "facebook"],
    ],
    { select: SOCIAL_CONNECTION_COLUMNS, single: true },
  );

  if (result.error)
    return socialConnectionError(
      `Facebook-Messenger-Sync konnte nicht aktualisiert werden: ${result.error.message}`,
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

export async function findMetaSocialConnectionByPageId(
  platform: "facebook" | "instagram",
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
      ["platform", platform],
      ["status", "connected"],
      ["page_id", pageId],
    ],
    1,
    true,
  );
  if (result.error) return socialConnectionError(result.error.message);
  return { connection: result.data, error: null };
}

export async function findMetaWebhookFallbackWorkspaceId(): Promise<{
  workspaceId: string | null;
  error: Error | null;
}> {
  const serviceAccessToken = getServiceAccessToken();
  if (!serviceAccessToken) {
    return {
      workspaceId: null,
      error: new Error(
        "SUPABASE_SERVICE_ROLE_KEY ist für Webhook-Diagnose nicht konfiguriert.",
      ),
    };
  }

  const connectionResult = await postgrestSelect<SocialConnectionRow>(
    "social_connections",
    serviceAccessToken,
    SOCIAL_CONNECTION_COLUMNS,
    [
      ["platform", "facebook"],
      ["status", "connected"],
    ],
    1,
    true,
    "connected_at.desc",
  );

  if (connectionResult.error) {
    return { workspaceId: null, error: connectionResult.error };
  }

  if (connectionResult.data?.workspace_id) {
    return { workspaceId: connectionResult.data.workspace_id, error: null };
  }

  const workspaceResult = await postgrestSelect<WorkspaceBackfillRow>(
    "workspaces",
    serviceAccessToken,
    WORKSPACE_COLUMNS,
    [],
    1,
    true,
    "created_at.desc",
  );

  if (workspaceResult.error) {
    return { workspaceId: null, error: workspaceResult.error };
  }

  return { workspaceId: workspaceResult.data?.id ?? null, error: null };
}

export async function createMetaWebhookDebugEvent(input: {
  workspaceId?: string | null;
  socialConnectionId?: string | null;
  platform?: "facebook" | "instagram";
  eventType: "feed" | "feed_comment" | "messages" | "comments" | "unknown";
  pageId?: string | null;
  senderId?: string | null;
  recipientId?: string | null;
  messageText?: string | null;
  rawPayload: unknown;
  status: string;
  errorReason?: string | null;
  messageId?: string | null;
  receivedAt?: string;
}): Promise<MetaWebhookEventCreateResult> {
  const serviceAccessToken = getServiceAccessToken();

  if (!serviceAccessToken) {
    return {
      event: null,
      error: new Error(
        "SUPABASE_SERVICE_ROLE_KEY ist für Meta-Webhook-Inserts nicht konfiguriert.",
      ),
    };
  }

  const result = await postgrestRequest<MetaWebhookEventRow>(
    "meta_webhook_events",
    "POST",
    {
      workspace_id: input.workspaceId ?? null,
      social_connection_id: input.socialConnectionId ?? null,
      platform: input.platform ?? "facebook",
      source: "meta_webhook",
      event_type: input.eventType,
      page_id: normalizeOptionalText(input.pageId),
      sender_id: normalizeOptionalText(input.senderId),
      recipient_id: normalizeOptionalText(input.recipientId),
      text: normalizeOptionalText(input.messageText),
      message_text: normalizeOptionalText(input.messageText),
      raw_payload: input.rawPayload ?? {},
      status: input.status,
      error_reason: normalizeOptionalText(input.errorReason),
      message_id: input.messageId ?? null,
      received_at: input.receivedAt ?? new Date().toISOString(),
    },
    serviceAccessToken,
    { select: META_WEBHOOK_EVENT_COLUMNS, single: true },
  );

  if (result.error) {
    console.error("Meta webhook debug event insert failed", {
      table: "meta_webhook_events",
      workspaceId: input.workspaceId ?? null,
      socialConnectionId: input.socialConnectionId ?? null,
      eventType: input.eventType,
      pageId: input.pageId ?? null,
      status: input.status,
      error: result.error.message,
    });
    return { event: null, error: result.error };
  }
  return { event: result.data, error: null };
}

export async function checkMetaWebhookStorageHealth(): Promise<{
  serviceRoleConfigured: boolean;
  tableReadable: boolean;
  error: Error | null;
}> {
  const serviceAccessToken = getServiceAccessToken();

  if (!serviceAccessToken) {
    return {
      serviceRoleConfigured: false,
      tableReadable: false,
      error: new Error(
        "SUPABASE_SERVICE_ROLE_KEY ist serverseitig nicht konfiguriert.",
      ),
    };
  }

  const result = await postgrestSelect<MetaWebhookEventRow[]>(
    "meta_webhook_events",
    serviceAccessToken,
    META_WEBHOOK_EVENT_COLUMNS,
    [],
    1,
    false,
    "received_at.desc",
  );

  return {
    serviceRoleConfigured: true,
    tableReadable: !result.error,
    error: result.error,
  };
}

export async function getWorkspaceMetaWebhookEvents(
  workspaceId: string,
  limit = 20,
): Promise<MetaWebhookEventsResult> {
  const accessToken = await getAccessToken();
  if (!accessToken)
    return {
      events: [],
      error: new Error("Keine aktive Supabase-Session gefunden."),
    };

  const result = await postgrestSelect<MetaWebhookEventRow[]>(
    "meta_webhook_events",
    accessToken,
    META_WEBHOOK_EVENT_COLUMNS,
    [["workspace_id", workspaceId]],
    limit,
    false,
    "received_at.desc",
  );

  if (result.error) return { events: [], error: result.error };
  return { events: result.data ?? [], error: null };
}

export async function getContactReplyTarget(
  workspaceId: string,
  contactId: string,
  sourceType: string,
): Promise<ContactReplyTargetResult> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return {
      target: null,
      error: new Error(
        "Keine aktive Supabase-Session gefunden. Bitte melde dich erneut an.",
      ),
    };
  }

  const result = await postgrestSelect<ContactReplyTargetRow>(
    "contact_reply_targets",
    accessToken,
    CONTACT_REPLY_TARGET_COLUMNS,
    [
      ["workspace_id", workspaceId],
      ["contact_id", contactId],
      ["source_type", sourceType],
    ],
    1,
    true,
  );

  if (result.error) {
    return {
      target: null,
      error: new Error(
        "Der gespeicherte Chat-Link konnte gerade nicht geladen werden. Du kannst den Facebook-Chat weiterhin über das Postfach öffnen.",
      ),
    };
  }

  return { target: result.data, error: null };
}

export async function upsertContactReplyTarget(input: {
  workspaceId: string;
  contactId: string;
  sourcePlatform: string;
  sourceType: string;
  label?: string | null;
  url: string;
  quality?: string;
}): Promise<ContactReplyTargetResult> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return {
      target: null,
      error: new Error(
        "Keine aktive Supabase-Session gefunden. Bitte melde dich erneut an.",
      ),
    };
  }

  const result = await postgrestRequest<ContactReplyTargetRow>(
    "contact_reply_targets",
    "POST",
    {
      workspace_id: input.workspaceId,
      contact_id: input.contactId,
      source_platform: input.sourcePlatform,
      source_type: input.sourceType,
      label: input.label ?? null,
      url: input.url,
      quality: input.quality ?? "manual_exact_thread",
      updated_at: new Date().toISOString(),
    },
    accessToken,
    {
      select: CONTACT_REPLY_TARGET_COLUMNS,
      single: true,
      upsert: true,
      onConflict: "workspace_id,contact_id,source_type",
    },
  );

  if (result.error) {
    return {
      target: null,
      error: new Error(
        "Der Chat-Link konnte gerade nicht gespeichert werden. Bitte später erneut versuchen.",
      ),
    };
  }

  return { target: result.data, error: null };
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

export async function updateContactInternalNotes(input: {
  workspaceId: string;
  contactId: string;
  internalNotes: string;
}): Promise<ContactUpdateResult> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return contactUpdateError(
      "Keine aktive Supabase-Session gefunden. Bitte melde dich erneut an.",
    );
  }

  const result = await postgrestUpdate<ContactRow>(
    "contacts",
    { internal_notes: input.internalNotes.trim() || null },
    accessToken,
    [
      ["workspace_id", input.workspaceId],
      ["id", input.contactId],
    ],
    { select: CONTACT_COLUMNS, single: true },
  );

  if (result.error) {
    return contactUpdateError(
      `Notizen konnten nicht gespeichert werden: ${result.error.message}`,
    );
  }

  return { contact: result.data, error: null };
}

export async function getFanAnalysisReport(
  workspaceId: string,
  contactId: string,
): Promise<FanAnalysisReportResult> {
  const accessToken = await getAccessToken();
  if (!accessToken)
    return {
      report: null,
      error: new Error(
        "Keine aktive Supabase-Session gefunden. Bitte melde dich erneut an.",
      ),
    };
  const result = await postgrestSelect<FanAnalysisReportRow>(
    "fan_analysis_reports",
    accessToken,
    FAN_ANALYSIS_REPORT_COLUMNS,
    [
      ["workspace_id", workspaceId],
      ["contact_id", contactId],
    ],
    1,
    true,
  );
  if (result.error)
    return {
      report: null,
      error: new Error(
        `Analyse-Report konnte nicht geladen werden: ${result.error.message}`,
      ),
    };
  return { report: result.data, error: null };
}

export async function upsertFanAnalysisReport(input: {
  workspaceId: string;
  contactId: string;
  reportJson: Record<string, unknown>;
  summary: string;
  model: string;
  sourceMessageCount: number;
}): Promise<FanAnalysisReportResult> {
  const accessToken = await getAccessToken();
  if (!accessToken)
    return {
      report: null,
      error: new Error(
        "Keine aktive Supabase-Session gefunden. Bitte melde dich erneut an.",
      ),
    };
  const result = await postgrestRequest<FanAnalysisReportRow>(
    "fan_analysis_reports",
    "POST",
    {
      workspace_id: input.workspaceId,
      contact_id: input.contactId,
      report_json: input.reportJson,
      summary: input.summary,
      model: input.model,
      source_message_count: input.sourceMessageCount,
      generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    accessToken,
    {
      select: FAN_ANALYSIS_REPORT_COLUMNS,
      single: true,
      upsert: true,
      onConflict: "workspace_id,contact_id",
    },
  );
  if (result.error)
    return {
      report: null,
      error: new Error(
        `Analyse-Report konnte nicht gespeichert werden: ${result.error.message}`,
      ),
    };
  return { report: result.data, error: null };
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

export async function getWorkspaceUnseenInboundMessages(
  workspaceId: string,
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
      ["direction", "inbound"],
      ["seen_at", null],
    ],
    undefined,
    false,
    "created_at.desc",
  );

  if (result.error) {
    return conversationMessagesError(
      `Neue Nachrichten konnten nicht geladen werden: ${withOptionalSchemaHint(result.error.message, "conversation_messages")}`,
    );
  }

  return { messages: result.data ?? [], error: null };
}

export async function markContactInboundMessagesSeen(input: {
  workspaceId: string;
  contactId: string;
}): Promise<{ error: Error | null }> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return {
      error: new Error(
        "Keine aktive Supabase-Session gefunden. Bitte melde dich erneut an.",
      ),
    };
  }

  const result = await postgrestUpdate(
    "conversation_messages",
    { seen_at: new Date().toISOString() },
    accessToken,
    [
      ["workspace_id", input.workspaceId],
      ["contact_id", input.contactId],
      ["direction", "inbound"],
      ["seen_at", null],
    ],
  );

  if (result.error) {
    return {
      error: new Error(
        `Nachrichten konnten nicht als gesehen markiert werden: ${withOptionalSchemaHint(result.error.message, "conversation_messages")}`,
      ),
    };
  }

  return { error: null };
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
  const sourceType = normalizeMessageType(
    input.sourceType ?? input.messageType,
  );
  const direction = input.direction ?? "inbound";
  const conversationResult = await ensureConversationForContact({
    workspaceId: input.workspaceId,
    contactId: input.contactId,
    sourcePlatform: input.sourcePlatform,
    sourceType,
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
      source_type: sourceType,
      external_thread_id: normalizeOptionalText(input.externalThreadId),
      external_message_id: normalizeOptionalText(input.externalMessageId),
      external_post_id: normalizeOptionalText(input.externalPostId),
      external_comment_id: normalizeOptionalText(input.externalCommentId),
      original_author_label:
        normalizeOptionalText(input.originalAuthorLabel) ??
        normalizeOptionalText(input.authorLabel),
      original_text_excerpt: normalizeExcerpt(
        input.originalTextExcerpt ?? content,
      ),
      author_label:
        normalizeOptionalText(input.authorLabel) ??
        (direction === "inbound" ? "Fan" : "Team"),
      content,
      attachments: normalizeMessageAttachments(input.attachments),
      message_kind: normalizeMessageKind(
        input.messageKind,
        input.attachments,
        content,
      ),
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
    source_type: sourceType,
    source_url: sourceUrl ?? conversationResult.conversation.source_url,
    reply_target_url:
      replyTargetUrl ?? conversationResult.conversation.reply_target_url,
    ai_status: "partial",
    next_step: "Antwort vorbereiten",
    external_thread_id:
      normalizeOptionalText(input.externalThreadId) ??
      conversationResult.conversation.external_thread_id,
    external_message_id:
      normalizeOptionalText(input.externalMessageId) ??
      conversationResult.conversation.external_message_id,
    external_post_id:
      normalizeOptionalText(input.externalPostId) ??
      conversationResult.conversation.external_post_id,
    external_comment_id:
      normalizeOptionalText(input.externalCommentId) ??
      conversationResult.conversation.external_comment_id,
    original_author_label:
      normalizeOptionalText(input.originalAuthorLabel) ??
      normalizeOptionalText(input.authorLabel) ??
      conversationResult.conversation.original_author_label,
    original_text_excerpt:
      normalizeExcerpt(input.originalTextExcerpt ?? content) ??
      conversationResult.conversation.original_text_excerpt,
  };

  if (direction === "inbound")
    updateValues.last_inbound_at = new Date().toISOString();
  if (direction === "outbound")
    updateValues.last_outbound_at = new Date().toISOString();

  if (direction === "inbound") {
    await updateContactProfileFromInboundMessage({
      workspaceId: input.workspaceId,
      contactId: input.contactId,
      content,
    });
  }

  if (direction === "outbound" && messageType === "manual") {
    await updateWorkspaceVoiceProfileFromManualOutbound({
      workspaceId: input.workspaceId,
      userId: input.userId,
      ownerLabel: input.authorLabel,
      content,
    });
  }

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

export async function getConversationSummary(input: {
  workspaceId: string;
  conversationId: string;
}): Promise<{ summary: ConversationSummaryRow | null; error: Error | null }> {
  const accessToken = await getAccessToken();
  if (!accessToken)
    return {
      summary: null,
      error: new Error(
        "Keine aktive Supabase-Session gefunden. Bitte melde dich erneut an.",
      ),
    };
  const result = await postgrestSelect<ConversationSummaryRow>(
    "conversation_summaries",
    accessToken,
    CONVERSATION_SUMMARY_COLUMNS,
    [
      ["workspace_id", input.workspaceId],
      ["conversation_id", input.conversationId],
    ],
    1,
    true,
  );
  return { summary: result.data, error: result.error };
}

export async function upsertConversationSummary(input: {
  workspaceId: string;
  conversationId: string;
  contactId: string;
  summary?: string | null;
  keyPoints?: string[];
  openQuestions?: string[];
  lastSummarizedMessageAt?: string | null;
  messageCountSeen?: number;
}): Promise<{ summary: ConversationSummaryRow | null; error: Error | null }> {
  const accessToken = await getAccessToken();
  if (!accessToken)
    return {
      summary: null,
      error: new Error(
        "Keine aktive Supabase-Session gefunden. Bitte melde dich erneut an.",
      ),
    };
  const result = await postgrestRequest<ConversationSummaryRow>(
    "conversation_summaries",
    "POST",
    {
      workspace_id: input.workspaceId,
      conversation_id: input.conversationId,
      contact_id: input.contactId,
      summary: normalizeOptionalText(input.summary),
      key_points: input.keyPoints ?? [],
      open_questions: input.openQuestions ?? [],
      last_summarized_message_at: input.lastSummarizedMessageAt ?? null,
      message_count_seen: input.messageCountSeen ?? 0,
      updated_at: new Date().toISOString(),
    },
    accessToken,
    {
      select: CONVERSATION_SUMMARY_COLUMNS,
      single: true,
      upsert: true,
      onConflict: "workspace_id,conversation_id",
    },
  );
  return { summary: result.data, error: result.error };
}

export async function getContactAiProfile(
  workspaceId: string,
  contactId: string,
): Promise<{ profile: ContactAiProfileRow | null; error: Error | null }> {
  const accessToken = await getAccessToken();
  if (!accessToken)
    return {
      profile: null,
      error: new Error(
        "Keine aktive Supabase-Session gefunden. Bitte melde dich erneut an.",
      ),
    };
  const result = await postgrestSelect<ContactAiProfileRow>(
    "contact_ai_profiles",
    accessToken,
    CONTACT_AI_PROFILE_COLUMNS,
    [
      ["workspace_id", workspaceId],
      ["contact_id", contactId],
    ],
    1,
    true,
  );
  return { profile: result.data, error: result.error };
}

export async function upsertContactAiProfile(
  input: Partial<ContactAiProfileRow> & {
    workspace_id: string;
    contact_id: string;
  },
): Promise<{ profile: ContactAiProfileRow | null; error: Error | null }> {
  const accessToken = await getAccessToken();
  if (!accessToken)
    return {
      profile: null,
      error: new Error(
        "Keine aktive Supabase-Session gefunden. Bitte melde dich erneut an.",
      ),
    };
  const result = await postgrestRequest<ContactAiProfileRow>(
    "contact_ai_profiles",
    "POST",
    { ...input, updated_at: new Date().toISOString() },
    accessToken,
    {
      select: CONTACT_AI_PROFILE_COLUMNS,
      single: true,
      upsert: true,
      onConflict: "workspace_id,contact_id",
    },
  );
  return { profile: result.data, error: result.error };
}

export async function getWorkspaceVoiceProfile(
  workspaceId: string,
  userId?: string | null,
): Promise<{ profile: WorkspaceVoiceProfileRow | null; error: Error | null }> {
  const accessToken = await getAccessToken();
  if (!accessToken)
    return {
      profile: null,
      error: new Error(
        "Keine aktive Supabase-Session gefunden. Bitte melde dich erneut an.",
      ),
    };
  const filters: [string, SupabaseFilterValue][] = [
    ["workspace_id", workspaceId],
  ];
  if (userId) filters.push(["user_id", userId]);
  const result = await postgrestSelect<WorkspaceVoiceProfileRow>(
    "workspace_voice_profiles",
    accessToken,
    WORKSPACE_VOICE_PROFILE_COLUMNS,
    filters,
    1,
    true,
    "updated_at.desc",
  );
  return { profile: result.data, error: result.error };
}

export async function upsertWorkspaceVoiceProfile(
  input: Partial<WorkspaceVoiceProfileRow> & {
    workspace_id: string;
    user_id?: string | null;
  },
): Promise<{ profile: WorkspaceVoiceProfileRow | null; error: Error | null }> {
  const accessToken = await getAccessToken();
  if (!accessToken)
    return {
      profile: null,
      error: new Error(
        "Keine aktive Supabase-Session gefunden. Bitte melde dich erneut an.",
      ),
    };
  const result = await postgrestRequest<WorkspaceVoiceProfileRow>(
    "workspace_voice_profiles",
    "POST",
    { ...input, updated_at: new Date().toISOString() },
    accessToken,
    {
      select: WORKSPACE_VOICE_PROFILE_COLUMNS,
      single: true,
      upsert: true,
      onConflict: "workspace_id,user_id",
    },
  );
  return { profile: result.data, error: result.error };
}

export async function updateContactProfileFromInboundMessage(input: {
  workspaceId: string;
  contactId: string;
  content: string;
  language?: string | null;
}): Promise<void> {
  const existing = await getContactAiProfile(
    input.workspaceId,
    input.contactId,
  );
  const count = (existing.profile?.source_message_count ?? 0) + 1;
  await upsertContactAiProfile({
    workspace_id: input.workspaceId,
    contact_id: input.contactId,
    language:
      existing.profile?.language ??
      input.language ??
      detectLanguage(input.content),
    tone: existing.profile?.tone ?? detectTone(input.content),
    sentiment: existing.profile?.sentiment ?? "im Aufbau",
    confidence_score: Math.min(30, count * 5),
    source_message_count: count,
  });
}

export async function updateWorkspaceVoiceProfileFromManualOutbound(input: {
  workspaceId: string;
  userId?: string | null;
  ownerLabel?: string | null;
  content: string;
}): Promise<void> {
  const existing = await getWorkspaceVoiceProfile(
    input.workspaceId,
    input.userId,
  );
  const count = (existing.profile?.examples_count ?? 0) + 1;
  await upsertWorkspaceVoiceProfile({
    workspace_id: input.workspaceId,
    user_id: input.userId ?? null,
    owner_label:
      normalizeOptionalText(input.ownerLabel) ??
      existing.profile?.owner_label ??
      "Team",
    language: existing.profile?.language ?? detectLanguage(input.content),
    tone: existing.profile?.tone ?? detectTone(input.content),
    sentence_length:
      existing.profile?.sentence_length ?? detectSentenceLength(input.content),
    emoji_style:
      existing.profile?.emoji_style ?? detectEmojiStyle(input.content),
    common_phrases:
      existing.profile?.common_phrases ?? extractCommonPhrases(input.content),
    examples_count: count,
    confidence_score: Math.min(35, count * 5),
  });
}

function normalizeExcerpt(value?: string | null): string | null {
  const normalized = normalizeOptionalText(value);
  return normalized ? normalized.slice(0, 500) : null;
}

function detectLanguage(content: string): string {
  return /\b(und|oder|danke|bitte|ich|du|sie|wir)\b/i.test(content)
    ? "de"
    : "unbekannt";
}

function detectTone(content: string): string {
  if (/[!😊🙂😉]/u.test(content)) return "freundlich";
  return content.length < 180 ? "kurz und sachlich" : "ausführlich";
}

function detectSentenceLength(content: string): string {
  const sentences = content.split(/[.!?]+/).filter((part) => part.trim());
  const average = sentences.length
    ? content.split(/\s+/).length / sentences.length
    : 0;
  return average > 18 ? "eher lang" : "eher kurz";
}

function detectEmojiStyle(content: string): string {
  return /[\p{Extended_Pictographic}]/u.test(content)
    ? "nutzt Emojis"
    : "kaum Emojis";
}

function extractCommonPhrases(content: string): string[] {
  return ["Danke", "Liebe Grüße", "Viele Grüße"].filter((phrase) =>
    content.toLowerCase().includes(phrase.toLowerCase()),
  );
}

export async function createMetaWebhookConversationMessage(input: {
  workspaceId: string;
  senderId?: string | null;
  pageId?: string | null;
  recipientId?: string | null;
  sourcePlatform: "facebook" | "instagram" | "whatsapp" | "tiktok";
  authorLabel: string;
  content: string;
  messageType: "dm" | "comment";
  sourceType?:
    | "facebook_messages"
    | "facebook_comments"
    | "instagram_messages"
    | "instagram_comments"
    | "whatsapp_messages"
    | "tiktok_comments"
    | "tiktok_messages"
    | "dm"
    | "comment"
    | null;
  sourceUrl?: string | null;
  replyTargetUrl?: string | null;
  externalMessageId?: string | null;
  externalThreadId?: string | null;
  sourceConversationId?: string | null;
  externalPostId?: string | null;
  externalCommentId?: string | null;
  originalAuthorLabel?: string | null;
  originalTextExcerpt?: string | null;
  attachments?: ConversationMessageAttachment[] | null;
  messageKind?: string | null;
  receivedAt?: string | null;
  direction?: "inbound" | "outbound";
}): Promise<ConversationMessageCreateResult> {
  const normalizedSourceType = normalizeMessageType(
    input.sourceType ??
      getDefaultWebhookSourceType(input.sourcePlatform, input.messageType),
  );
  const senderId = normalizeOptionalText(input.senderId);
  const pageId = normalizeOptionalText(input.pageId ?? input.recipientId);
  const threadIdentifiers = buildMetaThreadIdentifiers({
    sourcePlatform: input.sourcePlatform,
    sourceType: normalizedSourceType,
    externalThreadId: input.externalThreadId,
    sourceConversationId: input.sourceConversationId,
    pageId,
    senderId,
  });
  const preferredThreadId = threadIdentifiers[0] ?? null;
  let contact: ContactRow | null = null;

  if (threadIdentifiers.length) {
    const byThread = await findContactByThreadIdentifiers({
      workspaceId: input.workspaceId,
      sourcePlatform: input.sourcePlatform,
      threadIdentifiers,
    });
    if (byThread.error) return conversationMessageCreateError(byThread.error.message);
    contact = byThread.contact;
  }

  if (!contact && senderId) {
    const existing = await postgrestSelect<ContactRow>(
      "contacts",
      getServiceAccessToken(),
      CONTACT_COLUMNS,
      [
        ["workspace_id", input.workspaceId],
        ["handle", senderId],
      ],
      1,
      true,
    );
    if (existing.error)
      return conversationMessageCreateError(existing.error.message);
    contact = existing.data;

    if (!contact) {
      const aliasContact = await findPreferredContactBySenderAlias({
        workspaceId: input.workspaceId,
        sourcePlatform: input.sourcePlatform,
        senderId,
      });
      if (aliasContact.error)
        return conversationMessageCreateError(aliasContact.error.message);
      contact = aliasContact.contact;
    }
  }

  if (contact) {
    const nextDisplayName = normalizeOptionalText(input.authorLabel);
    const currentIsFallback = isWebhookFallbackDisplayName(
      contact.display_name,
      input.sourcePlatform,
      senderId,
    );
    if (
      nextDisplayName &&
      nextDisplayName !== contact.display_name &&
      !isWebhookFallbackDisplayName(
        nextDisplayName,
        input.sourcePlatform,
        senderId,
      ) &&
      (currentIsFallback || !contact.display_name)
    ) {
      const updated = await postgrestUpdate<ContactRow>(
        "contacts",
        {
          display_name: nextDisplayName,
          source_platform: contact.source_platform ?? input.sourcePlatform,
        },
        getServiceAccessToken(),
        [
          ["workspace_id", input.workspaceId],
          ["id", contact.id],
        ],
        { select: CONTACT_COLUMNS, single: true },
      );
      if (!updated.error && updated.data) contact = updated.data;
    }

    if (senderId && !normalizeOptionalText(contact.handle)) {
      const syncedHandle = await postgrestUpdate<ContactRow>(
        "contacts",
        { handle: senderId },
        getServiceAccessToken(),
        [
          ["workspace_id", input.workspaceId],
          ["id", contact.id],
        ],
        { select: CONTACT_COLUMNS, single: true },
      );
      if (!syncedHandle.error && syncedHandle.data) contact = syncedHandle.data;
    }
  }

  if (!contact) {
    const created = await postgrestRequest<ContactRow>(
      "contacts",
      "POST",
      {
        workspace_id: input.workspaceId,
        display_name:
          input.authorLabel ||
          getDefaultWebhookAuthorLabel(input.sourcePlatform),
        handle: senderId,
        source_platform: input.sourcePlatform,
        language: "de",
        status: "new",
        tags: [input.sourcePlatform],
        summary: `Automatisch aus einem eingehenden ${getWebhookPlatformLabel(input.sourcePlatform)}-Webhook angelegt.`,
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
    sourcePlatform: input.sourcePlatform,
    direction: input.direction,
    sourceType:
      input.sourceType ??
      getDefaultWebhookSourceType(input.sourcePlatform, input.messageType),
    sourceUrl: input.sourceUrl,
    replyTargetUrl: input.replyTargetUrl,
    externalMessageId: input.externalMessageId,
    externalThreadId: preferredThreadId,
    externalPostId: input.externalPostId,
    externalCommentId: input.externalCommentId,
    originalTextExcerpt: input.originalTextExcerpt ?? input.content,
    authorLabel: input.authorLabel,
    attachments: input.attachments,
    messageKind: input.messageKind,
    receivedAt: input.receivedAt,
  });

  await postgrestUpdate(
    "social_connections",
    { last_event_at: new Date().toISOString() },
    getServiceAccessToken(),
    [
      ["workspace_id", input.workspaceId],
      ["platform", input.sourcePlatform],
      ["status", "connected"],
    ],
  );

  return result;
}

export async function createMetaTestConversationMessage(input: {
  workspaceId: string;
  sourcePlatform?: "facebook" | "instagram" | "whatsapp" | "tiktok";
  contactId: string;
  content: string;
  messageType: "dm" | "comment";
  sourceType?:
    | "facebook_messages"
    | "facebook_comments"
    | "instagram_messages"
    | "instagram_comments"
    | "whatsapp_messages"
    | "tiktok_comments"
    | "tiktok_messages"
    | "dm"
    | "comment"
    | null;
  sourceUrl?: string | null;
  replyTargetUrl?: string | null;
  externalMessageId?: string | null;
  externalThreadId?: string | null;
  externalPostId?: string | null;
  externalCommentId?: string | null;
  originalTextExcerpt?: string | null;
  authorLabel?: string | null;
  attachments?: ConversationMessageAttachment[] | null;
  messageKind?: string | null;
  receivedAt?: string | null;
  direction?: "inbound" | "outbound";
}): Promise<ConversationMessageCreateResult> {
  const content = input.content.trim();

  if (!content) {
    return conversationMessageCreateError("Nachrichtentext ist erforderlich.");
  }

  const externalMessageId = normalizeOptionalText(input.externalMessageId);
  if (externalMessageId) {
    const existingMessage = await postgrestSelect<ConversationMessageRow>(
      "conversation_messages",
      getServiceAccessToken(),
      CONVERSATION_MESSAGE_COLUMNS,
      [
        ["workspace_id", input.workspaceId],
        ["source_platform", input.sourcePlatform ?? "facebook"],
        ["external_message_id", externalMessageId],
      ],
      1,
      true,
    );
    if (existingMessage.error) {
      return conversationMessageCreateError(
        `Nachricht konnte nicht auf Duplikate geprüft werden: ${withOptionalSchemaHint(existingMessage.error.message, "conversation_messages")}`,
      );
    }
    if (existingMessage.data) {
      return { message: existingMessage.data, conversation: null, error: null };
    }
  }

  const externalCommentId = normalizeOptionalText(input.externalCommentId);
  if (externalCommentId) {
    const existingComment = await postgrestSelect<ConversationMessageRow>(
      "conversation_messages",
      getServiceAccessToken(),
      CONVERSATION_MESSAGE_COLUMNS,
      [
        ["workspace_id", input.workspaceId],
        ["source_platform", input.sourcePlatform ?? "facebook"],
        ["external_comment_id", externalCommentId],
      ],
      1,
      true,
    );
    if (existingComment.error) {
      return conversationMessageCreateError(
        `Kommentar konnte nicht auf Duplikate geprüft werden: ${withOptionalSchemaHint(existingComment.error.message, "conversation_messages")}`,
      );
    }
    if (existingComment.data) {
      return { message: existingComment.data, conversation: null, error: null };
    }
  }

  const receivedAt =
    normalizeIsoTimestamp(input.receivedAt) ?? new Date().toISOString();
  const sourceUrl = normalizeUrl(input.sourceUrl);
  const replyTargetUrl = normalizeUrl(input.replyTargetUrl) ?? sourceUrl;
  const conversationResult = await ensureMetaTestConversation({
    workspaceId: input.workspaceId,
    contactId: input.contactId,
    sourcePlatform: input.sourcePlatform ?? "facebook",
    sourceType:
      input.sourceType ??
      getDefaultWebhookSourceType(
        input.sourcePlatform ?? "facebook",
        input.messageType,
      ),
    sourceUrl,
    replyTargetUrl,
    externalMessageId: input.externalMessageId,
    externalThreadId: input.externalThreadId,
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
      direction: input.direction ?? "inbound",
      message_type: input.messageType,
      source_platform: input.sourcePlatform ?? "facebook",
      source_url: sourceUrl,
      reply_target_url: replyTargetUrl,
      source_type: normalizeMessageType(input.sourceType ?? input.messageType),
      external_thread_id: normalizeOptionalText(input.externalThreadId),
      external_message_id: normalizeOptionalText(input.externalMessageId),
      external_post_id: normalizeOptionalText(input.externalPostId),
      external_comment_id: normalizeOptionalText(input.externalCommentId),
      original_author_label:
        normalizeOptionalText(input.authorLabel) ??
        getDefaultWebhookAuthorLabel(input.sourcePlatform ?? "facebook"),
      original_text_excerpt: normalizeExcerpt(
        input.originalTextExcerpt ?? content,
      ),
      author_label:
        normalizeOptionalText(input.authorLabel) ??
        getDefaultWebhookAuthorLabel(input.sourcePlatform ?? "facebook"),
      content,
      attachments: normalizeMessageAttachments(input.attachments),
      message_kind: normalizeMessageKind(
        input.messageKind,
        input.attachments,
        content,
      ),
      created_at: receivedAt,
      seen_at:
        (input.direction ?? "inbound") === "outbound" ? receivedAt : null,
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
      ...((input.direction ?? "inbound") === "inbound"
        ? { last_inbound_at: receivedAt }
        : { last_outbound_at: receivedAt }),
      source_platform: input.sourcePlatform ?? "facebook",
      source_type: normalizeMessageType(input.sourceType ?? input.messageType),
      source_url: sourceUrl ?? conversationResult.conversation.source_url,
      reply_target_url:
        replyTargetUrl ?? conversationResult.conversation.reply_target_url,
      external_thread_id:
        normalizeOptionalText(input.externalThreadId) ??
        conversationResult.conversation.external_thread_id,
      external_message_id:
        normalizeOptionalText(input.externalMessageId) ??
        conversationResult.conversation.external_message_id,
      external_post_id:
        normalizeOptionalText(input.externalPostId) ??
        conversationResult.conversation.external_post_id,
      external_comment_id:
        normalizeOptionalText(input.externalCommentId) ??
        conversationResult.conversation.external_comment_id,
      original_author_label:
        normalizeOptionalText(input.authorLabel) ??
        conversationResult.conversation.original_author_label,
      original_text_excerpt:
        normalizeExcerpt(input.originalTextExcerpt ?? content) ??
        conversationResult.conversation.original_text_excerpt,
      status: "open",
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
  sourcePlatform: "facebook" | "instagram" | "whatsapp" | "tiktok";
  sourceType: string;
  sourceUrl?: string | null;
  replyTargetUrl?: string | null;
  externalMessageId?: string | null;
  externalThreadId?: string | null;
}): Promise<ConversationResult> {
  const externalThreadId = normalizeOptionalText(input.externalThreadId);
  const sourceUrl = normalizeUrl(input.sourceUrl);
  const replyTargetUrl = normalizeUrl(input.replyTargetUrl) ?? sourceUrl;

  if (externalThreadId) {
    const threaded = await postgrestSelect<ConversationRow>(
      "conversations",
      getServiceAccessToken(),
      CONVERSATION_COLUMNS,
      [
        ["workspace_id", input.workspaceId],
        ["contact_id", input.contactId],
        ["source_platform", input.sourcePlatform],
        ["external_thread_id", externalThreadId],
      ],
      1,
      true,
      "updated_at.desc",
    );

    if (threaded.error) {
      return conversationError(
        `Conversation konnte nicht geprüft werden: ${withOptionalSchemaHint(threaded.error.message, "conversations")}`,
      );
    }

    if (threaded.data) return { conversation: threaded.data, error: null };
  }

  const existing = await postgrestSelect<ConversationRow[]>(
    "conversations",
    getServiceAccessToken(),
    CONVERSATION_COLUMNS,
    [
      ["workspace_id", input.workspaceId],
      ["contact_id", input.contactId],
      ["source_platform", input.sourcePlatform],
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

  const urlConversation = (existing.data ?? []).find(
    (conversation) =>
      ["open", "waiting"].includes(conversation.status) &&
      Boolean(sourceUrl || replyTargetUrl) &&
      (conversation.source_url === sourceUrl ||
        conversation.reply_target_url === replyTargetUrl ||
        conversation.source_url === replyTargetUrl ||
        conversation.reply_target_url === sourceUrl),
  );

  if (urlConversation) return { conversation: urlConversation, error: null };

  const openConversation = (existing.data ?? []).find(
    (conversation) =>
      ["open", "waiting"].includes(conversation.status) &&
      !conversation.external_thread_id &&
      conversation.source_type === normalizeMessageType(input.sourceType),
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
      source_platform: input.sourcePlatform,
      source_type: normalizeMessageType(input.sourceType),
      source_url: sourceUrl,
      reply_target_url: replyTargetUrl,
      external_thread_id: externalThreadId,
      external_message_id: normalizeOptionalText(input.externalMessageId),
      original_author_label: null,
      original_text_excerpt: null,
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

function buildMetaThreadIdentifiers(input: {
  sourcePlatform: "facebook" | "instagram" | "whatsapp" | "tiktok";
  sourceType: string;
  externalThreadId?: string | null;
  sourceConversationId?: string | null;
  pageId?: string | null;
  senderId?: string | null;
}): string[] {
  const identifiers = new Set<string>();
  const explicitExternalThreadId = normalizeOptionalText(input.externalThreadId);
  const sourceConversationId = normalizeOptionalText(input.sourceConversationId);
  const pageId = normalizeOptionalText(input.pageId);
  const senderId = normalizeOptionalText(input.senderId);

  if (explicitExternalThreadId) identifiers.add(explicitExternalThreadId);
  if (sourceConversationId) identifiers.add(sourceConversationId);

  if (
    input.sourcePlatform === "facebook" &&
    input.sourceType === "facebook_messages" &&
    pageId &&
    senderId
  ) {
    identifiers.add(`${pageId}:${senderId}`);
  }

  return Array.from(identifiers);
}

async function findContactByThreadIdentifiers(input: {
  workspaceId: string;
  sourcePlatform: "facebook" | "instagram" | "whatsapp" | "tiktok";
  threadIdentifiers: string[];
}): Promise<{ contact: ContactRow | null; error: Error | null }> {
  for (const identifier of input.threadIdentifiers) {
    const byConversation = await postgrestSelect<ConversationRow>(
      "conversations",
      getServiceAccessToken(),
      CONVERSATION_COLUMNS,
      [
        ["workspace_id", input.workspaceId],
        ["source_platform", input.sourcePlatform],
        ["external_thread_id", identifier],
      ],
      1,
      true,
      "updated_at.desc",
    );

    if (byConversation.error) {
      return {
        contact: null,
        error: new Error(
          `Conversation-Mapping konnte nicht geprüft werden: ${withOptionalSchemaHint(byConversation.error.message, "conversations")}`,
        ),
      };
    }

    if (byConversation.data?.contact_id) {
      const contact = await getContactById(
        input.workspaceId,
        byConversation.data.contact_id,
      );
      if (contact.error) return contact;
      if (contact.contact) return contact;
    }

    const byMessage = await postgrestSelect<ConversationMessageRow>(
      "conversation_messages",
      getServiceAccessToken(),
      CONVERSATION_MESSAGE_COLUMNS,
      [
        ["workspace_id", input.workspaceId],
        ["source_platform", input.sourcePlatform],
        ["external_thread_id", identifier],
      ],
      1,
      true,
      "created_at.desc",
    );

    if (byMessage.error) {
      return {
        contact: null,
        error: new Error(
          `Nachrichten-Mapping konnte nicht geprüft werden: ${withOptionalSchemaHint(byMessage.error.message, "conversation_messages")}`,
        ),
      };
    }

    if (byMessage.data?.contact_id) {
      const contact = await getContactById(input.workspaceId, byMessage.data.contact_id);
      if (contact.error) return contact;
      if (contact.contact) return contact;
    }
  }

  return { contact: null, error: null };
}

async function getContactById(
  workspaceId: string,
  contactId: string,
): Promise<{ contact: ContactRow | null; error: Error | null }> {
  const result = await postgrestSelect<ContactRow>(
    "contacts",
    getServiceAccessToken(),
    CONTACT_COLUMNS,
    [
      ["workspace_id", workspaceId],
      ["id", contactId],
    ],
    1,
    true,
  );

  if (result.error) {
    return {
      contact: null,
      error: new Error(
        `Kontakt konnte nicht geladen werden: ${result.error.message}`,
      ),
    };
  }

  return { contact: result.data, error: null };
}

async function findPreferredContactBySenderAlias(input: {
  workspaceId: string;
  sourcePlatform: "facebook" | "instagram" | "whatsapp" | "tiktok";
  senderId: string;
}): Promise<{ contact: ContactRow | null; error: Error | null }> {
  const contactsResult = await postgrestSelect<ContactRow[]>(
    "contacts",
    getServiceAccessToken(),
    CONTACT_COLUMNS,
    [
      ["workspace_id", input.workspaceId],
      ["source_platform", input.sourcePlatform],
    ],
    undefined,
    false,
    "updated_at.desc",
  );

  if (contactsResult.error) {
    return {
      contact: null,
      error: new Error(
        `Kontakt-Alias konnte nicht geprüft werden: ${contactsResult.error.message}`,
      ),
    };
  }

  const senderAlias = normalizeSenderAlias(input.senderId);
  if (!senderAlias) return { contact: null, error: null };

  const aliasMatches = (contactsResult.data ?? []).filter(
    (contact) => normalizeSenderAlias(contact.handle) === senderAlias,
  );
  if (!aliasMatches.length) return { contact: null, error: null };

  for (const match of aliasMatches) {
    const hasMessages = await contactHasConversationMessages({
      workspaceId: input.workspaceId,
      contactId: match.id,
      sourcePlatform: input.sourcePlatform,
    });
    if (hasMessages.error) return { contact: null, error: hasMessages.error };
    if (hasMessages.exists) return { contact: match, error: null };
  }

  return { contact: aliasMatches[0], error: null };
}

async function contactHasConversationMessages(input: {
  workspaceId: string;
  contactId: string;
  sourcePlatform: "facebook" | "instagram" | "whatsapp" | "tiktok";
}): Promise<{ exists: boolean; error: Error | null }> {
  const result = await postgrestSelect<{ id: string }>(
    "conversation_messages",
    getServiceAccessToken(),
    "id",
    [
      ["workspace_id", input.workspaceId],
      ["contact_id", input.contactId],
      ["source_platform", input.sourcePlatform],
    ],
    1,
    true,
    "created_at.desc",
  );

  if (result.error) {
    return {
      exists: false,
      error: new Error(
        `Kontakt-Nachrichten konnten nicht geprüft werden: ${result.error.message}`,
      ),
    };
  }

  return { exists: Boolean(result.data), error: null };
}

function normalizeSenderAlias(value: string | null | undefined): string | null {
  const normalized = normalizeOptionalText(value)?.toLowerCase();
  if (!normalized) return null;
  return normalized.startsWith("@") ? normalized.slice(1) : normalized;
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
      url.searchParams.set(
        column,
        value === null ? "is.null" : `eq.${String(value)}`,
      );
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
      url.searchParams.set(
        column,
        value === null ? "is.null" : `eq.${String(value)}`,
      );
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
      url.searchParams.set(
        column,
        value === null ? "is.null" : `eq.${String(value)}`,
      );
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
  return [
    "facebook_messages",
    "facebook_comments",
    "instagram_messages",
    "instagram_comments",
    "whatsapp_messages",
    "tiktok_comments",
    "tiktok_messages",
    "dm",
    "comment",
    "post",
    "email",
    "form",
    "note",
    "manual",
  ].includes(normalized ?? "")
    ? normalized!
    : "dm";
}

function normalizeUrl(value: string | null | undefined): string | null {
  const normalized = normalizeOptionalText(value);
  return normalized && /^https?:\/\//i.test(normalized) ? normalized : null;
}

function normalizeMessageKind(
  requestedKind: string | null | undefined,
  attachments: ConversationMessageAttachment[] | null | undefined,
  content: string,
): string {
  if (
    requestedKind &&
    ["text", "image", "video", "audio", "file", "mixed", "unknown"].includes(
      requestedKind,
    )
  ) {
    return requestedKind;
  }
  return getMessageKindFromAttachments(content, attachments);
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

function isWebhookFallbackDisplayName(
  displayName: string | null | undefined,
  platform: "facebook" | "instagram" | "whatsapp" | "tiktok",
  handle?: string | null,
): boolean {
  const normalized = normalizeOptionalText(displayName);
  const fallback = getDefaultWebhookAuthorLabel(platform);

  if (!normalized) return true;
  if (normalized === fallback) return true;
  if (handle && normalized === `${fallback} ${handle}`) return true;

  return new RegExp(`^${escapeRegExp(fallback)}\\s+\\d+$`, "i").test(
    normalized,
  );
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getDefaultWebhookAuthorLabel(
  platform: "facebook" | "instagram" | "whatsapp" | "tiktok",
): string {
  if (platform === "instagram") return "Instagram Nutzer";
  if (platform === "whatsapp") return "WhatsApp Kontakt";
  if (platform === "tiktok") return "TikTok Nutzer";
  return "Facebook Nutzer";
}

function getWebhookPlatformLabel(
  platform: "facebook" | "instagram" | "whatsapp" | "tiktok",
): string {
  if (platform === "instagram") return "Instagram";
  if (platform === "whatsapp") return "WhatsApp";
  if (platform === "tiktok") return "TikTok";
  return "Facebook";
}

function normalizeIsoTimestamp(
  value: string | null | undefined,
): string | null {
  const normalized = normalizeOptionalText(value);
  if (!normalized) return null;
  const date = new Date(
    /^\d+$/.test(normalized) ? Number(normalized) * 1000 : normalized,
  );
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function getDefaultWebhookSourceType(
  platform: "facebook" | "instagram" | "whatsapp" | "tiktok",
  messageType: "dm" | "comment",
):
  | "facebook_messages"
  | "facebook_comments"
  | "instagram_messages"
  | "instagram_comments"
  | "whatsapp_messages"
  | "tiktok_comments"
  | "tiktok_messages" {
  if (platform === "whatsapp") return "whatsapp_messages";
  if (platform === "tiktok")
    return messageType === "comment" ? "tiktok_comments" : "tiktok_messages";
  return messageType === "comment"
    ? `${platform}_comments`
    : `${platform}_messages`;
}
