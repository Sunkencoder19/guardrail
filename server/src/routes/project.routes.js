import express from "express";
import {
  createProjectController,
  getAllProjectsController,
  getProjectByIdController,
  updateProjectController,
  deleteProjectController,
} from "../controllers/project.controller.js";
import { validate } from "../middleware/validation.middleware.js";
import { createProjectSchema } from "../validators/project.validator.js";
import authenticate from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(authenticate);

router
  .route("/")
  .post(validate(createProjectSchema), createProjectController)
  .get(getAllProjectsController);

router
  .route("/:id")
  .get(getProjectByIdController)
  .put(validate(createProjectSchema), updateProjectController)
  .delete(deleteProjectController);

export default router;