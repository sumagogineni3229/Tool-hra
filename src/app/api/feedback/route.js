import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Feedback from "@/lib/models/Feedback";
import User from "@/lib/models/User";
import { verifyToken } from "@/lib/auth";
import mongoose from "mongoose";

// GET feedbacks - HR/Admin see all (anonymized where appropriate), Employees see their own
export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const emailParam = searchParams.get("email");

    // Attempt to verify session from token cookie
    const token = request.cookies.get("token")?.value;
    let payload = null;
    if (token) {
      payload = await verifyToken(token);
    }

    let role = null;
    let userId = null;
    let userEmail = null;

    if (payload) {
      role = payload.role;
      userId = payload.id;
      userEmail = payload.email;
    } else if (emailParam) {
      const email = emailParam.toLowerCase().trim();
      const user = await User.findOne({ email });
      if (user) {
        role = user.role;
        userId = user._id.toString();
        userEmail = user.email;
      }
    }

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized. Session expired or missing user identifier." }, { status: 401 });
    }

    let feedbacksList = [];
    if (role === "HR" || role === "Admin") {
      // HR and Admin view: Fetch all feedback tickets
      feedbacksList = await Feedback.find({}).sort({ createdAt: -1 });

      // Anonymization / Stealth Protocol
      feedbacksList = feedbacksList.map((t) => {
        const ticketObj = t.toObject();
        if (ticketObj.isAnonymous) {
          return {
            ...ticketObj,
            userId: null,
            userName: "Anonymous",
            userEmail: "anonymous@hraconnect.com",
            employeeDetails: {
              name: "Protected Submitter",
              employeeId: "PROT-XXXX",
              department: "Protected",
              role: "Protected",
              workLocation: "Protected"
            }
          };
        }
        return ticketObj;
      });
    } else {
      // Employee / Intern / Manager view: Fetch only their own tickets
      const queryId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
      feedbacksList = await Feedback.find({ userId: queryId }).sort({ createdAt: -1 }).lean();
    }

    return NextResponse.json({ success: true, feedbacks: feedbacksList }, { status: 200 });
  } catch (error) {
    console.error("API GET Feedback Error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch feedback logs", error: error.message }, { status: 500 });
  }
}

// POST new feedback ticket
export async function POST(request) {
  try {
    await dbConnect();

    // Attempt to verify session from token cookie
    const token = request.cookies.get("token")?.value;
    let payload = null;
    if (token) {
      payload = await verifyToken(token);
    }

    const body = await request.json();
    const { 
      category, 
      subject, 
      content, 
      suggestions, 
      ratings, 
      priority, 
      allowHRContact, 
      employeeDetails, 
      attachments, 
      isAnonymous,
      email 
    } = body;

    let activeUserId = null;
    let activeUserEmail = null;
    let activeUserName = null;

    if (payload) {
      activeUserId = payload.id;
      activeUserEmail = payload.email;
      activeUserName = payload.name;
      if (!activeUserName) {
        const dbUser = await User.findById(activeUserId);
        if (dbUser) {
          activeUserName = dbUser.name;
        }
      }
    } else {
      const emailToLookup = (email || "").toLowerCase().trim();
      if (!emailToLookup) {
        return NextResponse.json({ message: "Unauthorized or missing user identifier" }, { status: 401 });
      }
      const user = await User.findOne({ email: emailToLookup });
      if (!user) {
        return NextResponse.json({ message: "User not found" }, { status: 404 });
      }
      activeUserId = user._id;
      activeUserEmail = user.email;
      activeUserName = user.name;
    }

    if (!category || !subject || !content) {
      return NextResponse.json({ message: "Missing required fields: category, subject, and content are required." }, { status: 400 });
    }

    // Auto-generate ticketId
    const ticketId = "#TKT-" + Math.floor(100000 + Math.random() * 900000);

    // Auto-calculate sentiment based on sentiment scores
    const scores = ratings || { jobSatisfaction: 3, workEnvironment: 3, managementSupport: 3, growthOpportunities: 3 };
    const avgScore = (Number(scores.jobSatisfaction) + Number(scores.workEnvironment) + Number(scores.managementSupport) + Number(scores.growthOpportunities)) / 4;
    let sentiment = "Neutral";
    if (avgScore >= 3.8) {
      sentiment = "Positive";
    } else if (avgScore <= 2.2) {
      sentiment = "Negative";
    }

    const newTicket = await Feedback.create({
      userId: activeUserId,
      userEmail: activeUserEmail,
      userName: activeUserName,
      ticketId,
      isAnonymous: Boolean(isAnonymous),
      category,
      subject,
      content,
      suggestions: suggestions || "",
      ratings: {
        jobSatisfaction: Number(scores.jobSatisfaction) || 0,
        workEnvironment: Number(scores.workEnvironment) || 0,
        managementSupport: Number(scores.managementSupport) || 0,
        growthOpportunities: Number(scores.growthOpportunities) || 0,
      },
      priority: priority || "Medium",
      sentiment,
      status: "Pending",
      isSeen: false,
      escalationLevel: 0,
      allowHRContact: Boolean(allowHRContact),
      employeeDetails: {
        name: (employeeDetails?.name || "").trim() || activeUserName,
        employeeId: (employeeDetails?.employeeId || "").trim() || ("EMP-" + String(activeUserId).slice(-4).toUpperCase()),
        department: (employeeDetails?.department || "").trim() || "Operations",
        role: (employeeDetails?.role || "").trim() || "Staff",
        workLocation: employeeDetails?.workLocation || "Office"
      },
      attachments: attachments || [],
      replies: [],
    });

    return NextResponse.json({ success: true, message: "Feedback ticket submitted successfully", ticket: newTicket }, { status: 201 });
  } catch (error) {
    console.error("API POST Feedback Error:", error);
    return NextResponse.json({ success: false, message: "Failed to submit feedback", error: error.message }, { status: 500 });
  }
}

