import Finding from "../models/finding.model.js";
import Scan from "../models/scan.model.js";
import Project from "../models/project.model.js";
import ApiError from "../utils/ApiError.js";

const SEVERITY_ORDER = ["Critical", "High", "Medium", "Low"];
const MAX_PAGE_SIZE = 100;

const getPagination = (query) => {
  const requestedPage = Number.parseInt(query.page, 10);
  const requestedLimit = Number.parseInt(query.limit, 10);

  return {
    page: Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    limit:
      Number.isInteger(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, MAX_PAGE_SIZE)
        : 20,
  };
};

const createPagination = (page, limit, totalItems) => {
  const totalPages = Math.ceil(totalItems / limit);

  return {
    currentPage: page,
    pageSize: limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const severitySortStages = (sort) => {
  if (sort === "newest") {
    return [{ $sort: { createdAt: -1 } }];
  }

  if (sort === "oldest") {
    return [{ $sort: { createdAt: 1 } }];
  }

  return [
    { $addFields: { severityPriority: { $indexOfArray: [SEVERITY_ORDER, "$severity"] } } },
    { $sort: { severityPriority: 1, createdAt: -1 } },
  ];
};

const FALLBACK_FINDING_TITLE = "Semgrep Finding";
const FALLBACK_RECOMMENDATION =
  "Review the affected code and follow secure coding practices.";
const RULE_REMEDIATIONS = [
  {
    pattern: /using[-_.]?http[-_.]?server/i,
    recommendation:
      "Replace the HTTP server with HTTPS and configure TLS certificates.",
  },
  {
    pattern: /express[-_.]?(cookie|session).*secure|cookie[-_.]?session[-_.]?no[-_.]?secure/i,
    recommendation:
      "Set the Secure attribute on the session cookie so it is only transmitted over HTTPS.",
  },
  {
    pattern: /(path|directory)[-_.]?traversal/i,
    recommendation:
      "Validate and constrain user-controlled paths before accessing the filesystem.",
  },
  {
    pattern: /sql[-_.]?injection/i,
    recommendation:
      "Use parameterized queries and validate untrusted input before it reaches the database.",
  },
  {
    pattern: /(hardcoded|hard[-_.]?coded)[-_.]?(secret|password|token|credential)/i,
    recommendation:
      "Remove the credential from source control, rotate it, and load it from a managed secret store.",
  },
  {
    pattern: /(tls|ssl).*(bypass|disable|verify[-_.]?false)/i,
    recommendation:
      "Enable certificate verification and use a trusted certificate authority for TLS connections.",
  },
];
const CRITICAL_CHECK_ID_PATTERNS = [
  /(^|[-_.])sql[-_.]?injection($|[-_.])/,
  /(^|[-_.])command[-_.]?injection($|[-_.])/,
  /(^|[-_.])remote[-_.]?code[-_.]?execution($|[-_.])/,
  /(^|[-_.])hardcoded[-_.]?secret($|[-_.])/,
  /(^|[-_.])hardcoded[-_.]?password($|[-_.])/,
  /(^|[-_.])hardcoded[-_.]?token($|[-_.])/,
  /(^|[-_.])jwt[-_.]?none[-_.]?algorithm($|[-_.])/,
  /(^|[-_.])deserialization($|[-_.])/
];

const CRITICAL_CWE_CODES = new Set([
  "cwe-77",  // Command Injection
  "cwe-78",  // OS Command Injection
  "cwe-89",  // SQL Injection
  "cwe-94",  // Code Injection
  "cwe-502", // Deserialization of Untrusted Data
  "cwe-798"  // Hardcoded Credentials
]);

const toStringValue = (value, fallback = "") => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }

  if (Array.isArray(value)) {
    const joined = value
      .filter((item) => item !== null && item !== undefined)
      .map((item) => String(item))
      .join(", ")
      .trim();

    return joined.length > 0 ? joined : fallback;
  }

  if (value === null || value === undefined) {
    return fallback;
  }

  const stringValue = String(value).trim();

  return stringValue.length > 0 ? stringValue : fallback;
};

const toStringArray = (value) => {
  const values = Array.isArray(value) ? value : [value];

  return values
    .flatMap((item) => (Array.isArray(item) ? item : [item]))
    .filter((item) => item !== null && item !== undefined)
    .map((item) => String(item).trim())
    .filter(Boolean);
};

