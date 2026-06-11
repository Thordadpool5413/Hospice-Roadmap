/**
 * requireEntitlement — server-side RevenueCat tiered entitlement gate.
 *
 * Two paid tiers map to two RevenueCat entitlement IDs:
 *   • "caregiver"  – basic cross-device data sync features.
 *   • "companion"  – Ragna AI + voice (the higher tier). A companion
 *                    subscriber implicitly satisfies any "caregiver" gate.
 *
 * Environment variables (both must be set in production):
 *   REVENUECAT_PROJECT_ID     – enables the check; absent → dev bypass
 *   REVENUECAT_SECRET_API_KEY – RevenueCat v1 secret API key (not the public SDK key)
 *
 * Beta testing (TestFlight):
 *   REVENUECAT_BETA_BYPASS=true – bypasses the entitlement check entirely so
 *   TestFlight testers can use all premium features without a real subscription.
 *   Set this on the API server that serves TestFlight builds. NEVER set it on
 *   the production API server — it would grant free access to all users.
 *
 * Behaviour on error: FAIL CLOSED.
 *   • 503 when the API key is missing or RevenueCat is unreachable.
 *   • 402 when the user lacks the required tier. The response distinguishes
 *     "no subscription at all" from "wrong tier / upgrade needed".
 *   • Dev bypass when REVENUECAT_PROJECT_ID is absent (local development).
 */

import type { NextFunction, Request, Response } from "express";
import { getAuth } from "@clerk/express";

export type Entitlement = "caregiver" | "companion";

const CAREGIVER_ENTITLEMENT_ID = "caregiver";
const COMPANION_ENTITLEMENT_ID = "companion";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

interface CacheEntry {
  /** Active entitlement IDs the user currently holds. */
  entitlements: string[];
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function getCached(userId: string): string[] | null {
  const entry = cache.get(userId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(userId);
    return null;
  }
  return entry.entitlements;
}

function setCached(userId: string, entitlements: string[]): void {
  cache.set(userId, { entitlements, expiresAt: Date.now() + CACHE_TTL_MS });
}

interface RcEntitlement {
  expires_date: string | null;
  grace_period_expires_date?: string | null;
  product_identifier: string;
}

interface RcSubscriberResponse {
  subscriber?: {
    entitlements?: Record<string, RcEntitlement>;
  };
}

/**
 * Returns true if the entitlement is currently active:
 *   – expires_date is null (lifetime purchase), OR
 *   – expires_date is in the future, OR
 *   – grace_period_expires_date is in the future (billing grace)
 */
function isEntitlementActive(e: RcEntitlement): boolean {
  const now = Date.now();

  if (e.expires_date === null) return true; // lifetime

  const exp = Date.parse(e.expires_date);
  if (!isNaN(exp) && exp > now) return true;

  const grace = e.grace_period_expires_date
    ? Date.parse(e.grace_period_expires_date)
    : NaN;
  if (!isNaN(grace) && grace > now) return true;

  return false;
}

/**
 * Fetches the subscriber from RevenueCat and returns the set of tier
 * entitlement IDs ("caregiver" / "companion") that are currently active.
 */
async function fetchActiveEntitlements(
  userId: string,
  secretKey: string,
): Promise<string[]> {
  const url = `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`RevenueCat API responded ${response.status}`);
  }

  const data = (await response.json()) as RcSubscriberResponse;
  const entitlements = data?.subscriber?.entitlements ?? {};

  const active: string[] = [];
  for (const id of [CAREGIVER_ENTITLEMENT_ID, COMPANION_ENTITLEMENT_ID]) {
    const e = entitlements[id];
    if (e && isEntitlementActive(e)) active.push(id);
  }
  return active;
}

/**
 * Returns true if the set of active entitlements satisfies the required tier.
 * "companion" implicitly grants "caregiver" access.
 */
function satisfies(active: string[], required: Entitlement): boolean {
  if (active.includes(COMPANION_ENTITLEMENT_ID)) return true;
  if (required === CAREGIVER_ENTITLEMENT_ID) {
    return active.includes(CAREGIVER_ENTITLEMENT_ID);
  }
  return false;
}

/** Builds the 402 body, distinguishing "no subscription" from "wrong tier". */
function buildDeniedBody(active: string[], required: Entitlement) {
  const hasAnySubscription = active.length > 0;

  if (!hasAnySubscription) {
    return {
      error: "Subscription required",
      reason: "no_subscription" as const,
      requiredEntitlement: required,
      message:
        required === COMPANION_ENTITLEMENT_ID
          ? "An active Hospice Roadmap subscription is required to use Ragna AI and voice. Open the app and tap 'See Plans' to subscribe."
          : "An active Hospice Roadmap subscription is required to sync your data across devices. Open the app and tap 'See Plans' to subscribe.",
    };
  }

  // Has a subscription, but not the right tier (e.g. Caregiver hitting a
  // Companion-only Ragna AI endpoint).
  return {
    error: "Upgrade required",
    reason: "wrong_tier" as const,
    requiredEntitlement: required,
    currentEntitlements: active,
    message:
      "Ragna AI and voice are part of the Companion plan. You currently have the Caregiver plan — upgrade in the app to unlock Ragna.",
  };
}

/**
 * Factory returning an Express middleware that enforces the given tier.
 * Defaults to "companion" so existing callers keep their previous behaviour.
 */
export function requireEntitlement(
  requiredEntitlement: Entitlement = COMPANION_ENTITLEMENT_ID,
) {
  return async function entitlementGate(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    // Beta bypass — REVENUECAT_BETA_BYPASS=true unlocks all tiers for TestFlight
    // builds. Set this env var on the API server that backs TestFlight; never on
    // the production server.
    if (process.env["REVENUECAT_BETA_BYPASS"] === "true") {
      req.log.debug("requireEntitlement: beta bypass active — skipping entitlement check");
      next();
      return;
    }

    // Dev bypass — REVENUECAT_PROJECT_ID not set means local development
    const projectId = process.env["REVENUECAT_PROJECT_ID"];
    if (!projectId) {
      next();
      return;
    }

    // Fail closed: secret key must be present in production
    const secretKey = process.env["REVENUECAT_SECRET_API_KEY"];
    if (!secretKey) {
      req.log.error(
        "REVENUECAT_SECRET_API_KEY is not set but REVENUECAT_PROJECT_ID is — entitlement check cannot run",
      );
      res.status(503).json({
        error: "Service unavailable",
        message: "Subscription verification is temporarily unavailable. Please try again shortly.",
      });
      return;
    }

    const userId = getAuth(req).userId;
    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    // Cache hit
    const cached = getCached(userId);
    if (cached !== null) {
      if (satisfies(cached, requiredEntitlement)) {
        next();
      } else {
        res.status(402).json(buildDeniedBody(cached, requiredEntitlement));
      }
      return;
    }

    // Live check — fail closed on any error
    try {
      const active = await fetchActiveEntitlements(userId, secretKey);
      setCached(userId, active);
      if (satisfies(active, requiredEntitlement)) {
        next();
      } else {
        res.status(402).json(buildDeniedBody(active, requiredEntitlement));
      }
    } catch (err: unknown) {
      req.log.error({ err }, "RevenueCat entitlement check failed — blocking request (fail closed)");
      res.status(503).json({
        error: "Service unavailable",
        message: "Subscription verification is temporarily unavailable. Please try again shortly.",
      });
    }
  };
}

/**
 * Backward-compatible middleware for existing callers. Equivalent to
 * requireEntitlement("companion").
 */
export const requirePremium = requireEntitlement(COMPANION_ENTITLEMENT_ID);
