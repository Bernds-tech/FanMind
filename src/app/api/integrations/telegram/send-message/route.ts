import { sendManualTelegramMessage } from "@/lib/supabase/server";
import { isPlatformAdminEmail } from "@/lib/admin";
import { isTemporaryDemoUser } from "@/lib/demoMode";
import {
  requireContactInAuthorizedWorkspace,
  WorkspaceAuthorizationError,
} from "@/lib/workspaceAuthorization";

export async function POST(request: Request) {
  if (process.env.FANMIND_ENABLE_TELEGRAM_SEND !== "true") {
    return Response.json(
      {
        error:
          "Telegram-Senden ist in dieser Umgebung deaktiviert und nicht Teil der Standarddemo.",
      },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    contactId?: string;
    text?: string;
  } | null;
  const contactId = body?.contactId?.trim();
  const text = body?.text?.trim();
  if (!contactId || !text) {
    return Response.json(
      { error: "Kontakt und geprüfter Antworttext sind erforderlich." },
      { status: 400 },
    );
  }

  let authorized;
  try {
    authorized = await requireContactInAuthorizedWorkspace(contactId);
  } catch (error) {
    const status =
      error instanceof WorkspaceAuthorizationError &&
      error.code === "unauthenticated"
        ? 401
        : 403;
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Kein Workspace-Zugriff.",
      },
      { status },
    );
  }

  if (
    isTemporaryDemoUser(authorized.user) ||
    !isPlatformAdminEmail(authorized.user.email)
  ) {
    return Response.json(
      {
        error:
          "Telegram-Senden ist nur für ausdrücklich freigegebene Admin-/Pilotprüfungen erlaubt.",
      },
      { status: 403 },
    );
  }

  const result = await sendManualTelegramMessage({
    workspaceId: authorized.workspace.id,
    contactId: authorized.contact.id,
    text,
  });
  if (result.error) {
    return Response.json({ error: result.error.message }, { status: 400 });
  }

  return Response.json({ ok: true, messageId: result.message?.id ?? null });
}
