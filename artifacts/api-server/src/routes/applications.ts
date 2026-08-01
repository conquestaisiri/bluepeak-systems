import { Router } from "express";
import { upload } from "../middleware/upload";
import { applicationService } from "../services/applicationService";
import { logger } from "../lib/logger";

const router = Router();

const REQUIRED_FIELDS = [
  "position",
  "fullName",
  "email",
  "phone",
  "country",
  "city",
  "timezone",
  "yearsExperience",
  "education",
  "englishProficiency",
  "noticePeriod",
  "expectedSalary",
  "earliestStartDate",
  "skills",
  "relevantExperience",
  "coverLetter",
] as const;

// POST /api/applications — submit a new application
router.post(
  "/",
  (req, res, next) => {
    upload.single("resume")(req, res, (err: unknown) => {
      if (err) {
        const message = err instanceof Error ? err.message : "Resume upload failed";
        return res.status(400).json({ error: message });
      }
      return next();
    });
  },
  async (req, res) => {
    try {
      const body = req.body as Record<string, string>;
      const file = req.file;

      for (const field of REQUIRED_FIELDS) {
        if (!body[field]?.trim()) {
          return res.status(400).json({ error: `Missing required field: ${field}` });
        }
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      const application = await applicationService.create({
        position: body.position.trim(),
        fullName: body.fullName.trim(),
        email: body.email.trim().toLowerCase(),
        phone: body.phone.trim(),
        country: body.country.trim(),
        city: body.city.trim(),
        timezone: body.timezone.trim(),
        linkedinUrl: body.linkedinUrl?.trim() || null,
        portfolioUrl: body.portfolioUrl?.trim() || null,
        yearsExperience: body.yearsExperience.trim(),
        education: body.education.trim(),
        englishProficiency: body.englishProficiency.trim(),
        noticePeriod: body.noticePeriod.trim(),
        expectedSalary: body.expectedSalary.trim(),
        earliestStartDate: body.earliestStartDate.trim(),
        skills: body.skills.trim(),
        relevantExperience: body.relevantExperience.trim(),
        coverLetter: body.coverLetter.trim(),
      }, file);

      logger.info(
        { applicationId: application.id, position: application.position },
        "New application received"
      );

      return res.status(201).json({
        success: true,
        applicationId: application.id,
        message: "Application submitted successfully. Check your email for confirmation.",
      });
    } catch (err) {
      logger.error({ err }, "Failed to submit application");
      return res.status(500).json({ error: "An unexpected error occurred. Please try again." });
    }
  }
);

export default router;