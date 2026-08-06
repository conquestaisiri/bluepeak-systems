import { neon } from "@neondatabase/serverless";
import { getEnv } from "../config";
import { referralRepository } from "../repositories";
import { emailService } from "./email";
import type { CreateReferralInput, Referral } from "../schema";

const REFERRAL_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code text NOT NULL UNIQUE,
  full_name text NOT NULL,
  email text,
  referred_by text,
  job_title text,
  meeting_url text,
  status text NOT NULL DEFAULT 'Pending',
  email_sent_at timestamptz,
  click_count integer NOT NULL DEFAULT 0,
  last_clicked_at timestamptz,
  last_device text,
  content_overrides jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE referrals ADD COLUMN IF NOT EXISTS click_count integer NOT NULL DEFAULT 0;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS last_clicked_at timestamptz;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS last_device text;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS content_overrides jsonb NOT NULL DEFAULT '{}';
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS zip_code text;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS notes text;

CREATE TABLE IF NOT EXISTS referral_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id uuid NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
  device_type text NOT NULL DEFAULT 'unknown',
  clicked_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS referral_content (
  key text PRIMARY KEY,
  body text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS referral_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  daily_send_limit integer NOT NULL DEFAULT 5,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO referral_settings (id, daily_send_limit) VALUES (1, 5)
ON CONFLICT (id) DO NOTHING;
`;

const DEFAULT_REFERRAL_CONTENT: Record<string, string> = {
  heroTitle: "You've been referred",
  heroSubtitle: "A private opportunity from BluePeak Systems",
  intro: `Hi {name}, {referredBy} referred you for this opportunity, and we've personally selected you to review it. Please read through everything below carefully before you do anything, so you know exactly what to expect.`,
  aboutRoleTitle: "About the role",
  aboutRoleBody: `This is a real, paid {position} role with BluePeak Systems. Depending on the position, it may be fully remote, in-person at a site, or a mix of both — the exact setup is decided by whoever manages the work, and you'll get the precise details during your onboarding. This is not a commission-only or pyramid situation: you are being hired to do a defined job for fair, guaranteed pay, and the team will walk you through everything step by step.`,
  roleMetaTitle: "What to expect",
  roleMetaBody: `• Clear, realistic pay that you'll be told in full before you commit.\n• A set schedule (or agreed hours) so you always know when you're working.\n• Simple, hands-on training — no experience or special software needed.\n• A real point of contact who answers when you have questions.\n\nIf anything below seems off or you're ever uncertain, stop, contact us, and we'll clarify — never pay anyone to "start" a job.`,
  whatYouDoTitle: "What you'll be doing",
  whatYouDoBody: `You'll join a small team handling the day-to-day work for this role. Some roles are done on a laptop (support, admin, marketing, finance); others are hands-on at a location (packing, cleaning, retail, facilities, field work). Either way you'll get full training and support — you don't need to bring any special software, tools, or experience to get started.`,
  payTitle: "Pay & earnings",
  payBody: `Pay is clear, agreed in advance, and predictable. You'll be given your exact rate, how and how often you get paid, and what to do if you have trouble receiving a payment during your onboarding. We do not ask for payments, fees, or "hold" money at any point.`,
  howWorksTitle: "How it works",
  howWorksBody: `Getting set up is simple and takes a few minutes. Your next step is a short guided workshop on your laptop or desktop that explains the role fully — what you'll do, what will be expected, how your pay works, and when things happen. This is not an interview and nothing is judged; it's simply how we onboard you and answer your questions one-by-one.`,
  getStartedTitle: "Your next step",
  getStartedBody: `When you're ready, use the button on this page to continue. Please do this on a laptop or desktop computer rather than a phone, because the workshop and its screens need to open on a larger screen to work properly.`,
  workshopTitle: "About your workshop",
  workshopBody: `The guided workshop explains three things clearly: 1) exactly what the role involves and what will be expected of you each week, 2) your pay — the rate, how and when you're paid, 3) the simple next steps to get working. It is designed to be honest and complete so there are no surprises.`,
  companyTitle: "About BluePeak Systems",
  companyBody: `BluePeak Systems helps businesses in 28+ countries build and run teams. We connect people to work they can actually do and pay them fairly — whether the role is done from a laptop at home or hands-on at a site. You're not a number here; you'll have a real point of contact throughout.`,
  ctaLabel: "Continue to your next step",
  workTypeLabel: "Any location · remote or in-person",
  sidebarLaptopNote: "Workshop needs a laptop or desktop",
  supportTitle: "Need help?",
  supportBody: `If anything here isn't responding or you have any questions at all, contact us right away we'll help.`,
  securityNote: `This invitation is private to you. Only use links sent to you through this page or in your invitation email. We will never ask you to pay to apply or to start.`,
  gateTitle: "Please continue on a laptop or desktop",
  gateSubtitle: "Your next step needs a computer",
  gateDetected: "You're viewing this on a phone or tablet.",
  gateBody: `Your next step is a guided workshop that explains your role, what will be expected of you, how your pay works, and everything else. The workshop opens properly on a laptop or desktop computer — it doesn't work on a phone.`,
  gateAction: `Please open this same link on a PC or laptop and click continue there. If you don't have one handy, let us know and we'll help you get set up.`,
  gateLaptopHelp: "Already on a laptop or desktop?",
  gateLaptopHelpBody: `Try reloading this page, or copy this link into your computer's browser:`,
  gateBackLabel: "Go back",
  emailSubject: "You've been referred for a {position} role",
  emailGreeting: "Hi {name},",
  emailBody: `Someone from BluePeak Systems referred you, and we'd love for you to review this opportunity. We open a limited number of spots each week and you've been selected to review this one. Open your invite below — it explains the role, your pay, and your exact next steps. Please review it on a laptop or desktop if you can.`,
  emailCtaLabel: "Open my invitation",
  emailClosing: `We've put everything you need on the page — the role, how it works, your pay, and what's next. When you're ready, follow the steps inside.`,
};

