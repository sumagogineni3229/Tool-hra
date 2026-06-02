const mongoose = require('mongoose');
require('dotenv').config();

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String,
  department: String
});
const User = mongoose.models.User || mongoose.model('User', UserSchema);

const TeamSchema = new mongoose.Schema({
  name: String,
  departmentId: mongoose.Schema.Types.ObjectId,
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});
const Team = mongoose.models.Team || mongoose.model('Team', TeamSchema);

const AttendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: Date,
  status: String,
  sessions: Array
});
const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);

async function check() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not defined");
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log("Connected to MongoDB.");

  const usersCount = await User.countDocuments();
  console.log(`Users count: ${usersCount}`);

  const users = await User.find({}, { name: 1, email: 1, role: 1 });
  console.log("Users:", users);

  const teamsCount = await Team.countDocuments();
  console.log(`Teams count: ${teamsCount}`);

  const teams = await Team.find({}).populate('managerId').populate('members');
  console.log("Teams:", JSON.stringify(teams, null, 2));

  const attendanceCount = await Attendance.countDocuments();
  console.log(`Attendance count: ${attendanceCount}`);

  const attendances = await Attendance.find({}).populate('userId');
  console.log("Attendances:", JSON.stringify(attendances, null, 2));

  await mongoose.disconnect();
}

check().catch(console.error);
