---
name: Pino + Metro watcher clash
description: pino install creates a transient benchmarks temp dir that Metro's FallbackWatcher tries to watch; it fails with ENOENT when pino cleans it up.
---

When `pino` is installed into the workspace, it creates a `pino_tmp_<n>/benchmarks` directory during install that is immediately deleted. Metro's `FallbackWatcher` discovers the directory while walking `node_modules` and tries to `fs.watch` it, but by then it's gone → `ENOENT: no such file or directory, watch ...pino_tmp_.../benchmarks`.

**Why:** pino uses tmp dirs for install-time benchmarks. Metro watches all of `node_modules` in the workspace. These two behaviors collide exactly once, at install time.

**How to apply:** If the Expo workflow crashes with this ENOENT pattern after any `pnpm add pino` operation, simply restart the workflow. The temp dir is gone by then, Metro starts clean, and it never recurs.
