import { Router, type IRouter } from "express";
import healthRouter from "./health";
import cmsRouter from "./cms";

const router: IRouter = Router();

router.use(healthRouter);
router.use(cmsRouter);

export default router;
