import mongoose from "mongoose";

const JobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      default: "Full-Time",
    },
    location: {
      type: String,
      default: "Remote",
    },
    description: {
      type: String,
      required: true,
    },
    requirements: {
      type: [String],
      default: [],
    },
    customQuestions: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["Open", "Closed"],
      default: "Open",
    },
    applicantCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

if (mongoose.models.Job) {
  delete mongoose.models.Job;
}

export default mongoose.models.Job || mongoose.model("Job", JobSchema);
