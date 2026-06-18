import { Router, type IRouter, type Request, type Response } from "express";
import healthRouter from "./health";
import cmsRouter from "./cms";
import anthropicRouter from "./anthropic/index.js";
import openAiRouter from "./openai.js";
import supportRouter from "./support.js";
import syncRouter from "./sync.js";
import pushRouter from "./push.js";
import authRouter from "./auth.js";
import familyUpdatesRouter, { twilioInboundHandler } from "./familyUpdates.js";
import { aiRateLimiter, voiceRateLimiter } from "../lib/rateLimit.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requirePremium } from "../middlewares/requirePremium.js";
import { getSpeechCacheEntry, pruneSpeechCache } from "../lib/speechCache.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(cmsRouter);

// Public audio-cache playback — registered BEFORE requireAuth so the iOS
// expo-audio player (which cannot attach a Bearer token to media requests)
// can fetch the short-lived, UUID-keyed audio clip without a 401.
// The cache uses random UUIDs and a 10-minute TTL, so there is no meaningful
// security concern in keeping this endpoint open.
router.get("/openai/speak/:audioId", (req: Request, res: Response) => {
  pruneSpeechCache();
  const entry = getSpeechCacheEntry(req.params["audioId"] as string);
  if (!entry) {
    res.status(404).json({ error: "Spoken reply audio not found or expired." });
    return;
  }
  res.setHeader("Content-Type", entry.mimeType);
  res.setHeader("Content-Length", String(entry.buffer.length));
  res.setHeader("Cache-Control", "no-store");
  res.status(200).send(entry.buffer);
});

router.head("/openai/speak/:audioId", (req: Request, res: Response) => {
  pruneSpeechCache();
  const entry = getSpeechCacheEntry(req.params["audioId"] as string);
  if (!entry) {
    res.status(404).end();
    return;
  }
  res.setHeader("Content-Type", entry.mimeType);
  res.setHeader("Content-Length", String(entry.buffer.length));
  res.setHeader("Cache-Control", "no-store");
  res.status(200).end();
});

router.use("/anthropic", requireAuth, aiRateLimiter, anthropicRouter);
router.use("/openai", requireAuth, voiceRateLimiter, openAiRouter);
router.use("/support", supportRouter);
router.use("/sync", requireAuth, syncRouter);
router.use("/push", requireAuth, pushRouter);
router.use("/auth", requireAuth, authRouter);

// Twilio inbound SMS webhook — called by Twilio, not by the app user.
// Must be registered BEFORE the auth-guarded family-updates router.
router.post("/family-updates/inbound", twilioInboundHandler);

router.use("/family-updates", requireAuth, requirePremium, familyUpdatesRouter);

export default router;
