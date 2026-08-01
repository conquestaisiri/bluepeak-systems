import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const EMAIL_FROM = process.env.EMAIL_FROM!;
const HR_EMAIL = process.env.HR_EMAIL!;

const resend = new Resend(RESEND_API_KEY);

interface ApplicationEmailData {
  applicationId: string;
  position: string;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  yearsExperience: string;
  education: string;
  englishProficiency: string;
  noticePeriod: string;
  expectedSalary: string;
  earliestStartDate: string;
  skills: string;
}

function formatApplicationHtml(data: ApplicationEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Application Received</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px;">
  <div style="background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); padding: 32px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">New Application Received</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">Application ID: ${data.applicationId}</p>
  </div>
  
  <div style="background: #f8fafc; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
    <h2 style="color: #1e293b; margin-top: 0; font-size: 18px;">Position: ${data.position}</h2>
    
    <table style="width: 100%; border-collapse: collapse; margin-top: 24px;">
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; width: 40%; font-weight: 600; color: #475569;">Full Name</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">${data.fullName}</td>
      </tr>
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Email</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;"><a href="mailto:${data.email}" style="color: #0ea5e9;">${data.email}</a></td>
      </tr>
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Phone</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">${data.phone}</td>
      </tr>
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Location</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">${data.city}, ${data.country}</td>
      </tr>
      ${data.linkedinUrl ? `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569;">LinkedIn</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;"><a href="${data.linkedinUrl}" style="color: #0ea5e9;">${data.linkedinUrl}</a></td>
      </tr>
      ` : ''}
      ${data.portfolioUrl ? `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Portfolio</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;"><a href="${data.portfolioUrl}" style="color: #0ea5e9;">${data.portfolioUrl}</a></td>
      </tr>
      ` : ''}
    </table>

    <h3 style="color: #1e293b; margin: 24px 0 12px; font-size: 16px;">Experience & Qualifications</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; width: 40%; font-weight: 600; color: #475569;">Years of Experience</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">${data.yearsExperience}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Education</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">${data.education}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569;">English Proficiency</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">${data.englishProficiency}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Notice Period</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">${data.noticePeriod}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Expected Salary</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">${data.expectedSalary}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Earliest Start Date</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">${data.earliestStartDate}</td>
      </tr>
    </table>

    <h3 style="color: #1e293b; margin: 24px 0 12px; font-size: 16px;">Skills</h3>
    <p style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; white-space: pre-wrap;">${data.skills}</p>

    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
      <p style="color: #64748b; font-size: 14px; margin: 0;">This application was submitted via the BluePeak Systems careers portal.</p>
      <p style="color: #64748b; font-size: 14px; margin: 8px 0 0;">Log in to the admin dashboard to review and update the application status.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function formatConfirmationHtml(data: { position: string; fullName: string; applicationId: string }): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Received - BluePeak Systems</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px;">
  <div style="background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); padding: 40px 32px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Application Received ✓</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 12px 0 0; font-size: 16px;">Thank you for applying to BluePeak Systems</p>
  </div>
  
  <div style="background: #f8fafc; padding: 40px 32px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
    <p style="font-size: 16px; margin-top: 0;">Hi <strong>${data.fullName}</strong>,</p>
    
    <p style="font-size: 16px;">We've successfully received your application for the <strong>${data.position}</strong> position. Your application ID is:</p>
    
    <div style="background: white; border: 2px solid #0ea5e9; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
      <code style="font-size: 18px; font-weight: 600; color: #0ea5e9; letter-spacing: 1px;">${data.applicationId}</code>
    </div>
    
    <p style="font-size: 16px;">Our recruitment team will review your application and get back to you within <strong>5-7 business days</strong>. If your profile matches our requirements, we'll contact you to schedule the next steps.</p>
    
    <h3 style="color: #1e293b; margin: 32px 0 16px; font-size: 18px;">What happens next?</h3>
    <ol style="padding-left: 20px; color: #334155;">
      <li style="margin-bottom: 12px;"><strong>Application Review</strong> — Our team evaluates your experience, skills, and fit for the role.</li>
      <li style="margin-bottom: 12px;"><strong>Shortlisting</strong> — Qualified candidates move to a brief video screening.</li>
      <li style="margin-bottom: 12px;"><strong>Skills Assessment</strong> — A practical task relevant to the position.</li>
      <li style="margin-bottom: 12px;"><strong>Interview</strong> — A conversation with our recruitment team and/or the hiring manager.</li>
      <li style="margin-bottom: 12px;"><strong>Offer & Onboarding</strong> — Reference checks followed by a structured start.</li>
    </ol>
    
    <div style="margin-top: 32px; padding: 20px; background: #eff6ff; border-radius: 8px; border-left: 4px solid #0ea5e9;">
      <p style="margin: 0; color: #1e40af; font-size: 14px;"><strong>Need to update your application?</strong> Reply to this email or contact us at <a href="mailto:careers@bluepeaksystems.top" style="color: #0ea5e9;">careers@bluepeaksystems.top</a> with your application ID.</p>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">
    
    <p style="color: #64748b; font-size: 14px; margin: 0; text-align: center;">
      BluePeak Systems — Global Workforce Partner<br>
      <a href="https://bluepeaksystems.top" style="color: #0ea5e9;">bluepeaksystems.top</a>
    </p>
  </div>
</body>
</html>
  `.trim();
}

export const emailService = {
  async sendApplicationNotification(data: ApplicationEmailData): Promise<void> {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: HR_EMAIL,
      subject: `New Application: ${data.position} — ${data.fullName} (${data.applicationId})`,
      html: formatApplicationHtml(data),
    });
  },

  async sendApplicantConfirmation(data: { position: string; fullName: string; email: string; applicationId: string }): Promise<void> {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: data.email,
      subject: `Application Received: ${data.position} at BluePeak Systems`,
      html: formatConfirmationHtml(data),
    });
  },

  async sendStatusUpdate(data: { 
    email: string; 
    fullName: string; 
    position: string; 
    status: string; 
    applicationId: string;
    notes?: string;
  }): Promise<void> {
    const statusMessages: Record<string, string> = {
      Reviewing: "Your application is currently under review by our recruitment team.",
      Shortlisted: "Congratulations! You've been shortlisted. Our team will contact you soon to schedule the next steps.",
      Rejected: "Thank you for your interest. After careful consideration, we've decided to move forward with other candidates.",
      Hired: "Congratulations! We're excited to offer you the position. Our team will reach out with details.",
    };

    const message = statusMessages[data.status] || `Your application status has been updated to: ${data.status}`;

    await resend.emails.send({
      from: EMAIL_FROM,
      to: data.email,
      subject: `Application Update: ${data.position} — ${data.status}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px;">
  <div style="background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); padding: 40px 32px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Application Status Update</h1>
  </div>
  <div style="background: #f8fafc; padding: 40px 32px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
    <p>Hi <strong>${data.fullName}</strong>,</p>
    <p>Your application for <strong>${data.position}</strong> (ID: ${data.applicationId}) has been updated.</p>
    <div style="background: white; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center; border: 1px solid #e2e8f0;">
      <p style="margin: 0 0 8px; color: #64748b; font-size: 14px;">NEW STATUS</p>
      <p style="margin: 0; font-size: 24px; font-weight: 700; color: #0ea5e9;">${data.status}</p>
    </div>
    <p>${message}</p>
    ${data.notes ? `<p style="background: #fef3c7; border-radius: 8px; padding: 16px; border-left: 4px solid #f59e0b;"><strong>Notes:</strong> ${data.notes}</p>` : ''}
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">
    <p style="color: #64748b; font-size: 14px; margin: 0; text-align: center;">BluePeak Systems</p>
  </div>
</body>
</html>
      `.trim(),
    });
  },
};