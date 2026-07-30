#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const evidencePath = resolve(
  root,
  "docs/legal/external-approval-evidence.json",
);
const requireComplete = process.argv.includes("--require-complete");
const allowedStatuses = new Set(["pending", "confirmed", "not_applicable"]);
const requiredProviderIds = [
  "exoscale",
  "supabase",
  "openai",
  "stripe",
  "meta",
  "resend",
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function validateControl(control, id, { allowValueWhenPending = false } = {}) {
  assert(control && typeof control === "object", `${id}: missing control`);
  assert(
    allowedStatuses.has(control.status),
    `${id}: invalid status ${String(control.status)}`,
  );

  if (control.status !== "pending") {
    assert(
      typeof control.evidenceRef === "string"
        && /^sha256:[a-f0-9]{64}$/u.test(control.evidenceRef),
      `${id}: completed controls require a sha256 evidence reference`,
    );
  }

  if (control.status === "confirmed") {
    if ("confirmedAt" in control) {
      assert(
        /^\d{4}-\d{2}-\d{2}$/u.test(String(control.confirmedAt)),
        `${id}: confirmedAt must be YYYY-MM-DD`,
      );
    }
    if ("approvedAt" in control) {
      assert(
        /^\d{4}-\d{2}-\d{2}$/u.test(String(control.approvedAt)),
        `${id}: approvedAt must be YYYY-MM-DD`,
      );
    }
    if ("acceptedAt" in control) {
      assert(
        /^\d{4}-\d{2}-\d{2}$/u.test(String(control.acceptedAt)),
        `${id}: acceptedAt must be YYYY-MM-DD`,
      );
    }
    if ("value" in control) {
      assert(
        typeof control.value === "string" && control.value.trim().length > 0,
        `${id}: confirmed value is missing`,
      );
    }
  }

  if (
    control.status === "pending"
    && "value" in control
    && !allowValueWhenPending
  ) {
    assert(control.value === null, `${id}: pending value must stay null`);
  }

  return control.status !== "pending";
}

const raw = await readFile(evidencePath, "utf8");
const evidence = JSON.parse(raw);

assert(evidence.schemaVersion === 1, "unsupported evidence schema version");
assert(
  /^\d{4}-\d{2}-\d{2}$/u.test(String(evidence.asOf)),
  "asOf must be YYYY-MM-DD",
);
assert(
  evidence.operator?.legalName === "Bernd Guggenberger",
  "canonical operator name changed",
);
assert(
  evidence.operator?.legalForm === "Einzelunternehmen",
  "canonical legal form changed",
);
assert(
  evidence.operator?.businessName === "FanMind",
  "canonical business name changed",
);

const controls = [];
for (const key of [
  "vatId",
  "companyRegisterNumber",
  "companyRegisterCourt",
  "gisaNumber",
]) {
  controls.push({
    id: `operator.${key}`,
    complete: validateControl(evidence.operator[key], `operator.${key}`),
  });
}
controls.push({
  id: "operator.taxMode",
  complete: validateControl(evidence.operator.taxMode, "operator.taxMode", {
    allowValueWhenPending: true,
  }),
});

for (const key of [
  "legalReview",
  "taxReview",
  "retentionDecision",
  "customerDpa",
]) {
  controls.push({
    id: `approvals.${key}`,
    complete: validateControl(
      evidence.approvals?.[key],
      `approvals.${key}`,
    ),
  });
}

assert(Array.isArray(evidence.providers), "providers must be an array");
assert(
  evidence.providers.length === requiredProviderIds.length,
  "provider register must contain exactly the required providers",
);

for (const providerId of requiredProviderIds) {
  const provider = evidence.providers.find(({ id }) => id === providerId);
  assert(provider, `provider.${providerId}: missing`);
  assert(
    ["production", "prepared", "conditional", "inactive"].includes(
      provider.serviceStatus,
    ),
    `provider.${providerId}: invalid service status`,
  );

  if (provider.serviceStatus === "inactive") continue;

  for (const key of ["dpa", "dataLocation", "transferAssessment"]) {
    controls.push({
      id: `provider.${providerId}.${key}`,
      complete: validateControl(
        provider[key],
        `provider.${providerId}.${key}`,
      ),
    });
  }
}

const incomplete = controls.filter(({ complete }) => !complete);
const completeCount = controls.length - incomplete.length;

console.log("LEGAL_EXTERNAL_EVIDENCE_SCHEMA=valid");
console.log(`LEGAL_EXTERNAL_EVIDENCE_AS_OF=${evidence.asOf}`);
console.log(`LEGAL_EXTERNAL_EVIDENCE_CONTROLS=${controls.length}`);
console.log(`LEGAL_EXTERNAL_EVIDENCE_COMPLETE=${completeCount}`);
console.log(`LEGAL_EXTERNAL_EVIDENCE_PENDING=${incomplete.length}`);
console.log(
  `LEGAL_EXTERNAL_EVIDENCE_READY=${incomplete.length === 0 ? "true" : "false"}`,
);

if (requireComplete && incomplete.length > 0) {
  console.error(
    `LEGAL_EXTERNAL_EVIDENCE_BLOCKERS=${incomplete
      .map(({ id }) => id)
      .join(",")}`,
  );
  process.exitCode = 1;
}
