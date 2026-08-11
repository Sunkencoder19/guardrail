import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowUpRight,
  ChevronDown,
  CircleAlert,
  CircleCheck,
  Clock3,
  FolderGit2,
  GitBranch,
  GitFork,
  LayoutDashboard,
  LoaderCircle,
  Lock,
  MoreHorizontal,
  Plus,
  RefreshCw,
  ScanLine,
  Search,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/api/axios";
import { useAuth } from "@/context/AuthContext";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "secure", label: "Secure" },
  { id: "warning", label: "Warning" },
  { id: "at_risk", label: "At Risk" },
  { id: "scanning", label: "Scanning" },
];

const SORTS = [
  { id: "recent", label: "Last scan" },
  { id: "score", label: "Security score" },
  { id: "findings", label: "Findings" },
  { id: "name", label: "Name" },
];

const SECURITY_STYLE = {
  SECURE: {
    label: "SECURE",
    text: "text-[#6DD6A8]",
    border: "border-[#6DD6A8]/25",
    surface: "bg-[#6DD6A8]/[0.08]",
    icon: CircleCheck,
  },
  WARNING: {
    label: "WARNING",
    text: "text-[#F2C46D]",
    border: "border-[#F2C46D]/25",
    surface: "bg-[#F2C46D]/[0.08]",
    icon: AlertTriangle,
  },
  AT_RISK: {
    label: "AT RISK",
    text: "text-[#F0747A]",
    border: "border-[#F0747A]/25",
    surface: "bg-[#F0747A]/[0.08]",
    icon: ShieldAlert,
  },
};

const SCAN_STYLE = {
  Pending: "text-[#8B92A0] bg-[#8B92A0]/10 border-[#8B92A0]/20",
  Scanning: "text-[#8FA2FF] bg-[#4C6FFF]/10 border-[#4C6FFF]/25",
  Completed: "text-[#6DD6A8] bg-[#6DD6A8]/[0.08] border-[#6DD6A8]/20",
  Failed: "text-[#F0747A] bg-[#F0747A]/[0.08] border-[#F0747A]/20",
};

function relativeTime(value) {
  if (!value) return "Not scanned";

  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(value)
  );
}

function repositoryNameFromUrl(repositoryUrl) {
  try {
    const { pathname } = new URL(repositoryUrl.trim());
    const segments = pathname.split("/").filter(Boolean);
    return segments.at(-1)?.replace(/\.git$/, "") || "";
  } catch {
    return "";
  }
}

