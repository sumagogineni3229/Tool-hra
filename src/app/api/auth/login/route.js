import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req) {
  try {
    await dbConnect();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return NextResponse.json({ message: 'Invalid credentials. User not found.' }, { status: 401 });
    }

    // Check password - handle both raw password (for seed/testing ease) and hashed password
    let isMatch = false;
    if (password === user.password) {
      isMatch = true;
    } else {
      try {
        isMatch = await bcrypt.compare(password, user.password);
      } catch (err) {
        isMatch = false;
      }
    }

    if (!isMatch) {
      return NextResponse.json({ message: 'Invalid secure credentials. Password incorrect.' }, { status: 401 });
    }

    // Update user session status to Online
    user.session = 'Online';
    await user.save();

    // Sanitized user object response
    const userData = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      permissions: user.permissions,
      status: user.status,
      session: 'Online',
      initials: user.initials || user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
      badgeColor: user.badgeColor || 'bg-slate-900 text-white',
      profileCompleted: user.profileCompleted || false,
      verificationStatus: user.verificationStatus || 'Unsubmitted',
      phone: user.phone || '',
      dob: user.dob || '',
      address: user.address || '',
      emergencyContactName: user.emergencyContactName || '',
      emergencyContactPhone: user.emergencyContactPhone || '',
      userPhoto: user.userPhoto || '',
      aadhaarPhoto: user.aadhaarPhoto || ''
    };

    // Generate JWT Token
    const token = signToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name
    });

    // Set Token Cookie
    const cookieStore = await cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/'
    });

    return NextResponse.json(userData, { status: 200 });
  } catch (error) {
    console.error('API Auth Login Error:', error);
    return NextResponse.json({ message: 'Database query failed', error: error.message }, { status: 500 });
  }
}
