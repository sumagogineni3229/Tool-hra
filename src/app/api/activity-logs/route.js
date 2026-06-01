import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Attendance from "@/lib/models/Attendance";
import Leave from "@/lib/models/Leave";
import Performance from "@/lib/models/Performance";
import User from "@/lib/models/User";

export async function GET(request) {
  try {
    await dbConnect();

    // 1. Fetch all users to construct an id-to-user details map
    const users = await User.find({}).lean();
    const userMap = {};
    users.forEach(u => {
      userMap[u._id.toString()] = { name: u.name, role: u.role, initials: u.initials };
    });

    const logs = [];

    // 2. Fetch recent Leave logs (max 15)
    const leaves = await Leave.find({}).sort({ updatedAt: -1 }).limit(15).lean();
    leaves.forEach(l => {
      const uDetails = userMap[l.userId?.toString()] || { name: l.name || "Staff Member", role: l.role || "Employee" };
      
      // If approved or rejected, log the update action
      if (l.status === "approved" || l.status === "Approved") {
        logs.push({
          id: `leave-approve-${l._id}`,
          name: "HR Ops Admin",
          action: `Approved ${uDetails.name}'s ${l.leaveType || "Sick"} Leave request`,
          time: l.updatedAt || l.createdAt,
          category: "Leave"
        });
      } else if (l.status === "rejected" || l.status === "Rejected" || l.status === "declined" || l.status === "Declined") {
        logs.push({
          id: `leave-reject-${l._id}`,
          name: "HR Ops Admin",
          action: `Declined ${uDetails.name}'s ${l.leaveType || "Sick"} Leave request`,
          time: l.updatedAt || l.createdAt,
          category: "Leave"
        });
      } else {
        // Pending/Submitted leave request
        logs.push({
          id: `leave-submit-${l._id}`,
          name: uDetails.name,
          action: `Submitted a new ${l.leaveType || "Sick"} Leave request for approval`,
          time: l.createdAt,
          category: "Leave"
        });
      }
    });

    // 3. Fetch recent Attendance logs (max 15)
    const attendances = await Attendance.find({}).sort({ updatedAt: -1 }).limit(15).lean();
    attendances.forEach(a => {
      const uDetails = userMap[a.userId?.toString()] || { name: "Staff Member", role: "Employee" };
      if (a.sessions && a.sessions.length > 0) {
        a.sessions.forEach((s, idx) => {
          if (s.checkIn) {
            const checkInTime = new Date(s.checkIn).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
            logs.push({
              id: `checkin-${a._id}-${idx}`,
              name: uDetails.name,
              action: `Clocked In to HRA portal (${checkInTime})`,
              time: s.checkIn,
              category: "Attendance"
            });
          }
          if (s.checkOut) {
            const checkOutTime = new Date(s.checkOut).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
            logs.push({
              id: `checkout-${a._id}-${idx}`,
              name: uDetails.name,
              action: `Clocked Out of shift session (${checkOutTime})`,
              time: s.checkOut,
              category: "Attendance"
            });
          }
        });
      }
    });

    // 4. Fetch recent Performance ratings (max 15)
    const performances = await Performance.find({}).sort({ updatedAt: -1 }).limit(15).lean();
    performances.forEach(p => {
      logs.push({
        id: `perf-${p._id}`,
        name: p.reviewedBy || "HR Specialist",
        action: `Submitted Q2 performance scorecard for ${p.userName} (${p.overallScore} Stars)`,
        time: p.updatedAt || p.createdAt,
        category: "Performance"
      });
    });

    // 5. Fetch recent user registrations (max 15)
    const recentUsers = await User.find({}).sort({ createdAt: -1 }).limit(10).lean();
    recentUsers.forEach(ru => {
      logs.push({
        id: `user-create-${ru._id}`,
        name: "HR HQ Registry",
        action: `Created new ${ru.role} account for ${ru.name} (${ru.department})`,
        time: ru.createdAt,
        category: "User"
      });
    });

    // Sort logs descending by timestamp
    const sortedLogs = logs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    // Take top 20 logs
    const finalLogs = sortedLogs.slice(0, 20);

    return NextResponse.json({ success: true, logs: finalLogs }, { status: 200 });
  } catch (error) {
    console.error("API GET Activity Logs Error:", error);
    return NextResponse.json({ success: false, message: "Failed to aggregate activity logs", error: error.message }, { status: 500 });
  }
}
