import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
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
} from 'lucide-react';
import { SiteLayout } from '@/components/site/SiteLayout';
import { format } from 'date-fns';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

const STATUS_COLORS: Record<string, string> = {
  New: 'bg-blue-100 text-blue-800',
  Reviewing: 'bg-yellow-100 text-yellow-800',
  Shortlisted: 'bg-purple-100 text-purple-800',
  Rejected: 'bg-red-100 text-red-800',
  Hired: 'bg-green-100 text-green-800',
};

const STATUS_OPTIONS = ['New', 'Reviewing', 'Shortlisted', 'Rejected', 'Hired'] as const;

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
}

interface AdminResponse {
  applications: Application[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        STATUS_COLORS[status] || 'bg-gray-100 text-gray-800'
      }`}
    >
      {status}
    </span>
  );
}

function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      localStorage.setItem('admin_token', data.token);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SiteLayout title="Admin Login — BluePeak Systems">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-slate-900">Admin Login</h1>
              <p className="text-slate-500 mt-2">Sign in to manage applications</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
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
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Sign In'}
              </button>
            </form>

            <p className="text-center text-slate-500 text-sm mt-6">
              <Link href="/" className="text-blue-600 hover:underline">← Back to site</Link>
            </p>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}

export function AdminDashboard() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('admin_token'));

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

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
      setError('');

      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '20',
          ...(statusFilter && { status: statusFilter }),
          ...(search && { search }),
        });

        const res = await fetch(`${API_BASE}/api/admin/applications?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          localStorage.removeItem('admin_token');
          setToken(null);
          navigate('/admin/login');
          return;
        }

        const data: AdminResponse = await res.json();
        if (!res.ok) throw new Error('Failed to fetch applications');

        if (!cancelled) {
          setApplications(data.applications);
          setTotal(data.pagination.total);
          setTotalPages(data.pagination.totalPages);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load applications');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchApplications();
    return () => {
      cancelled = true;
    };
  }, [token, page, statusFilter, search, navigate]);

  const handleStatusChange = async (appId: string, newStatus: string) => {
    setUpdatingStatus(appId);
    try {
      const res = await fetch(`${API_BASE}/api/admin/applications/${appId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update status');
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
      );
      setSelectedApp((prev) => (prev && prev.id === appId ? { ...prev, status: newStatus } : prev));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDelete = async (app: Application) => {
    if (!window.confirm(`Delete the application from ${app.fullName}? This cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/admin/applications/${app.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete application');
      setApplications((prev) => prev.filter((a) => a.id !== app.id));
      if (selectedApp?.id === app.id) setSelectedApp(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete application');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
    navigate('/admin/login');
  };

  if (!token) {
    return <AdminLogin onSuccess={() => setToken(localStorage.getItem('admin_token'))} />;
  }

  return (
    <SiteLayout title="Admin Dashboard — BluePeak Systems">
      <div className="admin-shell">
        <header className="admin-header">
          <div className="admin-header-inner">
            <Link href="/admin" className="admin-brand">
              <span className="brand-mark"><span /></span>
              <span>bluepeak<span className="brand-dot">.</span> admin</span>
            </Link>
            <div className="admin-header-actions">
              <span className="admin-user">Admin</span>
              <button onClick={handleLogout} className="button button-ghost button-sm">
                <ArrowLeft size={14} /> Logout
              </button>
            </div>
          </div>
        </header>

        <main className="admin-main">
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
                  <option key={s} value={s}>{s}</option>
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
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr key={app.id}>
                        <td>
                          <div className="candidate-info">
                            <div className="candidate-name">{app.fullName}</div>
                            <div className="candidate-contact">
                              <a href={`mailto:${app.email}`}><Mail size={12} /> {app.email}</a>
                              <a href={`tel:${app.phone}`}><Phone size={12} /> {app.phone}</a>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="position-info">
                            <div className="position-title">{app.position}</div>
                            <div className="position-experience">{app.yearsExperience}</div>
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
                          {format(new Date(app.createdAt), 'MMM d, yyyy')}
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
                              <Eye size={16} />
                            </button>
                            <select
                              value={app.status}
                              onChange={(e) => handleStatusChange(app.id, e.target.value)}
                              disabled={updatingStatus === app.id}
                              className="status-select"
                            >
                              {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>{s}</option>
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
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="button button-sm button-outline"
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </main>

        {selectedApp && (
          <ApplicationModal
            application={selectedApp}
            onClose={() => setSelectedApp(null)}
            onStatusChange={(status) => handleStatusChange(selectedApp.id, status)}
            onDelete={() => handleDelete(selectedApp)}
            token={token}
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
  onDelete,
  token,
}: {
  application: Application;
  onClose: () => void;
  onStatusChange: (status: string) => void;
  onDelete: () => void;
  token: string;
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'resume'>('overview');
  const [downloading, setDownloading] = useState(false);

  const handleDownloadResume = async () => {
    if (!application.resumePath) return;
    setDownloading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/applications/${application.id}/resume`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to download');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = application.resumeFilename || 'resume.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download resume');
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
          <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
            Overview
          </button>
          <button className={activeTab === 'details' ? 'active' : ''} onClick={() => setActiveTab('details')}>
            Details
          </button>
          <button className={activeTab === 'resume' ? 'active' : ''} onClick={() => setActiveTab('resume')}>
            Resume & Files
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'overview' && (
            <div className="modal-section">
              <div className="info-grid">
                <div className="info-item">
                  <label>Email</label>
                  <a href={`mailto:${application.email}`}>{application.email}</a>
                </div>
                <div className="info-item">
                  <label>Phone</label>
                  <a href={`tel:${application.phone}`}>{application.phone}</a>
                </div>
                <div className="info-item">
                  <label>Location</label>
                  <span>{application.city}, {application.country}</span>
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
                  <span>{format(new Date(application.earliestStartDate), 'MMM d, yyyy')}</span>
                </div>
                {application.linkedinUrl && (
                  <div className="info-item">
                    <label>LinkedIn</label>
                    <a href={application.linkedinUrl} target="_blank" rel="noreferrer">
                      <Linkedin size={14} /> View Profile
                    </a>
                  </div>
                )}
                {application.portfolioUrl && (
                  <div className="info-item">
                    <label>Portfolio</label>
                    <a href={application.portfolioUrl} target="_blank" rel="noreferrer">
                      <Globe size={14} /> View Portfolio
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'details' && (
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

          {activeTab === 'resume' && (
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
                    {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                    {downloading ? ' Downloading...' : ' Download Resume'}
                  </button>
                </div>
              ) : (
                <div className="no-resume">
                  <FileText size={48} className="text-slate-300" />
                  <h4>No resume uploaded</h4>
                  <p className="text-slate-500">The candidate did not attach a resume file.</p>
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
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button onClick={onDelete} className="button button-sm button-outline modal-delete">
              <Trash2 size={14} /> Delete
            </button>
          </div>
          <span className="modal-applied">
            Applied {format(new Date(application.createdAt), 'MMMM d, yyyy')}
          </span>
        </div>
      </div>
    </div>
  );
}
