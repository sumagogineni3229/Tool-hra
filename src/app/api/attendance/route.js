import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Attendance from '@/lib/models/Attendance';
import User from '@/lib/models/User';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

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

let indexesCleaned = false;

async function cleanLegacyIndexes() {
  if (indexesCleaned) return;
  try {
    const indexes = await Attendance.collection.indexes();
    const obsolete = ['userEmail_1_date_1', 'userEmail_1'];
    for (const name of obsolete) {
      if (indexes.some(idx => idx.name === name)) {
        console.log(`🧹 Dropping legacy index ${name}...`);
        await Attendance.collection.dropIndex(name);
      }
    }
    indexesCleaned = true;
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
    const managerEmail = searchParams.get('managerEmail');

    // Attempt to verify session from token cookie
    const token = request.cookies.get('token')?.value;
    let payload = null;
    if (token) {
      try {
        payload = await verifyToken(token);
      } catch (err) {
        console.warn("Verification failed in Attendance GET:", err.message);
      }
    }

    let query = {};
    if (email) {
      const user = await User.findOne({ email: email.toLowerCase().trim() }).lean();
      if (!user) {
        return NextResponse.json({ attendance: [] }, { status: 200 });
      }
      query = { userId: user._id };
    } else if (managerEmail) {
      const manager = await User.findOne({ email: managerEmail.toLowerCase().trim() }).lean();
      if (manager) {
        const Team = (await import('@/lib/models/Team')).default;
        const managedTeams = await Team.find({
          $or: [
            { managerId: manager._id },
            { managerId: manager._id.toString() }
          ]
        });
        const memberIds = managedTeams.flatMap(t => t.members || []).map(m => m.toString());
        query = { userId: { $in: memberIds } };
      }
    } else if (payload && payload.role === "Manager") {
      // Filter by manager's team members
      const Team = (await import('@/lib/models/Team')).default;
      const managedTeams = await Team.find({
        $or: [
          { managerId: payload.id },
          { managerId: payload.id.toString() }
        ]
      });
      const memberIds = managedTeams.flatMap(t => t.members || []).map(m => m.toString());
      query = { userId: { $in: memberIds } };
    }

    const records = await Attendance.find(query)
      .sort({ date: -1 })
      .lean();

    // Fetch only the users associated with the retrieved records
    const uniqueUserIds = [...new Set(records.map(r => r.userId ? r.userId.toString() : null).filter(Boolean))];
    const users = await User.find({ _id: { $in: uniqueUserIds } }).lean();
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

// POST /api/attendance — Clock-In / Manual Addition
export async function POST(request) {
  try {
    await dbConnect();
    await cleanLegacyIndexes();

    const body = await request.json();
    const { action, userId, date, status, checkIn, checkOut, notes } = body;
    const { email, location, image } = body;

    // Manager manual entry path
    if (action === 'manual' || userId) {
      if (!userId || !date || !status) {
        return NextResponse.json({ message: 'Missing required manual entry fields' }, { status: 400 });
      }

      const targetDate = new Date(date);
      const todayDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

      let record = await Attendance.findOne({ userId, date: todayDate });

      const newSession = {
        checkIn: checkIn ? new Date(checkIn) : new Date(todayDate.setHours(9, 0, 0, 0)),
        checkOut: checkOut ? new Date(checkOut) : null,
        checkInImage: "https://ui-avatars.com/api/?name=M&background=f1f5f9",
        checkOutImage: "https://ui-avatars.com/api/?name=M&background=f1f5f9",
        checkInLocation: { address: 'Manual Entry' },
        checkOutLocation: { address: 'Manual Entry' }
      };

      if (!record) {
        record = new Attendance({
          userId,
          date: todayDate,
          status,
          isLate: status === 'late',
          sessions: [newSession],
          totalDuration: checkIn && checkOut ? Math.max(new Date(checkOut).getTime() - new Date(checkIn).getTime(), 0) : 0,
          notes: notes || 'Manually added by manager'
        });
      } else {
        record.status = status;
        record.isLate = status === 'late';
        record.sessions.push(newSession);
        if (checkIn && checkOut) {
          record.totalDuration = (record.totalDuration || 0) + Math.max(new Date(checkOut).getTime() - new Date(checkIn).getTime(), 0);
        }
        if (notes) record.notes = notes;
      }

      await record.save();
      return NextResponse.json({ attendance: record }, { status: 201 });
    }

    // Standard employee clock-in
    if (!email) {
      return NextResponse.json({ message: 'Email is required for Clock-In' }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return NextResponse.json({ message: 'User not found in context' }, { status: 404 });
    }

    const targetUserId = user._id;
    const now = new Date();
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Determine lateness (late if checked in after 9:15 AM)
    let isLate = false;
    const hours = now.getHours();
    const minutes = now.getMinutes();
    if (hours > 9 || (hours === 9 && minutes > 15)) {
      isLate = true;
    }

    let record = await Attendance.findOne({ userId: targetUserId, date: todayDate });

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
        userId: targetUserId,
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

// PUT /api/attendance — Clock-Out / Record Update
export async function PUT(request) {
  try {
    await dbConnect();
    await cleanLegacyIndexes();

    const body = await request.json();
    const { id, status, notes, sessions } = body;
    const { email, location, image } = body;

    // Manager adjustment path
    if (id) {
      const record = await Attendance.findById(id);
      if (!record) {
        return NextResponse.json({ message: 'Attendance record not found' }, { status: 404 });
      }

      if (status) {
        record.status = status;
        record.isLate = status === 'late';
      }
      if (notes !== undefined) {
        record.notes = notes;
      }
      if (sessions) {
        record.sessions = sessions.map(s => ({
          checkIn: s.checkIn ? new Date(s.checkIn) : undefined,
          checkOut: s.checkOut ? new Date(s.checkOut) : null,
          checkInImage: s.checkInImage || "https://ui-avatars.com/api/?name=M&background=f1f5f9",
          checkOutImage: s.checkOutImage || "https://ui-avatars.com/api/?name=M&background=f1f5f9",
          checkInLocation: s.checkInLocation || { address: 'Manual Edit' },
          checkOutLocation: s.checkOutLocation || { address: 'Manual Edit' }
        }));

        // Recompute total duration
        let duration = 0;
        record.sessions.forEach(s => {
          if (s.checkIn && s.checkOut) {
            duration += Math.max(new Date(s.checkOut).getTime() - new Date(s.checkIn).getTime(), 0);
          }
        });
        record.totalDuration = duration;
      }

      await record.save();
      return NextResponse.json({ attendance: record }, { status: 200 });
    }

    // Standard employee clock-out
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
