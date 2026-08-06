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

export const getProjectById = async (id) => {
  const project = await Project.findById(id);

  if (!project) {
  throw new ApiError(404, "Project not found");
}

  return project;
};

export const updateProject = async (id, projectData) => {
  const project = await Project.findByIdAndUpdate(id, projectData, {
    new: true,
  });

  return project;
};

export const deleteProject = async (id) => {
  const project = await Project.findByIdAndDelete(id);

  return project;
};