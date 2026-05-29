import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";

const ENTITLEMENT_ID = "premium";
const CACHE_TTL_MS = 5 * 60 * 1000;

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

async function checkRevenueCatEntitlement(userId: string): Promise<boolean> {
  const apiKey = process.env["EXPO_PUBLIC_REVENUECAT_TEST_API_KEY"];
  if (!apiKey) {
    return true;
  }

  const url = `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`RevenueCat API error: ${response.status}`);
  }

  const data = (await response.json()) as {
    subscriber?: {
      entitlements?: Record<
        string,
        { expires_date: string | null; product_identifier: string }
      >;
    };
  };

  const entitlements = data?.subscriber?.entitlements ?? {};
  return ENTITLEMENT_ID in entitlements;
}

export async function requirePremium(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const projectId = process.env["REVENUECAT_PROJECT_ID"];
  if (!projectId) {
    next();
    return;
  }

  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

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

  try {
    const isPremium = await checkRevenueCatEntitlement(userId);
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
    req.log.warn({ err }, "RevenueCat entitlement check failed — allowing request");
    next();
  }
}
