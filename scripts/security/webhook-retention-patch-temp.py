from pathlib import Path
import re


def replace_once(path: str, old: str, new: str, label: str) -> None:
    target = Path(path)
    source = target.read_text(encoding="utf-8")
    count = source.count(old)
    if count != 1:
        raise SystemExit(f"{label}_anchor_count_{count}")
    target.write_text(source.replace(old, new, 1), encoding="utf-8")


def regex_replace_once(path: str, pattern: str, replacement: str, label: str) -> None:
    target = Path(path)
    source = target.read_text(encoding="utf-8")
    updated, count = re.subn(pattern, replacement, source, count=1, flags=re.S)
    if count != 1:
        raise SystemExit(f"{label}_anchor_count_{count}")
    target.write_text(updated, encoding="utf-8")


meta_path = "src/lib/metaWebhook.ts"
server_path = "src/lib/supabase/server.ts"

replace_once(
    meta_path,
    'import { syncFacebookMessengerConversationForContact } from "@/app/channels/facebookWebhookActions";\n',
    'import { syncFacebookMessengerConversationForContact } from "@/app/channels/facebookWebhookActions";\n'
    'import { buildMetaWebhookDiagnosticPayload } from "@/lib/webhookSecurityPolicy.mjs";\n',
    "meta_import",
)
replace_once(meta_path, "  error?: string;\n", "  errorCode?: string;\n", "meta_result_type")
replace_once(
    meta_path,
    "  let firstError: string | undefined;\n",
    "  let firstErrorCode: string | undefined;\n",
    "meta_first_error_declaration",
)
replace_once(
    meta_path,
    "    if (connection.error) firstError ??= connection.error.message;\n",
    '    if (connection.error) firstErrorCode ??= "connection_lookup_failed";\n',
    "meta_connection_error",
)
replace_once(
    meta_path,
    "      if (fallbackWorkspace.error)\n        firstError ??= fallbackWorkspace.error.message;\n",
    '      if (fallbackWorkspace.error)\n        firstErrorCode ??= "fallback_workspace_failed";\n',
    "meta_fallback_error",
)

regex_replace_once(
    meta_path,
    r"      const debugResult = await createMetaWebhookDebugEvent\(\{\n        workspaceId: fallbackWorkspace\.workspaceId,[\s\S]*?      \}\);\n      if \(debugResult\.error\) firstError \?\?= debugResult\.error\.message;",
    '''      const debugResult = await createMetaWebhookDebugEvent({
        workspaceId: fallbackWorkspace.workspaceId,
        platform: event.sourcePlatform,
        eventType: event.eventType,
        pageId: null,
        senderId: null,
        recipientId: null,
        messageText: null,
        rawPayload: buildMetaWebhookDiagnosticPayload(event),
        status: event.pageId ? "ignored_unmapped_page" : "ignored_missing_page",
        errorReason: event.pageId ? "unmapped_page" : "page_identifier_missing",
        messageId: null,
        receivedAt,
      });
      if (debugResult.error) firstErrorCode ??= "diagnostic_persist_failed";''',
    "meta_unmapped_debug",
)

replace_once(
    meta_path,
    '''        if (result.error) {
          status = "error";
          errorReason = result.error.message;
          firstError ??= result.error.message;
        } else {
''',
    '''        if (result.error) {
          status = "error";
          errorReason = "message_persist_failed";
          firstErrorCode ??= "message_persist_failed";
        } else {
''',
    "meta_message_error",
)
replace_once(
    meta_path,
    '''            if (!syncResult.ok && syncResult.error)
              firstError ??= syncResult.error;
''',
    '''            if (!syncResult.ok && syncResult.error)
              firstErrorCode ??= "conversation_sync_failed";
''',
    "meta_sync_error",
)
replace_once(
    meta_path,
    '''        errorReason =
          event.eventType === "feed" || event.eventType === "feed_comment"
            ? "Feed/comment-Event ohne Kommentartext."
            : "Message-Event ohne Nachrichtentext.";
''',
    '''        errorReason = "content_missing";
''',
    "meta_missing_content",
)
replace_once(
    meta_path,
    '      errorReason = "Unbekannter Meta-Event-Typ.";\n',
    '      errorReason = "unsupported_event";\n',
    "meta_unsupported_error",
)

regex_replace_once(
    meta_path,
    r"    const debugResult = await createMetaWebhookDebugEvent\(\{\n      workspaceId: connection\.connection\.workspace_id,[\s\S]*?    \}\);\n    if \(debugResult\.error\) firstError \?\?= debugResult\.error\.message;",
    '''    const debugResult = await createMetaWebhookDebugEvent({
      workspaceId: connection.connection.workspace_id,
      platform: event.sourcePlatform,
      socialConnectionId: connection.connection.id,
      eventType: event.eventType,
      pageId: null,
      senderId: null,
      recipientId: null,
      messageText: null,
      rawPayload: buildMetaWebhookDiagnosticPayload(event),
      status: formatDebugStatus(status, event),
      errorReason,
      messageId: null,
      receivedAt,
    });
    if (debugResult.error) firstErrorCode ??= "diagnostic_persist_failed";''',
    "meta_mapped_debug",
)
replace_once(
    meta_path,
    "    error: firstError,\n",
    "    errorCode: firstErrorCode,\n",
    "meta_return_error",
)