const resolveRecommendation = (result) => {
  const semgrepRemediation = toStringValue(
    result?.extra?.fix ||
      result?.extra?.metadata?.remediation ||
      result?.extra?.metadata?.recommendation ||
      result?.extra?.metadata?.fix,
    ""
  );

  if (semgrepRemediation) {
    return semgrepRemediation;
  }

  const checkId = toStringValue(result?.check_id, "");
  const ruleRemediation = RULE_REMEDIATIONS.find((rule) =>
    rule.pattern.test(checkId)
  );

  return ruleRemediation?.recommendation || FALLBACK_RECOMMENDATION;
};

const normalizeSeverity = (severity) => {
  switch (toStringValue(severity, "Low").toUpperCase()) {
    case "CRITICAL":
      return "Critical";
    case "ERROR":
      return "High";
    case "WARNING":
      return "Medium";
    case "INFO":
      return "Low";
    default:
      return "Low";
  }
};

const isCriticalSemgrepResult = (result) => {
  const checkId = toStringValue(result?.check_id, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");

  if (CRITICAL_CHECK_ID_PATTERNS.some((pattern) => pattern.test(checkId))) {
    return true;
  }

  const cweText = toStringValue(result?.extra?.metadata?.cwe, "").toLowerCase();

  for (const cweCode of CRITICAL_CWE_CODES) {
    if (cweText.includes(cweCode)) {
      return true;
    }
  }

  return false;
};

const resolveFindingSeverity = (result) => {
  if (isCriticalSemgrepResult(result)) {
    return "Critical";
  }

  return normalizeSeverity(result?.extra?.severity);
};

const normalizeLine = (line) => {
  const parsedLine = Number(line);

  return Number.isInteger(parsedLine) && parsedLine > 0
    ? parsedLine
    : null;
};

const createEmptySeveritySummary = () => ({
  critical: 0,
  high: 0,
  medium: 0,
  low: 0,
  score: 100,
});

const calculateSecurityScore = (summary) => {
  const securityScore =
    100 -
    summary.critical * 20 -
    summary.high * 5 -
    summary.medium * 2 -
    summary.low * 0.5;

  return Math.max(0, Math.round(securityScore));
};

const mapSemgrepResultToFinding = (projectId, scanId, result) => ({
  project: projectId,
  scan: scanId,
  title: toStringValue(
    result.check_id,
    FALLBACK_FINDING_TITLE
  ),
  description: toStringValue(
    result.extra?.message,
    "No description available"
  ),
  severity: resolveFindingSeverity(result),
  category: toStringValue(
    result.extra?.metadata?.category,
    "General"
  ),
  owasp: toStringArray(result.extra?.metadata?.owasp),
  cwe: toStringArray(result.extra?.metadata?.cwe),
  file: toStringValue(result.path, null),
  line: normalizeLine(result.start?.line),
  recommendation: resolveRecommendation(result),
});

const buildSeveritySummary = (findings) => {
  const summary = createEmptySeveritySummary();

  for (const finding of findings) {
    switch (finding.severity) {
      case "Critical":
        summary.critical += 1;
        break;
      case "High":
        summary.high += 1;
        break;
      case "Medium":
        summary.medium += 1;
        break;
      default:
        summary.low += 1;
        break;
    }
  }

  summary.score = calculateSecurityScore(summary);

  return summary;
};

export const createFinding = async (
  scanId,
  userId,
  findingData
) => {
  const scan = await Scan.findById(scanId).populate("project");

  if (!scan) {
    throw new ApiError(404, "Scan not found");
  }

  if (scan.project.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "Unauthorized");
  }

  const finding = await Finding.create({
    ...findingData,
    project: scan.project._id,
    scan: scan._id,
  });

  return finding;
};

export const getScanFindings = async (
  scanId,
  userId,
  query
) => {
  const scan = await Scan.findById(scanId).populate("project");

  if (!scan) {
    throw new ApiError(404, "Scan not found");
  }

  if (scan.project.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "Unauthorized");
  }

  const { severity } = query;
  const { page, limit } = getPagination(query);

  const filter = {
    scan: scan._id,
  };

  if (severity) {
    filter.severity = severity;
  }

  const totalFindings = await Finding.countDocuments(filter);

  const findings = await Finding.aggregate([
    { $match: filter },
    ...severitySortStages("severity"),
    { $skip: (page - 1) * limit },
    { $limit: limit },
    { $project: { severityPriority: 0 } },
  ]);

  return {
    findings,
    pagination: createPagination(page, limit, totalFindings),
  };
};

