import { NextResponse } from "next/server";
import { buildFanMindDataExportPdf, type PdfSection } from "@/lib/dataExport/pdf";
import { getWorkspaceAiUsageSummary } from "@/lib/workspaceAiUsage";
import { getWorkspaceReferralSummary } from "@/lib/referrals";
import {
  getContactMemories,
  getSupabaseServerUser,
  getUserWorkspaceDashboard,
  getWorkspaceContacts,
  getWorkspaceConversationMessages,
  getWorkspaceFollowups,
} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function metadataText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function GET() {
  const userResult = await getSupabaseServerUser();
  const user = userResult.data.user;
  if (!user) return NextResponse.json({ error: "Bitte melde dich erneut an, um deine Datenauskunft herunterzuladen." }, { status: 401 });

  const workspaceResult = await getUserWorkspaceDashboard(user);
  if (workspaceResult.error || !workspaceResult.workspace) {
    return NextResponse.json({ error: "Deine Datenauskunft konnte nicht vorbereitet werden. Bitte prüfe deinen Workspace-Zugriff." }, { status: 403 });
  }
  const workspace = workspaceResult.workspace;

  const [contactsResult, followupsResult, messagesResult, aiUsageResult, referralSummary] = await Promise.all([
    getWorkspaceContacts(workspace.id),
    getWorkspaceFollowups(workspace.id),
    getWorkspaceConversationMessages(workspace.id),
    getWorkspaceAiUsageSummary(workspace.id),
    getWorkspaceReferralSummary(workspace.id, user.id),
  ]);
  const contacts = contactsResult.contacts ?? [];
  const memories = (await Promise.all(contacts.slice(0, 200).map((contact) => getContactMemories(workspace.id, contact.id)))).flatMap((result) => result.memories ?? []);
  const sections: PdfSection[] = [
    { title: "Profilinformationen / Profile information", rows: [["User-ID", user.id], ["E-Mail", user.email], ["Anzeigename", metadataText(user.user_metadata?.display_name) ?? metadataText(user.user_metadata?.full_name)]] },
    { title: "Workspace- und Unternehmensdaten", rows: [["Workspace-ID", workspace.id], ["Name", workspace.name], ["Organisation", workspace.organization_name], ["Adresse", [workspace.street_address, workspace.postal_code, workspace.city, workspace.country].filter(Boolean).join(", ")]] },
    { title: "Steuer- und Rechnungsstammdaten", rows: [["UID / VAT ID", workspace.vat_id], ["Steuernummer", workspace.tax_number], ["Firmenbuchnummer", workspace.company_register_number], ["Firmenbuchgericht", workspace.company_register_court]] },
    { title: "Paket- und Billingstatus", rows: [["Paket", workspace.plan_id], ["Billingstatus", workspace.billing_status], ["Setup-Cents", workspace.setup_fee_cents], ["Monatsgebühr-Cents", workspace.monthly_fee_cents], ["Letzte Rechnung", workspace.last_invoice_status]] },
    { title: "Kontakte / Fans", rows: [], lines: contacts.length ? contacts.map((c) => `${c.display_name} · ${c.handle ?? "ohne Handle"} · ${c.source_platform ?? "ohne Kanal"} · Top Fan: ${c.is_top_fan ? "Ja" : "Nein"}`) : ["Keine Daten vorhanden"] },
    { title: "Notizen und Kontaktwissen", rows: [], lines: memories.length ? memories.map((m) => `${m.type ?? "Kontaktwissen"}: ${m.content}`) : ["Keine Daten vorhanden"] },
    { title: "Follow-ups inklusive Status", rows: [], lines: followupsResult.followups.length ? followupsResult.followups.map((f) => `${f.due_date ?? "ohne Datum"} · ${f.status} · ${f.reason}`) : ["Keine Daten vorhanden"] },
    { title: "Gespeicherte CRM- und Interaktionsdaten", rows: [], lines: messagesResult.messages.length ? messagesResult.messages.map((m) => `${m.created_at ?? "ohne Datum"} · ${m.direction} · ${m.source_platform ?? "FanMind"}: ${m.content}`) : ["Keine Daten vorhanden"] },
    { title: "KI-Nutzungsübersicht", rows: [["Anfragen", aiUsageResult.summary?.totalRequests], ["Erfolgreich", aiUsageResult.summary?.successfulRequests], ["Fehler", aiUsageResult.summary?.errorRequests], ["Geschätzte Tokens", aiUsageResult.summary?.estimatedTotalTokens]] },
    { title: "Referral-/Empfehlungsstatus", rows: [["Status", referralSummary.member?.status], ["Aktive Referrals", referralSummary.activeReferralCount], ["Rabatt vorbereitet", `${referralSummary.discountPercent} %`], ["Programmstatus", referralSummary.state?.status]] },
  ];
  const pdf = buildFanMindDataExportPdf({ title: "Datenauskunft / Data export", createdAt: new Date(), sections });
  const filename = `FanMind-Datenauskunft-${new Date().toISOString().slice(0, 10)}.pdf`;
  return new Response(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "no-store" } });
}
