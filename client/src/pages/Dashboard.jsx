import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/api/axios";
import {
  ShieldCheck,
  LayoutDashboard,
  FolderGit2,
  ListChecks,
  FileText,
  LogOut,
  Search,
  Bell,
  GitBranch,
  ScanLine,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
} from "lucide-react";

/* ============================================================
   Expected API shape — GET /dashboard/overview
   Adjust the URL and field names below to match your actual
   backend response. Anything missing renders as an empty state,
   not fake data.

   {
     securityScore: number | null,
     status: "SECURE" | "AT_RISK" | "WARNING" | null,
     lastScanAt: ISOString | null,
     repositories: [{ id, name, language, securityScore, lastScanAt, status }],
     severityCounts: { critical, high, medium, low },
     trend: [{ date: "2026-07-11", openFindings: 78 }, ...],
     recentActivity: [{ id, type, message, createdAt }],
     criticalFindings: [{ id, severity, rule, file, line, status }],
   }
============================================================ */

const EMPTY_OVERVIEW = {
  securityScore: null,
  status: null,

  severityCounts: {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  },

  lastScanAt: null,

  repositories: [],

  recentActivity: [],

  criticalFindings: [],

  trend: [],
};

/* ============================================================
   Theme
============================================================ */

const STATUS = {
  critical: "#EF4444",
  high: "#F97316",
  medium: "#EAB308",
  low: "#64748B",
  healthy: "#2DD4A7",
  neutral: "#565D6D",
};

const FONT = {
  display: "'Space Grotesk', sans-serif", // greeting only
  body: "'Geist', 'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace", // all technical values
};

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

function useAnimatedNumber(value, duration = 800) {
  const reducedMotion = usePrefersReducedMotion();
  const target = typeof value === "number" ? value : 0;
  const [display, setDisplay] = useState(reducedMotion ? target : 0);
  const startRef = useRef(null);

  useEffect(() => {
    if (typeof value !== "number") return;
    if (reducedMotion) {
      setDisplay(value);
      return;
    }
    startRef.current = null;
    let raf;
    const step = (timestamp) => {
      if (startRef.current === null) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, reducedMotion]);

  return typeof value === "number" ? display : null;
}

// Forces a re-render every 30s so relative timestamps ("2m ago")
// stay current without any visible animation.
function useTick(intervalMs = 30000) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}

