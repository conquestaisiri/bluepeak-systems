import { ArrowUpRight } from "lucide-react";
import { Link } from "wouter";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <Link
            href="/"
            className="site-footer-wordmark"
            aria-label="BluePeak Systems home"
          >
            <img src="/bluepeak-mark.png" alt="" className="site-footer-logo" />
            <span>BluePeak Systems</span>
          </Link>
          <p>People for the work ahead - across every kind of role.</p>
          <a
            href="mailto:careers.bluepeak@payservice.top"
            className="site-footer-email"
          >
            careers.bluepeak@payservice.top
          </a>
        </div>

        <div className="site-footer-column">
          <span className="site-footer-label">Explore</span>
          <a href="/#work">What we do</a>
          <a href="/#process">How it works</a>
          <Link href="/careers">Careers</Link>
          <a href="/#contact">Contact</a>
        </div>

        <div className="site-footer-column">
          <span className="site-footer-label">For professionals</span>
          <Link href="/careers">Browse open roles</Link>
          <Link href="/login">Candidate access</Link>
          <a href="mailto:support@bluepeak.payservice.top">Candidate support</a>
        </div>

        <div className="site-footer-column site-footer-cta-column">
          <span className="site-footer-label">For organizations</span>
          <p>Need dependable people for the work ahead?</p>
          <a href="/#contact" className="site-footer-cta">
            Talk to BluePeak <ArrowUpRight size={15} />
          </a>
        </div>
      </div>

      <div className="site-footer-bottom">
        <span>
          (c) {new Date().getFullYear()} BluePeak Systems. All rights reserved.
        </span>
        <span>Remote / Hybrid / On-site</span>
        <a href="https://www.linkedin.com" target="_blank" rel="noreferrer">
          LinkedIn <ArrowUpRight size={13} />
        </a>
      </div>
    </footer>
  );
}
