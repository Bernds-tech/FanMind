# FanMind Restore Checkout CA Truststore Reconciliation — 2026-08-22

## Identity

- Task: `FM-RST-001`
- Risk: `R4`
- Status: `RECONCILIATION_REQUIRED`
- Branch: `restore-checkout-ca-truststore-20260822`
- Pull request: `#991`
- Base commit: `1735a5f552c0c20c180fb96be6fa9000cbffc360`
- Active repair lock: `LOCK-FM-RST-001-CHECKOUT-CA-TRUSTSTORE-20260822`

This checkpoint records the bounded repository defect found by the failed protected read-only Resource Readiness run. It does not advance the Restore state, authorize a database write or invalidate the independently established empty-target baseline.

## Live run evidence

GitHub Actions run `32568632008` used exact `main` commit `1735a5f552c0c20c180fb96be6fa9000cbffc360`.

- dispatch validation job `97020817035`: success;
- secret-free host job `97020825268`: success;
- protected Resource Readiness job `97020836458`: failure in checkout;
- intended Host-2 JIT runner: ID `40`, name `fanmind-restore-01`;
- preinstalled host re-attestation: success;
- `actions/checkout`: three failed fetch attempts, exit `128`;
- resource-readiness and PostgreSQL compatibility steps: skipped;
- one-job JIT cleanup: `.credentials` and `.runner` removed, listener exit `0`.

The job therefore did not decrypt the backup, connect to PostgreSQL, reset or restore the isolated target, touch the retained rollback quarantine, write Production or write Supabase Staging.

## Root cause

PR #990 correctly removed the presence-triggered `GIT_SSL_NO_VERIFY` export. The failed job confirmed that the variable was absent and its transport trace did not report skipped server-certificate verification.

The same workflow job environment still exported these CA-path variables with empty values:

- `CURL_CA_BUNDLE`;
- `GIT_SSL_CAINFO`;
- `GIT_SSL_CAPATH`;
- `REQUESTS_CA_BUNDLE`;
- `SSL_CERT_DIR`;
- `SSL_CERT_FILE`.

Git/cURL then failed with `error reading ca cert file  (Error while reading file.)` and `Problem with the SSL CA cert (path? access rights?)`. An independent read-only reproduction with Git 2.43 produced the same failure when `GIT_SSL_CAINFO` and `GIT_SSL_CAPATH` were present but empty; the same request succeeded when bound to Ubuntu's system CA bundle and directory.

## Bounded repair

Every self-hosted job in the three Restore workflows now pins the CA consumers to the fixed Ubuntu system truststore:

- CA bundle: `/etc/ssl/certs/ca-certificates.crt`;
- CA directory: `/etc/ssl/certs`.

Before the preinstalled Restore gate and before any later checkout, each self-hosted job proves:

1. all six CA variables equal the fixed bundle/directory contract;
2. the bundle is non-empty, canonical, a regular file, root-owned, non-symlink, non-writable by the runner and not group/world-writable;
3. the directory is canonical, a directory, root-owned, non-symlink, non-writable by the runner and not group/world-writable;
4. `GIT_SSL_NO_VERIFY` remains entirely unset.

Regression tests require the exact pinned values and one truststore validation block per self-hosted Restore job. The preinstalled gate digest, checkout SHA, JIT topology, target boundaries, write gates and Restore commands remain unchanged.

## Acceptance boundary

Repository verification can prove the workflow and fail-closed policy shape, but cannot by itself prove the next protected runtime checkout. Before any database Restore is considered:

1. this branch must pass exact-head Project Memory, FanMind CI, supply-chain, CodeQL and browser checks;
2. the final diff must remain limited to the CA truststore reconciliation and required memory/baseline records;
3. the PR must merge to `main`;
4. only then may a newly approved, separately prepared two-JIT read-only Resource Readiness run be considered;
5. that future run must pass both resource and target compatibility and its checkout trace must independently prove normal certificate verification without CA-file errors or verification-skip markers.

No workflow dispatch or JIT creation is part of this repository repair. Run `32568632008`, job `97020836458` and JIT runner ID `40` must not be retried or reused.

## Failed approach / do not repeat

- Do not represent path-valued CA environment controls with empty strings.
- Do not remove the CA variables and thereby allow ambient runner values to control checkout.
- Do not weaken or reintroduce `GIT_SSL_NO_VERIFY`.
- Do not treat a successful host gate as proof that the later checkout can load its CA truststore.
- Do not create another Restore server, reset the already empty target, delete the rollback quarantine or dispatch the database Restore while this reconciliation is open.

## Falsification question

What observation would prove this repair insufficient?

Any self-hosted Restore job with an empty, ambient, symlinked, runner-writable or non-root truststore path; any exact-head checkout with a CA-file error or skipped certificate verification; any checkout of a commit other than reviewed `main`; or any host/target/backup/TLS drift before the future read-only run keeps `FM-RST-001` in `RECONCILIATION_REQUIRED` and blocks all Restore writes.
