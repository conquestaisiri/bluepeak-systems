import { randomUUID } from "node:crypto";
import db from "../db/database";
import type { Application, ApplicationStatus, CreateApplicationInput } from "../models/application";

export const applicationRepository = {
  create(input: CreateApplicationInput): Application {
    const id = randomUUID();
    const created_at = new Date().toISOString();
    const status: ApplicationStatus = "New";

    const stmt = db.prepare(`
      INSERT INTO applications (
        id, created_at, position, full_name, email, phone, country, city, timezone,
        linkedin_url, portfolio_url, years_experience, education, english_proficiency,
        notice_period, expected_salary, earliest_start_date, skills, relevant_experience,
        cover_letter, resume_path, resume_filename, status
      ) VALUES (
        @id, @created_at, @position, @full_name, @email, @phone, @country, @city, @timezone,
        @linkedin_url, @portfolio_url, @years_experience, @education, @english_proficiency,
        @notice_period, @expected_salary, @earliest_start_date, @skills, @relevant_experience,
        @cover_letter, @resume_path, @resume_filename, @status
      )
    `);

    stmt.run({ id, created_at, status, ...input });

    return { id, created_at, status, ...input };
  },

  findById(id: string): Application | undefined {
    return db
      .prepare("SELECT * FROM applications WHERE id = ?")
      .get(id) as Application | undefined;
  },

  findAll(): Application[] {
    return db
      .prepare("SELECT * FROM applications ORDER BY created_at DESC")
      .all() as Application[];
  },

  updateStatus(id: string, status: ApplicationStatus): boolean {
    const result = db
      .prepare("UPDATE applications SET status = ? WHERE id = ?")
      .run(status, id);
    return result.changes > 0;
  },
};
