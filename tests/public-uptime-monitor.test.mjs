import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";

import {
  runPublicUptimeChecks,
  validateHealthPayload,
  validateVersionPayload,
} from "../scripts/monitor-public-uptime.mjs";

const RELEASE_COMMIT = "a".repeat(40);

function startServer(handler) {
  return new Promise((resolvePromise) => {
    const server = createServer(handler);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolvePromise({
        server,
        baseUrl: `http://127.0.0.1:${address.port}`,
      });
    });
  });
}

function closeServer(server) {
  return new Promise((resolvePromise, reject) => {
    server.close((error) => (error ? reject(error) : resolvePromise()));
  });
}

test("health and version payload validators enforce public production truth", () => {
  assert.deepEqual(validateHealthPayload({ status: "healthy", scope: "public" }), {
    status: "healthy",
    scope: "public",
  });
  assert.deepEqual(
    validateVersionPayload({
      application: "fanmind",
      releaseCommit: RELEASE_COMMIT,
      environment: "production",
    }),
    {
      application: "fanmind",
      releaseCommit: RELEASE_COMMIT,
      environment: "production",
    },
  );
  assert.throws(
    () => validateHealthPayload({ status: "degraded", scope: "public" }),
    /health_not_healthy/,
  );
  assert.throws(
    () =>
      validateVersionPayload({
        application: "fanmind",
        releaseCommit: "short",
        environment: "production",
      }),
    /invalid_release_commit/,
  );
});

test("version validation binds an expected release to its runtime environment", () => {
  const stagingPayload = {
    application: "fanmind",
    releaseCommit: RELEASE_COMMIT,
    environment: "production",
    runtimeEnvironment: "staging",
  };

  assert.doesNotThrow(() =>
    validateVersionPayload(stagingPayload, {
      expectedCommit: RELEASE_COMMIT,
      expectedRuntimeEnvironment: "staging",
    }),
  );
  assert.throws(
    () =>
      validateVersionPayload(stagingPayload, {
        expectedCommit: "b".repeat(40),
        expectedRuntimeEnvironment: "staging",
      }),
    /version_release_mismatch/,
  );
  assert.throws(
    () =>
      validateVersionPayload(stagingPayload, {
        expectedCommit: RELEASE_COMMIT,
        expectedRuntimeEnvironment: "production",
      }),
    /version_runtime_environment_mismatch/,
  );
  for (const runtimeEnvironment of ["unknown", undefined]) {
    assert.throws(
      () =>
        validateVersionPayload(
          { ...stagingPayload, runtimeEnvironment },
          {
            expectedCommit: RELEASE_COMMIT,
            expectedRuntimeEnvironment: "staging",
          },
        ),
      /version_runtime_environment_mismatch/,
    );
  }
  assert.throws(
    () =>
      validateVersionPayload(
        { ...stagingPayload, environment: "staging" },
        {
          expectedCommit: RELEASE_COMMIT,
          expectedRuntimeEnvironment: "staging",
        },
      ),
    /version_environment_mismatch/,
  );
  assert.throws(
    () =>
      validateVersionPayload(stagingPayload, {
        expectedRuntimeEnvironment: "preview",
      }),
    /invalid_expected_runtime_environment/,
  );
});

test("monitor passes healthy public routes and records the release commit", async () => {
  const { server, baseUrl } = await startServer((request, response) => {
    if (request.url === "/api/health") {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ status: "healthy", scope: "public" }));
      return;
    }
    if (request.url === "/api/version") {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(
        JSON.stringify({
          application: "fanmind",
          releaseCommit: RELEASE_COMMIT,
          environment: "production",
        }),
      );
      return;
    }
    response.writeHead(200, { "Content-Type": "text/html" });
    response.end("ok");
  });

  try {
    const report = await runPublicUptimeChecks({
      baseUrl,
      timeoutMs: 2000,
      attempts: 1,
      retryDelayMs: 1,
    });
    assert.equal(report.ok, true);
    assert.equal(report.failed, 0);
    assert.equal(report.passed, report.total);
    assert.equal(report.releaseCommit, RELEASE_COMMIT);
    assert.equal(report.results.every((result) => result.ok), true);
  } finally {
    await closeServer(server);
  }
});

test("monitor reports a route failure without hiding successful checks", async () => {
  const { server, baseUrl } = await startServer((request, response) => {
    if (request.url === "/register") {
      response.writeHead(503);
      response.end("unavailable");
      return;
    }
    if (request.url === "/api/health") {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ status: "healthy", scope: "public" }));
      return;
    }
    if (request.url === "/api/version") {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(
        JSON.stringify({
          application: "fanmind",
          releaseCommit: RELEASE_COMMIT,
          environment: "production",
        }),
      );
      return;
    }
    response.writeHead(200);
    response.end("ok");
  });

  try {
    const report = await runPublicUptimeChecks({
      baseUrl,
      timeoutMs: 2000,
      attempts: 1,
      retryDelayMs: 1,
    });
    assert.equal(report.ok, false);
    assert.equal(report.failed, 1);
    const failed = report.results.find((result) => !result.ok);
    assert.equal(failed.name, "register");
    assert.equal(failed.error, "unexpected_http_status");
    assert.equal(report.results.filter((result) => result.ok).length, report.total - 1);
  } finally {
    await closeServer(server);
  }
});

test("monitor rejects non-HTTPS remote base URLs", async () => {
  await assert.rejects(
    () => runPublicUptimeChecks({ baseUrl: "http://fanmind.invalid", checks: [] }),
    /base_url_must_use_https/,
  );
});
