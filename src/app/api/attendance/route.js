import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Attendance from '@/lib/models/Attendance';
import User from '@/lib/models/User';

async function getAddressFromCoords(lat, lng) {
  if (!lat || !lng || (lat === 0 && lng === 0)) {
    return 'Virtual Check-In / Remote';
  }
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
      headers: {
        'User-Agent': 'HRA_People_Connect_App'
      }
    });
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};

      // Extract the city/suburb/state and country elements for a readable short string
      const city = addr.city || addr.town || addr.village || addr.suburb || addr.county || '';
      const state = addr.state || '';
      const country = addr.country || '';

      let shortAddress = '';
      if (city && state) {
        // If city is the same as state, don't duplicate (e.g. "Delhi, Delhi" -> just "Delhi")
        if (city.toLowerCase().trim() === state.toLowerCase().trim()) {
          shortAddress = state;
        } else {
          shortAddress = `${city}, ${state}`;
        }
      } else if (state) {
        shortAddress = state;
      } else if (city) {
        shortAddress = city;
      } else {
        // Fallback to the first fragment of the display name
        shortAddress = data.display_name ? data.display_name.split(',')[0] : `Location: ${lat}, ${lng}`;
      }

      // Append country if available for extra context
      if (country) {
        shortAddress = `${shortAddress}, ${country}`;
      }

      return shortAddress;
    }
  } catch (e) {
    console.warn('Reverse geocoding failed:', e.message);
  }
  return `Coordinates: ${lat}, ${lng}`;
}

async function cleanLegacyIndexes() {
  try {
    const indexes = await Attendance.collection.indexes();
    const obsolete = ['userEmail_1_date_1', 'userEmail_1'];
    for (const name of obsolete) {
      if (indexes.some(idx => idx.name === name)) {
        console.log(`🧹 Dropping legacy index ${name}...`);
        await Attendance.collection.dropIndex(name);
      }
    }
  } catch (e) {
    console.warn('Index sync warning:', e.message);
  }
}

// GET /api/attendance — Fetch attendance records (enriched with user details)
export async function GET(request) {
  try {
    await dbConnect();
    await cleanLegacyIndexes();

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    let query = {};
    if (email) {
      const user = await User.findOne({ email: email.toLowerCase().trim() }).lean();
      if (!user) {
        return NextResponse.json({ attendance: [] }, { status: 200 });
      }
      query = { userId: user._id };
    }

    const records = await Attendance.find(query)
      .sort({ date: -1 })
      .lean();

    // Fetch all users to create a mapping from ID to user details
    const users = await User.find({}).lean();
    const userMap = {};
    users.forEach(u => {
      userMap[u._id.toString()] = u;
    });

    // Format records to perfectly match the frontend expectations
    const formatted = records.map(r => {
      const user = userMap[r.userId ? r.userId.toString() : ''];
      return {
        _id: r._id.toString(),
        date: r.date,
        status: r.status || 'present',
        totalDuration: r.totalDuration || 0,
        isLate: r.isLate || false,
        overtime: r.overtime || 0,
        notes: r.notes || '',
        sessions: (r.sessions || []).map(s => ({
          checkIn: s.checkIn,
          checkOut: s.checkOut,
          checkInImage: s.checkInImage || s.image || "https://ui-avatars.com/api/?name=V&background=f1f5f9",
          checkOutImage: s.checkOutImage || s.image || "https://ui-avatars.com/api/?name=E&background=f1f5f9",
          checkInLocation: s.checkInLocation || s.location || null,
          checkOutLocation: s.checkOutLocation || s.location || null,
        })),
        userId: {
          _id: user ? user._id.toString() : '',
          name: user ? user.name : 'Unknown User',
          employeeId: user && user.phone ? `EMP-${user.phone.slice(-4)}` : `EMP-${r._id.toString().slice(-4).toUpperCase()}`,
          position: user ? user.role : 'Staff Member'
        }
      };
    });

    return NextResponse.json({ attendance: formatted }, { status: 200 });
  } catch (error) {
    console.error('API GET Attendance Error:', error);
    return NextResponse.json({ message: 'Failed to fetch attendance records', error: error.message }, { status: 500 });
  }
}

