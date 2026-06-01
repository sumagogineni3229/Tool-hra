const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const DEFAULT_SEEDS = [
  {
    name: "HRA Admin",
    email: "hragroups@gmail.com",
    password: "Hraconnect@7890",
    role: "Admin",
    department: "Operations",
    permissions: "Full Access",
    status: "Active",
    session: "Offline",
    initials: "HA",
    badgeColor: "bg-slate-900 text-white"
  },
  {
    name: "Sarah Jenkins",
    email: "sarah.j@hraconnect.com",
    password: "password123",
    role: "HR",
    department: "Human Resources",
    permissions: "Read/Write",
    status: "Active",
    session: "Offline",
    initials: "SJ",
    badgeColor: "bg-indigo-600 text-white"
  },
  {
    name: "Daniel Cooper",
    email: "daniel.c@hraconnect.com",
    password: "password123",
    role: "Manager",
    department: "Engineering",
    permissions: "Read/Write",
    status: "Active",
    session: "Offline",
    initials: "DC",
    badgeColor: "bg-emerald-600 text-white"
  },
  {
    name: "John Doe",
    email: "employee@hraconnect.com",
    password: "password123",
    role: "Employee",
    department: "Engineering",
    permissions: "Read/Write",
    status: "Active",
    session: "Offline",
    initials: "JD",
    badgeColor: "bg-rose-600 text-white"
  },
  {
    name: "Jane Smith",
    email: "intern@hraconnect.com",
    password: "password123",
    role: "Intern",
    department: "Design",
    permissions: "Read Only",
    status: "Active",
    session: "Offline",
    initials: "JS",
    badgeColor: "bg-amber-600 text-white"
  },
  {
    name: "Elena Rostova",
    email: "elena.r@hraconnect.com",
    password: "password123",
    role: "HR",
    department: "Human Resources",
    permissions: "Read Only",
    status: "Suspended",
    session: "Offline",
    initials: "ER",
    badgeColor: "bg-purple-600 text-white"
  }
];

// Define Inline Schema to avoid Next.js alias resolve issues in pure Node script
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['Admin', 'HR', 'Manager', 'Employee', 'Intern'] },
  department: { type: String, default: 'Operations' },
  permissions: { type: String, default: 'Read/Write' },
  status: { type: String, default: 'Active' },
  session: { type: String, default: 'Offline' },
  initials: { type: String },
  badgeColor: { type: String }
}, {
  timestamps: true,
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ Error: MONGODB_URI is not defined in .env");
    process.exit(1);
  }

  console.log("🔄 Connecting to MongoDB for seeding...");
  await mongoose.connect(uri);
  console.log("✅ MongoDB connected successfully.");

  for (const seedUser of DEFAULT_SEEDS) {
    const existing = await User.findOne({ email: seedUser.email.toLowerCase().trim() });
    if (existing) {
      console.log(`ℹ️ User ${seedUser.email} already exists. Skipping.`);
      continue;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(seedUser.password, salt);

    const newUser = new User({
      ...seedUser,
      password: hashedPassword
    });

    await newUser.save();
    console.log(`✨ Created seed user: ${seedUser.name} (${seedUser.role}) - ${seedUser.email}`);
  }

  console.log("🎉 Seeding complete!");
  await mongoose.disconnect();
  console.log("🔌 Disconnected from MongoDB.");
}

seed().catch(err => {
  console.error("❌ Seeding failed with error:", err);
  process.exit(1);
});
