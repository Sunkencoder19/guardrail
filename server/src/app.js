import express from "express";
import indexRoutes from "./routes/index.routes.js";
import errorHandler from "./middleware/error.middleware.js";

const app = express();

app.use(express.json());

app.use("/", indexRoutes);

app.use(errorHandler);

export default app;