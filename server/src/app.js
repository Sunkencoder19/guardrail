import express from "express";
import cors from "cors";
import helmet from "helmet";
import indexRoutes from "./routes/index.routes.js";
import errorHandler from "./middleware/error.middleware.js";
import { apiLimiter } from "./middleware/rateLimit.middleware.js";
import projectRoutes from "./routes/project.routes.js";
import userRoutes from "./routes/user.routes.js";
import scanRoutes from "./routes/scan.routes.js";
import findingRoutes from "./routes/finding.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import reportRoutes from "./routes/report.routes.js";

const app = express();

app.set("trust proxy", 1);

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim());

app.use(helmet());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());

app.use("/api", apiLimiter);

app.use("/", indexRoutes);

app.use("/api/projects", projectRoutes);

app.use("/api/scans", scanRoutes);

app.use("/api/users", userRoutes);

app.use("/api/findings", findingRoutes);

app.use("/api/dashboard", dashboardRoutes);

app.use("/api/reports", reportRoutes);

app.use(errorHandler);

export default app;