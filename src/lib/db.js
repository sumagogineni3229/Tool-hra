import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null, lastAttemptFailed: false, failedAt: 0 };
}

async function seedIfEmpty() {
  try {
    // Dynamic import to avoid any circular dependency or early loading issues
    const UserModule = await import('./models/User');
    const User = UserModule.default;

    const count = await User.countDocuments();
    if (count === 0) {
      console.log('🌱 No users found in MongoDB. Auto-seeding default credentials...');
      const bcrypt = await import('bcryptjs');

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

      for (const seedUser of DEFAULT_SEEDS) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(seedUser.password, salt);
        await User.create({
          ...seedUser,
          password: hashedPassword
        });
      }
      console.log('✅ Auto-seeding default credentials complete.');
    }
  } catch (error) {
    console.error('⚠️ Auto-seeding check failed:', error.message);
  }
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  // Fail-fast: If the connection attempt failed within the last 15s, fail instantly to save loading time
  const now = Date.now();
  if (cached.lastAttemptFailed && (now - cached.failedAt < 15000)) {
    console.warn("⚠️ MongoDB Atlas is cached offline. Failing fast instantly (0ms) to trigger LocalStorage fallback...");
    throw new Error("Database is temporarily offline (cooldown cache)");
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 2500, // Fail-fast: fallback to LocalStorage if unreachable within 2.5s
    };

    console.log('🔄 Connecting to MongoDB...');
    cached.promise = mongoose.connect(MONGODB_URI, opts).then(async (mongooseInstance) => {
      console.log('MongoDB connected successfully');
      cached.lastAttemptFailed = false;
      // Perform auto-seed verification
      await seedIfEmpty();
      return mongooseInstance;
    }).catch((err) => {
      console.error('MongoDB connection failed:', err.message);
      cached.promise = null;
      cached.lastAttemptFailed = true;
      cached.failedAt = Date.now();
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;

