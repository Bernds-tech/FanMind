import { revalidatePath } from "next/cache";
import {
  checkMetaWebhookStorageHealth,
  getSupabaseServerUser,
  getUserWorkspaceDashboard,
  getWorkspaceSocialConnections,
} from "@/lib/supabase/server";
import { processMetaWebhookPayload } from "@/lib/metaWebhook";

export const dynamic = "force-dynamic";

export async function POST() {
  const { data } = await getSupabaseServerUser();
  if (!data.user) return Response.json({ ok: false, error: "Nicht angemeldet." }, { status: 401 });

  const workspaceResult = await getUserWorkspaceDashboard(data.user);
  const workspace = workspaceResult.workspace;
  if (!workspace) return Response.json({ ok: false, error: "Kein Workspace gefunden." }, { status: 403 });

  const storageHealth = await checkMetaWebhookStorageHealth();
  if (!storageHealth.serviceRoleConfigured) {
    return Response.json(
      { ok: false, error: "Service-Role-Key fehlt: SUPABASE_SERVICE_ROLE_KEY ist serverseitig nicht konfiguriert." },
      { status: 503 },
    );
  }
  if (!storageHealth.tableReadable) {
    return Response.json(
      { ok: false, error: `Meta-Webhook-Tabelle fehlt oder ist nicht lesbar: ${storageHealth.error?.message ?? "public.meta_webhook_events konnte nicht gelesen werden."}` },
      { status: 503 },
    );
  }

  const connectionsResult = await getWorkspaceSocialConnections(workspace.id);
  const facebookConnection = connectionsResult.connections.find(
    (connection) => connection.platform === "facebook" && connection.status === "connected",
  );
  const pageId = facebookConnection?.page_id ?? `fanmind-self-test-${workspace.id}`;
  const senderId = `fanmind-self-test-sender-${Date.now()}`;

  const payload = {
    object: "page",
    entry: [
      {
        id: pageId,
        time: Math.floor(Date.now() / 1000),
        messaging: [
          {
            sender: { id: senderId },
            recipient: { id: pageId },
            timestamp: Date.now(),
            message: {
              mid: `fanmind-self-test-${Date.now()}`,
              text: "FanMind Webhook-Selbsttest",
            },
          },
        ],
      },
    ],
  };

  const result = await processMetaWebhookPayload(payload);
  revalidatePath("/channels");

  return Response.json(
    {
      ok: !result.error,
      workspace_id: workspace.id,
      page_id: pageId,
      event_type: "messages",
      status: result.error ? "error" : result.saved ? "stored" : "ignored",
      error: result.error ?? null,
      saved: result.saved,
      skipped: result.skipped,
    },
    { status: result.error ? 500 : 200 },
  );
}
