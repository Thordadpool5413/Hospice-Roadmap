---
name: Replit workflow pnpm version and expo config-plugins import
description: Two distinct issues that crash all Replit workflows and the Expo dev server on startup.
---

## Rule 1 — packageManager field must match actual installed pnpm

Replit's workflow runner reads the `packageManager` field in root `package.json` and tries to install that exact pnpm version before executing any workflow command. If the declared version doesn't match the one in the Nix store, the runner runs `pnpm add pnpm@<version>` which crashes with SIGABRT and kills all workflows.

**Why:** The Nix store pins pnpm at a specific version (e.g. `10.26.1`). Self-upgrading pnpm via `pnpm add pnpm@X` crashes in this sandboxed environment.

**How to apply:** When all workflows fail with `pnpm add pnpm@X.Y.Z ... SIGABRT`, find the actual pnpm binary: `ls /nix/store/*/bin/pnpm` and update `package.json` `packageManager` field to match (e.g. `"pnpm@10.26.1"`).

## Rule 2 — expo/config-plugins.js must use namespace import

In `app.config.ts`, `expo/config-plugins.js` only has named exports — no default export. Using `import configPlugins from "expo/config-plugins.js"` gives `undefined`, causing `Cannot destructure property 'AndroidConfig' of ... as it is undefined` at Expo config read time.

**Why:** The CJS interop for this module does not produce a synthetic default that bundles all exports.

**How to apply:** Always use `import * as configPlugins from "expo/config-plugins.js"` (namespace import), then destructure named exports normally.
