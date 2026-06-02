import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import TrainingAssignment from '@/lib/models/TrainingAssignment';

export async function PUT(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { assignmentId, status, completionPercentage, certificateUrl } = body;

    if (!assignmentId) {
      return NextResponse.json({ message: 'assignmentId is required' }, { status: 400 });
    }

    const assignment = await TrainingAssignment.findById(assignmentId);
    if (!assignment) {
      return NextResponse.json({ message: 'Training assignment not found' }, { status: 404 });
    }

    if (status !== undefined) {
      assignment.status = status;
      if (status === 'Completed') {
        assignment.completionPercentage = 100;
        assignment.completedAt = new Date();
        if (!assignment.certificateUrl) {
          assignment.certificateUrl = `/certificates/cert-${assignment._id.toString()}.pdf`;
        }
      }
    }

    if (completionPercentage !== undefined) {
      assignment.completionPercentage = Number(completionPercentage);
      if (Number(completionPercentage) === 100) {
        assignment.status = 'Completed';
        assignment.completedAt = new Date();
        if (!assignment.certificateUrl) {
          assignment.certificateUrl = `/certificates/cert-${assignment._id.toString()}.pdf`;
        }
      }
    }

    if (certificateUrl !== undefined) {
      assignment.certificateUrl = certificateUrl;
    }

    await assignment.save();
    return NextResponse.json(assignment, { status: 200 });

  } catch (error) {
    console.error('API PUT Progress Error:', error);
    return NextResponse.json({ message: 'Failed to update progress', error: error.message }, { status: 500 });
  }
}
