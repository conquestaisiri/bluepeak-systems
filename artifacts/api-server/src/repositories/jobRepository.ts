import { db } from "@workspace/db";
import { jobs } from "@workspace/db/schema";
import { eq, desc, and } from "drizzle-orm";
import type { Job, CreateJobInput } from "@workspace/db/schema";

export const jobRepository = {
  async create(input: CreateJobInput): Promise<Job> {
    const [result] = await db.insert(jobs).values(input).returning();
    return result;
  },

  async findById(id: string): Promise<Job | undefined> {
    const [result] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
    return result;
  },

  async findBySlug(slug: string, includeInactive = false): Promise<Job | undefined> {
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
    if (includeInactive) {
      return db.select().from(jobs).orderBy(desc(jobs.postedDate));
    }
    return db.select().from(jobs).where(eq(jobs.isActive, true)).orderBy(desc(jobs.postedDate));
  },

  async update(id: string, input: Partial<CreateJobInput>): Promise<Job | undefined> {
    const [result] = await db
      .update(jobs)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(jobs.id, id))
      .returning();
    return result;
  },

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(jobs).where(eq(jobs.id, id));
    return (result.rowCount ?? 0) > 0;
  },
};
