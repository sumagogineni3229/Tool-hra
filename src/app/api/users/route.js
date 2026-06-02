import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const includePhotos = searchParams.get('includePhotos') === 'true';
    const verificationStatus = searchParams.get('verificationStatus');

    if (id) {
      const user = await User.findById(id);
      if (!user) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
      }
      const sanitized = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        permissions: user.permissions,
        status: user.status,
        session: user.session,
        initials: user.initials || user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
        badgeColor: user.badgeColor || 'bg-slate-900 text-white',
        profileCompleted: user.profileCompleted || false,
        verificationStatus: user.verificationStatus || 'Unsubmitted',
        phone: user.phone || '',
        dob: user.dob || '',
        address: user.address || '',
        emergencyContactName: user.emergencyContactName || '',
        emergencyContactPhone: user.emergencyContactPhone || '',
        aadhaarNumber: user.aadhaarNumber || '',
        userPhoto: user.userPhoto || '',
        aadhaarPhoto: user.aadhaarPhoto || '',
        college: user.college || '',
        course: user.course || '',
        startDate: user.startDate || '',
        endDate: user.endDate || ''
      };
      return NextResponse.json(sanitized, { status: 200 });
    }

    const filter = {};
    if (verificationStatus) {
      filter.verificationStatus = verificationStatus;
    }

    const projection = includePhotos ? {} : { userPhoto: 0, aadhaarPhoto: 0 };
    const users = await User.find(filter, projection).sort({ createdAt: -1 });

    const sanitizedUsers = users.map(user => {
      const u = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        permissions: user.permissions,
        status: user.status,
        session: user.session,
        initials: user.initials || user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
        badgeColor: user.badgeColor || 'bg-slate-900 text-white',
        profileCompleted: user.profileCompleted || false,
        verificationStatus: user.verificationStatus || 'Unsubmitted',
        phone: user.phone || '',
        dob: user.dob || '',
        address: user.address || '',
        emergencyContactName: user.emergencyContactName || '',
        emergencyContactPhone: user.emergencyContactPhone || '',
        aadhaarNumber: user.aadhaarNumber || '',
        college: user.college || '',
        course: user.course || '',
        startDate: user.startDate || '',
        endDate: user.endDate || ''
      };

      if (includePhotos) {
        u.userPhoto = user.userPhoto || '';
        u.aadhaarPhoto = user.aadhaarPhoto || '';
      }

      return u;
    });

    return NextResponse.json(sanitizedUsers, { status: 200 });
  } catch (error) {
    console.error('API GET Users Error:', error);
    return NextResponse.json({ message: 'Database fetch failed', error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { name, email, password, role, department, permissions, status } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json({ message: 'Name, email, password, and role are required fields' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
    }

    // Hash password with bcrypt for secure creation
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const initials = name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';

    const colors = [
      'bg-slate-900 text-white',
      'bg-indigo-600 text-white',
      'bg-emerald-600 text-white',
      'bg-rose-600 text-white',
      'bg-purple-600 text-white',
      'bg-amber-600 text-white'
    ];
    // Select color based on email length to keep it deterministic
    const badgeColor = colors[normalizedEmail.length % colors.length];

    const isApprovedRole = role === 'Admin' || role === 'HR' || role === 'Manager';
    const profileCompleted = isApprovedRole;
    const verificationStatus = isApprovedRole ? 'Approved' : 'Unsubmitted';

    const newUser = new User({
      name,
      email: normalizedEmail,
      password: hashedPassword, // Store securely
      role,
      department: department || 'Operations',
      permissions: permissions || 'Read/Write',
      status: status || 'Active',
      session: 'Offline',
      initials,
      badgeColor,
      profileCompleted,
      verificationStatus
    });

    await newUser.save();

    const result = {
      id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      department: newUser.department,
      permissions: newUser.permissions,
      status: newUser.status,
      session: 'Offline',
      initials,
      badgeColor,
      profileCompleted,
      verificationStatus
    };

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('API POST User Error:', error);
    return NextResponse.json({ message: 'User provision failed', error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User deleted successfully', id }, { status: 200 });
  } catch (error) {
    console.error('API DELETE User Error:', error);
    return NextResponse.json({ message: 'User deletion failed', error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { id, email, action, phone, dob, address, emergencyContactName, emergencyContactPhone, aadhaarNumber, userPhoto, aadhaarPhoto, status } = body;

    if (!id) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    let user;
    if (mongoose.Types.ObjectId.isValid(id)) {
      user = await User.findById(id);
    } 
    
    // Primary fallback: match by email passed from frontend session
    if (!user && email) {
      user = await User.findOne({ email: email.toLowerCase().trim() });
    }

    // Secondary fallback: match static seed IDs
    if (!user) {
      const seedEmails = {
        'seed-1': 'hragroups@gmail.com',
        'seed-2': 'sarah.j@hraconnect.com',
        'seed-3': 'daniel.c@hraconnect.com',
        'seed-4': 'employee@hraconnect.com',
        'seed-5': 'intern@hraconnect.com',
        'seed-6': 'elena.r@hraconnect.com',
      };
      const fallbackEmail = seedEmails[id];
      if (fallbackEmail) {
        user = await User.findOne({ email: fallbackEmail.toLowerCase().trim() });
      }
    }

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    if (action === 'submit_profile') {
      user.phone = phone;
      user.dob = dob;
      user.address = address;
      user.emergencyContactName = emergencyContactName;
      user.emergencyContactPhone = emergencyContactPhone;
      user.aadhaarNumber = aadhaarNumber;
      user.userPhoto = userPhoto;
      user.aadhaarPhoto = aadhaarPhoto;
      user.verificationStatus = 'Pending';
      await user.save();
      return NextResponse.json({ message: 'Profile details submitted for verification', user }, { status: 200 });
    }

    if (action === 'verify_approve') {
      user.profileCompleted = true;
      user.verificationStatus = 'Approved';
      user.status = 'Active';
      await user.save();
      return NextResponse.json({ message: 'Profile verified and approved successfully', user }, { status: 200 });
    }

    if (action === 'verify_reject') {
      user.profileCompleted = false;
      user.verificationStatus = 'Rejected';
      await user.save();
      return NextResponse.json({ message: 'Profile verification rejected', user }, { status: 200 });
    }

    // Default update support
    if (status) user.status = status;
    if (body.name !== undefined) user.name = body.name;
    if (body.email !== undefined) user.email = body.email;
    if (body.role !== undefined) user.role = body.role;
    if (body.department !== undefined) user.department = body.department;
    if (phone !== undefined) user.phone = phone;
    if (dob !== undefined) user.dob = dob;
    if (address !== undefined) user.address = address;
    if (body.college !== undefined) user.college = body.college;
    if (body.course !== undefined) user.course = body.course;
    if (body.startDate !== undefined) user.startDate = body.startDate;
    if (body.endDate !== undefined) user.endDate = body.endDate;

    await user.save();
    return NextResponse.json({ message: 'User updated successfully', user }, { status: 200 });

  } catch (error) {
    console.error('API PUT User Error:', error);
    return NextResponse.json({ message: 'User update failed', error: error.message }, { status: 500 });
  }
}

