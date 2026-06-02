import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema(
  {
    title: {
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
    },
    assignedTo: {
      type: String, // "all" or a specific user's email, lowercase
      lowercase: true,
      trim: true,
      default: "all",
    },
    assigneeRole: {
      type: String, // "All", "Employee", "Intern"
      enum: ["All", "Employee", "Intern"],
      default: "All",
    },
    dueDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed"],
      default: "pending",
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    completionNotes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Hot reload safety: Force recompilation of model if needed
if (mongoose.models.Task) {
  delete mongoose.models.Task;
}

export default mongoose.models.Task || mongoose.model("Task", TaskSchema);
