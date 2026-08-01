import { pgTable, text, timestamp, uuid, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const applicationStatusEnum = pgEnum("application_status", [
  "New",
  "Reviewing",
  "Shortlisted",
  "Rejected",
  "Hired",
]);

export const applications = pgTable("applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  position: text("position").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  country: text("country").notNull(),
  city: text("city").notNull(),
  timezone: text("timezone").notNull(),
  linkedinUrl: text("linkedin_url"),
  portfolioUrl: text("portfolio_url"),
  yearsExperience: text("years_experience").notNull(),
  education: text("education").notNull(),
  englishProficiency: text("english_proficiency").notNull(),
  noticePeriod: text("notice_period").notNull(),
  expectedSalary: text("expected_salary").notNull(),
  earliestStartDate: text("earliest_start_date").notNull(),
  skills: text("skills").notNull(),
  relevantExperience: text("relevant_experience").notNull(),
  coverLetter: text("cover_letter").notNull(),
  resumePath: text("resume_path"),
  resumeFilename: text("resume_filename"),
  status: applicationStatusEnum("status").default("New").notNull(),
});

export const insertApplicationSchema = createInsertSchema(applications, {
  email: z.string().email(),
  earliestStartDate: z.string().date(),
}).omit({ id: true, createdAt: true, status: true });

export type Application = typeof applications.$inferSelect;
export type CreateApplicationInput = z.infer<typeof insertApplicationSchema>;
export type ApplicationStatus = (typeof applicationStatusEnum.enumValues)[number];