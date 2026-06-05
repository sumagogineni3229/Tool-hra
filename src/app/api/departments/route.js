import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Department from "@/lib/models/Department";
import User from "@/lib/models/User";
import Team from "@/lib/models/Team";
import { verifyToken } from "@/lib/auth";

// GET all departments
export async function GET() {
  try {
    await dbConnect();
    const list = await Department.find({}).sort({ name: 1 });
    
    const formatted = list.map((d) => ({
      id: d._id.toString(),
      name: d.name,
      description: d.description,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }));

    return NextResponse.json(formatted, { status: 200 });
  } catch (error) {
    console.error("API GET Departments Error:", error);
    return NextResponse.json({ success: false, message: "Database fetch failed", error: error.message }, { status: 500 });
  }
}

// Helper to authorize HR/Admin roles
async function authorizeHRorAdmin(request) {
  // Try cookie first
  const token = request.cookies.get("token")?.value;
  let payload = null;
  if (token) {
    try {
      payload = await verifyToken(token);
    } catch (err) {
      console.warn("Token verification failed in Departments authorization:", err.message);
    }
  }

  let role = null;
  if (payload) {
    role = payload.role;
  } else {
    // If no token, check if they passed email as fallback/sync header/body or query param
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

// POST a new department (HR and Admin only)
export async function POST(request) {
  try {
    await dbConnect();

    const isAuthorized = await authorizeHRorAdmin(request);
    if (!isAuthorized) {
      // Wait, let's also read request body in case email is passed inside it for offline POST
      // Let's read the body and double check
      try {
        const bodyClone = await request.clone().json();
        if (bodyClone.email) {
          const user = await User.findOne({ email: bodyClone.email.toLowerCase().trim() });
          if (user && (user.role === "HR" || user.role === "Admin")) {
            // Authorized via body email
          } else {
            return NextResponse.json({ message: "Forbidden. HR or Admin credentials required to manage departments." }, { status: 403 });
          }
        } else {
          return NextResponse.json({ message: "Forbidden. HR or Admin credentials required to manage departments." }, { status: 403 });
        }
      } catch (e) {
        return NextResponse.json({ message: "Forbidden. HR or Admin credentials required to manage departments." }, { status: 403 });
      }
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ message: "Missing required fields: Name is required." }, { status: 400 });
    }

    // Check for existing department
    const existing = await Department.findOne({ name: name.trim() });
    if (existing) {
      return NextResponse.json({ message: "Department already exists." }, { status: 409 });
    }

    const newDept = new Department({
      name: name.trim(),
      description: description || "",
    });

    await newDept.save();

    return NextResponse.json({
      id: newDept._id.toString(),
      name: newDept.name,
      description: newDept.description,
      createdAt: newDept.createdAt,
      updatedAt: newDept.updatedAt,
    }, { status: 201 });
  } catch (error) {
    console.error("API POST Department Error:", error);
    return NextResponse.json({ success: false, message: "Failed to create department", error: error.message }, { status: 500 });
  }
}

// DELETE a department (HR and Admin only)
export async function DELETE(request) {
  try {
    await dbConnect();

    const isAuthorized = await authorizeHRorAdmin(request);
    if (!isAuthorized) {
      return NextResponse.json({ message: "Forbidden. HR or Admin credentials required to manage departments." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "ID query parameter is required." }, { status: 400 });
    }

    const deptToDelete = await Department.findById(id);
    if (!deptToDelete) {
      return NextResponse.json({ message: "Department not found." }, { status: 404 });
    }

    const deptName = deptToDelete.name;

    await Department.findByIdAndDelete(id);

    // Reassign teams and users to Operations
    const operationsDept = await Department.findOne({ name: "Operations" });
    const fallbackDeptId = operationsDept ? operationsDept._id : "Operations";

    // Update teams referencing this departmentId to fallbackDeptId
    await Team.updateMany(
      { departmentId: id },
      { $set: { departmentId: fallbackDeptId } }
    );

    // Update users referencing this department name to "Operations"
    await User.updateMany(
      { department: deptName },
      { $set: { department: "Operations" } }
    );

    return NextResponse.json({ success: true, message: "Department deleted successfully.", id }, { status: 200 });
  } catch (error) {
    console.error("API DELETE Department Error:", error);
    return NextResponse.json({ success: false, message: "Failed to delete department", error: error.message }, { status: 500 });
  }
}
