import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Report from "@/lib/models/Report";
import User from "@/lib/models/User";
import Announcement from "@/lib/models/Announcement";
import Team from "@/lib/models/Team";
import { verifyToken } from "@/lib/auth";

// Helper: send a notification announcement to a specific user
async function sendNotification({ title, content, targetUserEmail, targetRole = "Employee", createdByName = "System", createdByEmail = "system@hraconnect.com", createdByRole = "System" }) {
  try {
    await Announcement.create({
      title,
      content,
      category: "General",
      priority: "Medium",
      createdByName,
      createdByEmail,
      createdByRole,
      targetRole,
      targetUserEmail: targetUserEmail || "",
      pinned: false,
    });
  } catch (err) {
    console.warn("Failed to create notification announcement:", err.message);
  }
}

// GET: Fetch reports based on role
export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const emailParam = searchParams.get("email");
    const statusFilter = searchParams.get("status") || "";
    const projectFilter = searchParams.get("project") || "";
    const employeeFilter = searchParams.get("employee") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";

    const token = request.cookies.get("token")?.value;
    let payload = null;
    if (token) {
      payload = await verifyToken(token);
    }

    let email = emailParam ? emailParam.toLowerCase().trim() : null;
    let role = null;

    if (payload) {
      email = payload.email.toLowerCase().trim();
      role = payload.role;
    } else if (email) {
      const user = await User.findOne({ email });
      if (user) {
        role = user.role;
      }
    }

    if (!email) {
      return NextResponse.json({ message: "Unauthorized or missing email context" }, { status: 401 });
    }

    let query = {};

    if (role === "Employee" || role === "Intern") {
      // Employees/Interns see only their own reports
      query.employeeEmail = email;
    } else if (role === "Manager") {
      // Step 1: get this manager's User document to get their _id
      const managerUser = await User.findOne({ email });

      let memberEmails = [];

      if (managerUser) {
        // Step 2: find all teams where this manager is assigned
        const teams = await Team.find({
          $or: [
            { managerId: managerUser._id },
            { managerId: managerUser._id.toString() }
          ]
        });

        // Step 3: collect all member ObjectIds
        const memberIds = teams.flatMap(t => t.members || []).map(m => m.toString());

        // Step 4: resolve member emails
        if (memberIds.length > 0) {
          const memberUsers = await User.find({ _id: { $in: memberIds } }, { email: 1 });
          memberEmails = memberUsers.map(u => u.email.toLowerCase().trim());
        }
      }

      if (memberEmails.length > 0) {
        // Teams are configured — show reports from team members + any report that has this managerEmail
        query.$or = [
          { managerEmail: email },
          { employeeEmail: { $in: memberEmails } }
        ];
      } else {
        // No teams configured yet (or employee not in any team) —
        // fall back: show ALL reports from Employee/Intern roles so manager can see everything
        query.$or = [
          { managerEmail: email },
          { employeeRole: { $in: ["Employee", "Intern"] } }
        ];
      }
    } else if (role === "Admin" || role === "HR") {
      // Admin/HR see all reports
      query = {};
    } else {
      query.employeeEmail = email;
    }

    // Apply optional filters
    if (statusFilter) query.status = statusFilter;
    if (projectFilter) query.projectName = { $regex: projectFilter, $options: "i" };
    if (employeeFilter) query.employeeName = { $regex: employeeFilter, $options: "i" };
    if (dateFrom || dateTo) {
      query.reportDate = {};
      if (dateFrom) query.reportDate.$gte = new Date(dateFrom);
      if (dateTo) query.reportDate.$lte = new Date(dateTo);
    }

    const reports = await Report.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, reports }, { status: 200 });
  } catch (error) {
    console.error("API GET Reports Error:", error);
    return NextResponse.json({ message: "Failed to fetch reports", error: error.message }, { status: 500 });
  }
}

// POST: Create or submit a new report
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const {
      employeeEmail,
      employeeName,
      employeeRole,
      projectId,
      projectName,
      reportDate,
      workCompleted,
      challenges,
      progressPercentage,
      tomorrowPlan,
      hoursWorked,
      attachment,
      status, // "Draft" or "Pending Review"
    } = body;

    if (!employeeEmail || !workCompleted) {
      return NextResponse.json({ message: "Employee email and work completed are required" }, { status: 400 });
    }

    // Resolve employee
    const employeeUser = await User.findOne({ email: employeeEmail.toLowerCase().trim() });
    const employeeId = employeeUser?._id || null;

    // Resolve manager via Team membership (Team.members stores plain ObjectId refs)
    let managerEmail = "";
    let managerName = "";
    let managerId = null;
    if (employeeUser) {
      const team = await Team.findOne({ members: employeeUser._id });
      if (team?.managerId) {
        const mgr = await User.findById(team.managerId);
        if (mgr) {
          managerEmail = mgr.email;
          managerName = mgr.name || "";
          managerId = mgr._id;
        }
      }
    }

    const reportStatus = status || "Draft";
    const newReport = await Report.create({
      employeeId,
      employeeName: employeeName || "Unknown",
      employeeEmail: employeeEmail.toLowerCase().trim(),
      employeeRole: employeeRole || "Employee",
      managerId,
      managerEmail,
      managerName,
      projectId: projectId || null,
      projectName: projectName || "",
      reportDate: reportDate ? new Date(reportDate) : new Date(),
      workCompleted,
      challenges: challenges || "",
      progressPercentage: progressPercentage || 0,
      tomorrowPlan: tomorrowPlan || "",
      hoursWorked: hoursWorked || 8,
      attachment: attachment || null,
      status: reportStatus,
      managerFeedback: "",
    });

    // If submitted (not draft), notify the manager
    if (reportStatus === "Pending Review" && managerEmail) {
      await sendNotification({
        title: `New Report Submitted by ${employeeName || employeeEmail}`,
        content: `${employeeName || employeeEmail} has submitted a daily work report for ${new Date(reportDate).toLocaleDateString("en-US", { dateStyle: "medium" })}. Project: ${projectName || "N/A"}. Please review it in your Reports dashboard.`,
        targetUserEmail: managerEmail,
        targetRole: "Manager",
        createdByName: employeeName || "Employee",
        createdByEmail: employeeEmail,
        createdByRole: employeeRole || "Employee",
      });
    }

    return NextResponse.json({ success: true, message: "Report saved successfully", report: newReport }, { status: 201 });
  } catch (error) {
    console.error("API POST Reports Error:", error);
    return NextResponse.json({ message: "Failed to create report", error: error.message }, { status: 500 });
  }
}