// POST /api/attendance — Clock-In
export async function POST(request) {
  try {
    await dbConnect();
    await cleanLegacyIndexes();

    const body = await request.json();
    const { email, location, image } = body;

    if (!email) {
      return NextResponse.json({ message: 'Email is required for Clock-In' }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return NextResponse.json({ message: 'User not found in context' }, { status: 404 });
    }

    const userId = user._id;
    const now = new Date();
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Determine lateness (late if checked in after 9:15 AM)
    let isLate = false;
    const hours = now.getHours();
    const minutes = now.getMinutes();
    if (hours > 9 || (hours === 9 && minutes > 15)) {
      isLate = true;
    }

    let record = await Attendance.findOne({ userId, date: todayDate });

    // Reverse geocode location
    const address = await getAddressFromCoords(location?.lat, location?.lng);

    const newSession = {
      checkIn: now,
      checkInImage: image,
      checkInLocation: {
        lat: location?.lat,
        lng: location?.lng,
        address
      }
    };

    if (!record) {
      record = new Attendance({
        userId,
        date: todayDate,
        status: isLate ? 'late' : 'present',
        isLate,
        sessions: [newSession],
        totalDuration: 0
      });
    } else {
      // Check if there is already an active session
      const activeSession = record.sessions.find(s => !s.checkOut);
      if (activeSession) {
        return NextResponse.json({ message: 'Already clocked in', attendance: record }, { status: 400 });
      }
      record.sessions.push(newSession);
    }

    await record.save();
    return NextResponse.json({ attendance: record }, { status: 201 });
  } catch (error) {
    console.error('API POST Attendance Error:', error);
    return NextResponse.json({ message: 'Failed to clock in', error: error.message }, { status: 500 });
  }
}

// PUT /api/attendance — Clock-Out
export async function PUT(request) {
  try {
    await dbConnect();
    await cleanLegacyIndexes();

    const body = await request.json();
    const { email, location, image } = body;

    if (!email) {
      return NextResponse.json({ message: 'Email is required for Clock-Out' }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return NextResponse.json({ message: 'User not found in context' }, { status: 404 });
    }

    const userId = user._id;
    const now = new Date();
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let record = await Attendance.findOne({ userId, date: todayDate });

    if (!record) {
      return NextResponse.json({ message: 'No attendance record found for today' }, { status: 404 });
    }

    const activeSession = record.sessions.find(s => !s.checkOut);
    if (!activeSession) {
      return NextResponse.json({ message: 'No active session found to clock out', attendance: record }, { status: 400 });
    }

    const checkoutTime = new Date();
    activeSession.checkOut = checkoutTime;
    if (image) activeSession.checkOutImage = image;

    if (location) {
      const address = await getAddressFromCoords(location.lat, location.lng);
      activeSession.checkOutLocation = {
        lat: location.lat,
        lng: location.lng,
        address
      };
    }

    // Calculate session duration and add to totalDuration
    const durationMs = checkoutTime.getTime() - new Date(activeSession.checkIn).getTime();
    record.totalDuration = (record.totalDuration || 0) + durationMs;

    await record.save();
    return NextResponse.json({ attendance: record }, { status: 200 });
  } catch (error) {
    console.error('API PUT Attendance Error:', error);
    return NextResponse.json({ message: 'Failed to clock out', error: error.message }, { status: 500 });
  }
}

// DELETE /api/attendance — Delete an attendance record
export async function DELETE(request) {
  try {
    await dbConnect();
    await cleanLegacyIndexes();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'ID parameter is required to delete' }, { status: 400 });
    }

    const deleted = await Attendance.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ message: 'Attendance record not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Attendance record deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('API DELETE Attendance Error:', error);
    return NextResponse.json({ message: 'Failed to delete attendance record', error: error.message }, { status: 500 });
  }
}
