import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import Team from '@/lib/models/Team';
import Training from '@/lib/models/Training';
import TrainingAssignment from '@/lib/models/TrainingAssignment';
import mongoose from 'mongoose';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const internEmail = searchParams.get('internEmail');

    const filter = {};
    if (internEmail) {
      filter.internEmail = internEmail.toLowerCase().trim();
    }

    const assignments = await TrainingAssignment.find(filter).sort({ createdAt: -1 });
    return NextResponse.json(assignments, { status: 200 });
  } catch (error) {
    console.error('API GET Assignments Error:', error);
    return NextResponse.json({ message: 'Database fetch failed', error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { trainingId, assignedToType, assignedToValue, dueDate } = body;

    if (!trainingId || !assignedToType || !dueDate) {
      return NextResponse.json({ message: 'Missing trainingId, assignedToType, or dueDate' }, { status: 400 });
    }

    // Resolve training module
    let training = null;
    if (mongoose.Types.ObjectId.isValid(trainingId)) {
      training = await Training.findById(trainingId);
    }
    if (!training) {
      // In case we are running in local/fallback or created via string ID
      training = await Training.findOne({ name: trainingId });
    }
    if (!training) {
      return NextResponse.json({ message: 'Training module not found' }, { status: 404 });
    }

    // Resolve targets (Interns)
    let interns = [];
    if (assignedToType === 'all') {
      interns = await User.find({ role: 'Intern' });
    } else if (assignedToType === 'team') {
      let team = null;
      if (mongoose.Types.ObjectId.isValid(assignedToValue)) {
        team = await Team.findById(assignedToValue).populate('members');
      } else {
        team = await Team.findOne({ name: assignedToValue }).populate('members');
      }

      if (team && Array.isArray(team.members)) {
        interns = team.members.filter(m => m.role === 'Intern');
      }
    } else if (assignedToType === 'department') {
      interns = await User.find({ department: assignedToValue, role: 'Intern' });
    } else if (assignedToType === 'individual') {
      let user = null;
      if (mongoose.Types.ObjectId.isValid(assignedToValue)) {
        user = await User.findById(assignedToValue);
      } else {
        user = await User.findOne({ email: assignedToValue.toLowerCase().trim() });
      }
      if (user && user.role === 'Intern') {
        interns = [user];
      }
    }

    if (interns.length === 0) {
      return NextResponse.json({ message: 'No interns matched the criteria for assignment' }, { status: 404 });
    }

    const createdAssignments = [];
    for (const intern of interns) {
      // Avoid duplicate assignments
      const existing = await TrainingAssignment.findOne({
        trainingId: training._id.toString(),
        internEmail: intern.email
      });

      if (!existing) {
        const assignment = new TrainingAssignment({
          trainingId: training._id.toString(),
          trainingName: training.name,
          internId: intern._id.toString(),
          internName: intern.name,
          internEmail: intern.email,
          dueDate: dueDate,
          status: 'Not Started',
          completionPercentage: 0
        });
        await assignment.save();
        createdAssignments.push(assignment);
      } else {
        createdAssignments.push(existing);
      }
    }

    return NextResponse.json({
      message: `Assigned training successfully to ${createdAssignments.length} intern(s)`,
      assignments: createdAssignments
    }, { status: 201 });

  } catch (error) {
    console.error('API POST Assign Trainings Error:', error);
    return NextResponse.json({ message: 'Assignment failed', error: error.message }, { status: 500 });
  }
}
