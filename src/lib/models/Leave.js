import mongoose from "mongoose";

const LeaveSchema = new mongoose.Schema(
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
    leaveType: {
      type: String,
      enum: ["Annual", "Sick", "Casual", "Maternity", "Paternity", "Unpaid"],
      required: true,
    },
    type: {
      type: String,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    daysCount: {
      type: Number,
      required: true,
    },
    duration: {
      type: String,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    adminComments: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Force recompilation of Leave model if the schema is cached in memory
if (mongoose.models.Leave && (
  !mongoose.models.Leave.schema.paths.userId ||
  !mongoose.models.Leave.schema.paths.leaveType ||
  !mongoose.models.Leave.schema.paths.adminComments
)) {
  delete mongoose.models.Leave;
}

export default mongoose.models.Leave || mongoose.model("Leave", LeaveSchema);
