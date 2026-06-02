import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Attendance from '@/lib/models/Attendance';
import User from '@/lib/models/User';

export const dynamic = 'force-dynamic';

// GET /api/attendance/today — Fetch today's attendance record for an employee
export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ message: 'Email query parameter is required' }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).lean();
    if (!user) {
      return NextResponse.json({ attendance: null }, { status: 200 });
    }

    const now = new Date();
    // Normalize date to today at midnight
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const attendance = await Attendance.findOne({ userId: user._id, date: todayDate }).lean();

    return NextResponse.json({ attendance: attendance || null }, { status: 200 });
  } catch (error) {
    console.error('API GET Today Attendance Error:', error);
    return NextResponse.json({ message: 'Failed to fetch today\'s attendance record', error: error.message }, { status: 500 });
  }
}
