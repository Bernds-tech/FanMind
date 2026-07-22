import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  normalizeCleanupErrorCodes,
  parseEnvText,
  runDemoCleanup,
} from "../scripts/operations/run-demo-cleanup.mjs";

const cleanupPolicyPath = "src/lib/demoCleanupPolicy.ts";
const supabaseServerPath = "src/lib/supabase/server.ts";
const cleanupRoutePath = "src/app/api/demo/cleanup/route.ts";

test("parseEnvText reads quoted and unquoted values without comments", () => {
  const values = parseEnvText(`
# comment
FANMIND_PUBLIC_DEMO_ENABLED=false
FANMIND_DEMO_CLEANUP_SECRET="quoted-secret"
EMPTY=
`);

  assert.equal(values.get("FANMIND_PUBLIC_DEMO_ENABLED"), "false");
  assert.equal(values.get("FANMIND_DEMO_CLEANUP_SECRET"), "quoted-secret");
  assert.equal(values.get("EMPTY"), "");
});

test("normalizeCleanupErrorCodes accepts only bounded machine-readable codes", () => {
  assert.deepEqual(
    normalizeCleanupErrorCodes([
      "demo_delete_workspace_failed",
      "DEMO_DELETE_WORKSPACE_FAILED",
      "cleanup:retry-1",
      "contains spaces",
      "secret=value",
      123,
      null,
    ]),
    ["demo_delete_workspace_failed", "cleanup:retry-1"],
  );
});

test("temporary demo cleanup deletes the workspace by primary key and preserves identity guards", async () => {
  const [policy, server, route] = await Promise.all([
    readFile(cleanupPolicyPath, "utf8"),
    readFile(supabaseServerPath, "utf8"),
    readFile(cleanupRoutePath, "utf8"),
  ]);

  assert.match(
    policy,
    /table:\s*"workspaces",\s*filterColumn:\s*"id",\s*optional:\s*false,\s*errorCode:\s*"demo_delete_workspace_failed"/su,
  );
  assert.doesNotMatch(
    policy,
    /table:\s*"workspaces",\s*filterColumn:\s*"workspace_id"/su,
  );
  assert.match(server, /DEMO_CLEANUP_DELETE_STEPS/u);
  assert.match(
    server,
    /postgrestDelete\(table, accessToken, \[\s*\[filterColumn, workspaceId\],?\s*\]\)/su,
  );
  assert.match(server, /!isTemporaryDemoUser\(user\)/u);
  assert.match(
    server,
    /workspace\.owner_user_id !== user\.id \|\|\s*workspace\.name !== TEMPORARY_DEMO_WORKSPACE_NAME/su,
  );
  assert.match(
    route,
    /deletion\.errorCode \?\? "demo_delete_failed"/u,
  );
});

test("runDemoCleanup skips safely when cleanup secret is missing", async () => {
  const directory = await mkdtemp(join(tmpdir(), "fanmind-demo-cleanup-"));
  const envFile = join(directory, ".env.production");
  await writeFile(envFile, "FANMIND_PUBLIC_DEMO_ENABLED=false\n", "utf8");

  let fetchCalled = false;
  const logs = [];
  try {
    const result = await runDemoCleanup({
      envFile,
      fetchImpl: async () => {
        fetchCalled = true;
        throw new Error("must not be called");
      },
      log: (message) => logs.push(message),
      errorLog: (message) => logs.push(message),
    });

    assert.equal(result.skipped, true);
    assert.equal(result.ok, true);
    assert.equal(result.reason, "secret_missing");
    assert.equal(fetchCalled, false);
    assert.match(logs.join("\n"), /cleanup secret is not configured/u);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("runDemoCleanup sends a bearer secret and reports counts", async () => {
  const directory = await mkdtemp(join(tmpdir(), "fanmind-demo-cleanup-"));
  const envFile = join(directory, ".env.production");
  const secret = "a".repeat(64);
  await writeFile(
    envFile,
    `FANMIND_DEMO_CLEANUP_SECRET=${secret}\nFANMIND_DEMO_CLEANUP_LIMIT=12\n`,
    "utf8",
  );

  const logs = [];
  try {
    const result = await runDemoCleanup({
      envFile,
      cleanupUrl: "https://fanmind.example/api/demo/cleanup",
      fetchImpl: async (url, init) => {
        assert.equal(url, "https://fanmind.example/api/demo/cleanup");
        assert.equal(init.method, "POST");
        assert.equal(init.headers.Authorization, `Bearer ${secret}`);
        assert.deepEqual(JSON.parse(init.body), { limit: 12 });
        return {
          ok: true,
          status: 200,
          json: async () => ({ ok: true, claimed: 3, deleted: 3, failed: 0 }),
        };
      },
      log: (message) => logs.push(message),
    });

    assert.deepEqual(result, {
      skipped: false,
      ok: true,
      claimed: 3,
      deleted: 3,
      failed: 0,
    });
    assert.match(logs.join("\n"), /claimed=3 deleted=3 failed=0/u);
    assert.doesNotMatch(logs.join("\n"), new RegExp(secret, "u"));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("runDemoCleanup reports only safe endpoint error codes", async () => {
  const directory = await mkdtemp(join(tmpdir(), "fanmind-demo-cleanup-"));
  const envFile = join(directory, ".env.production");
  await writeFile(
    envFile,
    `FANMIND_DEMO_CLEANUP_SECRET=${"b".repeat(64)}\n`,
    "utf8",
  );

  const logs = [];
  try {
    await assert.rejects(
      runDemoCleanup({
        envFile,
        fetchImpl: async () => ({
          ok: true,
          status: 200,
          json: async () => ({
            ok: false,
            claimed: 1,
            deleted: 0,
            failed: 1,
            errorCodes: [
              "demo_delete_workspace_failed",
              "unsafe code secret=value",
            ],
          }),
        }),
        log: (message) => logs.push(message),
      }),
      /completed with 1 failed item\(s\).*demo_delete_workspace_failed/u,
    );

    const output = logs.join("\n");
    assert.match(output, /error_codes=demo_delete_workspace_failed/u);
    assert.doesNotMatch(output, /unsafe|secret=value/u);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
