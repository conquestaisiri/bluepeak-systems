import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import {
  ArrowUp,
  ArrowUpRight,
  ChevronRight,
  Linkedin,
  Menu,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  ["About", "/#about"],
  ["Solutions", "/#work"],
  ["How it works", "/#process"],
  ["Careers", "/careers"],
  ["Contact", "/#contact"],
] as const;

interface SiteLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function SiteLayout({ children, title, description }: SiteLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    document.title =
      title ??
      "BluePeak Systems | Talent for any role — remote, hybrid, or on-site";
    const desc =
      description ??
      "BluePeak finds, vets, and manages high-quality people for growing organizations — remote, hybrid, on-site, and hands-on field roles across any department. Browse open positions or tell us what you need.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);
  }, [title, description]);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 480);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const reveal = new IntersectionObserver(
      (entries) =>
        entries.forEach(
          (e) => e.isIntersecting && e.target.classList.add("is-visible"),
        ),
      { threshold: 0.1 },
    );
    document.querySelectorAll(".reveal").forEach((el) => reveal.observe(el));
    return () => reveal.disconnect();
  }, [location]);

  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <div className="site-shell">
      <header className="nav-wrap">
        <nav className="container nav-bar" aria-label="Main navigation">
          <Link href="/" className="brand" data-testid="button-brand">
            <img
              src="/bluepeak-mark.svg"
              alt="BluePeak Systems"
              className="brand-logo"
            />
          </Link>

          <div className="desktop-nav">
            {NAV_ITEMS.map(([label, href]) => (
              <a
                key={href}
                href={href}
                className={
                  location === href ||
                  (href === "/careers" && location.startsWith("/careers"))
                    ? "nav-active"
                    : ""
                }
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </a>
            ))}
          </div>

          <div className="nav-actions">
            <a
              className="nav-login"
              href="/careers"
              data-testid="link-professionals"
            >
              For professionals <ArrowUpRight size={14} />
            </a>
            <a
              className="button button-dark button-small"
              href="/#contact"
              data-testid="link-start-conversation"
            >
              Start a conversation <ArrowUpRight size={15} />
            </a>
          </div>

          <button
            className="mobile-menu"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
          >
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </nav>

        {mobileOpen && (
          <div className="mobile-nav container">
            {NAV_ITEMS.map(([label, href]) => (
              <a key={href} href={href} onClick={() => setMobileOpen(false)}>
                {label}
                <ChevronRight size={17} />
              </a>
            ))}
            <a
              href="/#contact"
              className="button button-blue"
              onClick={() => setMobileOpen(false)}
            >
              Start a conversation <ArrowUpRight size={16} />
            </a>
          </div>
        )}
      </header>

      <main style={{ paddingTop: "64px" }}>{children}</main>

      <footer className="footer">
        <div className="container footer-top">
          <Link
            href="/"
            className="brand footer-brand"
            data-testid="button-footer-brand"
          >
            <img
              src="/bluepeak-mark.svg"
              alt="BluePeak Systems"
              className="brand-logo"
            />
          </Link>
          <p>Workforce solutions and hiring—handled for you, for any role.</p>
          <div className="footer-links">
            <a href="/#about">About</a>
            <a href="/#work">What we do</a>
            <a href="/careers">Careers</a>
            <a href="/#contact">Contact</a>
          </div>
          <a
            href="https://www.linkedin.com"
            target="_blank"
            rel="noreferrer"
            className="social-link"
            aria-label="BluePeak on LinkedIn"
          >
            <Linkedin size={17} />
          </a>
        </div>
        <div className="container footer-bottom">
          <span>
            © {new Date().getFullYear()} BluePeak Systems. All rights reserved.
          </span>
          <span>Building workforces in 28+ countries.</span>
        </div>
      </footer>

      {showTop && (
        <button
          className="back-top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
        >
          <ArrowUp size={18} />
        </button>
      )}
    </div>
  );
}
