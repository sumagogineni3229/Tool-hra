import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import EssRequest from '@/lib/models/EssRequest';
import User from '@/lib/models/User';
import { verifyToken } from '@/lib/auth';

// GET - Fetch ESS requests
// Employees see their own; HR/Admin see all; Manager sees team
export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const emailParam = searchParams.get('email');
    const roleParam = searchParams.get('role');

    const token = request.cookies.get('token')?.value;
    let payload = null;
    if (token) {
      payload = await verifyToken(token);
    }

    const tokenRole = payload?.role;
    const effectiveRole = tokenRole || roleParam;
    const isPrivileged = effectiveRole === 'HR' || effectiveRole === 'Admin' || effectiveRole === 'Manager';

    let requests = [];

    if (isPrivileged) {
      if (effectiveRole === 'Manager') {
        // Manager sees team ESS requests
        const Team = (await import('@/lib/models/Team')).default;
        const managerIdentifier = payload?.id || emailParam;
        let managedTeams = [];
        if (managerIdentifier) {
          managedTeams = await Team.find({
            $or: [
              { managerId: managerIdentifier },
              { managerId: managerIdentifier?.toString() }
            ]
          });
        }
        const memberIds = managedTeams.flatMap(t => t.members || []).map(m => m.toString());
        const teamUsers = await User.find({ _id: { $in: memberIds } }).lean();
        const teamEmails = teamUsers.map(u => u.email.toLowerCase().trim());
        requests = await EssRequest.find({
          $or: [
            { userId: { $in: memberIds } },
            { userEmail: { $in: teamEmails } }
          ]
        }).sort({ createdAt: -1 });
      } else {
        // HR or Admin sees all
        requests = await EssRequest.find({}).sort({ createdAt: -1 });
      }
    } else if (payload) {
      // Authenticated employee sees their own
      requests = await EssRequest.find({ userId: payload.id }).sort({ createdAt: -1 });
    } else if (emailParam) {
      // Fallback: email-based query for employee
      const email = emailParam.toLowerCase().trim();
      const user = await User.findOne({ email }).lean();
      if (user) {
        requests = await EssRequest.find({
          $or: [{ userId: user._id }, { userEmail: email }]
        }).sort({ createdAt: -1 });
      }
    }

    const mapped = requests.map(r => {
      const obj = r.toObject ? r.toObject() : r;
      return {
        ...obj,
        id: obj._id.toString(),
      };
    });

    return NextResponse.json({ success: true, requests: mapped }, { status: 200 });
  } catch (error) {
    console.error('ESS GET Error:', error);
    return NextResponse.json({ message: 'Failed to fetch ESS requests', error: error.message }, { status: 500 });
  }
}

// POST - Submit a new ESS request
export async function POST(request) {
  try {
    await dbConnect();

    const token = request.cookies.get('token')?.value;
    let payload = null;
    if (token) {
      payload = await verifyToken(token);
    }

    const body = await request.json();
    const { email, requestType, startDate, endDate, reason, workLocation, officeLocation } = body;

    // Resolve user
    let activeUserId = null;
    let activeUserEmail = null;
    let activeUserName = null;
    let activeUserRole = null;

    if (payload) {
      activeUserId = payload.id;
      activeUserEmail = payload.email;
      activeUserName = payload.name;
      activeUserRole = payload.role;
    } else {
      const emailToLookup = (email || '').toLowerCase().trim();
      if (!emailToLookup) {
        return NextResponse.json({ message: 'Unauthorized or missing user identifier' }, { status: 401 });
      }
      const user = await User.findOne({ email: emailToLookup }).lean();
      if (!user) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
      }
      activeUserId = user._id;
      activeUserEmail = user.email;
      activeUserName = user.name;
      activeUserRole = user.role;
    }

    // Validate required fields
    if (!requestType || !startDate || !endDate || !reason) {
      return NextResponse.json({ message: 'Missing required fields: requestType, startDate, endDate, reason' }, { status: 400 });
    }

    if (!['WFH', 'WFO'].includes(requestType)) {
      return NextResponse.json({ message: 'Invalid requestType. Must be WFH or WFO' }, { status: 400 });
    }

    const newRequest = await EssRequest.create({
      userId: activeUserId,
      userEmail: activeUserEmail,
      userName: activeUserName,
      userRole: activeUserRole,
      requestType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason: reason.trim(),
      workLocation: workLocation?.trim() || '',
      officeLocation: officeLocation?.trim() || '',
      status: 'pending',
    });

    return NextResponse.json(
      { message: 'ESS request submitted successfully', request: { ...newRequest.toObject(), id: newRequest._id.toString() } },
      { status: 201 }
    );
  } catch (error) {
    console.error('ESS POST Error:', error);
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}

// PATCH - Approve/Reject an ESS request (HR, Admin, Manager)
export async function PATCH(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { id, status, hrComments, adminComments, managerComments, reviewedBy, reviewedByRole } = body;

    if (!id || !status) {
      return NextResponse.json({ message: 'ID and status are required' }, { status: 400 });
    }

    const validStatuses = ['approved', 'rejected', 'pending'];
    if (!validStatuses.includes(status.toLowerCase())) {
      return NextResponse.json({ message: 'Invalid status' }, { status: 400 });
    }

    const updatePayload = {
      status: status.toLowerCase(),
      reviewedAt: new Date(),
    };
    if (hrComments !== undefined) updatePayload.hrComments = hrComments;
    if (adminComments !== undefined) updatePayload.adminComments = adminComments;
    if (managerComments !== undefined) updatePayload.managerComments = managerComments;
    if (reviewedBy) updatePayload.reviewedBy = reviewedBy;
    if (reviewedByRole) updatePayload.reviewedByRole = reviewedByRole;

    const updated = await EssRequest.findByIdAndUpdate(id, updatePayload, { new: true });

    if (!updated) {
      return NextResponse.json({ message: 'ESS request not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, request: { ...updated.toObject(), id: updated._id.toString() } }, { status: 200 });
  } catch (error) {
    console.error('ESS PATCH Error:', error);
    return NextResponse.json({ message: 'Failed to update ESS request', error: error.message }, { status: 500 });
  }
}
