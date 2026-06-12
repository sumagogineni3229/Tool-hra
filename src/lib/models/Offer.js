import mongoose from 'mongoose';

const OfferSchema = new mongoose.Schema({
  offerNumber: {
    type: String,
    required: true,
    unique: true
  },
  candidateName: {
    type: String,
    required: true
  },
  candidateId: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  position: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  reportingManager: {
    type: String,
    default: ''
  },

  employmentType: {
    type: String,
    default: 'Full Time'
  },
  gradeBand: {
    type: String,
    default: 'G1'
  },
  workLocation: {
    type: String,
    default: ''
  },
  workMode: {
    type: String,
    default: 'WFO'
  },
  joiningDate: {
    type: String,
    required: true
  },
  probationPeriod: {
    type: String,
    default: '6 Months'
  },
  noticePeriod: {
    type: String,
    default: '90 Days'
  },

  // Compensation Details
  baseSalary: {
    type: Number,
    default: 0
  },
  hra: {
    type: Number,
    default: 0
  },
  specialAllowance: {
    type: Number,
    default: 0
  },
  conveyanceAllowance: {
    type: Number,
    default: 0
  },
  medicalAllowance: {
    type: Number,
    default: 0
  },
  otherAllowances: {
    type: Number,
    default: 0
  },
  variablePay: {
    type: Number,
    default: 0
  },
  bonus: {
    type: Number,
    default: 0
  },
  pfContribution: {
    type: Number,
    default: 0
  },
  esiContribution: {
    type: Number,
    default: 0
  },
  gratuity: {
    type: Number,
    default: 0
  },
  fixedComp: {
    type: Number,
    default: 0
  },
  totalCTC: {
    type: Number,
    default: 0
  },

  // Internship Offer Fields
  internshipDuration: {
    type: String,
    default: ''
  },
  monthlyStipend: {
    type: Number,
    default: 0
  },
  trainingProgram: {
    type: String,
    default: ''
  },
  internshipCertificateEligibility: {
    type: String,
    default: 'Yes'
  },
  learningModules: {
    type: String,
    default: ''
  },
  mentorAssigned: {
    type: String,
    default: ''
  },

  // Company profile customization
  companyName: {
    type: String,
    default: 'HRA GROUPS PRIVATE LIMITED'
  },
  companyAddress: {
    type: String,
    default: 'Madhapur - Hyderabad'
  },
  companyContact: {
    type: String,
    default: '+91 9676272283'
  },
  companyWebsite: {
    type: String,
    default: 'www.hragroups.com'
  },
  companyLogo: {
    type: String,
    default: ''
  },

  // Working schedule
  workingDays: {
    type: String,
    default: 'Monday to Saturday'
  },
  workingHours: {
    type: String,
    default: '9:30 AM to 6:30 PM'
  },

  // Detailed points customized by HR
  rolesResponsibilities: {
    type: String,
    default: ''
  },
  trainingSessions: {
    type: String,
    default: ''
  },
  codeOfConduct: {
    type: String,
    default: ''
  },
  performanceEvaluation: {
    type: String,
    default: ''
  },

  // Offer Status and Workflow
  status: {
    type: String,
    enum: ['Draft', 'Under Review', 'Approved', 'Sent', 'Accepted', 'Rejected', 'Expired', 'Joined'],
    default: 'Draft'
  },
  templateName: {
    type: String,
    default: 'Employee Offer Letter'
  },
  createdBy: {
    type: String,
    required: true
  },
  approvedBy: {
    type: String,
    default: ''
  },
  history: [
    {
      status: String,
      updatedBy: String,
      updatedAt: {
        type: Date,
        default: Date.now
      },
      comments: String
    }
  ]
}, {
  timestamps: true
});

if (mongoose.models.Offer) {
  delete mongoose.models.Offer;
}

export default mongoose.models.Offer || mongoose.model('Offer', OfferSchema);
