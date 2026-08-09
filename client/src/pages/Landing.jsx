import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  ShieldCheck,
  Link2,
  ScanLine,
  LayoutDashboard,
  FileText,
  ArrowRight,
  Menu,
  X,
} from "lucide-react";

/* ============================================================
   Content
============================================================ */

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it Works", href: "#how-it-works" },
  { label: "GitHub", href: "https://github.com", external: true },
];

const TECHS = ["GitHub", "Semgrep", "OWASP", "MongoDB", "React", "Node.js", "Express", "JWT"];

const SEVERITY_COLOR = {
  High: "#F0616B",
  Medium: "#F0B429",
  Low: "#4C6FFF",
};

const THREATS = [
  { label: "SQL Injection", severity: "High", top: "14%", left: "8%", delay: 0 },
  { label: "Hardcoded Secret", severity: "High", top: "68%", left: "6%", delay: 1.4 },
  { label: "XSS", severity: "Medium", top: "22%", left: "86%", delay: 0.6 },
  { label: "Insecure Deserialization", severity: "Medium", top: "78%", left: "82%", delay: 2.1 },
  { label: "Missing Rate Limiting", severity: "Low", top: "48%", left: "3%", delay: 0.9 },
  { label: "Weak Crypto", severity: "Low", top: "40%", left: "90%", delay: 1.8 },
];

const FEATURES = [
  {
    icon: ScanLine,
    title: "Static Analysis",
    body: "Semgrep scans every file for known vulnerability patterns — SQL injection, hardcoded secrets, XSS, and more — before code ever ships.",
    large: true,
  },
  {
    icon: Link2,
    title: "GitHub Integration",
    body: "Connect a repository and Guardrail clones it securely over the GitHub API.",
  },
  {
    icon: LayoutDashboard,
    title: "Severity Dashboard",
    body: "Findings ranked High to Low, so your team fixes what matters first.",
  },
  {
    icon: FileText,
    title: "Audit-Ready Reports",
    body: "Export a report mapped to OWASP categories, ready for auditors.",
  },
];

const PIPELINE = [
  { title: "Repository", body: "Point Guardrail at any GitHub repo you have access to." },
  { title: "Clone", body: "The codebase is cloned into an isolated scan environment." },
  { title: "Semgrep Analysis", body: "Static rules run across every file for known vulnerability patterns." },
  { title: "Findings Engine", body: "Matches are deduplicated, ranked, and mapped to file and line." },
  { title: "OWASP Mapping", body: "Each finding is tagged with its OWASP Top 10 category." },
  { title: "Report", body: "A shareable report is generated, ready for review or audit." },
];

const FINDINGS = [
  { severity: "High", rule: "SQL Injection", file: "routes/orders.js", line: 88 },
  { severity: "High", rule: "Hardcoded Secret", file: "config/env.default.js", line: 14 },
  { severity: "Medium", rule: "Cross-Site Scripting", file: "views/search.ejs", line: 42 },
  { severity: "Medium", rule: "Insecure Deserialization", file: "utils/parse.js", line: 21 },
  { severity: "Low", rule: "Missing Rate Limiting", file: "routes/auth.js", line: 5 },
];

/* ============================================================
   Hooks
============================================================ */

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function Reveal({ as: Tag = "div", delay = 0, className = "", children }) {
  const [ref, visible] = useReveal();
  return (
    <Tag
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
      } ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </Tag>
  );
}

/* ============================================================
   Signature element — Threat Constellation
   Real vulnerability names drift slowly across a gradient-mesh
   backdrop behind the headline. Ambient rather than literal —
   the hero reads as "this is what's out there," where the
   product preview later shows what Guardrail does about it.
============================================================ */

function ThreatConstellation({ reducedMotion }) {
  return (
    <div className="pointer-events-none absolute inset-0 hidden md:block">
      {THREATS.map((t) => (
        <span
          key={t.label}
          className={reducedMotion ? "" : "animate-drift"}
          style={{
            position: "absolute",
            top: t.top,
            left: t.left,
            animationDelay: `${t.delay}s`,
          }}
        >
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11.5px] backdrop-blur-sm"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              color: SEVERITY_COLOR[t.severity],
              borderColor: `${SEVERITY_COLOR[t.severity]}40`,
              backgroundColor: `${SEVERITY_COLOR[t.severity]}0D`,
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: SEVERITY_COLOR[t.severity] }}
            />
            {t.label}
          </span>
        </span>
      ))}
    </div>
  );
}

