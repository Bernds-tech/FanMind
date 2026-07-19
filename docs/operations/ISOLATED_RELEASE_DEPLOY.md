# FanMind Isolated Release Deployment

## Purpose

The existing Production workflow builds inside `/var/www/fanmind`, which is also the current PM2 working directory. During `npm ci` and `next build`, the live process can therefore observe changing files in its own application directory.

The isolated release path builds a complete release in a separate directory while the previous release continues serving traffic. PM2 switches only after the new build, product-truth verification, lint and operations tests have succeeded.

## Status

The isolated path is **active on Production since 2026-07-19**.

Production uses:

```text
FANMIND_ENABLE_ISOLATED_RELEASE_DEPLOY=true
FANMIND_RELEASE_RETENTION_COUNT=4
```

The first controlled activation exposed a permission problem while atomically updating `/var/www/fanmind-current`; PR #586 corrected the privileged symlink update. Deploy FanMind run #407 then completed successfully for commit `c61ee5668e52af1bcbd454028820614d730d2bc8`, including Product Truth, lint, operations tests, build, PM2 switch, public smoke tests and release-link update.

If the isolated-deploy flag is absent or not exactly `true`, the workflow falls back to the legacy in-place path.

## Directories

```text
/var/www/fanmind
  Git checkout and protected .env.production source

/var/www/fanmind-releases/<full-commit-sha>
  Immutable built application release

/var/www/fanmind-current
  Symlink to the last successful isolated release
```

The release directory receives the exact Git tree for the expected `origin/main` commit. `.env.production` is linked from the protected source checkout and is never copied into Git or logs.

## Deployment sequence

1. Fetch `origin/main` without modifying the live source checkout.
2. Resolve and validate the full 40-character commit.
3. Export the target Git tree into a temporary release directory.
4. Link the existing protected `.env.production`.
5. Run:

```bash
npm ci --no-audit --no-fund
npm run verify:truth
npm run lint
npm run test:operations
npm run build
```

6. Validate Next.js build metadata and nginx configuration.
7. Read the current PM2 working directory and current live release commit.
8. Switch PM2 to the built release directory.
9. Test `/login` and the full public smoke suite.
10. On failure, restore the previous PM2 working directory and release commit.
11. After a successful smoke test, synchronize `/var/www/fanmind` to the deployed commit.
12. Update `/var/www/fanmind-current` and retain a limited number of release directories.

## Safety properties

- The old application remains available throughout dependency installation and build.
- The target commit must still equal `origin/main` immediately before building.
- The new PM2 process starts only from a completed release directory.
- Login and public route checks must succeed before the release is accepted.
- Unexpected failures after the PM2 switch trigger rollback through the EXIT trap.
- Release cleanup is restricted to direct children of the configured release root.
- The active and immediately previous PM2 working directories are not removed.
- No database migration, Stripe change, secret change or referral activation is performed.
- The current-release symlink is updated atomically with the privileges required for root-managed `/var/www`.

## Production verification

After a deployment, verify:

```bash
pm2 status
pm2 jlist | node -e '
let b="";process.stdin.on("data",c=>b+=c);process.stdin.on("end",()=>{
 const p=JSON.parse(b).find(x=>x.name==="fanmind");
 console.log(p?.pm2_env?.pm_cwd ?? "unknown");
});'
curl -fsS https://fanmind.ch/api/version
curl -fsS -o /dev/null -w 'LOGIN_HTTP=%{http_code}\n' https://fanmind.ch/login
sudo nginx -t
```

Expected PM2 path:

```text
/var/www/fanmind-releases/<deployed-commit>
```

## Disable or return to legacy deployment

Set:

```text
FANMIND_ENABLE_ISOLATED_RELEASE_DEPLOY=false
```

The next deployment uses the existing in-place path. This does not immediately move a currently running isolated release; the next successful legacy deployment restarts PM2 from `/var/www/fanmind`.

## Manual emergency rollback

The deployment script automatically rolls back if the new release fails health or smoke checks. For manual intervention, identify a known-good retained release and its commit before changing PM2.

Do not guess a path. Confirm the directory contains `package.json` and `.next/required-server-files.json`, then use the documented PM2 start pattern. After rollback, verify `/api/version`, `/login`, nginx and PM2.

## Retention

Production retains four release directories. The active and previous working directories are protected even if this temporarily exceeds the requested count. Retention applies only after a successful release.
