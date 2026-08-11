import mongoose from "mongoose";

const scanSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Scanning", "Completed", "Failed"],
      default: "Pending",
    },

    startedAt: {
      type: Date,
      default: Date.now,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    summary: {
      critical: {
        type: Number,
        default: 0,
      },

      high: {
        type: Number,
        default: 0,
      },

      medium: {
        type: Number,
        default: 0,
      },

      low: {
        type: Number,
        default: 0,
      },

      score: {
        type: Number,
        default: 100,
      },
    },
  },
  {
    timestamps: true,
  }
);

const Scan = mongoose.model("Scan", scanSchema);

export default Scan;