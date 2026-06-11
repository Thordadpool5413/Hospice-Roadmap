/**
 * Device session registration.
 *
 * On every sign-in (or when the sessionId changes), the app calls
 * registerDevice() to upsert this device's active Clerk session on the server.
 * The server then revokes all OTHER sessions for the same userId via the Clerk
 * Backend API, enforcing one active device per account.
 *
 * Pattern mirrors pushRegistration.ts: uses getAuthToken() (set by
 * AuthTokenBridge) and apiBase() so it works in both dev and production without
 * hard-coded URLs.
 */

import { getAuthToken } from "@workspace/api-client-react";
import { apiBase, makeRequestTimeoutSignal, mergeJsonHeaders } from "./apiClient";
import { getClientId } from "./clientIdentity";

/**
 * Register this device's active session with the API server.
 *
 * Sends the stable deviceId (from clientIdentity.ts). The server derives the
 * current Clerk sessionId from the Bearer JWT — the client never sends it
 * directly.
 *
 * Returns the number of other device sessions that were revoked (0 if this is
 * the only active device, 1 if a previous device was signed out).
 * Throws on network error or a non-OK server response.
 */
export async function registerDevice(): Promise<{ revokedCount: number }> {
  const [deviceId, token] = await Promise.all([getClientId(), getAuthToken()]);

  const res = await fetch(`${apiBase()}/auth/register-device`, {
    method: "POST",
    headers: mergeJsonHeaders(token ? { Authorization: `Bearer ${token}` } : undefined),
    body: JSON.stringify({ deviceId }),
    signal: makeRequestTimeoutSignal(15_000),
  });

  if (!res.ok) {
    throw new Error(`register-device failed: ${res.status}`);
  }

  const data = (await res.json()) as { ok: boolean; revokedCount: number };
  return { revokedCount: data.revokedCount };
}
