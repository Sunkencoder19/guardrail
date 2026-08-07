import Project from "../models/project.model.js";
import Scan from "../models/scan.model.js";
import Finding from "../models/finding.model.js";

export const getDashboard = async (userId) => {
  // Total projects
  const totalProjects = await Project.countDocuments({
    owner: userId,
  });

  // All project IDs owned by the user
  const projects = await Project.find(
    { owner: userId },
    "_id"
  );

  const projectIds = projects.map((project) => project._id);

  // Total scans
  const totalScans = await Scan.countDocuments({
    project: {
      $in: projectIds,
    },
  });

  // Total findings
  const totalFindings = await Finding.countDocuments({
    project: {
      $in: projectIds,
    },
  });

  // Group findings by severity
  const severityStats = await Finding.aggregate([
    {
      $match: {
        project: {
          $in: projectIds,
        },
      },
    },
    {
      $group: {
        _id: "$severity",
        count: {
          $sum: 1,
        },
      },
    },
  ]);

  const severity = {
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0,
  };

  severityStats.forEach((item) => {
    severity[item._id] = item.count;
  });

  return {
    totalProjects,
    totalScans,
    totalFindings,

    critical: severity.Critical,
    high: severity.High,
    medium: severity.Medium,
    low: severity.Low,
  };
};