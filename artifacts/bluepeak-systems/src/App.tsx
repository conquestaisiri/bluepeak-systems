import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  ArrowDownRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  ChevronRight,
  Globe2,
  Headphones,
  Layers3,
  Linkedin,
  Mail,
  MapPin,
  Menu,
  Network,
  Quote,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  UsersRound,
  X,
  ArrowUp,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Route, Switch, Router as WouterRouter, useLocation, Link } from 'wouter';
import { CareersPage } from '@/pages/CareersPage';
import { JobPage } from '@/pages/JobPage';
import { ApplicationSuccess } from '@/pages/ApplicationSuccess';

const queryClient = new QueryClient();

const navItems = [
  ['About', '#about'],
  ['Solutions', '#solutions'],
  ['How it works', '#process'],
  ['Careers', '/careers'],
  ['Contact', '#contact'],
];

const services = [
  { icon: UsersRound, number: '01', title: 'Dedicated remote teams', copy: 'Build a high-performing pod around your roadmap. We handle sourcing, vetting, payroll, and the human details that keep people doing their best work.', tags: ['Engineering', 'Operations', 'Customer success'] },
  { icon: Layers3, number: '02', title: 'Flexible capacity', copy: 'Add proven specialists for a launch, a transformation, or a season of demand—without compromising on standards or culture.', tags: ['Project delivery', 'Specialist hiring', 'Scale-ups'] },
  { icon: Network, number: '03', title: 'Workforce advisory', copy: 'Turn distributed work into an advantage with practical guidance on roles, market rates, team design, and sustainable ways of working.', tags: ['Talent strategy', 'Global market maps', 'People operations'] },
];

const industries = ['Technology & SaaS', 'Financial services', 'Healthcare', 'E-commerce', 'Professional services', 'Travel & hospitality'];

const testimonials = [
  { quote: 'BluePeak gave us the confidence to expand our support operation across three time zones. The people are excellent, but the real difference is how thoughtfully the team is managed.', name: 'Mara Chen', role: 'VP, Customer Experience at Northstar Cloud', initials: 'MC' },
  { quote: 'We went from an open role to a productive product squad in weeks, not quarters. They understood the brief, challenged our assumptions, and found people who genuinely fit.', name: 'Julian Okafor', role: 'Chief Product Officer at Halcyon Labs', initials: 'JO' },
];

