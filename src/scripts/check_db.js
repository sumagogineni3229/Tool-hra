const mongoose = require('mongoose');
require('dotenv').config();

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String,
  verificationStatus: String,
  profileCompleted: Boolean,
  phone: String,
  address: String
}, { collection: 'users' });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function check() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI is not defined in .env");
    process.exit(1);
  }

  console.log("🔄 Connecting to MongoDB...");
  await mongoose.connect(uri);
  console.log("✅ MongoDB connected.");

  const users = await User.find({});
  console.log(`\n📋 Registered Users in DB (${users.length}):`);
  console.log("==================================================");
  users.forEach(u => {
    console.log(`👤 Name: ${u.name}`);
    console.log(`   Email: ${u.email}`);
    console.log(`   Role: ${u.role}`);
    console.log(`   Verification Status: ${u.verificationStatus || 'Unsubmitted'}`);
    console.log(`   Profile Completed: ${u.profileCompleted || false}`);
    console.log(`   Phone: ${u.phone || 'N/A'}`);
    console.log("--------------------------------------------------");
  });

  await mongoose.disconnect();
  console.log("🔌 Disconnected.");
}

check().catch(err => {
  console.error("❌ Check failed:", err);
  process.exit(1);
});
