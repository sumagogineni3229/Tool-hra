"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  CheckCircle,
  XCircle,
  FileClock,
  ShieldAlert,
  Sparkles,
  Inbox,
  Search,
  Check,
  RefreshCw,
  Briefcase,
  ArrowRight,
  AlertCircle,
  AlertTriangle
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import HRLeaveDeclineModal from "@/components/HRLeaveDeclineModal";

export default function ManagerLeaves() {
  const [currentUser, setCurrentUser] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedTeamId, setSelectedTeamId] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("pending"); // pending | archive

  // Rejection Modal
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);

  // Load datasets concurrently
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const session = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("currentUser") || "null") : null;
      const emailParam = session?.email ? `?email=${encodeURIComponent(session.email)}&role=Manager` : "";
      
      const [fetchedUsers, fetchedTeams, leaveRes] = await Promise.all([
        apiClient.getUsers(),
        apiClient.getTeams(),
        fetch(`/api/leave${emailParam}`).catch(e => { console.warn("Muted leave fetch error:", e); return null; })
      ]);

      setUsers(fetchedUsers || []);
      setTeams(fetchedTeams || []);

      if (leaveRes && leaveRes.ok) {
        const data = await leaveRes.json();
        setLeaves(data.leaves || []);
        localStorage.setItem("hra_all_leaves", JSON.stringify(data.leaves || []));
      } else {
        const cached = localStorage.getItem("hra_all_leaves");
        if (cached) {
          setLeaves(JSON.parse(cached));
        }
      }
    } catch (err) {
      console.error("Failed to load leaves dataset:", err);
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

  // Map sets for rapid direct reports checks
  const teamMemberIds = useMemo(() => new Set(resolvedMembers.map(m => (m.id || m._id || m).toString())), [resolvedMembers]);
  const teamMemberEmails = useMemo(() => new Set(resolvedMembers.map(m => m.email?.toLowerCase().trim()).filter(Boolean)), [resolvedMembers]);

  // Filter leaves to only include the manager's team members
  const squadLeaves = useMemo(() => {
    return leaves.filter(leave => {
      const leaveUserId = leave.userId?._id || leave.userId?.id || leave.userId;
      const leaveEmail = leave.userEmail ? leave.userEmail.toLowerCase().trim() : "";
      return (leaveUserId && teamMemberIds.has(leaveUserId.toString())) || (leaveEmail && teamMemberEmails.has(leaveEmail));
    });
  }, [leaves, teamMemberIds, teamMemberEmails]);

  // Filter squad leaves based on search bar queries
  const searchedLeaves = useMemo(() => {
    return squadLeaves.filter(l => {
      const query = searchQuery.toLowerCase().trim();
      return (
        (l.name || "").toLowerCase().includes(query) ||
        (l.userEmail || "").toLowerCase().includes(query) ||
        (l.leaveType || l.type || "").toLowerCase().includes(query) ||
        (l.reason || "").toLowerCase().includes(query)
      );
    });
  }, [squadLeaves, searchQuery]);

  const pending = useMemo(() => searchedLeaves.filter(l => l.status === "pending"), [searchedLeaves]);
  const processed = useMemo(() => searchedLeaves.filter(l => l.status === "approved" || l.status === "rejected"), [searchedLeaves]);

  // Stats Counters
  const totalCount = squadLeaves.length;
  const pendingCount = squadLeaves.filter(l => l.status === "pending").length;
  const approvedCount = squadLeaves.filter(l => l.status === "approved").length;
  const rejectedCount = squadLeaves.filter(l => l.status === "rejected").length;

  const handleAction = async (id, status, adminComments = "") => {
    try {
      const response = await fetch("/api/leave", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status,
          adminComments
        })
      });

      if (response.ok) {
        fetchAllData();
      } else {
        throw new Error("Failed to update status on DB");
      }
    } catch (err) {
      console.warn("MongoDB API unreachable. Updating status locally...", err);
      // LocalStorage Cache fallbacks
      const cachedAll = JSON.parse(localStorage.getItem("hra_all_leaves") || "[]");
      const idxAll = cachedAll.findIndex(l => (l._id === id || l.id === id));
      if (idxAll !== -1) {
        cachedAll[idxAll].status = status;
        cachedAll[idxAll].adminComments = adminComments;
        localStorage.setItem("hra_all_leaves", JSON.stringify(cachedAll));
      }

      setLeaves(prev => prev.map(l => (l.id === id || l._id === id) ? { ...l, status, adminComments } : l));
    }
  };

  const triggerDeclineModal = (leave) => {
    setSelectedLeave(leave);
    setIsDeclineModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 text-slate-500 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 rounded-full border-2 border-slate-100 border-t-emerald-500"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="absolute w-10 h-10 rounded-full border border-slate-250 border-b-indigo-500"
          />
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-semibold tracking-widest text-slate-800 uppercase animate-pulse">Syncing Absences registry</span>
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Establishing secure data channels...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 w-full max-w-none text-left">

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-[0.03] bg-gradient-to-l from-emerald-650 to-transparent pointer-events-none" />
        
        <div className="space-y-2 text-left">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold border border-emerald-100">
            <CalendarDays className="w-3 h-3 text-emerald-650" />
            Manager Leaves Review
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Squad Leaves Management</h1>
          <p className="text-xs font-medium text-slate-405 max-w-xl">
            Moderate absences applications, authorize casual breaks, and audit leaves quota history for direct reports in your team registry.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 text-left">
          {/* Squad Filter Dropdown */}
          {managedTeams.length > 0 && (
            <div className="flex flex-col gap-1 bg-slate-50 border border-slate-200 rounded-xl p-3 w-full sm:w-60 text-left shadow-sm">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-455 flex items-center gap-1.5 leading-none">
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
          {/* 📊 KPI STATS ANALYTICAL GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Squad Applications", count: totalCount, icon: FileClock, colors: ["#3b82f6", "#2563eb"], bg: "from-blue-50/50 to-indigo-50/10 border-blue-100/50 text-blue-650" },
              { label: "Pending Reviews", count: pendingCount, icon: ShieldAlert, colors: ["#f59e0b", "#d97706"], bg: "from-amber-50/50 to-orange-50/10 border-amber-100/50 text-amber-650" },
              { label: "Approved Quota", count: approvedCount, icon: CheckCircle, colors: ["#10b981", "#059669"], bg: "from-emerald-50/50 to-teal-50/10 border-emerald-100/50 text-emerald-655" },
              { label: "Declined Protocol", count: rejectedCount, icon: XCircle, colors: ["#ef4444", "#dc2626"], bg: "from-rose-50/50 to-red-50/10 border-rose-100/50 text-rose-650" },
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
                  <span className="text-[9px] font-extrabold text-slate-350 uppercase tracking-widest ml-1">Requests</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* 👥 LEAVES TOOLBAR */}
          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 text-left">
            {/* Tab Selector Buttons */}
            <div className="flex bg-slate-100 border border-slate-200/60 p-1 rounded-xl w-fit">
              {[
                { id: "pending", label: "Pending Reviews", badge: pendingCount, color: "bg-amber-500" },
                { id: "archive", label: "Archive Log", badge: processed.length, color: "bg-slate-400" },
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
                  <span>{tab.label}</span>
                  {tab.badge > 0 && (
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black text-white ${tab.color} leading-none`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Dynamic search registry input */}
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 pointer-events-none">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search direct reports, leave types, dates..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white outline-none font-semibold text-slate-805 placeholder-slate-400 text-xs transition-all shadow-inner focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Dynamic Absence Lists */}
          <div className="min-h-[200px] relative">
            {activeTab === "pending" ? (
              <AnimatePresence mode="popLayout">
                {pending.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="py-16 text-center flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200/80 shadow-sm"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-105 flex items-center justify-center text-emerald-500 mb-2">
                      <Check className="w-6 h-6 animate-none" />
                    </div>
                    <h4 className="text-sm font-extrabold text-slate-900 tracking-tight leading-none uppercase">Clearance Completed</h4>
                    <p className="text-slate-400 font-medium italic text-xs max-w-xs mx-auto">No pending absence requests requiring squad manager verification today.</p>
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                    {pending.map((leave) => (
                      <motion.div
                        key={leave.id || leave._id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="bg-white border border-slate-200/80 p-6 rounded-2xl hover:border-slate-350 transition-all text-left flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shadow-sm group"
                      >
                        <div className="space-y-2 flex-1 min-w-0 text-left">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-extrabold text-slate-900 tracking-tight leading-none group-hover:text-emerald-700 transition-colors">
                              {leave.name}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-505 font-extrabold uppercase text-[8px] tracking-widest leading-none border">
                              {leave.role}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium italic">
                              ({leave.userEmail})
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-slate-600 text-xs font-semibold">
                            <span className="px-2.5 py-1 rounded-lg bg-indigo-50/50 text-indigo-700 border border-indigo-100/50 uppercase tracking-widest text-[8px] font-black">
                              {leave.leaveType}
                            </span>
                            <span className="text-slate-300">|</span>
                            <span className="text-slate-500 text-[11px]">
                              Duration: <span className="font-extrabold text-slate-800">{leave.dates}</span> ({leave.daysCount} Day{leave.daysCount > 1 ? "s" : ""})
                            </span>
                          </div>

                          <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl max-w-2xl mt-2 relative text-left">
                            <p className="text-[11px] text-slate-505 font-medium italic leading-relaxed">
                              &ldquo;{leave.reason}&rdquo;
                            </p>
                          </div>
                        </div>

                        <div className="flex sm:flex-row lg:flex-col gap-2 shrink-0 w-full sm:w-auto mt-2 lg:mt-0">
                          <button
                            onClick={() => handleAction(leave.id || leave._id, "approved")}
                            className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase tracking-wider text-[10px] shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5 font-bold"
                          >
                            <Check className="w-4 h-4" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => triggerDeclineModal(leave)}
                            className="flex-1 px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-105 rounded-xl font-bold uppercase tracking-wider text-[10px] transition-all cursor-pointer flex items-center justify-center gap-1.5 font-bold"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Decline</span>
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            ) : (
              <AnimatePresence mode="popLayout">
                {processed.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="py-16 text-center flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200/80 shadow-sm"
                  >
                    <Inbox className="w-10 h-10 text-slate-300" />
                    <h4 className="text-sm font-extrabold text-slate-900 tracking-tight leading-none uppercase">Archive Log Empty</h4>
                    <p className="text-slate-400 font-medium italic text-xs">No processed absence requests resolved inside this squad registry yet.</p>
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                    {processed.map((leave) => (
                      <motion.div
                        key={leave.id || leave._id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white border border-slate-200/80 p-6 rounded-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 hover:border-slate-350 transition-all text-left shadow-sm group"
                      >
                        <div className="space-y-2.5 flex-1 min-w-0 text-left">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-extrabold text-slate-900 text-sm leading-none group-hover:text-emerald-700 transition-colors">
                              {leave.name}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-extrabold uppercase text-[8px] tracking-widest leading-none border">
                              {leave.role}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium italic">
                              ({leave.userEmail})
                            </span>
                          </div>

                          <div className="text-xs text-slate-655 font-bold leading-none">
                            <span className="text-indigo-650 font-black">{leave.leaveType}</span> &bull; {leave.daysCount} Day{leave.daysCount > 1 ? "s" : ""} ({leave.dates})
                          </div>

                          {leave.status === "rejected" && leave.adminComments && (
                            <div className="p-3.5 bg-rose-50/50 border border-rose-105 rounded-xl max-w-xl text-left">
                              <p className="text-[9px] font-black text-rose-505 uppercase tracking-widest mb-1 flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Rationale for rejection:
                              </p>
                              <p className="text-xs font-bold text-rose-800 leading-normal italic">
                                &ldquo;{leave.adminComments}&rdquo;
                              </p>
                            </div>
                          )}

                          {leave.status === "approved" && (
                            <p className="text-[10px] text-slate-400 italic">
                              Approved and synchronized. Quotas balanced inside system logs.
                            </p>
                          )}
                        </div>

                        <div className="shrink-0 mt-1 lg:mt-0">
                          <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5 select-none
                            ${leave.status === "approved" 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                              : "bg-rose-50 text-rose-700 border-rose-100"}`}>
                            {leave.status === "approved" ? (
                              <>
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                Approved
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                Declined
                              </>
                            )}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            )}
          </div>
        </>
      )}

      {/* Decline Comments Modal integration */}
      <HRLeaveDeclineModal
        isOpen={isDeclineModalOpen}
        onClose={() => {
          setIsDeclineModalOpen(false);
          setSelectedLeave(null);
        }}
        onSubmit={async (id, comments) => {
          await handleAction(id, "rejected", comments);
        }}
        leave={selectedLeave}
      />
    </div>
  );
}
