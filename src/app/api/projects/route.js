import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Project from "@/lib/models/Project";
import User from "@/lib/models/User";
import Team from "@/lib/models/Team";
import { verifyToken } from "@/lib/auth";

// GET: Fetch projects for the logged-in user or based on role
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

    let projects = [];

    if (role === "Manager") {
      // Managers see projects they assigned/created
      projects = await Project.find({
        $or: [
          { assignedBy: userId },
          { assignedByEmail: email }
        ]
      }).sort({ createdAt: -1 });
    } else if (role === "Employee" || role === "Intern") {
      // Employees/Interns see projects they are assigned to
      projects = await Project.find({
        "assignedMembers.email": email
      }).sort({ createdAt: -1 });
    } else if (role === "Admin" || role === "HR") {
      // Admins and HR see all projects
      projects = await Project.find({}).sort({ createdAt: -1 });
    } else {
      // Fallback: search by member email anyway
      projects = await Project.find({
        "assignedMembers.email": email
      }).sort({ createdAt: -1 });
    }

    return NextResponse.json({ success: true, projects }, { status: 200 });
  } catch (error) {
    console.error("API GET Projects Error:", error);
    return NextResponse.json({ message: "Failed to fetch projects", error: error.message }, { status: 500 });
  }
}

// POST: Create a new project (Manager/Admin/HR only)
export async function POST(request) {
  try {
    await dbConnect();
    const token = request.cookies.get("token")?.value;
    let payload = null;
    if (token) {
      payload = await verifyToken(token);
    }

    const body = await request.json();
    const { name, description, startDate, dueDate, priority, assignedMembers, attachedFiles, managerEmail } = body;

    let creatorEmail = managerEmail ? managerEmail.toLowerCase().trim() : null;
    let creatorId = null;
    let creatorName = "Manager";

    if (payload) {
      creatorEmail = payload.email.toLowerCase().trim();
      creatorId = payload.id;
      creatorName = payload.name || "Manager";
    } else if (creatorEmail) {
      const user = await User.findOne({ email: creatorEmail });
      if (user) {
        creatorId = user._id;
        creatorName = user.name;
      }
    }

    if (!creatorId || !creatorEmail) {
      return NextResponse.json({ message: "Unauthorized or manager context not resolved" }, { status: 401 });
    }

    const timeline = [
      {
        text: `Project created by ${creatorName}`,
        user: creatorEmail,
        createdAt: new Date()
      }
    ];

    const newProject = await Project.create({
      name,
      description: description || "",
      assignedBy: creatorId,
      assignedByEmail: creatorEmail,
      assignedMembers: assignedMembers || [],
      startDate: startDate ? new Date(startDate) : null,
      dueDate: dueDate ? new Date(dueDate) : null,
      priority: priority || "Medium",
      status: "Not Started",
      progress: 0,
      attachedFiles: attachedFiles || [],
      comments: [],
      deliverables: [],
      activityTimeline: timeline
    });

    return NextResponse.json({ success: true, message: "Project created successfully", project: newProject }, { status: 201 });
  } catch (error) {
    console.error("API POST Projects Error:", error);
    return NextResponse.json({ message: "Failed to create project", error: error.message }, { status: 500 });
  }
}

// PUT: Update project status, progress, comment, deliverables, etc. (supports both manager and assignees)
export async function PUT(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const {
      id,
      name,
      description,
      startDate,
      dueDate,
      priority,
      status,
      progress,
      assignedMembers,
      attachedFiles,
      comment,
      deliverable,
      memberEmail,
      contributionProgress,
      updaterEmail
    } = body;

    if (!id) {
      return NextResponse.json({ message: "Project ID is required" }, { status: 400 });
    }

    const project = await Project.findById(id);
    if (!project) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 });
    }

    const userEmail = updaterEmail || "system@hraconnect.com";

    // Track timeline updates
    const newTimelineEntries = [];

    // 1. Check if adding a comment
    if (comment) {
      project.comments.push({
        author: comment.author || "User",
        email: comment.email || userEmail,
        text: comment.text,
        createdAt: new Date()
      });
      newTimelineEntries.push({
        text: `Comment added by ${comment.author || userEmail}`,
        user: userEmail
      });
    }

    // 2. Check if submitting a deliverable
    if (deliverable) {
      project.deliverables.push({
        name: deliverable.name,
        url: deliverable.url,
        size: deliverable.size,
        submittedBy: deliverable.submittedBy || userEmail,
        submittedAt: new Date()
      });
      newTimelineEntries.push({
        text: `Deliverable "${deliverable.name}" uploaded by ${deliverable.submittedBy || userEmail}`,
        user: userEmail
      });
    }

    // 3. Check if updating a member's individual contribution
    if (memberEmail && contributionProgress !== undefined) {
      const member = project.assignedMembers.find(
        m => m.email.toLowerCase().trim() === memberEmail.toLowerCase().trim()
      );
      if (member) {
        const oldVal = member.contributionProgress;
        member.contributionProgress = Number(contributionProgress);
        newTimelineEntries.push({
          text: `Contribution progress of ${member.name} updated from ${oldVal}% to ${contributionProgress}%`,
          user: userEmail
        });
      }
    }

    // 4. Update core project properties if provided
    if (name !== undefined) {
      if (project.name !== name) {
        newTimelineEntries.push({ text: `Project name updated to "${name}"`, user: userEmail });
        project.name = name;
      }
    }
    if (description !== undefined) project.description = description;
    if (startDate !== undefined) project.startDate = startDate ? new Date(startDate) : null;
    if (dueDate !== undefined) project.dueDate = dueDate ? new Date(dueDate) : null;
    if (priority !== undefined) {
      if (project.priority !== priority) {
        newTimelineEntries.push({ text: `Priority changed from ${project.priority} to ${priority}`, user: userEmail });
        project.priority = priority;
      }
    }
    if (status !== undefined) {
      if (project.status !== status) {
        newTimelineEntries.push({ text: `Status updated to "${status}"`, user: userEmail });
        project.status = status;
      }
    }
    if (progress !== undefined) {
      const oldProgress = project.progress;
      if (oldProgress !== Number(progress)) {
        newTimelineEntries.push({ text: `Progress updated from ${oldProgress}% to ${progress}%`, user: userEmail });
        project.progress = Number(progress);
      }
    }
    if (assignedMembers !== undefined) {
      project.assignedMembers = assignedMembers;
      newTimelineEntries.push({ text: `Assigned team members updated`, user: userEmail });
    }
    if (attachedFiles !== undefined) {
      project.attachedFiles = attachedFiles;
      newTimelineEntries.push({ text: `Attached files list updated`, user: userEmail });
    }

    // Add new timeline logs to schema array
    if (newTimelineEntries.length > 0) {
      newTimelineEntries.forEach(entry => {
        project.activityTimeline.push({
          text: entry.text,
          user: entry.user,
          createdAt: new Date()
        });
      });
    }

    const updatedProject = await project.save();

    return NextResponse.json({ success: true, message: "Project updated successfully", project: updatedProject }, { status: 200 });
  } catch (error) {
    console.error("API PUT Projects Error:", error);
    return NextResponse.json({ message: "Failed to update project", error: error.message }, { status: 500 });
  }
}

// DELETE: Delete a project (Manager/Admin/HR only)
export async function DELETE(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "Project ID is required" }, { status: 400 });
    }

    const deletedProject = await Project.findByIdAndDelete(id);
    if (!deletedProject) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Project deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("API DELETE Projects Error:", error);
    return NextResponse.json({ message: "Failed to delete project", error: error.message }, { status: 500 });
  }
}
