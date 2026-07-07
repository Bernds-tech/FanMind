import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/admin";
import { updateAdminBillingWorkspace } from "@/lib/adminBilling";
import { redirectAdminHtml } from "@/lib/adminRedirects";

const PAYMENT_SOURCES = ["bank_transfer", "stripe_confirmed", "cash_or_other", "credit_note", "correction"] as const;

function sourceText(source: string): string {
  if (source === "bank_transfer") return "Zahlung per Banküberweisung eingegangen";
  if (source === "credit_note") return "Zahlung durch Gutschrift/Kulanz ausgeglichen";
  return "Zahlung als eingegangen markiert";
}

export async function POST(request: NextRequest, ctx: RouteContext<"/api/admin/billing/workspaces/[workspaceId]/mark-paid">) {
  const admin = await requirePlatformAdmin();
  const { workspaceId } = await ctx.params;
  const form = await request.formData().catch(() => new FormData());
  const rawSource = form.get("payment_source")?.toString() ?? "bank_transfer";
  const paymentSource = PAYMENT_SOURCES.includes(rawSource as (typeof PAYMENT_SOURCES)[number]) ? rawSource : "bank_transfer";
  const amount = form.get("amount")?.toString().trim();
  const reference = form.get("reference")?.toString().trim();
  const paidAtInput = form.get("paid_at")?.toString();
  const paidAt = paidAtInput ? new Date(`${paidAtInput}T12:00:00.000Z`).toISOString() : new Date().toISOString();
  const liftPaymentSuspension = form.get("lift_payment_suspension") === "true";
  const noteParts = [`Zahlung verbucht: ${paymentSource}`, sourceText(paymentSource)];
  if (amount) noteParts.push(`Betrag: ${amount}`);
  if (reference) noteParts.push(`Referenz: ${reference}`);
  noteParts.push(`Datum: ${paidAt.slice(0, 10)}`);
  const values: Record<string, unknown> = { billing_status: "active", billing_last_payment_at: paidAt, billing_retry_count: 0, billing_next_retry_at: null, billing_grace_until: null, billing_admin_note: noteParts.join(" · ") };
  if (liftPaymentSuspension) Object.assign(values, { billing_suspended_at: null, billing_suspended_reason: null });
  const result = await updateAdminBillingWorkspace(workspaceId, admin, values);
  const htmlRedirect = redirectAdminHtml(request, `/admin/billing/workspaces/${workspaceId}`);
  if (htmlRedirect) return htmlRedirect;
  return NextResponse.json(result.ok ? { ok: true } : { error: result.error }, { status: result.status });
}