// PUT: Update a report (employee edits draft; manager approves/rejects/adds feedback)
export async function PUT(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const {
      id,
      // Employee edits
      projectId,
      projectName,
      workCompleted,
      challenges,
      progressPercentage,
      tomorrowPlan,
      hoursWorked,
      attachment,
      status,
      // Manager actions
      managerFeedback,
      reviewerEmail,
      reviewerName,
    } = body;

    if (!id) {
      return NextResponse.json({ message: "Report ID is required" }, { status: 400 });
    }

    const report = await Report.findById(id);
    if (!report) {
      return NextResponse.json({ message: "Report not found" }, { status: 404 });
    }

    const isManagerAction = reviewerEmail && (status === "Approved" || status === "Rejected");
    const isFeedbackOnly = reviewerEmail && managerFeedback !== undefined && !isManagerAction;

    if (isManagerAction || isFeedbackOnly) {
      // Manager updating status or adding feedback
      if (managerFeedback !== undefined) report.managerFeedback = managerFeedback;
      if (status && (status === "Approved" || status === "Rejected")) {
        report.status = status;
        report.reviewedAt = new Date();
      }

      await report.save();

      // Notify the employee
      const notifTitle = isManagerAction
        ? `Your Report has been ${status}`
        : `Manager added feedback on your report`;
      const notifContent = isManagerAction
        ? `Your daily report for ${new Date(report.reportDate).toLocaleDateString("en-US", { dateStyle: "medium" })} has been ${status.toLowerCase()} by ${reviewerName || reviewerEmail}.${managerFeedback ? ` Feedback: ${managerFeedback}` : ""}`
        : `${reviewerName || reviewerEmail} has added feedback to your report for ${new Date(report.reportDate).toLocaleDateString("en-US", { dateStyle: "medium" })}: "${managerFeedback}"`;

      await sendNotification({
        title: notifTitle,
        content: notifContent,
        targetUserEmail: report.employeeEmail,
        targetRole: report.employeeRole || "Employee",
        createdByName: reviewerName || "Manager",
        createdByEmail: reviewerEmail,
        createdByRole: "Manager",
      });
    } else {
      // Employee editing their own report (only allowed if Draft or Pending Review)
      if (report.status === "Approved" || report.status === "Rejected") {
        return NextResponse.json({ message: "Cannot edit a reviewed report" }, { status: 403 });
      }
      if (projectId !== undefined) report.projectId = projectId;
      if (projectName !== undefined) report.projectName = projectName;
      if (workCompleted !== undefined) report.workCompleted = workCompleted;
      if (challenges !== undefined) report.challenges = challenges;
      if (progressPercentage !== undefined) report.progressPercentage = progressPercentage;
      if (tomorrowPlan !== undefined) report.tomorrowPlan = tomorrowPlan;
      if (hoursWorked !== undefined) report.hoursWorked = hoursWorked;
      if (attachment !== undefined) report.attachment = attachment;
      if (status !== undefined) {
        report.status = status;
        // If submitting, notify manager
        if (status === "Pending Review" && report.managerEmail) {
          await sendNotification({
            title: `Report Submitted by ${report.employeeName}`,
            content: `${report.employeeName} has submitted their daily work report for ${new Date(report.reportDate).toLocaleDateString("en-US", { dateStyle: "medium" })}. Please review it in your Reports dashboard.`,
            targetUserEmail: report.managerEmail,
            targetRole: "Manager",
            createdByName: report.employeeName,
            createdByEmail: report.employeeEmail,
            createdByRole: report.employeeRole,
          });
        }
      }
      await report.save();
    }

    return NextResponse.json({ success: true, message: "Report updated successfully", report }, { status: 200 });
  } catch (error) {
    console.error("API PUT Reports Error:", error);
    return NextResponse.json({ message: "Failed to update report", error: error.message }, { status: 500 });
  }
}

// DELETE: Delete a draft report
export async function DELETE(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "Report ID is required" }, { status: 400 });
    }

    const report = await Report.findById(id);
    if (!report) {
      return NextResponse.json({ message: "Report not found" }, { status: 404 });
    }

    if (report.status !== "Draft") {
      return NextResponse.json({ message: "Only draft reports can be deleted" }, { status: 403 });
    }

    await Report.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Report deleted" }, { status: 200 });
  } catch (error) {
    console.error("API DELETE Reports Error:", error);
    return NextResponse.json({ message: "Failed to delete report", error: error.message }, { status: 500 });
  }
}
