import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  Search,
  Mail,
  Phone,
  MapPin,
  Globe,
  Linkedin,
  FileText,
  Eye,
  Trash2,
  Loader2,
  AlertCircle,
  Download,
  X,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Pencil,
  KeyRound,
  Link2,
  CheckCircle2,
  History,
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { format } from "date-fns";
import { parseDateOnly } from "@/lib/utils";
import { JobsAdmin } from "@/pages/Admin/JobsAdmin";
import { ReferralsAdmin } from "@/pages/Admin/ReferralsAdmin";
import { ContactsAdmin } from "@/pages/Admin/ContactsAdmin";
import { MailAdmin } from "@/pages/Admin/MailAdmin";
import { ActivityAdmin } from "@/pages/Admin/ActivityAdmin";

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

const STATUS_COLORS: Record<string, string> = {
  New: "bg-blue-100 text-blue-800",
  Reviewing: "bg-yellow-100 text-yellow-800",
  Shortlisted: "bg-purple-100 text-purple-800",
  Rejected: "bg-red-100 text-red-800",
  Hired: "bg-green-100 text-green-800",
};

const STATUS_OPTIONS = [
  "New",
  "Reviewing",
  "Shortlisted",
  "Rejected",
  "Hired",
] as const;

const STANDARD_INSTRUCTIONS = (
  position: string,
) => `Congratulations — you've been shortlisted for the ${position} position with BluePeak Systems. We're excited to get to know you better!

Your personal briefing is ready. Please follow these steps to complete your setup:

1. Open your private link below. This is the official BluePeak Systems private portal.
2. Allow the process to complete and your private room will be set up. This only takes a few minutes — no experience or special software needed.
3. Please complete the setup using the same computer (PC) you plan to use — this is the device our team may use for technical checks if needed.

That's it! You don't need to keep this page open. You may close it and return anytime — your setup is saved, and you can come back later if you need to.

Our recruitment team will verify your setup within a few hours or up to a day. You will then receive an email with your scheduled workshop date and time. If anything changes or is updated, we will let you know automatically.

Thank you very much for your time — we truly appreciate your interest in joining our team.

If you have any technical problem, reach out to HR at hr.bluepeak@payservice.top and they will respond ASAP to rectify it. BluePeak Systems only communicates through this official portal and our official email addresses.`;

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
  meetLink: string | null;
  interviewInstructions: string | null;
  meetingKey: string | null;
  footprint?: FootprintSummary | null;
}

interface FootprintSummary {
  visits: number;
  clicks: number;
  downloads: number;
  blocked: number;
  firstVisitAt: string | null;
  lastVisitAt: string | null;
  lastVisitDevice: string | null;
  lastClickAt: string | null;
  lastClickDevice: string | null;
  hesitant: boolean;
}

interface FootprintEvent {
  id: string;
  subjectType: string;
  subjectId: string;
  event: string;
  device: string;
  userAgent: string | null;
  createdAt: string;
}

const FOOTPRINT_FILTERS = [
  { value: "", label: "All footprints" },
  { value: "visited", label: "Visited" },
  { value: "not_visited", label: "Not visited" },
  { value: "proceeded", label: "Proceeded to briefing" },
  { value: "not_proceeded", label: "Not proceeded" },
  { value: "hesitant", label: "Hesitant (visited, no proceed)" },
  { value: "blocked", label: "Blocked on mobile" },
];

const EVENT_LABELS: Record<string, string> = {
  visit: "Visited the portal",
  proceed: "Opened the briefing",
  download: "Downloaded resume",
  blocked: "Blocked (mobile attempt)",
};