export const getAllFindings = async (userId, query) => {
  const { severity, projectId, owasp, search, sort = "severity" } = query;
  const { page, limit } = getPagination(query);

  const userProjects = await Project.find({ owner: userId }).select("_id").lean();
  const userProjectIds = userProjects.map((project) => project._id);

  let selectedProjectId = null;

  if (projectId) {
    const project = await Project.findOne({ _id: projectId, owner: userId }).select("_id").lean();

    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    selectedProjectId = project._id;
  }

  const scopedProjectIds = selectedProjectId
    ? [selectedProjectId]
    : userProjectIds;

  const latestScanGroups = await Scan.aggregate([
    {
      $match: {
        project: { $in: scopedProjectIds },
        status: "Completed",
      },
    },
    { $sort: { project: 1, completedAt: -1, createdAt: -1 } },
    { $group: { _id: "$project", scanId: { $first: "$_id" } } },
  ]);

  const latestScanIds = latestScanGroups.map((group) => group.scanId);

  const filter = {
    scan: { $in: latestScanIds },
  };

  if (severity) {
    filter.severity = severity;
  }

  if (typeof owasp === "string" && owasp.trim()) {
    filter.owasp = {
      $regex: `^${escapeRegex(owasp.trim().slice(0, 100))}`,
      $options: "i",
    };
  }

  if (typeof search === "string" && search.trim()) {
    const pattern = escapeRegex(search.trim().slice(0, 100));
    filter.$or = [
      { title: { $regex: pattern, $options: "i" } },
      { description: { $regex: pattern, $options: "i" } },
      { category: { $regex: pattern, $options: "i" } },
      { file: { $regex: pattern, $options: "i" } },
    ];
  }

  const severityCountsFilter = { ...filter };
  delete severityCountsFilter.severity;

  const [totalFindings, findings, severityStats] = await Promise.all([
    Finding.countDocuments(filter),
    Finding.aggregate([
      { $match: filter },
      ...severitySortStages(sort),
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $lookup: {
          from: "projects",
          localField: "project",
          foreignField: "_id",
          as: "project",
        },
      },
      { $unwind: "$project" },
      {
        $lookup: {
          from: "scans",
          localField: "scan",
          foreignField: "_id",
          as: "scan",
        },
      },
      { $unwind: "$scan" },
      {
        $project: {
          _id: 0,
          id: { $toString: "$_id" },
          project: {
            id: { $toString: "$project._id" },
            name: "$project.name",
            repositoryName: "$project.repositoryName",
          },
          scan: {
            id: { $toString: "$scan._id" },
            status: "$scan.status",
          },
          title: 1,
          description: 1,
          severity: 1,
          category: 1,
          owasp: 1,
          cwe: 1,
          file: 1,
          line: 1,
          recommendation: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]),
    Finding.aggregate([
      { $match: severityCountsFilter },
      { $group: { _id: "$severity", count: { $sum: 1 } } },
    ]),
  ]);

  const severityCounts = { critical: 0, high: 0, medium: 0, low: 0 };

  for (const item of severityStats) {
    if (item._id === "Critical") severityCounts.critical = item.count;
    if (item._id === "High") severityCounts.high = item.count;
    if (item._id === "Medium") severityCounts.medium = item.count;
    if (item._id === "Low") severityCounts.low = item.count;
  }

  return {
    findings,
    pagination: createPagination(page, limit, totalFindings),
    severityCounts,
  };
};

export const getFindingById = async (
  findingId,
  userId
) => {
  const finding = await Finding.findById(findingId)
    .populate("project")
    .populate("scan");

  if (!finding) {
    throw new ApiError(404, "Finding not found");
  }

  if (finding.project.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "Unauthorized");
  }

  return finding;
};

export const createFindingsFromSemgrep = async (
  projectId,
  scanId,
  semgrepResults
) => {
  if (!Array.isArray(semgrepResults)) {
    throw new ApiError(
      500,
      "Semgrep results payload is not an array"
    );
  }

  const findings = [];
  const invalidFindings = [];

  for (const result of semgrepResults) {
    const finding = mapSemgrepResultToFinding(
      projectId,
      scanId,
      result
    );

    try {
      await new Finding(finding).validate();
      findings.push(finding);
    } catch (validationError) {
      invalidFindings.push({
        finding,
        errors: Object.values(validationError.errors).map(
          (error) => ({
            path: error.path,
            message: error.message,
          })
        ),
      });
    }
  }

  if (invalidFindings.length > 0) {
    console.warn(
      "Skipped invalid Semgrep findings:",
      invalidFindings.length
    );
  }

  if (findings.length > 0) {
    await Finding.insertMany(findings);
  }

  return {
    findingCount: findings.length,
    summary: buildSeveritySummary(findings),
  };
};
