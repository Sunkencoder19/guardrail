import express from "express";
import authenticate from "../middleware/auth.middleware.js";
import { getDashboardController } from "../controllers/dashboard.controller.js";

const router = express.Router();

router.use(authenticate);

router.get("/", getDashboardController);

export default router;