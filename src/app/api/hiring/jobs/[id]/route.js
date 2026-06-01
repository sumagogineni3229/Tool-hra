import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Job from "@/lib/models/Job";

// GET a single job by ID - used by the public candidate portal
export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    const job = await Job.findById(id);
    if (!job) {
      return NextResponse.json({ success: false, message: "Vacancy not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      job: {
        _id: job._id.toString(),
        title: job.title,
        department: job.department,
        type: job.type,
        location: job.location,
        description: job.description,
        requirements: job.requirements,
        customQuestions: job.customQuestions,
        status: job.status,
        applicantCount: job.applicantCount,
        createdAt: job.createdAt,
      }
    }, { status: 200 });
  } catch (error) {
    console.error("API GET Single Job Error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch job.", error: error.message }, { status: 500 });
  }
}
