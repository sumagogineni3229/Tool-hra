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
    const { userEmail, userName, period, basic, hra, allowances, deductions, net } = body;

    if (!userEmail || !period || basic === undefined || hra === undefined || net === undefined) {
      return NextResponse.json({ message: 'Missing required payroll fields (userEmail, period, basic, hra, net)' }, { status: 400 });
    }

    const newPayroll = await Payroll.create({
      userEmail: userEmail.toLowerCase().trim(),
      userName: userName || 'Staff Member',
      period,
      basic: Number(basic),
      hra: Number(hra),
      allowances: Number(allowances) || 0,
      deductions: Number(deductions) || 0,
      net: Number(net),
      date: new Date().toISOString().split('T')[0],
    });

    return NextResponse.json({
      ...newPayroll.toObject(),
      id: newPayroll._id.toString(),
    }, { status: 201 });
  } catch (error) {
    console.error('Payroll POST error:', error.message);
    return NextResponse.json({ message: 'Failed to create payroll record', error: error.message }, { status: 500 });
  }
}
