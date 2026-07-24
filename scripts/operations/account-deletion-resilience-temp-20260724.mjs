#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";

const processorPath = "scripts/operations/process-account-deletion.mjs";
let source = await readFile(processorPath, "utf8");

function replaceRequired(from, to, label) {
  if (!source.includes(from)) {
    throw new Error(`resilience_anchor_missing:${label}`);
  }
  source = source.replace(from, to);
}

replaceRequired(
  'const PROCESSABLE_STATUSES = new Set(["pending", "blocked"]);',
  'const PROCESSABLE_STATUSES = new Set(["pending", "blocked", "processing"]);',
  "processable_statuses",
);

replaceRequired(
  '"id,user_id,workspace_id,notification_email,request_source,status,requires_ownership_transfer,requires_subscription_resolution,requested_at,processing_deadline_at",',
  '"id,user_id,workspace_id,notification_email,request_source,status,requires_ownership_transfer,requires_subscription_resolution,requested_at,processing_deadline_at,completion_notification_sent_at",',
  "request_columns",
);

const authStart = source.indexOf("async function getAuthUser(");
const authEnd = source.indexOf("\nasync function getOwnedWorkspaces", authStart);
if (authStart < 0 || authEnd < 0) {
  throw new Error("resilience_anchor_missing:get_auth_user");
}
source = `${source.slice(0, authStart)}${`async function getAuthUser(
  fetchImpl,
  config,
  userId,
  { allowMissing = false } = {},
) {
  const response = await fetchImpl(
    \`${"${config.supabaseUrl}"}/auth/v1/admin/users/${"${encodeURIComponent(userId)}"}\`,
    {
      headers: serviceHeaders(config.serviceKey),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    },
  ).catch(() => null);
  if (!response) {
    throw new AccountDeletionProcessorError("auth_user_lookup_failed");
  }
  if (allowMissing && response.status === 404) return null;
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload || typeof payload !== "object") {
    throw new AccountDeletionProcessorError("auth_user_lookup_failed");
  }
  return payload.user ?? payload;
}
`}${source.slice(authEnd + 1)}`;

const processStart = source.indexOf("export async function processAccountDeletion(");
const processEnd = source.indexOf("\nasync function main()", processStart);
if (processStart < 0 || processEnd < 0) {
  throw new Error("resilience_anchor_missing:process_function");
}

const replacement = `function enforceExecutionGates(env, requestId, confirmation) {
  if (env.FANMIND_ACCOUNT_DELETION_EXECUTION_ENABLED !== "true") {
    throw new AccountDeletionProcessorError("execution_gate_disabled");
  }
  if (confirmation !== requestId) {
    throw new AccountDeletionProcessorError("execution_confirmation_invalid");
  }
  return requireValue(env, "FANMIND_ACCOUNT_DELETION_HASH_SECRET", 32);
}

async function markCompletionNotificationSent(
  fetchImpl,
  config,
  request,
  sentAt,
) {
  await restPatch(
    fetchImpl,
    config,
    "account_deletion_requests",
    new URLSearchParams({
      id: \`eq.${"${request.id}"}\`,
      status: "eq.processing",
      select: "id,status,completion_notification_sent_at",
    }).toString(),
    {
      completion_notification_sent_at: sentAt,
      last_error_code: null,
    },
    "completion_notification_record_failed",
  );
}

async function finalizeDeletedAccount({
  fetchImpl,
  env,
  config,
  request,
  userId,
  hashSecret,
  log,
}) {
  await verifyDeletion(fetchImpl, config, userId);
  const notificationEmail = String(request.notification_email ?? "")
    .trim()
    .toLowerCase();
  if (!notificationEmail) {
    throw new AccountDeletionProcessorError("completion_email_missing");
  }

  let completion = request.completion_notification_sent_at
    ? { sent: true, errorCode: null }
    : await sendCompletionEmail(
        fetchImpl,
        env,
        notificationEmail,
        request.id,
      );
  let notificationSentAt = request.completion_notification_sent_at || null;
  if (completion.sent && !notificationSentAt) {
    notificationSentAt = new Date().toISOString();
    await markCompletionNotificationSent(
      fetchImpl,
      config,
      request,
      notificationSentAt,
    );
  }

  const completedAt = new Date().toISOString();
  const finalStatus = completion.sent
    ? "completed"
    : "completed_notification_pending";
  await restPatch(
    fetchImpl,
    config,
    "account_deletion_requests",
    new URLSearchParams({
      id: \`eq.${"${request.id}"}\`,
      status: "eq.processing",
      select: "id,status",
    }).toString(),
    {
      user_id: null,
      workspace_id: null,
      user_reference_hash: userReferenceHash(userId, hashSecret),
      status: finalStatus,
      completed_at: completedAt,
      completion_notification_sent_at: notificationSentAt,
      notification_email: completion.sent ? null : notificationEmail,
      requires_ownership_transfer: false,
      requires_subscription_resolution: false,
      last_error_code: completion.errorCode,
    },
    "completion_record_failed",
  );

  log(\`ACCOUNT_DELETION_COMPLETION_NOTIFICATION_SENT=${"${completion.sent}"}\`);
  log(\`ACCOUNT_DELETION_RESULT=${"${finalStatus}"}\`);
  return finalStatus;
}

export async function processAccountDeletion({
  env,
  requestId,
  execute = false,
  confirmation = null,
  resume = false,
  fetchImpl = fetch,
  log = console.log,
  now = new Date(),
}) {
  if (!REQUEST_ID_PATTERN.test(requestId)) {
    throw new AccountDeletionProcessorError("request_id_invalid");
  }
  const supabaseUrl = normalizeSupabaseUrl(
    requireValue(env, "NEXT_PUBLIC_SUPABASE_URL", 12),
  );
  const serviceKey = requireValue(env, "SUPABASE_SERVICE_ROLE_KEY", 20);
  const config = { supabaseUrl, serviceKey };
  const request = await getDeletionRequest(fetchImpl, config, requestId);
  if (!PROCESSABLE_STATUSES.has(request.status)) {
    throw new AccountDeletionProcessorError("request_not_processable");
  }
  if (!request.user_id) {
    throw new AccountDeletionProcessorError("request_identity_missing");
  }

  const resuming = request.status === "processing";
  if (resuming && execute && !resume) {
    throw new AccountDeletionProcessorError("request_resume_required");
  }

  const authUser = await getAuthUser(fetchImpl, config, request.user_id, {
    allowMissing: resuming,
  });
  log(\`ACCOUNT_DELETION_MODE=${"${execute ? \"execute\" : \"dry_run\"}"}\`);
  log(\`ACCOUNT_DELETION_REQUEST_STATUS=${"${request.status}"}\`);
  log(\`ACCOUNT_DELETION_RESUME=${"${resuming}"}\`);

  if (!authUser) {
    log("ACCOUNT_DELETION_RECOVERY_STATE=auth_user_already_absent");
    if (!execute) {
      await verifyDeletion(fetchImpl, config, request.user_id);
      log("ACCOUNT_DELETION_RESULT=dry_run_resume_ready");
      return {
        executed: false,
        resumeRequired: true,
        eligibility: null,
      };
    }
    const hashSecret = enforceExecutionGates(env, requestId, confirmation);
    const finalStatus = await finalizeDeletedAccount({
      fetchImpl,
      env,
      config,
      request,
      userId: request.user_id,
      hashSecret,
      log,
    });
    return { executed: true, resumed: true, eligibility: null, finalStatus };
  }

  const workspaces = await getOwnedWorkspaces(
    fetchImpl,
    config,
    request.user_id,
  );
  const eligibility = await evaluateAccountDeletionEligibility({
    request,
    authUser,
    workspaces,
    fetchImpl,
    config,
    now,
  });

  log(\`ACCOUNT_DELETION_OWNED_WORKSPACE_COUNT=${"${eligibility.ownedWorkspaceCount}"}\`);
  log(\`ACCOUNT_DELETION_OTHER_MEMBER_COUNT=${"${eligibility.otherMemberCount}"}\`);
  log(
    \`ACCOUNT_DELETION_SUBSCRIPTION_BLOCKED=${"${eligibility.requiresSubscriptionResolution}"}\`,
  );
  log(\`ACCOUNT_DELETION_ELIGIBLE=${"${eligibility.eligible}"}\`);

  if (!execute) {
    log("ACCOUNT_DELETION_RESULT=dry_run_success");
    return { executed: false, resumeRequired: resuming, eligibility };
  }

  const hashSecret = enforceExecutionGates(env, requestId, confirmation);
  if (!eligibility.eligible) {
    if (!resuming) {
      await updateBlockedState(fetchImpl, config, request, eligibility);
    }
    throw new AccountDeletionProcessorError("request_blocked");
  }

  if (!resuming) {
    await restPatch(
      fetchImpl,
      config,
      "account_deletion_requests",
      new URLSearchParams({
        id: \`eq.${"${request.id}"}\`,
        user_id: \`eq.${"${request.user_id}"}\`,
        status: "in.(pending,blocked)",
        select: "id,status",
      }).toString(),
      {
        status: "processing",
        processing_started_at: now.toISOString(),
        requires_ownership_transfer: false,
        requires_subscription_resolution: false,
        last_error_code: null,
      },
      "request_update_failed",
    );
  }

  await deleteAuthUser(fetchImpl, config, request.user_id);
  const finalStatus = await finalizeDeletedAccount({
    fetchImpl,
    env,
    config,
    request: { ...request, status: "processing" },
    userId: request.user_id,
    hashSecret,
    log,
  });
  return { executed: true, resumed: resuming, eligibility, finalStatus };
}
`;
source = `${source.slice(0, processStart)}${replacement}${source.slice(processEnd)}`;

replaceRequired(
  '  const execute = hasFlag("--execute");\n  const confirmation = parseArgument("--confirm");',
  '  const execute = hasFlag("--execute");\n  const resume = hasFlag("--resume");\n  const confirmation = parseArgument("--confirm");',
  "main_resume_flag",
);
replaceRequired(
  '    execute,\n    confirmation,\n  });',
  '    execute,\n    confirmation,\n    resume,\n  });',
  "main_resume_pass",
);

await writeFile(processorPath, source, "utf8");
console.log(`RESILIENCE_PATCHED=${processorPath}`);

const docsPath = "docs/mobile/ACCOUNT_DELETION.md";
let docs = await readFile(docsPath, "utf8");
const executeExample = `  --execute \\\n  --confirm=<dieselbe UUID>`;
if (!docs.includes(executeExample)) {
  throw new Error("resilience_anchor_missing:docs_execute_example");
}
docs = docs.replace(
  executeExample,
  `${executeExample}\n\nBei einem unterbrochenen Lauf mit Status \`processing\` ist zusätzlich \`--resume\` erforderlich. Der Resume-Pfad prüft zuerst, ob der Auth-User noch existiert. Ist er bereits gelöscht, werden ausschließlich die Post-Delete-Verifikation, die Abschlussbenachrichtigung und die Pseudonymisierung sicher fortgesetzt.`,
);
const cancelSentence =
  "Solange der Status `pending` oder `blocked` ist, kann der Nutzer nach erneuter Anmeldung mit `LÖSCHANFRAGE ABBRECHEN` widerrufen.";
if (!docs.includes(cancelSentence)) {
  throw new Error("resilience_anchor_missing:docs_cancel");
}
docs = docs.replace(
  cancelSentence,
  `${cancelSentence} Die widerrufene Queue-Zeile wird vollständig entfernt, damit keine rohe User-ID aus einer alten Anfrage zurückbleibt.`,
);
await writeFile(docsPath, docs, "utf8");
console.log(`RESILIENCE_PATCHED=${docsPath}`);

const testPath = "tests/account-deletion-policy.test.mjs";
let tests = await readFile(testPath, "utf8");
const oldPattern =
  'assert.match(processor, /PROCESSABLE_STATUSES = new Set\\(\\["pending", "blocked"\\]\\)/u);';
if (!tests.includes(oldPattern)) {
  throw new Error("resilience_anchor_missing:test_status_pattern");
}
tests = tests.replace(
  oldPattern,
  'assert.match(processor, /PROCESSABLE_STATUSES = new Set\\(\\["pending", "blocked", "processing"\\]\\)/u);',
);
await writeFile(testPath, tests, "utf8");
console.log(`RESILIENCE_PATCHED=${testPath}`);
