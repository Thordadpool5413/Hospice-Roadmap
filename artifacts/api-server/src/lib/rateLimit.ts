import rateLimit, { ipKeyGenerator, type RateLimitRequestHandler } from "express-rate-limit";
import type { Request, Response } from "express";

const VALID_CLIENT_ID = /^client_[a-z0-9_]{1,64}$/;

function clientKey(req: Request, _res: Response): string {
  const ipPart = ipKeyGenerator(req.ip ?? "");
  const raw = req.header("x_client_id")?.trim() ?? "";
  // Only honor x_client_id when it matches the strict server-side format,
  // and ALWAYS compose with the IP so a rotated/spoofed header cannot
  // bypass the limit or balloon the in-memory key store.
  if (VALID_CLIENT_ID.test(raw)) {
    return `${ipPart}|${raw}`;
  }
  return ipPart;
}

function jsonLimitHandler(_req: Request, res: Response): void {
  res.status(429).json({
    error: "Too many requests. Please slow down and try again in a minute.",
  });
}

export const aiRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: clientKey,
  handler: jsonLimitHandler,
});

export const voiceRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: clientKey,
  handler: jsonLimitHandler,
});
