import {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from "../services/project.service.js";

export const createProjectController = async (req, res, next) => {
  try {
    const project = await createProject({
      ...req.body,
      owner: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllProjectsController = async (req, res, next) => {
  try {
    const projects = await getAllProjects(req.user._id);

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectByIdController = async (req, res, next) => {
  try {
    const project = await getProjectById(
      req.params.id,
      req.user._id
    );

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProjectController = async (req, res, next) => {
  try {
    const project = await updateProject(
      req.params.id,
      req.user._id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Project updated successfully",
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProjectController = async (req, res, next) => {
  try {
    await deleteProject(
      req.params.id,
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};