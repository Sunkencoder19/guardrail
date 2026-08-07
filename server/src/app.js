import express from "express";
import indexRoutes from "./routes/index.routes.js";
import errorHandler from "./middleware/error.middleware.js";
import projectRoutes from "./routes/project.routes.js";
import userRoutes from "./routes/user.routes.js";
import scanRoutes from "./routes/scan.routes.js";

const app = express();

app.use(express.json());

app.use("/", indexRoutes);

app.use("/api/projects", projectRoutes);

app.use("/api/scans", scanRoutes);

app.use("/api/users", userRoutes);

app.use(errorHandler);

export default app;