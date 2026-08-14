import Project from "../models/project.model.js";
import Finding from "../models/finding.model.js";
import Scan from "../models/scan.model.js";
import ApiError from "../utils/ApiError.js";
import { fetchRepository } from "./github.service.js";

const calculateSecurityScore = ({ critical, high, medium, low }) => {
  const score =
    100 - critical * 20 - high * 5 - medium * 2 - low * 0.5;

  return Math.max(0, Math.round(score));
};

const getSecurityStatus = (securityScore) => {
  if (securityScore >= 80) {
    return "SECURE";
  }

  if (securityScore >= 50) {
    return "WARNING";
  }

  return "AT_RISK";
};

const getSeverityCounts = async (scanId) => {
  const severityCounts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  const results = await Finding.aggregate([
    { $match: { scan: scanId } },
    { $group: { _id: "$severity", count: { $sum: 1 } } },
  ]);

  for (const result of results) {
    switch (result._id) {
      case "Critical":
        severityCounts.critical = result.count;
        break;
      case "High":
        severityCounts.high = result.count;
        break;
      case "Medium":
        severityCounts.medium = result.count;
        break;
      case "Low":
        severityCounts.low = result.count;
        break;
    }
  }

  return severityCounts;
};

const buildProjectSummary = async (project) => {
  const latestScan = await Scan.findOne({
    project: project._id,
    status: "Completed",
  })
    .sort({ completedAt: -1, createdAt: -1 })
    .select("_id createdAt completedAt")
    .lean();

  const severityCounts = latestScan
    ? await getSeverityCounts(latestScan._id)
    : { critical: 0, high: 0, medium: 0, low: 0 };

  const findingsCount =
    severityCounts.critical +
    severityCounts.high +
    severityCounts.medium +
    severityCounts.low;
  const securityScore = latestScan
    ? calculateSecurityScore(severityCounts)
    : null;

  return {
    id: project._id.toString(),
    name: project.name,
    repositoryName: project.repositoryName,
    repositoryUrl: project.repositoryUrl,
    description: project.description,
    defaultBranch: project.defaultBranch,
    visibility: project.visibility,
    stars: project.stars,
    forks: project.forks,
    language: project.language,
    status: project.status,
    securityStatus: securityScore == null ? null : getSecurityStatus(securityScore),
    securityScore,
    findingsCount,
    lastScanAt: latestScan?.completedAt || latestScan?.createdAt || null,
    latestScanId: latestScan?._id.toString() || null,
  };
};

const GITHUB_URL_PATTERN =
  /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/i;

export const createProject = async (projectData) => {
  if (!GITHUB_URL_PATTERN.test(projectData.repositoryUrl || "")) {
    throw new ApiError(
      400,
      "Enter a valid public GitHub repository URL."
    );
  }

  // Fetch repository details from GitHub
  const repository = await fetchRepository(projectData.repositoryUrl);

  // Store the repository URL rebuilt from GitHub's confirmed owner/repo
  // rather than the raw client-supplied string, so nothing beyond a
  // plain https://github.com/<owner>/<repo> URL can ever be persisted.
  const repositoryUrl = `https://github.com/${repository.owner}/${repository.repositoryName}`;

  // Create project with GitHub metadata
  const project = await Project.create({
    ...projectData,
    repositoryUrl,
    repositoryName: repository.repositoryName,
    description: repository.description,
    defaultBranch: repository.defaultBranch,
    visibility: repository.visibility,
    stars: repository.stars,
    forks: repository.forks,
    language: repository.language,
  });

  return project;
};

export const getAllProjects = async (userId) => {
  const projects = await Project.find({ owner: userId }).lean();

  return Promise.all(projects.map(buildProjectSummary));
};

export const getProjectById = async (id, userId) => {
  const project = await Project.findOne({
    _id: id,
    owner: userId,
  }).lean();

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  return buildProjectSummary(project);
};

export const updateProject = async (id, userId, projectData) => {
  // Prevent repository URL from being changed
  if (projectData.repositoryUrl) {
    throw new ApiError(
      400,
      "Repository URL cannot be updated. Create a new project instead."
    );
  }

  const project = await Project.findOneAndUpdate(
    {
      _id: id,
      owner: userId,
    },
    projectData,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  return project;
  };

export const deleteProject = async (id, userId) => {
  const project = await Project.findOne({
    _id: id,
    owner: userId,
  });

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  await Finding.deleteMany({ project: project._id });
  await Scan.deleteMany({ project: project._id });
  await project.deleteOne();

  return project;
};