// Replace the old shallow defaults with the richer copy — only where the stored
// value still equals a known old default (so admin edits are never overwritten).
const OLD_TO_NEW_CONTENT: Record<string, { old: string; next: string }> = {
  intro: {
    old: `Hi {name}, {referredBy} referred you for a role, and we've selected you to review this opportunity. Please read through everything below, then take your next step.`,
    next: DEFAULT_REFERRAL_CONTENT.intro,
  },
  aboutRoleBody: {
    old: `This is a real, paid {position} role. Depending on the position it may be fully remote, in-person, or a mix — the details are set by whoever manages the work. You'll get exact specifics during your onboarding, including schedule and location.`,
    next: DEFAULT_REFERRAL_CONTENT.aboutRoleBody,
  },
  whatYouDoBody: {
    old: `You'll be part of a small team handling day-to-day tasks for the role. Full training and support are provided — you don't need any special software or experience to get started. Some roles are done from a laptop, and others involve hands-on work at a site.`,
    next: DEFAULT_REFERRAL_CONTENT.whatYouDoBody,
  },
  payBody: {
    old: `Pay is clear and predictable. You'll be given exact details during your onboarding call, including your rate and how and when you'll be paid.`,
    next: DEFAULT_REFERRAL_CONTENT.payBody,
  },
  howWorksBody: {
    old: `Learning how this role works takes just a few minutes. It's a straightforward setup powered by simple guidance we share with you — not a formal interview, and no experience is required.`,
    next: DEFAULT_REFERRAL_CONTENT.howWorksBody,
  },
  supportBody: {
    old: `If anything here isn't clear or you have any questions, contact us right away and the person who referred you will help.`,
    next: DEFAULT_REFERRAL_CONTENT.supportBody,
  },
  securityNote: {
    old: `This invitation is private to you. Only use links shared through this page or in your invitation email.`,
    next: DEFAULT_REFERRAL_CONTENT.securityNote,
  },
  emailBody: {
    old: `Someone from BluePeak Systems referred you, and we'd love for you to review this opportunity. We open a limited number of spots each week, and you've been selected to review this one. We've opened everything you need on the page below.`,
    next: DEFAULT_REFERRAL_CONTENT.emailBody,
  },
  emailClosing: {
    old: `We've put everything you need on the page below — the role, how it works, and what's next. When you're ready, just follow the steps inside.`,
    next: DEFAULT_REFERRAL_CONTENT.emailClosing,
  },
};

