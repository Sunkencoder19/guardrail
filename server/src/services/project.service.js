import Project from "../models/project.model.js";
import ApiError from "../utils/ApiError.js";
import { fetchRepository } from "./github.service.js";

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
  const projects = await Project.find({
    owner: userId,
  });

  return projects;
};

export const getProjectById = async (id, userId) => {
  const project = await Project.findOne({
    _id: id,
    owner: userId,
  });

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  return project;
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
  const project = await Project.findOneAndDelete({
    _id: id,
    owner: userId,
  });

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  return project;
};