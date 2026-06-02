import mongoose from 'mongoose';

const DepartmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

// Force Mongoose to recompile the model if needed (hot reload safety)
if (mongoose.models.Department) {
  delete mongoose.models.Department;
}

export default mongoose.models.Department || mongoose.model('Department', DepartmentSchema);
