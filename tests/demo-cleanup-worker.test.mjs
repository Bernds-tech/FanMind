import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  parseEnvText,
  runDemoCleanup,
} from "../scripts/operations/run-demo-cleanup.mjs";

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

test("runDemoCleanup fails when the endpoint reports failed items", async () => {
  const directory = await mkdtemp(join(tmpdir(), "fanmind-demo-cleanup-"));
  const envFile = join(directory, ".env.production");
  await writeFile(
    envFile,
    `FANMIND_DEMO_CLEANUP_SECRET=${"b".repeat(64)}\n`,
    "utf8",
  );

  try {
    await assert.rejects(
      runDemoCleanup({
        envFile,
        fetchImpl: async () => ({
          ok: true,
          status: 200,
          json: async () => ({ ok: false, claimed: 1, deleted: 0, failed: 1 }),
        }),
        log: () => undefined,
      }),
      /completed with 1 failed item/u,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
