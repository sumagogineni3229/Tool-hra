"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  ClipboardList,
  Clock,
  CalendarDays,
  CheckCircle,
  XCircle,
  FileCheck,
  Briefcase,
  FileText,
  ArrowUpRight
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";

export default function ManagerDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [squadMembers, setSquadMembers] = useState([]);
  const [loadingSquad, setLoadingSquad] = useState(true);
  const [greeting, setGreeting] = useState("Welcome");

  const [metrics, setMetrics] = useState({
    totalTeamMembers: 0,
    activeProjects: 0,
    pendingTasks: 0,
    pendingLeaveRequests: 0,
    reportsAwaitingReview: 0,
    teamAttendanceRate: 0
  });

  const [pendingLeaves, setPendingLeaves] = useState([]);

  const loadSquadData = async (managerSession) => {
    setLoadingSquad(true);
    try {
      const [teamsData, usersData] = await Promise.all([
        apiClient.getTeams(),
        apiClient.getUsers()
      ]);

      const managerId = managerSession.id || managerSession._id;
      const managerEmail = managerSession.email;

      // Find teams managed by this manager
      const managedTeams = teamsData.filter(team => {
        const tMgrId = team.managerId?.id || team.managerId?._id || team.managerId;
        const tMgrEmail = team.managerId?.email;
        return (tMgrId?.toString() === managerId?.toString() || (tMgrEmail && managerEmail && tMgrEmail.toLowerCase() === managerEmail.toLowerCase()));
      });

      // Collect unique member IDs/details
      const resolvedMembersMap = new Map();
      const memberRefs = [];
      managedTeams.forEach(team => {
        if (Array.isArray(team.members)) {
          memberRefs.push(...team.members);
        }
      });

      memberRefs.forEach(m => {
        const mId = m.id || m._id || m;
        if (!mId) return;

        let details = null;
        if (typeof m === "object" && m !== null) {
          details = m;
        } else {
          details = usersData.find(u => u.id === mId || u._id === mId);
        }

        if (details) {
          resolvedMembersMap.set(details.email || mId, details);
        }
      });

      const resolvedMembers = Array.from(resolvedMembersMap.values());
      const totalTeamMembers = resolvedMembers.length;

      // Map resolved members to squad tracker feed list structure
      const mappedMembers = resolvedMembers.map(m => {
        const isOnline = m.session === "Online";
        return {
          id: m.id || m._id || Math.random().toString(),
          name: m.name,
          status: isOnline ? "Active Working" : "Offline",
          details: `Role: ${m.role} | Department: ${m.department || 'Engineering'}`,
          badge: isOnline ? "bg-emerald-50 text-emerald-800 border-emerald-100" : "bg-slate-100 text-slate-600 border-slate-200",
          initials: m.initials || m.name.split(" ").map(n => n[0]).join("")
        };
      });
      setSquadMembers(mappedMembers);

      // Fetch dynamic stats
      const cacheBust = `t=${Date.now()}`;
      const [attendanceRes, leaveRes, reportsRes, projectsRes, tasksRes] = await Promise.all([
        fetch(`/api/attendance?managerEmail=${encodeURIComponent(managerEmail)}&${cacheBust}`, { cache: 'no-store' }).then(r => r.ok ? r.json() : { attendance: [] }).catch(() => ({ attendance: [] })),
        fetch(`/api/leave?${cacheBust}`, { cache: 'no-store' }).then(r => r.ok ? r.json() : { leaves: [] }).catch(() => ({ leaves: [] })),
        fetch(`/api/reports?email=${encodeURIComponent(managerEmail)}&${cacheBust}`, { cache: 'no-store' }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`/api/projects?email=${encodeURIComponent(managerEmail)}&${cacheBust}`, { cache: 'no-store' }).then(r => r.ok ? r.json() : { projects: [] }).catch(() => ({ projects: [] })),
        fetch(`/api/tasks?email=${encodeURIComponent(managerEmail)}&${cacheBust}`, { cache: 'no-store' }).then(r => r.ok ? r.json() : { tasks: [] }).catch(() => ({ tasks: [] }))
      ]);

      // Calculate Projects (status not completed)
      const activeProjects = (projectsRes.projects || []).filter(p => p.status !== "Completed").length;

      // Calculate Tasks (status not completed)
      const pendingTasks = (tasksRes.tasks || []).filter(t => t.status !== "completed").length;

      // Calculate Leave Requests
      const teamMemberIds = new Set(resolvedMembers.map(m => (m.id || m._id || m).toString()));
      const teamMemberEmails = new Set(resolvedMembers.map(m => m.email?.toLowerCase().trim()).filter(Boolean));

      const squadLeaves = (leaveRes.leaves || []).filter(leave => {
        const leaveUserId = leave.userId?._id || leave.userId?.id || leave.userId;
        const leaveEmail = leave.userEmail ? leave.userEmail.toLowerCase().trim() : "";
        return (leaveUserId && teamMemberIds.has(leaveUserId.toString())) || (leaveEmail && teamMemberEmails.has(leaveEmail));
      });
      const pendingSquadLeaves = squadLeaves.filter(l => l.status === "pending" || l.status === "Pending").map(l => ({
        id: l._id || l.id,
        name: l.name || "Unknown User",
        role: l.role || "Employee",
        type: l.leaveType || l.type || "Sick Leave",
        duration: l.duration || "1 Day",
        dates: l.dates || (l.startDate === l.endDate ? l.startDate : `${l.startDate} - ${l.endDate}`),
        reason: l.reason || "",
        status: "pending",
        userEmail: l.userEmail || ""
      }));
      setPendingLeaves(pendingSquadLeaves);

      const pendingLeaveRequests = pendingSquadLeaves.length;

      // Calculate Reports
      const reportsList = reportsRes?.reports || (Array.isArray(reportsRes) ? reportsRes : []);
      const reportsAwaitingReview = reportsList.filter(r => r.status === "Pending Review" || r.status === "Pending").length;

      // Calculate Attendance Rate
      const getLocalDateString = (dateObj) => {
        if (!dateObj) return "";
        const d = new Date(dateObj);
        if (isNaN(d.getTime())) return "";
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const todayStr = getLocalDateString(new Date());
      const todayRecords = (attendanceRes.attendance || []).filter(r => {
        const recordDateStr = r.date ? getLocalDateString(r.date) : "";
        return recordDateStr === todayStr;
      });

      const checkedInUserIds = new Set(todayRecords.map(r => {
        const uid = r.userId?._id || r.userId?.id || r.userId;
        return uid ? uid.toString() : null;
      }).filter(Boolean));

      const checkedInCount = resolvedMembers.filter(m => {
        const id = m.id || m._id || m;
        return checkedInUserIds.has(id.toString());
      }).length;

      const teamAttendanceRate = totalTeamMembers > 0 
        ? Math.round((checkedInCount / totalTeamMembers) * 100) 
        : 0;

      setMetrics({
        totalTeamMembers,
        activeProjects,
        pendingTasks,
        pendingLeaveRequests,
        reportsAwaitingReview,
        teamAttendanceRate
      });

    } catch (err) {
      console.error("Failed to load manager's squad data:", err);
    } finally {
      setLoadingSquad(false);
    }
  };

  useEffect(() => {
    // Set greeting based on real time
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting("Good morning");
    } else if (hour >= 12 && hour < 17) {
      setGreeting("Good afternoon");
    } else {
      setGreeting("Good evening");
    }

    const session = apiClient.getCurrentSession();
    setCurrentUser(session);
    if (session) {
      loadSquadData(session);
    }
  }, []);

  const handleApproveLeave = async (id) => {
    try {
      const response = await fetch("/api/leave", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "approved" })
      });

      if (response.ok) {
        const session = apiClient.getCurrentSession();
        if (session) loadSquadData(session);
      } else {
        throw new Error("Failed to approve leave");
      }
    } catch (err) {
      console.warn("DB approval failed, falling back to local state updates", err);
      setPendingLeaves(prev => prev.filter(l => l.id !== id));
      setMetrics(prev => ({
        ...prev,
        pendingLeaveRequests: Math.max(0, prev.pendingLeaveRequests - 1)
      }));
    }
  };

  const handleDeclineLeave = async (id) => {
    try {
      const response = await fetch("/api/leave", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "rejected" })
      });

      if (response.ok) {
        const session = apiClient.getCurrentSession();
        if (session) loadSquadData(session);
      } else {
        throw new Error("Failed to decline leave");
      }
    } catch (err) {
      console.warn("DB decline failed, falling back to local state updates", err);
      setPendingLeaves(prev => prev.filter(l => l.id !== id));
      setMetrics(prev => ({
        ...prev,
        pendingLeaveRequests: Math.max(0, prev.pendingLeaveRequests - 1)
      }));
    }
  };

  const stats = [
    { 
      name: "Total Team Members", 
      value: `${metrics.totalTeamMembers} ${metrics.totalTeamMembers === 1 ? 'Member' : 'Members'}`, 
      icon: Users, 
      change: "Direct report squad", 
      link: "/manager/team-management"
    },
    { 
      name: "Active Projects", 
      value: `${metrics.activeProjects} ${metrics.activeProjects === 1 ? 'Project' : 'Projects'}`, 
      icon: Briefcase, 
      change: "In progress / pending", 
      link: "/manager/projects"
    },
    { 
      name: "Pending Tasks", 
      value: `${metrics.pendingTasks} ${metrics.pendingTasks === 1 ? 'Task' : 'Tasks'}`, 
      icon: ClipboardList, 
      change: "Assigned by you", 
      link: "/manager/task-management"
    },
    { 
      name: "Pending Leave Requests", 
      value: `${metrics.pendingLeaveRequests} ${metrics.pendingLeaveRequests === 1 ? 'Request' : 'Requests'}`, 
      icon: CalendarDays, 
      change: "Awaiting approval", 
      link: "/manager/leaves"
    },
    { 
      name: "Reports Awaiting Review", 
      value: `${metrics.reportsAwaitingReview} ${metrics.reportsAwaitingReview === 1 ? 'Report' : 'Reports'}`, 
      icon: FileText, 
      change: "Reports pending review", 
      link: "/manager/reports"
    },
    { 
      name: "Team Attendance Rate", 
      value: `${metrics.teamAttendanceRate}%`, 
      icon: Clock, 
      change: "Checked in today", 
      link: "/manager/attendance"
    }
  ];

  return (
    <div className="flex flex-col gap-8 text-left">

      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {greeting}, {currentUser?.name || "Manager"}
        </h1>
        <p className="text-xs text-slate-500">Welcome back. Monitor your engineering squad, leave requests, and daily operational milestones.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Link
              href={stat.link}
              key={i}
              className="group bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between gap-4 hover:shadow-md hover:border-indigo-150 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{stat.name}</span>
                <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                  <Icon className="w-4.5 h-4.5" />
                </div>
              </div>

              <div className="flex items-end justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-2xl font-extrabold tracking-tight text-slate-950 group-hover:text-indigo-600 transition-colors">{stat.value}</span>
                  <span className="text-[10px] text-slate-400 font-bold">{stat.change}</span>
                </div>
                <div className="w-6 h-6 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

        {/* Left Side: Pending Leave Requests (7 Columns) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col p-6 gap-5">
          <div className="flex justify-between items-center bg-slate-50/40 p-3 rounded-xl border border-slate-100/50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
              <h3 className="font-bold text-slate-900 text-sm">Pending Leave Requests</h3>
            </div>
            <span className="text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Requires Action
            </span>
          </div>

          <div className="flex-1 divide-y divide-slate-100 max-h-[360px] overflow-y-auto pr-1">
            {pendingLeaves.length > 0 ? (
              pendingLeaves.map((leave) => (
                <div key={leave.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-slate-50/30 transition-colors text-left group">
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-955 text-xs truncate transition-colors group-hover:text-indigo-600">{leave.name}</span>
                      <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200/40 text-slate-500 uppercase tracking-wider">{leave.role}</span>
                    </div>
                    <div className="text-xs text-slate-600 font-semibold">
                      <span className="text-indigo-600 font-bold">{leave.type}</span> — {leave.duration} ({leave.dates})
                    </div>
                    <p className="text-[10px] text-slate-400 italic font-medium mt-0.5 bg-slate-50 border border-slate-100/40 px-2 py-1 rounded-xl w-fit">&ldquo;{leave.reason}&rdquo;</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                    <button 
                      type="button" 
                      onClick={() => handleApproveLeave(leave.id)}
                      className="px-3 py-2 rounded-xl text-[9px] font-black text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transition-all cursor-pointer flex items-center gap-1 shadow-sm uppercase tracking-wider"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleDeclineLeave(leave.id)}
                      className="px-3 py-2 rounded-xl text-[9px] font-black text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 transition-all cursor-pointer flex items-center gap-1 uppercase tracking-wider"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-xs font-semibold bg-slate-50/20 border border-dashed border-slate-200 rounded-2xl">
                <FileCheck className="w-8 h-8 text-slate-350 mb-2" />
                <span>All squad leaves processed. Excellent!</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Squad live statuses (5 Columns) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-slate-150/75 px-6 py-4.5 bg-slate-50/40">
            <h3 className="font-bold text-slate-900 text-sm">Squad Tracker Feed</h3>
          </div>

          <div className="flex-1 p-6 flex flex-col gap-6 max-h-[400px] overflow-y-auto">
            {squadMembers.length > 0 ? (
              squadMembers.map(member => (
                <div key={member.id} className="flex items-start justify-between gap-3 text-left">
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-800 shrink-0">
                      {member.initials}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-xs text-slate-900 leading-none">{member.name}</span>
                      <span className="text-[10px] text-slate-400 mt-1.5 font-semibold">{member.details}</span>
                    </div>
                  </div>

                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${member.badge}`}>
                    {member.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-16 text-center text-slate-400 text-xs font-semibold flex flex-col items-center justify-center">
                <Users className="w-8 h-8 text-slate-300 mb-2 animate-pulse" />
                <span>
                  {loadingSquad ? "Retrieving squad information..." : "No direct reports assigned to your squad."}
                </span>
                {!loadingSquad && (
                  <span className="block text-[10px] text-slate-400/80 mt-1 max-w-[200px]">
                    Ask an Admin or HR specialist to register your squad assignments in the Org Console.
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
