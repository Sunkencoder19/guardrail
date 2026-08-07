import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(3, "Project name must be at least 3 characters"),
  repositoryUrl: z.string().url("Invalid GitHub repository URL"),
});

export const updateProjectSchema = z.object({
  name: z.string().min(3).optional(),
  status: z
    .enum(["Pending", "Scanning", "Completed", "Failed"])
    .optional(),
});