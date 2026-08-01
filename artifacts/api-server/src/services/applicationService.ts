import { applicationRepository } from "../repositories/applicationRepository";
import { storageService } from "./storageService";
import { emailService } from "./emailService";
import type { ApplicationStatus, CreateApplicationInput } from "../models/application";

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

  async sendEmailsAsync(application: Awaited<ReturnType<typeof applicationRepository.create>>) {
    try {
      // Send notification to HR
      await emailService.sendApplicationNotification({
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
      });

      // Send confirmation to applicant
      await emailService.sendApplicantConfirmation({
        email: application.email,
        fullName: application.fullName,
        position: application.position,
        applicationId: application.id,
      });
    } catch (error) {
      console.error("Failed to send application emails:", error);
      // Don't throw - emails are best effort
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

    // Send status update email
    try {
      await emailService.sendStatusUpdate({
        email: application.email,
        fullName: application.fullName,
        position: application.position,
        status,
        applicationId: application.id,
        notes,
      });
    } catch (error) {
      console.error("Failed to send status update email:", error);
    }

    return applicationRepository.findById(id);
  },

  async deleteApplication(id: string) {
    const application = await applicationRepository.findById(id);
    if (!application) return false;

    if (application.resumePath) {
      try {
        await storageService.delete(application.resumePath);
      } catch (error) {
        console.error("Failed to delete resume file:", error);
      }
    }

    return applicationRepository.delete(id);
  },
};