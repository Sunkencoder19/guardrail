import Project from "../models/project.model.js";

export const createProject = async (projectData) => {
  const project = await Project.create(projectData);

  return project;
};

export const getAllProjects = async () => {
  const projects = await Project.find();

  return projects;
};

export const getProjectById = async (id) => {
  const project = await Project.findById(id);

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