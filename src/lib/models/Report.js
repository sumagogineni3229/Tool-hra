import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.Mixed,
      ref: "User",
    },
    employeeName: {
      type: String,
      required: true,
      trim: true,
    },
    employeeEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    employeeRole: {
      type: String,
      enum: ["Employee", "Intern"],
      required: true,
    },
    managerId: {
      type: mongoose.Schema.Types.Mixed,
      ref: "User",
    },
    managerEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    managerName: {
      type: String,
      trim: true,
    },
    projectId: {
      type: mongoose.Schema.Types.Mixed,
      ref: "Project",
    },
    projectName: {
      type: String,
      trim: true,
    },
    reportDate: {
      type: Date,
      required: true,
    },
    workCompleted: {
      type: String,
      required: true,
    },
    challenges: {
      type: String,
      default: "",
    },
    progressPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    tomorrowPlan: {
      type: String,
      default: "",
    },
    hoursWorked: {
      type: Number,
      min: 0,
      max: 24,
      default: 8,
    },
    attachment: {
      name: { type: String },
      url: { type: String }, // Base64 data URL
      size: { type: Number },
    },
    status: {
      type: String,
      enum: ["Draft", "Pending Review", "Approved", "Rejected"],
      default: "Draft",
    },
    managerFeedback: {
      type: String,
      default: "",
    },
    reviewedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Hot reload safety
if (mongoose.models.Report) {
  delete mongoose.models.Report;
}

export default mongoose.models.Report || mongoose.model("Report", ReportSchema);
