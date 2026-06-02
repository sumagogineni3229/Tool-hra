import mongoose from 'mongoose';

const TeamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  departmentId: {
    type: mongoose.Schema.Types.Mixed, // Supports ObjectId (ref Department) or String
    ref: 'Department',
    required: true,
  },
  managerId: {
    type: mongoose.Schema.Types.Mixed, // Supports ObjectId (ref User) or String
    ref: 'User',
    required: true,
  },
  members: [{
    type: mongoose.Schema.Types.Mixed, // Supports Array of ObjectIds (ref User) or Strings
    ref: 'User',
  }],
}, {
  timestamps: true,
});

// Force Mongoose to recompile the model if needed (hot reload safety)
if (mongoose.models.Team) {
  delete mongoose.models.Team;
}

export default mongoose.models.Team || mongoose.model('Team', TeamSchema);
