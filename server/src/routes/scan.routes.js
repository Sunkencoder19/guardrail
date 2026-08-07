import express from "express";
import authenticate from "../middleware/auth.middleware.js";

import {
  startScanController,
  getProjectScansController,
  getScanByIdController,
} from "../controllers/scan.controller.js";

const router = express.Router();

router.use(authenticate);

// Start a scan
router.post("/:projectId", startScanController);

// Get all scans for a project
router.get("/project/:projectId", getProjectScansController);

// Get one scan
router.get("/:scanId", getScanByIdController);

export default router;