function useDashboardData() {
  const [data, setData] = useState(EMPTY_OVERVIEW);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .get("/dashboard")
      .then((res) => {
        if (!cancelled) setData({ ...EMPTY_OVERVIEW, ...res.data.data });
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.message || "Could not load dashboard data.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}

/* ============================================================
   Helpers
============================================================ */

function formatRelativeTime(iso) {
  if (!iso) return "—";
  const diffMs = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 5) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

function formatTrendAxisLabel(iso) {
  if (!iso) return "—";

  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

const STATUS_LABEL = { SECURE: "SECURE", AT_RISK: "AT RISK", WARNING: "WARNING" };
const STATUS_COLOR_MAP = { SECURE: STATUS.healthy, AT_RISK: STATUS.critical, WARNING: STATUS.medium };

/* ============================================================
   Shared bits
============================================================ */

function PanelHeader({ title, subtitle, right }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-[11.5px] tracking-wide text-[#8B92A0]" style={{ fontFamily: FONT.mono }}>
          {title.toUpperCase()}
        </h3>
        {subtitle && (
          <p className="mt-0.5 text-[12px] text-[#565D6D]" style={{ fontFamily: FONT.body }}>
            {subtitle}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="flex items-center justify-center py-10 text-center">
      <p className="text-[12.5px] text-[#565D6D] max-w-55" style={{ fontFamily: FONT.body }}>
        {text}
      </p>
    </div>
  );
}

/* ============================================================
   Sidebar
============================================================ */

const NAV_ITEMS = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", to: "/projects", icon: FolderGit2 },
  { label: "Findings", to: "/findings", icon: ListChecks },
  { label: "Reports", to: "/reports", icon: FileText },
];

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth(); // adjust field names if your AuthContext differs

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 h-screen sticky top-0 border-r border-[#20242E] bg-[#0A0C10]">
      <div className="flex items-center gap-2.5 px-5 h-14 border-b border-[#20242E]">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#4C6FFF]/10 border border-[#4C6FFF]/30">
          <ShieldCheck className="h-3.5 w-3.5 text-[#4C6FFF]" />
        </div>
        <span className="text-[14px] font-semibold tracking-tight text-[#F5F6F8]" style={{ fontFamily: FONT.display }}>
          Guardrail
        </span>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.label}
              to={item.to}
              className={`flex items-center gap-3 rounded-md pl-2.5 pr-3 py-2 text-[13px] border-l-2 transition-colors ${
                active
                  ? "bg-[#4C6FFF]/10 text-[#F5F6F8] border-[#4C6FFF]"
                  : "text-[#8B92A0] hover:text-[#F5F6F8] hover:bg-[#12151C] border-transparent"
              }`}
              style={{ fontFamily: FONT.body }}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#20242E] px-3 py-4">
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#4C6FFF]/15 text-[#8FA2FF] text-[12px]"
            style={{ fontFamily: FONT.display }}
          >
            {(user?.name || "U").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] text-[#F5F6F8]" style={{ fontFamily: FONT.body }}>
              {user?.name || "User"}
            </p>
            <p className="truncate text-[11px] text-[#565D6D]" style={{ fontFamily: FONT.mono }}>
              {user?.email || ""}
            </p>
          </div>
          <button onClick={handleLogout} className="text-[#565D6D] hover:text-[#F0616B] transition-colors" aria-label="Log out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ name = "there" }) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b border-[#20242E] bg-[#0A0C10]/90 backdrop-blur">
      <h1 className="text-[18px] text-[#F5F6F8]" style={{ fontFamily: FONT.display }}>
        Welcome back, {name} 👋
      </h1>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 rounded-md border border-[#20242E] bg-[#12151C] px-3 py-1.5 w-56">
          <Search className="h-3.5 w-3.5 text-[#565D6D]" />
          <input
            placeholder="Search repositories, findings..."
            className="bg-transparent text-[12.5px] text-[#F5F6F8] placeholder:text-[#565D6D] outline-none w-full"
            style={{ fontFamily: FONT.body }}
          />
        </div>

        <button className="relative text-[#8B92A0] hover:text-[#F5F6F8] transition-colors" aria-label="Notifications">
          <Bell className="h-4.5 w-4.5" />
        </button>

        <div
          className="h-7 w-7 rounded-full bg-[#4C6FFF]/15 border border-[#4C6FFF]/30 flex items-center justify-center text-[11px] text-[#8FA2FF]"
          style={{ fontFamily: FONT.display }}
        >
          {name.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}

/* ============================================================
   VitalsMonitor — the signature element, used in exactly one
   place. Driven by requestAnimationFrame writing directly to a
   DOM ref every frame, with a modulo-wrapped offset — there's no
   discrete "loop end" for a CSS animation to stumble on, so it
   never visibly restarts.
============================================================ */

function VitalsMonitor({ color }) {
  const reducedMotion = usePrefersReducedMotion();
  const groupRef = useRef(null);
  const offsetRef = useRef(0);
  const lastRef = useRef(null);
  const rafRef = useRef(null);

  const unit = 44;
  const visibleUnits = 4;
  const viewWidth = unit * visibleUnits;

  useEffect(() => {
    if (reducedMotion) return;
    const speed = 0.028; // px / ms
    const step = (t) => {
      if (lastRef.current == null) lastRef.current = t;
      const dt = t - lastRef.current;
      lastRef.current = t;
      offsetRef.current = (offsetRef.current + dt * speed) % unit;
      if (groupRef.current) {
        groupRef.current.setAttribute("transform", `translate(${-offsetRef.current},0)`);
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [reducedMotion]);

  const repeats = visibleUnits + 2;
  let d = "";
  for (let i = 0; i < repeats; i++) {
    const o = i * unit - unit;
    d += `${i === 0 ? "M" : "L"}${o},16 L${o + 12},16 L${o + 16},4 L${o + 20},28 L${o + 24},16 L${o + unit},16 `;
  }

  return (
    <div className="flex items-center gap-2 rounded-md border border-[#20242E] bg-[#0D0F14] px-2.5 py-1.5">
      <svg width={viewWidth} height="24" viewBox={`0 0 ${viewWidth} 32`} className="overflow-hidden">
        <g ref={groupRef}>
          <path
            d={d}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: `drop-shadow(0 0 3px ${color}90)` }}
          />
        </g>
      </svg>
      <span className="text-[10px] tracking-wide text-[#565D6D]" style={{ fontFamily: FONT.mono }}>
        LIVE
      </span>
    </div>
  );
}

/* ============================================================
   SecurityHealth
============================================================ */

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-[10.5px] text-[#565D6D] tracking-wide" style={{ fontFamily: FONT.mono }}>
        {label.toUpperCase()}
      </p>
      <p className="mt-1 text-[19px] text-[#F5F6F8]" style={{ fontFamily: FONT.mono }}>
        {value}
      </p>
    </div>
  );
}

function SecurityHealth({ score, status, lastScanAt, repoCount, openFindings, severityCounts }) {
  const animatedScore = useAnimatedNumber(score);
  const hasData = status != null;
  const statusColor = hasData ? STATUS_COLOR_MAP[status] || STATUS.neutral : STATUS.neutral;
  const hasSeverityBreakdown = severityCounts && Object.values(severityCounts).some((count) => count > 0);
  const scoreContext = hasSeverityBreakdown
    ? `${severityCounts.high} High • ${severityCounts.medium} Medium • ${severityCounts.low} Low findings detected`
    : "Score calculated from the latest completed scan.";
  const statusLabel = hasData
    ? status === "SECURE"
      ? STATUS_LABEL[status] || status
      : `⚠ ${STATUS_LABEL[status] || status}`
    : "NO DATA YET";

  return (
    <div
      className="relative rounded-lg border border-[#20242E] bg-[#12151C] p-6 border-l-[3px]"
      style={{ borderLeftColor: statusColor }}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <div
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1"
              style={{ borderColor: `${statusColor}40`, backgroundColor: `${statusColor}0D` }}
            >
              <span className="relative flex h-2 w-2">
                {hasData && (
                  <span className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping" style={{ backgroundColor: statusColor }} />
                )}
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: statusColor }} />
              </span>
              <span
                className="text-[12px] font-semibold tracking-wide"
                style={{ fontFamily: FONT.mono, color: statusColor }}
              >
                {statusLabel}
              </span>
            </div>

            {hasData && <VitalsMonitor color={statusColor} />}
          </div>

          <div className="mt-5 flex items-baseline gap-2">
            <span className="text-[52px] leading-none text-[#F5F6F8]" style={{ fontFamily: FONT.mono, fontWeight: 500 }}>
              {hasData ? animatedScore : "—"}
            </span>
            {hasData && (
              <span className="text-[17px] text-[#565D6D]" style={{ fontFamily: FONT.mono }}>
                / 100
              </span>
            )}
          </div>
          <p className="mt-1.5 text-[13px] text-[#8B92A0]" style={{ fontFamily: FONT.body }}>
            {hasData ? scoreContext : "Run your first scan to see a score here"}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-8 lg:gap-10">
          <Stat label="Last Scan" value={formatRelativeTime(lastScanAt)} />
          <Stat label="Repositories" value={repoCount} />
          <Stat label="Open Findings" value={hasData ? openFindings : "—"} />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MetricsStrip — fused ticker, not four floating cards
============================================================ */

const METRIC_CONFIG = [
  { key: "critical", label: "Critical", color: STATUS.critical },
  { key: "high", label: "High", color: STATUS.high },
  { key: "medium", label: "Medium", color: STATUS.medium },
  { key: "low", label: "Low", color: STATUS.low },
];

function MetricCell({ label, value, color, onClick }) {
  const animated = useAnimatedNumber(value);
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-start gap-1 px-5 py-4 text-left hover:bg-[#0F1117] transition-colors"
    >
      <span className="text-[10.5px] tracking-wide" style={{ fontFamily: FONT.mono, color }}>
        {label.toUpperCase()}
      </span>
      <span className="text-[24px] text-[#F5F6F8]" style={{ fontFamily: FONT.mono, fontWeight: 500 }}>
        {animated}
      </span>
    </button>
  );
}

function MetricsStrip({ counts, onSelect }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-[#20242E] rounded-lg border border-[#20242E] bg-[#12151C] overflow-hidden">
      {METRIC_CONFIG.map((c) => (
        <MetricCell key={c.key} label={c.label} value={counts[c.key] || 0} color={c.color} onClick={() => onSelect?.(c.key)} />
      ))}
    </div>
  );
}

/* ============================================================
   TrendChart — hand-rolled SVG, draws in once on data arrival
============================================================ */

function TrendChart({ trend = [] }) {
  const reducedMotion = usePrefersReducedMotion();
  const pathRef = useRef(null);
  const [length, setLength] = useState(0);
  const [drawn, setDrawn] = useState(false);

  const width = 560;
  const height = 170;
  const padding = 10;

  const values = trend.map((t) => Number(t.score) || 0);
  const hasEnoughData = values.length >= 2;
  const max = 100;
  const min = 0;
  const range = max - min || 1;

  const points = hasEnoughData
    ? values.map((v, i) => {
        const x = padding + (i / (values.length - 1)) * (width - padding * 2);
        const clampedValue = Math.max(min, Math.min(max, v));
        const y = padding + (1 - (clampedValue - min) / range) * (height - padding * 2);
        return [x, y];
      })
    : [];

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  const areaPath = hasEnoughData
    ? `${linePath} L${points[points.length - 1][0]},${height - padding} L${points[0][0]},${height - padding} Z`
    : "";

  useEffect(() => {
    if (pathRef.current) setLength(pathRef.current.getTotalLength());
  }, [trend]);

  useEffect(() => {
    if (reducedMotion || !length) {
      setDrawn(true);
      return;
    }
    const raf = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(raf);
  }, [length, reducedMotion]);

  const improving = hasEnoughData && values[values.length - 1] < values[0];
  const previousScore = hasEnoughData ? values[values.length - 2] : null;
  const latestScore = hasEnoughData ? values[values.length - 1] : null;
  const trendLabel =
    hasEnoughData && previousScore !== null && latestScore !== null
      ? latestScore < previousScore
        ? "Improving"
        : latestScore > previousScore
        ? "Worsening"
        : "Stable"
      : null;

  return (
    <div className="p-6">
      <PanelHeader
        title="Security Trend"
        subtitle="Open findings over time"
        right={
          hasEnoughData && (
            <span
              className="text-[11px] rounded-full px-2.5 py-1"
              style={{
                fontFamily: FONT.mono,
                color: improving ? STATUS.healthy : STATUS.critical,
                backgroundColor: improving ? `${STATUS.healthy}1A` : `${STATUS.critical}1A`,
              }}
            >
              {trendLabel === "Improving" ? "↓ Improving" : trendLabel === "Worsening" ? "↑ Worsening" : "→ Stable"}
            </span>
          )
        }
      />

      {hasEnoughData ? (
        <>
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36">
            <defs>
              <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4C6FFF" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#4C6FFF" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#trendFill)" opacity={drawn ? 1 : 0} style={{ transition: "opacity 0.6s ease 0.4s" }} />
            <path
              ref={pathRef}
              d={linePath}
              fill="none"
              stroke="#4C6FFF"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                strokeDasharray: length,
                strokeDashoffset: drawn ? 0 : length,
                transition: reducedMotion ? "none" : "stroke-dashoffset 1.2s ease-out",
              }}
            />
          </svg>
          <div className="mt-2 flex justify-between text-[11px] text-[#565D6D]" style={{ fontFamily: FONT.mono }}>
            <span>{formatTrendAxisLabel(trend[0]?.date)}</span>
            <span>{formatTrendAxisLabel(trend[Math.floor(trend.length / 2)]?.date)}</span>
            <span>{formatTrendAxisLabel(trend[trend.length - 1]?.date)}</span>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center gap-2 py-10 text-center">
          <ScanLine className="h-4 w-4 text-[#4C6FFF]" />
          <p className="text-[12.5px] text-[#565D6D]" style={{ fontFamily: FONT.body }}>
            Run 2 more scans to unlock historical trends.
          </p>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   RecentActivity
============================================================ */

const ACTIVITY_ICONS = {
  clone: GitBranch,
  scan_start: ScanLine,
  scan_done: CheckCircle2,
  finding: AlertTriangle,
  report: FileText,
};
const ACTIVITY_COLOR_BY_TYPE = { finding: STATUS.high, scan_done: STATUS.healthy };

function RecentActivity({ events }) {
  return (
    <div className="p-6">
      <PanelHeader title="Recent Activity" />
      {events.length === 0 ? (
        <EmptyState text="No activity yet. It'll show up here as soon as a scan runs." />
      ) : (
        <div className="space-y-4">
          {events.map((e) => {
            const Icon = ACTIVITY_ICONS[e.type] || CheckCircle2;
            const color = ACTIVITY_COLOR_BY_TYPE[e.type] || "#4C6FFF";
            return (
              <div key={e.id} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${color}1A` }}>
                  <Icon className="h-3 w-3" style={{ color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-[#F5F6F8] leading-snug" style={{ fontFamily: FONT.body }}>
                    {e.message}
                  </p>
                  <p className="text-[11px] text-[#565D6D] mt-0.5" style={{ fontFamily: FONT.mono }}>
                    {formatRelativeTime(e.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   RepositoryTable
============================================================ */

const REPO_STATUS_STYLE = {
  SECURE: STATUS.healthy,
  WARNING: STATUS.medium,
  AT_RISK: STATUS.critical,
};

function RepositoryTable({ repos }) {
  return (
    <div className="rounded-lg border border-[#20242E] bg-[#12151C] overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#20242E]">
        <h3 className="text-[11.5px] tracking-wide text-[#8B92A0]" style={{ fontFamily: FONT.mono }}>
          ACTIVE REPOSITORIES
        </h3>
        <span className="text-[11px] text-[#565D6D]" style={{ fontFamily: FONT.mono }}>
          {repos.length} total
        </span>
      </div>

      {repos.length === 0 ? (
        <EmptyState text="No repositories connected yet. Add one from Quick Actions to get started." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#20242E]">
                {["Repository", "Branch", "Score", "Last Scan", "Status"].map((h) => (
                  <th key={h} className="px-6 py-2.5 text-[10.5px] tracking-wide text-[#565D6D]" style={{ fontFamily: FONT.mono }}>
                    {h.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {repos.map((r) => (
                <tr key={r.id || r.name} className="border-b border-[#20242E] last:border-0 hover:bg-[#0F1117] transition-colors">
                  <td className="px-6 py-3 text-[13px] text-[#F5F6F8]" style={{ fontFamily: FONT.body }}>{r.name}</td>
                  <td className="px-6 py-3 text-[12px] text-[#8B92A0]" style={{ fontFamily: FONT.body }}>{r.branch || "—"}</td>
                  <td
                    className="px-6 py-3 text-[13px]"
                    style={{
                      fontFamily: FONT.mono,
                      color: r.securityScore >= 80 ? STATUS.healthy : r.securityScore >= 60 ? STATUS.medium : STATUS.critical,
                    }}
                  >
                    {r.securityScore ?? "—"}
                  </td>
                  <td className="px-6 py-3 text-[11.5px] text-[#565D6D]" style={{ fontFamily: FONT.mono }}>
                    {formatRelativeTime(r.lastScanAt)}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold"
                      style={{
                        fontFamily: FONT.mono,
                        color: REPO_STATUS_STYLE[r.status] || STATUS.neutral,
                        backgroundColor: `${REPO_STATUS_STYLE[r.status] || STATUS.neutral}1A`,
                      }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: REPO_STATUS_STYLE[r.status] || STATUS.neutral }} />
                      {r.status || "Unknown"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   CriticalFindings
============================================================ */

const FINDING_SEVERITY_COLOR = { Critical: STATUS.critical, High: STATUS.high, Medium: STATUS.medium, Low: STATUS.low };
const FINDING_STATUS_COLOR = { Open: STATUS.critical, Acknowledged: STATUS.medium, Fixed: STATUS.healthy };

function CriticalFindings({ findings, onViewAll }) {
  return (
    <div className="p-6">
      <PanelHeader
        title="Critical Findings"
        right={
          <button
            onClick={onViewAll}
            className="inline-flex items-center gap-1 text-[12px] text-[#8FA2FF] hover:text-[#B0BEFF] transition-colors"
            style={{ fontFamily: FONT.body }}
          >
            View All <ArrowRight className="h-3 w-3" />
          </button>
        }
      />

      {findings.length === 0 ? (
        <EmptyState text="No findings yet. Run a scan to populate this list." />
      ) : (
        <div className="divide-y divide-[#20242E] -mx-6">
          {findings.map((f) => (
            <div key={f.id || f.title} className="flex items-center justify-between px-6 py-3.5 hover:bg-[#0F1117] transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="shrink-0 rounded-full px-2.5 py-0.5 text-[10.5px] font-medium"
                  style={{
                    color: FINDING_SEVERITY_COLOR[f.severity],
                    backgroundColor: `${FINDING_SEVERITY_COLOR[f.severity]}1A`,
                    fontFamily: FONT.mono,
                  }}
                >
                  {f.severity}
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] text-[#F5F6F8] truncate" style={{ fontFamily: FONT.body }}>{f.title}</p>
                  <p className="text-[11px] text-[#565D6D] truncate" style={{ fontFamily: FONT.mono }}>{f.file}:{f.line}</p>
                </div>
              </div>
              <span
                className="shrink-0 text-[10.5px] rounded-full px-2.5 py-1"
                style={{
                  color: FINDING_STATUS_COLOR[f.status || "Open"] || STATUS.neutral,
                  backgroundColor: `${FINDING_STATUS_COLOR[f.status || "Open"] || STATUS.neutral}1A`,
                  fontFamily: FONT.mono,
                }}
              >
                {f.status || "Open"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   QuickActions
============================================================ */

const QUICK_ACTIONS = [
  { icon: ScanLine, label: "Scan Repository", desc: "Run a new Semgrep scan", primary: true },
  { icon: FileText, label: "Generate Report", desc: "Export findings as PDF" },
  { icon: PlusCircle, label: "Add Repository", desc: "Connect a new GitHub repo" },
];

function QuickActions({ onAction }) {
  return (
    <div className="p-6">
      <PanelHeader title="Quick Actions" />
      <div className="space-y-2">
        {QUICK_ACTIONS.map((a) => (
          <button
            key={a.label}
            onClick={() => onAction?.(a.label)}
            className={`w-full flex items-center gap-3 rounded-md border px-4 py-3 text-left transition-all duration-200 ${
              a.primary
                ? "border-[#4C6FFF]/60 bg-[#4C6FFF]/8 hover:border-[#4C6FFF]/80 hover:bg-[#4C6FFF]/12"
                : "border-[#20242E] hover:border-[#4C6FFF]/40 hover:bg-[#4C6FFF]/5"
            }`}
          >
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${a.primary ? "bg-[#4C6FFF]/20 border-[#4C6FFF]/50" : "bg-[#4C6FFF]/10 border-[#4C6FFF]/30"}`}>
              <a.icon className="h-4 w-4 text-[#4C6FFF]" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] text-[#F5F6F8]" style={{ fontFamily: FONT.body }}>{a.label}</p>
              <p className="text-[11px] text-[#8B92A0]" style={{ fontFamily: FONT.body }}>{a.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   Dashboard — fused console layout. Panels that naturally pair
   share one bordered container with an internal divider instead
   of floating separately, so the page reads as one connected
   instrument rather than a stack of repeated card components.
============================================================ */

function Dashboard() {
  const { data, loading, error } = useDashboardData();
  const navigate = useNavigate();
  useTick(); // keeps relative timestamps fresh

  const totalOpenFindings = Object.values(data.severityCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex min-h-screen bg-[#0A0C10] text-[#F5F6F8]">
      <Sidebar />

      <div className="flex-1 min-w-0">
        <Topbar name="Fattesing" />

        <main className="px-6 py-8 space-y-5 max-w-350 mx-auto">
          {error && (
            <div
              className="rounded-lg border px-4 py-3 text-[13px]"
              style={{ borderColor: `${STATUS.critical}40`, backgroundColor: `${STATUS.critical}0D`, color: STATUS.critical, fontFamily: FONT.body }}
            >
              {error}
            </div>
          )}

          {loading ? (
            <div className="rounded-lg border border-[#20242E] bg-[#12151C] p-10 text-center">
              <p className="text-[13px] text-[#565D6D]" style={{ fontFamily: FONT.mono }}>
                Loading dashboard...
              </p>
            </div>
          ) : (
            <>
              <SecurityHealth
                score={data.securityScore}
                status={data.status}
                lastScanAt={data.lastScanAt}
                repoCount={data.repositories.length}
                openFindings={totalOpenFindings}
                severityCounts={data.severityCounts}
              />

              <MetricsStrip counts={data.severityCounts} onSelect={(severity) => console.log("filter by", severity)} />

              <div className="rounded-lg border border-[#20242E] bg-[#12151C] overflow-hidden">
                <TrendChart trend={data.trend} />
              </div>

              <div className="rounded-lg border border-[#20242E] bg-[#12151C] overflow-hidden">
                <RecentActivity events={data.recentActivity} />
              </div>

              <RepositoryTable repos={data.repositories} />

              <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-[#20242E] rounded-lg border border-[#20242E] bg-[#12151C] overflow-hidden">
                <div className="lg:col-span-2">
                  <CriticalFindings findings={data.criticalFindings} onViewAll={() => navigate("/findings")} />
                </div>
                <QuickActions
                  onAction={(label) => {
                    if (label === "Scan Repository") {
                      navigate("/projects");
                      return;
                    }

                    if (label === "Generate Report") {
                      navigate("/reports");
                      return;
                    }

                    if (label === "Add Repository") {
                      navigate("/projects", {
                        state: { openAddRepositoryModal: true },
                      });
                    }
                  }}
                />
              </div>
            </>
          )}
        </main>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Geist:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
      `}</style>
    </div>
  );
}

export default Dashboard;