/**
 * Shared API client utilities — single source of truth for:
 *   - base URL resolution
 *   - request timeout signals
 *   - default JSON headers
 *   - JSON response parsing
 *   - top-level fetchJson helper
 *
 * All mobile services should import from here rather than duplicating
 * these patterns.
 */

import Constants from "expo-constants";
import { Platform } from "react-native";

// ─── Base URL ────────────────────────────────────────────────────────────────

function getExpoExtraConfig(): { apiUrl?: string; domain?: string } {
  const constants = Constants as unknown as {
    expoConfig?: {
      extra?: {
        apiUrl?: string | null;
        domain?: string | null;
      } | null;
    } | null;
    manifest?: {
      extra?: {
        apiUrl?: string | null;
        domain?: string | null;
      } | null;
    } | null;
    manifest2?: {
      extra?: {
        expoClient?: {
          hostUri?: string | null;
        } | null;
        apiUrl?: string | null;
        domain?: string | null;
      } | null;
    } | null;
  };

  return {
    apiUrl:
      constants.expoConfig?.extra?.apiUrl ??
      constants.manifest?.extra?.apiUrl ??
      constants.manifest2?.extra?.apiUrl ??
      undefined,
    domain:
      constants.expoConfig?.extra?.domain ??
      constants.manifest?.extra?.domain ??
      constants.manifest2?.extra?.domain ??
      undefined,
  };
}

function normalizeApiUrl(value?: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\/+$/, "");
}

/**
 * Resolve the API base URL for the current environment.
 *
 * Priority:
 *  1. EXPO_PUBLIC_API_URL — set by the Expo workflow in Replit dev and by
 *     EAS builds. This is the primary signal.
 *  2. Expo config extra.apiUrl — runtime-safe fallback for Expo Go when the
 *     EXPO_PUBLIC value was not baked into the JS bundle.
 *  3. Expo config extra.domain — build the API URL from the known Replit host.
 *  4. window.location — web fallback for Replit iframe preview when the env
 *     var is unavailable.
 *  5. localhost fallback for local non-Expo dev.
 */
export function apiBase(): string {
  const envUrl = normalizeApiUrl(process.env["EXPO_PUBLIC_API_URL"]);
  if (envUrl) return envUrl;

  const expoExtra = getExpoExtraConfig();
  const extraApiUrl = normalizeApiUrl(expoExtra.apiUrl);
  if (extraApiUrl) return extraApiUrl;

  const domain = expoExtra.domain?.trim();
  if (domain) {
    return `https://${domain.replace(/^https?:\/\//, "").replace(/\/+$/, "")}/api`;
  }

  if (typeof window !== "undefined" && window.location?.hostname) {
    const host = window.location.hostname.replace(".expo.", ".");
    return `https://${host}/api`;
  }

  if (Platform.OS !== "web") {
    console.warn(
      "[apiClient] Falling back to localhost API on native. Expo config is missing apiUrl/domain.",
    );
  }

  return "http://localhost:8080/api";
}

// ─── Timeouts ────────────────────────────────────────────────────────────────

/**
 * Default request timeout used by fetchJson and all services that do not
 * specify their own. 12 s is generous for API calls over HTTPS while still
 * giving users a timely error rather than an indefinite hang.
 */
export const DEFAULT_TIMEOUT_MS = 12_000;

/**
 * Create an AbortSignal that fires after `timeoutMs` milliseconds.
 * Cleans up the timer when the signal aborts to avoid memory leaks.
 */
export function makeRequestTimeoutSignal(
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): AbortSignal {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  controller.signal.addEventListener("abort", () => clearTimeout(id));
  return controller.signal;
}

// ─── Headers ────────────────────────────────────────────────────────────────

/**
 * Return a headers object with Accept and Content-Type set to
 * application/json, merged with any caller-supplied extras.
 * Pass x_client_id or other custom headers via `extra`.
 */
export function mergeJsonHeaders(
  extra?: Record<string, string>,
): Record<string, string> {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...extra,
  };
}

// ─── Response parsing ────────────────────────────────────────────────────────

/**
 * Parse a JSON response body, surfacing the most useful error message
 * when the response is not ok.
 */
export async function parseJsonResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = "Request failed";
    try {
      const body = (await res.json()) as {
        error?: string;
        message?: string;
      };
      message = body.error ?? body.message ?? message;
    } catch {
      // Body was not JSON — fall through to the generic message.
    }
    throw new Error(message);
  }

  try {
    return (await res.json()) as T;
  } catch {
    throw new Error("Invalid server response");
  }
}

// ─── fetchJson ───────────────────────────────────────────────────────────────

/**
 * Fetch a JSON endpoint with automatic timeout, default JSON headers, and
 * consistent error handling.
 *
 * Callers may pass explicit `headers` to override the defaults — use this
 * to include custom headers such as `x_client_id`. If no headers are
 * provided, JSON Accept/Content-Type headers are added automatically.
 *
 * For streaming or non-JSON endpoints use raw fetch with the shared helpers
 * (apiBase, makeRequestTimeoutSignal, mergeJsonHeaders) instead.
 */
export async function fetchJson<T>(
  url: string,
  options?: RequestInit & { timeoutMs?: number },
): Promise<T> {
  const {
    timeoutMs,
    headers: callerHeaders,
    signal: callerSignal,
    ...rest
  } = options ?? {};

  const signal = callerSignal ?? makeRequestTimeoutSignal(timeoutMs);
  const headers = callerHeaders ?? mergeJsonHeaders();

  const res = await fetch(url, { headers, signal, ...rest });
  return parseJsonResponse<T>(res);
}
