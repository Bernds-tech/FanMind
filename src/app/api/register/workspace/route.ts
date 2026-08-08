import { NextRequest, NextResponse } from "next/server";
import {
  isTrustedFanMindMutationRequest,
  readBoundedJsonRequest,
} from "@/lib/httpMutationPolicy.mjs";
import {
  ensureUserWorkspace,
  getSupabaseServerUser,
  PUBLIC_DAILY_TEST_BILLING_UNAVAILABLE_ERROR,
  PUBLIC_DAILY_TEST_PROVISIONING_UNAVAILABLE_ERROR,
  PUBLIC_DAILY_TEST_PLAN_UNAVAILABLE_ERROR,
} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MAX_REGISTER_WORKSPACE_BODY_BYTES = 32;
const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

function jsonNoStore(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, { status, headers: NO_STORE_HEADERS });
}

export async function POST(request: NextRequest) {
  if (!isTrustedFanMindMutationRequest(request)) {
    return jsonNoStore({ ok: false, code: "origin_forbidden" }, 403);
  }

  const parsedBody = await readBoundedJsonRequest(
    request,
    MAX_REGISTER_WORKSPACE_BODY_BYTES,
  );
  if (
    !parsedBody.ok ||
    !parsedBody.value ||
    typeof parsedBody.value !== "object" ||
    Array.isArray(parsedBody.value) ||
    Object.keys(parsedBody.value).length !== 0
  ) {
    return jsonNoStore(
      {
        ok: false,
        code:
          !parsedBody.ok && parsedBody.reason === "payload_too_large"
            ? "payload_too_large"
            : "invalid_request",
      },
      !parsedBody.ok && parsedBody.reason === "payload_too_large" ? 413 : 400,
    );
  }

  const { data } = await getSupabaseServerUser();
  if (!data.user) {
    return jsonNoStore({ ok: false, code: "authentication_required" }, 401);
  }

  const result = await ensureUserWorkspace(data.user);
  if (result.error || !result.workspace) {
    const dailyWindowClosed =
      result.error?.message === PUBLIC_DAILY_TEST_PLAN_UNAVAILABLE_ERROR;
    const dailyProvisioningUnavailable =
      result.error?.message ===
      PUBLIC_DAILY_TEST_PROVISIONING_UNAVAILABLE_ERROR;
    const dailyBillingUnavailable =
      result.error?.message === PUBLIC_DAILY_TEST_BILLING_UNAVAILABLE_ERROR;
    return jsonNoStore(
      {
        ok: false,
        code:
          dailyWindowClosed ||
          dailyProvisioningUnavailable ||
          dailyBillingUnavailable
            ? "daily_test_window_closed"
            : "workspace_setup_failed",
      },
      dailyWindowClosed || dailyProvisioningUnavailable || dailyBillingUnavailable
        ? 409
        : 503,
    );
  }

  return jsonNoStore({ ok: true }, 200);
}
