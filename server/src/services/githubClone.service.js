import simpleGit from "simple-git";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import ApiError from "../utils/ApiError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const git = simpleGit();

export const cloneRepository = async (repositoryUrl, scanId) => {
  const repoName = repositoryUrl.split("/").pop();

  const clonePath = path.join(
    __dirname,
    "../../temp",
    `${scanId}-${repoName}`
  );

  // Remove old directory if it exists
  if (fs.existsSync(clonePath)) {
    fs.rmSync(clonePath, {
      recursive: true,
      force: true,
    });
  }

  try {
    await git.clone(repositoryUrl, clonePath);

    return clonePath;
  } catch (error) {
    throw new ApiError(500, "Failed to clone repository");
  }
};