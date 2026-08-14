import express from "express";
import authenticate from "../middleware/auth.middleware.js";
import { scanLimiter } from "../middleware/rateLimit.middleware.js";

import {
  startScanController,
  getProjectScansController,
  getAllScansController,
  getScanByIdController,
} from "../controllers/scan.controller.js";

const router = express.Router();

router.use(authenticate);

// Get all scans across the user's projects
router.get("/", getAllScansController);

// Get all scans for a project
router.get("/project/:projectId", getProjectScansController);

// Start a scan
router.post("/:projectId", scanLimiter, startScanController);

// Get one scan
router.get("/:scanId", getScanByIdController);

export default router;