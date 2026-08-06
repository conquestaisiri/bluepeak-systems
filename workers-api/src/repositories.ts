import { getDb } from "./db";
import {
  applications,
  magicTokens,
  candidateSessions,
  jobs,
  referrals,
  referralClicks,
  referralContent,
  referralSettings,
} from "./schema";
import {
  eq,
  and,
  or,
  gt,
  gte,
  lt,
  desc,
  ilike,
  sql,
  inArray,
  count as drizzleCount,
} from "drizzle-orm";
import type {
  Application,
  CreateApplicationInput,
  ApplicationStatus,
  MagicToken,
  CreateMagicTokenInput,
  CandidateSession,
  CreateCandidateSessionInput,
  Job,
  CreateJobInput,
  CreateReferralInput,
  Referral,
  ReferralSettingsRow,
} from "./schema";

const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateReferenceCode(): string {
  const parts = [];
  for (let i = 0; i < 3; i++) {
    let segment = "";
    for (let j = 0; j < 4; j++) {
      segment += CHARSET[Math.floor(Math.random() * CHARSET.length)];
    }
    parts.push(segment);
  }
  return parts.join("-");
}

export const applicationRepository = {
  async create(input: CreateApplicationInput): Promise<Application> {
    const db = getDb();
    let referenceCode: string;
    let attempts = 0;
    do {
      referenceCode = generateReferenceCode();
      const exists = await db
        .select({ id: applications.id })
        .from(applications)
        .where(eq(applications.referenceCode, referenceCode))
        .limit(1);
      if (exists.length === 0) break;
      attempts++;
    } while (attempts < 5);

    const [result] = await db
      .insert(applications)
      .values({ ...input, referenceCode })
      .returning();
    return result;
  },

  async findByEmail(email: string): Promise<Application[]> {
    const db = getDb();
    return db
      .select()
      .from(applications)
      .where(eq(applications.email, email))
      .orderBy(desc(applications.createdAt));
  },

  async findByReferenceCode(
    referenceCode: string,
  ): Promise<Application | undefined> {
    const db = getDb();
    const [result] = await db
      .select()
      .from(applications)
      .where(eq(applications.referenceCode, referenceCode))
      .limit(1);
    return result;
  },

  async findById(id: string): Promise<Application | undefined> {
    const db = getDb();
    const [result] = await db
      .select()
      .from(applications)
      .where(eq(applications.id, id))
      .limit(1);
    return result;
  },

  async findAll(): Promise<Application[]> {
    const db = getDb();
    return db.select().from(applications).orderBy(desc(applications.createdAt));
  },

  async updateStatus(
    id: string,
    status: ApplicationStatus,
    meetLink?: string | null,
    interviewInstructions?: string | null,
    meetingKey?: string | null,
  ): Promise<boolean> {
    const db = getDb();
    const result = await db
      .update(applications)
      .set({
        status,
        ...(meetLink !== undefined ? { meetLink } : {}),
        ...(interviewInstructions !== undefined
          ? { interviewInstructions }
          : {}),
        ...(meetingKey !== undefined ? { meetingKey } : {}),
      })
      .where(eq(applications.id, id))
      .returning({ id: applications.id });
    return result.length > 0;
  },

  async delete(id: string): Promise<boolean> {
    const db = getDb();
    const result = await db
      .delete(applications)
      .where(eq(applications.id, id))
      .returning({ id: applications.id });
    return result.length > 0;
  },
};

export const jobRepository = {
  async create(input: CreateJobInput): Promise<Job> {
    const db = getDb();
    const [result] = await db.insert(jobs).values(input).returning();
    return result;
  },

  async findById(id: string): Promise<Job | undefined> {
    const db = getDb();
    const [result] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, id))
      .limit(1);
    return result;
  },

  async findBySlug(
    slug: string,
    includeInactive = false,
  ): Promise<Job | undefined> {
    const db = getDb();
    const conditions = [eq(jobs.slug, slug)];
    if (!includeInactive) conditions.push(eq(jobs.isActive, true));
    const [result] = await db
      .select()
      .from(jobs)
      .where(and(...conditions))
      .limit(1);
    return result;
  },

  async findAll(includeInactive = false): Promise<Job[]> {
    const db = getDb();
    if (includeInactive) {
      return db.select().from(jobs).orderBy(desc(jobs.postedDate));
    }
    return db
      .select()
      .from(jobs)
      .where(eq(jobs.isActive, true))
      .orderBy(desc(jobs.postedDate));
  },

  async update(
    id: string,
    input: Partial<CreateJobInput>,
  ): Promise<Job | undefined> {
    const db = getDb();
    const [result] = await db
      .update(jobs)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(jobs.id, id))
      .returning();
    return result;
  },

  async delete(id: string): Promise<boolean> {
    const db = getDb();
    const result = await db
      .delete(jobs)
      .where(eq(jobs.id, id))
      .returning({ id: jobs.id });
    return result.length > 0;
  },
};

