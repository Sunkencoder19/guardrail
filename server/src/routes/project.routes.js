import express from "express";
import {
  createProjectController,
  getAllProjectsController,
  getProjectByIdController,
  updateProjectController,
  deleteProjectController,
} from "../controllers/project.controller.js";

const router = express.Router();

router
  .route("/")
  .post(createProjectController)
  .get(getAllProjectsController);

router
  .route("/:id")
  .get(getProjectByIdController)
  .put(updateProjectController)
  .delete(deleteProjectController);

export default router;