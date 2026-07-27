import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "bluepeak.db");

fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS applications (
    id                  TEXT PRIMARY KEY,
    created_at          TEXT NOT NULL,
    position            TEXT NOT NULL,
    full_name           TEXT NOT NULL,
    email               TEXT NOT NULL,
    phone               TEXT NOT NULL,
    country             TEXT NOT NULL,
    city                TEXT NOT NULL,
    timezone            TEXT NOT NULL,
    linkedin_url        TEXT,
    portfolio_url       TEXT,
    years_experience    TEXT NOT NULL,
    education           TEXT NOT NULL,
    english_proficiency TEXT NOT NULL,
    notice_period       TEXT NOT NULL,
    expected_salary     TEXT NOT NULL,
    earliest_start_date TEXT NOT NULL,
    skills              TEXT NOT NULL,
    relevant_experience TEXT NOT NULL,
    cover_letter        TEXT NOT NULL,
    resume_path         TEXT,
    resume_filename     TEXT,
    status              TEXT NOT NULL DEFAULT 'New'
  )
`);

export default db;
