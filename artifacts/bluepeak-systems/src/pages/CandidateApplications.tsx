import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  MapPin,
  Briefcase,
  Clock,
  Mail,
  Phone,
  Linkedin,
  Globe,
  FileText,
  Download,
  X,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowUpRight,
  Video,
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { format } from "date-fns";
import { parseDateOnly } from "@/lib/utils";

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

const STATUS_COLORS: Record<string, string> = {
  New: "bg-blue-100 text-blue-800",
  Reviewing: "bg-yellow-100 text-yellow-800",
  Shortlisted: "bg-purple-100 text-purple-800",
  Rejected: "bg-red-100 text-red-800",
  Hired: "bg-green-100 text-green-800",
};

function StatusBadge({
  status,
  className = "",
}: {
  status: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        STATUS_COLORS[status] || "bg-gray-100 text-gray-800"
      } ${className}`}
    >
      {status}
    </span>
  );
}

interface Application {
  id: string;
  createdAt: string;
  position: string;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  timezone: string;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  yearsExperience: string;
  education: string;
  englishProficiency: string;
  noticePeriod: string;
  expectedSalary: string;
  earliestStartDate: string;
  skills: string;
  relevantExperience: string;
  coverLetter: string;
  resumePath: string | null;
  resumeFilename: string | null;
  status: string;
  referenceCode: string;
  meetLink: string | null;
  interviewInstructions: string | null;
  meetingKey: string | null;
}

interface CandidateResponse {
  applications: Application[];
}

export function CandidateApplications() {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("candidate_token"),
  );
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  useEffect(() => {
    if (!token) {
      window.location.href = "/login";
      return;
    }

    let cancelled = false;

    const fetchApplications = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`${API_BASE}/api/candidate/applications`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          localStorage.removeItem("candidate_token");
          window.location.href = "/login";
          return;
        }

        if (!res.ok) throw new Error("Failed to fetch applications");

        const data: CandidateResponse = await res.json();
        if (!cancelled) {
          setApplications(data.applications);
        }
      } catch (err) {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to load applications",
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchApplications();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("candidate_token");
    window.location.href = "/login";
  };

  const handleDownloadResume = async (application: Application) => {
    if (!application.resumePath) return;
    try {
      const res = await fetch(
        `${API_BASE}/api/candidate/applications/${application.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error("Failed to get application details");
      const data = await res.json();
      if (data.application?.resumePath) {
        const downloadRes = await fetch(
          `${API_BASE}/api/candidate/applications/${application.id}/resume`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        // The backend redirects to presigned URL
        const blob = await downloadRes.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = application.resumeFilename || "resume.pdf";
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      alert("Failed to download resume");
    }
  };

  if (!token) {
    return null; // Will redirect via useEffect
  }

  return (
    <SiteLayout title="My Applications — BluePeak Systems">
      <div className="candidate-shell">
        <header className="candidate-header">
          <div className="container candidate-header-inner">
            <Link href="/" className="candidate-brand">
              <img
                src="/bluepeak-mark.svg"
                alt="BluePeak Systems"
                className="candidate-logo"
              />
            </Link>
            <div className="candidate-header-actions">
              <span className="candidate-user">
                {applications.length} application
                {applications.length !== 1 ? "s" : ""}
              </span>
              <button
                onClick={handleLogout}
                className="button button-ghost button-sm"
              >
                <ArrowLeft size={14} /> Sign out
              </button>
            </div>
          </div>
        </header>

        <main className="candidate-main">
          <div className="container">
            <div className="candidate-header-bar">
              <h1 className="candidate-title">My Applications</h1>
              <p className="candidate-subtitle">
                Track the status of your applications and manage your profile.
              </p>
            </div>

            {error && (
              <div className="candidate-alert">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {loading ? (
              <div className="candidate-loading">
                <Loader2 size={32} className="animate-spin" />
                <p>Loading your applications...</p>
              </div>
            ) : applications.length === 0 ? (
              <div className="candidate-empty">
                <FileText size={48} />
                <h3>No applications yet</h3>
                <p>You haven&apos;t applied to any positions yet.</p>
                <Link href="/careers" className="button button-blue">
                  Browse open positions <ArrowUpRight size={16} />
                </Link>
              </div>
            ) : (
              <div className="candidate-table-wrapper">
                <table className="candidate-table">
                  <thead>
                    <tr>
                      <th>Position</th>
                      <th>Department</th>
                      <th>Applied</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr key={app.id}>
                        <td>
                          <div className="position-info">
                            <div className="position-title">{app.position}</div>
                            <div className="position-reference">
                              Ref: {app.referenceCode}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="position-department">
                            {app.position}
                          </div>
                        </td>
                        <td className="date-cell">
                          {format(new Date(app.createdAt), "MMM d, yyyy")}
                        </td>
                        <td>
                          <StatusBadge status={app.status} />
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              onClick={() => setSelectedApp(app)}
                              className="action-btn"
                              title="View details"
                            >
                              <FileText size={16} />
                            </button>
                            {app.resumeFilename && (
                              <button
                                onClick={() => handleDownloadResume(app)}
                                className="action-btn"
                                title="Download resume"
                              >
                                <Download size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>

        {selectedApp && (
          <CandidateApplicationModal
            application={selectedApp}
            onClose={() => setSelectedApp(null)}
            token={token}
          />
        )}
      </div>
    </SiteLayout>
  );
}

function CandidateApplicationModal({
  application,
  onClose,
  token,
}: {
  application: Application;
  onClose: () => void;
  token: string;
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "details" | "resume">(
    "overview",
  );
  const [downloading, setDownloading] = useState(false);

  const handleDownloadResume = async () => {
    if (!application.resumePath) return;
    setDownloading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/candidate/applications/${application.id}/resume`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error("Failed to download");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = application.resumeFilename || "resume.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to download resume");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content candidate-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2>{application.fullName}</h2>
            <span className="modal-position">
              {application.position} &mdash; {application.referenceCode}
            </span>
          </div>
          <button onClick={onClose} className="modal-close" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {application.status === "Shortlisted" && application.meetLink && (
          <div className="next-step-panel">
            <div className="next-step-icon">
              <Video size={22} />
            </div>
            <div className="next-step-body">
              <h3>Your next step: Interview invitation</h3>
              <p className="next-step-copy">
                Congratulations on being shortlisted! Your official BluePeak
                invitation is ready. Open it using the link below and follow the
                instructions to complete your setup.
              </p>
              <a
                href={application.meetLink}
                target="_blank"
                rel="noreferrer"
                className="next-step-link"
              >
                Open your BluePeak invitation <ArrowUpRight size={16} />
              </a>
              {application.meetingKey && (
                <div className="next-step-instructions">
                  <strong>Your private access key:</strong>
                  <p>
                    <code>{application.meetingKey}</code>
                  </p>
                </div>
              )}
              {application.interviewInstructions && (
                <div className="next-step-instructions">
                  <strong>Next steps:</strong>
                  <p style={{ whiteSpace: "pre-wrap" }}>
                    {application.interviewInstructions}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="modal-tabs">
          <button
            className={activeTab === "overview" ? "active" : ""}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            className={activeTab === "details" ? "active" : ""}
            onClick={() => setActiveTab("details")}
          >
            Details
          </button>
          <button
            className={activeTab === "resume" ? "active" : ""}
            onClick={() => setActiveTab("resume")}
          >
            Resume & Files
          </button>
        </div>

        <div className="modal-body">
          {activeTab === "overview" && (
            <div className="modal-section">
              <div className="info-grid">
                <div className="info-item">
                  <label>Email</label>
                  <a href={`mailto:${application.email}`}>
                    {application.email}
                  </a>
                </div>
                <div className="info-item">
                  <label>Phone</label>
                  <a href={`tel:${application.phone}`}>{application.phone}</a>
                </div>
                <div className="info-item">
                  <label>Location</label>
                  <span>
                    {application.city}, {application.country}
                  </span>
                </div>
                <div className="info-item">
                  <label>Timezone</label>
                  <span>{application.timezone}</span>
                </div>
                <div className="info-item">
                  <label>Experience</label>
                  <span>{application.yearsExperience}</span>
                </div>
                <div className="info-item">
                  <label>Education</label>
                  <span>{application.education}</span>
                </div>
                <div className="info-item">
                  <label>English</label>
                  <span>{application.englishProficiency}</span>
                </div>
                <div className="info-item">
                  <label>Notice Period</label>
                  <span>{application.noticePeriod}</span>
                </div>
                <div className="info-item">
                  <label>Expected Salary</label>
                  <span>{application.expectedSalary}</span>
                </div>
                <div className="info-item">
                  <label>Earliest Start</label>
                  <span>
                    {format(
                      parseDateOnly(application.earliestStartDate),
                      "MMM d, yyyy",
                    )}
                  </span>
                </div>
                {application.linkedinUrl && (
                  <div className="info-item">
                    <label>LinkedIn</label>
                    <a
                      href={application.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Linkedin size={14} /> View Profile
                    </a>
                  </div>
                )}
                {application.portfolioUrl && (
                  <div className="info-item">
                    <label>Portfolio</label>
                    <a
                      href={application.portfolioUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Globe size={14} /> View Portfolio
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "details" && (
            <div className="modal-section">
              <div className="detail-group">
                <h4>Skills</h4>
                <p className="detail-text">{application.skills}</p>
              </div>
              <div className="detail-group">
                <h4>Relevant Experience</h4>
                <p className="detail-text">{application.relevantExperience}</p>
              </div>
              <div className="detail-group">
                <h4>Cover Letter</h4>
                <p className="detail-text">{application.coverLetter}</p>
              </div>
            </div>
          )}

          {activeTab === "resume" && (
            <div className="modal-section">
              {application.resumeFilename ? (
                <div className="resume-info">
                  <FileText size={32} className="resume-icon" />
                  <div>
                    <h4>{application.resumeFilename}</h4>
                    <p className="text-slate-500">Uploaded with application</p>
                  </div>
                  <button
                    onClick={handleDownloadResume}
                    disabled={downloading}
                    className="button button-blue"
                  >
                    {downloading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Download size={16} />
                    )}
                    {downloading ? " Downloading..." : " Download Resume"}
                  </button>
                </div>
              ) : (
                <div className="no-resume">
                  <FileText size={48} className="text-slate-300" />
                  <h4>No resume uploaded</h4>
                  <p className="text-slate-500">
                    You did not attach a resume file to this application.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <div className="modal-status-row">
            <StatusBadge
              status={application.status}
              className="status-badge-lg"
            />
            <span className="modal-applied">
              Applied {format(new Date(application.createdAt), "MMMM d, yyyy")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
