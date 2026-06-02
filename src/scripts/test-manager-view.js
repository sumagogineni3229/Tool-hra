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
  totalDuration: Number,
  isLate: Boolean,
  overtime: Number,
  notes: String,
  sessions: Array
});
const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);

const getLocalDateString = (dateObj) => {
  if (!dateObj) return "";
  const d = new Date(dateObj);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

async function test() {
  const uri = process.env.MONGODB_URI;
  await mongoose.connect(uri);
  console.log("Connected to MongoDB.");

  // Mock currentUser
  const currentUser = await User.findOne({ email: 'daniel.c@hraconnect.com' });
  console.log("currentUser:", { id: currentUser._id.toString(), email: currentUser.email });

  // Load datasets
  const users = await User.find({}).lean();
  console.log(`Loaded ${users.length} users.`);

  // Load teams populated
  const rawTeams = await Team.find({}).populate('managerId').populate('members').lean();
  const teams = rawTeams.map(t => {
    return {
      id: t._id.toString(),
      name: t.name,
      managerId: t.managerId ? {
        id: t.managerId._id?.toString(),
        email: t.managerId.email,
        name: t.managerId.name
      } : null,
      members: (t.members || []).map(m => ({
        id: m._id?.toString(),
        email: m.email,
        name: m.name
      }))
    };
  });
  console.log(`Loaded ${teams.length} teams.`);

  // Load attendance
  const queryStr = `?managerEmail=${encodeURIComponent(currentUser.email)}`;
  // Let's resolve the query directly like /api/attendance route
  const managedTeamsFromDB = await Team.find({ managerId: currentUser._id });
  const memberIds = managedTeamsFromDB.flatMap(t => t.members || []);
  const records = await Attendance.find({ userId: { $in: memberIds } }).lean();
  
  // Format like route.js
  const formattedAttendance = records.map(r => {
    const user = users.find(u => u._id.toString() === r.userId.toString());
    return {
      _id: r._id.toString(),
      date: r.date,
      status: r.status,
      userId: {
        _id: user ? user._id.toString() : '',
        name: user ? user.name : 'Unknown User'
      }
    };
  });
  console.log(`Loaded ${formattedAttendance.length} attendance records from API simulation.`);

  // React component pipeline simulations:
  
  // 1. managedTeams
  const currentUserId = currentUser._id.toString();
  const currentUserEmail = currentUser.email.toLowerCase().trim();
  const matchedManagedTeams = teams.filter(t => {
    const tMgrId = t.managerId?.id || t.managerId?._id || t.managerId;
    const tMgrEmail = t.managerId?.email?.toLowerCase().trim();
    
    return (
      tMgrId?.toString() === currentUserId?.toString() ||
      (tMgrEmail && currentUserEmail && tMgrEmail === currentUserEmail)
    );
  });
  console.log("1. managedTeams count:", matchedManagedTeams.length);

  // 2. resolvedMembers
  const selectedTeamId = "All";
  let targetTeams = matchedManagedTeams;
  const memberRefs = [];
  targetTeams.forEach(team => {
    if (Array.isArray(team.members)) {
      memberRefs.push(...team.members);
    }
  });

  const userMap = new Map();
  users.forEach((u) => {
    const id = u._id;
    if (id) userMap.set(id.toString(), u);
  });

  const uniqueMembers = new Map();
  memberRefs.forEach(m => {
    const mId = m.id || m._id || m;
    if (!mId) return;

    let details = m;
    if (typeof m !== "object") {
      details = userMap.get(mId.toString()) || { _id: mId };
    }
    uniqueMembers.set(mId.toString(), details);
  });
  const resolvedMembers = Array.from(uniqueMembers.values());
  console.log("2. resolvedMembers count:", resolvedMembers.length, resolvedMembers.map(m => m.name));

  // 3. squadMemberIds
  const squadMemberIds = new Set(resolvedMembers.map(m => (m.id || m._id || m).toString()));
  console.log("3. squadMemberIds:", Array.from(squadMemberIds));

  // 4. squadAttendance
  const squadAttendance = formattedAttendance.filter(r => {
    const attUserId = r.userId?._id || r.userId?.id || r.userId;
    return attUserId && squadMemberIds.has(attUserId.toString());
  });
  console.log("4. squadAttendance count:", squadAttendance.length);

  // 5. displayedRecords
  const searchQuery = "";
  const selectedStatus = "all";
  const selectedDate = "";
  const query = (searchQuery || "").toLowerCase();
  
  const displayedRecords = squadAttendance.filter(r => {
    const name = (r.userId?.name || "").toLowerCase();
    const empId = (r.userId?.employeeId || "").toLowerCase();
    const matchesSearch = name.includes(query) || empId.includes(query);
    const matchesStatus = selectedStatus === "all" || r.status?.toLowerCase() === selectedStatus.toLowerCase();
    const matchesDate = !selectedDate || (r.date && getLocalDateString(r.date) === selectedDate);
    return matchesSearch && matchesStatus && matchesDate;
  });
  console.log("5. displayedRecords count:", displayedRecords.length);

  await mongoose.disconnect();
}

test().catch(console.error);
