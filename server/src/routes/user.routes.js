import express from "express";
import { validate } from "../middleware/validation.middleware.js";
import {
  registerUserController,
  loginUserController,
} from "../controllers/user.controller.js";

import {
  registerUserSchema,
  loginUserSchema,
} from "../validators/user.validator.js";

const router = express.Router();

router.post(
  "/register",
  validate(registerUserSchema),
  registerUserController
);

router.post(
  "/login",
  validate(loginUserSchema),
  loginUserController
);

export default router;