import mongoose from "mongoose";

const InsuranceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    employeeEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    employeeName: {
      type: String,
      required: true,
      trim: true,
    },
    providerName: {
      type: String,
      required: true,
      trim: true,
    },
    policyNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    insuranceType: {
      type: String,
      required: true,
      enum: ["Health", "Life", "Accident", "Group Medical", "Dental", "Vision"],
    },
    coverageAmount: {
      type: Number,
      required: true,
    },
    premiumAmount: {
      type: Number,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    policyDocUrl: {
      type: String,
      default: "",
    },
    insuranceCardUrl: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
      default: "",
    },
    // Auto-computed status stored for fast querying
    status: {
      type: String,
      enum: ["Active", "Expiring Soon", "Expired", "Cancelled"],
      default: "Active",
    },
  },
  { timestamps: true }
);

// Pre-save hook to auto-compute status based on expiryDate
InsuranceSchema.pre("save", function () {
  const now = new Date();
  const expiry = new Date(this.expiryDate);
  const daysToExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

  if (this.status !== "Cancelled") {
    if (daysToExpiry <= 0) {
      this.status = "Expired";
    } else if (daysToExpiry <= 30) {
      this.status = "Expiring Soon";
    } else {
      this.status = "Active";
    }
  }
});

// Also run on findOneAndUpdate
InsuranceSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate();
  if (update.expiryDate || (update.$set && update.$set.expiryDate)) {
    const expiryDate = update.expiryDate || update.$set?.expiryDate;
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysToExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

    const newStatus =
      daysToExpiry <= 0
        ? "Expired"
        : daysToExpiry <= 30
        ? "Expiring Soon"
        : "Active";

    if (update.$set) {
      update.$set.status = newStatus;
    } else {
      update.status = newStatus;
    }
  }
});

// Force Mongoose to recompile the model to clear cached hooks in development
if (mongoose.models.Insurance) {
  delete mongoose.models.Insurance;
}

export default mongoose.models.Insurance ||
  mongoose.model("Insurance", InsuranceSchema);
