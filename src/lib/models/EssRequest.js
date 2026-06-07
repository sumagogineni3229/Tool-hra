import mongoose from "mongoose";

const EssRequestSchema = new mongoose.Schema(
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
      required: true,
    },
    userName: {
      type: String,
      trim: true,
    },
    userRole: {
      type: String,
      trim: true,
    },
    requestType: {
      type: String,
      enum: ["WFH", "WFO"],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    // WFH-specific fields
    workLocation: {
      type: String,
      trim: true,
      default: "",
    },
    // WFO-specific fields
    officeLocation: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    hrComments: {
      type: String,
      default: "",
    },
    adminComments: {
      type: String,
      default: "",
    },
    managerComments: {
      type: String,
      default: "",
    },
    reviewedBy: {
      type: String,
      default: "",
    },
    reviewedByRole: {
      type: String,
      default: "",
    },
    reviewedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Prevent recompilation errors in dev mode
if (mongoose.models.EssRequest) {
  delete mongoose.models.EssRequest;
}

export default mongoose.model("EssRequest", EssRequestSchema);
