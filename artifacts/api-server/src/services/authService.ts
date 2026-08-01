import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { logger } from "../lib/logger";
import { authRepository } from "../repositories/authRepository";

const JWT_SECRET = process.env.JWT_SECRET!;
const FRONTEND_URL = (process.env.FRONTEND_URL ?? "").trim();

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET must be set");
}

const MAGIC_LINK_TTL = 15 * 60 * 1000; // 15 minutes
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export const authService = {
  async generateMagicToken(email: string): Promise<string> {
    const token = crypto.randomBytes(32).toString("hex");
    const normalizedEmail = email.toLowerCase().trim();
    const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL);

    await authRepository.createMagicToken({
      token,
      email: normalizedEmail,
      expiresAt,
    });

    // Cleanup expired tokens periodically
    void authRepository.cleanupExpiredTokens();

    return token;
  },

  async consumeMagicToken(token: string): Promise<string | null> {
    const magicToken = await authRepository.findMagicToken(token);
    if (!magicToken) {
      return null;
    }

    const consumed = await authRepository.consumeMagicToken(token);
    if (!consumed) {
      return null;
    }

    return consumed.email;
  },

  async generateSessionToken(email: string): Promise<string> {
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(sessionToken);
    const expiresAt = new Date(Date.now() + SESSION_TTL);

    await authRepository.createCandidateSession({
      email: email.toLowerCase().trim(),
      tokenHash,
      expiresAt,
    });

    // Cleanup expired sessions periodically
    void authRepository.cleanupExpiredSessions();

    // Return JWT that wraps the session token for stateless verification
    return jwt.sign(
      { sessionToken, email: email.toLowerCase().trim(), role: "candidate" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
  },

  verifySessionToken(token: string): { id: string; email: string; role: string; sessionToken?: string } | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        sessionToken?: string;
        email: string;
        role: string;
      };
      return {
        id: decoded.email,
        email: decoded.email,
        role: decoded.role,
        sessionToken: decoded.sessionToken,
      };
    } catch {
      return null;
    }
  },

  async validateSessionToken(token: string): Promise<{ email: string; valid: boolean } | null> {
    const decoded = this.verifySessionToken(token);
    if (!decoded || !decoded.sessionToken) {
      return null;
    }

    const tokenHash = hashToken(decoded.sessionToken);
    const session = await authRepository.findCandidateSessionByTokenHash(tokenHash);

    if (!session) {
      return { email: decoded.email, valid: false };
    }

    // Update last used timestamp
    await authRepository.updateSessionLastUsed(session.id);

    return { email: session.email, valid: true };
  },

  async revokeSession(token: string): Promise<void> {
    const decoded = this.verifySessionToken(token);
    if (!decoded || !decoded.sessionToken) {
      return;
    }
    const tokenHash = hashToken(decoded.sessionToken);
    await authRepository.revokeSession(tokenHash);
  },

  async revokeAllSessions(email: string): Promise<void> {
    await authRepository.revokeAllSessionsForEmail(email.toLowerCase().trim());
  },

  buildMagicLinkUrl(token: string): string {
    const base = FRONTEND_URL ? FRONTEND_URL.replace(/\/$/, "") : "";
    return `${base}/login/confirm?token=${token}`;
  },
};