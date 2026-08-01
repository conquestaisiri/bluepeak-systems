import { db } from "@workspace/db";
import { applications } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import type { Application, ApplicationStatus, CreateApplicationInput } from "@workspace/db/schema";

export const applicationRepository = {
  async create(input: CreateApplicationInput): Promise<Application> {
    const [result] = await db.insert(applications).values(input).returning();
    return result;
  },

  async findById(id: string): Promise<Application | undefined> {
    const [result] = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
    return result;
  },

  async findAll(): Promise<Application[]> {
    return db.select().from(applications).orderBy(desc(applications.createdAt));
  },

  async updateStatus(id: string, status: ApplicationStatus): Promise<boolean> {
    const result = await db.update(applications).set({ status }).where(eq(applications.id, id));
    return (result.rowCount ?? 0) > 0;
  },

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(applications).where(eq(applications.id, id));
    return (result.rowCount ?? 0) > 0;
  },
};