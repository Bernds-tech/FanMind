import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const telemetryPath = new URL("../src/lib/serverErrorTelemetry.ts", import.meta.url);
const telemetrySource = await readFile(telemetryPath, "utf8");
const instrumentation = await readFile(new URL("../src/instrumentation.ts", import.meta.url), "utf8");
const migration = await readFile(new URL("../supabase/migrations/20260718203000_privacy_server_error_tracking.sql", import.meta.url), "utf8");
const errorBoundary = await readFile(new URL("../src/app/error.tsx", import.meta.url), "utf8");
const globalErrorBoundary = await readFile(new URL("../src/app/global-error.tsx", import.meta.url), "utf8");

const transpiled = ts.transpileModule(telemetrySource, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const temp = await mkdtemp(join(tmpdir(), "fanmind-server-error-telemetry-"));
const modulePath = join(temp, "serverErrorTelemetry.mjs");
await writeFile(modulePath, transpiled);
const telemetry = await import(`${pathToFileURL(modulePath).href}?v=${Date.now()}`);

test("server error tracking is disabled unless explicitly enabled", () => {
  assert.equal(telemetry.serverErrorTrackingEnabled({}), false);
  assert.equal(telemetry.serverErrorTrackingEnabled({ FANMIND_SERVER_ERROR_TRACKING_ENABLED: "false" }), false);
  assert.equal(telemetry.serverErrorTrackingEnabled({ FANMIND_SERVER_ERROR_TRACKING_ENABLED: "true" }), true);
});

test("fingerprints never depend on error messages, stacks, headers or query values", () => {
  const context = { routePath: "/api/fans/[id]", routeType: "route", routerKind: "App Router" };
  const request = { path: "/api/fans/secret-id?access=private", method: "POST", headers: { cookie: "private" } };
  const first = new Error("first private value");
  first.stack = "private stack one";
  const second = new Error("second unrelated private value");
  second.stack = "private stack two";
  const firstRecord = telemetry.buildServerErrorRecord(first, request, context, { NODE_ENV: "production" });
  const secondRecord = telemetry.buildServerErrorRecord(second, request, context, { NODE_ENV: "production" });
  assert.equal(firstRecord.fingerprint, secondRecord.fingerprint);
  assert.equal(firstRecord.routePath, "/api/fans/[id]");
  assert.deepEqual(Object.keys(firstRecord).sort(), [
    "digest",
    "environment",
    "fingerprint",
    "httpMethod",
    "releaseCommit",
    "routePath",
    "routeType",
    "routerKind",
  ]);
  const serialized = JSON.stringify(firstRecord);
  assert.doesNotMatch(serialized, /first private|private stack|cookie|access=|secret-id/);
});

test("safe digest can identify a processed server error without storing its message", () => {
  const first = Object.assign(new Error("private one"), { digest: "digest_ABC123" });
  const second = Object.assign(new Error("private two"), { digest: "digest_ABC123" });
  const context = { routePath: "/dashboard", routeType: "render", routerKind: "App Router" };
  const request = { path: "/dashboard?private=yes", method: "GET" };
  const one = telemetry.buildServerErrorRecord(first, request, context, {
    NODE_ENV: "production",
    FANMIND_RELEASE_COMMIT: "a".repeat(40),
  });
  const two = telemetry.buildServerErrorRecord(second, request, context, { NODE_ENV: "production" });
  assert.equal(one.fingerprint, two.fingerprint);
  assert.equal(one.digest, "digest_ABC123");
  assert.equal(one.releaseCommit, "a".repeat(40));
});

test("missing route templates never persist the raw request path", () => {
  assert.equal(
    telemetry.normalizeRoutePath(undefined, "/reset-password?email=private@example.com#secret"),
    "/unknown",
  );
  assert.equal(
    telemetry.normalizeRoutePath("", "/fans/private-contact-id"),
    "/unknown",
  );
  assert.equal(telemetry.normalizeRoutePath("dashboard spaces", undefined), "/dashboard_spaces");
});

test("disabled capture returns before any remote storage call", async () => {
  const originalFetch = global.fetch;
  let called = false;
  global.fetch = async () => { called = true; throw new Error("should_not_run"); };
  try {
    const result = await telemetry.captureServerRequestError(
      new Error("private"),
      { path: "/dashboard", method: "GET" },
      { routePath: "/dashboard", routeType: "render", routerKind: "App Router" },
      {},
    );
    assert.equal(result.captured, false);
    assert.equal(called, false);
  } finally {
    global.fetch = originalFetch;
  }
});

test("Next instrumentation is Node-only, opt-in and projects safe request fields", () => {
  assert.match(instrumentation, /NEXT_RUNTIME !== "nodejs"/);
  assert.match(instrumentation, /FANMIND_SERVER_ERROR_TRACKING_ENABLED !== "true"/);
  assert.match(instrumentation, /await captureServerRequestError\(/);
  assert.match(instrumentation, /path: request\.path/);
  assert.match(instrumentation, /method: request\.method/);
  assert.doesNotMatch(instrumentation, /headers: request\.headers/);
});

test("schema stores metadata only, denies browser roles and rate-limits notifications", () => {
  assert.match(migration, /create table if not exists public\.server_error_events/);
  assert.match(migration, /create table if not exists public\.server_error_groups/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /revoke all on table public\.server_error_events from public, anon, authenticated/);
  assert.match(migration, /grant execute on function public\.record_server_error_event[\s\S]*to service_role/);
  assert.match(migration, /interval '10 minutes'/);
  assert.match(migration, /p_cooldown_minutes/);
  assert.match(migration, /last_notified_severity/);
  assert.match(migration, /cleanup_server_error_events/);
  assert.doesNotMatch(migration, /error_message|stack_trace|request_headers|request_body|query_string|cookie/i);
});

test("admin error notifications stay generic and exclude route or error contents", () => {
  assert.match(migration, /Neuer Serverfehler erkannt/);
  assert.match(migration, /Serverfehler häufen sich/);
  const notificationBlock = migration.slice(migration.indexOf("v_title :="), migration.indexOf("return query"));
  assert.doesNotMatch(notificationBlock, /p_route_path|p_digest|error_message|stack/i);
});

test("error boundaries do not render technical error content", () => {
  assert.doesNotMatch(errorBoundary, /error\.message|error\.stack|error\.digest/);
  assert.doesNotMatch(globalErrorBoundary, /error\.message|error\.stack|error\.digest/);
  assert.match(errorBoundary, /Erneut versuchen/);
  assert.match(globalErrorBoundary, /Ansicht neu laden/);
});

test("telemetry source never serializes error message, stack, headers or request path", () => {
  const bodyBlock = telemetrySource.slice(telemetrySource.indexOf("body: JSON.stringify({"), telemetrySource.indexOf("cache: \"no-store\""));
  assert.doesNotMatch(bodyBlock, /error\.message|error\.stack|request\.headers|request\.path/);
  assert.match(bodyBlock, /p_route_path: record\.routePath/);
  assert.match(telemetrySource, /fingerprint\.slice\(0, 12\)/);
});
