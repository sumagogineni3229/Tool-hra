import mongoose from 'mongoose';

const TrainingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    default: 'General'
  },
  duration: {
    type: String,
    default: '1 hour'
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  materials: [{
    name: { type: String, required: true },
    type: { type: String, enum: ['PDF', 'PPT', 'Video', 'Document', 'Link'], required: true },
    url: { type: String, required: true }
  }]
}, {
  timestamps: true
});

if (mongoose.models.Training) {
  delete mongoose.models.Training;
}

export default mongoose.models.Training || mongoose.model('Training', TrainingSchema);
