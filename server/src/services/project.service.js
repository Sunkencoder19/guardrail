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

const getSeverityCounts = async (projectId) => {
  const severityCounts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  const results = await Finding.aggregate([
    { $match: { project: projectId } },
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
  const [severityCounts, latestScan] = await Promise.all([
    getSeverityCounts(project._id),
    Scan.findOne({ project: project._id })
      .sort({ createdAt: -1 })
      .select("_id createdAt completedAt")
      .lean(),
  ]);

  const findingsCount =
    severityCounts.critical +
    severityCounts.high +
    severityCounts.medium +
    severityCounts.low;
  const securityScore = calculateSecurityScore(severityCounts);

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
    securityStatus: getSecurityStatus(securityScore),
    securityScore,
    findingsCount,
    lastScanAt: latestScan?.completedAt || latestScan?.createdAt || null,
    latestScanId: latestScan?._id.toString() || null,
  };
};

export const createProject = async (projectData) => {
  // Fetch repository details from GitHub
  const repository = await fetchRepository(projectData.repositoryUrl);

  // Create project with GitHub metadata
  const project = await Project.create({
    ...projectData,
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
