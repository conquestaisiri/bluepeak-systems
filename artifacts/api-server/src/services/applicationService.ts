import { applicationRepository } from "../repositories/applicationRepository";
import type { ApplicationStatus, CreateApplicationInput } from "../models/application";

export const applicationService = {
  create(input: CreateApplicationInput) {
    return applicationRepository.create(input);
  },

  list() {
    return applicationRepository.findAll();
  },

  getById(id: string) {
    return applicationRepository.findById(id);
  },

  updateStatus(id: string, status: ApplicationStatus) {
    return applicationRepository.updateStatus(id, status);
  },
};
