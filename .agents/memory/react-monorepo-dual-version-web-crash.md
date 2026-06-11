---
name: React dual-version web crash in Expo pnpm monorepo
description: Why root package.json must not pin app runtime deps (react/react-dom/react-native-web) to a different major than the apps, in an Expo + web pnpm monorepo.
---

# React 18/19 dual-version crash on web (Expo + pnpm monorepo)

Symptom: web build crashes at runtime with
`Objects are not valid as a React child (found: object with keys {$$typeof,...})`.
iOS/native is unaffected.

Root cause: the ROOT `package.json` pinned `react`/`react-dom`/`react-native-web`
to a DIFFERENT React major (18.x + react-native-web 0.19) than the apps
(React 19.1.0 + react-native-web 0.21). On web, Metro resolves
`react-dom`/`react-native-web` from the **root** `node_modules`, so it pulled the
React-18 copies while components were created with React 19. React 19 elements
carry the symbol `react.transitional.element`; React 18's renderer only
recognizes `react.element`, so the foreign element object falls through and React
tries to render it as a plain object → the "$$typeof" child error.

**Why:** two independent version declarations across workspace packages WILL
drift; on web, Metro's resolution from the root made the drift fatal.

**How to apply:**
- Manage `react`, `react-dom`, AND `react-native-web` through the
  `pnpm-workspace.yaml` `catalog:` so root and every app dedupe to one copy.
  (react/react-dom were already cataloged; the incident was react-native-web,
  which was declared as a loose `^` range independently in root and mobile.)
- Treat any app runtime dep appearing in the root `package.json` with suspicion —
  the root here has vestigial expo/react decls from old root-level scaffolding;
  align them with the apps rather than letting them float.

## Related landmine: SDK-mismatched expo packages at root trip Metro's watcher
`expo-dev-client@56` (Expo SDK 56) was pinned in the ROOT of an SDK **54**
project and unused by the mobile app. Its `expo-dev-launcher` package creates a
transient `_tmp_NNNN` dir during `pnpm install`; Metro's file watcher races it
and dies with `ENOENT: watch '.../expo-dev-launcher_tmp_NNNN/android/src'` on
install-triggered reboots. Fix was to remove it from root entirely. If an EAS
**development** build is ever needed, install the SDK-matched `expo-dev-client`
inside `artifacts/mobile` (not root) via `npx expo install expo-dev-client`.

Note: pnpm does not always garbage-collect orphaned dirs from
`node_modules/.pnpm` after such a change; they linger locally but are absent from
the lockfile, so a fresh `pnpm install` produces a clean tree.
