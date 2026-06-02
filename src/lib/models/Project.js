import mongoose from "mongoose";

const ProjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    assignedBy: {
      type: mongoose.Schema.Types.Mixed, // Supports ObjectId (ref User) or String
      ref: "User",
      required: true,
    },
    assignedByEmail: {
      type: String,
      lowercase: true,
      trim: true,
      required: true,
    },
    assignedMembers: [
      {
        user: {
          type: mongoose.Schema.Types.Mixed,
          ref: "User",
        },
        email: {
          type: String,
          lowercase: true,
          trim: true,
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        contributionProgress: {
          type: Number,
          default: 0,
          min: 0,
          max: 100,
        },
      },
    ],
    startDate: {
      type: Date,
    },
    dueDate: {
      type: Date,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Not Started", "In Progress", "On Hold", "Completed"],
      default: "Not Started",
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    attachedFiles: [
      {
        name: { type: String },
        url: { type: String }, // Base64 data URL
        size: { type: Number },
        uploadedAt: { type: Date, default: Date.now },
        uploadedBy: { type: String },
      },
    ],
    comments: [
      {
        author: { type: String },
        email: { type: String },
        text: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    deliverables: [
      {
        name: { type: String },
        url: { type: String }, // Base64 data URL
        size: { type: Number },
        submittedBy: { type: String },
        submittedAt: { type: Date, default: Date.now },
      },
    ],
    activityTimeline: [
      {
        text: { type: String },
        user: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Hot reload safety: Force recompilation of model if needed
if (mongoose.models.Project) {
  delete mongoose.models.Project;
}

export default mongoose.models.Project || mongoose.model("Project", ProjectSchema);
