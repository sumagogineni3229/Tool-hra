import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Payroll from '@/lib/models/Payroll';

// GET /api/payroll — Fetch all payroll records, or filter by ?email=...
export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    let payrolls;
    if (email) {
      payrolls = await Payroll.find({ userEmail: email.toLowerCase().trim() }).sort({ createdAt: -1 }).lean();
    } else {
      payrolls = await Payroll.find({}).sort({ createdAt: -1 }).lean();
    }

    // Map _id to id for frontend compatibility
    const mapped = payrolls.map(p => ({
      ...p,
      id: p._id.toString(),
    }));

    return NextResponse.json(mapped, { status: 200 });
  } catch (error) {
    console.error('Payroll GET error:', error.message);
    return NextResponse.json({ message: 'Failed to fetch payroll records', error: error.message }, { status: 500 });
  }
}

// POST /api/payroll — Create a new payroll record
export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { userEmail, userName, period } = body;

    if (!userEmail || !period) {
      return NextResponse.json({ message: 'Missing required payroll fields (userEmail, period)' }, { status: 400 });
    }

    const payload = {
      ...body,
      userEmail: userEmail.toLowerCase().trim(),
      userName: userName || 'Staff Member',
      date: body.date || new Date().toISOString().split('T')[0],
    };

    const newPayroll = await Payroll.create(payload);

    return NextResponse.json({
      ...newPayroll.toObject(),
      id: newPayroll._id.toString(),
    }, { status: 201 });
  } catch (error) {
    console.error('Payroll POST error:', error.message);
    return NextResponse.json({ message: 'Failed to create payroll record', error: error.message }, { status: 500 });
  }
}

// PUT /api/payroll — Update an existing payroll record
export async function PUT(request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { id, _id, ...updateFields } = body;
    const targetId = id || _id;

    if (!targetId) {
      return NextResponse.json({ message: 'Missing payroll ID' }, { status: 400 });
    }

    if (updateFields.userEmail) {
      updateFields.userEmail = updateFields.userEmail.toLowerCase().trim();
    }

    const updated = await Payroll.findByIdAndUpdate(targetId, updateFields, { new: true }).lean();

    if (!updated) {
      return NextResponse.json({ message: 'Payroll record not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...updated,
      id: updated._id.toString(),
    }, { status: 200 });
  } catch (error) {
    console.error('Payroll PUT error:', error.message);
    return NextResponse.json({ message: 'Failed to update payroll record', error: error.message }, { status: 500 });
  }
}

// DELETE /api/payroll — Delete a payroll record by ID
export async function DELETE(request) {

  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Missing payroll ID' }, { status: 400 });
    }

    const deleted = await Payroll.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ message: 'Payroll record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Payroll record deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Payroll DELETE error:', error.message);
    return NextResponse.json({ message: 'Failed to delete payroll record', error: error.message }, { status: 500 });
  }
}

