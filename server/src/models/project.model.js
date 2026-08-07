import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    repositoryUrl: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Scanning", "Completed", "Failed"],
      default: "Pending",
    },

    // GitHub Metadata
    repositoryName: {
      type: String,
    },

    description: {
      type: String,
      default: null,
    },

    defaultBranch: {
      type: String,
      default: "main",
    },

    visibility: {
      type: String,
    },

    stars: {
      type: Number,
      default: 0,
    },

    forks: {
      type: Number,
      default: 0,
    },

    language: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Project = mongoose.model("Project", projectSchema);

export default Project;