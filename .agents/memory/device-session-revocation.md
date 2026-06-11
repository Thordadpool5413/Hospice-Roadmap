---
name: Device session revocation pattern
description: How single-device enforcement works — Clerk REST API for revocation, module-level signOut flag, and DB schema pattern.
---

## The rule
To enforce one active device per account, the server upserts a `device_sessions`
row and calls `POST https://api.clerk.com/v1/sessions/{id}/revoke` with a
`Bearer $CLERK_SECRET_KEY` header — NOT via `@clerk/backend` SDK (not in deps).

## Why
`@clerk/backend` is not installed in `artifacts/api-server`; only `@clerk/express`
is. The Clerk REST API is a reliable, dependency-free alternative for session ops.

## How to apply
- `getAuth(req).sessionId` is the calling device's session ID (from JWT, not body).
- Mobile sends only `deviceId`; server derives `sessionId` from the token.
- Sign-out flag: `markExplicitSignOut()` before every `signOut()` call prevents
  `RevocationGuard` from showing the "signed in elsewhere" banner on voluntary sign-out.
- The `consumeExplicitSignOut()` function is one-shot (resets after read) so it
  cannot leak across unrelated transitions.
- DB conflict target: unique index on `(user_id, device_id)` — NOT a composite PK —
  because Drizzle's `onConflictDoUpdate` works with unique indexes in PostgreSQL.
