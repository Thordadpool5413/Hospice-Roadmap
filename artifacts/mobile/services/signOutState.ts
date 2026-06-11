/**
 * Module-level flag to distinguish user-initiated sign-out from a forced
 * session revocation (e.g. signing in on a second device).
 *
 * Usage:
 *   1. In every sign-out handler, call markExplicitSignOut() BEFORE signOut().
 *   2. In RevocationGuard (_layout.tsx), call consumeExplicitSignOut() when
 *      isSignedIn transitions true → false. If it returns false, the sign-out
 *      was not user-initiated and should trigger the "signed in on another
 *      device" banner.
 *
 * A module-level variable is intentional: it survives React re-renders and
 * avoids prop-drilling or an extra Context, while still being reset on every
 * consume so it cannot leak across unrelated sign-out events.
 */

let _explicitSignOut = false;

/** Call this before any user-initiated signOut() to mark it as intentional. */
export function markExplicitSignOut(): void {
  _explicitSignOut = true;
}

/**
 * Returns whether the pending sign-out was user-initiated, then resets the
 * flag. Call exactly once per isSignedIn false transition.
 */
export function consumeExplicitSignOut(): boolean {
  const v = _explicitSignOut;
  _explicitSignOut = false;
  return v;
}
