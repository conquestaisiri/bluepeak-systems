import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  ArrowDownRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  ChevronRight,
  Globe2,
  Headphones,
  Laptop2,
  Layers3,
  Mail,
  MapPin,
  Menu,
  Network,
  Package,
  Quote,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  Truck,
  UsersRound,
  Wrench,
  X,
  ArrowUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Route,
  Switch,
  Router as WouterRouter,
  useLocation,
  Link,
} from "wouter";
import { CareersPage } from "@/pages/CareersPage";
import { JobPage } from "@/pages/JobPage";
import { ApplicationSuccess } from "@/pages/ApplicationSuccess";
import { AdminDashboard } from "@/pages/Admin/AdminDashboard";
import { CandidateLogin } from "@/pages/CandidateLogin";
import { CandidateVerify } from "@/pages/CandidateVerify";
import { CandidateApplications } from "@/pages/CandidateApplications";
import { ReferralPage } from "@/pages/ReferralPage";
import { LandingPage } from "@/pages/LandingPage";
import { SiteFooter } from "@/components/site/SiteFooter";
import NotFound from "@/pages/not-found";
import { fetchJobs } from "@/lib/jobsApi";

const queryClient = new QueryClient();

const FALLBACK_ROLES = [
  { slug: "virtual-assistant", title: "Virtual Assistant" },
  { slug: "customer-support-specialist", title: "Customer Support Specialist" },
  { slug: "bookkeeper", title: "Bookkeeper" },
];

const navItems = [
  ["About", "#about"],
  ["Solutions", "#solutions"],
  ["How it works", "#process"],
  ["Careers", "/careers"],
  ["Contact", "#contact"],
];

const services = [
  {
    icon: UsersRound,
    number: "01",
    title: "Dedicated teams, any role",
    copy: "We build and manage full teams for your roadmap â€” remote, on-site, or hands-on field work â€” sourcing, vetting, payroll, and the day-to-day support that keeps people productive.",
    tags: [
      "Administration",
      "Warehouse & logistics",
      "Customer success",
      "Hospitality",
    ],
  },
  {
    icon: Layers3,
    number: "02",
    title: "Flexible capacity",
    copy: "Need extra hands for a launch, a delivery season, or a busy weekend? We add vetted people quickly, without lowering your standards.",
    tags: ["Project delivery", "Seasonal & surge staffing", "Scale-ups"],
  },
  {
    icon: Network,
    number: "03",
    title: "Workforce advice",
    copy: "Practical guidance on which roles to hire â€” from office and remote work to physical and field positions â€” what they should pay, and how to structure a team that works.",
    tags: ["Talent strategy", "Pay maps", "People operations"],
  },
];

const industries = [
  "Technology & SaaS",
  "Financial services",
  "Healthcare",
  "E-commerce & logistics",
  "Manufacturing & warehousing",
  "Professional services",
  "Retail & hospitality",
  "Facilities & cleaning",
];

const testimonials = [
  {
    quote:
      "BluePeak built our support team across three time zones and handles the employment side so we do not have to think about it. The people are strong, and the process was straightforward.",
    name: "Mara Chen",
    role: "VP, Customer Experience at Northstar Cloud",
    initials: "MC",
  },
  {
    quote:
      "We went from an open role to a working product team in a few weeks. They asked the right questions, found people who fit, and managed the paperwork end to end.",
    name: "Julian Okafor",
    role: "Chief Product Officer at Halcyon Labs",
    initials: "JO",
  },
];

