import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import CalendarEvent from '@/lib/models/CalendarEvent';
import User from '@/lib/models/User';

async function getDefaultCreator() {
  const defaultCreator = await User.findOne({ role: { $in: ['Admin', 'HR', 'Manager'] } });
  if (defaultCreator) return defaultCreator._id;
  const anyUser = await User.findOne({});
  if (anyUser) return anyUser._id;
  return null;
}

export async function GET() {
  try {
    await dbConnect();
    const events = await CalendarEvent.find({}).sort({ date: 1 }).lean();
    return NextResponse.json({ events }, { status: 200 });
  } catch (error) {
    console.error('API GET Calendar Error:', error);
    return NextResponse.json({ message: 'Database fetch failed', error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { title, date, type, description, startTime, endTime, createdBy, isMandatory } = body;

    if (!title || !date) {
      return NextResponse.json({ message: 'Title and date are required' }, { status: 400 });
    }

    let creatorId = createdBy;
    if (!creatorId) {
      creatorId = await getDefaultCreator();
      if (!creatorId) {
        return NextResponse.json({ message: 'A valid creator User ID is required but no users exist in database' }, { status: 400 });
      }
    }

    const newEv = new CalendarEvent({
      title,
      date: new Date(date),
      type: type || 'event',
      description: description || '',
      startTime: startTime || '',
      endTime: endTime || '',
      createdBy: creatorId,
      isMandatory: isMandatory || false
    });

    await newEv.save();

    return NextResponse.json({ message: 'Event created successfully', event: newEv }, { status: 201 });
  } catch (error) {
    console.error('API POST Calendar Error:', error);
    return NextResponse.json({ message: 'Failed to create event', error: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { id, title, date, type, description, startTime, endTime, isMandatory } = body;

    if (!id || !title || !date) {
      return NextResponse.json({ message: 'ID, title, and date are required' }, { status: 400 });
    }

    const updated = await CalendarEvent.findByIdAndUpdate(
      id,
      { 
        title, 
        date: new Date(date), 
        type, 
        description, 
        startTime, 
        endTime, 
        isMandatory: isMandatory || false 
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Event updated successfully', event: updated }, { status: 200 });
  } catch (error) {
    console.error('API PATCH Calendar Error:', error);
    return NextResponse.json({ message: 'Failed to update event', error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'ID is required' }, { status: 400 });
    }

    const deleted = await CalendarEvent.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Event deleted successfully', id }, { status: 200 });
  } catch (error) {
    console.error('API DELETE Calendar Error:', error);
    return NextResponse.json({ message: 'Failed to delete event', error: error.message }, { status: 500 });
  }
}
