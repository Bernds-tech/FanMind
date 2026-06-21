import { getSupabaseServerUser, getUserWorkspaceDashboard, sendManualTelegramMessage } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { data } = await getSupabaseServerUser();
  if (!data.user) return Response.json({ error: "Nicht angemeldet." }, { status: 401 });

  const workspaceResult = await getUserWorkspaceDashboard(data.user);
  if (!workspaceResult.workspace) {
    return Response.json({ error: workspaceResult.error?.message ?? "Kein Workspace-Zugriff." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { contactId?: string; text?: string } | null;
  const contactId = body?.contactId?.trim();
  const text = body?.text?.trim();
  if (!contactId || !text) {
    return Response.json({ error: "Kontakt und geprüfter Antworttext sind erforderlich." }, { status: 400 });
  }

  const result = await sendManualTelegramMessage({ workspaceId: workspaceResult.workspace.id, contactId, text });
  if (result.error) return Response.json({ error: result.error.message }, { status: 400 });

  return Response.json({ ok: true, messageId: result.message?.id ?? null });
}
