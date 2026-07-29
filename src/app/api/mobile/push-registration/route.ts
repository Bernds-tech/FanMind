import { NextResponse } from "next/server";

import { isTemporaryDemoUser } from "@/lib/demoMode";
import {
  MOBILE_PUSH_CLIENT_HEADER,
  MOBILE_PUSH_MAX_REQUEST_BYTES,
  MobilePushRegistrationPolicyError,
  validateMobilePushAction,
} from "@/lib/mobilePushRegistrationPolicy.mjs";
import {
  getMobilePushRegistrationStatus,
  MobilePushRegistrationServiceError,
  registerMobilePushToken,
  unregisterMobilePushToken,
} from "@/lib/mobilePushRegistrations";
import {
  BearerAccessTokenError,
  getOptionalBearerAccessToken,
} from "@/lib/requestAccessToken";
import {
  getSupabaseServerUser,
  getUserWorkspaceDashboard,
} from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function response(payload: Record<string, unknown>, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
function errorResponse(code: string, status: number, message: string) {
  return response({ ok: false, code, error: message }, status);
}

async function authenticateMobile(request: Request) {
  if (
    request.headers.get("x-fanmind-client")?.trim().toLowerCase() !==
    MOBILE_PUSH_CLIENT_HEADER
  ) {
    throw new MobilePushRegistrationServiceError("mobile_client_required");
  }

  let accessToken: string | undefined;
  try {
    accessToken = getOptionalBearerAccessToken(request);
  } catch (error) {
    if (error instanceof BearerAccessTokenError) {
      throw new MobilePushRegistrationServiceError("unauthenticated");
    }
    throw error;
  }
  if (!accessToken) {
    throw new MobilePushRegistrationServiceError("unauthenticated");
  }

  const { data } = await getSupabaseServerUser(accessToken);
  if (!data.user) {
    throw new MobilePushRegistrationServiceError("unauthenticated");
  }
  const workspaceResult = await getUserWorkspaceDashboard(data.user, accessToken);
  if (!workspaceResult.workspace) {
    throw new MobilePushRegistrationServiceError("workspace_required");
  }
  if (isTemporaryDemoUser(data.user)) {
    throw new MobilePushRegistrationServiceError("temporary_demo_not_allowed");
  }

  return {
    user: data.user,
    workspace: workspaceResult.workspace,
  };
}

async function readPayload(request: Request) {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) {
    throw new MobilePushRegistrationPolicyError("invalid_content_type");
  }
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (
    Number.isFinite(contentLength) &&
    contentLength > MOBILE_PUSH_MAX_REQUEST_BYTES
  ) {
    throw new MobilePushRegistrationPolicyError("request_too_large");
  }
  const raw = await request.text();
  if (
    Buffer.byteLength(raw, "utf8") === 0 ||
    Buffer.byteLength(raw, "utf8") > MOBILE_PUSH_MAX_REQUEST_BYTES
  ) {
    throw new MobilePushRegistrationPolicyError("request_too_large");
  }
  return JSON.parse(raw);
}

function mapError(error: unknown) {
  if (
    error instanceof MobilePushRegistrationPolicyError ||
    error instanceof SyntaxError
  ) {
    const code =
      error instanceof MobilePushRegistrationPolicyError
        ? error.code
        : "invalid_request";
    return errorResponse(code, 400, "Bitte prüfe die Push-Einstellungen.");
  }
  if (error instanceof MobilePushRegistrationServiceError) {
    if (error.code === "unauthenticated") {
      return errorResponse(
        error.code,
        401,
        "Bitte melde dich erneut an, um Push-Erinnerungen zu verwalten.",
      );
    }
    if (error.code === "mobile_client_required") {
      return errorResponse(error.code, 403, "Diese Funktion ist nur in der FanMind-App verfügbar.");
    }
    if (
      error.code === "workspace_required" ||
      error.code === "temporary_demo_not_allowed"
    ) {
      return errorResponse(
        error.code,
        409,
        "Push-Erinnerungen benötigen einen bestätigten, nicht temporären Workspace.",
      );
    }
    if (error.code === "push_token_conflict") {
      return errorResponse(
        error.code,
        409,
        "Dieses Gerät ist noch sicher an ein anderes FanMind-Konto gebunden.",
      );
    }
  }
  return errorResponse(
    "push_registration_unavailable",
    503,
    "Die Push-Vorbereitung ist serverseitig noch nicht freigegeben.",
  );
}

export async function POST(request: Request) {
  try {
    const { user, workspace } = await authenticateMobile(request);
    const input = validateMobilePushAction(await readPayload(request));

    if (input.action === "status") {
      const status = await getMobilePushRegistrationStatus(user.id);
      return response({ ok: true, status });
    }
    if (input.action === "unregister") {
      const status = await unregisterMobilePushToken(user.id);
      return response({ ok: true, status });
    }

    const status = await registerMobilePushToken({
      userId: user.id,
      workspaceId: workspace.id,
      token: input.token,
      projectId: input.projectId,
      platform: input.platform,
    });
    return response({ ok: true, status }, 201);
  } catch (error) {
    return mapError(error);
  }
}
