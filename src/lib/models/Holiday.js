import mongoose from 'mongoose';

const HolidaySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    default: 'National Holiday',
  },
  scope: {
    type: String,
    default: 'Global',
  }
}, {
  timestamps: true,
});

export default mongoose.models.Holiday || mongoose.model('Holiday', HolidaySchema);
