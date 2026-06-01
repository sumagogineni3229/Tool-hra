import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Holiday from '@/lib/models/Holiday';

export async function GET() {
  try {
    await dbConnect();
    const holidays = await Holiday.find({}).sort({ date: 1 });

    const formatted = holidays.map(h => ({
      id: h._id.toString(),
      name: h.name,
      date: h.date,
      type: h.type,
      scope: h.scope
    }));

    return NextResponse.json(formatted, { status: 200 });
  } catch (error) {
    console.error('API GET Holidays Error:', error);
    return NextResponse.json({ message: 'Database fetch failed', error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { name, date, type, scope } = body;

    if (!name || !date) {
      return NextResponse.json({ message: 'Name and date are required' }, { status: 400 });
    }

    const newH = new Holiday({
      name,
      date,
      type: type || 'National Holiday',
      scope: scope || 'Global'
    });

    await newH.save();

    return NextResponse.json({
      id: newH._id.toString(),
      name: newH.name,
      date: newH.date,
      type: newH.type,
      scope: newH.scope
    }, { status: 201 });
  } catch (error) {
    console.error('API POST Holiday Error:', error);
    return NextResponse.json({ message: 'Failed to create holiday', error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { id, name, date, type, scope } = body;

    if (!id || !name || !date) {
      return NextResponse.json({ message: 'ID, name, and date are required' }, { status: 400 });
    }

    const updated = await Holiday.findByIdAndUpdate(
      id,
      { name, date, type, scope },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ message: 'Holiday not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: updated._id.toString(),
      name: updated.name,
      date: updated.date,
      type: updated.type,
      scope: updated.scope
    }, { status: 200 });
  } catch (error) {
    console.error('API PUT Holiday Error:', error);
    return NextResponse.json({ message: 'Failed to update holiday', error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'ID query param is required' }, { status: 400 });
    }

    const deleted = await Holiday.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ message: 'Holiday not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Holiday deleted successfully', id }, { status: 200 });
  } catch (error) {
    console.error('API DELETE Holiday Error:', error);
    return NextResponse.json({ message: 'Failed to delete holiday', error: error.message }, { status: 500 });
  }
}
