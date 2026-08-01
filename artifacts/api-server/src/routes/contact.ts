import { Router } from "express";
import { emailService } from "../services/emailService";
import { logger } from "../lib/logger";

const router = Router();

const INTEREST_OPTIONS = [
  "Build a remote team",
  "Find my next role",
  "Workforce advisory",
  "Something else",
];

const REQUIRED_FIELDS = ["firstName", "email", "interest", "message"] as const;

// POST /api/contact — send a message from the homepage contact form
router.post("/", async (req, res) => {
  try {
    const body = req.body as Record<string, string>;

    for (const field of REQUIRED_FIELDS) {
      if (!body[field]?.trim()) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    if (body.firstName.trim().length > 100) {
      return res.status(400).json({ error: "First name is too long" });
    }

    if (!INTEREST_OPTIONS.includes(body.interest.trim())) {
      return res.status(400).json({ error: "Invalid interest selection" });
    }

    if (body.message.trim().length < 10) {
      return res.status(400).json({ error: "Message must be at least 10 characters" });
    }

    if (body.message.trim().length > 5000) {
      return res.status(400).json({ error: "Message is too long" });
    }

    await emailService.sendContactNotification({
      firstName: body.firstName.trim(),
      email: body.email.trim().toLowerCase(),
      interest: body.interest.trim(),
      message: body.message.trim(),
    });

    logger.info(
      { from: body.email, interest: body.interest },
      "New contact message"
    );

    return res.status(201).json({
      success: true,
      message: "Message sent successfully. We'll be in touch shortly.",
    });
  } catch (err) {
    logger.error({ err }, "Failed to send contact message");
    return res.status(500).json({ error: "An unexpected error occurred. Please try again." });
  }
});

export default router;
