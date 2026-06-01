import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { email, currentPassword, newPassword } = body;

    if (!email || !currentPassword || !newPassword) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return NextResponse.json({ message: 'User account not found' }, { status: 404 });
    }

    // Verify current password (support both raw seed compare and bcrypt)
    let isMatch = false;
    if (currentPassword === user.password) {
      isMatch = true;
    } else {
      try {
        isMatch = await bcrypt.compare(currentPassword, user.password);
      } catch (err) {
        isMatch = false;
      }
    }

    if (!isMatch) {
      return NextResponse.json({ message: 'Your current password is incorrect.' }, { status: 401 });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Save password
    user.password = hashedPassword;
    await user.save();

    return NextResponse.json({ message: 'Password changed successfully.' }, { status: 200 });
  } catch (error) {
    console.error('Change Password API Error:', error);
    return NextResponse.json({ message: 'Failed to update password', error: error.message }, { status: 500 });
  }
}
