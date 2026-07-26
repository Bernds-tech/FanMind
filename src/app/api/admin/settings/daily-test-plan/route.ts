import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/admin";
import { setPublicDailyTestPlanEnabled } from "@/lib/runtimeProductSettings";

export async function POST(request: NextRequest) {
  const admin = await requirePlatformAdmin();
  const formData = await request.formData();
  const enabled = formData.get("enabled") === "true";

  await setPublicDailyTestPlanEnabled(enabled, admin.email ?? admin.id);

  const destination = new URL("/admin/settings", request.url);
  destination.searchParams.set("daily_test_plan", enabled ? "enabled" : "disabled");
  return NextResponse.redirect(destination, { status: 303 });
}
