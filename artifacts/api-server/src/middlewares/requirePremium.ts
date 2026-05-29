/**
 * requirePremium — server-side RevenueCat entitlement gate.
 *
 * Environment variables (both must be set in production):
 *   REVENUECAT_PROJECT_ID     – enables the check; absent → dev bypass
 *   REVENUECAT_SECRET_API_KEY – RevenueCat v1 secret API key (not the public SDK key)
 *
 * Behaviour on error: FAIL CLOSED.
 *   • 503 when the API key is missing or RevenueCat is unreachable.
 *   • 402 when the user has no active premium entitlement.
 *   • Dev bypass when REVENUECAT_PROJECT_ID is absent (local development).
 */

import type { NextFunction, Request, Response } from "express";
import { getAuth } from "@clerk/express";

const ENTITLEMENT_ID = "premium";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

interface CacheEntry {
  isPremium: boolean;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function getCached(userId: string): boolean | null {
  const entry = cache.get(userId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(userId);
    return null;
  }
  return entry.isPremium;
}

function setCached(userId: string, isPremium: boolean): void {
  cache.set(userId, { isPremium, expiresAt: Date.now() + CACHE_TTL_MS });
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

async function checkEntitlement(userId: string, secretKey: string): Promise<boolean> {
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

  const entitlement = entitlements[ENTITLEMENT_ID];
  if (!entitlement) return false;

  return isEntitlementActive(entitlement);
}

export async function requirePremium(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
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
      "REVENUECAT_SECRET_API_KEY is not set but REVENUECAT_PROJECT_ID is — premium check cannot run",
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
  if (cached === true) {
    next();
    return;
  }
  if (cached === false) {
    res.status(402).json({
      error: "Subscription required",
      message:
        "An active Hospice Roadmap subscription is required to use Ragna AI. Open the app and tap 'See Plans' to subscribe.",
    });
    return;
  }

  // Live check — fail closed on any error
  try {
    const isPremium = await checkEntitlement(userId, secretKey);
    setCached(userId, isPremium);
    if (isPremium) {
      next();
    } else {
      res.status(402).json({
        error: "Subscription required",
        message:
          "An active Hospice Roadmap subscription is required to use Ragna AI. Open the app and tap 'See Plans' to subscribe.",
      });
    }
  } catch (err: unknown) {
    req.log.error({ err }, "RevenueCat entitlement check failed — blocking request (fail closed)");
    res.status(503).json({
      error: "Service unavailable",
      message: "Subscription verification is temporarily unavailable. Please try again shortly.",
    });
  }
}
