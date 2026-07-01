import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Task from "@/lib/models/Task";
import User from "@/lib/models/User";
import Team from "@/lib/models/Team";
import { verifyToken } from "@/lib/auth";
import mongoose from "mongoose";

// GET: Fetch tasks assigned to the current user (if employee/intern) or created by the current user (if manager/admin)
export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const emailParam = searchParams.get("email");

    const token = request.cookies.get("token")?.value;
    let payload = null;
    if (token) {
      payload = await verifyToken(token);
    }

    let email = emailParam ? emailParam.toLowerCase().trim() : null;
    let role = null;
    let userId = null;

    if (payload) {
      email = payload.email.toLowerCase().trim();
      role = payload.role;
      userId = payload.id;
    } else if (email) {
      const user = await User.findOne({ email });
      if (user) {
        role = user.role;
        userId = user._id;
      }
    }

    if (!email) {
      return NextResponse.json({ message: "Unauthorized or missing email context" }, { status: 401 });
    }

    let tasks = [];

    if (role === "Manager") {
      // Find all tasks assigned by this manager
      const queries = [{ assignedBy: userId }];
      if (mongoose.Types.ObjectId.isValid(userId)) {
        queries.push({ assignedBy: new mongoose.Types.ObjectId(userId) });
        queries.push({ assignedBy: userId.toString() });
      }
      tasks = await Task.find({
        $or: queries
      }).sort({ createdAt: -1 });
    } else if (role === "Employee" || role === "Intern") {
      // Find the teams where this user is a member
      const teams = await Team.find({ members: userId });
      const managerIds = teams.map(t => t.managerId);
      
      // Get manager emails
      const managers = await User.find({ _id: { $in: managerIds } });
      const managerEmails = managers.map(m => m.email.toLowerCase().trim());

      // Tasks for this employee/intern are:
      // 1. Directly assigned to their email
      // 2. Assigned to "all" with role "All" or their specific role, and created by one of their managers
      tasks = await Task.find({
        $or: [
          { assignedTo: email },
          {
            assignedTo: "all",
            assigneeRole: { $in: ["All", role] },
            $or: [
              { assignedBy: { $in: managerIds } },
              { assignedByEmail: { $in: managerEmails } }
            ]
          }
        ]
      }).sort({ createdAt: -1 });
    } else if (role === "Admin" || role === "HR") {
      // Admins and HR see all tasks
      tasks = await Task.find({}).sort({ createdAt: -1 });
    }

    return NextResponse.json({ tasks }, { status: 200 });
  } catch (error) {
    console.error("API GET Tasks Error:", error);
    return NextResponse.json({ message: "Failed to fetch tasks", error: error.message }, { status: 500 });
  }
}

// POST: Create a new task (Manager role only, or admin/HR)
export async function POST(request) {
  try {
    await dbConnect();
    const token = request.cookies.get("token")?.value;
    let payload = null;
    if (token) {
      payload = await verifyToken(token);
    }

    const body = await request.json();
    const { title, description, assignedTo, assigneeRole, dueDate, managerEmail } = body;

    let creatorEmail = managerEmail ? managerEmail.toLowerCase().trim() : null;
    let creatorId = null;

    if (payload) {
      creatorEmail = payload.email.toLowerCase().trim();
      creatorId = payload.id;
    } else if (creatorEmail) {
      const user = await User.findOne({ email: creatorEmail });
      if (user) {
        creatorId = user._id;
      }
    }

    if (!creatorId) {
      return NextResponse.json({ message: "Unauthorized or manager context not resolved" }, { status: 401 });
    }

    const newTask = await Task.create({
      title,
      description: description || "",
      assignedBy: creatorId,
      assignedByEmail: creatorEmail,
      assignedTo: assignedTo ? assignedTo.toLowerCase().trim() : "all",
      assigneeRole: assigneeRole || "All",
      dueDate: dueDate ? new Date(dueDate) : null,
      status: "pending",
      progress: 0,
      completionNotes: ""
    });

    return NextResponse.json({ message: "Task created successfully", task: newTask }, { status: 201 });
  } catch (error) {
    console.error("API POST Tasks Error:", error);
    return NextResponse.json({ message: "Failed to create task", error: error.message }, { status: 500 });
  }
}

// PUT: Update an existing task status, progress, and/or completion notes (Employee/Intern/Manager)
export async function PUT(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { id, status, progress, completionNotes, title, description, assignedTo, assigneeRole, dueDate } = body;

    if (!id) {
      return NextResponse.json({ message: "Task ID is required" }, { status: 400 });
    }

    const updateFields = {};
    if (status !== undefined) updateFields.status = status;
    if (progress !== undefined) updateFields.progress = Number(progress);
    if (completionNotes !== undefined) updateFields.completionNotes = completionNotes;
    if (title !== undefined) updateFields.title = title;
    if (description !== undefined) updateFields.description = description;
    if (assignedTo !== undefined) updateFields.assignedTo = assignedTo ? assignedTo.toLowerCase().trim() : "all";
    if (assigneeRole !== undefined) updateFields.assigneeRole = assigneeRole;
    if (dueDate !== undefined) updateFields.dueDate = dueDate ? new Date(dueDate) : null;

    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedTask) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Task updated successfully", task: updatedTask }, { status: 200 });
  } catch (error) {
    console.error("API PUT Tasks Error:", error);
    return NextResponse.json({ message: "Failed to update task", error: error.message }, { status: 500 });
  }
}

// DELETE: Delete a task (Manager or administrator)
export async function DELETE(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "Task ID is required" }, { status: 400 });
    }

    const deletedTask = await Task.findByIdAndDelete(id);
    if (!deletedTask) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Task deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("API DELETE Tasks Error:", error);
    return NextResponse.json({ message: "Failed to delete task", error: error.message }, { status: 500 });
  }
}
