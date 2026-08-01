import { Router, type IRouter } from "express";
import healthRouter from "./health";
import applicationsRouter from "./applications";
import contactRouter from "./contact";
import adminRouter from "./admin";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/applications", applicationsRouter);
router.use("/contact", contactRouter);
router.use("/admin", authRouter);
router.use("/admin", adminRouter);

export default router;