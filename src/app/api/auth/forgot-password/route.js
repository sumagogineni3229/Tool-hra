import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { action, email, code, newPassword } = body;

    if (!email) {
      return NextResponse.json({ message: 'Email address is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Action 1: Request verification code
    if (action === 'request_code') {
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        return NextResponse.json({ message: 'No registered workspace account found with that email address.' }, { status: 404 });
      }

      // Generate a 6-digit numeric verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Save to user (15 minutes expiry window)
      user.resetCode = verificationCode;
      user.resetCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
      await user.save();

      console.log(`[PASS_RESET] Generated code for ${normalizedEmail}: ${verificationCode}`);

      return NextResponse.json({
        message: 'A secure recovery code has been generated.',
        email: normalizedEmail,
        code: verificationCode // Return the code in response to allow the elegant Sandbox widget to display it!
      }, { status: 200 });
    }

    // Action 2: Reset the password using the verification code
    if (action === 'reset_password') {
      if (!code || !newPassword) {
        return NextResponse.json({ message: 'Verification code and new password are required' }, { status: 400 });
      }

      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        return NextResponse.json({ message: 'User account not found' }, { status: 404 });
      }

      // Validate code and check expiry
      if (!user.resetCode || user.resetCode !== code.trim()) {
        return NextResponse.json({ message: 'Invalid secure verification code. Please check your spelling.' }, { status: 400 });
      }

      if (new Date() > new Date(user.resetCodeExpires)) {
        return NextResponse.json({ message: 'This verification code has expired. Please request a new one.' }, { status: 400 });
      }

      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update password (both raw and hashed to support offline/online)
      user.password = hashedPassword;
      user.resetCode = '';
      user.resetCodeExpires = null;
      await user.save();

      return NextResponse.json({ message: 'Your password has been reset successfully.' }, { status: 200 });
    }

    return NextResponse.json({ message: 'Invalid action provided' }, { status: 400 });
  } catch (error) {
    console.error('Forgot Password API Error:', error);
    return NextResponse.json({ message: 'Failed to process password recovery', error: error.message }, { status: 500 });
  }
}
