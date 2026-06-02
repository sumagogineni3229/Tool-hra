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

const DepartmentSchema = new mongoose.Schema({
  name: String
});
const Department = mongoose.models.Department || mongoose.model('Department', DepartmentSchema);

const AttendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: Date,
  status: String,
  totalDuration: Number,
  isLate: Boolean,
  overtime: Number,
  notes: String,
  sessions: Array
});
const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);

async function run() {
  const uri = process.env.MONGODB_URI;
  await mongoose.connect(uri);
  console.log("Connected to MongoDB.");

  // 1. Find Daniel Cooper, John Doe, Jane Smith
  const daniel = await User.findOne({ email: 'daniel.c@hraconnect.com' });
  const john = await User.findOne({ email: 'employee@hraconnect.com' });
  const jane = await User.findOne({ email: 'intern@hraconnect.com' });

  if (!daniel || !john || !jane) {
    console.error("Missing seed users! Please run seed.js first.");
    process.exit(1);
  }

  // 2. Find or Create Engineering Department
  let engDept = await Department.findOne({ name: 'Engineering' });
  if (!engDept) {
    engDept = new Department({ name: 'Engineering' });
    await engDept.save();
    console.log("Created Engineering department.");
  }

  // 3. Find or Create Team managed by Daniel Cooper
  let team = await Team.findOne({ managerId: daniel._id });
  if (!team) {
    team = new Team({
      name: "Alpha Engineering",
      departmentId: engDept._id,
      managerId: daniel._id,
      members: [john._id, jane._id]
    });
    await team.save();
    console.log("Created 'Alpha Engineering' team managed by Daniel Cooper.");
  } else {
    // Update members
    team.members = [john._id, jane._id];
    await team.save();
    console.log("Updated team members.");
  }

  // 4. Create Mock Attendance logs
  // Today's Date normalized to midnight
  const now = new Date();
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Yesterday's Date normalized
  const yesterdayDate = new Date(todayDate);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);

  // 2 Days ago Date normalized
  const twoDaysAgoDate = new Date(todayDate);
  twoDaysAgoDate.setDate(twoDaysAgoDate.getDate() - 2);

  // 3 Days ago Date normalized
  const threeDaysAgoDate = new Date(todayDate);
  threeDaysAgoDate.setDate(threeDaysAgoDate.getDate() - 3);

  // Clean existing attendance for John and Jane to avoid duplicates
  await Attendance.deleteMany({ userId: { $in: [john._id, jane._id] } });
  console.log("Cleared existing mock attendance for John and Jane.");

  // Seed John Doe (Employee) - Today Active
  const johnToday = new Attendance({
    userId: john._id,
    date: todayDate,
    status: 'present',
    totalDuration: 0,
    isLate: false,
    overtime: 0,
    notes: 'On-time check-in via office network',
    sessions: [{
      checkIn: new Date(todayDate.getTime() + 9 * 60 * 60 * 1000 + 8 * 60 * 1000), // 9:08 AM
      checkOut: null,
      checkInImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      checkInLocation: {
        lat: 26.1445,
        lng: 91.7362,
        address: 'GS Road, Guwahati, Assam, India'
      }
    }]
  });
  await johnToday.save();

  // Seed Jane Smith (Intern) - Today Late/Completed
  const janeToday = new Attendance({
    userId: jane._id,
    date: todayDate,
    status: 'late',
    totalDuration: 8.5 * 60 * 60 * 1000,
    isLate: true,
    overtime: 0,
    notes: 'Late check-in due to transit delay',
    sessions: [{
      checkIn: new Date(todayDate.getTime() + 9 * 60 * 60 * 1000 + 42 * 60 * 1000), // 9:42 AM
      checkOut: new Date(todayDate.getTime() + 18 * 60 * 60 * 1000 + 12 * 60 * 1000), // 6:12 PM
      checkInImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
      checkOutImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
      checkInLocation: {
        lat: 26.1152,
        lng: 91.7085,
        address: 'Dispur, Guwahati, Assam, India'
      },
      checkOutLocation: {
        lat: 26.1445,
        lng: 91.7362,
        address: 'GS Road, Guwahati, Assam, India'
      }
    }]
  });
  await janeToday.save();

  // Seed John Doe - Yesterday
  const johnYesterday = new Attendance({
    userId: john._id,
    date: yesterdayDate,
    status: 'present',
    totalDuration: 9 * 60 * 60 * 1000,
    isLate: false,
    overtime: 0,
    notes: 'Regular shift completed',
    sessions: [{
      checkIn: new Date(yesterdayDate.getTime() + 8 * 60 * 60 * 1000 + 55 * 60 * 1000), // 8:55 AM
      checkOut: new Date(yesterdayDate.getTime() + 17 * 60 * 60 * 1000 + 55 * 60 * 1000), // 5:55 PM
      checkInImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      checkOutImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      checkInLocation: {
        lat: 26.1445,
        lng: 91.7362,
        address: 'GS Road, Guwahati, Assam, India'
      },
      checkOutLocation: {
        lat: 26.1445,
        lng: 91.7362,
        address: 'GS Road, Guwahati, Assam, India'
      }
    }]
  });
  await johnYesterday.save();

  // Seed Jane Smith - Yesterday
  const janeYesterday = new Attendance({
    userId: jane._id,
    date: yesterdayDate,
    status: 'present',
    totalDuration: 9 * 60 * 60 * 1000,
    isLate: false,
    overtime: 0,
    notes: 'Regular shift completed',
    sessions: [{
      checkIn: new Date(yesterdayDate.getTime() + 9 * 60 * 60 * 1000 + 5 * 60 * 1000), // 9:05 AM
      checkOut: new Date(yesterdayDate.getTime() + 18 * 60 * 60 * 1000 + 5 * 60 * 1000), // 6:05 PM
      checkInImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
      checkOutImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
      checkInLocation: {
        lat: 26.1152,
        lng: 91.7085,
        address: 'Dispur, Guwahati, Assam, India'
      },
      checkOutLocation: {
        lat: 26.1445,
        lng: 91.7362,
        address: 'GS Road, Guwahati, Assam, India'
      }
    }]
  });
  await janeYesterday.save();

  // Seed John Doe - 2 Days Ago
  const johnTwoDaysAgo = new Attendance({
    userId: john._id,
    date: twoDaysAgoDate,
    status: 'present',
    totalDuration: 9 * 60 * 60 * 1000,
    isLate: false,
    overtime: 0,
    notes: 'Regular shift completed',
    sessions: [{
      checkIn: new Date(twoDaysAgoDate.getTime() + 8 * 60 * 60 * 1000 + 50 * 60 * 1000),
      checkOut: new Date(twoDaysAgoDate.getTime() + 17 * 60 * 60 * 1000 + 50 * 60 * 1000),
      checkInImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      checkOutImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      checkInLocation: { lat: 26.1445, lng: 91.7362, address: 'GS Road, Guwahati, Assam, India' },
      checkOutLocation: { lat: 26.1445, lng: 91.7362, address: 'GS Road, Guwahati, Assam, India' }
    }]
  });
  await johnTwoDaysAgo.save();

  // Seed Jane Smith - 2 Days Ago
  const janeTwoDaysAgo = new Attendance({
    userId: jane._id,
    date: twoDaysAgoDate,
    status: 'present',
    totalDuration: 9.2 * 60 * 60 * 1000,
    isLate: false,
    overtime: 0.2 * 60 * 60 * 1000,
    notes: 'Overtime completed',
    sessions: [{
      checkIn: new Date(twoDaysAgoDate.getTime() + 8 * 60 * 60 * 1000 + 58 * 60 * 1000),
      checkOut: new Date(twoDaysAgoDate.getTime() + 18 * 60 * 60 * 1000 + 10 * 60 * 1000),
      checkInImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
      checkOutImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
      checkInLocation: { lat: 26.1152, lng: 91.7085, address: 'Dispur, Guwahati, Assam, India' },
      checkOutLocation: { lat: 26.1445, lng: 91.7362, address: 'GS Road, Guwahati, Assam, India' }
    }]
  });
  await janeTwoDaysAgo.save();

  console.log("Mock team & attendance seeding successfully completed.");
  await mongoose.disconnect();
}

run().catch(console.error);
