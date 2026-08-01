import { Router } from "express";
import { candidateAuthMiddleware } from "../middleware/auth";
import { AuthRequest } from "../middleware/auth";
import { applicationRepository } from "../repositories/applicationRepository";
import { storageService } from "../services/storageService";
import { logger } from "../lib/logger";

const router = Router();

// All candidate routes require a valid candidate session
router.use(candidateAuthMiddleware);

// GET /api/candidate/applications — list all applications for the logged-in candidate
router.get("/applications", async (req: AuthRequest, res) => {
  try {
    const user = req.user as { id: string; email: string; role: string; sessionToken?: string };
    const applications = await applicationRepository.findByEmail(user.email);
    return res.json({ applications });
  } catch (err) {
    return res.status(500).json({ error: "Failed to retrieve applications" });
  }
});

// GET /api/candidate/applications/:id — get a single application (only if it belongs to the logged-in candidate)
router.get("/applications/:id", async (req: AuthRequest, res) => {
  try {
    const user = req.user as { id: string; email: string; role: string; sessionToken?: string };
    const id = req.params.id as string;
    const application = await applicationRepository.findById(id);
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }
    // Ensure the application belongs to the logged-in candidate
    if (application.email.toLowerCase() !== user.email.toLowerCase()) {
      return res.status(403).json({ error: "You do not have access to this application" });
    }
    return res.json({ application });
  } catch (err) {
    return res.status(500).json({ error: "Failed to retrieve application" });
  }
});

// GET /api/candidate/applications/:id/resume — download application resume
router.get("/applications/:id/resume", async (req: AuthRequest, res) => {
  try {
    const user = req.user as { id: string; email: string; role: string; sessionToken?: string };
    const id = req.params.id as string;
    const application = await applicationRepository.findById(id);
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }
    // Ensure the application belongs to the logged-in candidate
    if (application.email.toLowerCase() !== user.email.toLowerCase()) {
      return res.status(403).json({ error: "You do not have access to this application" });
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

export default router;
