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

    const formatted = events.map(e => ({
      id: e._id.toString(),
      title: e.title,
      date: e.date,
      type: e.type
    }));

    return NextResponse.json(formatted, { status: 200 });
  } catch (error) {
    console.error('API GET Events Error:', error);
    return NextResponse.json({ message: 'Database fetch failed', error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { title, date, type, createdBy } = body;

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
      createdBy: creatorId
    });

    await newEv.save();

    return NextResponse.json({
      id: newEv._id.toString(),
      title: newEv.title,
      date: newEv.date,
      type: newEv.type
    }, { status: 201 });
  } catch (error) {
    console.error('API POST Event Error:', error);
    return NextResponse.json({ message: 'Failed to create event', error: error.message }, { status: 500 });
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
    console.error('API DELETE Event Error:', error);
    return NextResponse.json({ message: 'Failed to delete event', error: error.message }, { status: 500 });
  }
}
