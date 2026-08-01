import { db } from "@workspace/db";
import { applications } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import type { Application, ApplicationStatus, CreateApplicationInput } from "@workspace/db/schema";

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
    let referenceCode: string;
    let attempts = 0;
    do {
      referenceCode = generateReferenceCode();
      const exists = await db.select({ id: applications.id })
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
    return db.select().from(applications).where(eq(applications.email, email)).orderBy(desc(applications.createdAt));
  },

  async findByReferenceCode(referenceCode: string): Promise<Application | undefined> {
    const [result] = await db
      .select()
      .from(applications)
      .where(eq(applications.referenceCode, referenceCode))
      .limit(1);
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