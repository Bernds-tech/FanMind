const ALLOWED_FETCH_SITES = new Set(["same-origin", "same-site", "none"]);

function httpOrigin(value) {
  const candidate = typeof value === "string" ? value.trim() : "";
  if (!candidate) return null;
  try {
    const parsed = new URL(candidate);
    return parsed.protocol === "https:" || parsed.protocol === "http:"
      ? parsed.origin
      : null;
  } catch {
    return null;
  }
}

export function isTrustedMutationRequest(request, configuredUrls = []) {
  const requestOrigin = httpOrigin(request?.url);
  const suppliedOrigin = httpOrigin(request?.headers?.get?.("origin"));
  if (!requestOrigin || !suppliedOrigin) return false;

  const allowedOrigins = new Set([requestOrigin]);
  for (const configuredUrl of configuredUrls) {
    const origin = httpOrigin(configuredUrl);
    if (origin) allowedOrigins.add(origin);
  }
  if (!allowedOrigins.has(suppliedOrigin)) return false;

  const fetchSite = request.headers.get("sec-fetch-site")?.trim().toLowerCase();
  return !fetchSite || ALLOWED_FETCH_SITES.has(fetchSite);
}

export function inspectDeclaredBodyLength(value, maximumBytes) {
  if (!Number.isSafeInteger(maximumBytes) || maximumBytes <= 0) {
    throw new TypeError("maximumBytes must be a positive safe integer");
  }
  if (value === null || value === undefined) return "unknown";
  const normalized = String(value).trim();
  if (!/^\d+$/u.test(normalized)) return "invalid";
  const parsed = Number(normalized);
  if (!Number.isSafeInteger(parsed)) return "invalid";
  return parsed > maximumBytes ? "too_large" : "accepted";
}

export async function readBoundedJsonRequest(request, maximumBytes) {
  const declaredLength = inspectDeclaredBodyLength(
    request.headers.get("content-length"),
    maximumBytes,
  );
  if (declaredLength === "invalid") {
    return { ok: false, reason: "invalid_content_length", value: null };
  }
  if (declaredLength === "too_large") {
    return { ok: false, reason: "payload_too_large", value: null };
  }

  let rawBody;
  try {
    rawBody = await request.text();
  } catch {
    return { ok: false, reason: "invalid_body", value: null };
  }
  if (new TextEncoder().encode(rawBody).byteLength > maximumBytes) {
    return { ok: false, reason: "payload_too_large", value: null };
  }

  try {
    return { ok: true, reason: null, value: JSON.parse(rawBody) };
  } catch {
    return { ok: false, reason: "invalid_json", value: null };
  }
}