async function runReferralSchema(): Promise<void> {
  const { DATABASE_URL } = getEnv();
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL must be set");
  }
  const sql = neon(DATABASE_URL);
  for (const statement of REFERRAL_SCHEMA_SQL.split(";")) {
    const trimmed = statement.trim();
    if (trimmed) {
      await sql(trimmed);
    }
  }
  // Seed only rows that are absent; then upgrade the old shallow defaults to the
  // richer copy only where the stored value still equals a known old default, so
  // any admin customization is never overwritten.
  await referralRepository.seedContentIfAbsent(DEFAULT_REFERRAL_CONTENT);
  await referralRepository.upgradeContentAll(OLD_TO_NEW_CONTENT);
}

export async function ensureReferralSchema(): Promise<void> {
  await runReferralSchema();
}

let schemaEnsured = false;
let schemaPromise: Promise<void> | null = null;

export function ensureReferralSchemaOnce(): Promise<void> {
  if (schemaEnsured) return Promise.resolve();
  if (!schemaPromise) {
    schemaPromise = runReferralSchema().then(() => {
      schemaEnsured = true;
    });
  }
  return schemaPromise;
}

export function publicReferralUrl(code: string): string {
  const base = (
    getEnv().FRONTEND_URL ?? "https://bluepeak.payservice.top"
  ).replace(/\/$/, "");
  return `${base}/referral/${code}`;
}

export function interpolate(
  template: string,
  values: Record<string, string>,
): string {
  return template.replace(
    /\{(name|position|referredBy|code|link)\}/g,
    (_, key: string) => values[key] ?? "",
  );
}

