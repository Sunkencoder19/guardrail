import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Code2,
  FileText,
  FolderGit2,
  LayoutDashboard,
  LoaderCircle,
  Search,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";

import api from "@/api/axios";
import { useAuth } from "@/context/AuthContext";

const EMPTY = {
  data: [],
  pagination: {
    currentPage: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  },
  severityCounts: {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  },
};

const SEVERITIES = [
  { id: "", label: "All", color: "#9AA4B5" },
  { id: "Critical", label: "Critical", color: "#F0747A" },
  { id: "High", label: "High", color: "#F28B68" },
  { id: "Medium", label: "Medium", color: "#F2C46D" },
  { id: "Low", label: "Low", color: "#7E98D8" },
];

const SEVERITY_STYLE = {
  Critical: "#F0747A",
  High: "#F28B68",
  Medium: "#F2C46D",
  Low: "#7E98D8",
};

const DEFAULT_OWASP_FILTERS = Array.from(
  { length: 10 },
  (_, index) => `A${String(index + 1).padStart(2, "0")}`
);

function relativeTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const seconds = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 1000)
  );

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;

  return `${Math.floor(seconds / 86400)}d ago`;
}

function locationFor(finding) {
  const file = String(finding.file || "").replace(/\\/g, "/");

  const clean =
    file.match(/\/temp\/[^/]+\/(.+)$/)?.[1] || file;

  const display = clean.startsWith("/")
    ? clean.split("/").filter(Boolean).slice(-2).join("/")
    : clean;

  return finding.line
    ? `${display || "Unknown"}:${finding.line}`
    : display || "Unknown";
}

