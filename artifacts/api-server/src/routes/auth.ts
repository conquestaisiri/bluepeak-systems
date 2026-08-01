import { Router } from "express";
import { generateToken, verifyToken } from "../middleware/auth";
import { logger } from "../lib/logger";

const router = Router();

// Admin login - in production, use proper password hashing (bcrypt)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@bluepeak.payservice.top";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "changeme123"; // Change in production!

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