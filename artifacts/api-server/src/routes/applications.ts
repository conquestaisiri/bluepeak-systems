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
router.post("/", upload.single("resume"), (req, res) => {
  try {
    const body = req.body as Record<string, string>;
    const file = req.file;

    for (const field of REQUIRED_FIELDS) {
      if (!body[field]?.trim()) {
        return res
          .status(400)
          .json({ error: `Missing required field: ${field}` });
      }
    }

    const application = applicationService.create({
      position: body.position.trim(),
      full_name: body.fullName.trim(),
      email: body.email.trim().toLowerCase(),
      phone: body.phone.trim(),
      country: body.country.trim(),
      city: body.city.trim(),
      timezone: body.timezone.trim(),
      linkedin_url: body.linkedinUrl?.trim() || null,
      portfolio_url: body.portfolioUrl?.trim() || null,
      years_experience: body.yearsExperience.trim(),
      education: body.education.trim(),
      english_proficiency: body.englishProficiency.trim(),
      notice_period: body.noticePeriod.trim(),
      expected_salary: body.expectedSalary.trim(),
      earliest_start_date: body.earliestStartDate.trim(),
      skills: body.skills.trim(),
      relevant_experience: body.relevantExperience.trim(),
      cover_letter: body.coverLetter.trim(),
      resume_path: file?.path ?? null,
      resume_filename: file?.originalname ?? null,
    });

    logger.info(
      { applicationId: application.id, position: application.position },
      "New application received"
    );

    return res.status(201).json({
      success: true,
      applicationId: application.id,
      message: "Application submitted successfully.",
    });
  } catch (err) {
    logger.error({ err }, "Failed to submit application");
    return res
      .status(500)
      .json({ error: "An unexpected error occurred. Please try again." });
  }
});

// GET /api/applications — list all applications (admin use)
router.get("/", (_req, res) => {
  try {
    const applications = applicationService.list();
    return res.json({ applications, total: applications.length });
  } catch (err) {
    logger.error({ err }, "Failed to fetch applications");
    return res.status(500).json({ error: "Failed to retrieve applications." });
  }
});

// GET /api/applications/:id — get single application
router.get("/:id", (req, res) => {
  try {
    const application = applicationService.getById(req.params.id);
    if (!application) {
      return res.status(404).json({ error: "Application not found." });
    }
    return res.json({ application });
  } catch (err) {
    logger.error({ err }, "Failed to fetch application");
    return res.status(500).json({ error: "Failed to retrieve application." });
  }
});

export default router;