regex_replace_once(
    meta_path,
    r"function normalizeMesessageText\(event: MetaWebhookEvent\): string \| null \{[\s\S]*?\n\}\n\nfunction numberValue",
    "function numberValue",
    "meta_remove_debug_text",
)
regex_replace_once(
    meta_path,
    r"function formatDebugStatus\(baseStatus: string, event: MetaWebhookEvent\): string \{[\s\S]*?\n\}\n\nfunction formatDebugMessageText\(event: MetaWebhookEvent\): string \| null \{[\s\S]*?\n\}",
    '''function formatDebugStatus(baseStatus: string, event: MetaWebhookEvent): string {
  const normalized = baseStatus.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_");
  const safeBase = /^[a-z][a-z0-9_]{0,47}$/.test(normalized)
    ? normalized
    : "processing_failed";
  return event.attachments?.length ? `${safeBase}_with_attachments` : safeBase;
}''',
    "meta_debug_status",
)

meta_source = Path(meta_path).read_text(encoding="utf-8")
for forbidden in (
    "firstError ??=",
    "firstError:",
    "messageText: formatDebugMessageText",
    "rawPayload: event.rawEvent",
):
    if forbidden in meta_source:
        raise SystemExit(f"meta_forbidden_remaining:{forbidden}")

server_source = Path(server_path).read_text(encoding="utf-8")
config_anchor = '''import {
  getSupabaseAuthUrl,
  getSupabaseHeaders,
  getSupabaseRestUrl,
  SUPABASE_ACCESS_TOKEN_COOKIE,
  SUPABASE_REFRESH_TOKEN_COOKIE,
} from "./config";
'''
if server_source.count(config_anchor) != 1:
    raise SystemExit("server_import_anchor_invalid")
server_source = server_source.replace(
    config_anchor,
    config_anchor
    + 'import {\n'
    + '  minimizeWebhookDiagnosticPayload,\n'
    + '  normalizeWebhookErrorCode,\n'
    + '} from "@/lib/webhookSecurityPolicy.mjs";\n',
    1,
)

server_pattern = re.compile(
    r"export async function createMetaWebhookDebugEvent\(input: \{[\s\S]*?\n\}\n\nexport async function checkMetaWebhookStorageHealth",
    re.S,
)
server_replacement = '''export async function createMetaWebhookDebugEvent(input: {
  workspaceId?: string | null;
  socialConnectionId?: string | null;
  platform?: "facebook" | "instagram" | "telegram";
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

  const normalizedStatus = String(input.status ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .slice(0, 64);
  const status = /^[a-z][a-z0-9_]{0,63}$/.test(normalizedStatus)
    ? normalizedStatus
    : "processing_failed";
  const errorReason = input.errorReason
    ? normalizeWebhookErrorCode(input.errorReason)
    : null;
  const minimized = minimizeWebhookDiagnosticPayload(input.rawPayload);
  const rawPayload =
    minimized && typeof minimized === "object" && !Array.isArray(minimized)
      ? minimized
      : { schema_version: 1, provider_shape: minimized };

  const result = await postgrestRequest<MetaWebhookEventRow>(
    "meta_webhook_events",
    "POST",
    {
      workspace_id: input.workspaceId ?? null,
      social_connection_id: input.socialConnectionId ?? null,
      platform: input.platform ?? "facebook",
      source: "meta_webhook",
      event_type: input.eventType,
      page_id: null,
      sender_id: null,
      recipient_id: null,
      text: null,
      message_text: null,
      raw_payload: rawPayload,
      status,
      error_reason: errorReason,
      message_id: null,
      received_at: input.receivedAt ?? new Date().toISOString(),
    },
    serviceAccessToken,
    { select: META_WEBHOOK_EVENT_COLUMNS, single: true },
  );

  if (result.error) {
    console.error("Meta webhook diagnostic insert failed", {
      table: "meta_webhook_events",
      eventType: input.eventType,
      status,
      errorCode: "diagnostic_persist_failed",
    });
    return { event: null, error: result.error };
  }
  return { event: result.data, error: null };
}

export async function checkMetaWebhookStorageHealth'''
server_source, count = server_pattern.subn(server_replacement, server_source, count=1)
if count != 1:
    raise SystemExit(f"server_debug_function_anchor_count_{count}")

for forbidden in (
    "page_id: normalizeOptionalText(input.pageId)",
    "sender_id: normalizeOptionalText(input.senderId)",
    "recipient_id: normalizeOptionalText(input.recipientId)",
    "message_text: normalizeOptionalText(input.messageText)",
    "error: result.error.message",
):
    if forbidden in server_source:
        raise SystemExit(f"server_forbidden_remaining:{forbidden}")

Path(server_path).write_text(server_source, encoding="utf-8")
print("WEBHOOK_RETENTION_PATCH_RESULT=success")