/* ============================================================
   Landing page
============================================================ */

function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="bg-[#05060A] text-[#F5F6F8] min-h-screen overflow-x-hidden">
      {/* =========================
          Navigation
      ========================= */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? "backdrop-blur-md bg-[#05060A]/85 border-b border-[#1E212B]"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#4C6FFF]/10 border border-[#4C6FFF]/30">
              <ShieldCheck className="h-4 w-4 text-[#4C6FFF]" strokeWidth={2} />
            </div>
            <span
              className="text-base font-semibold tracking-tight"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Guardrail
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noreferrer" : undefined}
                className="text-sm text-[#8B92A0] hover:text-[#F5F6F8] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="text-sm text-[#8B92A0] hover:text-[#F5F6F8] transition-colors">
              Sign In
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center rounded-md bg-[#4C6FFF] hover:bg-[#3D5EEB] hover:shadow-[0_0_24px_rgba(76,111,255,0.4)] transition-all px-4 py-2 text-sm font-medium text-white"
            >
              Get Started
            </Link>
          </div>

          <button
            className="md:hidden text-[#8B92A0]"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-[#1E212B] bg-[#05060A] px-6 py-4 space-y-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noreferrer" : undefined}
                className="block text-sm text-[#8B92A0]"
              >
                {link.label}
              </a>
            ))}
            <div className="flex items-center gap-3 pt-2">
              <Link to="/login" className="text-sm text-[#8B92A0]">Sign In</Link>
              <Link to="/register" className="inline-flex items-center rounded-md bg-[#4C6FFF] px-4 py-2 text-sm font-medium text-white">
                Get Started
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* =========================
          Hero
      ========================= */}
      <section className="relative min-h-[92vh] flex items-center justify-center px-6 pt-16 overflow-hidden">
        {/* gradient mesh */}
        <div
          className="pointer-events-none absolute -top-32 left-1/4 w-[700px] h-[700px] rounded-full blur-[120px] opacity-30"
          style={{ background: "#4C6FFF" }}
        />
        <div
          className="pointer-events-none absolute top-1/3 right-[10%] w-[600px] h-[600px] rounded-full blur-[130px] opacity-25"
          style={{ background: "#8B5CF6" }}
        />
        <div
          className="pointer-events-none absolute bottom-0 left-[15%] w-[500px] h-[500px] rounded-full blur-[110px] opacity-20"
          style={{ background: "#22D3EE" }}
        />

        <ThreatConstellation reducedMotion={reducedMotion} />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <span
            className="inline-block text-[11px] tracking-[0.15em] text-[#8B92A0] mb-6"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            STATIC APPLICATION SECURITY TESTING
          </span>

          <h1
            className="text-[42px] sm:text-6xl font-medium tracking-tight leading-[1.08] text-[#F9FAFB]"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            Ship code that's{" "}
            <em
              style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontWeight: 400 }}
              className="text-[#8FA2FF]"
            >
              actually
            </em>{" "}
            secure.
          </h1>

          <p className="mt-6 text-[16px] sm:text-[17px] text-[#8B92A0] max-w-xl mx-auto leading-relaxed">
            Scan GitHub repositories with Semgrep, review findings by
            severity, and generate audit-ready security reports — before
            anything reaches production.
          </p>

          <div className="mt-9 flex items-center justify-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 rounded-md bg-[#4C6FFF] hover:bg-[#3D5EEB] hover:shadow-[0_0_28px_rgba(76,111,255,0.45)] transition-all px-6 py-3 text-sm font-medium text-white"
            >
              Start Scanning <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <a
              href="#product-preview"
              className="inline-flex items-center rounded-md border border-[#1E212B] hover:border-[#2B303C] hover:bg-[#0F1117] transition-all px-6 py-3 text-sm font-medium text-[#F5F6F8]"
            >
              View Demo
            </a>
          </div>

          <p
            className="mt-10 text-[12px] text-[#565D6D] tracking-wide"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            51 vulnerability classes tracked · OWASP Top 10 mapped · reports in under 2 minutes
          </p>
        </div>
      </section>

      {/* =========================
          Trusted Technologies (marquee)
      ========================= */}
      <section className="py-10 border-y border-[#12141B] overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...TECHS, ...TECHS, ...TECHS].map((tech, i) => (
            <span
              key={`${tech}-${i}`}
              className="mx-8 text-[17px] text-[#3A4050]"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* =========================
          Features (bento grid)
      ========================= */}
      <section id="features" className="px-6 py-28">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <h2
              className="text-3xl sm:text-4xl font-medium tracking-tight text-[#F9FAFB]"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Why developers use Guardrail
            </h2>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2 gap-4 lg:h-[520px]">
            {FEATURES.map((f, i) => (
              <Reveal
                key={f.title}
                delay={i * 90}
                className={
                  f.large
                    ? "lg:col-span-2 lg:row-span-2"
                    : i === 1
                    ? "lg:col-span-2 lg:row-span-1"
                    : "lg:col-span-1 lg:row-span-1"
                }
              >
                <div className="h-full rounded-xl border border-[#1E212B] bg-[#0B0D12] p-6 flex flex-col justify-between hover:-translate-y-1 hover:border-[#2B303C] transition-all duration-300">
                  <div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#4C6FFF]/10 border border-[#4C6FFF]/30 mb-4">
                      <f.icon className="h-4 w-4 text-[#4C6FFF]" />
                    </div>
                    <h3
                      className="text-[16px] font-medium text-[#F9FAFB]"
                      style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                    >
                      {f.title}
                    </h3>
                    <p className="mt-2 text-[13.5px] text-[#8B92A0] leading-relaxed max-w-xs">
                      {f.body}
                    </p>
                  </div>

                  {f.large && (
                    <div className="mt-6 space-y-2.5">
                      {[
                        { label: "High", value: 100 },
                        { label: "Medium", value: 70 },
                        { label: "Low", value: 40 },
                      ].map((bar) => (
                        <div key={bar.label} className="flex items-center gap-3">
                          <span
                            className="w-14 text-[11px] shrink-0"
                            style={{ fontFamily: "'JetBrains Mono', monospace", color: SEVERITY_COLOR[bar.label] }}
                          >
                            {bar.label}
                          </span>
                          <div className="h-1.5 flex-1 rounded-full bg-[#1B2029] overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${bar.value}%`, backgroundColor: SEVERITY_COLOR[bar.label] }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* =========================
          How Guardrail Works
      ========================= */}
      <section id="how-it-works" className="px-6 py-28 border-t border-[#12141B]">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <h2
              className="text-3xl sm:text-4xl font-medium tracking-tight text-[#F9FAFB]"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              The pipeline
            </h2>
            <p className="mt-3 text-[15px] text-[#8B92A0]">
              Every scan moves through the same six stages, from repository to report.
            </p>
          </Reveal>

          <div className="mt-16 relative">
            <div className="absolute left-6 top-2 bottom-2 w-px bg-gradient-to-b from-[#4C6FFF] via-[#8B5CF6] to-transparent" />
            {PIPELINE.map((stage, i) => (
              <Reveal key={stage.title} delay={i * 80} className="relative pl-20 pb-12 last:pb-0">
                <span
                  className="absolute left-0 top-0 text-[13px] w-12 text-right pr-4"
                  style={{ fontFamily: "'JetBrains Mono', monospace", color: "#4C6FFF" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="absolute left-[22px] top-1.5 h-2.5 w-2.5 rounded-full bg-[#4C6FFF] ring-4 ring-[#05060A]" />
                <h3
                  className="text-[17px] font-medium text-[#F9FAFB]"
                  style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                >
                  {stage.title}
                </h3>
                <p className="mt-1.5 text-[14px] text-[#8B92A0] max-w-md leading-relaxed">
                  {stage.body}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* =========================
          Product Preview
      ========================= */}
      <section id="product-preview" className="px-6 py-28 border-t border-[#12141B]">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center">
            <h2
              className="text-3xl sm:text-4xl font-medium tracking-tight text-[#F9FAFB]"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              See what a scan finds
            </h2>
            <p className="mt-3 text-[15px] text-[#8B92A0] max-w-lg mx-auto">
              A real findings table from a scan of juice-shop — ranked by severity, mapped to file and line.
            </p>
          </Reveal>

          <Reveal delay={120}>
            <div className="mt-14 flex justify-center">
              <div
                className="w-full max-w-3xl rounded-xl border border-[#1E212B] bg-[#0B0D12]/90 backdrop-blur overflow-hidden shadow-[0_60px_120px_-40px_rgba(76,111,255,0.25)] transition-transform duration-500 hover:[transform:perspective(1400px)_rotateX(0deg)_rotateY(0deg)]"
                style={{ transform: "perspective(1400px) rotateX(4deg) rotateY(-6deg)" }}
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E212B]">
                  <span className="text-[13px] text-[#8B92A0]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    juice-shop — 51 findings
                  </span>
                  <div className="flex items-center gap-4">
                    {["High: 17", "Medium: 22", "Low: 12"].map((s) => (
                      <span
                        key={s}
                        className="text-[12px]"
                        style={{ fontFamily: "'JetBrains Mono', monospace", color: SEVERITY_COLOR[s.split(":")[0]] }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="divide-y divide-[#1E212B]">
                  {FINDINGS.map((f) => (
                    <div key={f.rule} className="flex items-center justify-between px-6 py-4 hover:bg-[#0F1117] transition-colors">
                      <div className="flex items-center gap-4 min-w-0">
                        <span
                          className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                          style={{ color: SEVERITY_COLOR[f.severity], backgroundColor: `${SEVERITY_COLOR[f.severity]}1A` }}
                        >
                          {f.severity}
                        </span>
                        <span className="text-[14px] text-[#F5F6F8] truncate">{f.rule}</span>
                      </div>
                      <span className="shrink-0 text-[12.5px] text-[#565D6D]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {f.file}:{f.line}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="px-6 py-4 border-t border-[#1E212B] flex justify-end">
                  <Link to="/register" className="inline-flex items-center gap-1.5 text-[13px] text-[#8FA2FF] hover:text-[#B0BEFF] transition-colors">
                    Generate your own report <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* =========================
          CTA
      ========================= */}
      <section className="relative px-6 py-32 border-t border-[#12141B] overflow-hidden">
        <div
          className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full blur-[130px] opacity-25"
          style={{ background: "linear-gradient(90deg, #4C6FFF, #8B5CF6, #22D3EE)" }}
        />
        <Reveal className="relative text-center">
          <h2
            className="text-[32px] sm:text-5xl font-medium tracking-tight text-[#F9FAFB]"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            Ready to{" "}
            <em style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontWeight: 400 }} className="text-[#8FA2FF]">
              secure
            </em>{" "}
            your repositories?
          </h2>
          <p className="mt-4 text-[15px] text-[#8B92A0]">Free to start. No credit card required.</p>
          <Link
            to="/register"
            className="mt-9 inline-flex items-center gap-1.5 rounded-md bg-[#4C6FFF] hover:bg-[#3D5EEB] hover:shadow-[0_0_28px_rgba(76,111,255,0.45)] transition-all px-7 py-3.5 text-sm font-medium text-white"
          >
            Get Started <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Reveal>
      </section>

      {/* =========================
          Footer
      ========================= */}
      <footer className="px-6 py-10 border-t border-[#12141B]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#4C6FFF]" />
            <span className="text-sm font-medium text-[#8B92A0]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              Guardrail
            </span>
          </div>
          <div className="flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noreferrer" : undefined}
                className="text-[13px] text-[#565D6D] hover:text-[#8B92A0] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
          <p className="text-[12px] text-[#3A4050]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            © 2026 Guardrail. Built for secure software delivery.
          </p>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap');

        @keyframes drift {
          0%, 100% { transform: translateY(0px); opacity: 0.85; }
          50% { transform: translateY(-14px); opacity: 1; }
        }
        .animate-drift {
          animation: drift 6s ease-in-out infinite;
        }

        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-33.333%); }
        }
        .animate-marquee {
          animation: marquee 28s linear infinite;
          width: max-content;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-drift {
            animation: none !important;
          }
          .animate-marquee {
            animation-duration: 90s;
          }
        }
      `}</style>
    </div>
  );
}

export default Landing;