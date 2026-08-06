import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(3),
  repositoryUrl: z.string().url(),
});