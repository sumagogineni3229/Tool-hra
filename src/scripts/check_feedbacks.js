const mongoose = require('mongoose');
require('dotenv').config();

const FeedbackSchema = new mongoose.Schema({}, { strict: false, collection: 'feedbacks' });
const Feedback = mongoose.models.Feedback || mongoose.model('Feedback', FeedbackSchema);

async function check() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI is not defined");
    process.exit(1);
  }

  console.log("🔄 Connecting to MongoDB...");
  await mongoose.connect(uri);
  console.log("✅ Connected.");

  const feedbacks = await Feedback.find({});
  console.log(`\n📋 Feedback Tickets in DB (${feedbacks.length}):`);
  console.log("==================================================");
  feedbacks.forEach((f, idx) => {
    console.log(`🎟️ Ticket #${idx + 1}`);
    console.log(`   ID: ${f._id}`);
    console.log(`   User: ${f.userName} (${f.userEmail})`);
    console.log(`   Category: ${f.category}`);
    console.log(`   Message: ${f.message}`);
    console.log(`   Status: ${f.status}`);
    console.log(`   Anonymous: ${f.isAnonymous}`);
    console.log(`   Replies count: ${f.replies ? f.replies.length : 0}`);
    console.log("--------------------------------------------------");
  });

  await mongoose.disconnect();
  console.log("🔌 Disconnected.");
}

check().catch(err => {
  console.error("❌ Check failed:", err);
  process.exit(1);
});
