import mongoose from "mongoose";

const ReplySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userRole: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const FeedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    userName: {
      type: String,
    },
    ticketId: {
      type: String,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    category: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    suggestions: {
      type: String,
      default: "",
    },
    ratings: {
      jobSatisfaction: { type: Number, default: 0 },
      workEnvironment: { type: Number, default: 0 },
      managementSupport: { type: Number, default: 0 },
      growthOpportunities: { type: Number, default: 0 },
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    sentiment: {
      type: String,
      enum: ["Positive", "Neutral", "Negative"],
      default: "Neutral",
    },
    status: {
      type: String,
      enum: ["Pending", "In Review", "Resolved"],
      default: "Pending",
    },
    isSeen: {
      type: Boolean,
      default: false,
    },
    escalationLevel: {
      type: Number,
      default: 0,
    },
    allowHRContact: {
      type: Boolean,
      default: false,
    },
    employeeDetails: {
      name: String,
      employeeId: String,
      department: String,
      role: String,
      workLocation: String,
    },
    attachments: [
      {
        name: String,
        type: String,
        url: String,
      }
    ],
    replies: [ReplySchema],
  },
  { timestamps: true }
);

// Force recompilation of Feedback model if the schema is cached in memory
if (mongoose.models.Feedback) {
  delete mongoose.models.Feedback;
}

export default mongoose.models.Feedback || mongoose.model("Feedback", FeedbackSchema);
