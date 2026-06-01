const mongoose = require('mongoose');
require('dotenv').config();

const FeedbackSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  userEmail: {
    type: String,
    lowercase: true,
    trim: true,
  },
  userName: {
    type: String,
  },
  category: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 5,
  },
  status: {
    type: String,
    enum: ["Under Review", "Acknowledged", "Resolved"],
    default: "Under Review",
  },
  isAnonymous: {
    type: Boolean,
    default: false,
  },
  replies: Array
}, { collection: 'feedbacks' });

const Feedback = mongoose.models.Feedback || mongoose.model("Feedback", FeedbackSchema);

async function run() {
  const uri = process.env.MONGODB_URI;
  await mongoose.connect(uri);
  console.log("✅ Connected to MongoDB.");
  
  const UserSchema = new mongoose.Schema({}, { strict: false, collection: "users" });
  const User = mongoose.models.User || mongoose.model("User", UserSchema);
  
  const user = await User.findOne({ email: "employee@hraconnect.com" });
  if (!user) {
    console.error("❌ John Doe not found in MongoDB!");
    process.exit(1);
  }
  console.log("👤 Found User:", user.name, "ID:", user._id);
  
  try {
    const ticket = await Feedback.create({
      userId: user._id,
      userEmail: user.email,
      userName: user.name,
      category: "Workspace Facilities",
      message: "Test feedback from direct script",
      rating: 5,
      isAnonymous: false,
      status: "Under Review",
      replies: []
    });
    console.log("✨ Successfully Created Ticket in DB:", ticket._id);
  } catch (err) {
    console.error("❌ Failed to create ticket:", err.message);
  }
  
  await mongoose.disconnect();
}

run().catch(console.error);
