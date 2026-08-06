import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  Briefcase,
  Clock,
  DollarSign,
  ArrowUpRight,
  ArrowLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Mail,
  Laptop,
  Smartphone,
  MousePointerClick,
  X,
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

interface ReferralData {
  referralCode: string;
  fullName: string;
  referredBy: string | null;
  jobTitle: string | null;
  meetingUrl: string | null;
  status: string;
}

type Content = Record<string, string>;

function interpolate(
  template: string,
  name: string,
  position: string,
  code: string,
  referredBy: string,
): string {
  return template
    .replace(/\{name\}/g, name.split(" ")[0] || name)
    .replace(/\{position\}/g, position)
    .replace(/\{referredBy\}/g, referredBy)
    .replace(/\{code\}/g, code);
}

function detectDevice(): "mobile" | "laptop" {
  if (typeof window === "undefined" || typeof navigator === "undefined")
    return "laptop";

  // Never let a spoofed user agent ("request desktop site") defeat this.
  // A real phone/tablet keeps touch + coarse pointer + no-hover even when the
  // browser is forced to show the desktop layout and UA, so we score those
  // physical signals rather than trusting the UA alone.
  let mobileScore = 0;

  // UA-based hints (weakest signal — many are spoofed by desktop mode).
  const ua = (navigator.userAgent || "") + " " + (navigator.vendor || "");
  if (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|windows phone|xbox|mobi/i.test(
      ua,
    )
  )
    mobileScore += 2;

  // Structured UA hints (harder to spoof).
  const uaData = (
    navigator as Navigator & { userAgentData?: { mobile?: boolean } }
  ).userAgentData;
  if (uaData?.mobile === true) mobileScore += 3;

  const query = (m: string) =>
    typeof window.matchMedia === "function" ? window.matchMedia(m) : null;

  // Coarse pointer + touch screen: the strongest physical signal. Present on
  // phones/tablets regardless of the desktop-mode UA, nearly absent on desktops.
  const coarsePointer = query("(pointer: coarse)")?.matches ?? false;
  const finePointer = query("(pointer: fine)")?.matches ?? false;

  // A phone/tablet shows touch support and a coarse primary pointer even in
  // desktop-site mode. A genuine desktop has fine pointer (mouse) — and if it
  // also has a touchscreen we still let laptops through since a laptop has a
  // keyboard + trackpad hardware the workshop needs.
  if (coarsePointer) mobileScore += 4;
  if (finePointer) mobileScore -= 2;

  const touchPoints =
    typeof navigator.maxTouchPoints === "number" ? navigator.maxTouchPoints : 0;
  if (touchPoints > 0) mobileScore += 1;
  if (
    typeof document !== "undefined" &&
    "ontouchstart" in document.documentElement
  )
    mobileScore += 1;

  // Physical screen ratio: phones/tablets are high-DPI and small in CSS px.
  const hasScreen =
    typeof window.screen === "object" && window.screen.width > 0;
  const screenRatio = hasScreen
    ? Math.max(
        (window.devicePixelRatio || 1) *
          (window.screen.width / (window.screen.height || 1)),
      )
    : 0;
  if (screenRatio > 1.6) mobileScore += 1;

  // No hovering capability (no mouse): near-certain mobile/tablet, even in
  // desktop mode.
  const hoverNone = query("(hover: none)")?.matches ?? false;
  if (hoverNone) mobileScore += 3;

  return mobileScore >= 4 ? "mobile" : "laptop";
}

