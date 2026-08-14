import "dotenv/config";

process.env.NODE_ENV = "test";

import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import User from "../models/user.model.js";
import Project from "../models/project.model.js";
import { claimProjectForScan } from "../services/scan.service.js";
import { connectTestDb, clearCollections, disconnectTestDb } from "./dbHelper.js";

beforeAll(async () => {
  await connectTestDb();
});

afterEach(async () => {
  await clearCollections("users", "projects", "scans", "findings");
});

afterAll(async () => {
  await disconnectTestDb();
});

// Uses claimProjectForScan directly (the atomic DB claim) rather than the
// full startScan pipeline, so this stays fast and network-free while still
// exercising exactly the race condition that was fixed.
describe("scan concurrency guard", () => {
  it("lets only one of two simultaneous scans claim the project", async () => {
    const user = await User.create({
      name: "Owner",
      email: "owner@example.com",
      password: "hashed-not-used-directly",
    });

    const project = await Project.create({
      name: "demo",
      repositoryUrl: "https://github.com/octocat/Hello-World",
      owner: user._id,
      status: "Completed",
    });

    const results = await Promise.allSettled([
      claimProjectForScan(project._id, user._id),
      claimProjectForScan(project._id, user._id),
    ]);

    const claimed = results.filter((result) => result.status === "fulfilled");
    const conflicts = results.filter(
      (result) => result.status === "rejected" && result.reason?.statusCode === 409
    );

    expect(claimed.length).toBe(1);
    expect(conflicts.length).toBe(1);
  });

  it("rejects claiming a project that is already scanning", async () => {
    const user = await User.create({
      name: "Owner",
      email: "owner2@example.com",
      password: "hashed-not-used-directly",
    });

    const project = await Project.create({
      name: "demo",
      repositoryUrl: "https://github.com/octocat/Hello-World",
      owner: user._id,
      status: "Scanning",
    });

    await expect(claimProjectForScan(project._id, user._id)).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it("rejects claiming a project owned by someone else", async () => {
    const owner = await User.create({
      name: "Owner",
      email: "owner3@example.com",
      password: "hashed-not-used-directly",
    });

    const intruder = await User.create({
      name: "Intruder",
      email: "intruder@example.com",
      password: "hashed-not-used-directly",
    });

    const project = await Project.create({
      name: "demo",
      repositoryUrl: "https://github.com/octocat/Hello-World",
      owner: owner._id,
      status: "Completed",
    });

    await expect(claimProjectForScan(project._id, intruder._id)).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
