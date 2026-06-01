import mongoose from "mongoose";

const CalendarEventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    type: {
      type: String,
      enum: ["holiday", "event", "deadline"],
      default: "event",
    },
    description: {
      type: String,
      trim: true,
    },
    startTime: {
      type: String, // e.g., "09:00"
    },
    endTime: {
      type: String, // e.g., "10:30"
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isMandatory: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Evict stale model definition from Mongoose's globally cached object
if (mongoose.models.CalendarEvent && !mongoose.models.CalendarEvent.schema.paths.createdBy) {
  console.log("🧹 Stale CalendarEvent schema detected in hot-reload memory. Evicting from cache...");
  delete mongoose.models.CalendarEvent;
}

// Prevent re-compilation of model in dev mode
const CalendarEvent = mongoose.models.CalendarEvent || mongoose.model("CalendarEvent", CalendarEventSchema);

export default CalendarEvent;
