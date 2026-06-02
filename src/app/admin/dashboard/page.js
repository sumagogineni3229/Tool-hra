"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  GraduationCap,
  CalendarDays,
  FileCheck,
  CheckCircle,
  XCircle,
  Clock,
  UserCheck,
  UserPlus,
  Hourglass,
  UserCog,
  ShieldCheck,
  Building2,
  Activity
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";

export default function AdminDashboardPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);

  // Live clock
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState(null);

  // Stat counters
  const [counts, setCounts] = useState({
    employees: 0,
    interns: 0,
    managers: 0,
    hrs: 0,
    teams: 0,
    activeUsers: 0,
    newHires: 0,
    leavesToday: 0,
    pendingLeaveCount: 0,
  });

  /* ─── Clock ─────────────────────────────────────────────── */
  useEffect(() => {
    setMounted(true);
    setTime(new Date());
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const getFormattedTime = () => {
    if (!mounted || !time) return "Initializing...";
    return time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
  };

  const getFormattedDate = () => {
    if (!mounted || !time) return "Syncing Date...";
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${days[time.getDay()]}, ${months[time.getMonth()]} ${String(time.getDate()).padStart(2, "0")}, ${time.getFullYear()}`;
  };

  const renderAnalogClock = () => {
    if (!mounted || !time) {
      return (
        <div className="w-24 h-24 rounded-full border border-slate-800 bg-slate-900 flex items-center justify-center text-slate-500 text-[10px] font-bold animate-pulse shrink-0">
          Sync…
        </div>
      );
    }
    const h = time.getHours(), m = time.getMinutes(), s = time.getSeconds();
    const hrA = (h % 12) * 30 + m * 0.5;
    const minA = m * 6 + s * 0.1;
    const secA = s * 6;
    return (
      <svg width="95" height="95" viewBox="0 0 200 200" className="drop-shadow-sm select-none shrink-0">
        <circle cx="100" cy="100" r="95" className="fill-slate-950 stroke-slate-800" strokeWidth="6" />
        <circle cx="100" cy="100" r="88" className="fill-slate-900/50 stroke-slate-800/40" strokeWidth="1" />
        {[...Array(12)].map((_, i) => {
          const num = i === 0 ? 12 : i;
          const a = (i * 30 * Math.PI) / 180;
          return (
            <text key={i} x={100 + 72 * Math.sin(a)} y={100 - 72 * Math.cos(a)} textAnchor="middle" dominantBaseline="central" className="text-[18px] font-black fill-slate-500 font-sans">{num}</text>
          );
        })}
        {[...Array(60)].map((_, i) => {
          if (i % 5 === 0) return null;
          const a = (i * 6 * Math.PI) / 180;
          return <line key={i} x1={100 + 82 * Math.sin(a)} y1={100 - 82 * Math.cos(a)} x2={100 + 85 * Math.sin(a)} y2={100 - 85 * Math.cos(a)} className="stroke-slate-700" strokeWidth="1.5" />;
        })}
        <line x1="100" y1="100" x2="100" y2="55" className="stroke-slate-100" strokeWidth="6" strokeLinecap="round" transform={`rotate(${hrA} 100 100)`} />
        <line x1="100" y1="100" x2="100" y2="38" className="stroke-indigo-400" strokeWidth="4" strokeLinecap="round" transform={`rotate(${minA} 100 100)`} />
        <line x1="100" y1="120" x2="100" y2="25" className="stroke-rose-500" strokeWidth="2" strokeLinecap="round" transform={`rotate(${secA} 100 100)`} />
        <circle cx="100" cy="100" r="6" className="fill-rose-600 stroke-slate-900" strokeWidth="2" />
      </svg>
    );
  };

  /* ─── Elapsed helper ─────────────────────────────────────── */
  const getElapsed = (pastDate) => {
    if (!pastDate) return "Recent";
    const d = new Date(pastDate);
    if (isNaN(d.getTime())) return String(pastDate);
    const diffMs = Date.now() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMins / 60);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    if (diffHrs < 24) return `${diffHrs} hour${diffHrs > 1 ? "s" : ""} ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  /* ─── Fetch leaves ───────────────────────────────────────── */
  const fetchLeaves = useCallback(async () => {
    try {
      const res = await fetch("/api/leave");
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      const list = data.leaves || [];
      const pending = list.filter(l => l.status === "pending" || l.status === "Pending");

      const today = (() => {
        const n = new Date();
        return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
      })();

      const leavesToday = list.filter(l => {
        const ok = l.status === "approved" || l.status === "Approved";
        return ok && today >= l.startDate && today <= l.endDate;
      }).length;

      setPendingLeaves(pending.map(l => ({
        ...l,
        id: l._id || l.id,
        name: l.name || "Unknown User",
        role: l.role || "Employee",
        dates: l.dates || (l.startDate === l.endDate ? l.startDate : `${l.startDate} – ${l.endDate}`),
      })));

      setCounts(prev => ({ ...prev, leavesToday, pendingLeaveCount: pending.length }));
      localStorage.setItem("hra_all_leaves", JSON.stringify(list));
    } catch {
      const cached = localStorage.getItem("hra_all_leaves");
      if (cached) {
        const list = JSON.parse(cached);
        const pending = list.filter(l => l.status === "pending" || l.status === "Pending");
        setPendingLeaves(pending.map(l => ({
          ...l, id: l._id || l.id, name: l.name || "Unknown User",
          role: l.role || "Employee",
          dates: l.dates || (l.startDate === l.endDate ? l.startDate : `${l.startDate} – ${l.endDate}`),
        })));
        setCounts(prev => ({ ...prev, pendingLeaveCount: pending.length }));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /* ─── Fetch activity logs ────────────────────────────────── */
  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/activity-logs");
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.success && data.logs) {
        setRecentLogs(data.logs);
        localStorage.setItem("hra_activity_logs", JSON.stringify(data.logs));
        return;
      }
      throw new Error();
    } catch {
      const cached = localStorage.getItem("hra_activity_logs");
      if (cached) { setRecentLogs(JSON.parse(cached)); return; }
      const defaults = [
        { id: "s1", name: "System Admin", action: "Initialized admin console session", time: new Date(Date.now() - 10 * 60000).toISOString(), category: "System" },
        { id: "s2", name: "HR Specialist", action: "Approved leave request for John Doe", time: new Date(Date.now() - 3600000).toISOString(), category: "Leave" },
        { id: "s3", name: "Jane Smith", action: "Logged weekly internship learning goals", time: new Date(Date.now() - 3 * 3600000).toISOString(), category: "User" },
        { id: "s4", name: "Daniel Cooper", action: "Submitted Engineering timesheets for Week 4", time: new Date(Date.now() - 24 * 3600000).toISOString(), category: "Perf" },
      ];
      setRecentLogs(defaults);
      localStorage.setItem("hra_activity_logs", JSON.stringify(defaults));
    }
  }, []);

  /* ─── Bootstrap ──────────────────────────────────────────── */
  useEffect(() => {
    setCurrentUser(apiClient.getCurrentSession());

    Promise.all([apiClient.getUsers(), apiClient.getTeams()]).then(([users, teams]) => {
      const employees = users.filter(u => u.role === "Employee").length;
      const interns = users.filter(u => u.role === "Intern").length;
      const managers = users.filter(u => u.role === "Manager").length;
      const hrs = users.filter(u => u.role === "HR").length;
      const activeUsers = users.filter(u => u.isActive !== false).length;

      const nowMonth = new Date().getMonth(), nowYear = new Date().getFullYear();
      const newHires = users.filter(u => {
        if (!u.createdAt) return false;
        const d = new Date(u.createdAt);
        return d.getMonth() === nowMonth && d.getFullYear() === nowYear;
      }).length;

      setCounts(prev => ({ ...prev, employees, interns, managers, hrs, teams: teams?.length || 0, activeUsers, newHires }));
    });

    fetchLeaves();
    fetchLogs();
  }, [fetchLeaves, fetchLogs]);

  /* ─── Leave actions ─────────────────────────────────────── */
  const handleLeaveAction = async (id, name, action) => {
    const status = action === "approve" ? "approved" : "rejected";
    try {
      const res = await fetch("/api/leave", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) { fetchLeaves(); fetchLogs(); return; }
      throw new Error();
    } catch {
      // local fallback
      const all = JSON.parse(localStorage.getItem("hra_all_leaves") || "[]");
      const idx = all.findIndex(l => l._id === id || l.id === id);
      if (idx !== -1) { all[idx].status = status; localStorage.setItem("hra_all_leaves", JSON.stringify(all)); }
      setPendingLeaves(prev => prev.filter(l => l.id !== id));

      const logs = JSON.parse(localStorage.getItem("hra_activity_logs") || "[]");
      logs.unshift({
        id: `local-${Date.now()}`,
        name: currentUser?.name || "Admin",
        action: `${action === "approve" ? "Approved" : "Declined"} ${name}'s leave request`,
        time: new Date().toISOString(),
        category: "Leave",
      });
      localStorage.setItem("hra_activity_logs", JSON.stringify(logs));
      setRecentLogs(logs.slice(0, 20));
    }
  };

  /* ─── Stat card definitions ─────────────────────────────── */
  const statCards = [
    { name: "Total Employees", value: `${counts.employees} Accounts`, icon: Users, desc: "Registered Staff Directory", bar: "bg-indigo-500", iconCls: "bg-indigo-50 border-indigo-100 text-indigo-650" },
    { name: "Total Interns", value: `${counts.interns} Interns`, icon: GraduationCap, desc: "Active Learning Syllabus", bar: "bg-violet-500", iconCls: "bg-violet-50 border-violet-100 text-violet-650" },
    { name: "Total Managers", value: `${counts.managers} Managers`, icon: UserCog, desc: "Team Lead Accounts", bar: "bg-amber-500", iconCls: "bg-amber-50 border-amber-100 text-amber-650" },
    { name: "Total HRs", value: `${counts.hrs} HR Staff`, icon: ShieldCheck, desc: "Human Resources Team", bar: "bg-emerald-500", iconCls: "bg-emerald-50 border-emerald-100 text-emerald-650" },
    { name: "Total Teams", value: `${counts.teams} Teams`, icon: Building2, desc: "Departments & Squads", bar: "bg-rose-500", iconCls: "bg-rose-50 border-rose-100 text-rose-650" },
    { name: "Active Users", value: `${counts.activeUsers} Active`, icon: UserCheck, desc: "Currently Enabled Accounts", bar: "bg-sky-500", iconCls: "bg-sky-50 border-sky-100 text-sky-650" },
    { name: "New Hires This Month", value: `+${counts.newHires} Hires`, icon: UserPlus, desc: "Onboarded in Current Cycle", bar: "bg-orange-500", iconCls: "bg-orange-50 border-orange-100 text-orange-650" },
    { name: "On Leave Today", value: `${counts.leavesToday} Approved`, icon: CalendarDays, desc: "Out of Office Today", bar: "bg-pink-500", iconCls: "bg-pink-50 border-pink-100 text-pink-650" },
    { name: "Pending Leave Reqs", value: `${counts.pendingLeaveCount} Requests`, icon: Hourglass, desc: "Requires Leave Clearance", bar: "bg-teal-500", iconCls: "bg-teal-50 border-teal-100 text-teal-650" },
  ];

  /* ─── Render ─────────────────────────────────────────────── */
  return (
    <div className="flex flex-col gap-8 text-left w-full">

      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Global Dashboard | Overview</h1>
        <p className="text-xs text-slate-500 font-light tracking-wide italic">
          Welcome back, {currentUser?.name || "Super Admin"}. You have full operational control over the entire HRA platform.
        </p>
      </div>

      {/* ── Stat Grid: Clock + 9 cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">

        {/* Live Clock card */}
        <div className="bg-gradient-to-br from-slate-950 to-slate-900 text-white rounded-[2rem] p-5 border border-slate-800/80 shadow-md flex flex-col justify-between min-h-[170px] text-left relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-indigo-500/10 blur-2xl rounded-full" />
          <div className="flex items-center justify-between gap-4">
            <div className="shrink-0 transition-transform duration-500 group-hover:rotate-6">
              {renderAnalogClock()}
            </div>
            <div className="flex flex-col text-right justify-center">
              <span className="text-[8px] font-extrabold text-indigo-400 bg-indigo-950/60 border border-indigo-800/40 px-2 py-0.5 rounded-full uppercase tracking-wider w-fit self-end flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Tracker
              </span>
              <span className="text-[15px] font-black font-mono mt-2 tracking-tight text-white">{getFormattedTime()}</span>
            </div>
          </div>
          <div className="border-t border-slate-800/40 pt-3 flex items-center justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider">
            <span>Operations Clock</span>
            <span className="font-mono text-[8px]">{getFormattedDate()}</span>
          </div>
        </div>

        {/* 9 stat cards */}
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="bg-white border border-slate-200/80 rounded-[2rem] p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 text-left flex flex-col justify-between gap-4 relative overflow-hidden group min-h-[170px]"
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${card.bar} rounded-l-[2rem]`} />
              <div className="flex items-center justify-between pl-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{card.name}</span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 transition-transform duration-300 group-hover:scale-105 ${card.iconCls}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="flex flex-col gap-1 pl-1">
                {loading ? (
                  <div className="h-7 w-24 bg-slate-100 rounded animate-pulse" />
                ) : (
                  <span className="text-2xl font-extrabold tracking-tight text-slate-950 font-mono leading-none">{card.value}</span>
                )}
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{card.desc}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Bottom split pane ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

        {/* Pending Leave Requests (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col p-6 gap-5">
          <div className="flex justify-between items-center bg-slate-50/40 p-3 rounded-2xl border border-slate-100/50">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
              <h3 className="font-bold text-slate-900 text-sm">Pending Leave Requests</h3>
            </div>
            <span className="text-[9px] font-extrabold text-amber-800 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Requires Action
            </span>
          </div>

          <div className="flex-1 divide-y divide-slate-100 max-h-[380px] overflow-y-auto pr-1">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-slate-400 text-xs font-semibold">
                <div className="w-6 h-6 rounded-full border-4 border-slate-200 border-t-slate-600 animate-spin mr-3" />
                Loading requests…
              </div>
            ) : pendingLeaves.length > 0 ? (
              pendingLeaves.map((leave) => (
                <div key={leave.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-slate-50/30 transition-colors group">
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-950 text-xs truncate group-hover:text-indigo-600 transition-colors">{leave.name}</span>
                      <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200/40 text-slate-500 uppercase tracking-wider">{leave.role}</span>
                    </div>
                    <div className="text-xs text-slate-600 font-semibold">
                      <span className="text-indigo-600 font-bold">{leave.type}</span>
                      {leave.type && " — "}
                      {leave.duration && `${leave.duration} `}({leave.dates})
                    </div>
                    {leave.reason && (
                      <p className="text-[10px] text-slate-400 italic font-medium mt-0.5 bg-slate-50 border border-slate-100/40 px-2 py-1 rounded-xl w-fit">
                        &ldquo;{leave.reason}&rdquo;
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handleLeaveAction(leave.id, leave.name, "approve")}
                      className="px-3 py-2 rounded-xl text-[9px] font-black text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transition-all cursor-pointer flex items-center gap-1 shadow-sm uppercase tracking-wider"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLeaveAction(leave.id, leave.name, "decline")}
                      className="px-3 py-2 rounded-xl text-[9px] font-black text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 transition-all cursor-pointer flex items-center gap-1 uppercase tracking-wider"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Decline
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-xs font-semibold bg-slate-50/20 border border-dashed border-slate-200 rounded-3xl">
                <FileCheck className="w-8 h-8 text-slate-350 mb-2" />
                All leave requests clear. Excellent work!
              </div>
            )}
          </div>
        </div>

        {/* Corporate Action Log (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col p-6 gap-5">
          <div className="border-b border-slate-150/70 pb-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-500" />
              Corporate Action Log
            </h3>
          </div>
          <div className="flex-1 flex flex-col gap-6 max-h-[380px] overflow-y-auto pr-1">
            {recentLogs.length > 0 ? recentLogs.map((log) => (
              <div key={log.id} className="flex gap-3.5 text-left items-start group">
                <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 transition-colors group-hover:bg-indigo-50 group-hover:border-indigo-100">
                  <Clock className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    <span className="font-bold text-slate-900">{log.name}</span> {log.action}
                  </p>
                  <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-widest font-mono">{getElapsed(log.time)}</span>
                </div>
              </div>
            )) : (
              <p className="text-xs text-slate-400 font-semibold text-center py-10">No activity logs available.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
