import { applicationRepository } from "../repositories/applicationRepository";
import { storageService } from "./storageService";
import { emailService } from "./emailService";
import { logger } from "../lib/logger";
import type { ApplicationStatus, CreateApplicationInput } from "../models/application";

type StoredApplication = Awaited<ReturnType<typeof applicationRepository.create>>;

export const applicationService = {
  async create(input: CreateApplicationInput, resumeFile?: Express.Multer.File) {
    let resumePath: string | null = null;
    let resumeFilename: string | null = null;

    if (resumeFile) {
      const uploadResult = await storageService.upload(resumeFile);
      resumePath = uploadResult.key;
      resumeFilename = uploadResult.filename;
    }

    const application = await applicationRepository.create({
      ...input,
      resumePath,
      resumeFilename,
    });

    // Send emails asynchronously (don't block the response)
    void this.sendEmailsAsync(application);

    return application;
  },

  async sendEmailsAsync(application: StoredApplication) {
    // Send each email independently so a failure of one never prevents the others.
    const notification = await this.trySend("HR notification", () =>
      emailService.sendApplicationNotification({
        applicationId: application.id,
        position: application.position,
        fullName: application.fullName,
        email: application.email,
        phone: application.phone,
        country: application.country,
        city: application.city,
        linkedinUrl: application.linkedinUrl || undefined,
        portfolioUrl: application.portfolioUrl || undefined,
        yearsExperience: application.yearsExperience,
        education: application.education,
        englishProficiency: application.englishProficiency,
        noticePeriod: application.noticePeriod,
        expectedSalary: application.expectedSalary,
        earliestStartDate: application.earliestStartDate,
        skills: application.skills,
      })
    );

    await this.trySend("applicant confirmation", () =>
      emailService.sendApplicantConfirmation({
        email: application.email,
        fullName: application.fullName,
        position: application.position,
        applicationId: application.id,
      })
    );

    if (!notification) {
      logger.error(
        { applicationId: application.id },
        "Application created but the HR notification email could not be delivered. Check Resend domain verification and HR_EMAIL."
      );
    }
  },

  async trySend<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
    try {
      return await fn();
    } catch (error) {
      logger.error({ error, label }, "Email send failed");
      return null;
    }
  },

  async list() {
    return applicationRepository.findAll();
  },

  async getById(id: string) {
    return applicationRepository.findById(id);
  },

  async updateStatus(id: string, status: ApplicationStatus, notes?: string) {
    const application = await applicationRepository.findById(id);
    if (!application) return null;

    const updated = await applicationRepository.updateStatus(id, status);
    if (!updated) return null;

    await this.trySend("status update email", () =>
      emailService.sendStatusUpdate({
        email: application.email,
        fullName: application.fullName,
        position: application.position,
        status,
        applicationId: application.id,
        notes,
      })
    );

    return applicationRepository.findById(id);
  },

  async deleteApplication(id: string) {
    const application = await applicationRepository.findById(id);
    if (!application) return false;

    if (application.resumePath) {
      try {
        await storageService.delete(application.resumePath);
      } catch (error) {
        logger.error({ error }, "Failed to delete resume file");
      }
    }

    return applicationRepository.delete(id);
  },
};