// PATCH update status, seen flag, escalation levels or append reply
export async function PATCH(request) {
  try {
    await dbConnect();

    // Attempt to verify session from token cookie
    const token = request.cookies.get("token")?.value;
    let payload = null;
    if (token) {
      payload = await verifyToken(token);
    }

    const body = await request.json();
    const { id, status, response: replyText, markSeen, escalationLevel, email } = body;

    let activeUserId = null;
    let activeUserRole = null;
    let activeUserName = null;

    if (payload) {
      activeUserId = payload.id;
      activeUserRole = payload.role;
      activeUserName = payload.name;
      if (!activeUserName) {
        const dbUser = await User.findById(activeUserId);
        if (dbUser) {
          activeUserName = dbUser.name;
        }
      }
    } else {
      const emailToLookup = (email || "").toLowerCase().trim();
      if (!emailToLookup) {
        return NextResponse.json({ message: "Unauthorized or missing user identifier" }, { status: 401 });
      }
      const user = await User.findOne({ email: emailToLookup });
      if (!user) {
        return NextResponse.json({ message: "User not found" }, { status: 404 });
      }
      activeUserId = user._id;
      activeUserRole = user.role;
      activeUserName = user.name;
    }

    if (activeUserRole !== "HR" && activeUserRole !== "Admin") {
      return NextResponse.json({ message: "Forbidden. HR or Admin privileges required." }, { status: 403 });
    }

    if (!id) {
      return NextResponse.json({ message: "Missing feedback ticket ID." }, { status: 400 });
    }

    const ticket = await Feedback.findById(id);
    if (!ticket) {
      return NextResponse.json({ message: "Feedback ticket not found." }, { status: 404 });
    }

    if (markSeen) {
      ticket.isSeen = true;
    }

    if (status) {
      ticket.status = status;
    }

    if (escalationLevel !== undefined) {
      ticket.escalationLevel = Number(escalationLevel);
    }

    if (replyText && replyText.trim()) {
      ticket.replies.push({
        userId: activeUserId,
        userName: activeUserName,
        userRole: activeUserRole,
        message: replyText.trim(),
      });
    }

    await ticket.save();

    let returnedTicket = ticket.toObject();
    if (returnedTicket.isAnonymous) {
      returnedTicket = {
        ...returnedTicket,
        userId: null,
        userName: "Anonymous",
        userEmail: "anonymous@hraconnect.com",
        employeeDetails: {
          name: "Protected Submitter",
          employeeId: "PROT-XXXX",
          department: "Protected",
          role: "Protected",
          workLocation: "Protected"
        }
      };
    }

    return NextResponse.json({ success: true, message: "Feedback ticket updated successfully", feedback: returnedTicket }, { status: 200 });
  } catch (error) {
    console.error("API PATCH Feedback Error:", error);
    return NextResponse.json({ success: false, message: "Failed to update feedback ticket", error: error.message }, { status: 500 });
  }
}
