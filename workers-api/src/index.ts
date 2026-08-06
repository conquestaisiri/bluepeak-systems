import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";

import { applicationService } from "./services/applications";
import { jobService, ValidationError } from "./services/jobs";
import { authService } from "./services/auth";
import { emailService } from "./services/email";
import { storageService } from "./services/storage";
import {
  referralService,
  publicReferralUrl,
  ensureReferralSchemaOnce,
} from "./services/referrals";
import { initEnv, getEnv } from "./config";
import type { Env } from "./env";
import type { ApplicationStatus } from "./schema";

type Variables = {
  user: { id: string; email: string; role: string };
};

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.use("*", async (c, next) => {
  initEnv(c.env);
  await next();
});

// Middleware
app.use("*", logger());
app.use("*", cors());

// Rate limiting (simple in-memory for Workers)
const rateLimits = new Map<string, { count: number; reset: number }>();

function rateLimit(max: number, windowMs: number, message: string) {
  return async (c: any, next: any) => {
    const ip = c.req.header("cf-connecting-ip") || "unknown";
    const key = `${c.req.path}:${ip}`;
    const now = Date.now();
    const limit = rateLimits.get(key);

    if (!limit || now > limit.reset) {
      rateLimits.set(key, { count: 1, reset: now + windowMs });
      return next();
    }

    if (limit.count >= max) {
      return c.json({ error: message }, 429);
    }

    limit.count++;
    return next();
  };
}

const apiLimiter = rateLimit(
  100,
  15 * 60 * 1000,
  "Too many requests, please try again later",
);
const applicationLimiter = rateLimit(
  10,
  60 * 60 * 1000,
  "Too many applications submitted, please try again later",
);
const contactLimiter = rateLimit(
  20,
  60 * 60 * 1000,
  "Too many messages submitted, please try again later",
);
const magicLinkLimiter = rateLimit(
  5,
  15 * 60 * 1000,
  "Too many sign-in attempts, please try again later",
);

app.use("/api/*", apiLimiter);
app.use("/api/applications", applicationLimiter);
app.use("/api/contact", contactLimiter);
app.use("/api/auth/magic-link", magicLinkLimiter);

// Health check
app.get("/api/healthz", (c) =>
  c.json({ status: "ok", timestamp: new Date().toISOString() }),
);

// ============================================
// PUBLIC JOBS
// ============================================
app.get("/api/jobs", async (c) => {
  try {
    const jobs = await jobService.listPublic();
    return c.json({ jobs });
  } catch (err) {
    console.error({ err }, "Failed to fetch jobs");
    return c.json({ error: "Failed to retrieve jobs" }, 500);
  }
});

app.get("/api/jobs/:slug", async (c) => {
  try {
    const job = await jobService.getBySlug(c.req.param("slug"));
    if (!job) {
      return c.json({ error: "Job not found" }, 404);
    }
    return c.json({ job });
  } catch (err) {
    console.error({ err }, "Failed to fetch job");
    return c.json({ error: "Failed to retrieve job" }, 500);
  }
});

// ============================================
// APPLICATIONS (PUBLIC - Submit)
// ============================================
const applicationSchema = z.object({
  position: z.string().min(1),
  fullName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  country: z.string().min(1),
  city: z.string().min(1),
  timezone: z.string().min(1),
  linkedinUrl: z.string().url().optional().nullable(),
  portfolioUrl: z.string().url().optional().nullable(),
  yearsExperience: z.string().min(1),
  education: z.string().min(1),
  englishProficiency: z.string().min(1),
  noticePeriod: z.string().min(1),
  expectedSalary: z.string().min(1),
  earliestStartDate: z.string().date(),
  skills: z.string().min(1),
  relevantExperience: z.string().min(1),
  coverLetter: z.string().min(1),
});

