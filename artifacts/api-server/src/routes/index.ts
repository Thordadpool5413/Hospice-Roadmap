import { Router, type IRouter } from "express";
import healthRouter from "./health";
import cmsRouter from "./cms";
import anthropicRouter from "./anthropic/index.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(cmsRouter);
router.use("/anthropic", anthropicRouter);

export default router;
