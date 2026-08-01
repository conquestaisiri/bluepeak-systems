import { Router } from "express";
import { jobService, ValidationError } from "../services/jobService";
import { logger } from "../lib/logger";

const router = Router();

// All admin job routes require authentication (applied by the parent admin router)

// GET /api/admin/jobs — list all jobs (including inactive)
router.get("/", async (_req, res) => {
  try {
    const jobs = await jobService.listAdmin();
    return res.json({ jobs });
  } catch (err) {
    logger.error({ err }, "Failed to fetch jobs");
    return res.status(500).json({ error: "Failed to retrieve jobs" });
  }
});

// GET /api/admin/jobs/:id — single job
router.get("/:id", async (req, res) => {
  try {
    const job = await jobService.getById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    return res.json({ job });
  } catch (err) {
    logger.error({ err }, "Failed to fetch job");
    return res.status(500).json({ error: "Failed to retrieve job" });
  }
});

// POST /api/admin/jobs — create a job
router.post("/", async (req, res) => {
  try {
    const job = await jobService.create((req.body ?? {}) as Record<string, unknown>);
    logger.info({ jobId: job.id, slug: job.slug }, "Job created");
    return res.status(201).json({ job });
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    logger.error({ err }, "Failed to create job");
    return res.status(500).json({ error: "Failed to create job" });
  }
});

// PUT /api/admin/jobs/:id — update a job
router.put("/:id", async (req, res) => {
  try {
    const job = await jobService.update(req.params.id, (req.body ?? {}) as Record<string, unknown>);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    logger.info({ jobId: job.id, slug: job.slug }, "Job updated");
    return res.json({ job });
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    logger.error({ err }, "Failed to update job");
    return res.status(500).json({ error: "Failed to update job" });
  }
});

// DELETE /api/admin/jobs/:id — delete a job
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await jobService.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Job not found" });
    }
    logger.info({ jobId: req.params.id }, "Job deleted");
    return res.json({ success: true, message: "Job deleted" });
  } catch (err) {
    logger.error({ err }, "Failed to delete job");
    return res.status(500).json({ error: "Failed to delete job" });
  }
});

export default router;
