import mongoose from "mongoose";

const PerformanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userRole: {
      type: String,
      required: true,
      enum: ["Employee", "Intern"],
    },
    overallScore: {
      type: Number,
      default: 0,
    },
    productivity: {
      type: Number,
      default: 0,
    },
    qualityOfWork: {
      type: Number,
      default: 0,
    },
    collaboration: {
      type: Number,
      default: 0,
    },
    punctuality: {
      type: Number,
      default: 0,
    },
    managerFeedback: {
      type: String,
      default: "",
    },
    reviewedBy: {
      type: String,
      default: "HR Specialist",
    },
    reviewedByRole: {
      type: String,
      default: "HR Manager",
    },
    reviewDate: {
      type: Date,
      default: Date.now,
    },
    quarter: {
      type: String,
      default: "Q2 2026",
    }
  },
  { timestamps: true }
);

// Prevent hot-reload caching model compilation issues
if (mongoose.models.Performance) {
  delete mongoose.models.Performance;
}

export default mongoose.models.Performance || mongoose.model("Performance", PerformanceSchema);
