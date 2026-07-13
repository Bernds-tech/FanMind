#!/usr/bin/env node

const baseUrl = (
  process.env.FANMIND_SMOKE_BASE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://fanmind.ch"
).replace(/\/$/, "");

const expectedCommit = process.env.FANMIND_EXPECTED_RELEASE_COMMIT?.trim() || "";
const routes = [
  "/",
  "/login",
  "/register",
  "/roadmap",
  "/agb",
  "/datenschutz",
  "/impressum",
  "/zahlungsbedingungen",
  "/api/version",
];

const attempts = Number(process.env.FANMIND_SMOKE_ATTEMPTS || 5);
const timeoutMs = Number(process.env.FANMIND_SMOKE_TIMEOUT_MS || 15_000);
const delayMs = Number(process.env.FANMIND_SMOKE_DELAY_MS || 3_000);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchRoute(route) {
  const response = await fetch(`${baseUrl}${route}`, {
    cache: "no-store",
    redirect: "follow",
    signal: AbortSignal.timeout(timeoutMs),
    headers: { "User-Agent": "FanMind-Production-Smoke/1.0" },
  });

  if (response.status < 200 || response.status >= 400) {
    throw new Error(`${route} returned HTTP ${response.status}`);
  }

  if (route === "/api/version") {
    const payload = await response.json().catch(() => null);
    const liveCommit = payload?.releaseCommit;

    if (!liveCommit || liveCommit === "unknown") {
      throw new Error("/api/version returned no deployed release commit");
    }

    if (expectedCommit && liveCommit !== expectedCommit) {
      throw new Error(
        `/api/version returned ${liveCommit}, expected ${expectedCommit}`,
      );
    }
  }

  return response.status;
}

const failures = [];

for (const route of routes) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const status = await fetchRoute(route);
      console.log(`SMOKE_OK ${route} HTTP ${status}`);
      lastError = null;
      break;
    } catch (error) {
      lastError = error;
      console.warn(
        `SMOKE_RETRY ${route} attempt ${attempt}/${attempts}: ${error instanceof Error ? error.message : "unknown error"}`,
      );
      if (attempt < attempts) await sleep(delayMs);
    }
  }

  if (lastError) {
    failures.push(
      `${route}: ${lastError instanceof Error ? lastError.message : "unknown error"}`,
    );
  }
}

if (failures.length) {
  for (const failure of failures) console.error(`SMOKE_ERROR ${failure}`);
  console.error(`Public smoke test failed for ${failures.length} route(s).`);
  process.exit(1);
}

console.log(`Public smoke test passed for ${routes.length} routes on ${baseUrl}.`);
