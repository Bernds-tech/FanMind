# Private Android/iOS device acceptance

## Purpose and boundary

This runbook records the external real-device acceptance that repository tests
cannot prove. Run it separately for Android and iOS, against the reviewed
`main` commit and a signed internal `preview` build. It does not queue a build,
submit to a store, change Supabase, enable push delivery, or run as a GitHub
workflow.

Der Validator startet keinen Build und keinen GitHub-Workflow. Android und iOS getrennt zu
dokumentieren und zu prüfen ist verbindlich.

Device records are private operational evidence. Use synthetic Staging users
and content only. Never record e-mail addresses, recovery URLs, tokens, build
IDs, artifact URLs, project IDs, device identifiers, screenshots containing
customer data, or secrets.

## Signed-build handoff

The controlled signed-build workflow emits one redacted, five-day artifact
named `fanmind-mobile-signed-build-receipt-<profile>-<platform>`. Its JSON binds
the successful internal artifact to the exact `main` commit, platform and
profile without retaining the EAS build ID or URL. Download it into a private
directory and keep mode `0600`:

```bash
install -d -m 700 docs/mobile/private-device-evidence
# Nach dem Download:
chmod 600 docs/mobile/private-device-evidence/signed-build-receipt.json
```

The receipt must use `preview`, `internal`, `available`, and disabled Submit and
Update boundaries. A development, simulator, debug or unsigned build is not an
acceptable substitute.

The workflow never copies the signed APK or IPA into GitHub artifact storage.
Open the protected EAS project as an authorized operator, select the exact
successful `preview` build for the receipt-bound `main` commit and platform,
and transfer its internal install artifact directly to the test device. Keep
the downloaded binary private, do not re-upload it, and delete the local copy
after acceptance. This handoff is an internal installable build, not a Play or
App Store release.

## Mandatory real-device checks

Use the signed Android build on one real Android device and the signed iOS build
on one real iPhone. Create one evidence file per platform. All 19 checks are
mandatory:

1. install the signed build;
2. login with a synthetic Staging account;
3. open one valid `fanmind://reset-password` recovery link;
4. reject invalid, expired and already-used recovery links without revealing
   account state;
5. change the password and login again after a full app restart;
6. prove the offline contact fallback on a transport failure and that it stays
   read-only;
7. prove that auth, RLS and server failures never expose the cache;
8. reject expired cache data;
9. logout and prove session, Workspace and registered local cache state are
   purged;
10. visually verify the FanMind app icon and dark wordmark splashscreen;
11. create and cancel an account-deletion request through the authenticated
    Mobile flow.

FanMind must never send a reply automatically. No customer or Production data
may be used, and no secret may be recorded. Open issues make the acceptance
fail closed.

## Evidence schema

Write a flat JSON object using schema version `1`. Timestamps are UTC ISO-8601;
`releaseCommit` is the full 40-character reviewed `main` SHA;
`signedBuildReceiptSha256` is the SHA-256 of the unchanged redacted receipt.
Every mandatory check uses `"passed"`.

```json
{
  "schemaVersion": 1,
  "acceptanceId": "2026-08-07-mobile-android-001",
  "startedAt": "2026-08-07T09:00:00Z",
  "completedAt": "2026-08-07T10:00:00Z",
  "environment": "staging",
  "platform": "android",
  "releaseCommit": "0000000000000000000000000000000000000000",
  "buildProfile": "preview",
  "signedBuildCompletedAt": "2026-08-07T08:00:00Z",
  "signedBuildReceiptSha256": "0000000000000000000000000000000000000000000000000000000000000000",
  "signedBuildInstalled": "passed",
  "login": "passed",
  "recoveryValidLink": "passed",
  "recoveryInvalidLinkRejected": "passed",
  "recoveryExpiredLinkRejected": "passed",
  "recoveryUsedLinkRejected": "passed",
  "passwordChanged": "passed",
  "restartLogin": "passed",
  "offlineTransportFallback": "passed",
  "offlineReadOnly": "passed",
  "offlineAuthFailureClosed": "passed",
  "offlineRlsFailureClosed": "passed",
  "offlineServerFailureClosed": "passed",
  "offlineExpiredCacheRejected": "passed",
  "logoutPurge": "passed",
  "appIconBranding": "passed",
  "splashBranding": "passed",
  "accountDeletionRequest": "passed",
  "accountDeletionCancel": "passed",
  "pushTested": false,
  "pushStagingGateSha256": null,
  "pushPermissionOptIn": "not_tested",
  "pushPermissionDenial": "not_tested",
  "pushRegistration": "not_tested",
  "pushOptOut": "not_tested",
  "automaticSendingObserved": false,
  "customerDataUsed": false,
  "secretsRecorded": false,
  "pushDeliveryObserved": false,
  "issues": []
}
```

## Optional push checks

Push remains optional for this acceptance until the separate Staging gates have
actually passed. Only then may `pushTested` be `true`. Bind the evidence to the
unchanged private Staging-gate JSON with `pushStagingGateSha256` and mark the
four permission opt-in, permission denial, registration and opt-out checks as
`"passed"`.

The Staging-gate record must bind the same commit and prove resource readiness,
migration apply and rollback-only acceptance. Production targets, real push
tokens and delivery must all remain `false`. This validator does not authorize
or test push delivery.

## Verification

Keep the evidence, receipt and optional gate private with mode `0600`, then run:

```bash
npm run mobile:device:acceptance:verify -- \
  --input docs/mobile/private-device-evidence/android.json \
  --signed-build-receipt docs/mobile/private-device-evidence/signed-build-receipt-android.json \
  --expected-main-commit <full-reviewed-main-sha>
```

For an already approved Push Staging gate, append:

```bash
--push-staging-gate docs/mobile/private-device-evidence/push-staging-gate.json
```

The validator outputs only redacted counts and the device-evidence SHA-256. It
never outputs commit, platform, acceptance ID, EAS values or private file
content. A passing record is still not TestFlight, Google Play, store privacy,
legal or Production approval.
