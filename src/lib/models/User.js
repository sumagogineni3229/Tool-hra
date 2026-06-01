import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
    enum: ['Admin', 'HR', 'Manager', 'Employee', 'Intern'],
  },
  department: {
    type: String,
    default: 'Operations',
  },
  permissions: {
    type: String,
    default: 'Read/Write',
  },
  status: {
    type: String,
    default: 'Active',
  },
  session: {
    type: String,
    default: 'Offline',
  },
  initials: {
    type: String,
  },
  badgeColor: {
    type: String,
  },
  profileCompleted: {
    type: Boolean,
    default: false,
  },
  verificationStatus: {
    type: String,
    default: 'Unsubmitted',
    enum: ['Unsubmitted', 'Pending', 'Approved', 'Rejected'],
  },
  phone: {
    type: String,
    default: '',
  },
  dob: {
    type: String,
    default: '',
  },
  address: {
    type: String,
    default: '',
  },
  emergencyContactName: {
    type: String,
    default: '',
  },
  emergencyContactPhone: {
    type: String,
    default: '',
  },
  aadhaarNumber: {
    type: String,
    default: '',
  },
  userPhoto: {
    type: String,
    default: '',
  },
  aadhaarPhoto: {
    type: String,
    default: '',
  },
  resetCode: {
    type: String,
    default: '',
  },
  resetCodeExpires: {
    type: Date,
  }
}, {
  timestamps: true,
});

// Force Mongoose to recompile the model if the cached version is stale (missing the new fields)
if (mongoose.models.User && (
  !mongoose.models.User.schema.paths.phone || 
  !mongoose.models.User.schema.paths.verificationStatus ||
  !mongoose.models.User.schema.paths.aadhaarNumber || 
  !mongoose.models.User.schema.paths.userPhoto ||
  !mongoose.models.User.schema.paths.aadhaarPhoto ||
  !mongoose.models.User.schema.paths.resetCode
)) {
  delete mongoose.models.User;
}

export default mongoose.models.User || mongoose.model('User', UserSchema);