const faqs = [
  ['What does BluePeak manage for clients?', 'We manage the complete employment and people experience: sourcing, skills assessment, contracts, payroll coordination, local compliance support, onboarding, and ongoing success check-ins. You lead the work; we make the operating layer dependable.'],
  ['Where are BluePeak professionals located?', 'Our network spans carefully selected talent communities across Latin America, Eastern Europe, Africa, and Asia-Pacific. We match geography to your working hours, language needs, and the nature of the role.'],
  ['How quickly can we start?', 'Most searches begin with a focused intake and a shortlist within 7–10 business days. For urgent or multi-role programs, we can create a dedicated search sprint with your team.'],
  ['Do you work with individual professionals?', 'Yes. Professionals can explore open positions, submit their profile, and join our network at no cost. We are committed to legitimate, transparent opportunities and clear communication at every step.'],
];

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/careers/apply/success" component={ApplicationSuccess} />
            <Route path="/careers/:slug" component={JobPage} />
            <Route path="/careers" component={CareersPage} />
            <Route component={Home} />
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
  const [formState, setFormState] = useState<'idle' | 'success' | 'error'>('idle');
  const [formBusy, setFormBusy] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    document.title = 'BluePeak Systems | The people behind your next peak';
    const description = 'BluePeak Systems helps ambitious businesses build exceptional remote teams—and helps skilled professionals find legitimate global careers.';
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) { meta = document.createElement('meta'); meta.setAttribute('name', 'description'); document.head.appendChild(meta); }
    meta.setAttribute('content', description);
    const og = (property: string, content: string) => {
      let item = document.querySelector(`meta[property="${property}"]`);
      if (!item) { item = document.createElement('meta'); item.setAttribute('property', property); document.head.appendChild(item); }
      item.setAttribute('content', content);
    };
    og('og:title', 'BluePeak Systems | The people behind your next peak');
    og('og:description', description);
    og('og:type', 'website');
    const onScroll = () => setShowTop(window.scrollY > 640);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const reveal = new IntersectionObserver((entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('is-visible')), { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach((el) => reveal.observe(el));
    return () => reveal.disconnect();
  }, []);

  const go = (href: string) => {
    setMobileOpen(false);
    if (href.startsWith('/')) {
      setLocation(href);
    } else {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const submitContact = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity()) { setFormState('error'); return; }
    setFormBusy(true);
    setFormState('idle');
    window.setTimeout(() => { setFormBusy(false); setFormState('success'); form.reset(); }, 800);
  };

  return (
    <div className="site-shell">
      <header className="nav-wrap">
        <nav className="container nav-bar" aria-label="Main navigation">
          <button className="brand" onClick={() => go('#top')} data-testid="button-brand">
            <span className="brand-mark"><span /></span><span>bluepeak<span className="brand-dot">.</span></span>
          </button>
          <div className="desktop-nav">
            {navItems.map(([label, href]) =>
              href.startsWith('/') ? (
                <Link key={href} href={href} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}>{label}</Link>
              ) : (
                <a key={href} href={href} onClick={() => setMobileOpen(false)} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}>{label}</a>
              )
            )}
          </div>
          <div className="nav-actions">
            <Link className="nav-login" href="/careers" data-testid="link-professionals">For professionals <ArrowUpRight size={14} /></Link>
            <a className="button button-dark button-small" href="#contact" data-testid="link-start-conversation">Start a conversation <ArrowUpRight size={15} /></a>
          </div>
          <button className="mobile-menu" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'} data-testid="button-mobile-menu">{mobileOpen ? <X /> : <Menu />}</button>
        </nav>
        {mobileOpen && (
          <div className="mobile-nav container">
            {navItems.map(([label, href]) =>
              href.startsWith('/') ? (
                <Link key={href} href={href} onClick={() => setMobileOpen(false)} data-testid={`link-mobile-${label.toLowerCase().replaceAll(' ', '-')}`}>{label}<ChevronRight size={17} /></Link>
              ) : (
                <a key={href} href={href} onClick={() => setMobileOpen(false)} data-testid={`link-mobile-${label.toLowerCase().replaceAll(' ', '-')}`}>{label}<ChevronRight size={17} /></a>
              )
            )}
            <a href="#contact" className="button button-blue" onClick={() => setMobileOpen(false)}>Start a conversation <ArrowUpRight size={16} /></a>
          </div>
        )}
      </header>

      <main id="top">
        <section className="hero section-dark">
          <div className="hero-grid" />
          <div className="container hero-content">
            <div className="eyebrow light-eyebrow reveal"><span className="eyebrow-line" />GLOBAL WORKFORCE PARTNER</div>
            <h1 className="hero-title reveal">The people<br /><em>behind</em> your<br /><span>next peak.</span></h1>
            <div className="hero-bottom reveal">
              <p>BluePeak helps ambitious businesses build exceptional remote teams—and helps skilled professionals find work worth showing up for.</p>
              <div className="hero-buttons"><a className="button button-mint" href="#contact" data-testid="button-build-team">Build your team <ArrowUpRight size={17} /></a><Link className="text-link light-link" href="/careers" data-testid="link-find-role">Find your next role <ArrowDownRight size={17} /></Link></div>
            </div>
            <div className="hero-proof reveal"><span>Trusted by teams building what is next</span><div className="proof-logos"><b>northstar</b><b>HALCYON</b><b>arc /</b><b>Meridian</b></div></div>
          </div>
          <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
        </section>

        <section className="trust-strip"><div className="container trust-items"><span><Globe2 size={19} /> 28 countries in our network</span><span><ShieldCheck size={19} /> People-first compliance</span><span><Timer size={19} /> Shortlists in 7–10 days</span></div></section>

        <section className="section section-intro" id="about">
          <div className="container two-col-intro">
            <div className="section-kicker reveal">01 / ABOUT BLUEPEAK</div>
            <div className="intro-copy reveal"><h2>Remote is a location.<br /><span>Trust is a practice.</span></h2><p className="lead">The best distributed teams are not assembled by accident. They are built with care: the right person, in the right role, with the right support to do meaningful work.</p><p>BluePeak Systems is the workforce partner for companies that are ready to think beyond the traditional org chart. We connect businesses to remarkable professionals across the globe, then stay close enough to make the relationship last.</p><a className="text-link blue-link" href="#solutions" data-testid="link-learn-about">How we make it work <ArrowUpRight size={16} /></a></div>
          </div>
        </section>

        <section className="mission section-dark">
          <div className="container mission-layout"><div className="mission-label reveal"><span>OUR MISSION</span><span className="mission-line" /></div><div className="mission-statement reveal">Make work more <span>human,</span><br />wherever it happens.</div><div className="mission-note reveal">We believe access to exceptional opportunity should not depend on your postcode—and that businesses are stronger when they widen the circle.</div></div>
        </section>

        <section className="section services-section" id="solutions">
          <div className="container"><div className="section-heading reveal"><div><div className="section-kicker">02 / WHAT WE DO</div><h2>Capability without<br /><span>compromise.</span></h2></div><p>One partner for the talent, systems, and confidence it takes to do your best work across borders.</p></div><div className="service-list">{services.map(({ icon: Icon, number, title, copy, tags }) => <article className="service-row reveal" key={number}><div className="service-number">{number}</div><div className="service-icon"><Icon size={25} /></div><div className="service-body"><h3>{title}</h3><p>{copy}</p><div className="tag-list">{tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div><ArrowUpRight className="service-arrow" size={21} /></article>)}</div></div>
        </section>

        <section className="section industries-section">
          <div className="container industries-layout"><div className="section-kicker reveal">03 / SECTORS WE KNOW</div><div className="industries-content reveal"><h2>Deep context.<br /><span>Wider reach.</span></h2><p>Our specialists understand the pace, precision, and pressures of modern business. We bring that context to every search.</p><div className="industry-grid">{industries.map((industry, index) => <div className="industry-item" key={industry}><span>0{index + 1}</span>{industry}<ArrowUpRight size={15} /></div>)}</div></div></div>
        </section>

        <section className="section why-section section-blue">
          <div className="container why-layout"><div className="why-title reveal"><div className="section-kicker blue-kicker">04 / THE BLUEPEAK DIFFERENCE</div><h2>A higher<br /><em>standard</em><br />of care.</h2></div><div className="why-points">{[['01', 'Human by design', 'We see the person behind the profile. Every match starts with listening, not a database.'], ['02', 'Built to last', 'We optimize for the second year, not just the signed contract—because great work compounds with trust.'], ['03', 'Clear by default', 'Straight answers, fair terms, and no hidden layers. We make global work feel surprisingly simple.']].map(([num, title, copy]) => <div className="why-point reveal" key={num}><span>{num}</span><div><h3>{title}</h3><p>{copy}</p></div></div>)}</div></div>
        </section>

        <section className="section process-section" id="process">
          <div className="container"><div className="section-heading reveal"><div><div className="section-kicker">05 / THE PROCESS</div><h2>Momentum, with<br /><span>method.</span></h2></div><p>Good hiring should feel considered, not complicated. Our process is structured enough to give you confidence and human enough to stay responsive.</p></div><div className="process-track">{[['01', 'Listen deeply', 'A focused intake turns your goals, gaps, and team dynamics into a clear brief.'], ['02', 'Meet the shortlist', 'We introduce a small group of people who can do the work and elevate the room.'], ['03', 'Make it official', 'We handle contracts, compliance, and onboarding so your new colleague can start strong.'], ['04', 'Keep building', 'Regular check-ins keep the relationship healthy, productive, and pointed forward.']].map(([num, title, copy]) => <div className="process-step reveal" key={num}><div className="step-top"><span>{num}</span><div className="step-dot" /></div><h3>{title}</h3><p>{copy}</p></div>)}</div></div>
        </section>

        <section className="business-band section-dark">
          <div className="container business-layout"><div className="section-kicker light-eyebrow reveal">A BETTER WAY TO SCALE</div><div className="business-copy reveal"><h2>Bring the ambition.<br /><span>We'll bring the people.</span></h2><p>From a first critical hire to a fully distributed function, we design the workforce layer around how your business actually moves.</p><a className="button button-mint" href="#contact" data-testid="button-talk-expert">Talk to a workforce expert <ArrowUpRight size={17} /></a></div><div className="business-stat reveal"><strong>4.8<span>/5</span></strong><small>average client experience score</small><div className="stat-rule" /><strong>91<span>%</span></strong><small>of placements still thriving after year one</small></div></div>
        </section>

        <section className="section careers-section" id="careers">
          <div className="container careers-layout">
            <div className="careers-copy reveal">
              <div className="section-kicker">06 / FOR PROFESSIONALS</div>
              <h2>Your next chapter<br /><span>can start here.</span></h2>
              <p>Bring your craft, curiosity, and point of view. We connect ambitious professionals with remote roles at companies that value the work—and the human doing it.</p>
              <Link className="button button-blue" href="/careers" data-testid="link-view-open-roles">View open roles <ArrowUpRight size={17} /></Link>
            </div>
            <div className="role-card reveal">
              <div className="role-card-top"><span>OPEN POSITIONS</span><span className="live-dot">● Live</span></div>
              {[
                ['Virtual Assistant', 'Remote · Global'],
                ['Customer Support Specialist', 'Remote · Global'],
                ['Bookkeeper', 'Remote · Global'],
              ].map(([role, location], index) => (
                <Link href={`/careers/${role.toLowerCase().replaceAll(' ', '-')}`} className="role-item" key={role} data-testid={`link-role-${index}`}>
                  <div><strong>{role}</strong><span>{location}</span></div>
                  <ArrowUpRight size={18} />
                </Link>
              ))}
              <Link className="all-roles" href="/careers">Explore all 14 opportunities <ChevronRight size={16} /></Link>
            </div>
          </div>
        </section>

        <section className="section testimonials-section">
          <div className="container"><div className="section-kicker reveal">07 / IN THEIR WORDS</div><div className="testimonial-grid">{testimonials.map((testimonial) => <article className="testimonial reveal" key={testimonial.name}><Quote size={33} className="quote-icon" /><p>"{testimonial.quote}"</p><div className="person"><span className="avatar">{testimonial.initials}</span><div><strong>{testimonial.name}</strong><small>{testimonial.role}</small></div></div></article>)}</div></div>
        </section>

        <section className="section faq-section">
          <div className="container faq-layout"><div className="faq-title reveal"><div className="section-kicker">08 / GOOD TO KNOW</div><h2>Questions,<br /><span>answered.</span></h2><p>Still curious? We like that. Bring the hard questions to a real person.</p><a className="text-link blue-link" href="#contact" data-testid="link-ask-question">Ask us anything <ArrowUpRight size={16} /></a></div><div className="faq-list reveal">{faqs.map(([question, answer], index) => <div className={`faq-item ${activeFaq === index ? 'open' : ''}`} key={question}><button onClick={() => setActiveFaq(activeFaq === index ? null : index)} aria-expanded={activeFaq === index} data-testid={`button-faq-${index}`}><span>{question}</span><ChevronDown size={18} /></button>{activeFaq === index && <p>{answer}</p>}</div>)}</div></div>
        </section>

        <section className="contact-section section-dark" id="contact">
          <div className="container contact-layout"><div className="contact-copy reveal"><div className="section-kicker light-eyebrow">09 / START HERE</div><h2>Let's make<br /><span>something work.</span></h2><p>Tell us where you're headed. We'll help you think through the people, the pace, and the next practical step.</p><div className="contact-detail"><Mail size={18} /><a href="mailto:hello@bluepeaksystems.top">hello@bluepeaksystems.top</a></div><div className="contact-detail"><MapPin size={18} /><span>Working globally, grounded in people</span></div></div><form className="contact-form reveal" onSubmit={submitContact} noValidate><div className="form-row"><label>First name<input name="firstName" placeholder="Your first name" required data-testid="input-first-name" /></label><label>Work email<input name="email" type="email" placeholder="you@company.com" required data-testid="input-email" /></label></div><label>What can we help with?<select name="interest" required defaultValue="" data-testid="select-interest"><option value="" disabled>Select an option</option><option>Build a remote team</option><option>Find my next role</option><option>Workforce advisory</option><option>Something else</option></select></label><label>Tell us a little more<textarea name="message" rows={4} placeholder="A sentence or two is a great start." required data-testid="input-message" /></label><button className="button button-mint form-submit" type="submit" disabled={formBusy} data-testid="button-submit-contact">{formBusy ? 'Sending…' : 'Send message'} <ArrowUpRight size={17} /></button>{formState === 'success' && <div className="form-feedback success" role="status" data-testid="status-form-success"><Check size={17} /> Message received. We'll be in touch shortly.</div>}{formState === 'error' && <div className="form-feedback error" role="alert" data-testid="status-form-error">Please complete each field with a valid answer.</div>}</form></div>
        </section>
      </main>

      <footer className="footer"><div className="container footer-top"><button className="brand footer-brand" onClick={() => go('#top')} data-testid="button-footer-brand"><span className="brand-mark"><span /></span><span>bluepeak<span className="brand-dot">.</span></span></button><p>Global talent. Human connection.<br />A higher standard of work.</p><div className="footer-links"><a href="#about">About</a><a href="#solutions">Solutions</a><Link href="/careers">Careers</Link><a href="#contact">Contact</a></div><a href="https://www.linkedin.com" target="_blank" rel="noreferrer" className="social-link" aria-label="BluePeak on LinkedIn" data-testid="link-linkedin"><Linkedin size={17} /></a></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} BluePeak Systems. All rights reserved.</span><span>Built for the way work moves.</span></div></footer>
      {showTop && <button className="back-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top" data-testid="button-back-top"><ArrowUp size={18} /></button>}
    </div>
  );
}

export default App;
