import mongoose from "mongoose";

const AnswerSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
});

const ApplicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    coverLetter: {
      type: String,
      default: "",
    },
    resume: {
      type: String,
      required: true,
      trim: true,
    },
    portfolio: {
      type: String,
      default: "",
      trim: true,
    },
    answers: {
      type: [AnswerSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["Applied", "Screening", "Shortlisted", "Interview", "Offered", "Rejected", "Selected"],
      default: "Applied",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

if (mongoose.models.Application) {
  delete mongoose.models.Application;
}

export default mongoose.models.Application || mongoose.model("Application", ApplicationSchema);
