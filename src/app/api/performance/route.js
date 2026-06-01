import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Performance from "@/lib/models/Performance";
import User from "@/lib/models/User";

// GET /api/performance - Fetch reviews
export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (email) {
      // Find latest performance review for this email
      const review = await Performance.findOne({ userEmail: email.toLowerCase().trim() })
        .sort({ createdAt: -1 })
        .lean();
      return NextResponse.json({ success: true, performance: review || null }, { status: 200 });
    }

    // Fetch all reviews
    const reviews = await Performance.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, performances: reviews }, { status: 200 });
  } catch (error) {
    console.error("API GET Performance Error:", error);
    return NextResponse.json({ success: false, message: "Database fetch failed", error: error.message }, { status: 500 });
  }
}

// POST /api/performance - Upsert a performance review
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const {
      email,
      productivity,
      qualityOfWork,
      collaboration,
      punctuality,
      managerFeedback,
      reviewedBy,
      reviewedByRole
    } = body;

    if (!email) {
      return NextResponse.json({ success: false, message: "Email is required" }, { status: 400 });
    }

    const targetEmail = email.toLowerCase().trim();
    
    // Find target user details
    const user = await User.findOne({ email: targetEmail });
    if (!user) {
      return NextResponse.json({ success: false, message: "Target user not found" }, { status: 404 });
    }

    if (user.role !== "Employee" && user.role !== "Intern") {
      return NextResponse.json({ success: false, message: "Performance reviews can only be filed for Employees or Interns" }, { status: 400 });
    }

    // Calculate overall rating score dynamically (average of competencies divided by 20 to fit 5-star scale)
    const pScore = Number(productivity) || 0;
    const qScore = Number(qualityOfWork) || 0;
    const cScore = Number(collaboration) || 0;
    const puScore = Number(punctuality) || 0;
    const avgScorePercent = (pScore + qScore + cScore + puScore) / 4;
    const overallScore = Number((avgScorePercent / 20).toFixed(2)); // e.g. 95% -> 4.75 stars

    // Upsert performance record
    let performanceRecord = await Performance.findOne({ userEmail: targetEmail });
    
    if (!performanceRecord) {
      performanceRecord = new Performance({
        userId: user._id,
        userEmail: targetEmail,
        userName: user.name,
        userRole: user.role,
        overallScore,
        productivity: pScore,
        qualityOfWork: qScore,
        collaboration: cScore,
        punctuality: puScore,
        managerFeedback: managerFeedback || "",
        reviewedBy: reviewedBy || "HR Specialist",
        reviewedByRole: reviewedByRole || "HR Manager",
        quarter: "Q2 2026"
      });
    } else {
      performanceRecord.overallScore = overallScore;
      performanceRecord.productivity = pScore;
      performanceRecord.qualityOfWork = qScore;
      performanceRecord.collaboration = cScore;
      performanceRecord.punctuality = puScore;
      performanceRecord.managerFeedback = managerFeedback || "";
      performanceRecord.reviewedBy = reviewedBy || "HR Specialist";
      performanceRecord.reviewedByRole = reviewedByRole || "HR Manager";
      performanceRecord.reviewDate = new Date();
    }

    await performanceRecord.save();

    return NextResponse.json({ success: true, message: "Performance review submitted successfully", performance: performanceRecord }, { status: 201 });
  } catch (error) {
    console.error("API POST Performance Error:", error);
    return NextResponse.json({ success: false, message: "Failed to submit performance review", error: error.message }, { status: 500 });
  }
}
