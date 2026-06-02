import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Team from "@/lib/models/Team";
import Department from "@/lib/models/Department";
import User from "@/lib/models/User";
import { verifyToken } from "@/lib/auth";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

// GET all teams populated with department, manager, and members
export async function GET() {
  try {
    await dbConnect();
    const list = await Team.find({})
      .populate("departmentId")
      .populate("managerId")
      .populate("members")
      .sort({ name: 1 });

    const formatted = list.map((t) => {
      // Safely resolve values if they are populated objects or remain IDs/null
      const deptObj = t.departmentId && typeof t.departmentId === "object" ? {
        id: t.departmentId._id?.toString(),
        name: t.departmentId.name,
      } : t.departmentId;

      const managerObj = t.managerId && typeof t.managerId === "object" ? {
        id: t.managerId._id?.toString(),
        name: t.managerId.name,
        email: t.managerId.email,
        role: t.managerId.role,
        initials: t.managerId.initials,
        badgeColor: t.managerId.badgeColor,
      } : t.managerId;

      const membersArr = Array.isArray(t.members) ? t.members.map((m) => {
        return m && typeof m === "object" ? {
          id: m._id?.toString(),
          name: m.name,
          email: m.email,
          role: m.role,
          initials: m.initials,
          badgeColor: m.badgeColor,
          session: m.session,
        } : m;
      }) : [];

      return {
        id: t._id.toString(),
        name: t.name,
        departmentId: deptObj,
        managerId: managerObj,
        members: membersArr,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      };
    });

    return NextResponse.json(formatted, { status: 200 });
  } catch (error) {
    console.error("API GET Teams Error:", error);
    return NextResponse.json({ success: false, message: "Database fetch failed", error: error.message }, { status: 500 });
  }
}

// Helper to authorize HR/Admin roles
async function authorizeHRorAdmin(request) {
  const token = request.cookies.get("token")?.value;
  let payload = null;
  if (token) {
    try {
      payload = await verifyToken(token);
    } catch (err) {
      console.warn("Token verification failed in Teams authorization:", err.message);
    }
  }

  let role = null;
  if (payload) {
    role = payload.role;
  } else {
    const { searchParams } = new URL(request.url);
    const emailParam = searchParams.get("email");
    if (emailParam) {
      const user = await User.findOne({ email: emailParam.toLowerCase().trim() });
      if (user) {
        role = user.role;
      }
    }
  }
  return role === "HR" || role === "Admin";
}

// POST a new team (HR and Admin only)
export async function POST(request) {
  try {
    await dbConnect();

    const isAuthorized = await authorizeHRorAdmin(request);
    if (!isAuthorized) {
      try {
        const bodyClone = await request.clone().json();
        if (bodyClone.email) {
          const user = await User.findOne({ email: bodyClone.email.toLowerCase().trim() });
          if (user && (user.role === "HR" || user.role === "Admin")) {
            // Authorized via body email
          } else {
            return NextResponse.json({ message: "Forbidden. HR or Admin credentials required to manage teams." }, { status: 403 });
          }
        } else {
          return NextResponse.json({ message: "Forbidden. HR or Admin credentials required to manage teams." }, { status: 403 });
        }
      } catch (e) {
        return NextResponse.json({ message: "Forbidden. HR or Admin credentials required to manage teams." }, { status: 403 });
      }
    }

    const body = await request.json();
    const { name, departmentId, managerId, members } = body;

    if (!name || !departmentId || !managerId) {
      return NextResponse.json({ message: "Missing required fields: Name, Department, and Manager are required." }, { status: 400 });
    }

    // Check for existing team
    const existing = await Team.findOne({ name: name.trim() });
    if (existing) {
      return NextResponse.json({ message: "Team name already exists." }, { status: 409 });
    }

    const newTeam = new Team({
      name: name.trim(),
      departmentId,
      managerId,
      members: members || [],
    });

    await newTeam.save();

    // Synchronize users' department fields
    let deptName = "";
    if (mongoose.Types.ObjectId.isValid(departmentId)) {
      const dept = await Department.findById(departmentId);
      if (dept) {
        deptName = dept.name;
      }
    } else {
      // If it is a string ID (for offline sync) or otherwise, try to find it by name or value
      const dept = await Department.findOne({ name: departmentId });
      if (dept) {
        deptName = dept.name;
      } else {
        deptName = departmentId; // fallback to the value itself
      }
    }

    if (deptName) {
      const allAssigned = [managerId, ...(members || [])];
      const validUserIds = allAssigned.filter((uid) => mongoose.Types.ObjectId.isValid(uid));
      if (validUserIds.length > 0) {
        await User.updateMany({ _id: { $in: validUserIds } }, { department: deptName });
      }
    }

    return NextResponse.json({
      id: newTeam._id.toString(),
      name: newTeam.name,
      departmentId,
      managerId,
      members: newTeam.members,
      createdAt: newTeam.createdAt,
      updatedAt: newTeam.updatedAt,
    }, { status: 201 });
  } catch (error) {
    console.error("API POST Team Error:", error);
    return NextResponse.json({ success: false, message: "Failed to create team", error: error.message }, { status: 500 });
  }
}

