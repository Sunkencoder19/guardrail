import Finding from "../models/finding.model.js";
import Scan from "../models/scan.model.js";
import ApiError from "../utils/ApiError.js";

const FALLBACK_FINDING_TITLE = "Semgrep Finding";

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

const normalizeLine = (line) => {
  const parsedLine = Number(line);

  return Number.isInteger(parsedLine) && parsedLine > 0
    ? parsedLine
    : null;
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
  severity: normalizeSeverity(result.extra?.severity),
  category: toStringValue(
    result.extra?.metadata?.category,
    "General"
  ),
  file: toStringValue(result.path, null),
  line: normalizeLine(result.start?.line),
  recommendation: toStringValue(
    result.extra?.metadata?.owasp,
    "Review the affected code and follow secure coding practices."
  ),
});

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

  const {
    severity,
    page = 1,
    limit = 20,
  } = query;

  const filter = {
    scan: scanId,
  };

  if (severity) {
    filter.severity = severity;
  }

  const totalFindings = await Finding.countDocuments(filter);

  const findings = await Finding.find(filter)
    .sort({
      severity: 1,
    })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  return {
    findings,
    pagination: {
      currentPage: Number(page),
      pageSize: Number(limit),
      totalItems: totalFindings,
      totalPages: Math.ceil(
        totalFindings / Number(limit)
      ),
      hasNextPage:
        Number(page) <
        Math.ceil(totalFindings / Number(limit)),
      hasPreviousPage: Number(page) > 1,
    },
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

  return findings.length;
};