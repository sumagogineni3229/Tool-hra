import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    sessions: [
      {
        checkIn: { type: Date, required: true },
        checkOut: { type: Date },
        checkInImage: { type: String }, // Base64 or URL
        checkOutImage: { type: String }, // Base64 or URL
        checkInLocation: {
          lat: { type: Number },
          lng: { type: Number },
          address: { type: String }
        },
        checkOutLocation: {
          lat: { type: Number },
          lng: { type: Number },
          address: { type: String }
        },
      }
    ],
    totalDuration: {
      type: Number, // In milliseconds
      default: 0
    },
    status: {
      type: String,
      enum: ["present", "absent", "half-day", "late"],
      default: "present",
    },
    isLate: {
      type: Boolean,
      default: false
    },
    overtime: {
      type: Number, // In milliseconds
      default: 0
    },
    notes: {
      type: String
    }
  },
  { timestamps: true }
);

// Index for faster searching by user and date
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

// Force Mongoose to recompile if the cached model has the legacy userEmail field
if (mongoose.models.Attendance && !mongoose.models.Attendance.schema.paths.userId) {
  console.log("🧹 Stale Attendance schema detected in hot-reload memory. Evicting from cache...");
  delete mongoose.models.Attendance;
}

export default mongoose.models.Attendance || mongoose.model("Attendance", attendanceSchema);