// PUT (update) a team (HR and Admin only)
export async function PUT(request) {
  try {
    await dbConnect();

    const isAuthorized = await authorizeHRorAdmin(request);
    if (!isAuthorized) {
      try {
        const bodyClone = await request.clone().json();
        if (bodyClone.email) {
          const user = await User.findOne({ email: bodyClone.email.toLowerCase().trim() });
          if (user && (user.role === "HR" || user.role === "Admin")) {
            // Authorized
          } else {
            return NextResponse.json({ message: "Forbidden. HR or Admin credentials required to edit teams." }, { status: 403 });
          }
        } else {
          return NextResponse.json({ message: "Forbidden. HR or Admin credentials required to edit teams." }, { status: 403 });
        }
      } catch (e) {
        return NextResponse.json({ message: "Forbidden. HR or Admin credentials required to edit teams." }, { status: 403 });
      }
    }

    const body = await request.json();
    const { id, name, departmentId, managerId, members } = body;

    if (!id || !name || !departmentId || !managerId) {
      return NextResponse.json({ message: "Missing required fields: ID, Name, Department, and Manager are required." }, { status: 400 });
    }

    const team = await Team.findById(id);
    if (!team) {
      return NextResponse.json({ message: "Team not found." }, { status: 404 });
    }

    // Capture old members & manager for department reset
    const oldManager = team.managerId;
    const oldMembers = team.members || [];
    const oldUsers = [oldManager, ...oldMembers].map((uid) => uid.toString());

    // Update team
    team.name = name.trim();
    team.departmentId = departmentId;
    team.managerId = managerId;
    team.members = members || [];
    await team.save();

    // Find new department name
    let deptName = "";
    if (mongoose.Types.ObjectId.isValid(departmentId)) {
      const dept = await Department.findById(departmentId);
      if (dept) {
        deptName = dept.name;
      }
    } else {
      const dept = await Department.findOne({ name: departmentId });
      if (dept) {
        deptName = dept.name;
      } else {
        deptName = departmentId;
      }
    }

    if (deptName) {
      // Calculate which users were removed
      const newUsers = [managerId, ...(members || [])].map((uid) => uid.toString());
      const removedUsers = oldUsers.filter((uid) => !newUsers.includes(uid));

      // Reset removed users' department field back to Operations
      const validRemovedIds = removedUsers.filter((uid) => mongoose.Types.ObjectId.isValid(uid));
      if (validRemovedIds.length > 0) {
        await User.updateMany({ _id: { $in: validRemovedIds } }, { department: "Operations" });
      }

      // Update current users to the team's department
      const validNewIds = newUsers.filter((uid) => mongoose.Types.ObjectId.isValid(uid));
      if (validNewIds.length > 0) {
        await User.updateMany({ _id: { $in: validNewIds } }, { department: deptName });
      }
    }

    return NextResponse.json({
      id: team._id.toString(),
      name: team.name,
      departmentId,
      managerId,
      members: team.members,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
    }, { status: 200 });
  } catch (error) {
    console.error("API PUT Team Error:", error);
    return NextResponse.json({ success: false, message: "Failed to update team", error: error.message }, { status: 500 });
  }
}

// DELETE a team (HR and Admin only)
export async function DELETE(request) {
  try {
    await dbConnect();

    const isAuthorized = await authorizeHRorAdmin(request);
    if (!isAuthorized) {
      return NextResponse.json({ message: "Forbidden. HR or Admin credentials required to manage teams." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "ID query parameter is required." }, { status: 400 });
    }

    const team = await Team.findById(id);
    if (!team) {
      return NextResponse.json({ message: "Team not found." }, { status: 404 });
    }

    // Reset all team users' department fields to Operations before deleting
    const oldUsers = [team.managerId, ...(team.members || [])].map((uid) => uid.toString());
    const validUserIds = oldUsers.filter((uid) => mongoose.Types.ObjectId.isValid(uid));
    if (validUserIds.length > 0) {
      await User.updateMany({ _id: { $in: validUserIds } }, { department: "Operations" });
    }

    await Team.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: "Team deleted successfully.", id }, { status: 200 });
  } catch (error) {
    console.error("API DELETE Team Error:", error);
    return NextResponse.json({ success: false, message: "Failed to delete team", error: error.message }, { status: 500 });
  }
}
