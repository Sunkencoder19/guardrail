import fs from "fs";

export const cleanupRepository = (repositoryPath) => {
  try {
    if (fs.existsSync(repositoryPath)) {
      fs.rmSync(repositoryPath, {
        recursive: true,
        force: true,
      });

      console.log("🗑️ Repository cleaned up");
    }
  } catch (error) {
    console.error("Cleanup failed:", error.message);
  }
};