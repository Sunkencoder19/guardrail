import { execFile } from "child_process";
import util from "util";
import ApiError from "../utils/ApiError.js";

const execFilePromise = util.promisify(execFile);

export const runSemgrep = async (repositoryPath) => {
  try {
    console.log("========================================");
    console.log("Running Semgrep...");
    console.log("Repository:", repositoryPath);

    const args = ["scan", "--config", "auto", "--json", repositoryPath];

    const { stdout } = await execFilePromise("semgrep", args, {
      maxBuffer: 20 * 1024 * 1024,
      timeout: 5 * 60 * 1000,
      killSignal: "SIGKILL",
    });

    const result = JSON.parse(stdout);

    console.log("========================================");
    console.log("Semgrep Results:", result.results.length);

    if (result.results.length > 0) {
      console.log("First Finding:");
      console.log(JSON.stringify(result.results[0], null, 2));
    } else {
      console.log("No findings detected.");
    }

    console.log("========================================");

    return result;
  } catch (error) {
    console.log("========================================");
    console.log("Semgrep execution failed");

    if (error.stdout) {
      console.log("STDOUT:");
      console.log(error.stdout);
    }

    if (error.stderr) {
      console.log("STDERR:");
      console.log(error.stderr);
    }

    console.log("========================================");

    throw new ApiError(500, "Semgrep scan failed");
  }
};