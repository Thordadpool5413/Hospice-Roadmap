import { Router, type IRouter } from "express";
import healthRouter from "./health";
import cmsRouter from "./cms";
import anthropicRouter from "./anthropic/index.js";
import openAiRouter from "./openai.js";
import supportRouter from "./support.js";
import syncRouter from "./sync.js";
import familyUpdatesRouter from "./familyUpdates.js";
import { aiRateLimiter, voiceRateLimiter } from "../lib/rateLimit.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requirePremium } from "../middlewares/requirePremium.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(cmsRouter);
router.use("/anthropic", requireAuth, aiRateLimiter, anthropicRouter);
router.use("/openai", requireAuth, voiceRateLimiter, openAiRouter);
router.use("/support", supportRouter);
router.use("/sync", requireAuth, syncRouter);
router.use("/family-updates", requireAuth, requirePremium, familyUpdatesRouter);

export default router;
