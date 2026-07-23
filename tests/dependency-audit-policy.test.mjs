import assert from "node:assert/strict";
import test from "node:test";

import {
  ROOT_REVIEWED_AT,
  ROOT_REVIEWED_FRAMEWORK_VERSION,
  ROOT_REVIEW_EXCEPTION_EXPIRES_AT,
  ROOT_REVIEW_HIGH_MAXIMUM,
  ROOT_REVIEW_MODERATE_MAXIMUM,
  ROOT_REVIEW_SOURCE_RUN,
  evaluateDependencyAudit,
} from "../scripts/security/verify-dependency-audit.mjs";
import { validateCycloneDx } from "../scripts/security/generate-sbom.mjs";

const patchedManifest = {
  dependencies: { next: "16.2.11" },
  devDependencies: { "eslint-config-next": "16.2.11" },
};

function auditPayload({
  critical = 0,
  high = 0,
  moderate = 0,
  low = 0,
  packages = [],
} = {}) {
  return {
    metadata: {
      vulnerabilities: {
        critical,
        high,
        moderate,
        low,
        info: 0,
        total: critical + high + moderate + low,
      },
    },
    vulnerabilities: Object.fromEntries(
      packages.map((name) => [name, { severity: "reviewed" }]),
    ),
  };
}

test("reviewed root advisories pass only inside the bounded review window", () => {
  const beforeExpiry = evaluateDependencyAudit({
    rootPayload: auditPayload({
      high: 3,
      packages: ["next", "postcss", "sharp"],
    }),
    mobilePayload: auditPayload({ moderate: 10, packages: ["mobile-transitive"] }),
    rootManifest: patchedManifest,
    now: new Date("2026-07-23T17:00:00Z"),
  });

  assert.equal(beforeExpiry.ok, true);
  assert.equal(beforeExpiry.root.reviewedExceptionCurrent, true);
  assert.equal(beforeExpiry.root.highMaximum, ROOT_REVIEW_HIGH_MAXIMUM);
  assert.equal(beforeExpiry.root.moderateMaximum, ROOT_REVIEW_MODERATE_MAXIMUM);
  assert.equal(
    beforeExpiry.root.reviewedExceptionExpiresAt,
    ROOT_REVIEW_EXCEPTION_EXPIRES_AT,
  );
  assert.equal(beforeExpiry.root.reviewedAt, ROOT_REVIEWED_AT);
  assert.equal(beforeExpiry.root.reviewSourceRun, ROOT_REVIEW_SOURCE_RUN);
  assert.equal(
    beforeExpiry.root.reviewedFrameworkVersion,
    ROOT_REVIEWED_FRAMEWORK_VERSION,
  );

  const afterExpiry = evaluateDependencyAudit({
    rootPayload: auditPayload({
      high: 3,
      packages: ["next", "postcss", "sharp"],
    }),
    mobilePayload: auditPayload({ moderate: 10, packages: ["mobile-transitive"] }),
    rootManifest: patchedManifest,
    now: new Date("2026-08-08T00:00:00Z"),
  });

  assert.equal(afterExpiry.ok, false);
  assert.match(afterExpiry.errors.join("\n"), /root_review_exception_expired/u);
});

test("reviewed root budget rejects a fourth high or any moderate finding", () => {
  const highFailure = evaluateDependencyAudit({
    rootPayload: auditPayload({
      high: 4,
      packages: ["next", "postcss", "sharp"],
    }),
    mobilePayload: auditPayload(),
    rootManifest: patchedManifest,
    now: new Date("2026-07-23T17:00:00Z"),
  });
  assert.equal(highFailure.ok, false);
  assert.match(
    highFailure.errors.join("\n"),
    /root_high_vulnerability_budget_exceeded/u,
  );

  const moderateFailure = evaluateDependencyAudit({
    rootPayload: auditPayload({
      high: 2,
      moderate: 1,
      packages: ["next", "postcss", "sharp"],
    }),
    mobilePayload: auditPayload(),
    rootManifest: patchedManifest,
    now: new Date("2026-07-23T17:00:00Z"),
  });
  assert.equal(moderateFailure.ok, false);
  assert.match(
    moderateFailure.errors.join("\n"),
    /root_moderate_vulnerability_budget_exceeded/u,
  );
});

test("a fully clean audit passes after the review window", () => {
  const result = evaluateDependencyAudit({
    rootPayload: auditPayload(),
    mobilePayload: auditPayload({ moderate: 3, packages: ["mobile-transitive"] }),
    rootManifest: patchedManifest,
    now: new Date("2026-09-01T00:00:00Z"),
  });

  assert.equal(result.ok, true);
  assert.equal(result.root.reviewedExceptionNeeded, false);
});

test("unreviewed root packages and high or critical Mobile findings fail closed", () => {
  const rootFailure = evaluateDependencyAudit({
    rootPayload: auditPayload({ high: 1, packages: ["unreviewed-package"] }),
    mobilePayload: auditPayload(),
    rootManifest: patchedManifest,
    now: new Date("2026-07-23T17:00:00Z"),
  });
  assert.equal(rootFailure.ok, false);
  assert.match(
    rootFailure.errors.join("\n"),
    /root_unreviewed_vulnerability_package_present/u,
  );

  const mobileFailure = evaluateDependencyAudit({
    rootPayload: auditPayload(),
    mobilePayload: auditPayload({ high: 1, packages: ["mobile-high"] }),
    rootManifest: patchedManifest,
    now: new Date("2026-07-23T17:00:00Z"),
  });
  assert.equal(mobileFailure.ok, false);
  assert.match(
    mobileFailure.errors.join("\n"),
    /mobile_high_vulnerability_present/u,
  );
});

test("framework and eslint configuration must stay on the reviewed patch", () => {
  const result = evaluateDependencyAudit({
    rootPayload: auditPayload(),
    mobilePayload: auditPayload(),
    rootManifest: {
      dependencies: { next: "16.2.7" },
      devDependencies: { "eslint-config-next": "16.2.7" },
    },
    now: new Date("2026-07-23T17:00:00Z"),
  });

  assert.equal(result.ok, false);
  assert.match(
    result.errors.join("\n"),
    /root_framework_security_patch_missing/u,
  );
});

test("CycloneDX validation accepts only structured component inventories", () => {
  assert.deepEqual(
    validateCycloneDx({
      bomFormat: "CycloneDX",
      specVersion: "1.6",
      components: [{ name: "fanmind" }],
    }),
    {
      format: "CycloneDX",
      specVersion: "1.6",
      componentCount: 1,
    },
  );

  assert.throws(
    () =>
      validateCycloneDx({
        bomFormat: "SPDX",
        specVersion: "1.6",
        components: [],
      }),
    /cyclonedx_sbom_invalid/u,
  );
});
