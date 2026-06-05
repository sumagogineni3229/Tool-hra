"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  CalendarDays,
  CheckCircle,
  XCircle,
  FileCheck,
  Building2,
  TrendingUp,
  Clock,
  UserCheck,
  GraduationCap,
  UserPlus,
  Hourglass
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";

export default function HRDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  
  // Tracking Metrics states
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usersList, setUsersList] = useState([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [activeEmployees, setActiveEmployees] = useState(0);
  const [totalInterns, setTotalInterns] = useState(0);
  const [verificationRequests, setVerificationRequests] = useState(0);
  const [newHiresThisMonth, setNewHiresThisMonth] = useState(0);
  const [leavesToday, setLeavesToday] = useState(0);

  // Time & Mount states for the analog clock
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState(null);

  const [recentLogs, setRecentLogs] = useState([]);

  // Calculate elapsed time description dynamically (e.g. 10 mins ago, 2 hours ago, or Month Day)
  const getElapsedString = (pastDate) => {
    if (!pastDate) return "Recent";
    const date = new Date(pastDate);
    if (isNaN(date.getTime())) return String(pastDate); // Fallback for seeds containing legacy strings
    
    const diffMs = Date.now() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffSecs < 60) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  // Dynamic ticking analog clock sync
  useEffect(() => {
    setMounted(true);
    setTime(new Date());
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getFormattedDate = () => {
    if (!mounted || !time) return "Syncing Date...";
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    const dayName = days[time.getDay()];
    const dateNum = String(time.getDate()).padStart(2, "0");
    const monthName = months[time.getMonth()];
    const yearNum = time.getFullYear();

    return `${dayName}, ${monthName} ${dateNum}, ${yearNum}`;
  };

  const getFormattedTime = () => {
    if (!mounted || !time) return "Initializing...";
    return time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
  };

  const renderAnalogClockSVG = () => {
    if (!mounted || !time) {
      return (
        <div className="w-24 h-24 rounded-full border border-slate-800 bg-slate-900 flex items-center justify-center text-slate-500 text-[10px] font-bold animate-pulse shrink-0">
          Sync...
        </div>
      );
    }

    const hours = time.getHours();
    const minutes = time.getMinutes();
    const seconds = time.getSeconds();

    // Standard rotation angles
    const hrAngle = (hours % 12) * 30 + minutes * 0.5;
    const minAngle = minutes * 6 + seconds * 0.1;
    const secAngle = seconds * 6;

    return (
      <svg width="95" height="95" viewBox="0 0 200 200" className="drop-shadow-sm select-none shrink-0">
        {/* Outer clock ring */}
        <circle cx="100" cy="100" r="95" className="fill-[#020617] stroke-slate-800" strokeWidth="6" />
        <circle cx="100" cy="100" r="88" className="fill-[#090d16]/50 stroke-slate-800/40" strokeWidth="1" />
        
        {/* Hour numbers */}
        {[...Array(12)].map((_, i) => {
          const num = i === 0 ? 12 : i;
          const angleRad = (i * 30 * Math.PI) / 180;
          const x = 100 + 72 * Math.sin(angleRad);
          const y = 100 - 72 * Math.cos(angleRad);
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              className="text-[18px] font-black fill-slate-500 font-sans"
            >
              {num}
            </text>
          );
        })}

        {/* Ticks for minutes */}
        {[...Array(60)].map((_, i) => {
          if (i % 5 === 0) return null; // Skip hour positions
          const angleRad = (i * 6 * Math.PI) / 180;
          const x1 = 100 + 82 * Math.sin(angleRad);
          const y1 = 100 - 82 * Math.cos(angleRad);
          const x2 = 100 + 85 * Math.sin(angleRad);
          const y2 = 100 - 85 * Math.cos(angleRad);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              className="stroke-slate-700"
              strokeWidth="1.5"
            />
          );
        })}

        {/* Hour hand */}
        <line
          x1="100"
          y1="100"
          x2="100"
          y2="55"
          className="stroke-[#f8fafc]"
          strokeWidth="6"
          strokeLinecap="round"
          transform={`rotate(${hrAngle} 100 100)`}
        />

        {/* Minute hand */}
        <line
          x1="100"
          y1="100"
          x2="100"
          y2="38"
          className="stroke-indigo-400"
          strokeWidth="4"
          strokeLinecap="round"
          transform={`rotate(${minAngle} 100 100)`}
        />

        {/* Second hand */}
        <line
          x1="100"
          y1="120"
          x2="100"
          y2="25"
          className="stroke-rose-500"
          strokeWidth="2"
          strokeLinecap="round"
          transform={`rotate(${secAngle} 100 100)`}
        />

        {/* Center circle pin */}
        <circle cx="100" cy="100" r="6" className="fill-rose-600 stroke-slate-900" strokeWidth="2" />
      </svg>
    );
  };

  const fetchLeaves = useCallback(async () => {
    try {
      const res = await fetch("/api/leave");
      if (res.ok) {
        const data = await res.json();
        const leavesList = data.leaves || [];
        const pending = leavesList.filter(l => l.status === "pending" || l.status === "Pending");
        
        // Calculate approved leaves active today
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const localTodayStr = `${year}-${month}-${day}`;

        const activeApprovedToday = leavesList.filter(l => {
          const isApproved = l.status === "approved" || l.status === "Approved";
          if (!isApproved) return false;
          return localTodayStr >= l.startDate && localTodayStr <= l.endDate;
        }).length;

        setLeavesToday(activeApprovedToday);

        const formatted = pending.map(l => ({
          ...l,
          id: l._id || l.id,
          name: l.name || "Unknown User",
          role: l.role || "Employee",
          dates: l.dates || (l.startDate === l.endDate ? l.startDate : `${l.startDate} - ${l.endDate}`),
          status: "Pending"
        }));

        setPendingLeaves(formatted);
        localStorage.setItem("hra_all_leaves", JSON.stringify(leavesList));
      } else {
        throw new Error("Failed to fetch leaves");
      }
    } catch (err) {
      console.warn("DB leaves fetch failed on HR dashboard, using cache...", err);
      const cached = localStorage.getItem("hra_all_leaves");
      if (cached) {
        const parsed = JSON.parse(cached);
        const pending = parsed.filter(l => l.status === "pending" || l.status === "Pending");
        
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const localTodayStr = `${year}-${month}-${day}`;

        const activeApprovedToday = parsed.filter(l => {
          const isApproved = l.status === "approved" || l.status === "Approved";
          if (!isApproved) return false;
          return localTodayStr >= l.startDate && localTodayStr <= l.endDate;
        }).length;

        setLeavesToday(activeApprovedToday);

        const formatted = pending.map(l => ({
          ...l,
          id: l._id || l.id,
          name: l.name || "Unknown User",
          role: l.role || "Employee",
          dates: l.dates || (l.startDate === l.endDate ? l.startDate : `${l.startDate} - ${l.endDate}`),
          status: "Pending"
        }));
        setPendingLeaves(formatted);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchActivityLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/activity-logs");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.logs) {
          setRecentLogs(data.logs);
          localStorage.setItem("hra_activity_logs", JSON.stringify(data.logs));
          return;
        }
      }
      throw new Error("Failed to load dynamic activity logs");
    } catch (err) {
      console.warn("DB Activity logs fetch failed, loading local fallback cache...", err);
      const cached = localStorage.getItem("hra_activity_logs");
      if (cached) {
        setRecentLogs(JSON.parse(cached));
      } else {
        const defaultLogs = [
          { id: "local-seed-1", name: "Sarah Jenkins", action: "Approved John Doe's leave request", time: new Date(Date.now() - 15 * 60000).toISOString(), category: "Leave" },
          { id: "local-seed-2", name: "John Doe", action: "Clocked In to HRA portal (09:02 AM)", time: new Date(Date.now() - 3600000).toISOString(), category: "Attendance" },
          { id: "local-seed-3", name: "Jane Smith", action: "Logged weekly internship learning goals", time: new Date(Date.now() - 3 * 3600000).toISOString(), category: "User" },
          { id: "local-seed-4", name: "Daniel Cooper", action: "Submitted Engineering timesheets for Week 4", time: new Date(Date.now() - 24 * 3600000).toISOString(), category: "Performance" }
        ];
        setRecentLogs(defaultLogs);
        localStorage.setItem("hra_activity_logs", JSON.stringify(defaultLogs));
      }
    }
  }, []);

  useEffect(() => {
    setCurrentUser(apiClient.getCurrentSession());
    
    // Load users list and calculate precise operations statistics
    apiClient.getUsers().then(users => {
      setUsersList(users);
      
      // 1. Total Employees: Accounts registered with role === "Employee"
      const employees = users.filter(u => u.role === "Employee");
      setTotalEmployees(employees.length);

      // 2. Active Employees: Employees whose account status is "Active"
      const active = employees.filter(u => u.status === "Active");
      setActiveEmployees(active.length);

      // 3. Interns Onboarded: Accounts registered with role === "Intern"
      const interns = users.filter(u => u.role === "Intern");
      setTotalInterns(interns.length);

      // 4. Profile Verification Requests: Accounts waiting with status "Pending"
      const pendingVerifications = users.filter(u => u.verificationStatus === "Pending");
      setVerificationRequests(pendingVerifications.length);

      // 5. New Hires This Month: Accounts created in current month cycle
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const newHires = users.filter(u => {
        if (!u.createdAt) return false;
        const createdDate = new Date(u.createdAt);
        return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
      });
      setNewHiresThisMonth(newHires.length);
    });

    fetchLeaves();
    fetchActivityLogs();
  }, [fetchLeaves, fetchActivityLogs]);

  const handleApprove = async (id, name) => {
    try {
      const response = await fetch("/api/leave", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "approved" })
      });

      if (response.ok) {
        fetchLeaves();
        fetchActivityLogs();
      } else {
        throw new Error("Failed to approve in DB");
      }
    } catch (err) {
      console.warn("Could not sync approval to DB, updating locally...", err);
      const cachedAll = JSON.parse(localStorage.getItem("hra_all_leaves") || "[]");
      const idxAll = cachedAll.findIndex(l => (l._id === id || l.id === id));
      if (idxAll !== -1) {
        cachedAll[idxAll].status = "approved";
        localStorage.setItem("hra_all_leaves", JSON.stringify(cachedAll));
      }

      setPendingLeaves(prev => prev.filter(l => l.id !== id));
      
      // Sync local activity logs cache
      const cachedLogs = JSON.parse(localStorage.getItem("hra_activity_logs") || "[]");
      const newLog = {
        id: `local-approve-${Date.now()}`,
        name: currentUser?.name || "HR Specialist",
        action: `Approved ${name}'s leave request`,
        time: new Date().toISOString(),
        category: "Leave"
      };
      cachedLogs.unshift(newLog);
      localStorage.setItem("hra_activity_logs", JSON.stringify(cachedLogs));
      setRecentLogs(cachedLogs.slice(0, 20));
    }
  };

  const handleDecline = async (id, name) => {
    try {
      const response = await fetch("/api/leave", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "rejected" })
      });

      if (response.ok) {
        fetchLeaves();
        fetchActivityLogs();
      } else {
        throw new Error("Failed to decline in DB");
      }
    } catch (err) {
      console.warn("Could not sync decline to DB, updating locally...", err);
      const cachedAll = JSON.parse(localStorage.getItem("hra_all_leaves") || "[]");
      const idxAll = cachedAll.findIndex(l => (l._id === id || l.id === id));
      if (idxAll !== -1) {
        cachedAll[idxAll].status = "rejected";
        localStorage.setItem("hra_all_leaves", JSON.stringify(cachedAll));
      }

      setPendingLeaves(prev => prev.filter(l => l.id !== id));
      
      // Sync local activity logs cache
      const cachedLogs = JSON.parse(localStorage.getItem("hra_activity_logs") || "[]");
      const newLog = {
        id: `local-decline-${Date.now()}`,
        name: currentUser?.name || "HR Specialist",
        action: `Declined ${name}'s leave request`,
        time: new Date().toISOString(),
        category: "Leave"
      };
      cachedLogs.unshift(newLog);
      localStorage.setItem("hra_activity_logs", JSON.stringify(cachedLogs));
      setRecentLogs(cachedLogs.slice(0, 20));
    }
  };

  const trackingStats = [
    { 
      name: "Total Employees", 
      value: `${totalEmployees} Accounts`, 
      icon: Users, 
      desc: "Registered Staff Directory", 
      colorClass: "bg-indigo-50 border-indigo-100 hover:border-indigo-300 text-indigo-700", 
      textStyle: "text-indigo-950" 
    },
    { 
      name: "Active Employees", 
      value: `${activeEmployees} Active`, 
      icon: UserCheck, 
      desc: "Currently Active Roles", 
      colorClass: "bg-emerald-50 border-emerald-100 hover:border-emerald-300 text-emerald-700", 
      textStyle: "text-emerald-950" 
    },
    { 
      name: "Interns Onboarded", 
      value: `${totalInterns} Interns`, 
      icon: GraduationCap, 
      desc: "Active Learning Syllabus", 
      colorClass: "bg-amber-50 border-amber-100 hover:border-amber-300 text-amber-700", 
      textStyle: "text-amber-950" 
    },
    { 
      name: "Profile Verifications", 
      value: `${verificationRequests} Pending`, 
      icon: FileCheck, 
      desc: "Requires Aadhaar Review", 
      colorClass: "bg-purple-50 border-purple-100 hover:border-purple-300 text-purple-700", 
      textStyle: "text-purple-950" 
    },
    { 
      name: "New Hires This Month", 
      value: `+${newHiresThisMonth} Hires`, 
      icon: UserPlus, 
      desc: "Onboarded in Current Cycle", 
      colorClass: "bg-sky-50 border-sky-100 hover:border-sky-300 text-sky-700", 
      textStyle: "text-sky-950" 
    },
    { 
      name: "Employees on Leave Today", 
      value: `${leavesToday} Approved`, 
      icon: CalendarDays, 
      desc: "Out of Office Today", 
      colorClass: "bg-rose-50 border-rose-100 hover:border-rose-300 text-rose-700", 
      textStyle: "text-rose-950" 
    },
    { 
      name: "Pending Leave Requests", 
      value: `${pendingLeaves.length} Requests`, 
      icon: Hourglass, 
      desc: "Requires Leave Clearance", 
      colorClass: "bg-orange-50 border-orange-100 hover:border-orange-300 text-orange-700", 
      textStyle: "text-orange-950" 
    }
  ];

  return (
    <div className="flex flex-col gap-8 text-left">
      
      {/* Dynamic Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">HR Operations Dashboard</h1>
        <p className="text-xs text-slate-500 font-light tracking-wide italic">Welcome, {currentUser?.name || "HR Specialist"}. You have full operational control over employee lifecycles and team leave clearance.</p>
      </div>

      {/* 2. Unified Premium Live Operations Tracking Console (Grid of 8 cards: Clock + 7 stats) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Small Live Analog Clock & Digital Time (First Position, Small & Premium) */}
        <div className="bg-gradient-to-br from-[#020617] to-[#0f172a] text-[#ffffff] rounded-[2rem] p-5 border border-[#1e293b]/80 shadow-md flex flex-col justify-between min-h-[160px] text-left relative overflow-hidden group">
          {/* Subtle background neon circle highlight */}
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-indigo-500/10 blur-2xl rounded-full" />
          
          <div className="flex items-center justify-between gap-4">
            {/* SVG Compact Clock */}
            <div className="shrink-0 transition-transform duration-500 group-hover:rotate-6">
              {renderAnalogClockSVG()}
            </div>
            
            {/* Time details */}
            <div className="flex flex-col text-right justify-center">
              <span className="text-[8px] font-extrabold text-indigo-400 bg-indigo-950/60 border border-indigo-850/40 px-2 py-0.5 rounded-full uppercase tracking-wider w-fit self-end flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Tracker</span>
              </span>
              <span className="text-[15px] font-black font-mono mt-2 tracking-tight text-[#ffffff]">{getFormattedTime()}</span>
            </div>
          </div>

          <div className="border-t border-[#1e293b]/40 pt-3 flex items-center justify-between text-[9px] text-[#94a3b8] font-bold uppercase tracking-wider">
            <span>Operations Clock</span>
            <span className="text-[#94a3b8] font-mono text-[8px]">{getFormattedDate()}</span>
          </div>
        </div>

        {/* Cards 2 to 8: The 7 Core Operational Stats Cards (Left bordered, custom premium theme) */}
        {trackingStats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div 
              key={i} 
              className={`bg-white border border-slate-200/80 rounded-[2rem] p-5 shadow-sm hover:shadow-md hover:translate-y-[-2px] transition-all duration-300 text-left flex flex-col justify-between gap-4 relative overflow-hidden group`}
            >
              {/* Premium left border accent bar */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                i === 0 ? "bg-indigo-500" :
                i === 1 ? "bg-emerald-500" :
                i === 2 ? "bg-amber-500" :
                i === 3 ? "bg-purple-500" :
                i === 4 ? "bg-sky-500" :
                i === 5 ? "bg-rose-500" : "bg-orange-500"
              }`} />
              
              <div className="flex items-center justify-between pl-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{stat.name}</span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 transition-transform duration-300 group-hover:scale-105 ${
                  i === 0 ? "bg-indigo-50 border-indigo-100 text-indigo-600" :
                  i === 1 ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                  i === 2 ? "bg-amber-50 border-amber-100 text-amber-600" :
                  i === 3 ? "bg-purple-50 border-purple-100 text-purple-600" :
                  i === 4 ? "bg-sky-50 border-sky-100 text-sky-600" :
                  i === 5 ? "bg-rose-50 border-rose-100 text-rose-600" : "bg-orange-50 border-orange-100 text-orange-600"
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="flex flex-col gap-1 pl-1">
                <span className="text-2xl font-extrabold tracking-tight text-slate-950 font-mono leading-none">{stat.value}</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{stat.desc}</span>
              </div>
            </div>
          );
        })}

      </div>

      {/* Core Split Pane (Pending Leave Requests & Action Log) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Side: Pending Leave Requests (7 Columns) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col p-6 gap-5">
          <div className="flex justify-between items-center bg-slate-50/40 p-3 rounded-2xl border border-slate-100/50">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
              <h3 className="font-bold text-slate-900 text-sm">Pending Leave Requests</h3>
            </div>
            <span className="text-[9px] font-extrabold text-amber-800 bg-amber-55 border border-amber-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Requires Action
            </span>
          </div>

          <div className="flex-1 divide-y divide-slate-100 max-h-[360px] overflow-y-auto pr-1">
            {pendingLeaves.length > 0 ? (
              pendingLeaves.map((leave) => (
                <div key={leave.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-slate-50/30 transition-colors text-left group">
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-950 text-xs truncate transition-colors group-hover:text-indigo-600">{leave.name}</span>
                      <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200/40 text-slate-500 uppercase tracking-wider">{leave.role}</span>
                    </div>
                    <div className="text-xs text-slate-650 font-semibold">
                      <span className="text-indigo-600 font-bold">{leave.type}</span> — {leave.duration} ({leave.dates})
                    </div>
                    <p className="text-[10px] text-slate-400 italic font-medium mt-0.5 bg-slate-50 border border-slate-100/40 px-2 py-1 rounded-xl w-fit">&ldquo;{leave.reason}&rdquo;</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                    <button 
                      type="button" 
                      onClick={() => handleApprove(leave.id, leave.name)}
                      className="px-3 py-2 rounded-xl text-[9px] font-black text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transition-all cursor-pointer flex items-center gap-1 shadow-sm uppercase tracking-wider"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleDecline(leave.id, leave.name)}
                      className="px-3 py-2 rounded-xl text-[9px] font-black text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 transition-all cursor-pointer flex items-center gap-1 uppercase tracking-wider"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-xs font-semibold bg-slate-50/20 border border-dashed border-slate-200 rounded-3xl">
                <FileCheck className="w-8 h-8 text-slate-350 mb-2" />
                <span>All leave request clear. Excellent work!</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: HR Activity Timeline (5 Columns) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col p-6 gap-5">
          <div className="border-b border-slate-150/70 pb-4">
            <h3 className="font-bold text-slate-900 text-sm">Corporate Action Log</h3>
          </div>

          <div className="flex-1 flex flex-col gap-6 max-h-[360px] overflow-y-auto pr-1">
            {recentLogs.map((activity) => (
              <div key={activity.id} className="flex gap-3.5 text-left items-start group">
                <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 shrink-0 transition-colors group-hover:bg-indigo-50 group-hover:border-indigo-100">
                  <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-slate-655 text-slate-600 leading-relaxed font-medium">
                    <span className="font-bold text-slate-900">{activity.name}</span> {activity.action}
                  </p>
                  <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-widest font-mono">{getElapsedString(activity.time)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
