import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowUpRight,
  CircleAlert,
  CircleCheck,
  FileText,
  FolderGit2,
  LayoutDashboard,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import api from "@/api/axios";
import { useAuth } from "@/context/AuthContext";

const EMPTY_OVERVIEW = {
  securityScore: null,
  status: null,
  severityCounts: { critical: 0, high: 0, medium: 0, low: 0 },
  lastScanAt: null,
  repositories: [],
  recentActivity: [],
  criticalFindings: [],
  trend: [],
};

const SECURITY = {
  SECURE: { label: "SECURE", color: "#6DD6A8", icon: CircleCheck },
  WARNING: { label: "WARNING", color: "#F2C46D", icon: AlertTriangle },
  AT_RISK: { label: "AT RISK", color: "#F0747A", icon: ShieldAlert },
};

const SEVERITIES = [
  { key: "critical", label: "Critical", color: "#F0747A" },
  { key: "high", label: "High", color: "#F28B68" },
  { key: "medium", label: "Medium", color: "#F2C46D" },
  { key: "low", label: "Low", color: "#7E98D8" },
];

function relativeTime(value) {
  if (!value) return "Not scanned";
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}

function findingTitle(value) {
  const source = String(value || "Finding").trim();
  const overrides = [
    [/github[-_.]actions.*mutable/i, "Mutable GitHub Action Tag"],
    [/(curl|wget).*(pipe|shell|sh)/i, "Remote Script Execution"],
    [/express[-_.]cookie[-_.]settings/i, "Session Cookie Missing Secure Flag"],
    [/(tls|ssl).*(bypass|disable|verify[-_.]?false)/i, "TLS Verification Bypass"],
    [/(path|directory)[-_.]?traversal/i, "Path Traversal"],
  ];
  const override = overrides.find(([pattern]) => pattern.test(source));
  if (override) return override[1];

  const ignored = new Set(["yaml", "javascript", "js", "node", "security", "audit", "generic", "semgrep", "rules", "check"]);
  const words = source.toLowerCase().replace(/[^a-z0-9]+/g, " ").split(" ").filter((word) => word.length > 1 && !ignored.has(word));
  return (words.slice(-6).join(" ") || "Finding").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function findingLocation(file, line) {
  const normalized = String(file || "").replace(/\\/g, "/");
  const cleaned = normalized.match(/\/temp\/[^/]+\/(.+)$/)?.[1] || normalized;
  const path = cleaned.startsWith("/") ? cleaned.split("/").filter(Boolean).slice(-2).join("/") : cleaned;
  return line ? `${path || "Unknown"}:${line}` : path || "Unknown";
}

function Sidebar({ user, onLogout }) {
  const links = [
    { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
    { label: "Projects", to: "/projects", icon: FolderGit2 },
    { label: "Findings", to: "/findings", icon: ShieldAlert },
    { label: "Reports", to: "/reports", icon: FileText },
  ];

  return (
    <aside className="hidden xl:flex fixed inset-y-0 left-0 z-20 w-[252px] flex-col border-r border-[#20242E] bg-[#0A0C10] px-4 py-5">
      <Link to="/dashboard" className="flex items-center gap-3 px-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-md border border-[#4C6FFF]/35 bg-[#4C6FFF]/10"><ShieldCheck className="h-4 w-4 text-[#8FA2FF]" /></span>
        <span className="text-[15px] font-semibold tracking-[-0.02em] text-[#F5F6F8]">Guardrail</span>
      </Link>
      <p className="mt-10 px-2.5 font-mono text-[10px] font-medium tracking-[0.16em] text-[#565D6D]">WORKSPACE</p>
      <nav className="mt-3 space-y-1">
        {links.map(({ label, to, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => `group flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] transition-colors ${isActive ? "bg-[#171B25] text-[#F5F6F8] shadow-[inset_2px_0_0_#4C6FFF]" : "text-[#8B92A0] hover:bg-[#12151C] hover:text-[#E8EAF0]"}`}><Icon className="h-4 w-4" strokeWidth={1.8} />{label}</NavLink>)}
      </nav>
      <div className="mt-auto border-t border-[#20242E] pt-4"><div className="flex items-center gap-2.5 px-2.5"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#252B38] text-[10px] font-semibold text-[#B9C0CE]">{user?.name?.slice(0, 1)?.toUpperCase() || "U"}</span><div className="min-w-0 flex-1"><p className="truncate text-[12px] font-medium text-[#E8EAF0]">{user?.name || "Guardrail user"}</p><p className="truncate font-mono text-[10px] text-[#656D7D]">{user?.email || "SIGNED IN"}</p></div><button onClick={onLogout} className="text-[10px] font-mono text-[#777F90] transition-colors hover:text-[#F0747A]">OUT</button></div></div>
    </aside>
  );
}

function MobileNav() {
  const links = ["Dashboard", "Projects", "Findings", "Reports"];
  return <div className="xl:hidden border-b border-[#20242E] bg-[#0A0C10] px-5"><div className="flex h-14 items-center justify-between"><Link to="/dashboard" className="flex items-center gap-2 text-[14px] font-semibold text-[#F5F6F8]"><ShieldCheck className="h-4 w-4 text-[#8FA2FF]" /> Guardrail</Link><nav className="flex items-center gap-4 overflow-x-auto font-mono text-[10px] text-[#8B92A0]">{links.map((label) => <NavLink key={label} to={`/${label.toLowerCase()}`} className={({ isActive }) => isActive ? "text-[#F5F6F8]" : "hover:text-[#F5F6F8]"}>{label.toUpperCase()}</NavLink>)}</nav></div></div>;
}

function StatusBadge({ status }) {
  const config = SECURITY[status];
  if (!config) return <span className="border border-[#3B4351] bg-[#171B25] px-2 py-1 font-mono text-[9px] tracking-[0.1em] text-[#8891A2]">NO SCAN</span>;
  const Icon = config.icon;
  return <span className="inline-flex items-center gap-1 border px-2 py-1 font-mono text-[9px] font-medium tracking-[0.1em]" style={{ color: config.color, borderColor: `${config.color}40`, backgroundColor: `${config.color}12` }}><Icon className="h-3 w-3" />{config.label}</span>;
}

function LoadingDashboard() {
  return <div className="space-y-4 animate-pulse"><div className="h-52 border border-[#20242E] bg-[#12151C]" /><div className="h-24 border border-[#20242E] bg-[#12151C]" /><div className="grid gap-4 xl:grid-cols-[1.3fr_.7fr]"><div className="h-80 border border-[#20242E] bg-[#12151C]" /><div className="h-80 border border-[#20242E] bg-[#12151C]" /></div></div>;
}

function SecurityHealth({ data }) {
  const status = SECURITY[data.status];
  const StatusIcon = status?.icon || ShieldCheck;
  const totalFindings = Object.values(data.severityCounts).reduce((sum, value) => sum + value, 0);
  return <section className="relative overflow-hidden border border-[#2D3545] bg-[#12151C]"><div className="absolute inset-y-0 left-0 w-[3px]" style={{ backgroundColor: status?.color || "#4C6FFF" }} /><div className="absolute right-0 top-0 h-48 w-48 bg-[#4C6FFF]/[0.035] blur-3xl" /><div className="relative grid gap-8 p-6 sm:p-7 lg:grid-cols-[1.25fr_.75fr] lg:items-end"><div><p className="font-mono text-[10px] font-medium tracking-[0.16em] text-[#7787D0]">SECURITY HEALTH</p><div className="mt-4 flex flex-wrap items-center gap-3"><StatusBadge status={data.status} />{data.lastScanAt && <span className="font-mono text-[10px] text-[#737C8D]">UPDATED {relativeTime(data.lastScanAt).toUpperCase()}</span>}</div><div className="mt-5 flex items-end gap-2"><span className="font-mono text-[58px] leading-[0.8] tracking-[-0.09em] text-[#F5F6F8]">{data.securityScore ?? "—"}</span>{data.securityScore != null && <span className="mb-0.5 font-mono text-[12px] text-[#697286]">/100</span>}</div><p className="mt-3 max-w-md text-[12px] leading-relaxed text-[#8992A2]">{data.securityScore == null ? "Run a repository scan to establish your security baseline." : "Average security score across your protected repositories."}</p></div><div className="grid grid-cols-3 divide-x divide-[#28303D] border border-[#28303D] bg-[#0D1016]"><div className="p-4"><p className="font-mono text-[9px] tracking-[0.11em] text-[#687184]">REPOSITORIES</p><p className="mt-2 font-mono text-[22px] tracking-[-0.06em] text-[#F0F2F6]">{data.repositories.length}</p></div><div className="p-4"><p className="font-mono text-[9px] tracking-[0.11em] text-[#687184]">FINDINGS</p><p className="mt-2 font-mono text-[22px] tracking-[-0.06em] text-[#F0F2F6]">{totalFindings}</p></div><div className="p-4"><p className="font-mono text-[9px] tracking-[0.11em] text-[#687184]">POSTURE</p><p className="mt-2"><StatusIcon className="h-5 w-5" style={{ color: status?.color || "#697286" }} /></p></div></div></div></section>;
}

function SeverityStrip({ counts, onClick }) {
  return <section className="grid grid-cols-2 divide-x divide-y divide-[#28303D] border border-[#28303D] bg-[#12151C] sm:grid-cols-4 sm:divide-y-0">{SEVERITIES.map((severity) => <button key={severity.key} onClick={() => onClick(severity.key)} className="group px-5 py-4 text-left transition-colors hover:bg-[#171C25]"><p className="font-mono text-[10px] tracking-[0.1em]" style={{ color: severity.color }}>{severity.label.toUpperCase()}</p><p className="mt-1 font-mono text-[25px] tracking-[-0.07em] text-[#F0F2F6]">{counts[severity.key] || 0}</p></button>)}</section>;
}

function TrendChart({ trend }) {
  const points = useMemo(() => trend.slice(-12).map((entry) => ({ ...entry, score: Number(entry.score) })), [trend]);
  if (!points.length) return <section className="border border-[#28303D] bg-[#12151C] p-6"><PanelTitle eyebrow="SECURITY TREND" title="Security posture over time" /><div className="grid h-48 place-items-center text-center"><p className="text-[12px] text-[#737C8D]">Complete scans to build your security trend.</p></div></section>;
  const values = points.map((point) => point.score);
  const min = Math.max(0, Math.min(...values) - 8);
  const max = Math.min(100, Math.max(...values) + 8);
  const range = Math.max(1, max - min);
  const coordinates = points.map((point, index) => `${(index / Math.max(1, points.length - 1)) * 100},${100 - ((point.score - min) / range) * 82 - 9}`).join(" ");
  const direction = values.length > 1 ? values.at(-1) - values.at(-2) : 0;
  const improving = direction >= 0;
  return <section className="border border-[#28303D] bg-[#12151C] p-6"><div className="flex items-start justify-between gap-4"><PanelTitle eyebrow="SECURITY TREND" title="Security posture over time" /><span className={`inline-flex items-center gap-1 font-mono text-[10px] ${improving ? "text-[#6DD6A8]" : "text-[#F0747A]"}`}>{improving ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}{improving ? "IMPROVING" : "DECLINING"}</span></div><div className="relative mt-6 h-44"><div className="absolute inset-x-0 top-0 border-t border-dashed border-[#28303D]" /><div className="absolute inset-x-0 top-1/2 border-t border-dashed border-[#28303D]" /><div className="absolute inset-x-0 bottom-0 border-t border-dashed border-[#28303D]" /><svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible"><polyline fill="none" stroke="#6E83F5" strokeWidth="1.3" vectorEffect="non-scaling-stroke" points={coordinates} /><polyline fill="none" stroke="#6E83F5" strokeOpacity=".18" strokeWidth="5" vectorEffect="non-scaling-stroke" points={coordinates} /></svg><div className="absolute inset-x-0 bottom-[-20px] flex justify-between font-mono text-[9px] text-[#626B7C]"><span>{relativeTime(points[0].date)}</span><span>{relativeTime(points.at(-1).date)}</span></div></div></section>;
}

function PanelTitle({ eyebrow, title, action }) { return <div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] tracking-[0.14em] text-[#7180C5]">{eyebrow}</p><h2 className="mt-1 text-[15px] font-medium tracking-[-0.02em] text-[#EDF0F5]">{title}</h2></div>{action}</div>; }

function RecentActivity({ activities }) {
  return <section className="border border-[#28303D] bg-[#12151C] p-6"><PanelTitle eyebrow="ACTIVITY LOG" title="Recent scan activity" /><div className="mt-5 space-y-0">{activities.length ? activities.map((activity, index) => <div key={activity.id} className="relative flex gap-3 py-3 first:pt-0 last:pb-0"><span className="relative z-10 mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#6E83F5]" />{index < activities.length - 1 && <span className="absolute left-[3px] top-5 h-full border-l border-[#303847]" />}<div className="min-w-0"><p className="truncate text-[12px] text-[#C8CED8]">{activity.message}</p><p className="mt-1 font-mono text-[10px] text-[#6D7687]">{relativeTime(activity.createdAt)}</p></div></div>) : <div className="grid h-48 place-items-center text-center"><p className="text-[12px] text-[#737C8D]">No scan activity yet.</p></div>}</div></section>;
}

function RepositoryList({ repositories }) {
  return <section className="border border-[#28303D] bg-[#12151C]"><div className="border-b border-[#28303D] px-6 py-5"><PanelTitle eyebrow="PROTECTED REPOSITORIES" title="Repository posture" action={<Link to="/projects" className="inline-flex items-center gap-1 font-mono text-[10px] text-[#9CACFF] hover:text-[#C4CCFF]">VIEW ALL <ArrowUpRight className="h-3 w-3" /></Link>} /></div>{repositories.length ? <div className="divide-y divide-[#242C38]">{repositories.slice(0, 5).map((repo) => <Link key={repo.id} to={`/projects/${repo.id}`} className="group grid grid-cols-[minmax(0,1fr)_auto] gap-4 px-6 py-4 transition-colors hover:bg-[#171C25] sm:grid-cols-[minmax(0,1fr)_90px_110px_100px]"><div className="min-w-0"><div className="flex items-center gap-2"><FolderGit2 className="h-3.5 w-3.5 shrink-0 text-[#8C9AF0]" /><p className="truncate text-[13px] font-medium text-[#EBEEF4]">{repo.name}</p></div><p className="mt-1 truncate pl-[22px] font-mono text-[10px] text-[#687184]">{repo.language || "Unknown"} <span className="mx-1 text-[#3D4655]">•</span> {repo.branch || "main"}</p></div><p className="hidden self-center font-mono text-[11px] text-[#8992A2] sm:block">{relativeTime(repo.lastScanAt)}</p><div className="hidden self-center sm:block"><StatusBadge status={repo.status} /></div><div className="self-center text-right"><span className="font-mono text-[18px] tracking-[-0.07em] text-[#F0F2F6]">{repo.securityScore ?? "—"}</span><span className="ml-0.5 font-mono text-[9px] text-[#687184]">/100</span></div></Link>)}</div> : <div className="grid h-40 place-items-center text-center"><div><FolderGit2 className="mx-auto h-4 w-4 text-[#687184]" /><p className="mt-2 text-[12px] text-[#7D8697]">No repositories under protection.</p><Link to="/projects" className="mt-2 inline-block font-mono text-[10px] text-[#9CACFF]">ADD REPOSITORY</Link></div></div>}</section>;
}

function Findings({ findings }) {
  return <section className="border border-[#28303D] bg-[#12151C]"><div className="border-b border-[#28303D] px-6 py-5"><PanelTitle eyebrow="RECENT FINDINGS" title="Prioritize what needs attention" action={<Link to="/findings" className="inline-flex items-center gap-1 font-mono text-[10px] text-[#9CACFF] hover:text-[#C4CCFF]">VIEW FINDINGS <ArrowUpRight className="h-3 w-3" /></Link>} /></div>{findings.length ? <div className="divide-y divide-[#242C38]">{findings.map((finding) => <Link key={finding.id} to={`/findings/${finding.id}`} className="flex items-center gap-3 px-6 py-4 transition-colors hover:bg-[#171C25]"><span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: finding.severity === "Critical" ? "#F0747A" : finding.severity === "High" ? "#F28B68" : finding.severity === "Medium" ? "#F2C46D" : "#7E98D8" }} /><div className="min-w-0 flex-1"><p className="truncate text-[12px] text-[#D9DEE7]">{findingTitle(finding.title)}</p><div className="mt-1 flex min-w-0 items-center gap-2 font-mono text-[10px]"><span className="inline-flex shrink-0 items-center gap-1 text-[#9AA9FF]"><FolderGit2 className="h-3 w-3" />{finding.projectName || "Repository"}</span><span className="h-3 border-l border-[#3A4351]" /><span className="truncate text-[#687184]">{findingLocation(finding.file, finding.line)}</span></div></div><span className="hidden border border-[#3A4351] px-1.5 py-0.5 font-mono text-[9px] tracking-[0.08em] text-[#909AAB] sm:inline">{finding.severity?.toUpperCase()}</span></Link>)}</div> : <div className="grid h-40 place-items-center text-center"><div><ShieldCheck className="mx-auto h-4 w-4 text-[#6DD6A8]" /><p className="mt-2 text-[12px] text-[#7D8697]">No findings detected yet.</p></div></div>}</section>;
}

function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [data, setData] = useState(EMPTY_OVERVIEW);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadDashboard = async () => {
    setLoading(true); setError(false);
    try { const response = await api.get("/dashboard"); setData({ ...EMPTY_OVERVIEW, ...response.data.data }); }
    catch { setError(true); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadDashboard(); }, []);
  const name = user?.name || "there";
  const logoutAndGoHome = () => { logout(); navigate("/login"); };

  return <div className="min-h-screen bg-[#0A0C10] text-[#F5F6F8]"><Sidebar user={user} onLogout={logoutAndGoHome} /><MobileNav /><main className="min-h-screen xl:pl-[252px]"><div className="mx-auto max-w-[1440px] px-5 py-7 sm:px-8 lg:px-10 lg:py-9"><header className="flex flex-col gap-5 border-b border-[#20242E] pb-7 sm:flex-row sm:items-end sm:justify-between"><div><p className="font-mono text-[10px] font-medium tracking-[0.16em] text-[#7180C5]">SECURITY OPERATIONS / OVERVIEW</p><h1 className="mt-2 text-[29px] font-normal tracking-[-0.045em] text-[#F5F6F8]">Welcome back, <em className="font-serif text-[#B7C2FF]">{name}</em></h1><p className="mt-1 text-[12px] text-[#8B92A0]">Your security posture, at a glance.</p></div><div className="flex gap-2"><Link to="/projects" className="inline-flex h-9 items-center gap-1.5 border border-[#303847] px-3 font-mono text-[10px] tracking-[0.08em] text-[#B9C0CE] transition-colors hover:bg-[#171C25]"><FolderGit2 className="h-3.5 w-3.5" /> PROJECTS</Link><Link to="/projects" className="inline-flex h-9 items-center gap-1.5 border border-[#4C6FFF]/45 bg-[#4C6FFF] px-3.5 font-mono text-[10px] font-medium tracking-[0.08em] text-white hover:bg-[#5978FF]"><Plus className="h-3.5 w-3.5" /> ADD REPOSITORY</Link></div></header>{loading ? <div className="mt-6"><LoadingDashboard /></div> : error ? <div className="mt-6 border border-[#5A3439] bg-[#F0747A]/[0.05] px-6 py-16 text-center"><CircleAlert className="mx-auto h-5 w-5 text-[#F28A8F]" /><h2 className="mt-3 text-[16px] font-medium">Unable to load dashboard</h2><p className="mt-1 text-[12px] text-[#939CAC]">Something went wrong while retrieving your security data.</p><button onClick={loadDashboard} className="mt-5 inline-flex h-8 items-center gap-1.5 border border-[#F0747A]/30 px-3 font-mono text-[10px] text-[#F5A0A4] hover:bg-[#F0747A]/10"><RefreshCw className="h-3 w-3" /> RETRY</button></div> : <div className="mt-6 space-y-4"><SecurityHealth data={data} /><SeverityStrip counts={data.severityCounts} onClick={(severity) => navigate(`/findings?severity=${severity}`)} /><div className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]"><TrendChart trend={data.trend} /><RecentActivity activities={data.recentActivity} /></div><div className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]"><RepositoryList repositories={data.repositories} /><Findings findings={data.criticalFindings} /></div><section className="flex flex-col justify-between gap-4 border border-[#28303D] bg-[#101319] p-5 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center border border-[#4C6FFF]/30 bg-[#4C6FFF]/10 text-[#9DABFF]"><Sparkles className="h-3.5 w-3.5" /></span><p className="text-[12px] text-[#A4ADBC]">Security scores are synchronized with repository posture in Projects.</p></div><Link to="/projects" className="inline-flex items-center gap-1 font-mono text-[10px] text-[#AAB8FF] hover:text-[#D0D7FF]">REVIEW REPOSITORIES <ArrowUpRight className="h-3 w-3" /></Link></section></div>}</div></main></div>;
}

export default Dashboard;
