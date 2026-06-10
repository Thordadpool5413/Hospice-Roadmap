---
name: EAS Build pnpm workspace detection
description: Why EAS Build runs npm ci instead of pnpm install, and the fix for this monorepo.
---

## The Rule
A committed `package-lock.json` at the monorepo root causes the EAS Build worker's INSTALL_DEPENDENCIES phase to detect "npm workspace" and run `npm ci --include=dev` instead of `pnpm install --frozen-lockfile`. This fails because the workspace:* references aren't resolvable by npm.

## Why
The EAS Build worker's `installDependencies.js` scans the workspace root for lock files. When it finds BOTH `pnpm-lock.yaml` AND `package-lock.json`, it prioritizes `package-lock.json` and uses npm. The `enforce-pnpm.cjs` preinstall script (in root package.json) tries to delete `package-lock.json` at install time — but EAS detects the package manager BEFORE running any install scripts, so the deletion never happens in time.

## How to Apply
- **Symptom**: EAS build log shows "We detected that 'artifacts/mobile' is a npm workspace" then "Running 'npm ci --include=dev'" then `npm error Exit handler never called!` in INSTALL_DEPENDENCIES phase.
- **Fix**: `artifacts/mobile/.easignore` contains `package-lock.json` and `yarn.lock`. This tells EAS CLI to exclude those files from the build archive, so only `pnpm-lock.yaml` is visible to the EAS worker.
- **DO NOT** commit `package-lock.json` to the repo root. It must remain gitignored or removed from git tracking entirely.
- The EAS build worker version, macOS image, and pnpm version (10.x vs 11.x) are NOT the cause — only the presence of `package-lock.json` in the archive matters.
- The `.easignore` file must be in `artifacts/mobile/` (alongside `eas.json`).
- The working testflight builds did NOT have `package-lock.json` committed; it was added later and broke all subsequent production builds.