export const referralService = {
  async create(input: CreateReferralInput) {
    const email = input.email?.trim().toLowerCase() || null;
    if (email) {
      const existing = await referralRepository.findByEmail(email);
      if (existing) {
        throw new Error(`A referral for ${email} already exists`);
      }
    }
    return referralRepository.create({ ...input, email });
  },

  async importMany(
    rows: Array<{
      fullName: string;
      email?: string;
      referredBy?: string;
      jobTitle?: string;
      meetingUrl?: string;
      phone?: string;
      city?: string;
      country?: string;
      address?: string;
      zipCode?: string;
      source?: string;
      notes?: string;
    }>,
  ) {
    const created: Referral[] = [];
    const updated: Referral[] = [];
    const skipped: string[] = [];
    for (const row of rows) {
      const fullName = (row.fullName ?? "").trim();
      if (!fullName) {
        skipped.push("unnamed row");
        continue;
      }
      const email = (row.email ?? "").trim().toLowerCase() || null;
      const detail = {
        phone: (row.phone ?? "").trim() || null,
        city: (row.city ?? "").trim() || null,
        country: (row.country ?? "").trim() || null,
        address: (row.address ?? "").trim() || null,
        zipCode: (row.zipCode ?? "").trim() || null,
        source: (row.source ?? "").trim() || null,
        notes: (row.notes ?? "").trim() || null,
      };
      try {
        if (email) {
          const existing = await referralRepository.findByEmail(email);
          if (existing) {
            // Enrich the existing row with any previously missing detail rather
            // than dropping the import. The existing record keeps its code and
            // status; only blank fields are filled.
            const enriched = await referralRepository.enrich(
              existing.id,
              detail,
            );
            if (enriched) updated.push(enriched);
            continue;
          }
        }
        const input: CreateReferralInput = {
          fullName,
          email,
          referredBy: (row.referredBy ?? "").trim() || null,
          jobTitle: (row.jobTitle ?? "").trim() || null,
          meetingUrl: (row.meetingUrl ?? "").trim() || null,
          phone: (row.phone ?? "").trim() || null,
          city: (row.city ?? "").trim() || null,
          country: (row.country ?? "").trim() || null,
          address: (row.address ?? "").trim() || null,
          zipCode: (row.zipCode ?? "").trim() || null,
          source: (row.source ?? "").trim() || null,
          notes: (row.notes ?? "").trim() || null,
        };
        created.push(await referralRepository.create(input));
      } catch (err) {
        skipped.push(`${fullName} - ${(err as Error).message}`);
      }
    }
    return { created, updated, skipped };
  },

  async list(opts: { status?: string; search?: string } = {}) {
    const referrals = await referralRepository.list(opts);
    const total = await referralRepository.countAll(opts);
    return { referrals, total };
  },

  async listAll() {
    return referralRepository.list();
  },

  async getByCode(code: string) {
    return referralRepository.findByCode(code);
  },

  async recordClick(
    code: string,
    deviceType: string,
  ): Promise<Referral | null> {
    const referral = await referralRepository.findByCode(code);
    if (!referral) return null;
    await referralRepository.recordClick(
      referral.id,
      deviceType === "mobile" ? "mobile" : "laptop",
      new Date(),
    );
    return (await referralRepository.findById(referral.id)) ?? null;
  },

  async getById(id: string) {
    return referralRepository.findById(id);
  },

  async update(id: string, input: Partial<CreateReferralInput>) {
    return referralRepository.update(id, input);
  },

  async delete(id: string) {
    return referralRepository.delete(id);
  },

  async getContent() {
    return referralRepository.getContent();
  },

  async setContent(entries: Record<string, string>) {
    await referralRepository.setContent(entries);
    return referralRepository.getContent();
  },

  async getContentForReferral(referral: Referral) {
    const global = await referralRepository.getContent();
    const overrides = await referralRepository.getContentOverrides(referral.id);
    return { ...global, ...overrides };
  },

  async setContentOverrides(ids: string[], entries: Record<string, string>) {
    await referralRepository.setContentOverrides(ids, entries);
  },

  async setContentOverridesAll(entries: Record<string, string>) {
    await referralRepository.setContentOverridesAll(entries);
  },

  async clearContentOverrides(ids: string[], keys?: string[]) {
    await referralRepository.clearContentOverrides(ids, keys);
  },

  async getSettings() {
    return referralRepository.getSettings();
  },

  async setDailySendLimit(limit: number) {
    const clamped = Math.max(1, Math.min(100, limit));
    await referralRepository.setDailySendLimit(clamped);
    return referralRepository.getSettings();
  },

  async getSendStatus() {
    const settings = await referralRepository.getSettings();
    const sentToday = await referralRepository.countSentToday();
    return {
      dailyLimit: settings.dailySendLimit,
      sentToday,
      remaining: Math.max(0, settings.dailySendLimit - sentToday),
    };
  },

  async sendToReferrals(ids: string[], count?: number) {
    const status = await this.getSendStatus();
    const requested =
      Number.isFinite(count) && (count as number) > 0
        ? Math.floor(count as number)
        : ids.length;
    const cap = Math.min(requested, status.remaining);
    const sendable = ids.slice(0, Math.max(0, cap));
    const content = await referralRepository.getContent();

    let sent = 0;
    const failed: Array<{ id: string; name: string; error: string }> = [];

    for (const id of sendable) {
      const referral = await referralRepository.findById(id);
      if (!referral) {
        failed.push({ id, name: "unknown", error: "Not found" });
        continue;
      }
      if (!referral.email) {
        failed.push({ id, name: referral.fullName, error: "No email address" });
        continue;
      }
      if (referral.status === "Sent") {
        failed.push({ id, name: referral.fullName, error: "Already sent" });
        continue;
      }
      try {
        const vars = {
          name: referral.fullName,
          position: referral.jobTitle ?? "this role",
          referredBy: referral.referredBy ?? "a member of our team",
          code: referral.referralCode,
        };
        await emailService.sendReferralInvitation({
          email: referral.email,
          fullName: referral.fullName,
          referredBy: referral.referredBy,
          jobTitle: referral.jobTitle,
          referralCode: referral.referralCode,
          subject: interpolate(
            content.emailSubject ??
              "You''ve been referred for a {position} role",
            vars,
          ),
          greeting: interpolate(content.emailGreeting ?? "Hi {name},", vars),
          body: interpolate(content.emailBody ?? "", vars),
          ctaLabel: content.emailCtaLabel ?? "Open my invitation",
          closing: interpolate(content.emailClosing ?? "", vars),
        });
        await referralRepository.markSent(id, new Date());
        sent++;
      } catch (err) {
        failed.push({
          id,
          name: referral.fullName,
          error: (err as Error).message,
        });
      }
    }

    const updatedStatus = await this.getSendStatus();
    return { sent, failed, status: updatedStatus };
  },
};
