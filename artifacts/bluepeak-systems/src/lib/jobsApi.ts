import type { Job } from '@/data/jobs';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

export async function fetchJobs(): Promise<Job[]> {
  const res = await fetch(`${API_BASE}/api/jobs`);
  if (!res.ok) throw new Error('Failed to load positions');
  const data = await res.json();
  return data.jobs;
}

export async function fetchJobBySlug(slug: string): Promise<Job | null> {
  const res = await fetch(`${API_BASE}/api/jobs/${encodeURIComponent(slug)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to load position');
  const data = await res.json();
  return data.job;
}
