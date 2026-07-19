import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const protectionPath = "src/lib/demoProtection.ts";
const runbookPath = "docs/operations/public-demo-protection-runbook.md";
const envExamplePath = ".env.example";

async function read(path) {
  return readFile(path, "utf8");
}

test("public demo restart limits preserve short-term and capacity protection", async () => {
  const protection = await read(protectionPath);

  assert.match(
    protection,
    /FANMIND_DEMO_MAX_PER_IP_10_MIN",\s*1,\s*20/u,
  );
  assert.match(
    protection,
    /FANMIND_DEMO_MAX_PER_IP_DAY",\s*10,\s*100/u,
  );
  assert.match(
    protection,
    /FANMIND_DEMO_MAX_PER_BROWSER_DAY",\s*5,\s*30/u,
  );
  assert.match(
    protection,
    /FANMIND_DEMO_MAX_ACTIVE",\s*50,\s*2000/u,
  );
});

test("production demo runbook matches the controlled restart policy", async () => {
  const runbook = await read(runbookPath);
  const envExample = await read(envExamplePath);

  assert.match(runbook, /FANMIND_DEMO_MAX_PER_IP_10_MIN=1/u);
  assert.match(runbook, /FANMIND_DEMO_MAX_PER_IP_DAY=10/u);
  assert.match(runbook, /FANMIND_DEMO_MAX_PER_BROWSER_DAY=5/u);
  assert.match(runbook, /FANMIND_DEMO_MAX_ACTIVE=50/u);
  assert.match(runbook, /legitime Neustarts/u);
  assert.match(runbook, /Keine Roh-IP-Adresse wird gespeichert/u);
  assert.match(envExample, /FANMIND_DEMO_MAX_PER_IP_10_MIN=1/u);
  assert.match(envExample, /FANMIND_DEMO_MAX_PER_IP_DAY=10/u);
  assert.match(envExample, /FANMIND_DEMO_MAX_PER_BROWSER_DAY=5/u);
  assert.match(envExample, /FANMIND_DEMO_MAX_ACTIVE=50/u);
});