app.post("/api/applications", async (c) => {
  try {
    const formData = await c.req.formData();

    const body: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      if (key !== "resume") {
        body[key] = value as string;
      }
    }

    const parsed = applicationSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.errors[0].message }, 400);
    }

    const file = formData.get("resume") as File | null;
    let resumeFile:
      | {
          buffer: ArrayBuffer;
          originalname: string;
          mimetype: string;
          size: number;
        }
      | undefined;

    if (file && file.size > 0) {
      const buffer = await file.arrayBuffer();
      resumeFile = {
        buffer,
        originalname: file.name,
        mimetype: file.type,
        size: file.size,
      };
    }

    const application = await applicationService.create(
      parsed.data,
      resumeFile,
    );

    // Keep the Worker alive until the async emails finish sending (isolate may
    // otherwise freeze as soon as the response is returned).
    c.executionCtx.waitUntil(applicationService.sendEmailsAsync(application));

    console.log(
      { applicationId: application.id, position: application.position },
      "New application received",
    );

    return c.json(
      {
        success: true,
        applicationId: application.id,
        message:
          "Application submitted successfully. Check your email for confirmation.",
      },
      201,
    );
  } catch (err) {
    console.error({ err }, "Failed to submit application");
    return c.json(
      { error: "An unexpected error occurred. Please try again." },
      500,
    );
  }
});

// ============================================
// CONTACT FORM
// ============================================
const contactSchema = z.object({
  firstName: z.string().min(1).max(100),
  email: z.string().email(),
  interest: z.enum([
    "Build or staff a team",
    "Find my next role",
    "Hiring advice",
    "Something else",
  ]),
  message: z.string().min(10).max(5000),
});

app.post("/api/contact", async (c) => {
  try {
    const body = await c.req.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.errors[0].message }, 400);
    }

    await emailService.sendContactNotification(parsed.data);

    console.log(
      { from: parsed.data.email, interest: parsed.data.interest },
      "New contact message",
    );

    return c.json(
      {
        success: true,
        message: "Message sent successfully. We'll be in touch shortly.",
      },
      201,
    );
  } catch (err) {
    console.error({ err }, "Failed to send contact message");
    return c.json(
      { error: "An unexpected error occurred. Please try again." },
      500,
    );
  }
});

// ============================================
// CANDIDATE AUTH (Magic Link)
// ============================================
const magicLinkSchema = z.object({ email: z.string().email() });

app.post("/api/auth/magic-link", async (c) => {
  try {
    const parsed = magicLinkSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json({ error: "A valid email address is required" }, 400);
    }

    const normalized = parsed.data.email.toLowerCase().trim();

    const token = await authService.generateMagicToken(normalized);
    const linkUrl = authService.buildMagicLinkUrl(token);

    await emailService.sendMagicLink({ email: normalized, linkUrl });

    console.log({ email: normalized }, "Magic link sent");
    return c.json({
      success: true,
      message: "Check your email for a magic link.",
    });
  } catch (err) {
    console.error({ err }, "Failed to send magic link");
    return c.json({ error: "Failed to send magic link" }, 500);
  }
});

app.get("/api/auth/verify", async (c) => {
  try {
    const token = c.req.query("token");
    if (!token) {
      return c.json({ error: "Token is required" }, 400);
    }

    const email = await authService.consumeMagicToken(token);
    if (!email) {
      return c.json({ error: "Invalid or expired token" }, 401);
    }

    const sessionToken = await authService.generateSessionToken(email);
    console.log({ email }, "Magic link verified, session issued");
    return c.json({ token: sessionToken, email });
  } catch (err) {
    console.error({ err }, "Failed to verify magic link");
    return c.json({ error: "Invalid or expired token" }, 401);
  }
});

// ============================================
// ADMIN AUTH (JWT)
// ============================================
const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

app.post("/api/admin/login", async (c) => {
  try {
    const parsed = adminLoginSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    const { ADMIN_EMAIL, ADMIN_PASSWORD, JWT_SECRET } = getEnv();

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set");
    }

    if (
      parsed.data.email !== ADMIN_EMAIL ||
      parsed.data.password !== ADMIN_PASSWORD
    ) {
      console.warn({ email: parsed.data.email }, "Failed admin login attempt");
      return c.json({ error: "Invalid credentials" }, 401);
    }

    const token = await new SignJWT({ email: ADMIN_EMAIL, role: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(new TextEncoder().encode(JWT_SECRET));

    return c.json({ token, user: { email: ADMIN_EMAIL, role: "admin" } });
  } catch (err) {
    console.error({ err }, "Admin login error");
    return c.json({ error: "Login failed" }, 500);
  }
});

async function verifyAdminJwt(
  token: string,
): Promise<{ email: string; role: string } | null> {
  try {
    const { JWT_SECRET } = getEnv();
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(JWT_SECRET),
    );
    const role = payload.role as string;
    if (role !== "admin" && role !== "hr") {
      return null;
    }
    return { email: payload.email as string, role };
  } catch {
    return null;
  }
}

