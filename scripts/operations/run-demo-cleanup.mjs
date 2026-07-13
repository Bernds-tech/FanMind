#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const DEFAULT_ENV_FILE = "/var/www/fanmind/.env.production";
const DEFAULT_CLEANUP_URL = "https://fanmind.ch/api/demo/cleanup";
const DEFAULT_LIMIT = 25;

export function parseEnvText(text) {
  const values = new Map();
  for (const rawLine of text.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const separator = line.indexOf("=");
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }
    values.set(key, value);
  }
  return values;
}

export async function runDemoCleanup({
  envFile = process.env.FANMIND_ENV_FILE || DEFAULT_ENV_FILE,
  cleanupUrl = process.env.FANMIND_DEMO_CLEANUP_URL || DEFAULT_CLEANUP_URL,
  fetchImpl = globalThis.fetch,
  log = console.log,
  errorLog = console.error,
} = {}) {
  let text;
  try {
    text = await readFile(envFile, "utf8");
  } catch (error) {
    errorLog(
      `FanMind demo cleanup skipped: ENV file could not be read (${error instanceof Error ? error.message : "unknown error"}).`,
    );
    return { skipped: true, ok: false, reason: "env_unreadable" };
  }

  const values = parseEnvText(text);
  const secret = values.get("FANMIND_DEMO_CLEANUP_SECRET")?.trim() ?? "";
  if (secret.length < 32) {
    log("FanMind demo cleanup skipped: cleanup secret is not configured.");
    return { skipped: true, ok: true, reason: "secret_missing" };
  }

  const configuredLimit = Number(values.get("FANMIND_DEMO_CLEANUP_LIMIT"));
  const limit = Number.isInteger(configuredLimit) && configuredLimit > 0
    ? Math.min(configuredLimit, 100)
    : DEFAULT_LIMIT;

  let response;
  try {
    response = await fetchImpl(cleanupUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ limit }),
      signal: AbortSignal.timeout(20000),
    });
  } catch (error) {
    throw new Error(
      `FanMind demo cleanup request failed: ${error instanceof Error ? error.message : "unknown error"}`,
    );
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const code = payload && typeof payload.code === "string" ? payload.code : "unknown";
    throw new Error(`FanMind demo cleanup failed (${response.status}, ${code}).`);
  }

  const claimed = Number(payload?.claimed ?? 0);
  const deleted = Number(payload?.deleted ?? 0);
  const failed = Number(payload?.failed ?? 0);
  log(`FanMind demo cleanup: claimed=${claimed} deleted=${deleted} failed=${failed}`);

  if (failed > 0 || payload?.ok === false) {
    throw new Error(`FanMind demo cleanup completed with ${failed} failed item(s).`);
  }

  return { skipped: false, ok: true, claimed, deleted, failed };
}

async function main() {
  await runDemoCleanup();
}

const invokedPath = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : null;
if (invokedPath === import.meta.url) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
