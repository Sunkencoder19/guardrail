import Scan from "../models/scan.model.js";
import Project from "../models/project.model.js";
import ApiError from "../utils/ApiError.js";

export const startScan = async (projectId, userId) => {
  // Verify the project belongs to the logged-in user
  const project = await Project.findOne({
    _id: projectId,
    owner: userId,
  });

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  // Create a new scan
  const scan = await Scan.create({
    project: project._id,
    status: "Pending",
  });

  return scan;
};

export const getProjectScans = async (projectId, userId) => {
  // Verify ownership
  const project = await Project.findOne({
    _id: projectId,
    owner: userId,
  });

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const scans = await Scan.find({
    project: projectId,
  }).sort({
    createdAt: -1,
  });

  return scans;
};

export const getScanById = async (scanId, userId) => {
  const scan = await Scan.findById(scanId).populate("project");

  if (!scan) {
    throw new ApiError(404, "Scan not found");
  }

  // Ensure the scan belongs to one of the user's projects
  if (scan.project.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "Unauthorized");
  }

  return scan;
};