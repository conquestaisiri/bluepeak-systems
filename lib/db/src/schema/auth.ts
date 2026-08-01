import { pgTable, text, timestamp, uuid, boolean, integer } from "drizzle-orm/pg-core";

export const magicTokens = pgTable("magic_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  token: text("token").notNull().unique(),
  email: text("email").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const candidateSessions = pgTable("candidate_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  revoked: boolean("revoked").default(false).notNull(),
});

export type MagicToken = typeof magicTokens.$inferSelect;
export type CreateMagicTokenInput = typeof magicTokens.$inferInsert;

export type CandidateSession = typeof candidateSessions.$inferSelect;
export type CreateCandidateSessionInput = typeof candidateSessions.$inferInsert;