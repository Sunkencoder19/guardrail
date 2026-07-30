import express from "express";
import indexRoutes from "./routes/index.routes.js";
import errorHandler from "./middleware/error.middleware.js";
import projectRoutes from "./routes/project.routes.js";

const app = express();

app.use(express.json());

app.use("/", indexRoutes);

app.use("/api/projects", projectRoutes);

app.use(errorHandler);

export default app;