import { NextResponse } from "next/server";
import { getSupabaseServerUser, getUserWorkspaceDashboard, getWorkspaceContacts } from "@/lib/supabase/server";
import { createDataDisclosurePdf } from "@/lib/dataDisclosurePdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getUserDisplayName(metadata: Record<string, unknown> | undefined): string | undefined {
  const displayName = metadata?.display_name ?? metadata?.full_name;
  return typeof displayName === "string" && displayName.trim() ? displayName.trim() : undefined;
}

export async function GET(request: Request) {
  const { data } = await getSupabaseServerUser();
  if (!data.user) return NextResponse.redirect(new URL("/login", request.url));

  const workspaceResult = await getUserWorkspaceDashboard(data.user);
  if (!workspaceResult.workspace) return new NextResponse("Workspace nicht gefunden.", { status: 404 });

  const contactsResult = await getWorkspaceContacts(workspaceResult.workspace.id);
  if (contactsResult.error) return new NextResponse(contactsResult.error.message, { status: 500 });

  const pdf = createDataDisclosurePdf({
    generatedAt: new Date(),
    user: { id: data.user.id, email: data.user.email, displayName: getUserDisplayName(data.user.user_metadata) },
    workspace: {
      id: workspaceResult.workspace.id,
      name: workspaceResult.workspace.name,
      planId: workspaceResult.workspace.plan_id,
      billingStatus: workspaceResult.workspace.billing_status,
    },
    contacts: contactsResult.contacts.map((contact) => ({
      displayName: contact.display_name,
      handle: contact.handle,
      sourcePlatform: contact.source_platform,
      language: contact.language,
      status: contact.status,
      summary: contact.summary,
    })),
  });

  const body = new ArrayBuffer(pdf.byteLength);
  new Uint8Array(body).set(pdf);

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="fanmind-datenauskunft.pdf"',
      "Cache-Control": "private, no-store",
    },
  });
}
