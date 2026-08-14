import express from "express";
import authenticate from "../middleware/auth.middleware.js";

import {
  createFindingController,
  getAllFindingsController,
  getScanFindingsController,
  getFindingByIdController,
} from "../controllers/finding.controller.js";

const router = express.Router();

router.use(authenticate);

// Global findings workspace
router.get("/", getAllFindingsController);

// Create a finding for a scan
router.post("/:scanId", createFindingController);

// Get all findings for a scan
router.get("/scan/:scanId", getScanFindingsController);

// Get a single finding
router.get("/:findingId", getFindingByIdController);

export default router;
