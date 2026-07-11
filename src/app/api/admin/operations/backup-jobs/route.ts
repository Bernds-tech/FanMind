import { NextResponse } from "next/server";
import { getSupabaseServerUser } from "@/lib/supabase/server";
import { enqueueBackupJob } from "@/lib/backupOperations";

export async function POST(request: Request) {
  const { data } = await getSupabaseServerUser();
  if (!data.user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  let body: { jobType?: unknown } = {};
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  const result = await enqueueBackupJob(request, data.user, body.jobType);
  return NextResponse.json(result.body, { status: result.status });
}
