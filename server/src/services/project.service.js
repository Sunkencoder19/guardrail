import Project from "../models/project.model.js";
import ApiError from "../utils/ApiError.js";

export const createProject = async (projectData) => {
  const project = await Project.create(projectData);

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