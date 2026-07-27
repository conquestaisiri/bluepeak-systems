export type ApplicationStatus =
  | "New"
  | "Reviewing"
  | "Shortlisted"
  | "Rejected"
  | "Hired";

export interface Application {
  id: string;
  created_at: string;
  position: string;
  full_name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  timezone: string;
  linkedin_url: string | null;
  portfolio_url: string | null;
  years_experience: string;
  education: string;
  english_proficiency: string;
  notice_period: string;
  expected_salary: string;
  earliest_start_date: string;
  skills: string;
  relevant_experience: string;
  cover_letter: string;
  resume_path: string | null;
  resume_filename: string | null;
  status: ApplicationStatus;
}

export type CreateApplicationInput = Omit<Application, "id" | "created_at" | "status">;
