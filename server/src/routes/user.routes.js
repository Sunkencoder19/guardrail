import express from "express";
import { validate } from "../middleware/validation.middleware.js";
import {
  registerUserController,
  loginUserController,
  getCurrentUserController,
} from "../controllers/user.controller.js";

import {
  registerUserSchema,
  loginUserSchema,
} from "../validators/user.validator.js";

import authenticate from "../middleware/auth.middleware.js";

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

router.get("/me", authenticate, getCurrentUserController);

export default router;