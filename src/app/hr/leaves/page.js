"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, CheckCircle, XCircle, FileClock, ShieldAlert, Sparkles, Inbox, Search, Check, RefreshCw, AlertTriangle } from "lucide-react";
import HRLeaveDeclineModal from "@/components/HRLeaveDeclineModal";

export default function HRLeaveManagement() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("pending"); // pending | archive
  
  // Decline modal states
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    try {
      // Pass the current user email as a context hint for the API
      const currentUser = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("currentUser") || "null") : null;
      const emailParam = currentUser?.email ? `?email=${encodeURIComponent(currentUser.email)}&role=${currentUser.role || "HR"}` : "";
      const res = await fetch(`/api/leave${emailParam}`);
      if (res.ok) {
        const data = await res.json();
        setLeaves(data.leaves || []);
        localStorage.setItem("hra_all_leaves", JSON.stringify(data.leaves || []));
      } else {
        throw new Error("Failed to fetch all leaves");
      }
    } catch (err) {
      console.warn("DB leaves fetch failed, loading from LocalStorage cache...", err);
      const cached = localStorage.getItem("hra_all_leaves");
      if (cached) {
        setLeaves(JSON.parse(cached));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const handleAction = async (id, status, adminComments = "") => {
    // API expected format: status = 'approved' | 'rejected'
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
        fetchLeaves();
      } else {
        throw new Error("Failed to update status on DB");
      }
    } catch (err) {
      console.warn("MongoDB API unreachable. Updating leave status in LocalStorage...", err);

      // LocalStorage fallback update
      const cachedAll = JSON.parse(localStorage.getItem("hra_all_leaves") || "[]");
      const idxAll = cachedAll.findIndex(l => (l._id === id || l.id === id));
      if (idxAll !== -1) {
        cachedAll[idxAll].status = status;
        cachedAll[idxAll].adminComments = adminComments;
        localStorage.setItem("hra_all_leaves", JSON.stringify(cachedAll));
      }

      // Also update employee leaves cache if relevant
      const cachedEmployee = JSON.parse(localStorage.getItem("hra_leaves") || "[]");
      const idxEmp = cachedEmployee.findIndex(l => (l._id === id || l.id === id));
      if (idxEmp !== -1) {
        cachedEmployee[idxEmp].status = status;
        cachedEmployee[idxEmp].adminComments = adminComments;
        localStorage.setItem("hra_leaves", JSON.stringify(cachedEmployee));
      }

      setLeaves(prev => prev.map(l => (l.id === id || l._id === id) ? { ...l, status, adminComments } : l));
    }
  };

  const triggerDeclineModal = (leave) => {
    setSelectedLeave(leave);
    setIsDeclineModalOpen(true);
  };

  // Filter leaves based on search input
  const filteredLeaves = leaves.filter(l => {
    const query = searchQuery.toLowerCase().trim();
    return (
      (l.name || "").toLowerCase().includes(query) ||
      (l.userEmail || "").toLowerCase().includes(query) ||
      (l.leaveType || l.type || "").toLowerCase().includes(query) ||
      (l.reason || "").toLowerCase().includes(query)
    );
  });

  const pending = filteredLeaves.filter(l => l.status === "pending");
  const processed = filteredLeaves.filter(l => l.status === "approved" || l.status === "rejected");

  // Dashboard Stats
  const totalCount = leaves.length;
  const pendingCount = leaves.filter(l => l.status === "pending").length;
  const approvedCount = leaves.filter(l => l.status === "approved").length;
  const rejectedCount = leaves.filter(l => l.status === "rejected").length;

  return (
    <div className="space-y-12">
      {/* Title Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Absences & Reviews</h2>
          <p className="text-slate-500 font-light text-lg italic tracking-wide">Moderate staff leave requests and audit active logs.</p>
        </div>
        <button
          onClick={fetchLeaves}
          className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black uppercase tracking-wider text-[10px] shadow-sm flex items-center gap-2 cursor-pointer transition-all active:scale-95"
        >
          <RefreshCw className={`w-4.5 h-4.5 ${loading ? "animate-spin" : ""}`} />
          Reload Registry
        </button>
      </header>

      {/* Stats Analytical Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-2">
        {[
          { label: "Total Applications", count: totalCount, icon: FileClock, colors: ["#3b82f6", "#2563eb"], bg: "from-blue-50/50 to-indigo-50/10 border-blue-100/50 text-blue-600" },
          { label: "Pending Reviews", count: pendingCount, icon: ShieldAlert, colors: ["#f59e0b", "#d97706"], bg: "from-amber-50/50 to-orange-50/10 border-amber-100/50 text-amber-600" },
          { label: "Approved Quota", count: approvedCount, icon: CheckCircle, colors: ["#10b981", "#059669"], bg: "from-emerald-50/50 to-teal-50/10 border-emerald-100/50 text-emerald-600" },
          { label: "Declined Protocol", count: rejectedCount, icon: XCircle, colors: ["#ef4444", "#dc2626"], bg: "from-rose-50/50 to-red-50/10 border-rose-100/50 text-rose-600" },
        ].map((item, idx) => (
          <motion.div
            key={idx}
            whileHover={{ y: -4, scale: 1.01 }}
            className={`bg-white border p-8 rounded-[3rem] shadow-xl shadow-slate-200/20 relative flex flex-col justify-between overflow-hidden transition-all`}
          >
            <div className="w-full flex justify-between items-center mb-8">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">
                {item.label}
              </span>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-tr ${item.bg}`}>
                <item.icon className="w-5 h-5" />
              </div>
            </div>
            
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black text-slate-900 tracking-tighter leading-none">{item.count}</span>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-widest ml-1">Entries</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Console Workspace */}
      <div className="bg-white border border-slate-100 p-10 rounded-[3.5rem] shadow-xl shadow-slate-200/30 space-y-10">
        
        {/* Controls Layout */}
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6 pb-2 border-b border-slate-100/50">
          
          {/* Tabs */}
          <div className="flex bg-slate-55 border border-slate-100/80 p-1.5 rounded-2xl w-fit">
            {[
              { id: "pending", label: "Pending Reviews", badge: pendingCount, color: "bg-amber-500" },
              { id: "archive", label: "Archive Log", badge: processed.length, color: "bg-slate-400" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-3 cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                    : "text-slate-400 hover:text-slate-900"
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge > 0 && (
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black text-white ${tab.color}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 pl-5 flex items-center text-slate-350 pointer-events-none">
              <Search className="w-5 h-5" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff names, reasons, leave types..."
              className="w-full pl-12 pr-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white outline-none font-semibold text-slate-800 placeholder-slate-400 text-xs transition-all shadow-inner"
            />
          </div>

        </div>

        {/* Dynamic Lists with Transitions */}
        <div className="min-h-[250px] relative">
          {loading ? (
            <div className="py-24 text-center text-slate-450 font-black uppercase tracking-widest animate-pulse flex flex-col items-center justify-center gap-4">
              <RefreshCw className="w-8 h-8 animate-spin text-slate-300" />
              <span>Syncing Absences Registry...</span>
            </div>
          ) : activeTab === "pending" ? (
            <AnimatePresence mode="popLayout">
              {pending.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="py-24 text-center flex flex-col items-center justify-center gap-4"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 mb-2">
                    <Check className="w-8 h-8" />
                  </div>
                  <h4 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">Clearance Done</h4>
                  <p className="text-slate-400 font-light italic text-sm max-w-xs mx-auto">No pending absences requests requiring administrative verification.</p>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  {pending.map((leave) => (
                    <motion.div
                      key={leave.id || leave._id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      whileHover={{ scale: 1.002 }}
                      className="group bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-md shadow-slate-150/10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 hover:shadow-xl hover:shadow-slate-200/20 transition-all text-left"
                    >
                      <div className="space-y-3 flex-1 min-w-0">
                        {/* Header Details */}
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-lg font-black text-slate-900 tracking-tight leading-none">
                            {leave.name}
                          </span>
                          <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-500 font-extrabold uppercase text-[9px] tracking-widest leading-none">
                            {leave.role}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium italic">
                            ({leave.userEmail})
                          </span>
                        </div>

                        {/* Leave Type details */}
                        <div className="flex items-center gap-4 text-slate-600 text-xs font-bold">
                          <span className="px-3 py-1.5 rounded-xl bg-indigo-50/50 text-indigo-600 border border-indigo-100/50 uppercase tracking-widest text-[9px]">
                            {leave.leaveType}
                          </span>
                          <span>—</span>
                          <span className="text-slate-500">
                            Scheduled: <span className="font-extrabold text-slate-900">{leave.dates}</span> ({leave.daysCount} Days)
                          </span>
                        </div>

                        {/* Statement / Reason */}
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl relative max-w-xl">
                          <p className="text-xs text-slate-500 font-light italic leading-relaxed">
                            &ldquo;{leave.reason}&rdquo;
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex sm:flex-row lg:flex-col gap-3 shrink-0 w-full sm:w-auto mt-4 lg:mt-0">
                        <button
                          onClick={() => handleAction(leave.id, "approved")}
                          className="flex-1 px-6 py-4 bg-emerald-600 text-white rounded-xl font-bold uppercase tracking-wider text-[10px] hover:bg-emerald-700 shadow-md shadow-emerald-100 transition-colors cursor-pointer flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve Clearance
                        </button>
                        <button
                          onClick={() => triggerDeclineModal(leave)}
                          className="flex-1 px-6 py-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl font-bold uppercase tracking-wider text-[10px] hover:bg-rose-100 transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          Decline Request
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
                  className="py-24 text-center flex flex-col items-center justify-center gap-4"
                >
                  <Inbox className="w-12 h-12 text-slate-300" />
                  <h4 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">Archive Empty</h4>
                  <p className="text-slate-400 font-light italic text-sm">No processed absence requests inside this review log.</p>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  {processed.map((leave) => (
                    <motion.div
                      key={leave.id || leave._id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-slate-50/50 border border-slate-100 p-8 rounded-[2.5rem] flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 hover:bg-slate-50 transition-all text-left"
                    >
                      <div className="space-y-3 flex-1 min-w-0">
                        {/* Name and tags */}
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="font-black text-slate-950 text-base leading-none">
                            {leave.name}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-extrabold uppercase text-[8px] tracking-widest leading-none">
                            {leave.role}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium italic">
                            ({leave.userEmail})
                          </span>
                        </div>

                        {/* Dates info */}
                        <div className="text-xs text-slate-600 font-semibold leading-none">
                          <span className="text-indigo-600 font-bold">{leave.leaveType}</span> — {leave.daysCount} Days ({leave.dates})
                        </div>

                        {/* Rejection comment display if declined */}
                        {leave.status === "rejected" && leave.adminComments && (
                          <div className="p-3 bg-rose-50/50 border border-rose-100/50 rounded-xl max-w-xl">
                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Rejection review rationale:
                            </p>
                            <p className="text-xs font-medium text-rose-800 leading-relaxed italic">
                              &ldquo;{leave.adminComments}&rdquo;
                            </p>
                          </div>
                        )}

                        {leave.status === "approved" && (
                          <p className="text-[10px] text-slate-450 italic leading-relaxed">
                            Absence approved. Quota balances updated on staff logs.
                          </p>
                        )}
                      </div>

                      {/* Status Stamp */}
                      <div className="shrink-0 mt-2 lg:mt-0">
                        <span className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border flex items-center gap-2 select-none
                          ${leave.status === "approved" 
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100/80" 
                            : "bg-rose-50 text-rose-600 border-rose-100/80"}`}>
                          {leave.status === "approved" ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                              Approved
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 text-rose-600" />
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

      </div>

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
