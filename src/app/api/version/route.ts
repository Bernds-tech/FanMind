import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const releaseCommit =
    process.env.FANMIND_RELEASE_COMMIT?.trim().toLowerCase() || "unknown";

  return NextResponse.json(
    {
      application: "fanmind",
      releaseCommit,
      environment: process.env.NODE_ENV || "unknown",
      checkedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