function Sidebar({ user, onLogout }) {
  const links = [
    { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
    { label: "Projects", to: "/projects", icon: FolderGit2 },
    { label: "Findings", to: "/findings", icon: ShieldAlert },
    { label: "Reports", to: "/reports", icon: ScanLine },
  ];

  return (
    <aside className="hidden xl:flex fixed inset-y-0 left-0 z-20 w-[252px] flex-col border-r border-[#20242E] bg-[#0A0C10] px-4 py-5">
      <Link to="/dashboard" className="flex items-center gap-3 px-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-md border border-[#4C6FFF]/35 bg-[#4C6FFF]/10">
          <ShieldCheck className="h-4 w-4 text-[#8FA2FF]" />
        </span>
        <span className="text-[15px] font-semibold tracking-[-0.02em] text-[#F5F6F8]">Guardrail</span>
      </Link>

      <p className="mt-10 px-2.5 font-mono text-[10px] font-medium tracking-[0.16em] text-[#565D6D]">WORKSPACE</p>
      <nav className="mt-3 space-y-1">
        {links.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] transition-colors ${
                isActive
                  ? "bg-[#171B25] text-[#F5F6F8] shadow-[inset_2px_0_0_#4C6FFF]"
                  : "text-[#8B92A0] hover:bg-[#12151C] hover:text-[#E8EAF0]"
              }`
            }
          >
            <Icon className="h-4 w-4" strokeWidth={1.8} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto border-t border-[#20242E] pt-4">
        <div className="flex items-center gap-2.5 px-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-[#252B38] text-[10px] font-semibold text-[#B9C0CE]">
            {user?.name?.slice(0, 1)?.toUpperCase() || "U"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-medium text-[#E8EAF0]">{user?.name || "Guardrail user"}</p>
            <p className="truncate font-mono text-[10px] text-[#656D7D]">{user?.email || "SIGNED IN"}</p>
          </div>
          <button onClick={onLogout} className="text-[10px] font-mono text-[#777F90] transition-colors hover:text-[#F0747A]">
            OUT
          </button>
        </div>
      </div>
    </aside>
  );
}

function MobileNav() {
  const links = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Projects", to: "/projects" },
    { label: "Findings", to: "/findings" },
    { label: "Reports", to: "/reports" },
  ];

  return (
    <div className="xl:hidden border-b border-[#20242E] bg-[#0A0C10] px-5">
      <div className="flex h-14 items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2 text-[14px] font-semibold text-[#F5F6F8]">
          <ShieldCheck className="h-4 w-4 text-[#8FA2FF]" /> Guardrail
        </Link>
        <nav className="flex items-center gap-4 overflow-x-auto font-mono text-[10px] text-[#8B92A0]">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => (isActive ? "text-[#F5F6F8]" : "hover:text-[#F5F6F8]")}>
              {link.label.toUpperCase()}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}

function ProjectSkeleton() {
  return (
    <div className="animate-pulse border border-[#20242E] bg-[#12151C] p-5 sm:p-6">
      <div className="flex justify-between gap-6">
        <div className="space-y-3"><div className="h-4 w-36 bg-[#252A35]" /><div className="h-3 w-56 bg-[#20242E]" /></div>
        <div className="h-12 w-20 bg-[#252A35]" />
      </div>
      <div className="mt-8 flex gap-3"><div className="h-6 w-20 bg-[#20242E]" /><div className="h-6 w-16 bg-[#20242E]" /><div className="h-6 w-20 bg-[#20242E]" /></div>
      <div className="mt-7 h-px bg-[#20242E]" />
      <div className="mt-5 flex justify-between"><div className="h-3 w-36 bg-[#252A35]" /><div className="h-8 w-32 bg-[#252A35]" /></div>
    </div>
  );
}

function StatusPill({ project }) {
  if (project.status === "Scanning") {
    return <span className="inline-flex items-center gap-1.5 border border-[#4C6FFF]/25 bg-[#4C6FFF]/10 px-2 py-1 font-mono text-[10px] font-medium tracking-[0.08em] text-[#8FA2FF]"><LoaderCircle className="h-3 w-3 animate-spin" /> SCANNING</span>;
  }
  if (project.status === "Failed") {
    return <span className="inline-flex items-center gap-1.5 border border-[#F0747A]/20 bg-[#F0747A]/[0.08] px-2 py-1 font-mono text-[10px] font-medium tracking-[0.08em] text-[#F0747A]"><CircleAlert className="h-3 w-3" /> FAILED</span>;
  }
  return <span className={`inline-flex items-center border px-2 py-1 font-mono text-[10px] font-medium tracking-[0.08em] ${SCAN_STYLE[project.status] || SCAN_STYLE.Pending}`}>{project.status?.toUpperCase() || "PENDING"}</span>;
}

function ProjectCard({ project, menuId, onMenuToggle, onScan, onDelete }) {
  const navigate = useNavigate();
  const security = SECURITY_STYLE[project.securityStatus] || SECURITY_STYLE.SECURE;
  const SecurityIcon = security.icon;
  const isScanning = project.status === "Scanning";
  const isFailed = project.status === "Failed";

  return (
    <article className="group relative border border-[#20242E] bg-[#12151C] transition-colors hover:border-[#343B49] hover:bg-[#141820]">
      <button
        type="button"
        onClick={() => navigate(`/projects/${project.id}`)}
        className="absolute inset-0 z-0 cursor-pointer"
        aria-label={`Open ${project.name}`}
      />
      <div className="relative z-10 p-5 sm:p-6 pointer-events-none">
        <div className="flex items-start justify-between gap-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="grid h-7 w-7 shrink-0 place-items-center border border-[#303745] bg-[#171B25] text-[#AEB7C7]"><FolderGit2 className="h-3.5 w-3.5" /></span>
              <h2 className="truncate text-[17px] font-medium tracking-[-0.025em] text-[#F4F5F8]">{project.name}</h2>
            </div>
            <p className="mt-2 truncate pl-9 font-mono text-[11px] text-[#747D8F]">{project.repositoryName || "Repository"} <span className="mx-1 text-[#3C4351]">/</span> {project.repositoryUrl.replace(/^https?:\/\/github\.com\//, "")}</p>
          </div>

          <div className="shrink-0 text-right">
            <div className="flex items-baseline justify-end gap-0.5 font-mono">
              <span className="text-[29px] leading-none tracking-[-0.08em] text-[#F5F6F8]">{project.securityScore}</span>
              <span className="text-[10px] text-[#687184]">/100</span>
            </div>
            <span className={`mt-2 inline-flex items-center gap-1 border px-1.5 py-0.5 font-mono text-[9px] font-medium tracking-[0.1em] ${security.text} ${security.border} ${security.surface}`}>
              <SecurityIcon className="h-2.5 w-2.5" /> {security.label}
            </span>
          </div>
        </div>

        {project.description && <p className="mt-4 max-w-3xl truncate text-[12px] leading-relaxed text-[#858D9D]">{project.description}</p>}

        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-[#20242E] py-3 font-mono text-[10px] text-[#8B92A0]">
          <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#8FA2FF]" />{project.language || "Unknown"}</span>
          <span className="inline-flex items-center gap-1.5"><GitBranch className="h-3 w-3" />{project.defaultBranch || "main"}</span>
          <span className="inline-flex items-center gap-1.5">{project.visibility === "private" ? <Lock className="h-3 w-3" /> : <FolderGit2 className="h-3 w-3" />}{project.visibility || "unknown"}</span>
          <span className="inline-flex items-center gap-1"><Star className="h-3 w-3" />{project.stars ?? 0}</span>
          <span className="inline-flex items-center gap-1"><GitFork className="h-3 w-3" />{project.forks ?? 0}</span>
        </div>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px]">
            <Link to={`/findings?project=${project.id}`} onClick={(event) => event.stopPropagation()} className="pointer-events-auto inline-flex items-center gap-1.5 text-[#BEC5D0] transition-colors hover:text-[#F5F6F8]">
              <ShieldX className="h-3.5 w-3.5 text-[#F2C46D]" />
              <span className="font-mono text-[12px] text-[#E6E9EF]">{project.findingsCount}</span> {project.findingsCount === 1 ? "finding" : "findings"}
            </Link>
            {project.latestScanId ? (
              <Link to={`/findings?project=${project.id}&scan=${project.latestScanId}`} onClick={(event) => event.stopPropagation()} className="pointer-events-auto inline-flex items-center gap-1.5 text-[#7A8291] transition-colors hover:text-[#D6DCE6]"><Clock3 className="h-3.5 w-3.5" /> Last scan <span className="font-mono text-[#B9C0CE]">{relativeTime(project.lastScanAt)}</span></Link>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[#7A8291]"><Clock3 className="h-3.5 w-3.5" /> Last scan <span className="font-mono text-[#B9C0CE]">{relativeTime(project.lastScanAt)}</span></span>
            )}
            <StatusPill project={project} />
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={() => onScan(project)}
              disabled={isScanning}
              className={`inline-flex h-8 items-center gap-1.5 border px-3 font-mono text-[10px] font-medium tracking-[0.08em] transition-colors ${
                isScanning ? "cursor-not-allowed border-[#4C6FFF]/20 bg-[#4C6FFF]/5 text-[#6F7BA8]" : isFailed ? "border-[#F0747A]/30 bg-[#F0747A]/[0.07] text-[#F28A8F] hover:bg-[#F0747A]/15" : "border-[#4C6FFF]/35 bg-[#4C6FFF]/10 text-[#AAB8FF] hover:border-[#4C6FFF]/60 hover:bg-[#4C6FFF]/18"
              }`}
            >
              {isScanning ? <LoaderCircle className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              {isScanning ? "SCANNING" : isFailed ? "RETRY SCAN" : "SCAN"}
            </button>
            <Link to={`/projects/${project.id}`} onClick={(event) => event.stopPropagation()} className="inline-flex h-8 items-center gap-1.5 border border-[#303745] px-3 font-mono text-[10px] font-medium tracking-[0.08em] text-[#C4CAD5] transition-colors hover:border-[#4A5364] hover:bg-[#1A1F29]">
              OPEN <ArrowUpRight className="h-3 w-3" />
            </Link>
            <div className="relative">
              <button type="button" onClick={(event) => { event.stopPropagation(); onMenuToggle(project.id); }} className="grid h-8 w-8 place-items-center border border-[#303745] text-[#8B92A0] transition-colors hover:border-[#4A5364] hover:bg-[#1A1F29] hover:text-[#E8EAF0]" aria-label={`Actions for ${project.name}`}><MoreHorizontal className="h-4 w-4" /></button>
              {menuId === project.id && (
                <div className="absolute right-0 bottom-10 z-20 w-44 border border-[#343B49] bg-[#191E27] p-1 shadow-2xl">
                  <Link to={`/projects/${project.id}`} className="flex items-center gap-2 px-3 py-2 text-[11px] text-[#C8CED9] hover:bg-[#252B37]">Open project</Link>
                  <button onClick={() => onScan(project)} disabled={isScanning} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] text-[#C8CED9] hover:bg-[#252B37] disabled:text-[#606879]">Scan repository</button>
                  <Link to={`/findings?project=${project.id}`} className="flex items-center gap-2 px-3 py-2 text-[11px] text-[#C8CED9] hover:bg-[#252B37]">View findings</Link>
                  <div className="my-1 border-t border-[#303745]" />
                  <button onClick={() => onDelete(project)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] text-[#F48B90] hover:bg-[#F0747A]/10"><Trash2 className="h-3 w-3" /> Delete project</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function AddRepositoryDialog({ onClose, onCreated }) {
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    const normalizedUrl = repositoryUrl.trim().replace(/\.git\/?$/i, "");
    const repositoryName = repositoryNameFromUrl(normalizedUrl);
    const isGithubUrl = /^https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/?$/i.test(normalizedUrl);

    if (!isGithubUrl || !repositoryName) {
      setError("Enter a valid public GitHub repository URL.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await api.post("/projects", { name: repositoryName, repositoryUrl: normalizedUrl });
      toast.success("Repository added to Guardrail.");
      await onCreated();
      onClose();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Guardrail could not add this repository. Check that it is public and accessible.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-[#05060A]/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="add-repository-title">
      <form onSubmit={submit} className="w-full max-w-[480px] border border-[#343B49] bg-[#12151C] shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#20242E] px-6 py-5">
          <div><p className="font-mono text-[10px] tracking-[0.14em] text-[#8FA2FF]">NEW SECURITY ASSET</p><h2 id="add-repository-title" className="mt-1 text-[19px] font-medium tracking-[-0.025em] text-[#F5F6F8]">Add repository</h2></div>
          <button type="button" onClick={onClose} className="text-[#7A8291] hover:text-[#F5F6F8]" aria-label="Close"><X className="h-4 w-4" /></button>
        </div>
        <div className="px-6 py-6">
          <label htmlFor="repository-url" className="font-mono text-[10px] font-medium tracking-[0.1em] text-[#B9C0CE]">GITHUB REPOSITORY URL</label>
          <div className="mt-2 flex items-center border border-[#343B49] bg-[#0C0F14] focus-within:border-[#4C6FFF]/70">
            <FolderGit2 className="ml-3 h-4 w-4 shrink-0 text-[#697286]" />
            <input id="repository-url" autoFocus value={repositoryUrl} onChange={(event) => setRepositoryUrl(event.target.value)} placeholder="https://github.com/owner/repository" className="h-11 min-w-0 flex-1 bg-transparent px-3 font-mono text-[12px] text-[#EEF0F4] outline-none placeholder:text-[#555E6E]" />
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-[#737C8D]">Guardrail currently scans public GitHub repositories. Repository metadata is fetched automatically.</p>
          {error && <p className="mt-3 flex items-center gap-1.5 text-[11px] text-[#F28A8F]"><CircleAlert className="h-3.5 w-3.5" /> {error}</p>}
        </div>
        <div className="flex justify-end gap-3 border-t border-[#20242E] px-6 py-4">
          <button type="button" onClick={onClose} disabled={submitting} className="h-9 px-3 font-mono text-[10px] tracking-[0.08em] text-[#929BAD] hover:text-[#F5F6F8]">CANCEL</button>
          <button disabled={submitting} className="inline-flex h-9 items-center gap-1.5 border border-[#4C6FFF]/40 bg-[#4C6FFF] px-3.5 font-mono text-[10px] font-medium tracking-[0.08em] text-white hover:bg-[#5978FF] disabled:cursor-not-allowed disabled:opacity-60">{submitting && <LoaderCircle className="h-3 w-3 animate-spin" />}{submitting ? "ADDING" : "ADD REPOSITORY"}</button>
        </div>
      </form>
    </div>
  );
}

function DeleteDialog({ project, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const remove = async () => {
    setDeleting(true);
    setError("");
    try {
      await api.delete(`/projects/${project.id}`);
      toast.success(`${project.name} and its scan history were deleted.`);
      await onDeleted();
      onClose();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to delete this project. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-[#05060A]/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="delete-project-title">
      <div className="w-full max-w-[450px] border border-[#563036] bg-[#12151C] shadow-2xl">
        <div className="px-6 py-6"><div className="grid h-9 w-9 place-items-center border border-[#F0747A]/25 bg-[#F0747A]/10 text-[#F28A8F]"><Trash2 className="h-4 w-4" /></div><h2 id="delete-project-title" className="mt-4 text-[19px] font-medium tracking-[-0.025em] text-[#F5F6F8]">Delete {project.name}?</h2><p className="mt-2 text-[12px] leading-relaxed text-[#969EAE]">This will permanently remove the project, its scans, and its findings. This action cannot be undone.</p>{error && <p className="mt-3 text-[11px] text-[#F28A8F]">{error}</p>}</div>
        <div className="flex justify-end gap-3 border-t border-[#20242E] px-6 py-4"><button onClick={onClose} disabled={deleting} className="h-9 px-3 font-mono text-[10px] tracking-[0.08em] text-[#929BAD] hover:text-[#F5F6F8]">CANCEL</button><button onClick={remove} disabled={deleting} className="inline-flex h-9 items-center gap-1.5 border border-[#F0747A]/35 bg-[#F0747A]/10 px-3.5 font-mono text-[10px] font-medium tracking-[0.08em] text-[#F7A1A5] hover:bg-[#F0747A]/20 disabled:opacity-60">{deleting && <LoaderCircle className="h-3 w-3 animate-spin" />}{deleting ? "DELETING" : "DELETE PROJECT"}</button></div>
      </div>
    </div>
  );
}

function EmptyState({ onAdd }) {
  return <div className="border border-dashed border-[#303745] bg-[#101319] px-6 py-20 text-center"><div className="mx-auto grid h-11 w-11 place-items-center border border-[#303745] bg-[#171B25] text-[#8FA2FF]"><FolderGit2 className="h-5 w-5" /></div><p className="mt-5 text-[17px] font-medium tracking-[-0.02em] text-[#F0F2F6]">No repositories under protection</p><p className="mx-auto mt-2 max-w-sm text-[12px] leading-relaxed text-[#7D8697]">Connect a public GitHub repository to begin scanning your code with Guardrail.</p><button onClick={onAdd} className="mt-6 inline-flex h-9 items-center gap-1.5 border border-[#4C6FFF]/40 bg-[#4C6FFF]/10 px-3.5 font-mono text-[10px] font-medium tracking-[0.08em] text-[#AAB8FF] hover:bg-[#4C6FFF]/18"><Plus className="h-3.5 w-3.5" /> ADD REPOSITORY</button></div>;
}

function Projects() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("recent");
  const [menuId, setMenuId] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteProject, setDeleteProject] = useState(null);
  const [scanningIds, setScanningIds] = useState(() => new Set());

  const loadProjects = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const response = await api.get("/projects");
      setProjects(response.data.data || []);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProjects(); }, []);

  const handleScan = async (project) => {
    if (project.status === "Scanning" || scanningIds.has(project.id)) return;
    setMenuId(null);
    setScanningIds((current) => new Set(current).add(project.id));
    setProjects((current) => current.map((item) => (item.id === project.id ? { ...item, status: "Scanning" } : item)));
    try {
      await api.post(`/scans/${project.id}`);
      toast.success(`${project.name} scan completed.`);
      await loadProjects();
    } catch (requestError) {
      setProjects((current) => current.map((item) => (item.id === project.id ? { ...item, status: "Failed" } : item)));
      toast.error(requestError.response?.data?.message || "Scan failed. You can retry the repository scan.");
    } finally {
      setScanningIds((current) => { const next = new Set(current); next.delete(project.id); return next; });
    }
  };

  const visibleProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = projects.filter((project) => {
      const matchesSearch = !normalizedQuery || [project.name, project.repositoryName, project.language].some((value) => value?.toLowerCase().includes(normalizedQuery));
      const matchesFilter = filter === "all" || (filter === "secure" && project.securityStatus === "SECURE") || (filter === "warning" && project.securityStatus === "WARNING") || (filter === "at_risk" && project.securityStatus === "AT_RISK") || (filter === "scanning" && project.status === "Scanning");
      return matchesSearch && matchesFilter;
    });

    return [...filtered].sort((left, right) => {
      if (sort === "score") return (left.securityScore ?? -1) - (right.securityScore ?? -1);
      if (sort === "findings") return (right.findingsCount ?? 0) - (left.findingsCount ?? 0);
      if (sort === "name") return left.name.localeCompare(right.name);
      return new Date(right.lastScanAt || 0) - new Date(left.lastScanAt || 0);
    });
  }, [projects, query, filter, sort]);

  const logoutAndGoHome = () => { logout(); navigate("/login"); };

  return (
    <div className="min-h-screen bg-[#0A0C10] text-[#F5F6F8]">
      <Sidebar user={user} onLogout={logoutAndGoHome} />
      <MobileNav />
      <main className="min-h-screen xl:pl-[252px]">
        <div className="mx-auto max-w-[1440px] px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
          <header className="flex flex-col gap-5 border-b border-[#20242E] pb-7 lg:flex-row lg:items-end lg:justify-between">
            <div><p className="font-mono text-[10px] font-medium tracking-[0.16em] text-[#7180C5]">SECURITY ASSETS <span className="ml-2 text-[#4D5668]">/ {projects.length.toString().padStart(2, "0")}</span></p><h1 className="mt-2 text-[30px] font-medium tracking-[-0.045em] text-[#F5F6F8]">Projects</h1><p className="mt-1 text-[12px] text-[#8B92A0]">Repositories under continuous security monitoring.</p></div>
            <button onClick={() => setAddOpen(true)} className="inline-flex h-9 items-center justify-center gap-1.5 border border-[#4C6FFF]/45 bg-[#4C6FFF] px-3.5 font-mono text-[10px] font-medium tracking-[0.08em] text-white transition-colors hover:bg-[#5978FF]"><Plus className="h-3.5 w-3.5" /> ADD REPOSITORY</button>
          </header>

          <section className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex h-10 max-w-[410px] flex-1 items-center border border-[#303745] bg-[#101319] focus-within:border-[#4C6FFF]/65"><Search className="ml-3 h-4 w-4 text-[#6E7788]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search repositories, language..." className="min-w-0 flex-1 bg-transparent px-3 text-[12px] text-[#E8EAF0] outline-none placeholder:text-[#5C6576]" />{query && <button onClick={() => setQuery("")} className="mr-2 text-[#7A8291] hover:text-[#E8EAF0]" aria-label="Clear search"><X className="h-3.5 w-3.5" /></button>}</div>
              <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">{FILTERS.map((item) => <button key={item.id} onClick={() => setFilter(item.id)} className={`h-8 shrink-0 border px-2.5 font-mono text-[10px] tracking-[0.06em] transition-colors ${filter === item.id ? "border-[#4C6FFF]/45 bg-[#4C6FFF]/10 text-[#B8C3FF]" : "border-transparent text-[#7F8899] hover:border-[#303745] hover:bg-[#151922] hover:text-[#C6CCD6]"}`}>{item.label.toUpperCase()}</button>)}</div>
            </div>
            <label className="flex h-8 w-fit items-center gap-2 border border-[#303745] bg-[#101319] px-2.5 font-mono text-[10px] text-[#7F8899]">SORT <select value={sort} onChange={(event) => setSort(event.target.value)} className="cursor-pointer appearance-none bg-transparent pr-1 text-[10px] text-[#D5DAE3] outline-none">{SORTS.map((item) => <option key={item.id} value={item.id} className="bg-[#171B25]">{item.label}</option>)}</select><ChevronDown className="-ml-3 h-3 w-3 pointer-events-none" /></label>
          </section>

          <section className="mt-5" onClick={() => menuId && setMenuId(null)}>
            {loading ? <div className="grid gap-3"><ProjectSkeleton /><ProjectSkeleton /><ProjectSkeleton /></div> : loadError ? <div className="border border-[#5A3439] bg-[#F0747A]/[0.05] px-6 py-14 text-center"><CircleAlert className="mx-auto h-5 w-5 text-[#F28A8F]" /><h2 className="mt-3 text-[16px] font-medium">Unable to load projects</h2><p className="mt-1 text-[12px] text-[#939CAC]">Something went wrong while retrieving your repositories.</p><button onClick={loadProjects} className="mt-5 inline-flex h-8 items-center gap-1.5 border border-[#F0747A]/30 px-3 font-mono text-[10px] text-[#F5A0A4] hover:bg-[#F0747A]/10"><RefreshCw className="h-3 w-3" /> RETRY</button></div> : projects.length === 0 ? <EmptyState onAdd={() => setAddOpen(true)} /> : visibleProjects.length === 0 ? <div className="border border-dashed border-[#303745] bg-[#101319] px-6 py-16 text-center"><Search className="mx-auto h-5 w-5 text-[#616A7B]" /><p className="mt-3 text-[14px] text-[#D6DBE4]">No matching repositories</p><button onClick={() => { setQuery(""); setFilter("all"); }} className="mt-3 font-mono text-[10px] text-[#94A5FF] hover:text-[#C3CCFF]">CLEAR FILTERS</button></div> : <div className="grid gap-3">{visibleProjects.map((project) => <ProjectCard key={project.id} project={project} menuId={menuId} onMenuToggle={(id) => setMenuId((current) => current === id ? null : id)} onScan={handleScan} onDelete={(item) => { setMenuId(null); setDeleteProject(item); }} />)}</div>}
          </section>
        </div>
      </main>
      {addOpen && <AddRepositoryDialog onClose={() => setAddOpen(false)} onCreated={loadProjects} />}
      {deleteProject && <DeleteDialog project={deleteProject} onClose={() => setDeleteProject(null)} onDeleted={loadProjects} />}
    </div>
  );
}

export default Projects;
