import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Application from "@/lib/models/Application";
import Job from "@/lib/models/Job";

// GET all applications with populated Job data
export async function GET() {
  try {
    await dbConnect();
    
    // Find all applications and populate jobId details
    const list = await Application.find({})
      .populate("jobId", "title department type location")
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, applications: list }, { status: 200 });
  } catch (error) {
    console.error("API GET Hiring Applications Error:", error);
    return NextResponse.json({ success: false, message: "Database fetch failed", error: error.message }, { status: 550 });
  }
}

// POST a new application (public submission by candidate)
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { jobId, name, email, phone, coverLetter, resume, portfolio, answers } = body;

    if (!jobId || !name || !email || !phone || !resume) {
      return NextResponse.json({ message: "Missing required fields: jobId, name, email, phone, and resume are required." }, { status: 400 });
    }

    // Confirm that the job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return NextResponse.json({ message: "Target vacancy does not exist in context." }, { status: 404 });
    }

    const newApp = new Application({
      jobId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      coverLetter: (coverLetter || "").trim(),
      resume: resume.trim(),
      portfolio: (portfolio || "").trim(),
      answers: Array.isArray(answers) ? answers : [],
      status: "Applied",
      notes: "",
    });

    await newApp.save();

    // Increment Job applicant count field for double-safekeeping
    job.applicantCount = await Application.countDocuments({ jobId });
    await job.save();

    return NextResponse.json({
      success: true,
      message: "Application submitted successfully.",
      application: newApp,
    }, { status: 201 });
  } catch (error) {
    console.error("API POST Hiring Application Error:", error);
    return NextResponse.json({ success: false, message: "Failed to submit candidate application", error: error.message }, { status: 500 });
  }
}

// PATCH update status or notes on an application
export async function PATCH(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { id, status, notes } = body;

    if (!id) {
      return NextResponse.json({ message: "Missing required parameter: id is required." }, { status: 400 });
    }

    const app = await Application.findById(id).populate("jobId", "title department type location");
    if (!app) {
      return NextResponse.json({ message: "Application dossier not found." }, { status: 404 });
    }

    if (status) {
      app.status = status;
    }

    if (notes !== undefined) {
      app.notes = notes;
    }

    await app.save();

    return NextResponse.json({
      success: true,
      message: "Application dossier coordinated successfully.",
      application: app,
    }, { status: 200 });
  } catch (error) {
    console.error("API PATCH Hiring Application Error:", error);
    return NextResponse.json({ success: false, message: "Failed to coordinate status update", error: error.message }, { status: 500 });
  }
}
