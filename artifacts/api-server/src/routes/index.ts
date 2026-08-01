import { Router, type IRouter } from "express";
import healthRouter from "./health";
import applicationsRouter from "./applications";
import contactRouter from "./contact";
import jobsRouter from "./jobs";
import adminRouter from "./admin";
import authRouter from "./auth";
import candidateAuthRouter from "./candidateAuth";
import candidateRouter from "./candidate";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/applications", applicationsRouter);
router.use("/contact", contactRouter);
router.use("/jobs", jobsRouter);
router.use("/admin", authRouter);
router.use("/admin", adminRouter);
router.use("/auth", candidateAuthRouter);
router.use("/candidate", candidateRouter);

export default router;