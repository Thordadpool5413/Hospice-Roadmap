import { Router, type IRouter, type Request, type Response } from "express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import { HealthCheckResponse } from "@workspace/api-zod";

import { getElevenLabsStatus } from "../lib/elevenlabsTts.js";
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

/**
 * Public voice bootstrap — helps verify ElevenLabs is wired on Replit without
 * requiring a signed-in mobile session.
 *
 * Optional synthesis probe: ?probe=1 or ?test_tts=true
 */
router.get("/voice-status", async (req: Request, res: Response) => {
  const includeSynthesisProbe =
    req.query["probe"] === "1" ||
    req.query["probe"] === "true" ||
    req.query["test_tts"] === "true";
  const elevenLabs = await getElevenLabsStatus({ includeSynthesisProbe });
  res.json({
    openaiConfigured: Boolean(process.env["OPENAI_API_KEY"]),
    betaBypass: process.env["REVENUECAT_BETA_BYPASS"] === "true",
    elevenLabs,
  });
});

export default router;