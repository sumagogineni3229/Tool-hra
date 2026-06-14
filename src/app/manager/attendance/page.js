"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  Calendar,
  Download,
  Filter,
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  MapPin,
  Eye,
  BarChart3,
  Loader2,
  UserCheck,
  UserMinus,
  AlertTriangle,
  X,
  Trash2,
  Edit2,
  Plus,
  ArrowUpRight,
  CalendarDays,
  Briefcase,
  Info,
  RefreshCw
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { apiClient } from "@/lib/apiClient";

const STATUS_THEMES = {
  "present": {
    bg: "bg-emerald-50/50",
    text: "text-emerald-700",
    border: "border-emerald-100",
    dot: "bg-emerald-500",
    glow: "shadow-emerald-100"
  },
  "late": {
    bg: "bg-amber-50/50",
    text: "text-amber-700",
    border: "border-amber-100",
    dot: "bg-amber-500",
    glow: "shadow-amber-100"
  },
  "absent": {
    bg: "bg-rose-50/50",
    text: "text-rose-700",
    border: "border-rose-100",
    dot: "bg-rose-500",
    glow: "shadow-rose-100"
  },
};

const getLocalDateString = (dateObj) => {
  if (!dateObj) return "";
  const d = new Date(dateObj);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function ManagerAttendance() {
  const [currentUser, setCurrentUser] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedTeamId, setSelectedTeamId] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null); // Focus review modal
  const [recordToEdit, setRecordToEdit] = useState(null); // Edit modal

  // Form states
  const [formData, setFormData] = useState({
    userId: "",
    date: getLocalDateString(new Date()),
    status: "present",
    checkInTime: "09:00",
    checkOutTime: "",
    notes: ""
  });

  const fetchAllData = useCallback(async () => {
    try {
      const [fetchedUsers, fetchedTeams] = await Promise.all([
        apiClient.getUsers(),
        apiClient.getTeams()
      ]);

      setUsers(fetchedUsers || []);
      setTeams(fetchedTeams || []);

      const session = apiClient.getCurrentSession();
      const managerEmail = session?.email;
      const cacheBust = `t=${Date.now()}`;
      const queryStr = managerEmail
        ? `?managerEmail=${encodeURIComponent(managerEmail)}&${cacheBust}`
        : `?${cacheBust}`;

      let fetchedAttendance = [];
      try {
        const res = await fetch(`/api/attendance${queryStr}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          fetchedAttendance = data.attendance || [];
        }
      } catch (err) {
        console.warn("Could not fetch database attendance, checking localStorage fallback", err);
      }

      // LocalStorage Fallback if empty or failed
      if (fetchedAttendance.length === 0 && typeof window !== "undefined") {
        const cached = localStorage.getItem("hra_attendance");
        if (cached) {
          fetchedAttendance = JSON.parse(cached);
        }
      }

      setAttendance(fetchedAttendance);

    } catch (err) {
      console.error("Failed to load attendance dataset:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Periodic polling for live updates
  useEffect(() => {
    if (typeof window !== "undefined") {
      const session = apiClient.getCurrentSession();
      setCurrentUser(session);
    }

    fetchAllData();
    const poll = setInterval(() => {
      fetchAllData();
    }, 8000); // Sync data every 8 seconds in the background

    return () => clearInterval(poll);
  }, [fetchAllData]);

  // Find teams managed by this manager
  const managedTeams = useMemo(() => {
    if (!currentUser) return [];
    const currentUserId = currentUser.id || currentUser._id;
    const currentUserEmail = currentUser.email?.toLowerCase().trim();

    return teams.filter(t => {
      const tMgrId = t.managerId?.id || t.managerId?._id || t.managerId;
      const tMgrEmail = t.managerId?.email?.toLowerCase().trim();

      return (
        tMgrId?.toString() === currentUserId?.toString() ||
        (tMgrEmail && currentUserEmail && tMgrEmail === currentUserEmail)
      );
    });
  }, [teams, currentUser]);

  // Resolve unique members for filtered squads
  const resolvedMembers = useMemo(() => {
    if (managedTeams.length === 0) return [];

    let targetTeams = [];
    if (selectedTeamId === "All") {
      targetTeams = managedTeams;
    } else {
      const matched = managedTeams.find(t => t.id === selectedTeamId || t._id === selectedTeamId);
      if (matched) targetTeams = [matched];
    }

    const memberRefs = [];
    targetTeams.forEach(team => {
      if (Array.isArray(team.members)) {
        memberRefs.push(...team.members);
      }
    });

    const userMap = new Map();
    users.forEach((u) => {
      const id = u.id || u._id;
      if (id) userMap.set(id.toString(), u);
    });

    const uniqueMembers = new Map();
    memberRefs.forEach(m => {
      const mId = m.id || m._id || m;
      if (!mId) return;

      let details = m;
      if (typeof m !== "object") {
        details = userMap.get(mId.toString()) || { _id: mId };
      }
      uniqueMembers.set(mId.toString(), details);
    });

    return Array.from(uniqueMembers.values());
  }, [managedTeams, selectedTeamId, users]);

  // Roster ids set for rapid filtering
  const squadMemberIds = useMemo(() => {
    return new Set(resolvedMembers.map(m => (m.id || m._id || m).toString()));
  }, [resolvedMembers]);

  // Attendance scoped to direct report squad members only
  const squadAttendance = useMemo(() => {
    return attendance.filter(r => {
      const attUserId = r.userId?._id || r.userId?.id || r.userId;
      return attUserId && squadMemberIds.has(attUserId.toString());
    });
  }, [attendance, squadMemberIds]);

  // Today local ISO string
  const todayStr = useMemo(() => getLocalDateString(new Date()), []);

  // Today's attendance logs
  const todayRecords = useMemo(() => {
    return squadAttendance.filter(r => {
      const recordDateStr = r.date ? getLocalDateString(r.date) : "";
      return recordDateStr === todayStr;
    });
  }, [squadAttendance, todayStr]);

  // Calculate Metrics based on squad attendance
  const analytics = useMemo(() => {
    const onPremises = todayRecords.filter(r => {
      const lastSession = r.sessions?.[r.sessions.length - 1];
      return lastSession && !lastSession.checkOut;
    }).length;

    const late = todayRecords.filter(r => r.status?.toLowerCase() === "late").length;
    const absent = Math.max(0, resolvedMembers.length - todayRecords.length);

    const critical = todayRecords.filter(r => {
      const lastSession = r.sessions?.[r.sessions.length - 1];
      if (lastSession && !lastSession.checkOut) {
        const duration = Date.now() - new Date(lastSession.checkIn).getTime();
        return duration > 10 * 60 * 60 * 1000;
      }
      return false;
    }).length;

    // Presence Velocity (trends by weekday)
    const trends = {};
    squadAttendance.forEach(r => {
      const d = new Date(r.date).toLocaleDateString('en-US', { weekday: 'short' });
      trends[d] = (trends[d] || 0) + 1;
    });
    const daysOrder = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const trendData = daysOrder.map(name => ({
      name,
      count: trends[name] || 0
    }));

    return { onPremises, late, absent, critical, trendData };
  }, [todayRecords, resolvedMembers, squadAttendance]);

  // Filter attendance records to display in registry table
  const displayedRecords = useMemo(() => {
    const query = (searchQuery || "").toLowerCase();
    return squadAttendance.filter(r => {
      const name = (r.userId?.name || "").toLowerCase();
      const empId = (r.userId?.employeeId || "").toLowerCase();
      const matchesSearch = name.includes(query) || empId.includes(query);
      const matchesStatus = selectedStatus === "all" || r.status?.toLowerCase() === selectedStatus.toLowerCase();
      const matchesDate = !selectedDate || (r.date && getLocalDateString(r.date) === selectedDate);
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [squadAttendance, searchQuery, selectedStatus, selectedDate]);

  // Telemetry Diagnostic logs in browser console
  useEffect(() => {
    console.log("Manager telemetry diagnostic:", {
      currentManager: currentUser?.email,
      totalUsers: users.length,
      totalTeams: teams.length,
      managedTeams: managedTeams.map(t => t.name),
      squadMembers: resolvedMembers.map(m => m.name),
      attendanceReceived: attendance.length,
      squadFilteredAttendance: squadAttendance.length,
      displayedInTable: displayedRecords.length,
      selectedDateFilter: selectedDate || "(none)",
      selectedStatusFilter: selectedStatus,
      searchQuery: searchQuery || "(none)"
    });
  }, [currentUser, users, teams, managedTeams, resolvedMembers, attendance, squadAttendance, displayedRecords, selectedDate, selectedStatus, searchQuery]);

  // Manual operations handlers
  const handleOpenAddModal = () => {
    if (resolvedMembers.length > 0) {
      setFormData({
        userId: (resolvedMembers[0].id || resolvedMembers[0]._id).toString(),
        date: getLocalDateString(new Date()),
        status: "present",
        checkInTime: "09:00",
        checkOutTime: "18:00",
        notes: ""
      });
      setIsAddModalOpen(true);
    }
  };

  const handleOpenEditModal = (record) => {
    setRecordToEdit(record);

    let checkInTime = "09:00";
    let checkOutTime = "";
    const sessions = record.sessions || [];
    if (sessions.length > 0) {
      if (sessions[0].checkIn) {
        checkInTime = new Date(sessions[0].checkIn).toTimeString().slice(0, 5);
      }
      const lastSession = sessions[sessions.length - 1];
      if (lastSession.checkOut) {
        checkOutTime = new Date(lastSession.checkOut).toTimeString().slice(0, 5);
      }
    }

    setFormData({
      userId: (record.userId?._id || record.userId?.id || record.userId).toString(),
      date: record.date ? getLocalDateString(record.date) : getLocalDateString(new Date()),
      status: record.status || "present",
      checkInTime,
      checkOutTime,
      notes: record.notes || ""
    });
    setIsEditModalOpen(true);
  };

  const handleSaveAddManual = async (e) => {
    e.preventDefault();
    try {
      const checkInISO = new Date(`${formData.date}T${formData.checkInTime || "09:00"}:00`).toISOString();
      const checkOutISO = formData.checkOutTime
        ? new Date(`${formData.date}T${formData.checkOutTime}:00`).toISOString()
        : null;

      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "manual",
          userId: formData.userId,
          date: formData.date,
          status: formData.status,
          checkIn: checkInISO,
          checkOut: checkOutISO,
          notes: formData.notes
        })
      });

      if (res.ok) {
        setIsAddModalOpen(false);
        fetchAllData();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to add manual entry.");
      }
    } catch (e) {
      console.error(e);
      alert("Error saving manual entry");
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!recordToEdit) return;
    try {
      const checkInISO = new Date(`${formData.date}T${formData.checkInTime || "09:00"}:00`).toISOString();
      const checkOutISO = formData.checkOutTime
        ? new Date(`${formData.date}T${formData.checkOutTime}:00`).toISOString()
        : null;

      const sessions = [
        {
          checkIn: checkInISO,
          checkOut: checkOutISO
        }
      ];

      const res = await fetch("/api/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: recordToEdit._id || recordToEdit.id,
          status: formData.status,
          notes: formData.notes,
          sessions
        })
      });

      if (res.ok) {
        setIsEditModalOpen(false);
        setRecordToEdit(null);
        fetchAllData();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to update record.");
      }
    } catch (e) {
      console.error(e);
      alert("Error updating record");
    }
  };

  const handleDeleteRecord = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/attendance?id=${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchAllData();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to delete record");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const exportToCSV = () => {
    const headers = ["Member Name", "ID", "Date", "Check-in", "Check-out", "Duration", "Status"];
    const rows = (displayedRecords || []).map(r => {
      const sessions = r.sessions || [];
      const checkInTime = sessions.length > 0 && sessions[0]?.checkIn
        ? new Date(sessions[0].checkIn).toLocaleTimeString()
        : "-";
      const checkOutTime = sessions.length > 0 && sessions[sessions.length - 1]?.checkOut
        ? new Date(sessions[sessions.length - 1].checkOut).toLocaleTimeString()
        : "-";
      const duration = typeof r.totalDuration === 'number'
        ? (r.totalDuration / (1000 * 60 * 60)).toFixed(2) + "h"
        : "-";
      const dateStr = r.date ? new Date(r.date).toLocaleDateString() : "-";

      return [
        r.userId?.name || "-",
        r.userId?.employeeId || "-",
        dateStr,
        checkInTime,
        checkOutTime,
        duration,
        r.status || "-"
      ];
    });

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Squad_Attendance_Report_${getLocalDateString(new Date())}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
          <div className="absolute inset-0 border-4 border-indigo-650 rounded-full border-t-transparent animate-spin" />
        </div>
        <p className="text-sm font-medium text-slate-505 animate-pulse">Synchronizing Squad Intel...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20 w-full max-w-none text-left font-sans">

      {managedTeams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center shadow-sm max-w-xl mx-auto flex flex-col items-center gap-6 mt-10">
          <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-700">No Squads Configured</h3>
            <p className="text-xs text-slate-405 max-w-sm mx-auto leading-relaxed">
              You are mapped as a Manager, but no active team squads are currently assigned to you in the core organizational console.
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl max-w-md text-xs text-slate-505 leading-relaxed text-center">
            Please ask the HR Specialist or Administrator to link you as the manager of your squad registry.
          </div>
        </div>
      ) : (
        <>
          {/* --- PREMIUM HEADER --- */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left relative overflow-hidden bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-[0.2em] mb-2">
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                Live Squad Operations
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Squad Attendance</h1>
              <p className="text-slate-550 text-xs mt-1">Track presence, verify geolocations, and review webcam captures for your teams.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Squad Filter Dropdown */}
              {managedTeams.length > 0 && (
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 shadow-sm">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                  <select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    className="bg-transparent text-slate-800 font-bold text-xs border-none focus:outline-none cursor-pointer appearance-none pr-6 relative"
                  >
                    <option value="All">All Squads ({managedTeams.length})</option>
                    {managedTeams.map((t) => (
                      <option key={t.id || t._id} value={t.id || t._id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="button"
                onClick={fetchAllData}
                className="h-10.5 px-4 bg-white border border-slate-200 hover:border-slate-350 rounded-xl text-xs font-bold text-slate-800 flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm active:scale-95 cursor-pointer"
                title="Sync Telemetry Logs"
              >
                <RefreshCw className="w-4 h-4 text-slate-500" />
                Sync Telemetry
              </button>

              <button
                type="button"
                onClick={exportToCSV}
                className="h-10.5 px-4 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-800 flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-500" />
                Export CSV
              </button>

              <button
                type="button"
                onClick={handleOpenAddModal}
                className="h-10.5 px-4.5 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Manual Entry
              </button>
            </div>
          </header>

          {/* --- ANALYTICS CARDS --- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {[
              { label: "Active Presence", val: analytics.onPremises, total: resolvedMembers.length, icon: UserCheck, color: "indigo", desc: "Currently clocked-in" },
              { label: "Punctuality Alert", val: analytics.late, total: todayRecords.length, icon: Clock, color: "amber", desc: "Late arrivals today" },
              { label: "Estimated Absent", val: analytics.absent, total: resolvedMembers.length, icon: UserMinus, color: "rose", desc: "Unchecked reports" },
              { label: "Extended Shift", val: analytics.critical, total: todayRecords.length, icon: AlertTriangle, color: "orange", desc: "Active sessions > 10h" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group relative bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-105/20 overflow-hidden hover:border-indigo-100 transition-all"
              >
                <div className="relative z-10 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-705 group-hover:bg-white group-hover:shadow-md transition-all">
                        <stat.icon className="w-4.5 h-4.5" />
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
                      </div>
                    </div>

                    <div className="flex items-end gap-1.5 mb-1.5">
                      <h3 className="text-2.5xl font-black text-slate-900 leading-none">{stat.val}</h3>
                      <span className="text-xs font-bold text-slate-400 pb-0.5">/ {stat.total}</span>
                    </div>

                    <p className="text-[9.5px] text-slate-400 font-medium italic">{stat.desc}</p>
                  </div>

                  <div className="mt-4 h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(stat.val / (stat.total || 1)) * 100}%` }}
                      className="h-full bg-indigo-650 rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
            {/* --- MAIN LOGS TABLE --- */}
            <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-100 shadow-2xl shadow-slate-205/30 overflow-hidden flex flex-col">
              <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-6 bg-slate-50/20">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-md">
                    <Users className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 leading-tight">Squad Roster Registry</h2>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{selectedDate || "Real-time Telemetry Stream"}</p>
                  </div>
                </div>

                {/* Search input */}
                <div className="relative w-full sm:w-60">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search squad members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-white placeholder-slate-400 focus:outline-none focus:border-slate-350 transition-colors text-slate-800"
                  />
                </div>
              </div>

              {displayedRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-96 text-center px-10">
                  <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center text-slate-250 mb-4">
                    <Info className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-500">No Logs Matching Selection</h4>
                  <p className="text-xs text-slate-400 mt-1 italic">No telemetry data matches your current filter parameters.</p>
                  <button
                    type="button"
                    onClick={() => { setSelectedDate(""); setSelectedStatus("all"); setSearchQuery(""); }}
                    className="mt-4 text-xs font-bold text-indigo-650 hover:underline cursor-pointer"
                  >
                    Reset selection parameters
                  </button>
                </div>
              ) : (
                <>
                  {/* MOBILE CARD LIST */}
                  <div className="flex flex-col divide-y divide-slate-50 md:hidden">
                    {displayedRecords.map((r) => {
                      const theme = STATUS_THEMES[r.status?.toLowerCase() || "present"] || STATUS_THEMES.present;
                      const checkIn = r.sessions?.[0];
                      const checkOut = r.sessions?.[r.sessions.length - 1]?.checkOut ? r.sessions[r.sessions.length - 1] : null;
                      return (
                        <div key={r._id || r.id} className="p-4 space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">
                                {r.userId?.name?.charAt(0) || "U"}
                              </div>
                              <div>
                                <p className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest">{r.userId?.employeeId || "MEMBER-ID"}</p>
                                <p className="text-sm font-black text-slate-900 leading-none">{r.userId?.name || "Unknown Member"}</p>
                              </div>
                            </div>
                            <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${theme.bg} ${theme.border} ${theme.text}`}>
                              <div className={`w-1 h-1 rounded-full ${theme.dot}`} />
                              {r.status || "present"}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-slate-50 rounded-xl p-2.5">
                              <p className="text-[9px] font-black text-indigo-500 uppercase tracking-wide mb-0.5">Check-in</p>
                              {checkIn ? (
                                <p className="font-bold text-slate-900">{new Date(checkIn.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                              ) : <p className="text-slate-300 italic text-[10px]">—</p>}
                            </div>
                            <div className="bg-slate-50 rounded-xl p-2.5">
                              <p className="text-[9px] font-black text-rose-500 uppercase tracking-wide mb-0.5">Check-out</p>
                              {checkOut?.checkOut ? (
                                <p className="font-bold text-slate-900">{new Date(checkOut.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  <span className="text-[9px] font-black text-emerald-600 uppercase italic">Live</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setSelectedRecord(r)}
                              className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                            >
                              <Eye className="w-3.5 h-3.5" /> Review
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(r)}
                              className="w-10 h-10 border border-slate-100 bg-white text-slate-500 rounded-xl flex items-center justify-center hover:bg-slate-50 transition-all active:scale-90 cursor-pointer"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRecord(r._id || r.id)}
                              className="w-10 h-10 border border-rose-100 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-100 transition-all active:scale-90 cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* DESKTOP TABLE */}
                  <div className="hidden md:block overflow-x-auto min-h-[500px]">
                    <table className="w-full border-separate border-spacing-0">
                      <thead>
                        <tr className="bg-slate-50/30 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 text-left border-b">
                          <th className="px-6 py-4.5 border-b border-slate-50">Personnel Information</th>
                          <th className="px-6 py-4.5 border-b border-slate-50">Entry Vector</th>
                          <th className="px-6 py-4.5 border-b border-slate-50">Exit Vector</th>
                          <th className="px-6 py-4.5 border-b border-slate-50">Classification</th>
                          <th className="px-6 py-4.5 border-b border-slate-50 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedRecords.map((r) => (
                          <tr key={r._id || r.id} className="group hover:bg-slate-50/40 transition-all">
                            <td className="px-6 py-5.5 border-b border-slate-50">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-xs font-black text-indigo-650 group-hover:scale-105 transition-transform">
                                  {r.userId?.name?.charAt(0) || "U"}
                                </div>
                                <div className="flex flex-col text-left">
                                  <p className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest">{r.userId?.employeeId || "MEMBER-ID"}</p>
                                  <p className="text-xs font-black text-slate-900 leading-none mt-0.5">{r.userId?.name || "Unknown Member"}</p>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-5.5 border-b border-slate-50">
                              {r.sessions?.[0] ? (
                                <div className="flex items-center gap-3">
                                  <div className="relative flex-shrink-0">
                                    <img
                                      src={r.sessions[0].checkInImage || "https://ui-avatars.com/api/?name=V&background=f1f5f9"}
                                      className="w-10 h-10 rounded-lg object-cover border-2 border-white shadow-md cursor-pointer hover:scale-105 transition-transform"
                                      alt="Entry Capture"
                                      onClick={() => setSelectedRecord(r)}
                                    />
                                  </div>
                                  <div className="leading-tight text-left">
                                    <p className="text-xs font-bold text-slate-900">{new Date(r.sessions[0].checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    <span className="block text-[8px] text-indigo-606 font-extrabold truncate max-w-[130px] mt-0.5" title={r.sessions[0].checkInLocation?.address || "Active location"}>
                                      📍 {r.sessions[0].checkInLocation?.address || "Live Location"}
                                    </span>
                                  </div>
                                </div>
                              ) : <span className="text-[10px] font-medium text-slate-300 italic">No entry vector</span>}
                            </td>

                            <td className="px-6 py-5.5 border-b border-slate-50">
                              {r.sessions?.[r.sessions.length - 1]?.checkOut ? (
                                <div className="flex items-center gap-3">
                                  <div className="relative flex-shrink-0">
                                    <img
                                      src={r.sessions[r.sessions.length - 1].checkOutImage || "https://ui-avatars.com/api/?name=E&background=f1f5f9"}
                                      className="w-10 h-10 rounded-lg object-cover border-2 border-white shadow-md cursor-pointer hover:scale-105 transition-transform"
                                      alt="Exit Capture"
                                      onClick={() => setSelectedRecord(r)}
                                    />
                                  </div>
                                  <div className="leading-tight text-left">
                                    <p className="text-xs font-bold text-slate-900">{new Date(r.sessions[r.sessions.length - 1].checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    <span className="block text-[8px] text-rose-500 font-extrabold truncate max-w-[130px] mt-0.5" title={r.sessions[r.sessions.length - 1].checkOutLocation?.address || "Live location"}>
                                      📍 {r.sessions[r.sessions.length - 1].checkOutLocation?.address || "Live Location"}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-glow shadow-emerald-200" />
                                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest italic">Live Session</span>
                                </div>
                              )}
                            </td>

                            <td className="px-6 py-5.5 border-b border-slate-50">
                              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${STATUS_THEMES[r.status?.toLowerCase() || "present"]?.bg || STATUS_THEMES.present.bg} ${STATUS_THEMES[r.status?.toLowerCase() || "present"]?.border || STATUS_THEMES.present.border}`}>
                                <div className={`w-1 h-1 rounded-full ${STATUS_THEMES[r.status?.toLowerCase() || "present"]?.dot || STATUS_THEMES.present.dot}`} />
                                <span className={`text-[9px] font-black uppercase tracking-widest ${STATUS_THEMES[r.status?.toLowerCase() || "present"]?.text || STATUS_THEMES.present.text}`}>
                                  {r.status || "present"}
                                </span>
                              </div>
                            </td>

                            <td className="px-6 py-5.5 border-b border-slate-50 text-right">
                              <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(r)}
                                  className="w-8 h-8 border border-slate-100 bg-white text-slate-500 rounded-lg flex items-center justify-center hover:bg-slate-50 hover:border-slate-200 transition-all active:scale-90 cursor-pointer"
                                  title="Edit Attendance"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRecord(r._id || r.id)}
                                  className="w-8 h-8 border border-slate-100 bg-white text-rose-500 rounded-lg flex items-center justify-center hover:bg-rose-50 hover:border-rose-100 transition-all active:scale-90 cursor-pointer"
                                  title="Delete Attendance"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedRecord(r)}
                                  className="h-8 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all active:scale-95 cursor-pointer"
                                >
                                  Review Session
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* --- RIGHT COLUMN: CONTROLS & INSIGHTS --- */}
            <div className="lg:col-span-4 space-y-8">

              {/* Filter console */}
              <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-xl shadow-slate-105/10 flex flex-col gap-3 text-left">
                <div className="flex items-center justify-between pb-2 border-b border-slate-50">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Filter className="w-3 h-3 text-slate-400" /> Filter console
                  </span>
                  {(selectedDate || selectedStatus !== "all") && (
                    <button
                      onClick={() => { setSelectedDate(""); setSelectedStatus("all"); }}
                      className="text-[9px] font-bold text-indigo-655 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Select Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="h-9 w-full bg-slate-50 border border-slate-250/70 rounded-xl px-3 text-xs font-semibold text-slate-808 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5 mt-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Status classification</label>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { id: "all", label: "All", icon: Activity },
                      { id: "present", label: "Present", icon: UserCheck },
                      { id: "late", label: "Late", icon: Clock },
                      { id: "absent", label: "Absent", icon: UserMinus }
                    ].map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedStatus(s.id)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border whitespace-nowrap cursor-pointer
                          ${selectedStatus === s.id
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-400 border-slate-100 hover:border-slate-300"}`}
                      >
                        <s.icon className="w-2.5 h-2.5" />
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chart Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-105/10 text-left">
                <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-50">
                  <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-slate-450" /> Presence Velocity
                  </h4>
                  <CalendarDays className="w-4 h-4 text-slate-300" />
                </div>

                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.trendData}>
                      <defs>
                        <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 800, fill: '#94a3b8' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 800, fill: '#94a3b8' }} dx={-10} />
                      <Tooltip
                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.06)', fontSize: '10px', fontWeight: 'bold' }}
                        cursor={{ stroke: '#4f46e5', strokeWidth: 1 }}
                      />
                      <Area type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorTrend)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-6 p-4 bg-slate-50 rounded-2xl flex items-start gap-3 border border-slate-100">
                  <Info className="w-4 h-4 text-indigo-650 mt-0.5 animate-pulse shrink-0" />
                  <p className="text-[9.5px] text-slate-505 leading-relaxed font-medium">Trends show dynamic squad attendance density logs mapped over standard weekdays. Ideal density peaks mid-week.</p>
                </div>
              </div>
            </div>
          </div>

          {/* --- FOCUS VIEW MODAL (Review Session details) --- */}
          <AnimatePresence>
            {selectedRecord && (
              <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedRecord(null)}
                  className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl"
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative w-full max-w-3xl max-h-[85vh] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-white z-10 text-left"
                >
                  {/* Modal Header */}
                  <div className="p-6 border-b border-slate-50 flex justify-between items-start bg-slate-50/10">
                    <div className="flex gap-4">
                      <div className="w-14 h-14 bg-slate-900 rounded-[1.2rem] flex items-center justify-center text-white text-xl font-black shadow-lg">
                        {selectedRecord.userId?.name?.charAt(0) || "U"}
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{selectedRecord.userId?.employeeId}</p>
                        <h4 className="text-xl font-black text-slate-900 tracking-tight">{selectedRecord.userId?.name}</h4>
                        <div className="flex items-center gap-3 mt-1.5">
                          <div className={`px-2.5 py-1 rounded-full border text-[8.5px] font-black uppercase tracking-wider ${STATUS_THEMES[selectedRecord.status?.toLowerCase() || "present"]?.bg || STATUS_THEMES.present.bg} ${STATUS_THEMES[selectedRecord.status?.toLowerCase() || "present"]?.border || STATUS_THEMES.present.border} ${STATUS_THEMES[selectedRecord.status?.toLowerCase() || "present"]?.text || STATUS_THEMES.present.text}`}>
                            {selectedRecord.status}
                          </div>
                          <span className="text-[9.5px] font-bold text-slate-400 italic">Role: {selectedRecord.userId?.position}</span>
                        </div>
                      </div>
                    </div>
                    <button type="button" onClick={() => setSelectedRecord(null)} className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 hover:rotate-90 transition-all shadow-sm cursor-pointer">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {(selectedRecord.sessions || []).map((session, i) => (
                        <div key={i} className="p-5 bg-slate-50 rounded-[1.8rem] border border-slate-100 flex flex-col gap-5">
                          <div className="flex justify-between items-center border-b border-white pb-3">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Telemetry Stream 0{i + 1}</span>
                            <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-glow" />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-[8.5px] font-black text-slate-455 uppercase tracking-widest">Primary Vector</label>
                              <div className="relative group">
                                <img src={session.checkInImage} className="w-full h-28 object-cover rounded-xl shadow-md border border-white" alt="Check In" />
                              </div>
                              <div className="text-left">
                                <p className="text-[11px] font-black text-slate-900 leading-none">{new Date(session.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                <p className="text-[7.5px] font-bold text-indigo-500 mt-1.5 uppercase tracking-tight">Check-In Node</p>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-[8.5px] font-black text-slate-455 uppercase tracking-widest">Successor Vector</label>
                              {session.checkOut ? (
                                <>
                                  <div className="relative group">
                                    <img src={session.checkOutImage} className="w-full h-28 object-cover rounded-xl shadow-md border border-white" alt="Check Out" />
                                  </div>
                                  <div className="text-left">
                                    <p className="text-[11px] font-black text-slate-900 leading-none">{new Date(session.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    <p className="text-[7.5px] font-bold text-rose-500 mt-1.5 uppercase tracking-tight">Check-Out Node</p>
                                  </div>
                                </>
                              ) : (
                                <div className="w-full h-28 bg-white/50 border border-white rounded-xl flex flex-col items-center justify-center text-center p-3">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mb-1.5 shadow-glow shadow-emerald-200" />
                                  <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest italic">Live Check-In</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {(session.checkInLocation || session.checkOutLocation) && (
                            <div className="pt-3.5 border-t border-white grid grid-cols-2 gap-3">
                              {session.checkInLocation && (
                                <a
                                  href={`https://www.google.com/maps?q=${session.checkInLocation.lat},${session.checkInLocation.lng}`}
                                  target="_blank"
                                  className="flex items-center gap-2 p-2 bg-white rounded-xl border border-white shadow-sm hover:border-indigo-100 transition-all cursor-pointer min-w-0"
                                >
                                  <div className="w-5.5 h-5.5 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-650 shrink-0">
                                    <MapPin className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="flex flex-col text-left min-w-0">
                                    <span className="text-[7.5px] font-black text-indigo-650 uppercase tracking-wide">Entry Node</span>
                                    <span className="text-[8px] font-bold text-slate-500 truncate max-w-[90px]" title={session.checkInLocation.address || "View Map"}>
                                      {session.checkInLocation.address || "Entry Location"}
                                    </span>
                                  </div>
                                </a>
                              )}
                              {session.checkOutLocation && (
                                <a
                                  href={`https://www.google.com/maps?q=${session.checkOutLocation.lat},${session.checkOutLocation.lng}`}
                                  target="_blank"
                                  className="flex items-center gap-2 p-2 bg-white rounded-xl border border-white shadow-sm hover:border-indigo-100 transition-all cursor-pointer min-w-0"
                                >
                                  <div className="w-5.5 h-5.5 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
                                    <MapPin className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="flex flex-col text-left min-w-0">
                                    <span className="text-[7.5px] font-black text-rose-605 uppercase tracking-wide">Exit Node</span>
                                    <span className="text-[8px] font-bold text-slate-500 truncate max-w-[90px]" title={session.checkOutLocation.address || "View Map"}>
                                      {session.checkOutLocation.address || "Exit Location"}
                                    </span>
                                  </div>
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* ➕ ADD MANUAL ATTENDANCE MODAL */}
          <AnimatePresence>
            {isAddModalOpen && (
              <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsAddModalOpen(false)}
                  className="absolute inset-0 bg-slate-900/50 backdrop-blur-md"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 z-10 text-left flex flex-col gap-6"
                >
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-extrabold text-slate-900 tracking-tight uppercase">Add Manual Attendance</h3>
                    <button
                      onClick={() => setIsAddModalOpen(false)}
                      className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveAddManual} className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Select Team Member</label>
                      <select
                        value={formData.userId}
                        onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-350 cursor-pointer"
                      >
                        {resolvedMembers.map(m => (
                          <option key={m.id || m._id} value={(m.id || m._id).toString()}>
                            {m.name} ({m.role})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Date</label>
                        <input
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          required
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-350"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Status</label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-205/70 rounded-xl p-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-350 cursor-pointer"
                        >
                          <option value="present">Present</option>
                          <option value="late">Late</option>
                          <option value="absent">Absent</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Check-In Time</label>
                        <input
                          type="time"
                          value={formData.checkInTime}
                          onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                          required
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-350"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Check-Out Time</label>
                        <input
                          type="time"
                          value={formData.checkOutTime}
                          onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-350"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Notes / Reason</label>
                      <textarea
                        rows={3}
                        placeholder="Provide notes or justification..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-350 resize-none"
                      />
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setIsAddModalOpen(false)}
                        className="px-5 py-2.5 rounded-xl border border-slate-250 text-slate-500 hover:text-slate-800 text-xs font-bold uppercase transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase shadow-md active:scale-95 transition-all cursor-pointer"
                      >
                        Save Log
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* 📝 EDIT ATTENDANCE MODAL */}
          <AnimatePresence>
            {isEditModalOpen && (
              <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsEditModalOpen(false)}
                  className="absolute inset-0 bg-slate-900/50 backdrop-blur-md"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 z-10 text-left flex flex-col gap-6"
                >
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <div className="flex flex-col">
                      <h3 className="text-sm font-extrabold text-slate-900 tracking-tight uppercase leading-none">Edit Attendance Record</h3>
                      <span className="text-[9px] text-slate-400 font-extrabold mt-1.5 uppercase leading-none tracking-wider">
                        Adjusting: {recordToEdit?.userId?.name}
                      </span>
                    </div>
                    <button
                      onClick={() => setIsEditModalOpen(false)}
                      className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveEdit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Date</label>
                        <input
                          type="date"
                          value={formData.date}
                          disabled
                          className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-505 cursor-not-allowed"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Status</label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-350 cursor-pointer"
                        >
                          <option value="present">Present</option>
                          <option value="late">Late</option>
                          <option value="absent">Absent</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Adjust Check-In</label>
                        <input
                          type="time"
                          value={formData.checkInTime}
                          onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                          required
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-350"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Adjust Check-Out</label>
                        <input
                          type="time"
                          value={formData.checkOutTime}
                          onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-805 focus:outline-none focus:border-slate-350"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Adjustment Rationale</label>
                      <textarea
                        rows={3}
                        placeholder="Provide notes or rationale..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-808 placeholder-slate-400 focus:outline-none focus:border-slate-350 resize-none"
                      />
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setIsEditModalOpen(false)}
                        className="px-5 py-2.5 rounded-xl border border-slate-255 text-slate-550 hover:text-slate-805 text-xs font-bold uppercase transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase shadow-md active:scale-95 transition-all cursor-pointer"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </>
      )}

    </div>
  );
}
