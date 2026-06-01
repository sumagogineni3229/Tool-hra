import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Job from "@/lib/models/Job";
import Application from "@/lib/models/Application";

// GET all jobs
export async function GET() {
  try {
    await dbConnect();
    const jobs = await Job.find({}).sort({ createdAt: -1 });

    // Enforce live applicant counts sync for high accuracy
    const syncedJobs = await Promise.all(
      jobs.map(async (job) => {
        const count = await Application.countDocuments({ jobId: job._id });
        
        // Update the Job count field if it's different
        if (job.applicantCount !== count) {
          job.applicantCount = count;
          await job.save();
        }

        return {
          _id: job._id.toString(),
          title: job.title,
          department: job.department,
          type: job.type,
          location: job.location,
          description: job.description,
          requirements: job.requirements,
          customQuestions: job.customQuestions,
          status: job.status,
          applicantCount: count,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
        };
      })
    );

    return NextResponse.json({ success: true, jobs: syncedJobs }, { status: 200 });
  } catch (error) {
    console.error("API GET Hiring Jobs Error:", error);
    return NextResponse.json({ success: false, message: "Database fetch failed", error: error.message }, { status: 550 });
  }
}

// POST a new vacancy
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { title, department, type, location, description, requirements, customQuestions } = body;

    if (!title || !department || !description) {
      return NextResponse.json({ message: "Missing required fields: Title, Department, and Description are required." }, { status: 400 });
    }

    const newJob = new Job({
      title: title.trim(),
      department: department.trim(),
      type: type || "Full-Time",
      location: location || "Remote",
      description: description.trim(),
      requirements: Array.isArray(requirements) ? requirements : [],
      customQuestions: Array.isArray(customQuestions) ? customQuestions : [],
      status: "Open",
      applicantCount: 0,
    });

    await newJob.save();

    return NextResponse.json({
      success: true,
      message: "Job vacancy protocol deployed successfully.",
      job: {
        _id: newJob._id.toString(),
        title: newJob.title,
        department: newJob.department,
        type: newJob.type,
        location: newJob.location,
        description: newJob.description,
        requirements: newJob.requirements,
        customQuestions: newJob.customQuestions,
        status: newJob.status,
        applicantCount: 0,
        createdAt: newJob.createdAt,
        updatedAt: newJob.updatedAt,
      }
    }, { status: 201 });
  } catch (error) {
    console.error("API POST Hiring Job Error:", error);
    return NextResponse.json({ success: false, message: "Failed to deploy vacancy signal", error: error.message }, { status: 500 });
  }
}
