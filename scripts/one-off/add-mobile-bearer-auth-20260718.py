#!/usr/bin/env python3
from pathlib import Path


def patch(path: str, replacements: list[tuple[str, str, str]]) -> None:
    file = Path(path)
    text = file.read_text(encoding="utf-8")
    for old, new, label in replacements:
        count = text.count(old)
        if count != 1:
            raise SystemExit(f"{path} / {label}: expected one match, found {count}")
        text = text.replace(old, new, 1)
    file.write_text(text, encoding="utf-8")


patch(
    "src/lib/supabase/server.ts",
    [
        (
            '''export async function getSupabaseServerUser(): Promise<SupabaseServerUserResponse> {
  const accessToken = await getAccessToken();
''',
            '''export async function getSupabaseServerUser(
  accessTokenOverride?: string,
): Promise<SupabaseServerUserResponse> {
  const accessToken = accessTokenOverride ?? (await getAccessToken());
''',
            "getSupabaseServerUser override",
        ),
        (
            '''export async function getUserWorkspaceDashboard(
  user: SupabaseServerUser,
): Promise<WorkspaceDashboardResult> {
  const accessToken = await getAccessToken();
''',
            '''export async function getUserWorkspaceDashboard(
  user: SupabaseServerUser,
  accessTokenOverride?: string,
): Promise<WorkspaceDashboardResult> {
  const accessToken = accessTokenOverride ?? (await getAccessToken());
''',
            "getUserWorkspaceDashboard override",
        ),
        (
            '''export async function getWorkspaceContact(
  workspaceId: string,
  contactId: string,
): Promise<ContactDetailResult> {
  const accessToken = await getAccessToken();
''',
            '''export async function getWorkspaceContact(
  workspaceId: string,
  contactId: string,
  accessTokenOverride?: string,
): Promise<ContactDetailResult> {
  const accessToken = accessTokenOverride ?? (await getAccessToken());
''',
            "getWorkspaceContact override",
        ),
    ],
)

patch(
    "src/app/api/ai/reply-suggestions/route.ts",
    [
        (
            '''import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
''',
            '''import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import {
  BearerAccessTokenError,
  getOptionalBearerAccessToken,
} from "@/lib/requestAccessToken";
''',
            "Bearer import",
        ),
        (
            '''  let authorizationContext: Awaited<
    ReturnType<typeof requireContactInAuthorizedWorkspace>
  >;

  try {
    authorizationContext = await requireContactInAuthorizedWorkspace(contactId);
''',
            '''  let authorizationContext: Awaited<
    ReturnType<typeof requireContactInAuthorizedWorkspace>
  >;
  let accessToken: string | undefined;

  try {
    accessToken = getOptionalBearerAccessToken(request);
  } catch (error) {
    if (error instanceof BearerAccessTokenError) {
      return jsonError("Bitte melde dich in der FanMind-App erneut an.", 401);
    }
    return jsonError("Mobile Sitzung konnte nicht geprüft werden.", 401);
  }

  try {
    authorizationContext = await requireContactInAuthorizedWorkspace(
      contactId,
      accessToken,
    );
''',
            "Bearer authorization use",
        ),
    ],
)

print("Mobile Bearer authentication support applied.")
