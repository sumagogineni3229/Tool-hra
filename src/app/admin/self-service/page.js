"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  ShieldAlert,
  Search,
  Check,
  RefreshCw,
  AlertTriangle,
  Home,
  Building2,
  Calendar,
  X,
  Loader2,
  Info,
  Layers
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";

const REQUEST_TYPES = {
  WFH: { label: "Work From Home", icon: Home, bg: "bg-amber-50 text-amber-700 border-amber-100" },
  WFO: { label: "Work From Office", icon: Building2, bg: "bg-emerald-50 text-emerald-700 border-emerald-100" },
};

export default function AdminSelfServiceApproval() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("pending"); // pending | archive
  const [currentUser, setCurrentUser] = useState(null);

  // Modal states for action details / comments
  const [reviewRequest, setReviewRequest] = useState(null); // request object to review
  const [actionType, setActionType] = useState(""); // "approve" | "reject"
  const [comments, setComments] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const session = apiClient.getCurrentSession();
    setCurrentUser(session);
  }, []);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ess-requests");
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.warn("Failed to fetch ESS requests:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAction = async (e) => {
    e.preventDefault();
    if (!reviewRequest) return;

    setActionLoading(true);
    const isApprove = actionType === "approve";
    const status = isApprove ? "approved" : "rejected";

    try {
      const payload = {
        id: reviewRequest.id || reviewRequest._id,
        status,
        adminComments: comments.trim(),
        reviewedBy: currentUser?.name || "System Admin",
        reviewedByRole: "Admin"
      };

      const res = await fetch("/api/ess-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setReviewRequest(null);
        setComments("");
        fetchRequests();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to update ESS request status.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const openReviewModal = (req, action) => {
    setReviewRequest(req);
    setActionType(action);
    setComments("");
  };

  const filteredRequests = requests.filter(r => {
    const query = searchQuery.toLowerCase().trim();
    return (
      (r.userName || "").toLowerCase().includes(query) ||
      (r.userEmail || "").toLowerCase().includes(query) ||
      (r.requestType || "").toLowerCase().includes(query) ||
      (r.reason || "").toLowerCase().includes(query)
    );
  });

  const pending = filteredRequests.filter(r => r.status === "pending");
  const processed = filteredRequests.filter(r => r.status === "approved" || r.status === "rejected");

  const totalCount = requests.length;
  const pendingCount = requests.filter(r => r.status === "pending").length;
  const approvedCount = requests.filter(r => r.status === "approved").length;
  const rejectedCount = requests.filter(r => r.status === "rejected").length;

  return (
    <div className="space-y-12">
      {/* Title Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Self Service Approval Logs</h2>
          <p className="text-slate-500 font-light text-lg italic tracking-wide">Moderate employee WFH and WFO scheduling authorizations.</p>
        </div>
        <button
          onClick={fetchRequests}
          className="px-6 py-4 bg-slate-900 text-white hover:bg-slate-800 rounded-2xl font-black uppercase tracking-wider text-[10px] shadow-sm flex items-center gap-2 cursor-pointer transition-all active:scale-95"
        >
          <RefreshCw className={`w-4.5 h-4.5 ${loading ? "animate-spin" : ""}`} />
          Reload System Registry
        </button>
      </header>

      {/* Stats analytical grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-2">
        {[
          { label: "Total Applications", count: totalCount, icon: FileText, bg: "from-slate-100 to-slate-50 text-slate-800 border-slate-200" },
          { label: "Pending Reviews", count: pendingCount, icon: ShieldAlert, bg: "from-amber-50/50 to-orange-50/10 border-amber-100/50 text-amber-605" },
          { label: "Approved Quota", count: approvedCount, icon: CheckCircle, bg: "from-emerald-50/55 to-teal-50/10 border-emerald-100/50 text-emerald-600" },
          { label: "Declined Protocol", count: rejectedCount, icon: XCircle, bg: "from-rose-50/55 to-red-50/10 border-rose-100/50 text-rose-600" },
        ].map((item, idx) => (
          <motion.div
            key={idx}
            whileHover={{ y: -4, scale: 1.01 }}
            className="bg-white border p-8 rounded-[3rem] shadow-xl shadow-slate-200/20 relative flex flex-col justify-between overflow-hidden transition-all text-left"
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

          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 pl-5 flex items-center text-slate-350 pointer-events-none">
              <Search className="w-5 h-5" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff, email, type..."
              className="w-full pl-12 pr-5 py-4 rounded-2xl bg-slate-55 border border-slate-100 focus:bg-white outline-none font-semibold text-slate-800 placeholder-slate-400 text-xs transition-all shadow-inner"
            />
          </div>

        </div>

        {/* Dynamic Lists */}
        <div className="min-h-[250px] relative">
          {loading ? (
            <div className="py-24 text-center text-slate-455 font-black uppercase tracking-widest animate-pulse flex flex-col items-center justify-center gap-4">
              <RefreshCw className="w-8 h-8 animate-spin text-slate-300" />
              <span>Checking System Archives...</span>
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
                  <p className="text-slate-400 font-light italic text-sm max-w-xs mx-auto">No pending self-service requests requiring Admin verification.</p>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  {pending.map((req) => {
                    const cfg = REQUEST_TYPES[req.requestType] || { label: req.requestType, icon: FileText, bg: "bg-slate-50 text-slate-700 border-slate-100" };
                    const Icon = cfg.icon;
                    const startStr = req.startDate ? new Date(req.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
                    const endStr = req.endDate ? new Date(req.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

                    return (
                      <motion.div
                        key={req.id || req._id}
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
                              {req.userName || "Staff User"}
                            </span>
                            <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-500 font-extrabold uppercase text-[9px] tracking-widest leading-none">
                              {req.userRole || "Employee"}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium italic">
                              ({req.userEmail})
                            </span>
                          </div>

                          {/* Request Type and Location */}
                          <div className="flex flex-wrap items-center gap-4 text-slate-600 text-xs font-bold">
                            <span className={`px-3 py-1.5 rounded-xl border uppercase tracking-widest text-[9px] flex items-center gap-1 ${cfg.bg}`}>
                              <Icon className="w-3.5 h-3.5" />
                              {cfg.label}
                            </span>
                            <span>—</span>
                            <span className="text-slate-500">
                              Duration: <span className="font-extrabold text-slate-900">{startStr} → {endStr}</span>
                            </span>
                            {(req.workLocation || req.officeLocation) && (
                              <>
                                <span>—</span>
                                <span className="text-slate-400 font-medium italic">
                                  Location: {req.workLocation || req.officeLocation}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Reason */}
                          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl relative max-w-xl">
                            <p className="text-xs text-slate-500 font-light italic leading-relaxed">
                              &ldquo;{req.reason}&rdquo;
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex sm:flex-row lg:flex-col gap-3 shrink-0 w-full sm:w-auto mt-4 lg:mt-0">
                          <button
                            onClick={() => openReviewModal(req, "approve")}
                            className="flex-1 px-6 py-4 bg-emerald-600 text-white rounded-xl font-bold uppercase tracking-wider text-[10px] hover:bg-emerald-700 shadow-md shadow-emerald-100 transition-colors cursor-pointer flex items-center justify-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => openReviewModal(req, "reject")}
                            className="flex-1 px-6 py-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl font-bold uppercase tracking-wider text-[10px] hover:bg-rose-100 transition-all cursor-pointer flex items-center justify-center gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            Decline
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
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
                  <Info className="w-12 h-12 text-slate-350" />
                  <h4 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">Archive Empty</h4>
                  <p className="text-slate-400 font-light italic text-sm">No processed requests inside this review log.</p>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  {processed.map((req) => {
                    const cfg = REQUEST_TYPES[req.requestType] || { label: req.requestType, icon: FileText, bg: "bg-slate-50 text-slate-700 border-slate-100" };
                    const startStr = req.startDate ? new Date(req.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
                    const endStr = req.endDate ? new Date(req.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

                    return (
                      <motion.div
                        key={req.id || req._id}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-50/50 border border-slate-100 p-8 rounded-[2.5rem] flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 hover:bg-slate-50 transition-all text-left"
                      >
                        <div className="space-y-3 flex-1 min-w-0">
                          {/* Name and role */}
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="font-black text-slate-955 text-base leading-none">
                              {req.userName || "Staff User"}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-extrabold uppercase text-[8px] tracking-widest leading-none">
                              {req.userRole || "Employee"}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium italic">
                              ({req.userEmail})
                            </span>
                          </div>

                          {/* Dates and type */}
                          <div className="text-xs text-slate-600 font-semibold leading-none flex items-center gap-2">
                            <span className="text-indigo-650 font-bold">{cfg.label}</span>
                            <span>—</span>
                            <span>{startStr} → {endStr}</span>
                          </div>

                          {/* Comments rationale */}
                          {req.adminComments && (
                            <div className="p-3 bg-slate-100 border border-slate-200/60 rounded-xl max-w-xl">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                                Admin Review Comments:
                              </p>
                              <p className="text-xs font-medium text-slate-700 leading-relaxed italic">
                                &ldquo;{req.adminComments}&rdquo;
                              </p>
                            </div>
                          )}

                          {req.reviewedBy && (
                            <p className="text-[10px] text-slate-400 italic">
                              Reviewed by {req.reviewedBy} ({req.reviewedByRole})
                            </p>
                          )}
                        </div>

                        {/* Status Stamp */}
                        <div className="shrink-0 mt-2 lg:mt-0">
                          <span className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border flex items-center gap-2 select-none
                            ${req.status === "approved" 
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100/80" 
                              : "bg-rose-50 text-rose-600 border-rose-100/80"}`}>
                            {req.status === "approved" ? (
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
                    );
                  })}
                </div>
              )}
            </AnimatePresence>
          )}
        </div>

      </div>

      {/* Review Comments Modal */}
      {reviewRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="border-b border-slate-100 px-8 py-5 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  actionType === "approve" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                }`}>
                  {actionType === "approve" ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-none">
                    {actionType === "approve" ? "Approve ESS Request" : "Decline ESS Request"}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Admin Clearance Review</p>
                </div>
              </div>
              <button
                onClick={() => setReviewRequest(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAction} className="p-8 space-y-6">
              <div className="p-4 bg-slate-55 border border-slate-100 rounded-2xl text-xs space-y-1">
                <div>
                  <span className="font-bold text-slate-900">{reviewRequest.userName}</span>
                  <span className="ml-2 px-1.5 py-0.5 rounded bg-slate-200/60 text-slate-500 font-bold text-[8px] uppercase tracking-wide">
                    {reviewRequest.userRole}
                  </span>
                </div>
                <div className="text-slate-500">
                  Request: {reviewRequest.requestType} from {new Date(reviewRequest.startDate).toLocaleDateString()} to {new Date(reviewRequest.endDate).toLocaleDateString()}
                </div>
                <div className="text-slate-400 font-light italic mt-1.5">
                  &ldquo;{reviewRequest.reason}&rdquo;
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Reviewer Comments / Decision Rationale
                </label>
                <textarea
                  required
                  rows="3"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full bg-slate-55 border border-slate-150 rounded-2xl px-4 py-3 focus:bg-white outline-none text-xs font-medium text-slate-800 leading-relaxed transition-all resize-none"
                  placeholder="Provide feedback or justification comments for this review..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReviewRequest(null)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-550 hover:text-slate-850 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || (actionType === "reject" && !comments.trim())}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    actionType === "approve"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  {actionType === "approve" ? "Confirm Approval" : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