export const authRepository = {
  async createMagicToken(
    input: CreateMagicTokenInput,
  ): Promise<typeof magicTokens.$inferSelect> {
    const db = getDb();
    const [result] = await db.insert(magicTokens).values(input).returning();
    return result;
  },

  async findMagicToken(
    token: string,
  ): Promise<typeof magicTokens.$inferSelect | undefined> {
    const db = getDb();
    const now = new Date();
    const [result] = await db
      .select()
      .from(magicTokens)
      .where(and(eq(magicTokens.token, token), gt(magicTokens.expiresAt, now)))
      .limit(1);
    return result;
  },

  async consumeMagicToken(
    token: string,
  ): Promise<typeof magicTokens.$inferSelect | undefined> {
    const db = getDb();
    const now = new Date();
    const [result] = await db
      .update(magicTokens)
      .set({ consumedAt: new Date() })
      .where(and(eq(magicTokens.token, token), gt(magicTokens.expiresAt, now)))
      .returning();
    return result;
  },

  async cleanupExpiredTokens(): Promise<void> {
    const db = getDb();
    const now = new Date();
    await db.delete(magicTokens).where(lt(magicTokens.expiresAt, now));
  },

  async createCandidateSession(
    input: CreateCandidateSessionInput,
  ): Promise<typeof candidateSessions.$inferSelect> {
    const db = getDb();
    const [result] = await db
      .insert(candidateSessions)
      .values(input)
      .returning();
    return result;
  },

  async findCandidateSessionByTokenHash(
    tokenHash: string,
  ): Promise<typeof candidateSessions.$inferSelect | undefined> {
    const db = getDb();
    const now = new Date();
    const [result] = await db
      .select()
      .from(candidateSessions)
      .where(
        and(
          eq(candidateSessions.tokenHash, tokenHash),
          gt(candidateSessions.expiresAt, now),
          eq(candidateSessions.revoked, false),
        ),
      )
      .limit(1);
    return result;
  },

  async updateSessionLastUsed(id: string): Promise<void> {
    const db = getDb();
    await db
      .update(candidateSessions)
      .set({ lastUsedAt: new Date() })
      .where(eq(candidateSessions.id, id));
  },

  async revokeSession(tokenHash: string): Promise<void> {
    const db = getDb();
    await db
      .update(candidateSessions)
      .set({ revoked: true })
      .where(eq(candidateSessions.tokenHash, tokenHash));
  },

  async revokeAllSessionsForEmail(email: string): Promise<void> {
    const db = getDb();
    await db
      .update(candidateSessions)
      .set({ revoked: true })
      .where(eq(candidateSessions.email, email));
  },

  async cleanupExpiredSessions(): Promise<void> {
    const db = getDb();
    const now = new Date();
    await db
      .delete(candidateSessions)
      .where(lt(candidateSessions.expiresAt, now));
  },
};

function generateReferralCode(): string {
  const parts: string[] = [];
  for (let i = 0; i < 2; i++) {
    let segment = "";
    for (let j = 0; j < 4; j++) {
      segment += CHARSET[Math.floor(Math.random() * CHARSET.length)];
    }
    parts.push(segment);
  }
  return `BP-${parts.join("-")}`;
}

