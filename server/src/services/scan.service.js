import Scan from "../models/scan.model.js";
import Project from "../models/project.model.js";
import ApiError from "../utils/ApiError.js";
import { cloneRepository } from "./githubClone.service.js";
import { runSemgrep } from "./semgrep.service.js";
import { createFindingsFromSemgrep } from "./finding.service.js";
import { cleanupRepository } from "./cleanup.service.js";

export const startScan = async (projectId, userId) => {
  // Verify the project belongs to the logged-in user
  const project = await Project.findOne({
    _id: projectId,
    owner: userId,
  });

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  let scan;
  let repositoryPath;

  try {
    project.status = "Scanning";
    await project.save();

    // Create scan
    scan = await Scan.create({
      project: project._id,
      status: "Scanning",
    });

    // Clone repository
    repositoryPath = await cloneRepository(
      project.repositoryUrl,
      scan._id
    );

    // Run Semgrep
    const semgrepResult = await runSemgrep(repositoryPath);

    // Save findings
    const { findingCount, summary } = await createFindingsFromSemgrep(
      project._id,
      scan._id,
      semgrepResult.results
    );

    scan.summary = summary;

    // Update scan status
    scan.status = "Completed";
    scan.completedAt = new Date();
    project.status = "Completed";

    await Promise.all([scan.save(), project.save()]);

    console.log("✅ Scan completed");
    console.log(`📌 Findings saved: ${findingCount}`);

    return scan;
  } catch (error) {
    project.status = "Failed";

    if (scan) {
      scan.status = "Failed";
      await Promise.all([scan.save(), project.save()]);
    } else {
      await project.save();
    }

    throw error;
  } finally {
    cleanupRepository(repositoryPath);
  }
};

export const getProjectScans = async (projectId, userId) => {
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

  if (scan.project.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "Unauthorized");
  }

  return scan;
};