const faqs = [
  [
    "What does BluePeak manage for clients?",
    "We handle sourcing, skills assessment, contracts, payroll coordination, local compliance, onboarding, and ongoing check-insâ€”for office, remote, hybrid, and on-site field roles. You lead the work; we manage the people side of it.",
  ],
  [
    "What kinds of roles does BluePeak fill?",
    "Practically any role your organization needs: virtual assistants, support, finance, and marketingâ€”as well as hands-on positions like warehouse, packing, cleaning, retail, and hospitality. Fully remote, hybrid, and in-person.",
  ],
  [
    "Where are BluePeak professionals located?",
    "Across Latin America, Eastern Europe, Africa, and Asia-Pacific, plus local staff for on-site and field roles. We match candidates to your working hours, language needs, and the specific role.",
  ],
  [
    "Do you work with individual professionals?",
    "Yes. Professionals can browse open roles and apply free of charge â€” whether they prefer remote work or hands-on roles. We keep the process transparent, so you always know where your application stands.",
  ],
];

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Switch>
            <Route path="/" component={LandingPage} />
            <Route path="/login" component={CandidateLogin} />
            <Route path="/login/confirm" component={CandidateVerify} />
            <Route
              path="/candidate/applications"
              component={CandidateApplications}
            />
            <Route
              path="/careers/apply/success"
              component={ApplicationSuccess}
            />
            <Route path="/careers/:slug" component={JobPage} />
            <Route path="/careers" component={CareersPage} />
            <Route path="/referral/:code" component={ReferralPage} />
            <Route path="/admin" component={AdminDashboard} />
            <Route path="/admin/*" component={AdminDashboard} />
            <Route component={NotFound} />
          </Switch>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [formState, setFormState] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [homeJobs, setHomeJobs] = useState<{ slug: string; title: string }[]>(
    [],
  );
  const [, setLocation] = useLocation();

  useEffect(() => {
    document.title =
      "BluePeak Systems | Talent for any role â€” remote, on-site, or in the field";
    const description =
      "BluePeak finds, vets, and manages high-quality people for growing organizations â€” remote, hybrid, on-site, and hands-on field roles across any department. Browse open positions or tell us what you need.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);
    const og = (property: string, content: string) => {
      let item = document.querySelector(`meta[property="${property}"]`);
      if (!item) {
        item = document.createElement("meta");
        item.setAttribute("property", property);
        document.head.appendChild(item);
      }
      item.setAttribute("content", content);
    };
    og(
      "og:title",
      "BluePeak Systems | Talent for any role â€” remote, on-site, or in the field",
    );
    og("og:description", description);
    og("og:type", "website");
    og("og:image", "https://bluepeak.payservice.top/og-image.png");
    og("og:url", window.location.href);
    const onScroll = () => setShowTop(window.scrollY > 640);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const reveal = new IntersectionObserver(
      (entries) =>
        entries.forEach(
          (entry) =>
            entry.isIntersecting && entry.target.classList.add("is-visible"),
        ),
      { threshold: 0.12 },
    );
    document.querySelectorAll(".reveal").forEach((el) => reveal.observe(el));
    return () => reveal.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchJobs()
      .then((jobs) => {
        if (!cancelled)
          setHomeJobs(jobs.map((j) => ({ slug: j.slug, title: j.title })));
      })
      .catch(() => {
        /* fall back to the static role list */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const go = (href: string) => {
    setMobileOpen(false);
    if (href.startsWith("/")) {
      setLocation(href);
    } else {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const submitContact = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity()) {
      setFormError("Please complete each field with a valid answer.");
      setFormState("error");
      return;
    }
    setFormBusy(true);
    setFormState("idle");
    const data = new FormData(form);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: String(data.get("firstName") ?? ""),
          email: String(data.get("email") ?? ""),
          interest: String(data.get("interest") ?? ""),
          message: String(data.get("message") ?? ""),
        }),
      });
      if (!res.ok) {
        let message = "Something went wrong. Please try again.";
        try {
          const body = await res.json();
          if (typeof body?.error === "string") message = body.error;
        } catch {
          /* ignore */
        }
        throw new Error(message);
      }
      setFormBusy(false);
      setFormState("success");
      form.reset();
    } catch (err) {
      setFormBusy(false);
      setFormError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
      setFormState("error");
    }
  };

  return (
    <div className="site-shell">
      <header className="nav-wrap">
        <nav className="container nav-bar" aria-label="Main navigation">
          <button
            className="brand"
            onClick={() => go("#top")}
            data-testid="button-brand"
          >
            <img
              src="/bluepeak-mark.png"
              alt="BluePeak Systems"
              className="brand-logo"
            />
          </button>
          <div className="desktop-nav">
            {navItems.map(([label, href]) =>
              href.startsWith("/") ? (
                <Link
                  key={href}
                  href={href}
                  data-testid={`link-nav-${label.toLowerCase().replaceAll(" ", "-")}`}
                >
                  {label}
                </Link>
              ) : (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  data-testid={`link-nav-${label.toLowerCase().replaceAll(" ", "-")}`}
                >
                  {label}
                </a>
              ),
            )}
          </div>
          <div className="nav-actions">
            <Link
              className="nav-login"
              href="/careers"
              data-testid="link-professionals"
            >
              For professionals <ArrowUpRight size={14} />
            </Link>
            <a
              className="button button-dark button-small"
              href="#contact"
              data-testid="link-start-conversation"
            >
              Start a conversation <ArrowUpRight size={15} />
            </a>
          </div>
          <button
            className="mobile-menu"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            data-testid="button-mobile-menu"
          >
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </nav>
        {mobileOpen && (
          <div className="mobile-nav container">
            {navItems.map(([label, href]) =>
              href.startsWith("/") ? (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  data-testid={`link-mobile-${label.toLowerCase().replaceAll(" ", "-")}`}
                >
                  {label}
                  <ChevronRight size={17} />
                </Link>
              ) : (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  data-testid={`link-mobile-${label.toLowerCase().replaceAll(" ", "-")}`}
                >
                  {label}
                  <ChevronRight size={17} />
                </a>
              ),
            )}
            <a
              href="#contact"
              className="button button-blue"
              onClick={() => setMobileOpen(false)}
            >
              Start a conversation <ArrowUpRight size={16} />
            </a>
          </div>
        )}
      </header>

      <main id="top">
        <section className="hero hero-editorial">
          <div className="container hero-editorial-inner">
            <div className="hero-topline">
              <span className="eyebrow">
                <span className="eyebrow-line" /> WORKFORCE, WITHOUT THE
                SHORTCUTS
              </span>
              <span className="hero-index">01 / 05</span>
            </div>
            <div
              className="hero-collage"
              aria-label="People doing different kinds of work"
            >
              <figure className="hero-image hero-image-office">
                <img
                  src="/work-office.jpg"
                  alt="Professionals collaborating around a table"
                />
              </figure>
              <figure className="hero-image hero-image-warehouse">
                <img
                  src="/work-warehouse.jpg"
                  alt="Warehouse worker handling stock and packing operations"
                />
              </figure>
              <figure className="hero-image hero-image-facilities">
                <img
                  src="/work-facilities.jpg"
                  alt="Facilities worker carrying out practical on-site work"
                />
              </figure>
              <figure className="hero-image hero-image-team">
                <img
                  src="/work-team.jpg"
                  alt="A diverse team working together"
                />
              </figure>
              <div className="hero-collage-note">
                <span>Four kinds of work.</span>
                <strong>One dependable partner.</strong>
              </div>
            </div>
            <div className="hero-editorial-copy">
              <h1 className="hero-title">
                The right people
                <br />
                <em>
                  for the work
                  <br />
                  ahead.
                </em>
              </h1>
              <div className="hero-editorial-aside">
                <p>
                  BluePeak helps organizations find, place, and support capable
                  peopleâ€”from operations and logistics to professional,
                  technical, and field roles.
                </p>
                <div className="hero-buttons">
                  <a
                    className="button button-dark"
                    href="#contact"
                    data-testid="button-build-team"
                  >
                    Tell us what you need <ArrowUpRight size={17} />
                  </a>
                  <Link
                    className="text-link blue-link"
                    href="/careers"
                    data-testid="link-find-role"
                  >
                    Find your next role <ArrowDownRight size={17} />
                  </Link>
                </div>
              </div>
            </div>
            <div className="hero-credibility">
              <span>Built for real work</span>
              <span>Remote Â· Hybrid Â· On-site</span>
              <span>People in 28+ countries</span>
            </div>
          </div>
        </section>

        <section className="trust-strip">
          <div className="container trust-items">
            <span>
              <Globe2 size={19} /> People in 28+ countries
            </span>
            <span>
              <ShieldCheck size={19} /> Employment, payroll, and compliance
              handled
            </span>
            <span>
              <Timer size={19} /> Shortlist in 7â€“10 days
            </span>
          </div>
        </section>

        <section className="section section-intro" id="about">
          <div className="container two-col-intro">
            <div className="section-kicker reveal">01 / ABOUT BLUEPEAK</div>
            <div className="intro-copy reveal">
              <h2>
                We help you hire
                <br />
                <span>and manage any team.</span>
              </h2>
              <p className="lead">
                Most companies don't have the time to source, vet, and manage
                talent across roles, cities, and countries. We do that for
                youâ€”end to end.
              </p>
              <p>
                BluePeak Systems is a workforce partner. We find and vet people
                for desk jobs, hands-on field work, and everything in between,
                then handle employment, payroll, and complianceâ€”so the working
                relationship holds up over time.
              </p>
              <a
                className="text-link blue-link"
                href="#solutions"
                data-testid="link-learn-about"
              >
                What we do <ArrowUpRight size={16} />
              </a>
            </div>
          </div>
        </section>

        <section className="mission section-dark">
          <div className="container mission-layout">
            <div className="mission-label reveal">
              <span>OUR MISSION</span>
              <span className="mission-line" />
            </div>
            <div className="mission-statement reveal">
              Good work should fit your life.
              <br />
              <span>Remote or on-site, it's real work.</span>
            </div>
            <div className="mission-note reveal">
              We believe everyone deserves real opportunities that match how
              they want to workâ€”some people thrive working from a laptop, and
              others prefer hands-on, in-person roles. We support both, for
              companies of every kind.
            </div>
          </div>
        </section>

        <section className="section services-section" id="solutions">
          <div className="container">
            <div className="section-heading reveal">
              <div>
                <div className="section-kicker">02 / WHAT WE DO</div>
                <h2>
                  Three ways
                  <br />
                  <span>we help.</span>
                </h2>
              </div>
              <p>
                One partner for hiring, employment, and the systems that keep
                teams â€” deskside, remote, and hands-on â€” running smoothly.
              </p>
            </div>
            <div className="service-list">
              {services.map(({ icon: Icon, number, title, copy, tags }) => (
                <article className="service-row reveal" key={number}>
                  <div className="service-number">{number}</div>
                  <div className="service-icon">
                    <Icon size={25} />
                  </div>
                  <div className="service-body">
                    <h3>{title}</h3>
                    <p>{copy}</p>
                    <div className="tag-list">
                      {tags.map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                  </div>
                  <ArrowUpRight className="service-arrow" size={21} />
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section industries-section">
          <div className="container industries-layout">
            <div className="section-kicker reveal">03 / SECTORS WE KNOW</div>
            <div className="industries-content reveal">
              <h2>
                Experience in the industries
                <br />
                <span>we hire for.</span>
              </h2>
              <p>
                From office and remote roles to warehouses, retail, and
                facilities, we understand the positions, skills, and pay
                expectations in each sector.
              </p>
              <div className="industry-grid">
                {industries.map((industry, index) => (
                  <div className="industry-item" key={industry}>
                    <span>0{index + 1}</span>
                    {industry}
                    <ArrowUpRight size={15} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="section work-styles-section">
          <div className="container">
            <div className="section-heading reveal">
              <div>
                <div className="section-kicker">
                  A ROLE FOR EVERY KIND OF WORK
                </div>
                <h2>
                  Desk jobs, remote work,
                  <br />
                  <span>and hands-on roles.</span>
                </h2>
              </div>
              <p>
                Not everyone wants to sit at a laptop all day â€” and many roles
                are better done with your hands. We staff both, so you can work
                the way that suits you.
              </p>
            </div>

            <div className="work-styles-layout">
              <div className="work-style-panel reveal">
                <div className="work-style-img">
                  <img
                    src="/hero.png"
                    alt="Remote and desk professionals collaborating"
                  />
                </div>
                <div className="work-style-icon">
                  <Laptop2 size={22} />
                </div>
                <div className="work-style-body">
                  <span className="work-style-tag">DESK &amp; REMOTE</span>
                  <h3>Virtual assistants, support, finance, marketing</h3>
                  <p>
                    Prefer working from a laptop, at home or in an office? We
                    place trained professionals in thousands of desk roles
                    across support, admin, sales, finance, and more.
                  </p>
                </div>
              </div>

              <div className="work-style-panel reveal">
                <div className="work-style-img">
                  <img
                    src="/work-warehouse.svg"
                    alt="Warehouse and packing staff at work"
                  />
                </div>
                <div className="work-style-icon">
                  <Package size={22} />
                </div>
                <div className="work-style-body">
                  <span className="work-style-tag">
                    WAREHOUSE &amp; LOGISTICS
                  </span>
                  <h3>Packing, shipping, inventory, and logistics</h3>
                  <p>
                    Hands-on roles for people who like to keep moving. We staff
                    warehouses, distribution centres, and fulfilment teams for
                    busy seasons and steady operations alike.
                  </p>
                </div>
              </div>

              <div className="work-style-panel reveal">
                <div className="work-style-img">
                  <img
                    src="/work-field.svg"
                    alt="Facilities and cleaning staff at work"
                  />
                </div>
                <div className="work-style-icon">
                  <Wrench size={22} />
                </div>
                <div className="work-style-body">
                  <span className="work-style-tag">
                    FACILITIES, CLEANING &amp; FIELD
                  </span>
                  <h3>Cleaning, maintenance, retail, and field work</h3>
                  <p>
                    Many people love a role where the work is visible and the
                    day is physical. We staff facilities, cleaning, retail,
                    hospitality, and on-site field teams too.
                  </p>
                </div>
              </div>
            </div>

            <div className="work-styles-note reveal">
              <ShieldCheck size={18} />
              <span>
                However your team works â€” fully remote, fully on-site, or a mix
                of both â€” we hire, train, and support the people behind the
                work.
              </span>
            </div>
          </div>
        </section>

        <section className="section why-section section-blue">
          <div className="container why-layout">
            <div className="why-title reveal">
              <div className="section-kicker blue-kicker">04 / HOW WE WORK</div>
              <h2>
                What you get
                <br />
                <em>from us,</em>
                <br />
                and what you don't.
              </h2>
            </div>
            <div className="why-points">
              {[
                [
                  "01",
                  "Vetted people, not resumes",
                  "We screen and test candidates before they reach you, so you only meet people who can actually do the job.",
                ],
                [
                  "02",
                  "Employment handled",
                  "Contracts, payroll, local compliance, and onboarding are taken care of on our side.",
                ],
                [
                  "03",
                  "Straight answers",
                  "Clear pricing, honest timelines, and no surprises. If something is not a good fit, we tell you.",
                ],
              ].map(([num, title, copy]) => (
                <div className="why-point reveal" key={num}>
                  <span>{num}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section process-section" id="process">
          <div className="container">
            <div className="section-heading reveal">
              <div>
                <div className="section-kicker">05 / THE PROCESS</div>
                <h2>
                  A simple path
                  <br />
                  <span>from brief to hire.</span>
                </h2>
              </div>
              <p>
                Four clear steps, each one with a defined outcome. You always
                know where things stand.
              </p>
            </div>
            <div className="process-track">
              {[
                [
                  "01",
                  "Tell us the role",
                  "We start with a focused brief: the role, the skills, the pay range, and what success looks like.",
                ],
                [
                  "02",
                  "Review the shortlist",
                  "We send a small group of vetted candidates. You pick who you want to meet.",
                ],
                [
                  "03",
                  "We handle the rest",
                  "Contracts, compliance, payroll, and onboarding are managed on our side.",
                ],
                [
                  "04",
                  "Stay supported",
                  "We check in regularly and stay available so the relationship keeps working.",
                ],
              ].map(([num, title, copy]) => (
                <div className="process-step reveal" key={num}>
                  <div className="step-top">
                    <span>{num}</span>
                    <div className="step-dot" />
                  </div>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="business-band section-dark">
          <div className="container business-layout">
            <div className="section-kicker light-eyebrow reveal">
              THE RESULTS
            </div>
            <div className="business-copy reveal">
              <h2>
                Numbers from
                <br />
                <span>the work we do.</span>
              </h2>
              <p>
                We track how our placements perform, and we share those numbers
                honestly. Here's what we're seeing.
              </p>
              <a
                className="button button-mint"
                href="#contact"
                data-testid="button-talk-expert"
              >
                Talk to us about your needs <ArrowUpRight size={17} />
              </a>
            </div>
            <div className="business-stat reveal">
              <strong>
                4.8<span>/5</span>
              </strong>
              <small>average satisfaction from clients we surveyed</small>
              <div className="stat-rule" />
              <strong>
                91<span>%</span>
              </strong>
              <small>of placements still active after one year</small>
            </div>
          </div>
        </section>

        <section className="section careers-section" id="careers">
          <div className="container careers-layout">
            <div className="careers-copy reveal">
              <div className="section-kicker">06 / FOR PROFESSIONALS</div>
              <h2>
                Find the role
                <br />
                <span>that fits you.</span>
              </h2>
              <p>
                Browse open positions â€” from laptops at home to hands-on work
                on-site â€” apply in minutes, and track your application online.
                No surprise calls, just a clear process.
              </p>
              <Link
                className="button button-blue"
                href="/careers"
                data-testid="link-view-open-roles"
              >
                View open positions <ArrowUpRight size={17} />
              </Link>
            </div>
            <div className="role-card reveal">
              <div className="role-card-top">
                <span>OPEN POSITIONS</span>
                <span className="live-dot">â— Live</span>
              </div>
              {[
                ...(homeJobs.length ? homeJobs.slice(0, 3) : FALLBACK_ROLES),
              ].map((role, index) => (
                <Link
                  href={`/careers/${role.slug}`}
                  className="role-item"
                  key={role.slug}
                  data-testid={`link-role-${index}`}
                >
                  <div>
                    <strong>{role.title}</strong>
                    <span>Remote Â· On-site Â· Hybrid</span>
                  </div>
                  <ArrowUpRight size={18} />
                </Link>
              ))}
              <Link className="all-roles" href="/careers">
                Explore all {homeJobs.length ? `${homeJobs.length}` : ""}{" "}
                opportunities <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        <section className="section testimonials-section">
          <div className="container">
            <div className="section-kicker reveal">07 / WHAT CLIENTS SAY</div>
            <div className="testimonial-grid">
              {testimonials.map((testimonial) => (
                <article className="testimonial reveal" key={testimonial.name}>
                  <Quote size={33} className="quote-icon" />
                  <p>"{testimonial.quote}"</p>
                  <div className="person">
                    <span className="avatar">{testimonial.initials}</span>
                    <div>
                      <strong>{testimonial.name}</strong>
                      <small>{testimonial.role}</small>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section faq-section">
          <div className="container faq-layout">
            <div className="faq-title reveal">
              <div className="section-kicker">08 / GOOD TO KNOW</div>
              <h2>
                Common
                <br />
                <span>questions.</span>
              </h2>
              <p>
                If yours is not listed, send it to us directlyâ€”we answer every
                message.
              </p>
              <a
                className="text-link blue-link"
                href="#contact"
                data-testid="link-ask-question"
              >
                Ask us anything <ArrowUpRight size={16} />
              </a>
            </div>
            <div className="faq-list reveal">
              {faqs.map(([question, answer], index) => (
                <div
                  className={`faq-item ${activeFaq === index ? "open" : ""}`}
                  key={question}
                >
                  <button
                    onClick={() =>
                      setActiveFaq(activeFaq === index ? null : index)
                    }
                    aria-expanded={activeFaq === index}
                    data-testid={`button-faq-${index}`}
                  >
                    <span>{question}</span>
                    <ChevronDown size={18} />
                  </button>
                  {activeFaq === index && <p>{answer}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="contact-section section-dark" id="contact">
          <div className="container contact-layout">
            <div className="contact-copy reveal">
              <div className="section-kicker light-eyebrow">
                09 / START HERE
              </div>
              <h2>
                Tell us what
                <br />
                <span>you need.</span>
              </h2>
              <p>
                A short message is enough. We reply with next stepsâ€”and a
                straight answer on whether we can help.
              </p>
              <div className="contact-detail">
                <Mail size={18} />
                <a href="mailto:hello.bluepeak@payservice.top">
                  hello.bluepeak@payservice.top
                </a>
              </div>
              <div className="contact-detail">
                <MapPin size={18} />
                <span>
                  Working globally â€” remote and on-site roles in 28+ countries
                </span>
              </div>
            </div>
            <form
              className="contact-form reveal"
              onSubmit={submitContact}
              noValidate
            >
              <div className="form-row">
                <label>
                  First name
                  <input
                    name="firstName"
                    placeholder="Your first name"
                    required
                    data-testid="input-first-name"
                  />
                </label>
                <label>
                  Work email
                  <input
                    name="email"
                    type="email"
                    placeholder="you@company.com"
                    required
                    data-testid="input-email"
                  />
                </label>
              </div>
              <label>
                What can we help with?
                <select
                  name="interest"
                  required
                  defaultValue=""
                  data-testid="select-interest"
                >
                  <option value="" disabled>
                    Select an option
                  </option>
                  <option>Build or staff a team</option>
                  <option>Find my next role</option>
                  <option>Hiring advice</option>
                  <option>Something else</option>
                </select>
              </label>
              <label>
                Tell us a little more
                <textarea
                  name="message"
                  rows={4}
                  placeholder="A sentence or two is a great start."
                  required
                  data-testid="input-message"
                />
              </label>
              <button
                className="button button-mint form-submit"
                type="submit"
                disabled={formBusy}
                data-testid="button-submit-contact"
              >
                {formBusy ? "Sendingâ€¦" : "Send message"}{" "}
                <ArrowUpRight size={17} />
              </button>
              {formState === "success" && (
                <div
                  className="form-feedback success"
                  role="status"
                  data-testid="status-form-success"
                >
                  <Check size={17} /> Message received. We'll be in touch
                  shortly.
                </div>
              )}
              {formState === "error" && (
                <div
                  className="form-feedback error"
                  role="alert"
                  data-testid="status-form-error"
                >
                  {formError}
                </div>
              )}
            </form>
          </div>
        </section>
      </main>

      <SiteFooter />
      {showTop && (
        <button
          className="back-top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
          data-testid="button-back-top"
        >
          <ArrowUp size={18} />
        </button>
      )}
    </div>
  );
}

export default App;
