import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Announcement from "@/lib/models/Announcement";
import User from "@/lib/models/User";
import { verifyToken } from "@/lib/auth";

// GET all announcements sorted by pinned first, then newest
export async function GET() {
  try {
    await dbConnect();
    const list = await Announcement.find({}).sort({ pinned: -1, createdAt: -1 });
    
    const formatted = list.map((a) => ({
      id: a._id.toString(),
      title: a.title,
      content: a.content,
      category: a.category,
      priority: a.priority,
      createdByName: a.createdByName,
      createdByEmail: a.createdByEmail,
      createdByRole: a.createdByRole,
      targetRole: a.targetRole,
      pinned: a.pinned,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }));

    return NextResponse.json({ success: true, announcements: formatted }, { status: 200 });
  } catch (error) {
    console.error("API GET Announcements Error:", error);
    return NextResponse.json({ success: false, message: "Database fetch failed", error: error.message }, { status: 500 });
  }
}

// POST new announcement (HR and Admin only)
export async function POST(request) {
  try {
    await dbConnect();

    // Verify authentication from token cookie
    const token = request.cookies.get("token")?.value;
    let payload = null;
    if (token) {
      try {
        payload = await verifyToken(token);
      } catch (err) {
        console.warn("Token verification failed in Announcements POST:", err.message);
      }
    }

    const body = await request.json();
    const { title, content, category, priority, targetRole, pinned, email } = body;

    let activeUserEmail = null;
    let activeUserRole = null;
    let activeUserName = null;

    if (payload) {
      activeUserEmail = payload.email;
      activeUserRole = payload.role;
      activeUserName = payload.name;
    } else if (email) {
      // Fallback/offline sync or programmatic lookup by email
      const lookupEmail = email.toLowerCase().trim();
      const user = await User.findOne({ email: lookupEmail });
      if (user) {
        activeUserEmail = user.email;
        activeUserRole = user.role;
        activeUserName = user.name;
      }
    }

    if (!activeUserEmail) {
      return NextResponse.json({ message: "Unauthorized. Session expired or missing user identifier." }, { status: 401 });
    }

    if (activeUserRole !== "HR" && activeUserRole !== "Admin") {
      return NextResponse.json({ message: "Forbidden. HR or Admin credentials required to publish bulletins." }, { status: 403 });
    }

    if (!title || !content) {
      return NextResponse.json({ message: "Missing required fields: Title and Content are required." }, { status: 400 });
    }

    const newAnnouncement = new Announcement({
      title: title.trim(),
      content: content.trim(),
      category: category || "General",
      priority: priority || "Medium",
      createdByName: activeUserName || "HR Specialist",
      createdByEmail: activeUserEmail,
      createdByRole: activeUserRole,
      targetRole: targetRole || "All",
      pinned: Boolean(pinned),
    });

    await newAnnouncement.save();

    return NextResponse.json({
      success: true,
      announcement: {
        id: newAnnouncement._id.toString(),
        title: newAnnouncement.title,
        content: newAnnouncement.content,
        category: newAnnouncement.category,
        priority: newAnnouncement.priority,
        createdByName: newAnnouncement.createdByName,
        createdByEmail: newAnnouncement.createdByEmail,
        createdByRole: newAnnouncement.createdByRole,
        targetRole: newAnnouncement.targetRole,
        pinned: newAnnouncement.pinned,
        createdAt: newAnnouncement.createdAt,
        updatedAt: newAnnouncement.updatedAt,
      }
    }, { status: 201 });
  } catch (error) {
    console.error("API POST Announcement Error:", error);
    return NextResponse.json({ success: false, message: "Failed to publish announcement", error: error.message }, { status: 500 });
  }
}

// DELETE an announcement by ID (HR and Admin only)
export async function DELETE(request) {
  try {
    await dbConnect();

    // Verify authentication from token cookie
    const token = request.cookies.get("token")?.value;
    let payload = null;
    if (token) {
      try {
        payload = await verifyToken(token);
      } catch (err) {
        console.warn("Token verification failed in Announcements DELETE:", err.message);
      }
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const emailParam = searchParams.get("email");

    let activeUserRole = null;

    if (payload) {
      activeUserRole = payload.role;
    } else if (emailParam) {
      const lookupEmail = emailParam.toLowerCase().trim();
      const user = await User.findOne({ email: lookupEmail });
      if (user) {
        activeUserRole = user.role;
      }
    }

    if (activeUserRole !== "HR" && activeUserRole !== "Admin") {
      return NextResponse.json({ message: "Forbidden. HR or Admin credentials required to retract bulletins." }, { status: 403 });
    }

    if (!id) {
      return NextResponse.json({ message: "ID query parameter is required." }, { status: 400 });
    }

    const deleted = await Announcement.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ message: "Announcement bulletin not found in context." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Announcement deleted successfully.", id }, { status: 200 });
  } catch (error) {
    console.error("API DELETE Announcement Error:", error);
    return NextResponse.json({ success: false, message: "Failed to delete announcement bulletin", error: error.message }, { status: 500 });
  }
}
