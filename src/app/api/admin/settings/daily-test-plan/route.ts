import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/admin";
import {
  isTrustedFanMindMutationRequest,
  readBoundedFormDataRequest,
} from "@/lib/httpMutationPolicy.mjs";
import { setPublicDailyTestPlanEnabled } from "@/lib/runtimeProductSettings";

const MAX_DAILY_TEST_PLAN_BODY_BYTES = 1_000;

export async function POST(request: NextRequest) {
  if (!isTrustedFanMindMutationRequest(request)) {
    return NextResponse.json({ error: "origin_forbidden" }, { status: 403 });
  }
  const admin = await requirePlatformAdmin();
  const parsedBody = await readBoundedFormDataRequest(
    request,
    MAX_DAILY_TEST_PLAN_BODY_BYTES,
  );
  if (!parsedBody.ok) {
    return NextResponse.json(
      { error: parsedBody.reason === "payload_too_large" ? "payload_too_large" : "invalid_request" },
      { status: parsedBody.reason === "payload_too_large" ? 413 : 400 },
    );
  }
  const formData = parsedBody.value;
  const enabled = formData.get("enabled") === "true";

  await setPublicDailyTestPlanEnabled(enabled, admin.email ?? admin.id);

  const destination = new URL("/admin/settings", request.url);
  destination.searchParams.set("daily_test_plan", enabled ? "enabled" : "disabled");
  return NextResponse.redirect(destination, { status: 303 });
}
