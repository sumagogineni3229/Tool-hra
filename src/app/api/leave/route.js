import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Leave from '@/lib/models/Leave';
import User from '@/lib/models/User';
import { verifyToken } from '@/lib/auth';

// GET active employee's personal leave history or HR's all leaves view
export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const emailParam = searchParams.get('email');

    // Attempt to verify session from token cookie
    const token = request.cookies.get('token')?.value;
    let payload = null;
    if (token) {
      payload = await verifyToken(token);
    }

    // Resolve user context
    let leaves = [];
    if (payload) {
      // Token-based personal view
      leaves = await Leave.find({ userId: payload.id }).sort({ createdAt: -1 });
    } else if (emailParam) {
      // Fallback query parameter-based personal view
      const email = emailParam.toLowerCase().trim();
      const user = await User.findOne({ email });
      if (user) {
        leaves = await Leave.find({
          $or: [{ userId: user._id }, { userEmail: email }]
        }).sort({ createdAt: -1 });
      }
    } else {
      // HR/Admin view: Fetch all leaves
      leaves = await Leave.find({}).sort({ createdAt: -1 });
    }

    // Fetch all users to construct an email-to-user details mapping for display purposes
    const users = await User.find({}).lean();
    const userMap = {};
    users.forEach(u => {
      userMap[u._id.toString()] = {
        name: u.name,
        role: u.role,
        email: u.email
      };
      userMap[u.email.toLowerCase().trim()] = {
        name: u.name,
        role: u.role,
        email: u.email
      };
    });

    // Map leaves to ensure perfect backward compatibility
    const mappedLeaves = leaves.map(leave => {
      const l = leave.toObject ? leave.toObject() : leave;
      const days = l.daysCount || (l.duration ? parseInt(l.duration) || 1 : 1);
      const lType = l.leaveType || (l.type ? l.type.replace(" Leave", "") : "Sick");
      const capStatus = l.status ? l.status.charAt(0).toUpperCase() + l.status.slice(1) : "Pending";
      const statusDisplay = capStatus === "Rejected" ? "Declined" : capStatus;

      // Resolve user info
      let userInfo = { name: 'Unknown User', role: 'Employee', email: l.userEmail || '' };
      if (l.userId && userMap[l.userId.toString()]) {
        userInfo = userMap[l.userId.toString()];
      } else if (l.userEmail && userMap[l.userEmail.toLowerCase().trim()]) {
        userInfo = userMap[l.userEmail.toLowerCase().trim()];
      }

      return {
        ...l,
        id: l._id.toString(),
        leaveType: lType,
        type: l.type || `${lType} Leave`,
        daysCount: days,
        duration: l.duration || `${days} Day${days > 1 ? "s" : ""}`,
        startDate: l.startDate,
        endDate: l.endDate,
        dates: l.dates || `${new Date(l.startDate).toISOString().split('T')[0]} - ${new Date(l.endDate).toISOString().split('T')[0]}`,
        status: l.status,
        name: userInfo.name,
        role: userInfo.role,
        userEmail: userInfo.email
      };
    });

    return NextResponse.json({ leaves: mappedLeaves }, { status: 200 });
  } catch (error) {
    console.error('API GET Leave Error:', error);
    return NextResponse.json({ message: 'Failed to fetch leaves', error: error.message }, { status: 500 });
  }
}

// POST new leave request
export async function POST(request) {
  try {
    await dbConnect();
    
    // Attempt to verify session from token cookie
    const token = request.cookies.get('token')?.value;
    let payload = null;
    if (token) {
      payload = await verifyToken(token);
    }

    const body = await request.json();
    const { email, type, duration, dates, reason } = body;
    const { leaveType, startDate, endDate, daysCount } = body;

    // Resolve active user id and email
    let activeUserId = null;
    let activeUserEmail = null;

    if (payload) {
      activeUserId = payload.id;
      activeUserEmail = payload.email;
    } else {
      const emailToLookup = (email || '').toLowerCase().trim();
      if (!emailToLookup) {
        return NextResponse.json({ message: 'Unauthorized or missing user identifier' }, { status: 401 });
      }
      const user = await User.findOne({ email: emailToLookup });
      if (!user) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
      }
      activeUserId = user._id;
      activeUserEmail = user.email;
    }

    // Modern fields parsed with fallback compatibility
    const resolvedLeaveType = leaveType || (type ? type.replace(" Leave", "") : "Sick");
    
    let resolvedStartDate = startDate;
    let resolvedEndDate = endDate;
    if (!resolvedStartDate && dates) {
      const parts = dates.split(' - ');
      if (parts[0]) resolvedStartDate = parts[0];
      if (parts[1]) resolvedEndDate = parts[1];
    }
    if (!resolvedStartDate) resolvedStartDate = new Date();
    if (!resolvedEndDate) resolvedEndDate = resolvedStartDate;

    const resolvedDaysCount = daysCount || (duration ? parseInt(duration) || 1 : 1);
    const resolvedReason = reason || body.reason;

    if (!resolvedLeaveType || !resolvedStartDate || !resolvedEndDate || !resolvedReason || !resolvedDaysCount) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const newLeave = await Leave.create({
      userId: activeUserId,
      userEmail: activeUserEmail,
      leaveType: resolvedLeaveType,
      type: `${resolvedLeaveType} Leave`,
      startDate: new Date(resolvedStartDate),
      endDate: new Date(resolvedEndDate),
      daysCount: resolvedDaysCount,
      duration: `${resolvedDaysCount} Day${resolvedDaysCount > 1 ? 's' : ''}`,
      dates: `${new Date(resolvedStartDate).toISOString().split('T')[0]} - ${new Date(resolvedEndDate).toISOString().split('T')[0]}`,
      reason: resolvedReason,
      status: 'pending'
    });

    return NextResponse.json({ message: 'Leave request submitted', leave: newLeave }, { status: 201 });
  } catch (error) {
    console.error('API POST Leave Error:', error);
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}

// PATCH update leave status
export async function PATCH(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { id, status, adminComments } = body;

    if (!id || !status) {
      return NextResponse.json({ message: 'ID and status are required' }, { status: 400 });
    }

    const updatedLeave = await Leave.findByIdAndUpdate(
      id,
      { 
        status: status.toLowerCase().trim(),
        adminComments: adminComments || ''
      },
      { new: true }
    );

    if (!updatedLeave) {
      return NextResponse.json({ message: 'Leave request not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, leave: updatedLeave }, { status: 200 });
  } catch (error) {
    console.error('API PATCH Leave Error:', error);
    return NextResponse.json({ message: 'Failed to update leave request', error: error.message }, { status: 500 });
  }
}
