import { Router } from "express";
import { authMiddleware, requireRole } from "../middleware/auth";
import { applicationService } from "../services/applicationService";
import { storageService } from "../services/storageService";
import { logger } from "../lib/logger";
import adminJobsRouter from "./adminJobs";

const router = Router();

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(requireRole("admin", "hr"));

// Job management (inherits auth from the parent router)
router.use("/jobs", adminJobsRouter);

// GET /api/admin/applications - List all applications with pagination and filters
router.get("/applications", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const status = req.query.status as string;
    const search = req.query.search as string;

    let applications = await applicationService.list();

    if (status) {
      applications = applications.filter((a) => a.status === status);
    }

    if (search) {
      const s = search.toLowerCase();
      applications = applications.filter(
        (a) =>
          a.fullName.toLowerCase().includes(s) ||
          a.email.toLowerCase().includes(s) ||
          a.position.toLowerCase().includes(s)
      );
    }

    const total = applications.length;
    const start = (page - 1) * limit;
    const paginated = applications.slice(start, start + limit);

    return res.json({
      applications: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    logger.error({ err }, "Failed to fetch applications");
    return res.status(500).json({ error: "Failed to retrieve applications" });
  }
});

// GET /api/admin/applications/:id - Get single application
router.get("/applications/:id", async (req, res) => {
  try {
    const application = await applicationService.getById(req.params.id);
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }
    return res.json({ application });
  } catch (err) {
    logger.error({ err }, "Failed to fetch application");
    return res.status(500).json({ error: "Failed to retrieve application" });
  }
});

// PATCH /api/admin/applications/:id/status - Update application status
router.patch("/applications/:id/status", async (req, res) => {
  try {
    const { status, notes } = req.body as { status: string; notes?: string };
    const validStatuses = ["New", "Reviewing", "Shortlisted", "Rejected", "Hired"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const application = await applicationService.updateStatus(req.params.id, status as any, notes);
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    logger.info({ applicationId: application.id, status }, "Application status updated");
    return res.json({ application });
  } catch (err) {
    logger.error({ err }, "Failed to update application status");
    return res.status(500).json({ error: "Failed to update application status" });
  }
});

// GET /api/admin/applications/:id/resume - Download application resume
router.get("/applications/:id/resume", async (req, res) => {
  try {
    const application = await applicationService.getById(req.params.id);
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }
    if (!application.resumePath) {
      return res.status(404).json({ error: "No resume uploaded" });
    }
    const url = await storageService.getPresignedDownloadUrl(application.resumePath);
    return res.redirect(url);
  } catch (err) {
    logger.error({ err }, "Failed to download resume");
    return res.status(500).json({ error: "Failed to download resume" });
  }
});

// DELETE /api/admin/applications/:id - Delete application (and resume file)
router.delete("/applications/:id", async (req, res) => {
  try {
    const deleted = await applicationService.deleteApplication(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Application not found" });
    }
    logger.info({ applicationId: req.params.id }, "Application deleted");
    return res.json({ success: true, message: "Application deleted" });
  } catch (err) {
    logger.error({ err }, "Failed to delete application");
    return res.status(500).json({ error: "Failed to delete application" });
  }
});

// GET /api/admin/stats - Get application statistics
router.get("/stats", async (req, res) => {
  try {
    const applications = await applicationService.list();

    const stats = {
      total: applications.length,
      byStatus: applications.reduce((acc, a) => {
        acc[a.status] = (acc[a.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byPosition: applications.reduce((acc, a) => {
        acc[a.position] = (acc[a.position] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      recentApplications: applications.slice(0, 10),
    };

    return res.json({ stats });
  } catch (err) {
    logger.error({ err }, "Failed to fetch stats");
    return res.status(500).json({ error: "Failed to retrieve statistics" });
  }
});

export default router;