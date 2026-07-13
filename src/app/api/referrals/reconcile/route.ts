import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { isPlatformAdminEmail } from "@/lib/admin";
import { reconcileReferralAutomation } from "@/lib/referralAutomation";
import { getSupabaseServerUser } from "@/lib/supabase/server";

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  );
}

async function isAuthorized(request: NextRequest): Promise<boolean> {
  const configuredSecret =
    process.env.FANMIND_REFERRAL_RECONCILE_SECRET?.trim() || "";
  const authorization = request.headers.get("authorization") ?? "";
  const providedSecret = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";

  if (
    configuredSecret &&
    providedSecret &&
    safeEqual(configuredSecret, providedSecret)
  ) {
    return true;
  }

  const { data } = await getSupabaseServerUser();
  return isPlatformAdminEmail(data.user?.email);
}

export async function POST(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }

  const result = await reconcileReferralAutomation();
  return NextResponse.json(result, {
    status: result.errors.length ? 207 : 200,
    headers: { "Cache-Control": "no-store" },
  });
}
