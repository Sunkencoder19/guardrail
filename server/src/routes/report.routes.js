import express from "express";
import authenticate from "../middleware/auth.middleware.js";
import { getReportController } from "../controllers/report.controller.js";

const router = express.Router();

router.use(authenticate);

router.get("/:scanId", getReportController);

export default router;