export const referralRepository = {
  async create(input: CreateReferralInput): Promise<Referral> {
    const db = getDb();
    let referralCode: string;
    let attempts = 0;
    do {
      referralCode = generateReferralCode();
      const exists = await db
        .select({ id: referrals.id })
        .from(referrals)
        .where(eq(referrals.referralCode, referralCode))
        .limit(1);
      if (exists.length === 0) break;
      attempts++;
    } while (attempts < 5);

    const [result] = await db
      .insert(referrals)
      .values({ ...input, referralCode })
      .returning();
    return result;
  },

  async createMany(inputs: CreateReferralInput[]): Promise<Referral[]> {
    const results: Referral[] = [];
    for (const input of inputs) {
      results.push(await this.create(input));
    }
    return results;
  },

  async findByCode(code: string): Promise<Referral | undefined> {
    const db = getDb();
    const [result] = await db
      .select()
      .from(referrals)
      .where(eq(referrals.referralCode, code))
      .limit(1);
    return result;
  },

  async findById(id: string): Promise<Referral | undefined> {
    const db = getDb();
    const [result] = await db
      .select()
      .from(referrals)
      .where(eq(referrals.id, id))
      .limit(1);
    return result;
  },

  async findByEmail(email: string): Promise<Referral | undefined> {
    const db = getDb();
    const [result] = await db
      .select()
      .from(referrals)
      .where(eq(referrals.email, email.toLowerCase().trim()))
      .limit(1);
    return result;
  },

  async list(
    opts: {
      status?: string;
      search?: string;
      from?: number;
      limit?: number;
    } = {},
  ): Promise<Referral[]> {
    const db = getDb();
    const conditions = [];
    if (opts.status) conditions.push(eq(referrals.status, opts.status));
    if (opts.search) {
      const term = `%${opts.search.toLowerCase()}%`;
      conditions.push(
        or(
          ilike(referrals.fullName, term),
          ilike(referrals.email, term),
          ilike(referrals.referredBy, term),
          ilike(referrals.jobTitle, term),
        ),
      );
    }
    const whereClause = conditions.length ? and(...conditions) : undefined;
    return db
      .select()
      .from(referrals)
      .where(whereClause)
      .orderBy(desc(referrals.createdAt))
      .limit(opts.limit ?? 5000);
  },

  async countAll(
    opts: { status?: string; search?: string } = {},
  ): Promise<number> {
    const db = getDb();
    const conditions = [];
    if (opts.status) conditions.push(eq(referrals.status, opts.status));
    if (opts.search) {
      const term = `%${opts.search.toLowerCase()}%`;
      conditions.push(
        or(
          ilike(referrals.fullName, term),
          ilike(referrals.email, term),
          ilike(referrals.referredBy, term),
          ilike(referrals.jobTitle, term),
        ),
      );
    }
    const whereClause = conditions.length ? and(...conditions) : undefined;
    const rows = await db
      .select({ n: drizzleCount() })
      .from(referrals)
      .where(whereClause);
    return rows[0]?.n ?? 0;
  },

  async countSentToday(): Promise<number> {
    const db = getDb();
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const rows = await db
      .select({ n: drizzleCount() })
      .from(referrals)
      .where(
        and(eq(referrals.status, "Sent"), gte(referrals.emailSentAt, start)),
      );
    return rows[0]?.n ?? 0;
  },

  async update(
    id: string,
    input: Partial<CreateReferralInput>,
  ): Promise<Referral | undefined> {
    const db = getDb();
    const [result] = await db
      .update(referrals)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(referrals.id, id))
      .returning();
    return result;
  },

  async enrich(
    id: string,
    detail: Record<string, string | null | undefined>,
  ): Promise<Referral | undefined> {
    const db = getDb();
    const [existing] = await db
      .select()
      .from(referrals)
      .where(eq(referrals.id, id))
      .limit(1);
    if (!existing) return undefined;
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    for (const [k, v] of Object.entries(detail)) {
      if (v) {
        const cur = (existing as Record<string, unknown>)[k];
        if (cur === null || cur === undefined || cur === "") patch[k] = v;
      }
    }
    if (Object.keys(patch).length === 1) return existing;
    const [result] = await db
      .update(referrals)
      .set(patch)
      .where(eq(referrals.id, id))
      .returning();
    return result;
  },

  async markSent(id: string, sentAt: Date): Promise<void> {
    const db = getDb();
    await db
      .update(referrals)
      .set({ status: "Sent", emailSentAt: sentAt, updatedAt: new Date() })
      .where(eq(referrals.id, id));
  },

  async recordClick(
    referralId: string,
    deviceType: string,
    at: Date,
  ): Promise<void> {
    const db = getDb();
    await db.insert(referralClicks).values({
      referralId,
      deviceType,
      clickedAt: at,
    });
    await db
      .update(referrals)
      .set({
        clickCount: sql`${referrals.clickCount} + 1`,
        lastClickedAt: at,
        lastDevice: deviceType,
        updatedAt: new Date(),
      })
      .where(eq(referrals.id, referralId));
  },

  async delete(id: string): Promise<boolean> {
    const db = getDb();
    const result = await db
      .delete(referrals)
      .where(eq(referrals.id, id))
      .returning({ id: referrals.id });
    return result.length > 0;
  },

  async getContent(): Promise<Record<string, string>> {
    const db = getDb();
    const rows = await db.select().from(referralContent);
    const map: Record<string, string> = {};
    for (const row of rows) map[row.key] = row.body;
    return map;
  },

  async setContent(entries: Record<string, string>): Promise<void> {
    const db = getDb();
    for (const [key, body] of Object.entries(entries)) {
      await db
        .insert(referralContent)
        .values({ key, body })
        .onConflictDoUpdate({
          target: referralContent.key,
          set: { body, updatedAt: new Date() },
        });
    }
  },

  async seedContentIfAbsent(entries: Record<string, string>): Promise<void> {
    const db = getDb();
    const values = Object.entries(entries).map(([key, body]) => ({
      key,
      body,
    }));
    if (values.length === 0) return;
    await db.insert(referralContent).values(values).onConflictDoNothing();
  },

  async upgradeContentAll(
    map: Record<string, { old: string; next: string }>,
  ): Promise<void> {
    const db = getDb();
    for (const [key, { old, next }] of Object.entries(map)) {
      await db
        .update(referralContent)
        .set({ body: next, updatedAt: new Date() })
        .where(
          and(eq(referralContent.key, key), eq(referralContent.body, old)),
        );
    }
  },

  async getContentOverrides(id: string): Promise<Record<string, string>> {
    const db = getDb();
    const [row] = await db
      .select({ contentOverrides: referrals.contentOverrides })
      .from(referrals)
      .where(eq(referrals.id, id))
      .limit(1);
    return row?.contentOverrides ?? {};
  },

  async setContentOverrides(
    ids: string[],
    entries: Record<string, string>,
  ): Promise<void> {
    const db = getDb();
    if (ids.length === 0) return;
    const rows = await db
      .select({
        id: referrals.id,
        contentOverrides: referrals.contentOverrides,
      })
      .from(referrals)
      .where(inArray(referrals.id, ids));
    for (const row of rows) {
      const merged = { ...(row.contentOverrides ?? {}), ...entries };
      await db
        .update(referrals)
        .set({ contentOverrides: merged, updatedAt: new Date() })
        .where(eq(referrals.id, row.id));
    }
  },

  async setContentOverridesAll(entries: Record<string, string>): Promise<void> {
    const db = getDb();
    const rows = await db
      .select({
        id: referrals.id,
        contentOverrides: referrals.contentOverrides,
      })
      .from(referrals);
    for (const row of rows) {
      const merged = { ...(row.contentOverrides ?? {}), ...entries };
      await db
        .update(referrals)
        .set({ contentOverrides: merged, updatedAt: new Date() })
        .where(eq(referrals.id, row.id));
    }
  },

  async clearContentOverrides(ids: string[], keys?: string[]): Promise<void> {
    const db = getDb();
    if (ids.length === 0) return;
    const rows = await db
      .select({
        id: referrals.id,
        contentOverrides: referrals.contentOverrides,
      })
      .from(referrals)
      .where(inArray(referrals.id, ids));
    for (const row of rows) {
      let next = { ...(row.contentOverrides ?? {}) };
      if (keys) {
        for (const k of keys) delete next[k];
      } else {
        next = {};
      }
      await db
        .update(referrals)
        .set({ contentOverrides: next, updatedAt: new Date() })
        .where(eq(referrals.id, row.id));
    }
  },

  async getSettings(): Promise<ReferralSettingsRow> {
    const db = getDb();
    const [row] = await db
      .select()
      .from(referralSettings)
      .where(eq(referralSettings.id, 1))
      .limit(1);
    if (row) return row;
    await db
      .insert(referralSettings)
      .values({ id: 1, dailySendLimit: 5 })
      .onConflictDoNothing();
    return { id: 1, dailySendLimit: 5, updatedAt: new Date() };
  },

  async setDailySendLimit(limit: number): Promise<void> {
    const db = getDb();
    await db
      .insert(referralSettings)
      .values({ id: 1, dailySendLimit: limit })
      .onConflictDoUpdate({
        target: referralSettings.id,
        set: { dailySendLimit: limit, updatedAt: new Date() },
      });
  },
};
