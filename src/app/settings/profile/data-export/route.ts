import { NextResponse } from "next/server";
import { getCommercialOptionLabel } from "@/lib/dashboardFeatures";
import {
  getSupabaseServerUser,
  getUserWorkspaceDashboard,
  getWorkspaceContacts,
} from "@/lib/supabase/server";
import { createDataDisclosurePdf } from "@/lib/dataDisclosurePdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getUserDisplayName(
  metadata: Record<string, unknown> | undefined,
): string | undefined {
  const displayName = metadata?.display_name ?? metadata?.full_name;
  return typeof displayName === "string" && displayName.trim()
    ? displayName.trim()
    : undefined;
}

export async function GET(request: Request) {
  const { data } = await getSupabaseServerUser();
  if (!data.user) return NextResponse.redirect(new URL("/login", request.url));

  const workspaceResult = await getUserWorkspaceDashboard(data.user);
  const workspace = workspaceResult.workspace;
  if (!workspace) {
    return new NextResponse("Workspace nicht gefunden.", { status: 404 });
  }

  const contactsResult = await getWorkspaceContacts(workspace.id);
  if (contactsResult.error) {
    return new NextResponse("Datenauskunft konnte nicht erstellt werden.", {
      status: 500,
    });
  }

  const locale = new URL(request.url).searchParams.get("lang") === "en" ? "en" : "de";
  const pdf = createDataDisclosurePdf({
    generatedAt: new Date(),
    locale,
    user: {
      id: data.user.id,
      email: data.user.email,
      displayName: getUserDisplayName(data.user.user_metadata),
    },
    workspace: {
      id: workspace.id,
      name: workspace.name,
      planId: workspace.plan_id,
      commercialOption: getCommercialOptionLabel(workspace.commercial_option),
      billingStatus: workspace.billing_status,
      setupFeeCents: workspace.setup_fee_cents,
      monthlyFeeCents: workspace.monthly_fee_cents,
      commitmentMonths: workspace.commitment_months,
      organizationName: workspace.organization_name,
      streetAddress: workspace.street_address,
      postalCode: workspace.postal_code,
      city: workspace.city,
      country: workspace.country,
      vatId: workspace.vat_id,
      taxNumber: workspace.tax_number,
      companyRegisterNumber: workspace.company_register_number,
      companyRegisterCourt: workspace.company_register_court,
      billingCurrentPeriodEndAt: workspace.billing_current_period_end_at,
      billingMinimumTermEndsAt: workspace.billing_minimum_term_ends_at,
      subscriptionCancelRequestedAt: workspace.subscription_cancel_requested_at,
      subscriptionEffectiveEndAt: workspace.subscription_effective_end_at,
      workspaceAccessMode: workspace.workspace_access_mode,
    },
    contacts: contactsResult.contacts.map((contact) => ({
      displayName: contact.display_name,
      handle: contact.handle,
      sourcePlatform: contact.source_platform,
      language: contact.language,
      status: contact.status,
      tags: contact.tags,
      summary: contact.summary,
      internalNotes: contact.internal_notes,
      createdAt: contact.created_at,
      updatedAt: contact.updated_at,
    })),
  });

  const body = new ArrayBuffer(pdf.byteLength);
  new Uint8Array(body).set(pdf);
  const filename =
    locale === "en" ? "fanmind-data-disclosure.pdf" : "fanmind-datenauskunft.pdf";

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
