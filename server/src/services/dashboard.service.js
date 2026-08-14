import Project from "../models/project.model.js";
import Scan from "../models/scan.model.js";
import Finding from "../models/finding.model.js";
import { getAllProjects } from "./project.service.js";

const createEmptySeveritySummary = () => ({
  Critical: 0,
  High: 0,
  Medium: 0,
  Low: 0,
});

const calculateSecurityScore = (severity) => {
  const securityScore =
    100 -
    severity.Critical * 20 -
    severity.High * 5 -
    severity.Medium * 2 -
    severity.Low * 0.5;

  return Math.max(0, Math.round(securityScore));
};

const getStatusFromScore = (score) => {
  if (score == null) {
    return null;
  }

  if (score >= 80) {
    return "SECURE";
  }

  if (score >= 50) {
    return "WARNING";
  }

  return "AT_RISK";
};

const formatTrendDate = (dateValue) => {
  if (!dateValue) {
    return null;
  }

  return dateValue;
};

const normalizeSummary = (summary, fallbackSeverity) => {
  if (summary) {
    return {
      critical: summary.critical ?? 0,
      high: summary.high ?? 0,
      medium: summary.medium ?? 0,
      low: summary.low ?? 0,
      score:
        summary.score ??
        calculateSecurityScore({
          Critical: summary.critical ?? 0,
          High: summary.high ?? 0,
          Medium: summary.medium ?? 0,
          Low: summary.low ?? 0,
        }),
    };
  }

  return {
    critical: fallbackSeverity.Critical,
    high: fallbackSeverity.High,
    medium: fallbackSeverity.Medium,
    low: fallbackSeverity.Low,
    score: calculateSecurityScore(fallbackSeverity),
  };
};

export const getDashboard = async (userId) => {
  // -------------------------
  // Projects
  // -------------------------
  const projects = await Project.find({ owner: userId }).lean();

  // Project cards and dashboard repository rows must use the same source of
  // truth for scores, statuses, latest scans, and finding counts.
  const projectSummaries = await getAllProjects(userId);

  const projectIds = projects.map((project) => project._id);

  if (projectIds.length === 0) {
    return {
      securityScore: null,
      status: null,
      severityCounts: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      },
      lastScanAt: null,
      trend: [],
      repositories: [],
      recentActivity: [],
      criticalFindings: [],
    };
  }

  // -------------------------
  // Scans
  // -------------------------
  const scans = await Scan.find({
    project: { $in: projectIds },
  })
    .populate("project", "name")
    .sort({
      createdAt: 1,
    })
    .lean();

  const lastScan = scans[scans.length - 1] || null;

  const latestCompletedScanByProject = new Map();

  for (const scan of scans) {
    if (scan.status === "Completed") {
      latestCompletedScanByProject.set(
        String(scan.project?._id || scan.project),
        scan
      );
    }
  }

  const latestCompletedScanIds = Array.from(
    latestCompletedScanByProject.values(),
    (scan) => scan._id
  );

  const recentActivity = scans.slice(-5).reverse().map((scan) => ({
    id: scan._id,
    type: scan.status === "Failed" ? "scan_start" : "scan_done",
    message: `${scan.project.name} • ${scan.status}`,
    createdAt: scan.completedAt || scan.createdAt,
  }));

  const scanSeverityStats = await Finding.aggregate([
    {
      $match: {
        project: {
          $in: projectIds,
        },
      },
    },
    {
      $group: {
        _id: {
          scan: "$scan",
          severity: "$severity",
        },
        count: {
          $sum: 1,
        },
      },
    },
  ]);

  const scanSeverityMap = new Map();

  scanSeverityStats.forEach((item) => {
    const scanId = String(item._id.scan);

    if (!scanSeverityMap.has(scanId)) {
      scanSeverityMap.set(scanId, createEmptySeveritySummary());
    }

    const summary = scanSeverityMap.get(scanId);

    switch (item._id.severity) {
      case "Critical":
        summary.Critical += item.count;
        break;
      case "High":
        summary.High += item.count;
        break;
      case "Medium":
        summary.Medium += item.count;
        break;
      default:
        summary.Low += item.count;
        break;
    }
  });

  const trend = scans
    .filter((scan) => scan.status === "Completed")
    .map((scan) => {
      const summary = normalizeSummary(
        scan.summary,
        scanSeverityMap.get(String(scan._id)) || createEmptySeveritySummary()
      );

      return {
        date: formatTrendDate(scan.completedAt || scan.createdAt),
        score: summary.score,
      };
    })
    .filter((entry) => entry.date != null);

  // -------------------------
  // Findings
  // -------------------------
  const severityStats = await Finding.aggregate([
    {
      $match: {
        scan: {
          $in: latestCompletedScanIds,
        },
      },
    },
    {
      $group: {
        _id: "$severity",
        count: {
          $sum: 1,
        },
      },
    },
  ]);

  const severity = {
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0,
  };

  severityStats.forEach((item) => {
    severity[item._id] = item.count;
  });

  const repositorySummaries = projectSummaries.map((project) => ({
    id: project.id,
    name: project.name,
    repositoryUrl: project.repositoryUrl,
    branch: project.defaultBranch,
    language: project.language,
    securityScore: project.securityScore,
    lastScanAt: project.lastScanAt,
    status: project.securityStatus,
  }));

  const repositoryScores = repositorySummaries
    .map((repository) => repository.securityScore)
    .filter((score) => typeof score === "number");

  const overallScore = repositoryScores.length
    ? Math.round(
        repositoryScores.reduce((sum, score) => sum + score, 0) /
          repositoryScores.length
      )
    : null;

  const overallStatus = getStatusFromScore(overallScore);

  const findings = await Finding.find({
    scan: {
      $in: latestCompletedScanIds,
    },
  })
    .populate("project", "name repositoryName")
    .sort({
      createdAt: -1,
    })
    .limit(5);

  const criticalFindings = findings.map((finding) => ({
    id: finding._id,
    title: finding.title,
    severity: finding.severity,
    file: finding.file,
    line: finding.line,
    category: finding.category,
    projectName: finding.project?.name || finding.project?.repositoryName || "Repository",
  }));

  // -------------------------
  // Response
  // -------------------------
  return {
    securityScore: overallScore,

    status: overallStatus,

    severityCounts: {
      critical: severity.Critical,
      high: severity.High,
      medium: severity.Medium,
      low: severity.Low,
    },

    lastScanAt: lastScan?.completedAt || lastScan?.createdAt || null,

    trend,

    repositories: repositorySummaries,

    recentActivity,

    criticalFindings,
  };
};
