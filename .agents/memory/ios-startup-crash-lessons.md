---
name: iOS startup crash lessons
description: Patterns that crash iOS TestFlight apps at launch and how to fix them.
---

## Alert.alert() at module scope crashes iOS

Calling `Alert.alert()` outside any component (e.g. in a top-level `try/catch`
wrapping `initializeRevenueCat()`) crashes iOS before the React Native bridge
initialises. The bridge must exist before any native UI API is called.

**Fix:** Replace with `console.warn()`.

**Why:** On iOS, native module calls made before the JS bridge is ready throw a
hard EXC_BAD_ACCESS / NSException that is not catchable by ErrorBoundary.

## ClerkProvider must be wrapped by ErrorBoundary

If `ErrorBoundary` is inside `ClerkLoaded`, ClerkProvider crashes (invalid
publishableKey, token refresh failure) are uncaught and crash the app.

**Fix:** Place `ErrorBoundary` *outside* `ClerkProvider` in the tree.

## publishableKey null-guard is mandatory for TestFlight preview builds

`EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` is often stored as an EAS secret scoped to
the "production" environment. Preview profile builds (no `"environment"` field
in `eas.json`) cannot access production-scoped secrets → key is empty string →
`ClerkProvider` throws synchronously.

**Fix:** Guard in `_layout.tsx`: if `!publishableKey`, render a safe error view.
Also tell user to create the secret as project-wide (not environment-specific):
`eas secret:create --scope project --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --value <key>`

## Expo SDK version mismatch crashes native modules at runtime

Installing packages for a future SDK major (e.g. `expo-local-authentication@56`
in an SDK 54 project) can cause runtime crashes even when the EAS build
succeeds, because the native module ABI may differ between SDK versions.

**Fix:** Run `pnpm exec expo install <package>` which auto-selects the correct
version for the installed SDK. Or manually set versions per `expo-doctor` output.

**How to detect:** Metro logs show "expected version: ~X.Y.Z" warnings.

## return null from root component leaves a blank screen

Returning `null` (not a `<View>`) from the root layout during font loading
causes a brief blank flash before the splash screen hides on fast devices.

**Fix:** Return `<View style={{ flex: 1, backgroundColor: '<app-bg>' }} />`.

## ClerkLoading must be a sibling of ClerkLoaded

Without `<ClerkLoading>` the tree under `<ClerkLoaded>` is absent while Clerk
bootstraps, producing a blank screen for ~200–500ms on every cold start.

**Fix:** Add `<ClerkLoading><View style={{ flex: 1, backgroundColor: '<app-bg>' }} /></ClerkLoading>` as a sibling inside `ClerkProvider`.
