import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Training from '@/lib/models/Training';

export async function GET(request) {
  try {
    await dbConnect();
    const list = await Training.find({}).sort({ createdAt: -1 });
    return NextResponse.json(list, { status: 200 });
  } catch (error) {
    console.error('API GET Trainings Error:', error);
    return NextResponse.json({ message: 'Database fetch failed', error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { name, description, category, duration, status, materials } = body;

    if (!name) {
      return NextResponse.json({ message: 'Training Name is required' }, { status: 400 });
    }

    const newTraining = new Training({
      name,
      description: description || '',
      category: category || 'General',
      duration: duration || '1 hour',
      status: status || 'Active',
      materials: materials || []
    });

    await newTraining.save();

    return NextResponse.json(newTraining, { status: 201 });
  } catch (error) {
    console.error('API POST Training Error:', error);
    return NextResponse.json({ message: 'Training creation failed', error: error.message }, { status: 500 });
  }
}