export function ReferralPage() {
  const code = (
    window.location.pathname.replace("/referral/", "").replace(/\/$/, "") || ""
  ).toUpperCase();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [referral, setReferral] = useState<ReferralData | null>(null);
  const [content, setContent] = useState<Content>({});
  const [tracking, setTracking] = useState(false);
  const [mobileGate, setMobileGate] = useState(false);

  useEffect(() => {
    if (!code) {
      setError("Invalid invitation link.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetch(`${API_BASE}/api/referrals/${encodeURIComponent(code)}`)
      .then((res) => {
        if (res.status === 404)
          throw new Error("This invitation could not be found.");
        if (!res.ok)
          throw new Error("Could not load your invitation. Please try again.");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setReferral(data.referral);
        setContent(data.content || {});
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            err instanceof Error
              ? err.message
              : "Could not load this invitation.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (loading) {
    return (
      <SiteLayout title="Loading invitation — BluePeak Systems">
        <div className="not-found-shell">
          <div
            className="container"
            style={{ textAlign: "center", padding: "140px 0" }}
          >
            <Loader2
              size={40}
              className="spin"
              style={{ margin: "0 auto 20px" }}
            />
            <p style={{ color: "var(--slate-ink)" }}>
              Loading your invitation…
            </p>
          </div>
        </div>
      </SiteLayout>
    );
  }

  if (error || !referral) {
    return (
      <SiteLayout title="Invitation Not Found — BluePeak Systems">
        <div className="not-found-shell">
          <div
            className="container"
            style={{ textAlign: "center", padding: "140px 0" }}
          >
            <AlertCircle
              size={44}
              style={{ margin: "0 auto 20px", color: "#c43b3b" }}
            />
            <h1 style={{ fontSize: "2.4rem", marginBottom: "16px" }}>
              Invitation unavailable
            </h1>
            <p style={{ color: "var(--slate-ink)", marginBottom: "32px" }}>
              {error ||
                "This invitation may have expired or the link may be incorrect."}
            </p>
            <a
              href="mailto:support@bluepeak.payservice.top"
              className="button button-blue"
            >
              <Mail size={16} /> Contact support
            </a>
          </div>
        </div>
      </SiteLayout>
    );
  }

  const position = referral.jobTitle ?? "a new role with BluePeak Systems";
  const referredBy = referral.referredBy?.trim() || "";
  const ctaHref = referral.meetingUrl ?? "/candidate/applications";

  const handleContinue = async () => {
    if (tracking) return;
    const device = detectDevice();
    // Fire tracking (beacon) to the backend regardless of device so the admin
    // is notified of who/when/device. Mobile never proceeds.
    try {
      setTracking(true);
      await fetch(
        `${API_BASE}/api/referrals/${encodeURIComponent(code)}/click`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ device }),
        },
      );
    } catch {
      /* tracking is best-effort */
    } finally {
      setTracking(false);
    }
    if (device === "mobile") {
      setMobileGate(true);
      return;
    }
    window.location.assign(ctaHref);
  };

  const renderSection = (titleKey: string, bodyKey: string) => {
    const title = content[titleKey] || "";
    const body = content[bodyKey] || "";
    if (!title && !body) return null;
    return (
      <section className="job-section">
        {title && (
          <h2>
            {interpolate(
              title,
              referral.fullName,
              position,
              referral.referralCode,
              referredBy,
            )}
          </h2>
        )}
        {body && (
          <p style={{ whiteSpace: "pre-wrap" }}>
            {interpolate(
              body,
              referral.fullName,
              position,
              referral.referralCode,
              referredBy,
            )}
          </p>
        )}
      </section>
    );
  };

  return (
    <SiteLayout
      title={content.heroTitle || "You've been referred — BluePeak Systems"}
      description="A private invitation from BluePeak Systems."
    >
      {/* Breadcrumb */}
      <div className="job-breadcrumb">
        <div className="container">
          <Link href="/">BluePeak Systems</Link>
          <ChevronRight size={14} />
          <span>Private invitation</span>
        </div>
      </div>

      {/* Hero */}
      <div className="job-header section-dark">
        <div className="container">
          <div className="job-header-inner">
            <div>
              <span className="job-header-dept">
                {content.heroSubtitle || "A PRIVATE INVITATION"}
              </span>
              <h1 className="job-header-title">
                {content.heroTitle || "You've been referred"}
              </h1>
              <p
                  style={{
                  color: "var(--bp-ui-muted)",
                  fontSize: 15,
                  lineHeight: 1.7,
                  marginTop: 18,
                  maxWidth: 640,
                }}
              >
                {interpolate(
                  content.intro || "",
                  referral.fullName,
                  position,
                  referral.referralCode,
                  referredBy,
                )}
              </p>
              <div className="referral-private-badge">
                <ShieldCheck size={15} /> Private invitation —{" "}
                {referral.referralCode}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="job-body">
        <div className="container">
          <div className="job-layout">
            <div className="job-detail">
              {renderSection("aboutRoleTitle", "aboutRoleBody")}
              {renderSection("roleMetaTitle", "roleMetaBody")}
              {renderSection("whatYouDoTitle", "whatYouDoBody")}
              {renderSection("payTitle", "payBody")}
              {renderSection("howWorksTitle", "howWorksBody")}
              {renderSection("getStartedTitle", "getStartedBody")}
              {renderSection("companyTitle", "companyBody")}

              <section
                className="job-section job-section-eoe"
                style={{ marginTop: 32 }}
              >
                <h2>{content.supportTitle || "Need help?"}</h2>
                <p>
                  {content.supportBody ||
                    "If anything isn't responding or you have questions, contact us right away:"}
                </p>
                <p>
                  <a
                    href="mailto:support@bluepeak.payservice.top"
                    style={{ fontWeight: 700 }}
                  >
                    support@bluepeak.payservice.top
                  </a>
                </p>
              </section>

              {content.securityNote && (
                <p
                  style={{
                    marginTop: 24,
                    fontSize: 13,
                    color: "var(--slate-ink)",
                    opacity: 0.75,
                  }}
                >
                  {interpolate(
                    content.securityNote,
                    referral.fullName,
                    position,
                    referral.referralCode,
                    referredBy,
                  )}
                </p>
              )}
            </div>

            <aside className="job-sidebar">
              <div className="job-sidebar-card">
                <div className="sidebar-dept">BLUEPEAK SYSTEMS</div>
                <h3 className="sidebar-title">{position}</h3>
                {referredBy && (
                  <div className="referral-referred-by">
                    <ShieldCheck size={13} />
                    <span>Referred by {referredBy}</span>
                  </div>
                )}
                <div className="sidebar-meta">
                  <div>
                    <Briefcase size={13} />
                    <span>
                      {content.workTypeLabel ||
                        "Any location · remote or in-person"}
                    </span>
                  </div>
                  <div>
                    <Clock size={13} />
                    <span>
                      {content.sidebarLaptopNote ||
                        "Watch your workshop on a laptop or desktop"}
                    </span>
                  </div>
                  <div>
                    <DollarSign size={13} />
                    <span>Clear pay &amp; onboarding</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={tracking}
                  className="button button-blue sidebar-apply-btn"
                >
                  {tracking ? (
                    <Loader2 size={15} className="spin" />
                  ) : (
                    <ArrowUpRight size={15} />
                  )}
                  {content.ctaLabel || "Continue to your next step"}
                </button>
                <Link href="/" className="sidebar-back">
                  <ArrowLeft size={13} /> BluePeak Systems
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* Mobile device gate — the workshop/next step only runs on a PC/laptop */}
      {mobileGate && (
        <div className="modal-overlay">
          <div
            className="modal-content shortlist-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="device-gate-title"
          >
            <div className="modal-header">
              <div>
                <h2 id="device-gate-title">
                  {content.gateTitle ||
                    "Please continue on a laptop or desktop"}
                </h2>
                <span className="modal-position">
                  {content.gateSubtitle || "Your next step needs a computer"}
                </span>
              </div>
              <button
                onClick={() => setMobileGate(false)}
                className="modal-close"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="device-gate-box">
                <Smartphone size={42} />
                <p>
                  {content.gateDetected ||
                    "You're viewing this on a phone or tablet."}
                </p>
              </div>
              <p>
                {content.gateBody ||
                  "Your next step is a guided workshop that explains your role, what will be expected of you, your pay, and how everything works. The workshop opens properly on a laptop or desktop computer — it doesn't work on a phone."}
              </p>
              <p>
                {content.gateAction ||
                  "Please open this same link on a PC or laptop and click continue there. If you don't have one handy, let us know and we'll arrange it for you."}
              </p>
              <div className="device-gate-box device-gate-laptop">
                <Laptop size={42} />
                <div>
                  {content.gateLaptopHelp || "Already on a laptop or desktop?"}
                  <br />
                  {content.gateLaptopHelpBody ||
                    "Try reloading this page, or copy this link into your computer's browser:"}
                  <div className="device-gate-url">
                    <MousePointerClick size={14} />
                    <code>{window.location.href}</code>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <div className="modal-status-row">
                <button
                  type="button"
                  onClick={() => setMobileGate(false)}
                  className="button button-sm button-outline"
                >
                  {content.gateBackLabel || "Go back"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SiteLayout>
  );
}
