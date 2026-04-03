import { Router, type IRouter } from "express";
import healthRouter from "./health";
import cmsRouter from "./cms";
import anthropicRouter from "./anthropic/index.js";
import openAiRouter from "./openai.js";
import supportRouter from "./support.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(cmsRouter);
router.use("/anthropic", anthropicRouter);
router.use("/openai", openAiRouter);
router.use("/support", supportRouter);

export default router;
