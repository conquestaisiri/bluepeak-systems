import { applicationService } from './dist/services/applicationService.js';
const testInput = {
  position: 'Test',
  fullName: 'Test User',
  email: 'test@example.com',
  phone: '1234567890',
  country: 'US',
  city: 'NYC',
  timezone: 'UTC-05:00',
  yearsExperience: '1-2 years',
  education: "Bachelor's degree",
  englishProficiency: 'Native / Bilingual',
  noticePeriod: 'Immediately available',
  expectedSalary: '$1000/month',
  earliestStartDate: '2026-08-15',
  skills: 'test',
  relevantExperience: 'test experience',
  coverLetter: 'test cover letter',
};
applicationService.create(testInput, null).then(r => console.log('Created:', r.id)).catch(e => console.error('Error:', e.message, e.stack));