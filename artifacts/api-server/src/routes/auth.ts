import { Router } from "express";
import { generateToken, verifyToken } from "../middleware/auth";
import { logger } from "../lib/logger";

const router = Router();

// Admin login
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set");
}

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      logger.warn({ email }, "Failed admin login attempt");
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken({ id: "admin-1", email, role: "admin" });

    return res.json({ token, user: { email, role: "admin" } });
  } catch (err) {
    logger.error({ err }, "Admin login error");
    return res.status(500).json({ error: "Login failed" });
  }
});

// TEMPORARY DIAGNOSTIC — reveals server-side env state without exposing secrets.
// Returns whether submitted email/password match the configured admin credentials.
router.post("/diagnostics", (req, res) => {
  const { email, password } = (req.body ?? {}) as { email?: string; password?: string };
  const trim = (s: string | undefined) => (s ?? "").trim();
  return res.json({
    configured: {
      email: ADMIN_EMAIL,
      passwordLength: ADMIN_PASSWORD.length,
      passwordTrimmedLength: trim(ADMIN_PASSWORD).length,
      passwordHasSurroundingWhitespace: ADMIN_PASSWORD !== trim(ADMIN_PASSWORD),
    },
    submitted: {
      emailMatches: email === ADMIN_EMAIL,
      passwordMatches: password === ADMIN_PASSWORD,
      passwordMatchesTrimmed: trim(password) === trim(ADMIN_PASSWORD),
    },
  });
});

// Verify token
router.get("/verify", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ valid: false });
  }
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ valid: false });
  }
  return res.json({ valid: true, user: { email: payload.email, role: payload.role } });
});

export default router;