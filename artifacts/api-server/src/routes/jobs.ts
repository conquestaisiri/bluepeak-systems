import { Router } from "express";
import { jobService } from "../services/jobService";
import { logger } from "../lib/logger";

const router = Router();

// GET /api/jobs — list open positions
router.get("/", async (_req, res) => {
  try {
    const jobs = await jobService.listPublic();
    return res.json({ jobs });
  } catch (err) {
    logger.error({ err }, "Failed to fetch jobs");
    return res.status(500).json({ error: "Failed to retrieve jobs" });
  }
});

// GET /api/jobs/:slug — single position
router.get("/:slug", async (req, res) => {
  try {
    const job = await jobService.getBySlug(req.params.slug);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    return res.json({ job });
  } catch (err) {
    logger.error({ err }, "Failed to fetch job");
    return res.status(500).json({ error: "Failed to retrieve job" });
  }
});

export default router;
