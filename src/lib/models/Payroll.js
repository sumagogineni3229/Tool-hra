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
  employeeId: {
    type: String,
    default: '',
  },
  designation: {
    type: String,
    default: '',
  },
  department: {
    type: String,
    default: '',
  },
  band: {
    type: String,
    default: 'H1',
  },
  location: {
    type: String,
    default: 'Hyderabad, Madhapur',
  },
  dateOfJoining: {
    type: String,
    default: '',
  },
  daysWorked: {
    type: Number,
    default: 30,
  },
  period: {
    type: String,
    required: true,
  },
  uanNumber: {
    type: String,
    default: '',
  },
  panNumber: {
    type: String,
    default: '',
  },
  bankName: {
    type: String,
    default: '',
  },
  accountNumber: {
    type: String,
    default: '',
  },
  ifscCode: {
    type: String,
    default: '',
  },
  // Earnings
  basic: {
    type: Number,
    default: 0,
  },
  hra: {
    type: Number,
    default: 0,
  },
  medical: {
    type: Number,
    default: 0,
  },
  incentives: {
    type: Number,
    default: 0,
  },
  performancePay: {
    type: Number,
    default: 0,
  },
  bonus: {
    type: Number,
    default: 0,
  },
  gross: {
    type: Number,
    default: 0,
  },
  // Deductions
  pf: {
    type: Number,
    default: 0,
  },
  healthInsurance: {
    type: Number,
    default: 0,
  },
  lop: {
    type: Number,
    default: 0,
  },
  employeeSavings: {
    type: Number,
    default: 0,
  },
  adminTax: {
    type: Number,
    default: 0,
  },
  professionalTax: {
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

  netPayable: {
    type: Number,
    default: 0,
  },
  date: {
    type: String,
    default: () => new Date().toISOString().split('T')[0],
  },
}, {
  timestamps: true,
});

// Recompile if schema is stale from hot-reload
if (mongoose.models.Payroll) {
  delete mongoose.models.Payroll;
}

export default mongoose.models.Payroll || mongoose.model('Payroll', PayrollSchema);

