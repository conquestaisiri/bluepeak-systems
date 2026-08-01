import { db } from "@workspace/db";
import { magicTokens, candidateSessions } from "@workspace/db/schema";
import { eq, and, gt, lt } from "drizzle-orm";
import type { MagicToken, CreateMagicTokenInput, CandidateSession, CreateCandidateSessionInput } from "@workspace/db/schema";

export const authRepository = {
  async createMagicToken(input: CreateMagicTokenInput): Promise<MagicToken> {
    const [result] = await db.insert(magicTokens).values(input).returning();
    return result;
  },

  async findMagicToken(token: string): Promise<MagicToken | undefined> {
    const now = new Date();
    const [result] = await db
      .select()
      .from(magicTokens)
      .where(and(eq(magicTokens.token, token), gt(magicTokens.expiresAt, now)))
      .limit(1);
    return result;
  },

  async consumeMagicToken(token: string): Promise<MagicToken | undefined> {
    const now = new Date();
    const [result] = await db
      .update(magicTokens)
      .set({ consumedAt: new Date() })
      .where(and(eq(magicTokens.token, token), gt(magicTokens.expiresAt, now)))
      .returning();
    return result;
  },

  async cleanupExpiredTokens(): Promise<void> {
    const now = new Date();
    await db.delete(magicTokens).where(lt(magicTokens.expiresAt, now));
  },

  async createCandidateSession(input: CreateCandidateSessionInput): Promise<CandidateSession> {
    const [result] = await db.insert(candidateSessions).values(input).returning();
    return result;
  },

  async findCandidateSessionByTokenHash(tokenHash: string): Promise<CandidateSession | undefined> {
    const now = new Date();
    const [result] = await db
      .select()
      .from(candidateSessions)
      .where(and(eq(candidateSessions.tokenHash, tokenHash), gt(candidateSessions.expiresAt, now), eq(candidateSessions.revoked, false)))
      .limit(1);
    return result;
  },

  async updateSessionLastUsed(id: string): Promise<void> {
    await db.update(candidateSessions).set({ lastUsedAt: new Date() }).where(eq(candidateSessions.id, id));
  },

  async revokeSession(tokenHash: string): Promise<void> {
    await db.update(candidateSessions).set({ revoked: true }).where(eq(candidateSessions.tokenHash, tokenHash));
  },

  async revokeAllSessionsForEmail(email: string): Promise<void> {
    await db.update(candidateSessions).set({ revoked: true }).where(eq(candidateSessions.email, email));
  },

  async cleanupExpiredSessions(): Promise<void> {
    const now = new Date();
    await db.delete(candidateSessions).where(lt(candidateSessions.expiresAt, now));
  },
};