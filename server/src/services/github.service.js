import axios from "axios";
import ApiError from "../utils/ApiError.js";

export const fetchRepository = async (repositoryUrl) => {
  try {
    // Example:
    // https://github.com/fattesing/guardrail
    const parts = repositoryUrl.split("/");

    const owner = parts[3];
    const repo = parts[4];

    if (!owner || !repo) {
      throw new ApiError(400, "Invalid GitHub repository URL");
    }

    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        },
      }
    );

    const data = response.data;

    return {
      owner: data.owner.login,
      repositoryName: data.name,
      description: data.description,
      defaultBranch: data.default_branch,
      visibility: data.visibility,
      stars: data.stargazers_count,
      forks: data.forks_count,
      language: data.language,
    };
  } catch (error) {
    if (error.response?.status === 404) {
      throw new ApiError(404, "Repository not found");
    }

    throw new ApiError(500, "Unable to fetch repository details");
  }
};