"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  CheckCircle,
  XCircle,
  Search,
  UserCheck,
  Briefcase,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Users,
  MapPin,
  Coffee,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  X
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";

export default function ManagerAttendance() {
  const [currentUser, setCurrentUser] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Core navigation tabs: "live" | "history"
  const [activeTab, setActiveTab] = useState("live");

  // Filters
  const [selectedTeamId, setSelectedTeamId] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [historyUserFilter, setHistoryUserFilter] = useState("All");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("All");
  const [historyDateFilter, setHistoryDateFilter] = useState("");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    userId: "",
    date: new Date().toISOString().split("T")[0],
    status: "present",
    checkInTime: "09:00",
    checkOutTime: "",
    notes: ""
  });

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedUsers, fetchedTeams, attRes] = await Promise.all([
        apiClient.getUsers(),
        apiClient.getTeams(),
        fetch("/api/attendance").catch(e => { console.warn("Muted attendance fetch error:", e); return null; })
      ]);

      setUsers(fetchedUsers || []);
      setTeams(fetchedTeams || []);

      if (attRes && attRes.ok) {
        const data = await attRes.json();
        setAttendance(data.attendance || []);
      }
    } catch (err) {
      console.error("Failed to load attendance dataset:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const session = apiClient.getCurrentSession();
      setCurrentUser(session);
    }
    fetchAllData();
  }, [fetchAllData]);

  // Find teams managed by this manager
  const managedTeams = useMemo(() => {
    if (!currentUser) return [];
    const currentUserId = currentUser.id || currentUser._id;
    
    return teams.filter(t => {
      const tMgrId = t.managerId?.id || t.managerId?._id || t.managerId;
      return tMgrId?.toString() === currentUserId?.toString();
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

  // For each team member, compute today's live attendance details
  const squadAttendanceToday = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];

    return resolvedMembers.map(member => {
      const mId = member.id || member._id || member;
      
      // Find today's attendance record for the member
      const record = attendance.find(a => {
        const attUserId = a.userId?._id || a.userId?.id || a.userId;
        const checkDate = a.date ? new Date(a.date).toISOString().split("T")[0] : "";
        return attUserId?.toString() === mId?.toString() && checkDate === todayStr;
      });

      let timeIn = "—";
      let totalHrs = "—";
      let location = "—";
      let breakStatus = "Offline";

      if (record) {
        // Find if they have sessions
        const sessions = record.sessions || [];
        if (sessions.length > 0) {
          const firstSession = sessions[0];
          if (firstSession.checkIn) {
            timeIn = new Date(firstSession.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          }

          // Compute duration
          let totalMs = record.totalDuration || 0;
          const activeSession = sessions.find(s => !s.checkOut);
          if (activeSession) {
            totalMs += Math.max(Date.now() - new Date(activeSession.checkIn).getTime(), 0);
          }
          
          if (totalMs > 0) {
            totalHrs = `${(totalMs / 3600000).toFixed(1)} hrs`;
          }

          // Location address from last session
          const lastSession = sessions[sessions.length - 1];
          location = lastSession.checkInLocation?.address || lastSession.checkOutLocation?.address || "Virtual Check-In / Remote";

          // Operational Status
          if (activeSession) {
            breakStatus = (member.session === "On Break" || member.session === "Break") ? "On Break" : "Active";
          } else {
            breakStatus = "Offline";
          }
        }
      }

      return {
        ...member,
        timeIn,
        totalHrs,
        location,
        breakStatus
      };
    });
  }, [resolvedMembers, attendance]);

  // Historical team attendance logs
  const teamAttendanceHistory = useMemo(() => {
    const memberIds = new Set(resolvedMembers.map(m => (m.id || m._id || m).toString()));

    return attendance
      .filter(record => {
        const attUserId = record.userId?._id || record.userId?.id || record.userId;
        return attUserId && memberIds.has(attUserId.toString());
      })
      .map(record => {
        const attUserId = record.userId?._id || record.userId?.id || record.userId;
        const member = resolvedMembers.find(m => (m.id || m._id || m).toString() === attUserId.toString()) || {};
        
        let timeIn = "—";
        let timeOut = "—";
        
        const sessions = record.sessions || [];
        if (sessions.length > 0) {
          if (sessions[0].checkIn) {
            timeIn = new Date(sessions[0].checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          }
          const lastSession = sessions[sessions.length - 1];
          if (lastSession.checkOut) {
            timeOut = new Date(lastSession.checkOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          }
        }

        return {
          ...record,
          member,
          timeIn,
          timeOut
        };
      });
  }, [resolvedMembers, attendance]);

  // Filter live board
  const filteredLiveAttendance = useMemo(() => {
    return squadAttendanceToday.filter(member => {
      const query = searchQuery.toLowerCase().trim();
      return (
        (member.name || "").toLowerCase().includes(query) ||
        (member.role || "").toLowerCase().includes(query) ||
        (member.email || "").toLowerCase().includes(query) ||
        (member.location || "").toLowerCase().includes(query)
      );
    });
  }, [squadAttendanceToday, searchQuery]);

  // Filter history board
  const filteredHistoryAttendance = useMemo(() => {
    return teamAttendanceHistory.filter(record => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        (record.member?.name || "").toLowerCase().includes(query) ||
        (record.notes || "").toLowerCase().includes(query);
      
      const matchesUser = historyUserFilter === "All" || 
        (record.userId?._id || record.userId?.id || record.userId)?.toString() === historyUserFilter;
      
      const matchesStatus = historyStatusFilter === "All" || record.status === historyStatusFilter;
      
      const recordDateStr = record.date ? new Date(record.date).toISOString().split("T")[0] : "";
      const matchesDate = !historyDateFilter || recordDateStr === historyDateFilter;

      return matchesSearch && matchesUser && matchesStatus && matchesDate;
    });
  }, [teamAttendanceHistory, searchQuery, historyUserFilter, historyStatusFilter, historyDateFilter]);

  // Stats Counters
  const totalCount = resolvedMembers.length;
  const activeCount = squadAttendanceToday.filter(m => m.breakStatus === "Active").length;
  const breakCount = squadAttendanceToday.filter(m => m.breakStatus === "On Break").length;
  const offlineCount = totalCount - activeCount - breakCount;

  // Actions handlers
  const handleOpenAddModal = () => {
    if (resolvedMembers.length > 0) {
      setFormData({
        userId: (resolvedMembers[0].id || resolvedMembers[0]._id).toString(),
        date: new Date().toISOString().split("T")[0],
        status: "present",
        checkInTime: "09:00",
        checkOutTime: "18:00",
        notes: ""
      });
      setIsAddModalOpen(true);
    }
  };

  const handleOpenEditModal = (record) => {
    setSelectedRecord(record);
    
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
      date: record.date ? new Date(record.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
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
    if (!selectedRecord) return;
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
          id: selectedRecord._id || selectedRecord.id,
          status: formData.status,
          notes: formData.notes,
          sessions
        })
      });

      if (res.ok) {
        setIsEditModalOpen(false);
        setSelectedRecord(null);
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
    if (confirm("Are you sure you want to delete this attendance record?")) {
      try {
        const res = await fetch(`/api/attendance?id=${id}`, {
          method: "DELETE"
        });
        if (res.ok) {
          fetchAllData();
        } else {
          alert("Failed to delete record");
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="space-y-10 w-full max-w-none text-left">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-[0.03] bg-gradient-to-l from-emerald-650 to-transparent pointer-events-none" />
        
        <div className="space-y-2 text-left">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold border border-emerald-100">
            <Clock className="w-3 h-3 text-emerald-650" />
            Live Attendance Console
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Squad Attendance Board</h1>
          <p className="text-xs font-medium text-slate-405 max-w-xl">
            Monitor active session logins, tracked geolocation validations, break status states, and cumulative logged hours for direct reports.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 text-left">
          {/* Squad Filter Dropdown */}
          {managedTeams.length > 0 && (
            <div className="flex flex-col gap-1 bg-slate-50 border border-slate-200 rounded-xl p-3 w-full sm:w-60 text-left shadow-sm">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-405 flex items-center gap-1.5 leading-none">
                <Briefcase className="w-3.5 h-3.5 text-emerald-650" /> Filter by squad
              </label>
              <div className="relative mt-1">
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="w-full bg-white text-slate-850 font-bold text-xs border border-slate-200 rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer appearance-none transition-all"
                >
                  <option value="All">All Squads ({managedTeams.length})</option>
                  {managedTeams.map((t) => (
                    <option key={t.id || t._id} value={t.id || t._id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                  <ArrowRight className="w-3.5 h-3.5 rotate-90 text-slate-400" />
                </span>
              </div>
            </div>
          )}
          
          <button
            onClick={fetchAllData}
            className="px-5 py-3.5 bg-slate-50 hover:bg-slate-900 border border-slate-200 hover:border-slate-900 text-slate-600 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 self-stretch sm:self-auto font-bold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reload Registry
          </button>
        </div>
      </div>

      {/* ⚠️ ZERO TEAMS ASSIGNED FALLBACK */}
      {managedTeams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center shadow-sm max-w-xl mx-auto flex flex-col items-center gap-6">
          <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-700">No Squads Configured</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              You are mapped as a Manager, but no active team squads are currently assigned to you in the core organizational console.
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl max-w-md text-xs text-slate-500 leading-relaxed text-center">
            Please ask the HR Specialist or Administrator to link you as the manager of your squad registry.
          </div>
        </div>
      ) : (
        <>
          {/* 📊 KPI CARDS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Squad Headcount", count: totalCount, icon: Users, bg: "from-blue-50/50 to-indigo-50/10 border-blue-100/50 text-blue-650" },
              { label: "Active Timers", count: activeCount, icon: Clock, bg: "from-emerald-50/50 to-teal-50/10 border-emerald-100/50 text-emerald-650" },
              { label: "On Rest Break", count: breakCount, icon: Coffee, bg: "from-amber-50/50 to-orange-50/10 border-amber-100/50 text-amber-655" },
              { label: "Offline Status", count: offlineCount, icon: XCircle, bg: "from-rose-50/50 to-red-50/10 border-rose-100/50 text-rose-650" },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -4, scale: 1.01 }}
                className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm relative flex flex-col justify-between overflow-hidden transition-all text-left"
              >
                <div className="w-full flex justify-between items-center mb-6">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                    {item.label}
                  </span>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-tr ${item.bg} border`}>
                    <item.icon className="w-4.5 h-4.5" />
                  </div>
                </div>
                
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">{item.count}</span>
                  <span className="text-[9px] font-extrabold text-slate-350 uppercase tracking-widest ml-1">Members</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* 👥 SQUAD ATTENDANCE TOOLBAR */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col text-left">
            {/* Toolbar controls */}
            <div className="p-5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              {/* Tabs Switcher */}
              <div className="flex bg-slate-100 border border-slate-200/60 p-1 rounded-xl w-fit">
                {[
                  { id: "live", label: "Live Status Today" },
                  { id: "history", label: "Attendance Logs History" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                      activeTab === tab.id
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-450 hover:text-slate-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Toolbar right actions */}
              <div className="flex flex-wrap items-center gap-4">
                {/* Search Box */}
                <div className="relative w-full sm:w-60">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/50 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium text-slate-800"
                  />
                </div>

                {activeTab === "history" && (
                  <button
                    onClick={handleOpenAddModal}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all font-bold"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Manual Entry</span>
                  </button>
                )}
              </div>
            </div>

            {/* History Logs specific filter bar */}
            {activeTab === "history" && (
              <div className="px-5 pb-5 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Member selection */}
                <div className="flex flex-col gap-1">
                  <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Team Member</label>
                  <select
                    value={historyUserFilter}
                    onChange={(e) => setHistoryUserFilter(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="All">All Members</option>
                    {resolvedMembers.map(m => (
                      <option key={m.id || m._id} value={(m.id || m._id).toString()}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status selection */}
                <div className="flex flex-col gap-1">
                  <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Status</label>
                  <select
                    value={historyStatusFilter}
                    onChange={(e) => setHistoryStatusFilter(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="All">All Statuses</option>
                    <option value="present">Present</option>
                    <option value="late">Late</option>
                    <option value="absent">Absent</option>
                    <option value="half-day">Half Day</option>
                  </select>
                </div>

                {/* Date selection */}
                <div className="flex flex-col gap-1">
                  <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Filter Date</label>
                  <input
                    type="date"
                    value={historyDateFilter}
                    onChange={(e) => setHistoryDateFilter(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* TAB CONTENT: 1. LIVE BOARD */}
          {activeTab === "live" && (
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] bg-slate-50/50">
                      <th className="px-6 py-4.5">Direct Report</th>
                      <th className="px-6 py-4.5">Shift Clock-In</th>
                      <th className="px-6 py-4.5">Logged Time</th>
                      <th className="px-6 py-4.5">Physical Node Location</th>
                      <th className="px-6 py-4.5">Operational Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLiveAttendance.map(member => (
                      <tr key={member.id || member._id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border ${
                              member.badgeColor || "bg-slate-100 text-slate-800"
                            }`}>
                              {member.initials || member.name?.split(" ").map(n => n[0]).join("")}
                            </div>
                            <div className="flex flex-col text-left">
                              <span className="font-extrabold text-slate-900 text-xs leading-none hover:text-emerald-700 transition-colors">{member.name}</span>
                              <span className="text-[8.5px] text-slate-400 font-extrabold uppercase tracking-widest leading-none mt-1.5">{member.role}</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-xs font-bold text-slate-705">
                          {member.timeIn}
                        </td>

                        <td className="px-6 py-4 text-xs font-bold text-slate-500 font-mono font-bold">
                          {member.totalHrs}
                        </td>

                        <td className="px-6 py-4 text-xs font-semibold text-slate-500 max-w-xs truncate" title={member.location}>
                          <div className="flex items-center gap-1.5">
                            {member.location !== "—" && <MapPin className="w-3.5 h-3.5 text-slate-355 shrink-0" />}
                            <span>{member.location}</span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[8.5px] font-black uppercase tracking-wider border ${
                            member.breakStatus === "Active"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-100/60"
                              : member.breakStatus === "On Break"
                              ? "bg-amber-50 text-amber-805 border-amber-100/60"
                              : "bg-slate-100 text-slate-500 border-slate-200"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              member.breakStatus === "Active" ? "bg-emerald-500 animate-pulse" : member.breakStatus === "On Break" ? "bg-amber-400 animate-pulse" : "bg-slate-400"
                            }`} />
                            <span>{member.breakStatus === "Active" ? "Active" : member.breakStatus === "On Break" ? "On Break" : "Offline"}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredLiveAttendance.length === 0 && (
                      <tr>
                        <td colSpan="5" className="py-16 text-center text-slate-400 text-xs font-semibold">
                          No team member attendance registries matched this selection today.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB CONTENT: 2. HISTORY LOGS */}
          {activeTab === "history" && (
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] bg-slate-50/50">
                      <th className="px-6 py-4.5">Member</th>
                      <th className="px-6 py-4.5">Date</th>
                      <th className="px-6 py-4.5">Timing</th>
                      <th className="px-6 py-4.5">Status</th>
                      <th className="px-6 py-4.5">Notes</th>
                      <th className="px-6 py-4.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredHistoryAttendance.map(record => (
                      <tr key={record._id || record.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800 text-xs">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7.5 h-7.5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                              record.member?.badgeColor || "bg-slate-100 text-slate-800"
                            }`}>
                              {record.member?.initials || record.member?.name?.split(" ").map(n => n[0]).join("")}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-extrabold text-slate-900 leading-none hover:text-emerald-700 transition-colors">{record.member?.name}</span>
                              <span className="text-[8px] text-slate-400 font-extrabold uppercase mt-1 leading-none">{record.member?.role}</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-xs font-semibold text-slate-655">
                          {record.date ? new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : "—"}
                        </td>

                        <td className="px-6 py-4 text-xs text-slate-600 font-medium">
                          <div className="flex flex-col gap-0.5 font-mono">
                            <span>In: {record.timeIn}</span>
                            <span>Out: {record.timeOut}</span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase border select-none ${
                            record.status === 'present' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            record.status === 'late' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                            record.status === 'half-day' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            'bg-rose-50 text-rose-700 border-rose-100'
                          }`}>
                            {record.status}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-xs text-slate-500 italic max-w-xs truncate" title={record.notes}>
                          {record.notes || "—"}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditModal(record)}
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                              title="Edit Record"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRecord(record._id || record.id)}
                              className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-650 transition-colors cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredHistoryAttendance.length === 0 && (
                      <tr>
                        <td colSpan="6" className="py-16 text-center text-slate-400 text-xs font-semibold">
                          No team member attendance records found in history.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ➕ ADD MANUAL ATTENDANCE MODAL */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 select-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 z-10 text-left flex flex-col gap-6"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight uppercase">Add Manual Attendance</h3>
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-350 cursor-pointer"
                    >
                      <option value="present">Present</option>
                      <option value="late">Late</option>
                      <option value="absent">Absent</option>
                      <option value="half-day">Half Day</option>
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-805 focus:outline-none focus:border-slate-350"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Check-Out Time</label>
                    <input
                      type="time"
                      value={formData.checkOutTime}
                      onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-805 focus:outline-none focus:border-slate-350"
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
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 select-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
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
                    Adjusting: {selectedRecord?.member?.name}
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
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-500 cursor-not-allowed"
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
                      <option value="half-day">Half Day</option>
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-805 focus:outline-none focus:border-slate-350"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-350 resize-none"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-250 text-slate-500 hover:text-slate-800 text-xs font-bold uppercase transition-all cursor-pointer"
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

    </div>
  );
}
