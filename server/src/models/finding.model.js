import mongoose from "mongoose";

const findingSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    scan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scan",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    severity: {
      type: String,
      enum: ["Critical", "High", "Medium", "Low"],
      required: true,
    },

    category: {
      type: String,
      required: true,
    },

    owasp: {
      type: [String],
      default: [],
    },

    cwe: {
      type: [String],
      default: [],
    },

    file: {
      type: String,
      default: null,
    },

    line: {
      type: Number,
      default: null,
    },

    recommendation: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Finding = mongoose.model("Finding", findingSchema);

export default Finding;
