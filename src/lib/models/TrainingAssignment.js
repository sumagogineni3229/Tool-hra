import mongoose from 'mongoose';

const TrainingAssignmentSchema = new mongoose.Schema({
  trainingId: {
    type: mongoose.Schema.Types.Mixed, // Supports ObjectId (ref Training) or String for local mocks
    ref: 'Training',
    required: true
  },
  trainingName: {
    type: String,
    required: true
  },
  internId: {
    type: mongoose.Schema.Types.Mixed, // Supports ObjectId (ref User) or String for local mocks
    ref: 'User',
    required: true
  },
  internName: {
    type: String,
    required: true
  },
  internEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  dueDate: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Completed'],
    default: 'Not Started'
  },
  completionPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  completedAt: {
    type: Date
  },
  certificateUrl: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

if (mongoose.models.TrainingAssignment) {
  delete mongoose.models.TrainingAssignment;
}

export default mongoose.models.TrainingAssignment || mongoose.model('TrainingAssignment', TrainingAssignmentSchema);
