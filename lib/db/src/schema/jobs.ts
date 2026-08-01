import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";

export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  department: text("department").notNull(),
  employmentType: text("employment_type").notNull(),
  workArrangement: text("work_arrangement").notNull(),
  experienceLevel: text("experience_level").notNull(),
  experience: text("experience").notNull(),
  compensation: text("compensation").notNull(),
  postedDate: text("posted_date").notNull(),
  summary: text("summary").notNull(),
  overview: text("overview").notNull(),
  responsibilities: text("responsibilities").array().notNull().default([]),
  requiredQualifications: text("required_qualifications").array().notNull().default([]),
  preferredQualifications: text("preferred_qualifications").array().notNull().default([]),
  skills: text("skills").array().notNull().default([]),
  softwareTools: text("software_tools").array().notNull().default([]),
  benefits: text("benefits").array().notNull().default([]),
  workingHours: text("working_hours").notNull(),
  hiringProcess: text("hiring_process").array().notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Job = typeof jobs.$inferSelect;
export type CreateJobInput = typeof jobs.$inferInsert;
