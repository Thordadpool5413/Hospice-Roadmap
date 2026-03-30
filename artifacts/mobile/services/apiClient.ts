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

// ─── Base URL ────────────────────────────────────────────────────────────────

/**
 * Resolve the API base URL for the current environment.
 *
 * Priority:
 *  1. EXPO_PUBLIC_API_URL — set by the Expo workflow in Replit dev and by
 *     EAS builds. This is the primary signal.
 *  2. window.location — web fallback for Replit iframe preview when the env
 *     var is unavailable.
 *  3. localhost fallback for local non-Expo dev.
 */
export function apiBase(): string {
  const envUrl = process.env["EXPO_PUBLIC_API_URL"];
  if (envUrl) return envUrl;

  if (typeof window !== "undefined" && window.location?.hostname) {
    // Strip the Expo sub-domain prefix so the API host resolves correctly.
    const host = window.location.hostname.replace(".expo.", ".");
    return `https://${host}/api`;
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
  timeoutMs: number = DEFAULT_TIMEOUT_MS
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
  extra?: Record<string, string>
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
  options?: RequestInit & { timeoutMs?: number }
): Promise<T> {
  const { timeoutMs, headers: callerHeaders, signal: callerSignal, ...rest } =
    options ?? {};

  // Prefer caller's signal (e.g. from a component unmount controller).
  // Fall back to a timeout signal so requests never hang indefinitely.
  const signal = callerSignal ?? makeRequestTimeoutSignal(timeoutMs);

  // Only inject JSON headers when the caller did not supply their own.
  const headers = callerHeaders ?? mergeJsonHeaders();

  const res = await fetch(url, { headers, signal, ...rest });
  return parseJsonResponse<T>(res);
}
