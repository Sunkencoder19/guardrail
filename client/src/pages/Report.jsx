import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Download,
  ExternalLink,
  FileText,
  FolderGit2,
  GitBranch,
  LoaderCircle,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  XCircle,
} from "lucide-react";
import {
  Link,
  NavLink,
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "@/api/axios";
import { useAuth } from "@/context/AuthContext";

/* =========================================================
   CONSTANTS
========================================================= */

const SEVERITY_CONFIG = {
  Critical: {
    color: "#F0747A",
    background: "bg-[#F0747A]/[0.07]",
    border: "border-[#F0747A]/25",
  },
  High: {
    color: "#F28B68",
    background: "bg-[#F28B68]/[0.07]",
    border: "border-[#F28B68]/25",
  },
  Medium: {
    color: "#F2C46D",
    background: "bg-[#F2C46D]/[0.07]",
    border: "border-[#F2C46D]/25",
  },
  Low: {
    color: "#7E98D8",
    background: "bg-[#7E98D8]/[0.07]",
    border: "border-[#7E98D8]/25",
  },
};

const EMPTY_SUMMARY = {
  totalFindings: 0,
  critical: 0,
  high: 0,
  medium: 0,
  low: 0,
};

/* =========================================================
   HELPERS
========================================================= */

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateOnly(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDuration(seconds) {
  if (seconds === null || seconds === undefined) {
    return "—";
  }

  const numericSeconds = Number(seconds);

  if (!Number.isFinite(numericSeconds)) {
    return "—";
  }

  if (numericSeconds < 60) {
    return `${numericSeconds}s`;
  }

  const minutes = Math.floor(numericSeconds / 60);
  const remainingSeconds = numericSeconds % 60;

  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
}

function calculateSecurityScore(summary) {
  const critical = Number(summary?.critical || 0);
  const high = Number(summary?.high || 0);
  const medium = Number(summary?.medium || 0);
  const low = Number(summary?.low || 0);

  const score =
    100 -
    critical * 20 -
    high * 5 -
    medium * 2 -
    low * 0.5;

  return Math.max(0, Math.round(score));
}

function getAssessment(score, summary) {
  if (Number(summary?.critical || 0) > 0) {
    return {
      label: "AT RISK",
      description:
        "Critical security findings were detected during this scan and require immediate attention.",
      color: "#F0747A",
      icon: ShieldAlert,
    };
  }

  if (Number(summary?.high || 0) >= 5) {
    return {
      label: "WARNING",
      description:
        "Multiple high-severity security findings were detected and should be addressed before release.",
      color: "#F2C46D",
      icon: AlertTriangle,
    };
  }

  if (score < 80) {
    return {
      label: "NEEDS ATTENTION",
      description:
        "Security weaknesses were detected and should be reviewed according to their severity.",
      color: "#F2C46D",
      icon: AlertTriangle,
    };
  }

  return {
    label: "SECURE",
    description:
      "No critical security blockers were detected in this scan.",
    color: "#6DD6A8",
    icon: ShieldCheck,
  };
}

function readableTitle(value) {
  const source = String(value || "Security Finding");

  const knownMappings = [
    [
      /sql[-_.]?injection/i,
      "SQL Injection",
    ],
    [
      /command[-_.]?injection/i,
      "Command Injection",
    ],
    [
      /remote[-_.]?code[-_.]?execution/i,
      "Remote Code Execution",
    ],
    [
      /hardcoded[-_.]?secret/i,
      "Hardcoded Secret",
    ],
    [
      /hardcoded[-_.]?password/i,
      "Hardcoded Password",
    ],
    [
      /hardcoded[-_.]?token/i,
      "Hardcoded Token",
    ],
    [
      /using[-_.]?http[-_.]?server/i,
      "Insecure Transport",
    ],
    [
      /mutable[-_.]?action[-_.]?tag/i,
      "Mutable GitHub Action Tag",
    ],
    [
      /path[-_.]?traversal/i,
      "Path Traversal",
    ],
    [
      /deserialization/i,
      "Unsafe Deserialization",
    ],
  ];

  const match = knownMappings.find(
    ([pattern]) => pattern.test(source)
  );

  if (match) {
    return match[1];
  }

  const ignored = new Set([
    "yaml",
    "javascript",
    "typescript",
    "security",
    "audit",
    "generic",
    "semgrep",
    "rules",
    "check",
    "problem",
    "based",
    "packs",
  ]);

  const words = source
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter(
      (word) =>
        word.length > 1 &&
        !ignored.has(word)
    );

  return (
    words.slice(-6).join(" ") ||
    "Security Finding"
  ).replace(/\b\w/g, (letter) =>
    letter.toUpperCase()
  );
}

function getFileLocation(finding) {
  const file = String(finding?.file || "").replace(
    /\\/g,
    "/"
  );

  const cleaned =
    file.match(/\/temp\/[^/]+\/(.+)$/)?.[1] ||
    file;

  const shortPath = cleaned
    .split("/")
    .filter(Boolean)
    .slice(-3)
    .join("/");

  if (!shortPath) {
    return finding?.line
      ? `Line ${finding.line}`
      : "Unknown location";
  }

  return finding?.line
    ? `${shortPath}:${finding.line}`
    : shortPath;
}

function getCweCode(finding) {
  if (!finding?.cwe) return null;

  const value = Array.isArray(finding.cwe)
    ? finding.cwe.join(" ")
    : String(finding.cwe);

  return (
    value.match(/CWE-\d+/i)?.[0]?.toUpperCase() ||
    null
  );
}

function getOwaspCode(finding) {
  if (!finding?.owasp) return null;

  const value = Array.isArray(finding.owasp)
    ? finding.owasp.join(" ")
    : String(finding.owasp);

  return (
    value.match(/A\d{2}/i)?.[0]?.toUpperCase() ||
    null
  );
}

function Label({ children }) {
  return (
    <p className="font-mono text-[9px] font-medium tracking-[0.14em] text-[#687286] print:text-[#555C6B]">
      {children}
    </p>
  );
}

/* =========================================================
   SIDEBAR
========================================================= */

function Sidebar({ user, onLogout }) {
  const links = [
    {
      label: "Dashboard",
      to: "/dashboard",
      icon: ShieldCheck,
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
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[252px] flex-col border-r border-[#20242E] bg-[#0A0C10] px-4 py-5 xl:flex print:hidden">
      <Link
        to="/dashboard"
        className="flex items-center gap-3 px-2.5"
      >
        <span className="grid h-8 w-8 place-items-center rounded-md border border-[#4C6FFF]/35 bg-[#4C6FFF]/10">
          <ShieldCheck
            className="h-4 w-4 text-[#8FA2FF]"
            strokeWidth={1.8}
          />
        </span>

        <span className="text-[15px] font-semibold tracking-[-0.02em] text-[#F5F6F8]">
          Guardrail
        </span>
      </Link>

      <p className="mt-10 px-2.5 font-mono text-[10px] font-medium tracking-[0.16em] text-[#565D6D]">
        WORKSPACE
      </p>

      <nav className="mt-3 space-y-1">
        {links.map(
          ({ label, to, icon: Icon }) => (
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
          )
        )}
      </nav>

      <div className="mt-auto border-t border-[#20242E] pt-4">
        <div className="flex items-center gap-2.5 px-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-[#252B38] text-[10px] font-semibold text-[#B9C0CE]">
            {user?.name
              ?.slice(0, 1)
              ?.toUpperCase() || "U"}
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
            className="font-mono text-[10px] text-[#777F90] transition-colors hover:text-[#F0747A]"
          >
            OUT
          </button>
        </div>
      </div>
    </aside>
  );
}

/* =========================================================
   MOBILE NAV
========================================================= */

function MobileNav() {
  return (
    <div className="border-b border-[#20242E] bg-[#0A0C10] px-5 xl:hidden print:hidden">
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

          <NavLink
            to="/reports"
            className="text-[#F5F6F8]"
          >
            REPORTS
          </NavLink>
        </nav>
      </div>
    </div>
  );
}

/* =========================================================
   SCAN STATUS BADGE
========================================================= */

const SCAN_STATUS_CONFIG = {
  Completed: { color: "#6DD6A8", icon: CheckCircle2 },
  Scanning: { color: "#7E98D8", icon: LoaderCircle },
  Pending: { color: "#7E98D8", icon: LoaderCircle },
  Failed: { color: "#F0747A", icon: XCircle },
};

function ScanStatusBadge({ status }) {
  const config =
    SCAN_STATUS_CONFIG[status] || SCAN_STATUS_CONFIG.Pending;

  const StatusIcon = config.icon;

  return (
    <span
      className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.06em]"
      style={{ color: config.color }}
    >
      <StatusIcon
        className={`h-3.5 w-3.5 ${
          status === "Scanning" || status === "Pending"
            ? "animate-spin"
            : ""
        }`}
      />
      {status || "Pending"}
    </span>
  );
}

/* =========================================================
   REPORTS LIST
========================================================= */

function ScanRow({ scan }) {
  const summary = scan.summary || {};

  const score = useMemo(
    () => calculateSecurityScore(summary),
    [summary]
  );

  const scoreColor =
    score >= 80
      ? "#6DD6A8"
      : score >= 50
      ? "#F2C46D"
      : "#F0747A";

  const totalFindings =
    Number(summary.critical || 0) +
    Number(summary.high || 0) +
    Number(summary.medium || 0) +
    Number(summary.low || 0);

  return (
    <Link
      to={`/report/${scan._id}`}
      className="grid grid-cols-2 gap-3 border-b border-[#242C38] px-6 py-5 transition-colors last:border-b-0 hover:bg-[#171B25] sm:grid-cols-[1.6fr_120px_140px_90px_70px]"
    >
      <div className="col-span-2 min-w-0 sm:col-span-1">
        <p className="truncate text-[12px] font-medium text-[#DDE2EA]">
          {scan.project?.name ||
            scan.project?.repositoryName ||
            "Unknown project"}
        </p>

        <p className="mt-1 truncate font-mono text-[10px] text-[#707B8D]">
          {scan._id}
        </p>
      </div>

      <div className="flex items-center">
        <ScanStatusBadge status={scan.status} />
      </div>

      <div className="flex items-center font-mono text-[10px] text-[#AEB7C5]">
        {formatDate(scan.completedAt || scan.createdAt)}
      </div>

      <div className="flex items-center font-mono text-[11px]">
        {scan.status === "Completed" ? (
          <span style={{ color: scoreColor }}>{score}</span>
        ) : (
          <span className="text-[#555F70]">—</span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-[#AEB7C5]">
        {scan.status === "Completed" ? totalFindings : "—"}
        <ArrowUpRight className="h-3.5 w-3.5 text-[#565D6D]" />
      </div>
    </Link>
  );
}

function ReportsList({ user, onLogout }) {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadScans = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get("/scans");

        if (cancelled) return;

        setScans(response.data.data || []);
      } catch (requestError) {
        if (cancelled) return;

        setError(
          requestError?.response?.data?.message ||
            "Unable to load scan reports."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadScans();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0C10] text-[#F5F6F8]">
      <Sidebar user={user} onLogout={onLogout} />

      <MobileNav />

      <main className="xl:pl-[252px]">
        <div className="mx-auto max-w-[1400px] px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
          <div className="border-b border-[#20242E] pb-5">
            <p className="font-mono text-[9px] font-medium tracking-[0.2em] text-[#7180C5]">
              SECURITY REPORTS
            </p>

            <h1 className="mt-2 text-[26px] font-medium tracking-[-0.04em] text-[#F4F6F9]">
              Scan reports
            </h1>

            <p className="mt-2 max-w-[560px] text-[12px] leading-relaxed text-[#7F899A]">
              Every scan across your projects. Select a scan to
              view its full security report.
            </p>
          </div>

          <section className="mt-7 border border-[#28303D] bg-[#12151C]">
            {loading ? (
              <div className="animate-pulse divide-y divide-[#242C38]">
                {[0, 1, 2, 3].map((index) => (
                  <div key={index} className="h-[68px] bg-[#12151C]" />
                ))}
              </div>
            ) : error ? (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto grid h-10 w-10 place-items-center border border-[#F0747A]/25 bg-[#F0747A]/[0.07]">
                  <XCircle className="h-5 w-5 text-[#F0747A]" />
                </div>

                <p className="mt-4 font-mono text-[10px] tracking-[0.13em] text-[#9AA5B6]">
                  UNABLE TO LOAD REPORTS
                </p>

                <p className="mx-auto mt-2 max-w-md text-[11px] leading-relaxed text-[#687386]">
                  {error}
                </p>
              </div>
            ) : scans.length > 0 ? (
              <>
                <div className="hidden grid-cols-[1.6fr_120px_140px_90px_70px] gap-3 border-b border-[#28303D] bg-[#101319] px-6 py-3 sm:grid">
                  <span className="font-mono text-[9px] tracking-[0.11em] text-[#687286]">
                    PROJECT
                  </span>

                  <span className="font-mono text-[9px] tracking-[0.11em] text-[#687286]">
                    STATUS
                  </span>

                  <span className="font-mono text-[9px] tracking-[0.11em] text-[#687286]">
                    DATE
                  </span>

                  <span className="font-mono text-[9px] tracking-[0.11em] text-[#687286]">
                    SCORE
                  </span>

                  <span className="font-mono text-[9px] tracking-[0.11em] text-[#687286]">
                    FINDINGS
                  </span>
                </div>

                <div>
                  {scans.map((scan) => (
                    <ScanRow key={scan._id} scan={scan} />
                  ))}
                </div>
              </>
            ) : (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto grid h-10 w-10 place-items-center border border-[#303847] bg-[#171B25]">
                  <FileText className="h-5 w-5 text-[#8491A6]" />
                </div>

                <p className="mt-4 font-mono text-[10px] tracking-[0.13em] text-[#9AA5B6]">
                  NO SCANS YET
                </p>

                <p className="mx-auto mt-2 max-w-md text-[11px] leading-relaxed text-[#687386]">
                  Run a scan on one of your projects to see its
                  security report here.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

/* =========================================================
   SCORE CARD
========================================================= */

function ScoreCard({ score, assessment }) {
  const scoreColor =
    score >= 80
      ? "#6DD6A8"
      : score >= 50
      ? "#F2C46D"
      : "#F0747A";

  const AssessmentIcon = assessment.icon;

  return (
    <div className="relative overflow-hidden border border-[#303847] bg-[#12151C] p-7 print:break-inside-avoid print:border-[#D8DCE3] print:bg-white">
      <div className="absolute right-[-60px] top-[-80px] h-[220px] w-[220px] rounded-full bg-[#4C6FFF]/[0.035] blur-3xl print:hidden" />

      <div className="relative">
        <Label>SECURITY SCORE</Label>

        <div className="mt-5 flex items-end gap-2">
          <span
            className="font-mono text-[72px] font-medium leading-none tracking-[-0.1em]"
            style={{ color: scoreColor }}
          >
            {score}
          </span>

          <span className="mb-2 font-mono text-[16px] text-[#626D7F] print:text-[#555C6B]">
            / 100
          </span>
        </div>

        <div className="mt-5 h-1.5 w-full overflow-hidden bg-[#242B37] print:bg-[#E9EBEF]">
          <div
            className="h-full transition-all duration-700"
            style={{
              width: `${score}%`,
              backgroundColor: scoreColor,
            }}
          />
        </div>

        <div className="mt-5 flex items-start gap-3 border-t border-[#28303D] pt-5 print:border-[#D8DCE3]">
          <AssessmentIcon
            className="mt-0.5 h-4 w-4 shrink-0"
            style={{ color: assessment.color }}
          />

          <div>
            <p
              className="font-mono text-[11px] font-medium tracking-[0.1em]"
              style={{ color: assessment.color }}
            >
              {assessment.label}
            </p>

            <p className="mt-1.5 text-[11px] leading-relaxed text-[#7F899A] print:text-[#444C5C]">
              {assessment.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SEVERITY DISTRIBUTION
========================================================= */

function SeverityDistribution({ summary }) {
  const values = [
    {
      label: "Critical",
      value: summary.critical,
    },
    {
      label: "High",
      value: summary.high,
    },
    {
      label: "Medium",
      value: summary.medium,
    },
    {
      label: "Low",
      value: summary.low,
    },
  ];

  const total = Math.max(
    1,
    Number(summary.totalFindings || 0)
  );

  return (
    <div className="border border-[#28303D] bg-[#12151C] p-7 print:break-inside-avoid print:border-[#D8DCE3] print:bg-white">
      <div>
        <Label>SEVERITY DISTRIBUTION</Label>

        <h2 className="mt-1 text-[17px] font-medium text-[#E7EAF0] print:text-[#0F1117]">
          Findings by severity
        </h2>
      </div>

      <div className="mt-7 space-y-5">
        {values.map((item) => {
          const config =
            SEVERITY_CONFIG[item.label];

          const percentage =
            (item.value / total) * 100;

          return (
            <div key={item.label}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      backgroundColor:
                        config.color,
                    }}
                  />

                  <span className="font-mono text-[10px] text-[#B6BFCD] print:text-[#333B4A]">
                    {item.label.toUpperCase()}
                  </span>
                </div>

                <span className="font-mono text-[11px] text-[#E2E6ED] print:text-[#0F1117]">
                  {item.value}
                </span>
              </div>

              <div className="mt-2 h-1.5 overflow-hidden bg-[#242B37] print:bg-[#E9EBEF]">
                <div
                  className="h-full transition-all duration-700"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor:
                      config.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================
   FINDING ROW
========================================================= */

function FindingRow({ finding }) {
  const config =
    SEVERITY_CONFIG[finding.severity] ||
    SEVERITY_CONFIG.Low;

  const owasp = getOwaspCode(finding);
  const cwe = getCweCode(finding);

  return (
    <div className="grid gap-4 border-b border-[#242C38] px-6 py-5 last:border-b-0 lg:grid-cols-[105px_minmax(250px,1.5fr)_180px_75px_80px] print:break-inside-avoid print:grid-cols-[105px_minmax(250px,1.5fr)_180px_75px_80px] print:border-[#E3E6EB]">
      <div>
        <span
          className="font-mono text-[10px] font-medium tracking-[0.08em]"
          style={{ color: config.color }}
        >
          {finding.severity?.toUpperCase() ||
            "LOW"}
        </span>
      </div>

      <div className="min-w-0">
        <p className="truncate text-[12px] font-medium text-[#DDE2EA] print:overflow-visible print:whitespace-normal print:text-[#0F1117]">
          {readableTitle(finding.title)}
        </p>

        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[#707B8D] print:line-clamp-none print:text-[#333B4A]">
          {finding.description ||
            "No description available."}
        </p>
      </div>

      <div className="min-w-0 font-mono text-[10px] text-[#8D97A8] print:text-[#333B4A]">
        <p className="truncate print:overflow-visible print:whitespace-normal">
          {getFileLocation(finding)}
        </p>
      </div>

      <div>
        {owasp ? (
          <span className="border border-[#4C6FFF]/25 bg-[#4C6FFF]/[0.07] px-1.5 py-1 font-mono text-[9px] text-[#AAB8FF] print:border-[#B9C2E8] print:bg-white print:text-[#345]">
            {owasp}
          </span>
        ) : (
          <span className="font-mono text-[10px] text-[#555F70] print:text-[#8891A0]">
            —
          </span>
        )}
      </div>

      <div>
        {cwe ? (
          <span className="font-mono text-[9px] text-[#9DA7B8] print:text-[#333B4A]">
            {cwe}
          </span>
        ) : (
          <span className="font-mono text-[10px] text-[#555F70] print:text-[#8891A0]">
            —
          </span>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   MAIN REPORT
========================================================= */

function Report() {
  const { scanId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadReport = async () => {
      if (!scanId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await api.get(
          `/reports/${scanId}`
        );

        if (cancelled) return;

        setReport(response.data.data);
      } catch (requestError) {
        if (cancelled) return;

        setError(
          requestError?.response?.data?.message ||
            "Unable to load the security report."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadReport();

    return () => {
      cancelled = true;
    };
  }, [scanId]);

  const summary = useMemo(() => {
    return {
      ...EMPTY_SUMMARY,
      ...(report?.summary || {}),
    };
  }, [report]);

  const score = useMemo(
    () => calculateSecurityScore(summary),
    [summary]
  );

  const assessment = useMemo(
    () => getAssessment(score, summary),
    [score, summary]
  );

  const findings = report?.findings || [];
  const project = report?.project;
  const scan = report?.scan;

  const logoutAndGoHome = () => {
    logout();
    navigate("/login");
  };

  const handlePrint = () => {
    window.print();
  };

  /* =======================================================
     REPORTS LIST (no scan selected)
  ======================================================= */

  if (!scanId) {
    return (
      <ReportsList
        user={user}
        onLogout={logoutAndGoHome}
      />
    );
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0C10] text-[#F5F6F8]">
        <Sidebar
          user={user}
          onLogout={logoutAndGoHome}
        />

        <main className="xl:pl-[252px]">
          <div className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8 lg:px-10">
            <div className="animate-pulse">
              <div className="h-3 w-32 bg-[#202631]" />

              <div className="mt-5 h-10 w-72 bg-[#202631]" />

              <div className="mt-3 h-4 w-[420px] max-w-full bg-[#181D25]" />

              <div className="mt-10 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
                <div className="h-[350px] border border-[#28303D] bg-[#12151C]" />

                <div className="h-[350px] border border-[#28303D] bg-[#12151C]" />
              </div>

              <div className="mt-5 h-[300px] border border-[#28303D] bg-[#12151C]" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error || !report) {
    return (
      <div className="min-h-screen bg-[#0A0C10] text-[#F5F6F8]">
        <Sidebar
          user={user}
          onLogout={logoutAndGoHome}
        />

        <MobileNav />

        <main className="xl:pl-[252px]">
          <div className="flex min-h-[calc(100vh-56px)] items-center justify-center px-6 xl:min-h-screen">
            <div className="w-full max-w-[470px] border border-[#5A3439] bg-[#F0747A]/[0.035] p-8 text-center">
              <div className="mx-auto grid h-11 w-11 place-items-center border border-[#F0747A]/25 bg-[#F0747A]/[0.07]">
                <XCircle className="h-5 w-5 text-[#F0747A]" />
              </div>

              <p className="mt-5 font-mono text-[9px] tracking-[0.18em] text-[#7A8291]">
                REPORT_UNAVAILABLE
              </p>

              <h1 className="mt-2 text-[20px] font-medium tracking-[-0.025em]">
                Unable to load report
              </h1>

              <p className="mt-3 text-[12px] leading-relaxed text-[#8993A5]">
                {error ||
                  "The requested scan report could not be retrieved."}
              </p>

              <p className="mt-4 font-mono text-[10px] text-[#596476]">
                SCAN: {scanId || "UNKNOWN"}
              </p>

              <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
                <button
                  onClick={() => navigate(-1)}
                  className="inline-flex h-9 items-center justify-center gap-1.5 border border-[#303847] bg-[#101319] px-3 font-mono text-[10px] text-[#C1C8D4] hover:bg-[#1A2029]"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  GO BACK
                </button>

                <Link
                  to="/dashboard"
                  className="inline-flex h-9 items-center justify-center gap-1.5 border border-[#4C6FFF]/35 bg-[#4C6FFF]/10 px-3 font-mono text-[10px] text-[#B8C3FF] hover:bg-[#4C6FFF]/15"
                >
                  DASHBOARD
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* =======================================================
     REPORT
  ======================================================= */

  return (
    <div className="min-h-screen bg-[#0A0C10] text-[#F5F6F8] print:bg-white print:text-black">
      <Sidebar
        user={user}
        onLogout={logoutAndGoHome}
      />

      <MobileNav />

      <main className="xl:pl-[252px] print:pl-0">
        <div className="mx-auto max-w-[1400px] px-5 py-7 sm:px-8 lg:px-10 lg:py-9">

          {/* =================================================
              TOP BAR
          ================================================= */}

          <div className="flex flex-col gap-4 border-b border-[#20242E] pb-5 sm:flex-row sm:items-center sm:justify-between print:hidden">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex w-fit items-center gap-1.5 font-mono text-[10px] tracking-[0.08em] text-[#7E8899] transition-colors hover:text-[#E7EAF0]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              BACK
            </button>

            <div className="flex flex-wrap gap-2">
              {project?._id && (
                <Link
                  to={`/projects/${project._id}`}
                  className="inline-flex h-9 items-center gap-1.5 border border-[#303847] bg-[#101319] px-3 font-mono text-[10px] tracking-[0.07em] text-[#BEC6D3] transition-colors hover:bg-[#1A2029]"
                >
                  <FolderGit2 className="h-3.5 w-3.5" />
                  PROJECT
                </Link>
              )}

              <button
                onClick={handlePrint}
                className="inline-flex h-9 items-center gap-1.5 border border-[#4C6FFF]/35 bg-[#4C6FFF]/10 px-3 font-mono text-[10px] tracking-[0.07em] text-[#B6C1FF] transition-colors hover:bg-[#4C6FFF]/15"
              >
                <Download className="h-3.5 w-3.5" />
                EXPORT REPORT
              </button>
            </div>
          </div>

          {/* =================================================
              REPORT HEADER
          ================================================= */}

          <header className="relative overflow-hidden border-b border-[#28303D] py-8 print:border-[#D8DCE3]">
            <div className="pointer-events-none absolute right-[-100px] top-[-130px] h-[320px] w-[320px] rounded-full bg-[#4C6FFF]/[0.035] blur-3xl print:hidden" />

            <div className="relative">
              <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
                <div>
                  <p className="font-mono text-[9px] font-medium tracking-[0.2em] text-[#7180C5] print:text-[#4C5A9E]">
                    SECURITY ASSESSMENT
                  </p>

                  <h1 className="mt-2 text-[32px] font-medium tracking-[-0.05em] text-[#F4F6F9] print:text-[#0F1117]">
                    {project?.name ||
                      project?.repositoryName ||
                      "Security Report"}
                  </h1>

                  <p className="mt-2 max-w-[720px] text-[12px] leading-relaxed text-[#7F899A] print:text-[#444C5C]">
                    Security assessment generated from
                    scan{" "}
                    <span className="font-mono text-[#A4AEBE] print:text-[#333B4A]">
                      {scanId}
                    </span>
                    .
                  </p>
                </div>

                <div
                  className="inline-flex w-fit items-center gap-2 border px-3 py-2 font-mono text-[10px] tracking-[0.09em]"
                  style={{
                    color: assessment.color,
                    borderColor: `${assessment.color}33`,
                    backgroundColor: `${assessment.color}0B`,
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      backgroundColor:
                        assessment.color,
                    }}
                  />

                  {assessment.label}
                </div>
              </div>

              <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <Label>REPOSITORY</Label>

                  <div className="mt-1.5 flex items-center gap-1.5">
                    <GitBranch className="h-3.5 w-3.5 text-[#687286] print:text-[#555C6B]" />

                    <span className="truncate font-mono text-[11px] text-[#B7C0CE] print:text-[#1A1D24]">
                      {project?.repositoryName ||
                        project?.name ||
                        "—"}
                    </span>
                  </div>
                </div>

                <div>
                  <Label>BRANCH</Label>

                  <p className="mt-1.5 font-mono text-[11px] text-[#B7C0CE] print:text-[#1A1D24]">
                    {project?.defaultBranch ||
                      "main"}
                  </p>
                </div>

                <div>
                  <Label>SCAN DATE</Label>

                  <p className="mt-1.5 font-mono text-[11px] text-[#B7C0CE] print:text-[#1A1D24]">
                    {formatDateOnly(
                      scan?.completedAt ||
                        scan?.createdAt
                    )}
                  </p>
                </div>

                <div>
                  <Label>DURATION</Label>

                  <div className="mt-1.5 flex items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5 text-[#687286] print:text-[#555C6B]" />

                    <span className="font-mono text-[11px] text-[#B7C0CE] print:text-[#1A1D24]">
                      {formatDuration(
                        scan?.durationSeconds
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {project?.repositoryUrl && (
                <a
                  href={project.repositoryUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex items-center gap-1.5 font-mono text-[10px] text-[#8997D8] hover:text-[#C0C9FF] print:text-[#345]"
                >
                  <ExternalLink className="h-3 w-3" />
                  VIEW REPOSITORY
                </a>
              )}
            </div>
          </header>

          {/* =================================================
              EXECUTIVE SUMMARY
          ================================================= */}

          <section className="mt-7">
            <div className="mb-4">
              <Label>EXECUTIVE SUMMARY</Label>

              <h2 className="mt-1 text-[18px] font-medium tracking-[-0.025em] text-[#E9ECF2]">
                Scan security posture
              </h2>
            </div>

            <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
              <ScoreCard
                score={score}
                assessment={assessment}
              />

              <SeverityDistribution
                summary={summary}
              />
            </div>
          </section>

          {/* =================================================
              METRICS
          ================================================= */}

          <section className="mt-5 grid grid-cols-2 divide-x divide-y divide-[#28303D] border border-[#28303D] bg-[#12151C] sm:grid-cols-5 sm:divide-y-0 print:break-inside-avoid print:divide-[#D8DCE3] print:border-[#D8DCE3] print:bg-white">
            {[
              {
                label: "TOTAL",
                value: summary.totalFindings,
                color: "#D6DCE5",
              },
              {
                label: "CRITICAL",
                value: summary.critical,
                color: "#F0747A",
              },
              {
                label: "HIGH",
                value: summary.high,
                color: "#F28B68",
              },
              {
                label: "MEDIUM",
                value: summary.medium,
                color: "#F2C46D",
              },
              {
                label: "LOW",
                value: summary.low,
                color: "#7E98D8",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="px-5 py-4"
              >
                <Label>{item.label}</Label>

                <p
                  className="mt-1.5 font-mono text-[25px] tracking-[-0.06em]"
                  style={{ color: item.color }}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </section>

          {/* =================================================
              SCAN INFORMATION
          ================================================= */}

          <section className="mt-7 grid gap-5 lg:grid-cols-2">
            <div className="border border-[#28303D] bg-[#12151C] p-6 print:break-inside-avoid print:border-[#D8DCE3] print:bg-white">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-[#8491A6] print:text-[#555C6B]" />

                <Label>SCAN INFORMATION</Label>
              </div>

              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#242C38] pb-3 print:border-[#E3E6EB]">
                  <span className="text-[11px] text-[#707B8D] print:text-[#333B4A]">
                    Scan ID
                  </span>

                  <span className="max-w-[230px] truncate font-mono text-[10px] text-[#AEB7C5] print:text-[#1A1D24]">
                    {scan?._id || scanId}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-[#242C38] pb-3 print:border-[#E3E6EB]">
                  <span className="text-[11px] text-[#707B8D] print:text-[#333B4A]">
                    Status
                  </span>

                  <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-[#6DD6A8]">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {scan?.status ||
                      "Completed"}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-[#242C38] pb-3 print:border-[#E3E6EB]">
                  <span className="text-[11px] text-[#707B8D] print:text-[#333B4A]">
                    Started
                  </span>

                  <span className="font-mono text-[10px] text-[#AEB7C5] print:text-[#1A1D24]">
                    {formatDate(
                      scan?.startedAt ||
                        scan?.createdAt
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#707B8D] print:text-[#333B4A]">
                    Completed
                  </span>

                  <span className="font-mono text-[10px] text-[#AEB7C5] print:text-[#1A1D24]">
                    {formatDate(
                      scan?.completedAt
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="border border-[#28303D] bg-[#12151C] p-6 print:break-inside-avoid print:border-[#D8DCE3] print:bg-white">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#8491A6] print:text-[#555C6B]" />

                <Label>ASSESSMENT</Label>
              </div>

              <div className="mt-5 flex items-start gap-4">
                <div
                  className="grid h-10 w-10 shrink-0 place-items-center border"
                  style={{
                    borderColor:
                      `${assessment.color}33`,
                    backgroundColor:
                      `${assessment.color}0D`,
                  }}
                >
                  <assessment.icon
                    className="h-5 w-5"
                    style={{
                      color:
                        assessment.color,
                    }}
                  />
                </div>

                <div>
                  <h3
                    className="font-mono text-[12px] tracking-[0.08em]"
                    style={{
                      color:
                        assessment.color,
                    }}
                  >
                    {assessment.label}
                  </h3>

                  <p className="mt-2 text-[12px] leading-relaxed text-[#8A95A6] print:text-[#333B4A]">
                    {assessment.description}
                  </p>
                </div>
              </div>

              <div className="mt-6 border-t border-[#28303D] pt-5 print:border-[#D8DCE3]">
                <p className="text-[11px] leading-relaxed text-[#707B8D] print:text-[#333B4A]">
                  This report represents the security
                  state captured by this individual scan.
                  Later scans are treated as separate
                  assessments.
                </p>
              </div>
            </div>
          </section>

          {/* =================================================
              FINDINGS
          ================================================= */}

          <section className="mt-7 border border-[#28303D] bg-[#12151C] print:border-[#D8DCE3] print:bg-white">
            <div className="flex flex-col gap-3 border-b border-[#28303D] px-6 py-5 sm:flex-row sm:items-end sm:justify-between print:border-[#D8DCE3]">
              <div>
                <Label>SCAN FINDINGS</Label>

                <h2 className="mt-1 text-[18px] font-medium tracking-[-0.025em] text-[#E7EAF0] print:text-[#0F1117]">
                  Security findings
                </h2>

                <p className="mt-1 text-[11px] text-[#6F798B] print:text-[#333B4A]">
                  {summary.totalFindings} findings recorded in this scan.
                </p>
              </div>

              <Link
                to={`/findings?scanId=${scanId}`}
                className="inline-flex w-fit items-center gap-1.5 font-mono text-[10px] text-[#9DAAFF] transition-colors hover:text-[#CBD2FF] print:hidden"
              >
                OPEN FINDINGS
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>

            {findings.length > 0 ? (
              <>
                <div className="hidden grid-cols-[105px_minmax(250px,1.5fr)_180px_75px_80px] gap-4 border-b border-[#28303D] bg-[#101319] px-6 py-3 lg:grid print:grid print:border-[#D8DCE3] print:bg-white">
                  <span className="font-mono text-[9px] tracking-[0.11em] text-[#687286] print:text-[#555C6B]">
                    SEVERITY
                  </span>

                  <span className="font-mono text-[9px] tracking-[0.11em] text-[#687286] print:text-[#555C6B]">
                    FINDING
                  </span>

                  <span className="font-mono text-[9px] tracking-[0.11em] text-[#687286] print:text-[#555C6B]">
                    LOCATION
                  </span>

                  <span className="font-mono text-[9px] tracking-[0.11em] text-[#687286] print:text-[#555C6B]">
                    OWASP
                  </span>

                  <span className="font-mono text-[9px] tracking-[0.11em] text-[#687286] print:text-[#555C6B]">
                    CWE
                  </span>
                </div>

                <div>
                  {findings.map(
                    (finding, index) => (
                      <FindingRow
                        key={
                          finding._id ||
                          finding.id ||
                          `${finding.title}-${index}`
                        }
                        finding={finding}
                      />
                    )
                  )}
                </div>
              </>
            ) : (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto grid h-10 w-10 place-items-center border border-[#6DD6A8]/25 bg-[#6DD6A8]/[0.06]">
                  <CheckCircle2 className="h-5 w-5 text-[#6DD6A8]" />
                </div>

                <p className="mt-4 font-mono text-[10px] tracking-[0.13em] text-[#9AA5B6] print:text-[#333B4A]">
                  NO SECURITY FINDINGS
                </p>

                <p className="mx-auto mt-2 max-w-md text-[11px] leading-relaxed text-[#687386] print:text-[#444C5C]">
                  No findings were recorded during this scan.
                </p>
              </div>
            )}
          </section>

          {/* =================================================
              REMEDIATION
          ================================================= */}

          {summary.totalFindings > 0 && (
            <section className="mt-7 border border-[#4C6FFF]/20 bg-[#4C6FFF]/[0.035] p-6 print:break-inside-avoid print:border-[#D8DCE3] print:bg-white">
              <div className="flex items-start gap-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center border border-[#4C6FFF]/25 bg-[#4C6FFF]/[0.07] print:border-[#D8DCE3] print:bg-white">
                  <ShieldAlert className="h-5 w-5 text-[#AAB8FF] print:text-[#345]" />
                </div>

                <div>
                  <Label>REMEDIATION PRIORITY</Label>

                  <h2 className="mt-1 text-[17px] font-medium text-[#E4E8F0] print:text-[#0F1117]">
                    Address findings according to severity
                  </h2>

                  <p className="mt-2 max-w-3xl text-[12px] leading-relaxed text-[#8993A5] print:text-[#333B4A]">
                    Start with Critical and High findings,
                    then work through Medium and Low findings.
                    Individual remediation guidance is available
                    from the Findings workspace.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2 print:hidden">
                    {summary.critical > 0 && (
                      <Link
                        to="/findings?severity=Critical"
                        className="inline-flex h-8 items-center gap-1.5 border border-[#F0747A]/25 bg-[#F0747A]/[0.06] px-3 font-mono text-[9px] text-[#F59A9E]"
                      >
                        {summary.critical} CRITICAL
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    )}

                    {summary.high > 0 && (
                      <Link
                        to="/findings?severity=High"
                        className="inline-flex h-8 items-center gap-1.5 border border-[#F28B68]/25 bg-[#F28B68]/[0.06] px-3 font-mono text-[9px] text-[#F5A184]"
                      >
                        {summary.high} HIGH
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    )}

                    <Link
                      to="/findings"
                      className="inline-flex h-8 items-center gap-1.5 border border-[#303847] bg-[#101319] px-3 font-mono text-[9px] text-[#AAB4C4] hover:bg-[#1A2029]"
                    >
                      VIEW ALL FINDINGS
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* =================================================
              REPORT FOOTER
          ================================================= */}

          <footer className="mt-9 border-t border-[#20242E] pt-5 print:border-[#D8DCE3]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-[#596476] print:text-[#555C6B]" />

                <span className="font-mono text-[9px] tracking-[0.12em] text-[#596476] print:text-[#555C6B]">
                  GUARDRAIL SECURITY REPORT
                </span>
              </div>

              <div className="flex flex-wrap gap-4 font-mono text-[9px] text-[#596476] print:text-[#555C6B]">
                <span>
                  SCAN {scanId}
                </span>

                <span>
                  GENERATED {formatDate(new Date())}
                </span>
              </div>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default Report;