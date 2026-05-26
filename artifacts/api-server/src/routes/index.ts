import { Router, type IRouter } from "express";
import healthRouter from "./health";
import cmsRouter from "./cms";
import anthropicRouter from "./anthropic/index.js";
import openAiRouter from "./openai.js";
import supportRouter from "./support.js";
import { aiRateLimiter, voiceRateLimiter } from "../lib/rateLimit.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(cmsRouter);
router.use("/anthropic", aiRateLimiter, anthropicRouter);
router.use("/openai", voiceRateLimiter, openAiRouter);
router.use("/support", supportRouter);

export default router;
