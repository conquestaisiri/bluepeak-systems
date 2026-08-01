import { Router } from "express";
import { authService } from "../services/authService";
import { emailService } from "../services/emailService";
import { applicationRepository } from "../repositories/applicationRepository";
import { logger } from "../lib/logger";

const router = Router();

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/magic-link — send a magic link to the provided email
router.post("/magic-link", async (req, res) => {
  try {
    const { email } = req.body as { email?: string };

    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ error: "A valid email address is required" });
    }

    const normalized = email.toLowerCase().trim();

    // Only send a magic link if this email has at least one application
    const applications = await applicationRepository.findByEmail(normalized);
    if (applications.length === 0) {
      logger.info({ email: normalized }, "Magic link requested for email with no applications");
      // Return the same message to avoid disclosing which emails have applications
      return res.json({ success: true, message: "Check your email for a magic link." });
    }

    const token = await authService.generateMagicToken(normalized);
    const linkUrl = authService.buildMagicLinkUrl(token);

    await emailService.sendMagicLink({ email: normalized, linkUrl });

    logger.info({ email: normalized }, "Magic link sent");
    return res.json({ success: true, message: "Check your email for a magic link." });
  } catch (err) {
    logger.error({ err }, "Failed to send magic link");
    return res.status(500).json({ error: "Failed to send magic link" });
  }
});

// GET /api/auth/verify — verify a magic-link token and return a session JWT
router.get("/verify", async (req, res) => {
  const { token } = req.query as { token?: string };

  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }

  const email = await authService.consumeMagicToken(token as string);
  if (!email) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  const sessionToken = await authService.generateSessionToken(email);
  logger.info({ email }, "Magic link verified, session issued");
  return res.json({ token: sessionToken, email });
});

export default router;
