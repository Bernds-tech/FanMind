import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  buildExternalEvidenceHandoff,
  formatExternalEvidenceHandoff,
} from "../scripts/legal/external-evidence-handoff.mjs";
import { collectRegisteredControlIds } from "../scripts/legal/hash-external-evidence.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function currentEvidence() {
  return JSON.parse(
    await readFile(
      resolve(root, "docs/legal/external-approval-evidence.json"),
      "utf8",
    ),
  );
}

test("handoff covers every currently required external evidence control", async () => {
  const evidence = await currentEvidence();
  const handoff = buildExternalEvidenceHandoff(evidence);
  const registered = collectRegisteredControlIds(evidence);

  assert.equal(handoff.totalControls, 27);
  assert.equal(handoff.pendingControls, 27);
  assert.deepEqual(
    new Set(handoff.tasks.map(({ id }) => id)),
    registered,
  );
  assert.equal(
    handoff.tasks.filter(({ group }) => group === "provider").length,
    12,
  );
  assert.equal(
    handoff.tasks.filter(({ group }) => group === "legal").length,
    7,
  );
});

test("formatted handoff omits values, evidence references and completed controls", async () => {
  const evidence = await currentEvidence();
  evidence.operator.vatId = {
    status: "confirmed",
    value: "SENSITIVE-VALUE",
    confirmedAt: "2026-07-31",
    evidenceRef: `sha256:${"a".repeat(64)}`,
  };
  evidence.providers[0].dpa = {
    status: "not_applicable",
    documentVersion: "SENSITIVE-VERSION",
    acceptedAt: null,
    evidenceRef: `sha256:${"b".repeat(64)}`,
  };

  const output = formatExternalEvidenceHandoff(
    buildExternalEvidenceHandoff(evidence),
  );

  assert.match(output, /Offen: 25 von 27 Kontrollen/u);
  assert.doesNotMatch(output, /operator\.vatId/u);
  assert.doesNotMatch(output, /provider\.exoscale\.dpa/u);
  assert.doesNotMatch(output, /SENSITIVE|sha256:|evidenceRef|acceptedAt/iu);
  assert.match(output, /Rechts- und Datenschutzberatung \(7\)/u);
  assert.match(output, /Anbieterkonten \(11\)/u);
});

test("invalid completion evidence keeps controls in the external handoff", async () => {
  const evidence = await currentEvidence();
  evidence.operator.vatId = {
    status: "confirmed",
    value: "SENSITIVE-VALUE",
    confirmedAt: null,
    evidenceRef: "sha256:invalid",
  };
  evidence.providers[0].dpa = {
    status: "not_applicable",
    documentVersion: "SENSITIVE-VERSION",
    acceptedAt: null,
    evidenceRef: null,
  };

  const handoff = buildExternalEvidenceHandoff(evidence);
  const output = formatExternalEvidenceHandoff(handoff);

  assert.equal(handoff.pendingControls, 27);
  assert.match(output, /operator\.vatId/u);
  assert.match(output, /provider\.exoscale\.dpa/u);
  assert.doesNotMatch(output, /SENSITIVE|sha256:|evidenceRef|acceptedAt/iu);
});

test("handoff fails closed for unknown, duplicate or malformed providers", async () => {
  const evidence = await currentEvidence();
  evidence.providers[0].id = "unknown-provider";

  assert.throws(
    () => buildExternalEvidenceHandoff(evidence),
    { code: "handoff_provider_missing_exoscale" },
  );

  const duplicate = await currentEvidence();
  duplicate.providers[1].id = "exoscale";
  assert.throws(
    () => buildExternalEvidenceHandoff(duplicate),
    { code: "handoff_providers_invalid" },
  );
});