// Admin auth middleware
const adminAuth = async (c: any, next: any) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid authorization header" }, 401);
  }

  const token = authHeader.slice(7);
  const decoded = await verifyAdminJwt(token);
  if (!decoded) {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
  c.set("user", {
    id: decoded.email,
    email: decoded.email,
    role: decoded.role,
  });
  return next();
};

// Candidate auth middleware
const candidateAuth = async (c: any, next: any) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid authorization header" }, 401);
  }

  const token = authHeader.slice(7);

  const validation = await authService.validateSessionToken(token);
  if (!validation) {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
  if (!validation.valid) {
    return c.json({ error: "Session expired or revoked" }, 401);
  }

  c.set("user", {
    id: validation.email,
    email: validation.email,
    role: "candidate",
  });
  return next();
};

// ============================================
// ADMIN ROUTES
// ============================================
app.get("/api/admin/stats", adminAuth, async (c) => {
  try {
    const applications = await applicationService.list();
    const stats = {
      total: applications.length,
      byStatus: applications.reduce(
        (acc, a) => {
          acc[a.status] = (acc[a.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
      byPosition: applications.reduce(
        (acc, a) => {
          acc[a.position] = (acc[a.position] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
      recentApplications: applications.slice(0, 10),
    };
    return c.json({ stats });
  } catch (err) {
    console.error({ err }, "Failed to fetch stats");
    return c.json({ error: "Failed to retrieve statistics" }, 500);
  }
});

app.get("/api/admin/applications", adminAuth, async (c) => {
  try {
    const page = Math.max(1, parseInt(c.req.query("page") || "1"));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(c.req.query("limit") || "20")),
    );
    const status = c.req.query("status");
    const search = c.req.query("search");

    let applications = await applicationService.list();

    if (status) {
      applications = applications.filter((a) => a.status === status);
    }

    if (search) {
      const s = search.toLowerCase();
      applications = applications.filter(
        (a) =>
          a.fullName.toLowerCase().includes(s) ||
          a.email.toLowerCase().includes(s) ||
          a.position.toLowerCase().includes(s),
      );
    }

    const total = applications.length;
    const start = (page - 1) * limit;
    const paginated = applications.slice(start, start + limit);

    return c.json({
      applications: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error({ err }, "Failed to fetch applications");
    return c.json({ error: "Failed to retrieve applications" }, 500);
  }
});

app.get("/api/admin/applications/:id", adminAuth, async (c) => {
  try {
    const application = await applicationService.getById(c.req.param("id"));
    if (!application) {
      return c.json({ error: "Application not found" }, 404);
    }
    return c.json({ application });
  } catch (err) {
    console.error({ err }, "Failed to fetch application");
    return c.json({ error: "Failed to retrieve application" }, 500);
  }
});

const validStatuses = ["New", "Reviewing", "Shortlisted", "Rejected", "Hired"];

app.patch("/api/admin/applications/:id/status", adminAuth, async (c) => {
  try {
    const body = await c.req.json();
    const {
      status,
      notes,
      meetLink,
      interviewInstructions,
      meetingKey,
      notifyCandidate,
    } = body as {
      status: string;
      notes?: string;
      meetLink?: string | null;
      interviewInstructions?: string | null;
      meetingKey?: string | null;
      notifyCandidate?: boolean;
    };

    if (!validStatuses.includes(status)) {
      return c.json({ error: "Invalid status" }, 400);
    }

    const application = await applicationService.updateStatus(
      c.req.param("id"),
      status as ApplicationStatus,
      {
        notes,
        meetLink,
        interviewInstructions,
        meetingKey,
        notifyCandidate,
      },
    );
    if (!application) {
      return c.json({ error: "Application not found" }, 404);
    }

    console.log(
      { applicationId: application.id, status },
      "Application status updated",
    );
    return c.json({ application });
  } catch (err) {
    console.error({ err }, "Failed to update application status");
    return c.json({ error: "Failed to update application status" }, 500);
  }
});

app.get("/api/admin/applications/:id/resume", adminAuth, async (c) => {
  try {
    const application = await applicationService.getById(c.req.param("id"));
    if (!application) {
      return c.json({ error: "Application not found" }, 404);
    }
    if (!application.resumePath) {
      return c.json({ error: "No resume uploaded" }, 404);
    }
    const object = await storageService.getObject(application.resumePath);
    if (!object) {
      return c.json({ error: "Resume not found in storage" }, 404);
    }
    const contentType = object.httpMetadata?.contentType ?? "application/pdf";
    const contentDisposition = application.resumeFilename
      ? `inline; filename="${application.resumeFilename.replace(/"/g, "")}"`
      : "inline";
    return c.body(object.body as any, 200, {
      "Content-Type": contentType,
      "Content-Disposition": contentDisposition,
      "Cache-Control": "private, max-age=300",
    });
  } catch (err) {
    console.error({ err }, "Failed to download resume");
    return c.json({ error: "Failed to download resume" }, 500);
  }
});

app.delete("/api/admin/applications/:id", adminAuth, async (c) => {
  try {
    const deleted = await applicationService.deleteApplication(
      c.req.param("id"),
    );
    if (!deleted) {
      return c.json({ error: "Application not found" }, 404);
    }
    console.log({ applicationId: c.req.param("id") }, "Application deleted");
    return c.json({ success: true, message: "Application deleted" });
  } catch (err) {
    console.error({ err }, "Failed to delete application");
    return c.json({ error: "Failed to delete application" }, 500);
  }
});

// ============================================
// ADMIN JOBS
// ============================================
app.get("/api/admin/jobs", adminAuth, async (c) => {
  try {
    const jobs = await jobService.listAdmin();
    return c.json({ jobs });
  } catch (err) {
    console.error({ err }, "Failed to fetch jobs");
    return c.json({ error: "Failed to retrieve jobs" }, 500);
  }
});

app.get("/api/admin/jobs/:id", adminAuth, async (c) => {
  try {
    const job = await jobService.getById(c.req.param("id"));
    if (!job) {
      return c.json({ error: "Job not found" }, 404);
    }
    return c.json({ job });
  } catch (err) {
    console.error({ err }, "Failed to fetch job");
    return c.json({ error: "Failed to retrieve job" }, 500);
  }
});

app.post("/api/admin/jobs", adminAuth, async (c) => {
  try {
    const body = await c.req.json();
    const job = await jobService.create(body);
    console.log({ jobId: job.id, slug: job.slug }, "Job created");
    return c.json({ job }, 201);
  } catch (err) {
    if (err instanceof ValidationError) {
      return c.json({ error: err.message }, 400);
    }
    console.error({ err }, "Failed to create job");
    return c.json({ error: "Failed to create job" }, 500);
  }
});

app.put("/api/admin/jobs/:id", adminAuth, async (c) => {
  try {
    const body = await c.req.json();
    const job = await jobService.update(c.req.param("id"), body);
    if (!job) {
      return c.json({ error: "Job not found" }, 404);
    }
    console.log({ jobId: job.id, slug: job.slug }, "Job updated");
    return c.json({ job });
  } catch (err) {
    if (err instanceof ValidationError) {
      return c.json({ error: err.message }, 400);
    }
    console.error({ err }, "Failed to update job");
    return c.json({ error: "Failed to update job" }, 500);
  }
});

app.delete("/api/admin/jobs/:id", adminAuth, async (c) => {
  try {
    const deleted = await jobService.delete(c.req.param("id"));
    if (!deleted) {
      return c.json({ error: "Job not found" }, 404);
    }
    console.log({ jobId: c.req.param("id") }, "Job deleted");
    return c.json({ success: true, message: "Job deleted" });
  } catch (err) {
    console.error({ err }, "Failed to delete job");
    return c.json({ error: "Failed to delete job" }, 500);
  }
});

// ============================================
// CANDIDATE ROUTES
// ============================================
app.get("/api/candidate/applications", candidateAuth, async (c) => {
  try {
    const user = c.get("user");
    const applications = await applicationService.findByEmail(user.email);
    return c.json({ applications });
  } catch (err) {
    console.error({ err }, "Failed to retrieve applications");
    return c.json({ error: "Failed to retrieve applications" }, 500);
  }
});

app.get("/api/candidate/applications/:id", candidateAuth, async (c) => {
  try {
    const user = c.get("user");
    const application = await applicationService.getById(c.req.param("id"));
    if (!application) {
      return c.json({ error: "Application not found" }, 404);
    }
    if (application.email.toLowerCase() !== user.email.toLowerCase()) {
      return c.json(
        { error: "You do not have access to this application" },
        403,
      );
    }
    return c.json({ application });
  } catch (err) {
    console.error({ err }, "Failed to retrieve application");
    return c.json({ error: "Failed to retrieve application" }, 500);
  }
});

app.get("/api/candidate/applications/:id/resume", candidateAuth, async (c) => {
  try {
    const user = c.get("user");
    const application = await applicationService.getById(c.req.param("id"));
    if (!application) {
      return c.json({ error: "Application not found" }, 404);
    }
    if (application.email.toLowerCase() !== user.email.toLowerCase()) {
      return c.json(
        { error: "You do not have access to this application" },
        403,
      );
    }
    if (!application.resumePath) {
      return c.json({ error: "No resume uploaded" }, 404);
    }
    const object = await storageService.getObject(application.resumePath);
    if (!object) {
      return c.json({ error: "Resume not found in storage" }, 404);
    }
    const contentType = object.httpMetadata?.contentType ?? "application/pdf";
    const contentDisposition = application.resumeFilename
      ? `inline; filename="${application.resumeFilename.replace(/"/g, "")}"`
      : "inline";
    return c.body(object.body as any, 200, {
      "Content-Type": contentType,
      "Content-Disposition": contentDisposition,
      "Cache-Control": "private, max-age=300",
    });
  } catch (err) {
    console.error({ err }, "Failed to download resume");
    return c.json({ error: "Failed to retrieve application" }, 500);
  }
});

// ============================================
// REFERRALS - Public
// ============================================
app.get("/api/referrals/:code", async (c) => {
  try {
    await ensureReferralSchemaOnce();
    const referral = await referralService.getByCode(c.req.param("code"));
    if (!referral) {
      return c.json({ error: "Referral not found" }, 404);
    }
    const content = await referralService.getContentForReferral(referral);
    return c.json({
      referral: {
        referralCode: referral.referralCode,
        fullName: referral.fullName,
        referredBy: referral.referredBy,
        jobTitle: referral.jobTitle,
        meetingUrl: referral.meetingUrl,
        status: referral.status,
      },
      content,
    });
  } catch (err) {
    console.error(
      `Failed to load referral: ${err instanceof Error ? err.message : String(err)}`,
    );
    return c.json({ error: "Failed to load referral" }, 500);
  }
});

// Record that a referral clicked "continue" (public). The device type is sent
// by the frontend; mobile is blocked client-side, but we still notify admin.
const clickSchema = z.object({
  device: z.string().optional(),
});

app.post("/api/referrals/:code/click", async (c) => {
  try {
    await ensureReferralSchemaOnce();
    let device = "laptop";
    try {
      const body = await c.req.json();
      const parsed = clickSchema.safeParse(body);
      if (parsed.success && parsed.data.device) {
        device = parsed.data.device === "mobile" ? "mobile" : "laptop";
      }
    } catch {
      // ignore malformed body
    }

    const referral = await referralService.recordClick(
      c.req.param("code"),
      device,
    );
    if (!referral) {
      return c.json({ error: "Referral not found" }, 404);
    }

    const clickedAt = referral.lastClickedAt ?? new Date();
    c.executionCtx.waitUntil(
      emailService
        .sendReferralClickNotification({
          fullName: referral.fullName,
          referredBy: referral.referredBy,
          position: referral.jobTitle ?? "this role",
          referralCode: referral.referralCode,
          deviceType: device,
          clickedAt,
        })
        .catch((err) =>
          console.error({ err }, "Failed to notify admin of click"),
        ),
    );

    return c.json({
      success: true,
      device,
      clickCount: referral.clickCount,
      allowed: device === "laptop",
    });
  } catch (err) {
    console.error({ err }, "Failed to record referral click");
    return c.json({ error: "Failed to record click" }, 500);
  }
});

// ============================================
// REFERRALS (ADMIN)
// ============================================
app.get("/api/admin/referrals", adminAuth, async (c) => {
  try {
    await ensureReferralSchemaOnce();
    const status = c.req.query("status") || undefined;
    const search = c.req.query("search") || undefined;
    const data = await referralService.list({ status, search });
    return c.json(data);
  } catch (err) {
    console.error({ err }, "Failed to fetch referrals");
    return c.json({ error: "Failed to fetch referrals" }, 500);
  }
});

app.get("/api/admin/referrals/status", adminAuth, async (c) => {
  try {
    const status = await referralService.getSendStatus();
    return c.json({ status });
  } catch (err) {
    console.error({ err }, "Failed to fetch referral send status");
    return c.json({ error: "Failed to fetch send status" }, 500);
  }
});

app.get("/api/admin/referrals/content", adminAuth, async (c) => {
  try {
    const content = await referralService.getContent();
    return c.json({ content });
  } catch (err) {
    console.error({ err }, "Failed to fetch referral content");
    return c.json({ error: "Failed to fetch referral content" }, 500);
  }
});

app.put("/api/admin/referrals/content", adminAuth, async (c) => {
  try {
    const body = await c.req.json();
    const content = body?.content;
    if (!content || typeof content !== "object") {
      return c.json({ error: "Invalid content" }, 400);
    }
    const saved = await referralService.setContent(content);
    return c.json({ content: saved });
  } catch (err) {
    console.error({ err }, "Failed to save referral content");
    return c.json({ error: "Failed to save referral content" }, 500);
  }
});

// Apply a content override to a specific set of referrals, or to all.
// body: { content, ids?: string[], applyToAll?: boolean }
app.post("/api/admin/referrals/content/apply", adminAuth, async (c) => {
  try {
    const body = await c.req.json();
    const content = body?.content;
    if (!content || typeof content !== "object") {
      return c.json({ error: "Invalid content" }, 400);
    }
    const applyToAll = body?.applyToAll === true;
    const ids = Array.isArray(body?.ids)
      ? body.ids.filter((id: unknown) => typeof id === "string")
      : [];

    if (applyToAll || ids.length === 0) {
      await referralService.setContentOverridesAll(content);
      return c.json({ applied: applyToAll ? "all" : "none" });
    }

    await referralService.setContentOverrides(ids, content);
    return c.json({ success: true, applied: ids.length });
  } catch (err) {
    console.error({ err }, "Failed to apply referral content");
    return c.json({ error: "Failed to apply referral content" }, 500);
  }
});

// Clear overrides for a set of referrals (optionally specific keys).
// body: { "ids": string[], "keys"?: string[] }
app.post("/api/admin/referrals/content/reset", adminAuth, async (c) => {
  try {
    const body = await c.req.json();
    const ids = Array.isArray(body?.ids)
      ? body.ids.filter((id: unknown) => typeof id === "string")
      : [];
    const keys = Array.isArray(body?.keys)
      ? body.keys.filter((k: unknown) => typeof k === "string")
      : undefined;
    await referralService.clearContentOverrides(ids, keys);
    return c.json({ success: true, cleared: ids.length });
  } catch (err) {
    console.error({ err }, "Failed to clear referral content");
    return c.json({ error: "Failed to clear referral content" }, 500);
  }
});

app.post("/api/admin/referrals", adminAuth, async (c) => {
  try {
    const body = await c.req.json();
    const fullName = (body?.fullName ?? "").trim();
    if (!fullName) {
      return c.json({ error: "Full name is required" }, 400);
    }
    const referral = await referralService.create({
      fullName,
      email: (body?.email ?? "").trim().toLowerCase() || null,
      referredBy: (body?.referredBy ?? "").trim() || null,
      jobTitle: (body?.jobTitle ?? "").trim() || null,
      meetingUrl: (body?.meetingUrl ?? "").trim() || null,
    });
    console.log(
      { referralId: referral.id, code: referral.referralCode },
      "Referral created",
    );
    return c.json(
      { referral, link: publicReferralUrl(referral.referralCode) },
      201,
    );
  } catch (err) {
    console.error({ err }, "Failed to create referral");
    return c.json(
      { error: (err as Error).message || "Failed to create referral" },
      400,
    );
  }
});

app.post("/api/admin/referrals/import", adminAuth, async (c) => {
  try {
    const body = await c.req.json();
    const rows = Array.isArray(body?.rows) ? body.rows : [];
    if (!rows.length) {
      return c.json({ error: "No rows to import" }, 400);
    }
    const result = await referralService.importMany(rows);
    console.log(
      { created: result.created.length, skipped: result.skipped.length },
      "Referrals imported",
    );
    return c.json(result, 201);
  } catch (err) {
    console.error({ err }, "Failed to import referrals");
    return c.json(
      { error: (err as Error).message || "Failed to import referrals" },
      500,
    );
  }
});

app.patch("/api/admin/referrals/:id", adminAuth, async (c) => {
  try {
    const body = await c.req.json();
    const referral = await referralService.update(c.req.param("id"), {
      ...(body?.fullName !== undefined
        ? { fullName: (body.fullName ?? "").trim() }
        : {}),
      ...(body?.email !== undefined
        ? { email: (body.email ?? "").trim().toLowerCase() || null }
        : {}),
      ...(body?.referredBy !== undefined
        ? { referredBy: (body.referredBy ?? "").trim() || null }
        : {}),
      ...(body?.jobTitle !== undefined
        ? { jobTitle: (body.jobTitle ?? "").trim() || null }
        : {}),
      ...(body?.meetingUrl !== undefined
        ? { meetingUrl: (body.meetingUrl ?? "").trim() || null }
        : {}),
      ...(body?.phone !== undefined
        ? { phone: (body.phone ?? "").trim() || null }
        : {}),
      ...(body?.city !== undefined
        ? { city: (body.city ?? "").trim() || null }
        : {}),
      ...(body?.country !== undefined
        ? { country: (body.country ?? "").trim() || null }
        : {}),
      ...(body?.address !== undefined
        ? { address: (body.address ?? "").trim() || null }
        : {}),
      ...(body?.zipCode !== undefined
        ? { zipCode: (body.zipCode ?? "").trim() || null }
        : {}),
      ...(body?.source !== undefined
        ? { source: (body.source ?? "").trim() || null }
        : {}),
      ...(body?.notes !== undefined
        ? { notes: (body.notes ?? "").trim() || null }
        : {}),
    });
    if (!referral) {
      return c.json({ error: "Referral not found" }, 404);
    }
    return c.json({ referral });
  } catch (err) {
    console.error({ err }, "Failed to update referral");
    return c.json({ error: "Failed to update referral" }, 500);
  }
});

app.post("/api/admin/referrals/send", adminAuth, async (c) => {
  try {
    await ensureReferralSchemaOnce();
    const body = await c.req.json();
    const ids = Array.isArray(body?.ids)
      ? body.ids.filter((id: unknown) => typeof id === "string")
      : [];
    if (!ids.length) {
      return c.json({ error: "Select at least one referral to send" }, 400);
    }
    const result = await referralService.sendToReferrals(ids, body?.count);
    return c.json(result);
  } catch (err) {
    console.error({ err }, "Failed to send referrals");
    return c.json(
      { error: (err as Error).message || "Failed to send referrals" },
      500,
    );
  }
});

app.put("/api/admin/referrals/limit", adminAuth, async (c) => {
  try {
    const body = await c.req.json();
    const limit = Number(body?.limit);
    if (!Number.isFinite(limit)) {
      return c.json({ error: "A valid daily limit is required" }, 400);
    }
    const settings = await referralService.setDailySendLimit(limit);
    return c.json({ settings });
  } catch (err) {
    console.error({ err }, "Failed to update referral limit");
    return c.json({ error: "Failed to update referral limit" }, 500);
  }
});

app.delete("/api/admin/referrals/:id", adminAuth, async (c) => {
  try {
    const deleted = await referralService.delete(c.req.param("id"));
    if (!deleted) {
      return c.json({ error: "Referral not found" }, 404);
    }
    return c.json({ success: true, message: "Referral deleted" });
  } catch (err) {
    console.error({ err }, "Failed to delete referral");
    return c.json({ error: "Failed to delete referral" }, 500);
  }
});

export default app;