interface AdminResponse {
  applications: Application[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

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

function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      localStorage.setItem("admin_token", data.token);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SiteLayout title="Admin Login — BluePeak Systems">
      <div className="admin-shell min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-slate-900">Admin Login</h1>
              <p className="text-slate-500 mt-2">
                Sign in to manage applications
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            <p className="text-center text-slate-500 text-sm mt-6">
              <Link href="/" className="text-blue-600 hover:underline">
                ← Back to site
              </Link>
            </p>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}

export function AdminDashboard() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("admin_token"),
  );
  const [view, setView] = useState<
    "applications" | "jobs" | "referrals" | "contacts" | "mail" | "activity"
  >("applications");

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [footprintFilter, setFootprintFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [shortlistApp, setShortlistApp] = useState<Application | null>(null);
  const [timelineFor, setTimelineFor] = useState<Application | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<FootprintEvent[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  // Debounce the search box
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    const fetchApplications = async () => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "20",
          ...(statusFilter && { status: statusFilter }),
          ...(search && { search }),
          ...(footprintFilter && { footprint: footprintFilter }),
        });

        const res = await fetch(
          `${API_BASE}/api/admin/applications?${params}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (res.status === 401) {
          localStorage.removeItem("admin_token");
          setToken(null);
          navigate("/admin/login");
          return;
        }

        const data: AdminResponse = await res.json();
        if (!res.ok) throw new Error("Failed to fetch applications");

        if (!cancelled) {
          setApplications(data.applications);
          setTotal(data.pagination.total);
          setTotalPages(data.pagination.totalPages);
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
  }, [token, page, statusFilter, search, footprintFilter, navigate]);

  const handleStatusChange = async (
    appId: string,
    newStatus: string,
    opts?: {
      meetLink?: string | null;
      interviewInstructions?: string | null;
      meetingKey?: string | null;
      notifyCandidate?: boolean;
    },
  ) => {
    setUpdatingStatus(appId);
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/applications/${appId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: newStatus,
            ...(opts?.meetLink !== undefined
              ? { meetLink: opts.meetLink }
              : {}),
            ...(opts?.interviewInstructions !== undefined
              ? { interviewInstructions: opts.interviewInstructions }
              : {}),
            ...(opts?.meetingKey !== undefined
              ? { meetingKey: opts.meetingKey }
              : {}),
            ...(opts?.notifyCandidate !== undefined
              ? { notifyCandidate: opts.notifyCandidate }
              : {}),
          }),
        },
      );

      if (!res.ok) throw new Error("Failed to update status");
      const data = await res.json();
      setApplications((prev) =>
        prev.map((a) =>
          a.id === appId
            ? {
                ...a,
                ...(data.application || {}),
              }
            : a,
        ),
      );
      setSelectedApp((prev) =>
        prev && prev.id === appId
          ? {
              ...prev,
              ...(data.application || {}),
            }
          : prev,
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const requestShortlist = (app: Application) => {
    setShortlistApp(app);
  };

  const handleDelete = async (app: Application) => {
    if (
      !window.confirm(
        `Delete the application from ${app.fullName}? This cannot be undone.`,
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/admin/applications/${app.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete application");
      setApplications((prev) => prev.filter((a) => a.id !== app.id));
      if (selectedApp?.id === app.id) setSelectedApp(null);
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Failed to delete application",
      );
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setToken(null);
    navigate("/admin/login");
  };

  const openTimeline = async (app: Application) => {
    setTimelineFor(app);
    setTimelineLoading(true);
    setTimelineEvents([]);
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/footprints?subjectType=candidate&subjectId=${app.id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.status === 401) {
        localStorage.removeItem("admin_token");
        setToken(null);
        navigate("/admin/login");
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load timeline");
      setTimelineEvents(data.events ?? []);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to load timeline");
    } finally {
      setTimelineLoading(false);
    }
  };

  if (!token) {
    return (
      <AdminLogin
        onSuccess={() => setToken(localStorage.getItem("admin_token"))}
      />
    );
  }

  return (
    <SiteLayout title="Admin Dashboard — BluePeak Systems">
      <div className="admin-shell">
        <header className="admin-header">
          <div className="admin-header-inner">
            <Link href="/admin" className="admin-brand">
              <span className="brand-mark">
                <span />
              </span>
              <span>
                bluepeak<span className="brand-dot">.</span> admin
              </span>
            </Link>
            <div className="admin-header-actions">
              <span className="admin-user">Admin</span>
              <button
                onClick={handleLogout}
                className="button button-ghost button-sm"
              >
                <ArrowLeft size={14} /> Logout
              </button>
            </div>
          </div>
        </header>

        <main className="admin-main">
          <div className="admin-tabs">
            <button
              className={`admin-tab${view === "applications" ? " active" : ""}`}
              onClick={() => setView("applications")}
            >
              Applications
            </button>
            <button
              className={`admin-tab${view === "jobs" ? " active" : ""}`}
              onClick={() => setView("jobs")}
            >
              Jobs
            </button>
            <button
              className={`admin-tab${view === "referrals" ? " active" : ""}`}
              onClick={() => setView("referrals")}
            >
              Referrals
            </button>
            <button
              className={`admin-tab${view === "contacts" ? " active" : ""}`}
              onClick={() => setView("contacts")}
            >
              Contacts
            </button>
            <button
              className={`admin-tab${view === "mail" ? " active" : ""}`}
              onClick={() => setView("mail")}
            >
              Send mail
            </button>
            <button
              className={`admin-tab${view === "activity" ? " active" : ""}`}
              onClick={() => setView("activity")}
            >
              Activity
            </button>
          </div>

          {view === "applications" && (
            <>
              <div className="admin-header-bar">
                <h1 className="admin-title">Applications</h1>
                <span className="admin-count">{total} total</span>
              </div>

              {error && (
                <div className="admin-alert">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              <div className="admin-filters">
                <div className="filter-group">
                  <div className="search-wrapper">
                    <Search size={18} />
                    <input
                      type="search"
                      placeholder="Search by name, email, position..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="filter-input"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPage(1);
                    }}
                    className="filter-select"
                  >
                    <option value="">All Statuses</option>
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <select
                    value={footprintFilter}
                    onChange={(e) => {
                      setFootprintFilter(e.target.value);
                      setPage(1);
                    }}
                    className="filter-select"
                    aria-label="Filter by footprint"
                  >
                    {FOOTPRINT_FILTERS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="admin-loading">
                  <Loader2 size={32} className="animate-spin" />
                  <p>Loading applications...</p>
                </div>
              ) : applications.length === 0 ? (
                <div className="admin-empty">
                  <FileText size={48} />
                  <h3>No applications found</h3>
                  <p>Try adjusting your filters or search terms.</p>
                </div>
              ) : (
                <>
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Candidate</th>
                          <th>Position</th>
                          <th>Location</th>
                          <th>Applied</th>
                          <th>Status</th>
                          <th>Footprint</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {applications.map((app) => (
                          <tr key={app.id}>
                            <td>
                              <div className="candidate-info">
                                <div className="candidate-name">
                                  {app.fullName}
                                </div>
                                <div className="candidate-contact">
                                  <a href={`mailto:${app.email}`}>
                                    <Mail size={12} /> {app.email}
                                  </a>
                                  <a href={`tel:${app.phone}`}>
                                    <Phone size={12} /> {app.phone}
                                  </a>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="position-info">
                                <div className="position-title">
                                  {app.position}
                                </div>
                                <div className="position-experience">
                                  {app.yearsExperience}
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="location-info">
                                <MapPin size={12} /> {app.city}, {app.country}
                                <br />
                                <Globe size={12} /> {app.timezone}
                              </div>
                            </td>
                            <td className="date-cell">
                              {format(new Date(app.createdAt), "MMM d, yyyy")}
                            </td>
                            <td>
                              <StatusBadge status={app.status} />
                            </td>
                            <td>
                              {app.footprint ? (
                                <div className="footprint-cell">
                                  {app.footprint.visits > 0 ? (
                                    <span className="footprint-line">
                                      <span
                                        className={`footprint-badge ${
                                          app.footprint.hesitant
                                            ? "footprint-badge-hesitant"
                                            : "footprint-badge-visited"
                                        }`}
                                      >
                                        {app.footprint.hesitant ? "⚠" : "✓"}{" "}
                                        {app.footprint.visits} visit
                                        {app.footprint.visits === 1 ? "" : "s"}
                                        {app.footprint.lastVisitDevice &&
                                          ` · ${app.footprint.lastVisitDevice}`}
                                      </span>
                                      {app.footprint.hesitant && (
                                        <span className="footprint-hesitant-label">
                                          Hesitant — no proceed
                                        </span>
                                      )}
                                      {app.footprint.clicks > 0 && (
                                        <span className="footprint-badge footprint-badge-clicked">
                                          {app.footprint.clicks} proceed
                                          {app.footprint.clicks === 1
                                            ? ""
                                            : "s"}
                                          {app.footprint.lastClickDevice &&
                                            ` · ${app.footprint.lastClickDevice}`}
                                        </span>
                                      )}
                                      {app.footprint.downloads > 0 && (
                                        <span className="footprint-badge footprint-badge-download">
                                          ↓ {app.footprint.downloads} resume
                                          download
                                          {app.footprint.downloads === 1
                                            ? ""
                                            : "s"}
                                        </span>
                                      )}
                                      {app.footprint.blocked > 0 && (
                                        <span className="footprint-badge footprint-badge-blocked">
                                          🔒 {app.footprint.blocked} mobile
                                          attempt
                                          {app.footprint.blocked === 1
                                            ? ""
                                            : "s"}{" "}
                                          blocked
                                        </span>
                                      )}
                                    </span>
                                  ) : (
                                    <span className="footprint-badge footprint-badge-none">
                                      Not visited
                                    </span>
                                  )}
                                  <button
                                    className="footprint-timeline-btn"
                                    onClick={() => openTimeline(app)}
                                  >
                                    <History size={13} /> Timeline
                                  </button>
                                </div>
                              ) : (
                                <span className="footprint-badge footprint-badge-none">
                                  No activity
                                </span>
                              )}
                            </td>
                            <td>
                              <div className="action-buttons">
                                <button
                                  onClick={() => setSelectedApp(app)}
                                  className="action-btn"
                                  title="View details"
                                >
                                  <Eye size={16} />
                                </button>
                                {app.status === "Shortlisted" && (
                                  <button
                                    onClick={() => requestShortlist(app)}
                                    className="action-btn action-btn-edit"
                                    title="Edit shortlist details (link, key, instructions)"
                                  >
                                    <Pencil size={16} />
                                  </button>
                                )}
                                <select
                                  value={app.status}
                                  onChange={(e) => {
                                    const next = e.target.value;
                                    if (next === "Shortlisted") {
                                      requestShortlist(app);
                                      e.target.value = app.status;
                                    } else {
                                      handleStatusChange(app.id, next);
                                    }
                                  }}
                                  disabled={updatingStatus === app.id}
                                  className="status-select"
                                >
                                  {STATUS_OPTIONS.map((s) => (
                                    <option key={s} value={s}>
                                      {s}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => handleDelete(app)}
                                  className="action-btn action-btn-danger"
                                  title="Delete application"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <div className="admin-pagination">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="button button-sm button-outline"
                      >
                        <ChevronLeft size={16} /> Previous
                      </button>
                      <span className="pagination-info">
                        Page {page} of {totalPages}
                      </span>
                      <button
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={page === totalPages}
                        className="button button-sm button-outline"
                      >
                        Next <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {view === "jobs" && <JobsAdmin token={token} />}
          {view === "referrals" && <ReferralsAdmin token={token} />}
          {view === "contacts" && <ContactsAdmin token={token} />}
          {view === "mail" && <MailAdmin token={token} />}
          {view === "activity" && <ActivityAdmin token={token} />}

          {timelineFor && (
            <div className="modal-overlay" onClick={() => setTimelineFor(null)}>
              <div
                className="modal-content shortlist-modal footprint-timeline-modal"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <div>
                    <h2>Candidate timeline — {timelineFor.fullName}</h2>
                    <span className="modal-position">
                      {timelineFor.position} · {timelineFor.email}
                    </span>
                  </div>
                  <button
                    onClick={() => setTimelineFor(null)}
                    className="modal-close"
                    aria-label="Close"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="modal-body">
                  {timelineLoading ? (
                    <div className="admin-loading" style={{ padding: 30 }}>
                      <Loader2 size={28} className="animate-spin" />
                      <p>Loading timeline...</p>
                    </div>
                  ) : timelineEvents.length === 0 ? (
                    <div className="admin-empty">
                      <History size={40} />
                      <p>No activity recorded yet for this candidate.</p>
                    </div>
                  ) : (
                    <div className="footprint-timeline">
                      {timelineEvents.map((ev) => (
                        <div className="footprint-timeline-item" key={ev.id}>
                          <div
                            className={`footprint-timeline-dot footprint-timeline-dot--${ev.event}`}
                          />
                          <div className="footprint-timeline-body">
                            <div className="footprint-timeline-head">
                              <strong>
                                {EVENT_LABELS[ev.event] || ev.event}
                              </strong>
                              <span className="footprint-time">
                                {new Date(ev.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <div className="footprint-timeline-meta">
                              Device detected:{" "}
                              <strong>
                                {ev.device === "mobile"
                                  ? "📱 Mobile/tablet"
                                  : "💻 PC/laptop"}
                              </strong>
                              {ev.userAgent && (
                                <span className="footprint-time">
                                  {" "}
                                  · UA: {ev.userAgent}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <div className="modal-status-row">
                    <a
                      href={`mailto:${timelineFor.email}?subject=${encodeURIComponent(
                        "Your BluePeak application",
                      )}&body=${encodeURIComponent(
                        `Hi ${timelineFor.fullName},\n\nWe noticed you've been engaging with your BluePeak portal${
                          timelineFor.footprint?.hesitant
                            ? " but haven't opened your briefing yet"
                            : timelineFor.footprint?.blocked
                              ? " from a phone — please open it on a PC or laptop when you're ready"
                              : ""
                        }. Just checking in to make sure everything is working for you.\n\nBest regards,\nBluePeak HR`,
                      )}`}
                      className="button button-sm button-outline"
                    >
                      <Mail size={14} /> Reach out to{" "}
                      {timelineFor.fullName.split(" ")[0]}
                    </a>
                    <button
                      type="button"
                      onClick={() => setTimelineFor(null)}
                      className="button button-sm button-outline"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {selectedApp && (
          <ApplicationModal
            application={selectedApp}
            onClose={() => setSelectedApp(null)}
            onStatusChange={(status) => {
              if (status === "Shortlisted") {
                requestShortlist(selectedApp);
              } else {
                handleStatusChange(selectedApp.id, status);
              }
            }}
            onEditShortlist={() => {
              if (selectedApp) requestShortlist(selectedApp);
            }}
            onDelete={() => handleDelete(selectedApp)}
            token={token}
          />
        )}

        {shortlistApp && (
          <ShortlistModal
            application={shortlistApp}
            onClose={() => setShortlistApp(null)}
            onConfirm={(opts) => {
              handleStatusChange(shortlistApp.id, "Shortlisted", opts);
              setShortlistApp(null);
            }}
          />
        )}
      </div>
    </SiteLayout>
  );
}

function ApplicationModal({
  application,
  onClose,
  onStatusChange,
  onEditShortlist,
  onDelete,
  token,
}: {
  application: Application;
  onClose: () => void;
  onStatusChange: (status: string) => void;
  onEditShortlist: () => void;
  onDelete: () => void;
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
        `${API_BASE}/api/admin/applications/${application.id}/resume`,
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
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{application.fullName}</h2>
            <span className="modal-position">{application.position}</span>
          </div>
          <button onClick={onClose} className="modal-close" aria-label="Close">
            <X size={20} />
          </button>
        </div>

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
                    The candidate did not attach a resume file.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <div className="modal-status-row">
            <select
              value={application.status}
              onChange={(e) => onStatusChange(e.target.value)}
              className="status-select status-select-lg"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {application.status === "Shortlisted" && (
              <button
                onClick={onEditShortlist}
                className="button button-sm button-outline"
              >
                <Pencil size={14} /> Edit shortlist
              </button>
            )}
            <button
              onClick={onDelete}
              className="button button-sm button-outline modal-delete"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
          <span className="modal-applied">
            Applied {format(new Date(application.createdAt), "MMMM d, yyyy")}
          </span>
        </div>
      </div>
    </div>
  );
}

function ShortlistModal({
  application,
  onClose,
  onConfirm,
}: {
  application: Application;
  onClose: () => void;
  onConfirm: (opts: {
    meetLink: string;
    meetingKey: string;
    interviewInstructions: string;
    notifyCandidate: boolean;
  }) => void;
}) {
  const isEdit = application.status === "Shortlisted";
  const [meetLink, setMeetLink] = useState(application.meetLink ?? "");
  const [meetingKey, setMeetingKey] = useState(application.meetingKey ?? "");
  const [interviewInstructions, setInterviewInstructions] = useState(
    application.interviewInstructions ??
      STANDARD_INSTRUCTIONS(application.position),
  );
  const [notifyCandidate, setNotifyCandidate] = useState(!isEdit);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmed = meetLink.trim();
    if (!trimmed) {
      setError(
        "The private room link is required to shortlist this candidate.",
      );
      return;
    }
    if (!/^https?:\/\//i.test(trimmed)) {
      setError("Please enter a valid link starting with http:// or https://");
      return;
    }

    setSubmitting(true);
    onConfirm({
      meetLink: trimmed,
      meetingKey: meetingKey.trim(),
      interviewInstructions:
        interviewInstructions.trim() ||
        STANDARD_INSTRUCTIONS(application.position),
      notifyCandidate,
    });
  };

  const hasInstructions = interviewInstructions.trim().length > 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content shortlist-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2>
              {isEdit
                ? `Edit shortlist for ${application.fullName}`
                : `Shortlist ${application.fullName}`}
            </h2>
            <span className="modal-position">{application.position}</span>
          </div>
          <button onClick={onClose} className="modal-close" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="modal-section">
            <p className="text-slate-500 text-sm mb-4">
              {isEdit
                ? "Update this candidate's briefing details. Changes appear on their portal right away. Unless you turn on the email option below, no email is sent."
                : "Set up this candidate's briefing. The link and key appear on their candidate portal only — never in the email."}
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Private room link <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Link2
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="url"
                  value={meetLink}
                  onChange={(e) => setMeetLink(e.target.value)}
                  placeholder="https://meet.bluepeak.systems/..."
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                The official BluePeak private room link. We never describe this
                as a third-party video tool.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Private room key{" "}
                <span className="text-slate-400">(optional)</span>
              </label>
              <div className="relative">
                <KeyRound
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={meetingKey}
                  onChange={(e) => setMeetingKey(e.target.value)}
                  placeholder="e.g. BP-4X7-KQ2M"
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                The private code the candidate enters when they open the link.
                Shown only on their portal.
              </p>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700">
                  Instructions for the candidate
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setInterviewInstructions(
                      STANDARD_INSTRUCTIONS(application.position),
                    )
                  }
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Reset to standard message
                </button>
              </div>
              <textarea
                value={interviewInstructions}
                onChange={(e) => setInterviewInstructions(e.target.value)}
                rows={9}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm leading-relaxed"
              />
              <p className="text-xs text-slate-400 mt-1">
                Pre-filled with our standard briefing message. You can adjust it
                for this candidate — whatever you save here is exactly what they
                see.
              </p>
            </div>

            <div className="mb-4">
              <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={notifyCandidate}
                  onChange={(e) => setNotifyCandidate(e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span>
                  <span className="block text-sm font-medium text-slate-700">
                    Email this candidate
                  </span>
                  <span className="block text-xs text-slate-500 mt-0.5">
                    {isEdit
                      ? "Send the candidate an email letting them know their briefing has been updated. Leave off to change the details silently."
                      : "Send the candidate an email letting them know they have been shortlisted and their briefing is ready."}
                  </span>
                </span>
              </label>
            </div>

            {hasInstructions && (
              <div className="shortlist-preview">
                <div className="shortlist-preview-head">
                  <CheckCircle2 size={16} />
                  Preview — what {application.fullName} will see on their portal
                </div>
                <div className="shortlist-preview-body">
                  <h4>Your next step: Workshop briefing</h4>
                  <p className="shortlist-preview-copy">
                    {meetLink
                      ? "Congratulations on being shortlisted! Open your official BluePeak briefing using the link below."
                      : "Set the private room link above to enable this preview."}
                  </p>
                  {meetLink ? (
                    <span className="shortlist-preview-link">{meetLink}</span>
                  ) : (
                    <span className="shortlist-preview-link muted">
                      No link yet
                    </span>
                  )}
                  {meetingKey && (
                    <div className="shortlist-preview-key">
                      <strong>Your private room key:</strong>{" "}
                      <code>{meetingKey}</code>
                    </div>
                  )}
                  {hasInstructions && (
                    <div className="shortlist-preview-instructions">
                      <strong>Next steps:</strong>
                      <p style={{ whiteSpace: "pre-wrap" }}>
                        {interviewInstructions}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <div className="modal-status-row">
              <button
                type="button"
                onClick={onClose}
                className="button button-sm button-outline"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="button button-blue"
              >
                {submitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : null}
                {submitting
                  ? " Saving..."
                  : isEdit
                    ? notifyCandidate
                      ? " Save & Email Candidate"
                      : " Save Changes (no email)"
                    : notifyCandidate
                      ? " Shortlist & Email Candidate"
                      : " Shortlist (no email)"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