function readableTitle(value) {
  const source = String(value || "Finding");

  const known = [
    [
      /github[-_.]actions.*mutable/i,
      "Mutable GitHub Action Tag",
    ],
    [
      /(curl|wget).*(pipe|shell|sh)/i,
      "Remote Script Execution",
    ],
    [
      /express[-_.]?(cookie|session).*secure/i,
      "Session Cookie Missing Secure Flag",
    ],
    [
      /(tls|ssl).*(bypass|disable|verify[-_.]?false)/i,
      "TLS Verification Bypass",
    ],
    [
      /(path|directory)[-_.]?traversal/i,
      "Path Traversal",
    ],
    [
      /sql[-_.]?injection/i,
      "SQL Injection",
    ],
  ];

  const match = known.find(([pattern]) => pattern.test(source));

  if (match) {
    return match[1];
  }

  const ignored = new Set([
    "yaml",
    "javascript",
    "js",
    "node",
    "security",
    "audit",
    "generic",
    "semgrep",
    "rules",
    "check",
  ]);

  const words = source
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter(
      (word) => word.length > 1 && !ignored.has(word)
    );

  return (
    words.slice(-6).join(" ") || "Finding"
  ).replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function owaspCode(owasp) {
  const first = Array.isArray(owasp) ? owasp[0] : "";

  return (
    first?.match(/A\d{2}(?::\d{4})?/i)?.[0] || "—"
  );
}

function owaspLabel(value) {
  const code = value?.match(/A\d{2}/i)?.[0];

  if (!code) {
    return value;
  }

  return code.toUpperCase();
}

function Label({ children }) {
  return (
    <span className="font-mono text-[9px] font-medium tracking-[0.12em] text-[#70798A]">
      {children}
    </span>
  );
}

function Sidebar({ user, onLogout }) {
  const links = [
    {
      label: "Dashboard",
      to: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Projects",
      to: "/projects",
      icon: FolderGit2,
    },
    {
      label: "Findings",
      to: "/findings",
      icon: ShieldAlert,
    },
    {
      label: "Reports",
      to: "/reports",
      icon: FileText,
    },
  ];

  return (
    <aside className="hidden xl:flex fixed inset-y-0 left-0 z-20 w-[252px] flex-col border-r border-[#20242E] bg-[#0A0C10] px-4 py-5">
      <Link
        to="/dashboard"
        className="flex items-center gap-3 px-2.5"
      >
        <span className="grid h-8 w-8 place-items-center rounded-md border border-[#4C6FFF]/35 bg-[#4C6FFF]/10">
          <ShieldCheck className="h-4 w-4 text-[#8FA2FF]" />
        </span>

        <span className="text-[15px] font-semibold tracking-[-0.02em] text-[#F5F6F8]">
          Guardrail
        </span>
      </Link>

      <p className="mt-10 px-2.5 font-mono text-[10px] font-medium tracking-[0.16em] text-[#565D6D]">
        WORKSPACE
      </p>

      <nav className="mt-3 space-y-1">
        {links.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] transition-colors ${
                isActive
                  ? "bg-[#171B25] text-[#F5F6F8] shadow-[inset_2px_0_0_#4C6FFF]"
                  : "text-[#8B92A0] hover:bg-[#12151C] hover:text-[#E8EAF0]"
              }`
            }
          >
            <Icon
              className="h-4 w-4"
              strokeWidth={1.8}
            />
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
            <p className="truncate text-[12px] font-medium text-[#E8EAF0]">
              {user?.name || "Guardrail user"}
            </p>

            <p className="truncate font-mono text-[10px] text-[#656D7D]">
              {user?.email || "SIGNED IN"}
            </p>
          </div>

          <button
            onClick={onLogout}
            className="text-[10px] font-mono text-[#777F90] hover:text-[#F0747A]"
          >
            OUT
          </button>
        </div>
      </div>
    </aside>
  );
}

function MobileNav() {
  return (
    <div className="xl:hidden border-b border-[#20242E] bg-[#0A0C10] px-5">
      <div className="flex h-14 items-center justify-between">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 text-[14px] font-semibold text-[#F5F6F8]"
        >
          <ShieldCheck className="h-4 w-4 text-[#8FA2FF]" />
          Guardrail
        </Link>

        <nav className="flex gap-4 font-mono text-[10px] text-[#8B92A0]">
          <NavLink to="/dashboard">
            DASHBOARD
          </NavLink>

          <NavLink to="/projects">
            PROJECTS
          </NavLink>

          <NavLink
            to="/findings"
            className="text-[#F5F6F8]"
          >
            FINDINGS
          </NavLink>
        </nav>
      </div>
    </div>
  );
}

function SeverityBadge({ severity }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.09em]"
      style={{
        color:
          SEVERITY_STYLE[severity] || "#8B92A0",
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{
          backgroundColor:
            SEVERITY_STYLE[severity] || "#8B92A0",
        }}
      />

      {severity?.toUpperCase()}
    </span>
  );
}

function Drawer({ finding, loading, onClose }) {
  if (!finding && !loading) {
    return null;
  }

  const fullOwasp = finding?.owasp || [];
  const cwe = finding?.cwe || [];

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-[#05060A]/60 backdrop-blur-[1px]">
      <button
        className="h-full flex-1 cursor-default"
        onClick={onClose}
        aria-label="Close finding details"
      />

      <aside className="relative h-full w-full max-w-[510px] overflow-y-auto border-l border-[#343C4B] bg-[#11151C] shadow-2xl">
        {loading ? (
          <div className="space-y-5 p-7 animate-pulse">
            <div className="h-4 w-20 bg-[#252B37]" />
            <div className="h-7 w-3/4 bg-[#252B37]" />
            <div className="h-24 bg-[#202631]" />
            <div className="h-40 bg-[#202631]" />
          </div>
        ) : (
          <>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#28303D] bg-[#11151C]/95 px-7 py-5 backdrop-blur">
              <SeverityBadge severity={finding.severity} />

              <button
                onClick={onClose}
                className="grid h-7 w-7 place-items-center border border-[#303847] text-[#8A94A5] hover:bg-[#202631] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-7">
              <h2 className="text-[23px] font-medium leading-tight tracking-[-0.035em] text-[#F2F4F8]">
                {readableTitle(finding.title)}
              </h2>

              <Link
                to={`/projects/${finding.project?.id}`}
                className="mt-4 inline-flex items-center gap-1.5 font-mono text-[11px] text-[#A6B4FF] hover:text-[#D0D7FF]"
              >
                <FolderGit2 className="h-3.5 w-3.5" />

                {finding.project?.name ||
                  "Repository"}

                <ArrowUpRight className="h-3 w-3" />
              </Link>

              <p className="mt-2 font-mono text-[11px] text-[#7D8798]">
                {locationFor(finding)}
              </p>

              <div className="my-6 border-t border-[#28303D]" />

              <section>
                <Label>HOW TO FIX</Label>

                <div className="mt-2 border border-[#4C6FFF]/25 bg-[#4C6FFF]/[0.07] p-4">
                  <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.1em] text-[#AAB8FF]">
                    <Sparkles className="h-3.5 w-3.5" />
                    REMEDIATION GUIDANCE
                  </div>

                  <p className="mt-2 text-[13px] leading-relaxed text-[#D9DEE8]">
                    {finding.recommendation ||
                      "Review the affected code and follow secure coding practices."}
                  </p>
                </div>
              </section>

              <section className="mt-6 grid gap-5 sm:grid-cols-2">
                <div>
                  <Label>OWASP</Label>

                  <div className="mt-2 space-y-1.5">
                    {fullOwasp.length ? (
                      fullOwasp.map((item) => (
                        <p
                          key={item}
                          className="text-[11px] leading-relaxed text-[#C8D0DD]"
                        >
                          {item}
                        </p>
                      ))
                    ) : (
                      <p className="text-[11px] text-[#6F7889]">
                        Not mapped
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label>CWE</Label>

                  <div className="mt-2 space-y-1.5">
                    {cwe.length ? (
                      cwe.map((item) => (
                        <p
                          key={item}
                          className="text-[11px] leading-relaxed text-[#C8D0DD]"
                        >
                          {item}
                        </p>
                      ))
                    ) : (
                      <p className="text-[11px] text-[#6F7889]">
                        Not mapped
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <section className="mt-6">
                <Label>DESCRIPTION</Label>

                <p className="mt-2 text-[13px] leading-relaxed text-[#B6BFCD]">
                  {finding.description ||
                    "No description available."}
                </p>
              </section>

              <section className="mt-6">
                <Label>AFFECTED CODE</Label>

                <div className="mt-2 overflow-hidden border border-[#303847] bg-[#0B0E13]">
                  <div className="border-b border-[#252D39] px-3 py-2 font-mono text-[10px] text-[#8490A5]">
                    {locationFor(finding)}
                  </div>

                  <div className="flex gap-3 px-3 py-3 font-mono text-[11px]">
                    <span className="select-none text-[#596376]">
                      {finding.line || "—"}
                    </span>

                    <span className="text-[#E0E5ED]">
                      Affected code is available in the repository.
                    </span>
                  </div>
                </div>
              </section>

              <div className="mt-7">
                <Link
                  to={`/projects/${finding.project?.id}`}
                  className="inline-flex h-9 items-center gap-1.5 border border-[#303847] px-3 font-mono text-[10px] tracking-[0.08em] text-[#C6CDD9] hover:bg-[#1C222C]"
                >
                  <FolderGit2 className="h-3.5 w-3.5" />
                  OPEN PROJECT
                </Link>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

function FindingsTable({ findings, onSelect }) {
  return (
    <div className="overflow-x-auto border border-[#28303D] bg-[#12151C]">
      <div className="min-w-[900px]">
        <div className="grid grid-cols-[110px_minmax(260px,1.5fr)_150px_155px_100px_80px] gap-4 border-b border-[#28303D] bg-[#101319] px-6 py-3 font-mono text-[9px] tracking-[0.12em] text-[#70798A]">
          <span>SEVERITY</span>
          <span>FINDING</span>
          <span>REPOSITORY</span>
          <span>LOCATION</span>
          <span>OWASP</span>
          <span>DETECTED</span>
        </div>

        {findings.map((finding) => (
          <button
            key={finding.id}
            onClick={() => onSelect(finding.id)}
            className="grid w-full grid-cols-[110px_minmax(260px,1.5fr)_150px_155px_100px_80px] gap-4 border-b border-[#242C38] px-6 py-4 text-left transition-colors last:border-b-0 hover:bg-[#171C25]"
          >
            <div>
              <SeverityBadge severity={finding.severity} />
            </div>

            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-[#E3E7EE]">
                {readableTitle(finding.title)}
              </p>

              <p className="mt-1 truncate text-[11px] text-[#7D8798]">
                {finding.description}
              </p>
            </div>

            <Link
              onClick={(event) =>
                event.stopPropagation()
              }
              to={`/projects/${finding.project?.id}`}
              className="truncate font-mono text-[11px] text-[#A4B3FF] hover:text-[#CDD5FF]"
            >
              {finding.project?.name ||
                "Repository"}
            </Link>

            <span className="truncate font-mono text-[10px] text-[#9AA4B4]">
              {locationFor(finding)}
            </span>

            <span className="w-fit border border-[#3A4351] px-1.5 py-0.5 font-mono text-[9px] text-[#B6C0D0]">
              {owaspCode(finding.owasp)}
            </span>

            <span className="font-mono text-[10px] text-[#738093]">
              {relativeTime(finding.createdAt)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="border border-[#28303D] bg-[#12151C] animate-pulse">
      {Array.from({ length: 7 }).map(
        (_, index) => (
          <div
            key={index}
            className="flex gap-5 border-b border-[#242C38] px-6 py-5"
          >
            <span className="h-3 w-16 bg-[#282F3B]" />
            <span className="h-3 flex-1 bg-[#282F3B]" />
            <span className="h-3 w-28 bg-[#282F3B]" />
          </div>
        )
      )}
    </div>
  );
}

function Findings() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [params, setParams] = useSearchParams();

  const [result, setResult] = useState(EMPTY);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const [search, setSearch] = useState(
    params.get("search") || ""
  );

  const [debouncedSearch, setDebouncedSearch] =
    useState(params.get("search") || "");

  const [severity, setSeverity] = useState(
    params.get("severity") || ""
  );

  const [projectId, setProjectId] = useState(
    params.get("projectId") || ""
  );

  const [owasp, setOwasp] = useState(
    params.get("owasp") || ""
  );

  const [sort, setSort] = useState(
    params.get("sort") || "severity"
  );

  const [page, setPage] = useState(
    Number(params.get("page")) || 1
  );

  // -------------------------
  // Search debounce
  // -------------------------
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 250);

    return () => clearTimeout(timer);
  }, [search]);

  // -------------------------
  // Projects
  // -------------------------
  useEffect(() => {
    api
      .get("/projects")
      .then((response) => {
        setProjects(response.data.data || []);
      })
      .catch(() => {});
  }, []);

  // -------------------------
  // Findings
  // -------------------------
  useEffect(() => {
    let cancelled = false;

    const query = new URLSearchParams({
      page: String(page),
      limit: "20",
      sort,
    });

    if (severity) {
      query.set("severity", severity);
    }

    if (projectId) {
      query.set("projectId", projectId);
    }

    if (owasp) {
      query.set("owasp", owasp);
    }

    if (debouncedSearch) {
      query.set("search", debouncedSearch);
    }

    setLoading(true);
    setError(false);

    api
      .get(`/findings?${query.toString()}`)
      .then((response) => {
        if (!cancelled) {
          setResult({
            ...EMPTY,
            ...response.data,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    page,
    severity,
    projectId,
    owasp,
    sort,
    debouncedSearch,
    retryKey,
  ]);

  // -------------------------
  // Keep URL synchronized
  // -------------------------
  useEffect(() => {
    const next = {};

    if (page > 1) {
      next.page = String(page);
    }

    if (severity) {
      next.severity = severity;
    }

    if (projectId) {
      next.projectId = projectId;
    }

    if (owasp) {
      next.owasp = owasp;
    }

    if (sort && sort !== "severity") {
      next.sort = sort;
    }

    if (debouncedSearch) {
      next.search = debouncedSearch;
    }

    setParams(next, {
      replace: true,
    });
  }, [
    page,
    severity,
    projectId,
    owasp,
    sort,
    debouncedSearch,
    setParams,
  ]);

  // -------------------------
  // Finding details
  // -------------------------
  const selectFinding = async (id) => {
    setDetailsLoading(true);
    setDetails(null);

    try {
      const response = await api.get(
        `/findings/${id}`
      );

      setDetails(response.data.data);
    } catch {
      setDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  // -------------------------
  // Derived values
  // -------------------------
  const counts =
    result.severityCounts ||
    EMPTY.severityCounts;

  const total =
    result.pagination?.totalItems || 0;

  const rangeStart = total
    ? (result.pagination.currentPage - 1) *
        result.pagination.pageSize +
      1
    : 0;

  const rangeEnd = Math.min(
    result.pagination.currentPage *
      result.pagination.pageSize,
    total
  );

  const owaspOptions = useMemo(() => {
    const values = new Set(
      DEFAULT_OWASP_FILTERS
    );

    for (const finding of result.data || []) {
      for (const item of finding.owasp || []) {
        const code = item.match(/A\d{2}/i)?.[0];

        if (code) {
          values.add(code.toUpperCase());
        }
      }
    }

    return Array.from(values).sort();
  }, [result.data]);

  // -------------------------
  // Handlers
  // -------------------------
  const changeSeverity = (value) => {
    setSeverity(value);
    setPage(1);
  };

  const changeOwasp = (value) => {
    setOwasp(value);
    setPage(1);
  };

  const clearFilters = () => {
    setSeverity("");
    setProjectId("");
    setOwasp("");
    setSort("severity");
    setSearch("");
    setPage(1);
  };

  const logoutAndGoHome = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#0A0C10] text-[#F5F6F8]">
      <Sidebar
        user={user}
        onLogout={logoutAndGoHome}
      />

      <MobileNav />

      <main className="min-h-screen xl:pl-[252px]">
        <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 lg:px-10 lg:py-9">

          {/* Header */}
          <header className="flex flex-col gap-5 border-b border-[#20242E] pb-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-mono text-[10px] font-medium tracking-[0.16em] text-[#7180C5]">
                SECURITY INVESTIGATION WORKSPACE
              </p>

              <h1 className="mt-2 text-[30px] font-medium tracking-[-0.045em] text-[#F5F6F8]">
                Findings
              </h1>

              <p className="mt-1 text-[12px] text-[#8B92A0]">
                Security vulnerabilities detected across your repositories.
              </p>
            </div>

            <div className="border border-[#303847] bg-[#101319] px-3 py-2 font-mono text-[10px] tracking-[0.11em] text-[#A9B3C2]">
              <span className="text-[#AAB8FF]">
                {total}
              </span>{" "}
              TOTAL FINDINGS
            </div>
          </header>

          {/* Search + filters */}
          <section className="relative mt-6 flex flex-col gap-3 lg:flex-row">
            <div className="flex h-10 flex-1 items-center border border-[#303847] bg-[#101319] focus-within:border-[#4C6FFF]/65">
              <Search className="ml-3 h-4 w-4 text-[#6E7788]" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search findings, code paths, categories..."
                className="min-w-0 flex-1 bg-transparent px-3 text-[12px] text-[#E8EAF0] outline-none placeholder:text-[#5C6576]"
              />

              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="mr-3 text-[#7A8291] hover:text-[#F5F6F8]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={() =>
                setFiltersOpen((open) => !open)
              }
              className={`inline-flex h-10 items-center justify-center gap-1.5 border px-3.5 font-mono text-[10px] tracking-[0.08em] ${
                filtersOpen ||
                projectId ||
                owasp ||
                sort !== "severity"
                  ? "border-[#4C6FFF]/45 bg-[#4C6FFF]/10 text-[#B9C4FF]"
                  : "border-[#303847] bg-[#101319] text-[#B9C0CE] hover:bg-[#171C25]"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              FILTERS
              <ChevronDown className="h-3 w-3" />
            </button>

            {filtersOpen && (
              <div className="absolute right-0 top-12 z-20 w-full border border-[#3B4352] bg-[#171C25] p-5 shadow-2xl sm:w-[430px]">
                <div className="grid gap-4 sm:grid-cols-2">

                  <label>
                    <Label>REPOSITORY</Label>

                    <select
                      value={projectId}
                      onChange={(event) => {
                        setProjectId(event.target.value);
                        setPage(1);
                      }}
                      className="mt-2 h-9 w-full border border-[#343C4B] bg-[#0D1016] px-2 font-mono text-[10px] text-[#D3D9E3] outline-none"
                    >
                      <option value="">
                        All repositories
                      </option>

                      {projects.map((project) => (
                        <option
                          key={project.id}
                          value={project.id}
                        >
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <Label>OWASP</Label>

                    <select
                      value={owasp}
                      onChange={(event) =>
                        changeOwasp(event.target.value)
                      }
                      className="mt-2 h-9 w-full border border-[#343C4B] bg-[#0D1016] px-2 font-mono text-[10px] text-[#D3D9E3] outline-none"
                    >
                      <option value="">
                        All categories
                      </option>

                      {owaspOptions.map((item) => (
                        <option
                          key={item}
                          value={item}
                        >
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <Label>SORT</Label>

                    <select
                      value={sort}
                      onChange={(event) => {
                        setSort(event.target.value);
                        setPage(1);
                      }}
                      className="mt-2 h-9 w-full border border-[#343C4B] bg-[#0D1016] px-2 font-mono text-[10px] text-[#D3D9E3] outline-none"
                    >
                      <option value="severity">
                        Severity
                      </option>

                      <option value="newest">
                        Newest
                      </option>

                      <option value="oldest">
                        Oldest
                      </option>
                    </select>
                  </label>

                  <button
                    onClick={clearFilters}
                    className="self-end h-9 border border-[#343C4B] font-mono text-[10px] text-[#98A3B6] hover:bg-[#202631]"
                  >
                    RESET FILTERS
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Severity overview */}
          <section className="mt-4 grid grid-cols-2 divide-x divide-y divide-[#28303D] border border-[#28303D] bg-[#12151C] sm:grid-cols-5 sm:divide-y-0">
            {SEVERITIES.map((item) => {
              const value = item.id
                ? counts[item.id.toLowerCase()] || 0
                : Object.values(counts).reduce(
                    (sum, count) =>
                      sum + count,
                    0
                  );

              return (
                <button
                  key={item.label}
                  onClick={() =>
                    changeSeverity(item.id)
                  }
                  className={`px-4 py-3.5 text-left transition-colors hover:bg-[#171C25] ${
                    severity === item.id
                      ? "bg-[#171C25] shadow-[inset_0_2px_0_#4C6FFF]"
                      : ""
                  }`}
                >
                  <p
                    className="font-mono text-[9px] tracking-[0.1em]"
                    style={{
                      color: item.color,
                    }}
                  >
                    {item.label.toUpperCase()}
                  </p>

                  <p className="mt-1 font-mono text-[23px] tracking-[-0.07em] text-[#F0F2F6]">
                    {value}
                  </p>
                </button>
              );
            })}
          </section>

          {/* Findings */}
          <section className="mt-5">
            {loading ? (
              <TableSkeleton />
            ) : error ? (
              <div className="border border-[#5A3439] bg-[#F0747A]/[0.05] px-6 py-16 text-center">
                <CircleAlert className="mx-auto h-5 w-5 text-[#F28A8F]" />

                <h2 className="mt-3 text-[16px] font-medium">
                  Unable to load findings
                </h2>

                <p className="mt-1 text-[12px] text-[#939CAC]">
                  Something went wrong while retrieving your security findings.
                </p>

                <button
                  onClick={() =>
                    setRetryKey((key) => key + 1)
                  }
                  className="mt-5 inline-flex h-8 items-center gap-1.5 border border-[#F0747A]/30 px-3 font-mono text-[10px] text-[#F5A0A4] hover:bg-[#F0747A]/10"
                >
                  <LoaderCircle className="h-3 w-3" />
                  RETRY
                </button>
              </div>
            ) : result.data.length ? (
              <>
                <FindingsTable
                  findings={result.data}
                  onSelect={selectFinding}
                />

                <div className="mt-4 flex flex-col gap-3 border-t border-[#20242E] pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-mono text-[10px] text-[#788294]">
                    SHOWING {rangeStart}–{rangeEnd} OF{" "}
                    {total} FINDINGS
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setPage((current) =>
                          Math.max(1, current - 1)
                        )
                      }
                      disabled={
                        !result.pagination
                          .hasPreviousPage
                      }
                      className="inline-flex h-8 items-center gap-1 border border-[#303847] px-2.5 font-mono text-[10px] text-[#BCC4D0] disabled:opacity-35"
                    >
                      <ArrowLeft className="h-3 w-3" />
                      PREVIOUS
                    </button>

                    <span className="font-mono text-[10px] text-[#929CAD]">
                      {result.pagination.currentPage} /{" "}
                      {Math.max(
                        1,
                        result.pagination.totalPages
                      )}
                    </span>

                    <button
                      onClick={() =>
                        setPage(
                          (current) => current + 1
                        )
                      }
                      disabled={
                        !result.pagination
                          .hasNextPage
                      }
                      className="inline-flex h-8 items-center gap-1 border border-[#303847] px-2.5 font-mono text-[10px] text-[#BCC4D0] disabled:opacity-35"
                    >
                      NEXT
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="border border-dashed border-[#303847] bg-[#101319] px-6 py-20 text-center">
                <CheckCircle2 className="mx-auto h-7 w-7 text-[#6DD6A8]" />

                <p className="mt-4 font-mono text-[11px] tracking-[0.13em] text-[#AEB8C8]">
                  NO FINDINGS
                </p>

                <p className="mx-auto mt-2 max-w-sm text-[12px] leading-relaxed text-[#7E8899]">
                  Guardrail hasn’t detected any security issues in your repositories for this filter.
                </p>

                <Link
                  to="/projects"
                  className="mt-6 inline-flex h-9 items-center gap-1.5 border border-[#303847] px-3 font-mono text-[10px] text-[#C1C8D4] hover:bg-[#1B2029]"
                >
                  <FolderGit2 className="h-3.5 w-3.5" />
                  VIEW PROJECTS
                </Link>
              </div>
            )}
          </section>
        </div>
      </main>

      <Drawer
        finding={details}
        loading={detailsLoading}
        onClose={() => {
          setDetails(null);
          setDetailsLoading(false);
        }}
      />
    </div>
  );
}

export default Findings;