import Finding from "../models/finding.model.js";
import Scan from "../models/scan.model.js";
import ApiError from "../utils/ApiError.js";

export const createFinding = async (scanId, userId, findingData) => {
  // Verify scan exists
  const scan = await Scan.findById(scanId).populate("project");

  if (!scan) {
    throw new ApiError(404, "Scan not found");
  }

  // Verify ownership
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

export const getScanFindings = async (scanId, userId) => {
  const scan = await Scan.findById(scanId).populate("project");

  if (!scan) {
    throw new ApiError(404, "Scan not found");
  }

  if (scan.project.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "Unauthorized");
  }

  const findings = await Finding.find({
    scan: scanId,
  }).sort({
    severity: 1,
  });

  return findings;
};

export const getFindingById = async (findingId, userId) => {
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