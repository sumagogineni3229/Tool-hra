import mongoose from 'mongoose';

const PayrollSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  userName: {
    type: String,
    default: 'Staff Member',
  },
  period: {
    type: String,
    required: true,
  },
  basic: {
    type: Number,
    required: true,
  },
  hra: {
    type: Number,
    required: true,
  },
  allowances: {
    type: Number,
    default: 0,
  },
  deductions: {
    type: Number,
    default: 0,
  },
  net: {
    type: Number,
    required: true,
  },
  date: {
    type: String,
    default: () => new Date().toISOString().split('T')[0],
  },
}, {
  timestamps: true,
});

// Recompile if schema is stale from hot-reload
if (mongoose.models.Payroll && !mongoose.models.Payroll.schema.paths.userName) {
  delete mongoose.models.Payroll;
}

export default mongoose.models.Payroll || mongoose.model('Payroll', PayrollSchema);
