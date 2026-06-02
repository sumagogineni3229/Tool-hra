import mongoose from "mongoose";

const AnnouncementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["General", "Event", "Policy", "Payroll", "Urgent"],
      default: "General",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    createdByName: {
      type: String,
      required: true,
    },
    createdByEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    createdByRole: {
      type: String,
      required: true,
    },
    targetRole: {
      type: String,
      enum: ["All", "Admin", "HR", "Manager", "Employee", "Intern"],
      default: "All",
    },
    pinned: {
      type: Boolean,
      default: false,
    },
    // Optional: target a specific user by email (used for report notifications)
    targetUserEmail: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

if (mongoose.models.Announcement) {
  delete mongoose.models.Announcement;
}

export default mongoose.models.Announcement || mongoose.model("Announcement", AnnouncementSchema);
