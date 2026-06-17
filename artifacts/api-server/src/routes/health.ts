import { Router, type IRouter, type Request, type Response } from "express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import { HealthCheckResponse } from "@workspace/api-zod";

import { getClerkProxyHost } from "../middlewares/clerkProxyMiddleware.js";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

/**
 * Public mobile bootstrap — returns the production Clerk publishable key and
 * proxy URL from the running server. Publishable keys are safe to expose
 * (they ship in every client app). Use this when Replit's Publishing UI does
 * not surface CLERK_PUBLISHABLE_KEY for copy/paste into EAS.
 */
router.get("/mobile-clerk-config", (req: Request, res: Response) => {
  const fallback = process.env["CLERK_PUBLISHABLE_KEY"] ?? "";
  if (!fallback) {
    res.status(503).json({
      error: "CLERK_PUBLISHABLE_KEY is not configured on the server.",
    });
    return;
  }

  const host = getClerkProxyHost(req) ?? "";
  const publishableKey = publishableKeyFromHost(host, fallback);
  const proto =
    req.header("x-forwarded-proto")?.split(",")[0]?.trim() || req.protocol || "https";

  res.json({
    publishableKey,
    clerkProxyUrl: host ? `${proto}://${host}/api/__clerk` : null,
  });
});

export default router;
