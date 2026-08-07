import Scan from "../models/scan.model.js";
import Finding from "../models/finding.model.js";
import ApiError from "../utils/ApiError.js";

export const getReport = async (scanId, userId) => {
  // Verify scan exists
  const scan = await Scan.findById(scanId).populate("project");

  if (!scan) {
    throw new ApiError(404, "Scan not found");
  }

  // Verify ownership
  if (scan.project.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "Unauthorized");
  }

  // Load findings
  const findings = await Finding.find({
    scan: scan._id,
  }).sort({
    severity: 1,
  });

  // Generate summary
  const summary = {
    totalFindings: findings.length,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  findings.forEach((finding) => {
    switch (finding.severity) {
      case "Critical":
        summary.critical++;
        break;

      case "High":
        summary.high++;
        break;

      case "Medium":
        summary.medium++;
        break;

      case "Low":
        summary.low++;
        break;
    }
  });

  const duration = scan.completedAt
  ? Math.round(
      (scan.completedAt.getTime() - scan.startedAt.getTime()) / 1000
    )
  : null;

  return {
  scan: {
    ...scan.toObject(),
    durationseconds,
  },

  project: {
    _id: scan.project._id,
    name: scan.project.name,
    repositoryName: scan.project.repositoryName,
    defaultBranch: scan.project.defaultBranch,
  },

  summary,

  findings,
};
};