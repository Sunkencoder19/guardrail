import express from "express";
import {
  createProjectController,
  getAllProjectsController,
  getProjectByIdController,
  updateProjectController,
  deleteProjectController,
} from "../controllers/project.controller.js";
import { validate } from "../middleware/validation.middleware.js";
import authenticate from "../middleware/auth.middleware.js";
import {
  createProjectSchema,
  updateProjectSchema,
} from "../validators/project.validator.js";

const router = express.Router();
router.use(authenticate);

router
  .route("/")
  .post(validate(createProjectSchema), createProjectController)
  .get(getAllProjectsController);

router
  .route("/:id")
  .get(getProjectByIdController)
  .put(validate(updateProjectSchema), updateProjectController)
  .delete(deleteProjectController);

export default router;