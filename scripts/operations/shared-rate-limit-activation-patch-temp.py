from pathlib import Path


def replace_once(path: str, old: str, new: str, label: str) -> None:
    target = Path(path)
    source = target.read_text(encoding="utf-8")
    if source.count(old) != 1:
        raise SystemExit(f"anchor_{label}_count_{source.count(old)}")
    target.write_text(source.replace(old, new, 1), encoding="utf-8")


path = "src/app/api/ai/reply-suggestions/route.ts"

replace_once(
    path,
    'import { checkRateLimit, getClientIp } from "@/lib/rateLimit";\n',
    'import { getClientIp } from "@/lib/rateLimit";\n'
    'import { consumeSharedRateLimit } from "@/lib/sharedRateLimit";\n',
    "ai_import",
)

replace_once(
    path,
    '''  const rateLimit = checkRateLimit(
    `ai-reply:${authorizationContext.user.id}:${getClientIp(request)}`,
    { maxRequests: AI_RATE_LIMIT_MAX, windowMs: AI_RATE_LIMIT_WINDOW_MS },
  );

  if (!rateLimit.allowed) {
    return jsonError("Zu viele KI-Anfragen. Bitte versuche es später erneut.", 429);
  }
''',
    '''  let rateLimit;
  try {
    rateLimit = await consumeSharedRateLimit({
      scope: "ai_reply_user_ip",
      subject: `${authorizationContext.user.id}:${getClientIp(request)}`,
      maxRequests: AI_RATE_LIMIT_MAX,
      windowMs: AI_RATE_LIMIT_WINDOW_MS,
    });
  } catch {
    return jsonError(
      "Antwortvorschläge konnten gerade nicht erzeugt werden.",
      503,
    );
  }

  if (!rateLimit.allowed) {
    return jsonError("Zu viele KI-Anfragen. Bitte versuche es später erneut.", 429);
  }
''',
    "ai_rate_limit",
)
