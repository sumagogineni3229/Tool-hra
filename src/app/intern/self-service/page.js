"use client";

import { useState, useEffect } from "react";
import {
  Home,
  Building2,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  CalendarDays,
  MapPin,
  FileText,
  X,
  Loader2,
  Info,
  RefreshCw,
  Sparkles
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";

const REQUEST_TYPES = {
  WFH: {
    label: "Work From Home",
    shortLabel: "WFH",
    icon: Home,
    color: "amber",
    bg: "bg-amber-50",
    border: "border-amber-100",
    text: "text-amber-700",
    badge: "bg-amber-50 text-amber-700 border-amber-100",
    activeBg: "bg-amber-600",
    activeBorder: "border-amber-500",
    description: "Request to work from your home or a remote location for the selected dates.",
  },
  WFO: {
    label: "Work From Office",
    shortLabel: "WFO",
    icon: Building2,
    color: "emerald",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    text: "text-emerald-700",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
    activeBg: "bg-emerald-600",
    activeBorder: "border-emerald-500",
    description: "Request to work from the office when you are otherwise assigned remotely.",
  },
};

const STATUS_CONFIG = {
  pending: { label: "Pending", icon: AlertCircle, classes: "bg-amber-50 text-amber-700 border-amber-100" },
  approved: { label: "Approved", icon: CheckCircle2, classes: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  rejected: { label: "Rejected", icon: XCircle, classes: "bg-rose-50 text-rose-700 border-rose-100" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status?.toLowerCase()] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${cfg.classes}`}>
      <Icon className="w-2.5 h-2.5 shrink-0" />
      {cfg.label}
    </span>
  );
}

export default function InternSelfServicePage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeForm, setActiveForm] = useState(null); // null | "WFH" | "WFO"
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [detailRequest, setDetailRequest] = useState(null);

  // Form state
  const [form, setForm] = useState({
    startDate: "",
    endDate: "",
    reason: "",
    workLocation: "",
    officeLocation: "",
  });

  useEffect(() => {
    const session = apiClient.getCurrentSession();
    setCurrentUser(session);
  }, []);

  useEffect(() => {
    if (currentUser?.email) {
      fetchRequests();
    }
  }, [currentUser?.email]);

  const fetchRequests = async () => {
    if (!currentUser?.email) return;
    setIsFetching(true);
    try {
      const res = await fetch(`/api/ess-requests?email=${encodeURIComponent(currentUser.email)}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.warn("Could not fetch ESS requests:", err);
    } finally {
      setIsFetching(false);
    }
  };

  const resetForm = () => {
    setForm({ startDate: "", endDate: "", reason: "", workLocation: "", officeLocation: "" });
    setErrorMsg("");
    setSuccessMsg("");
  };

  const openForm = (type) => {
    setActiveForm(type);
    resetForm();
  };

  const closeForm = () => {
    setActiveForm(null);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate || !form.reason.trim()) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      setErrorMsg("End date cannot be before start date.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/ess-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: currentUser?.email,
          requestType: activeForm,
          startDate: form.startDate,
          endDate: form.endDate,
          reason: form.reason,
          workLocation: form.workLocation,
          officeLocation: form.officeLocation,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Your ${activeForm} request has been submitted and is pending approval from HR, Admin, and your Manager.`);
        setTimeout(() => {
          closeForm();
          fetchRequests();
        }, 2500);
      } else {
        setErrorMsg(data.message || "Failed to submit request. Please try again.");
      }
    } catch (err) {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const pendingCount = requests.filter(r => r.status === "pending").length;
  const approvedCount = requests.filter(r => r.status === "approved").length;
  const wfhCount = requests.filter(r => r.requestType === "WFH").length;
  const wfoCount = requests.filter(r => r.requestType === "WFO").length;

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="flex flex-col gap-8 text-left">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold text-amber-600 bg-amber-50 border border-amber-100/50 px-2 py-0.5 rounded uppercase tracking-wider">
              Self Service Portal
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Employee Self Service (ESS)
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Submit Work From Home or Work From Office requests. All requests are sent to HR, Admin, and your Manager for approval.
          </p>
        </div>
        <button
          onClick={fetchRequests}
          disabled={isFetching}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Quick Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Requests", value: requests.length, color: "text-slate-900 font-mono", borderStyle: "border-l-slate-400" },
          { label: "Pending", value: pendingCount, color: "text-amber-700 font-mono", borderStyle: "border-l-amber-500" },
          { label: "Approved", value: approvedCount, color: "text-emerald-700 font-mono", borderStyle: "border-l-emerald-500" },
          { label: "WFH / WFO", value: `${wfhCount} / ${wfoCount}`, color: "text-amber-750 font-mono", borderStyle: "border-l-amber-500" },
        ].map((stat, i) => (
          <div key={i} className={`bg-white border border-slate-200/80 ${stat.borderStyle} border-l-4 rounded-2xl p-5 flex flex-col gap-1.5 shadow-sm`}>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{stat.label}</span>
            <span className={`text-2xl font-black ${stat.color}`}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* === ESS Request Cards === */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-extrabold text-amber-600 bg-amber-50 border border-amber-100/50 px-2 py-0.5 rounded w-fit uppercase tracking-wider">
            New Request
          </span>
          <h2 className="font-bold text-slate-950 text-sm mt-1.5">Submit a Self Service Request</h2>
          <p className="text-[11px] text-slate-400 font-medium">
            Choose the type of request you&apos;d like to submit. The request will be routed for multi-level approval.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(REQUEST_TYPES).map(([type, cfg]) => {
            const Icon = cfg.icon;
            return (
              <button
                key={type}
                onClick={() => openForm(type)}
                className={`group relative flex flex-col gap-4 p-6 rounded-2xl border-2 text-left transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer ${
                  activeForm === type
                    ? `${cfg.activeBorder} ${cfg.bg} shadow-md`
                    : "border-slate-150 bg-white hover:border-slate-200"
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl ${cfg.bg} border ${cfg.border} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className={`w-6 h-6 ${cfg.text}`} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-slate-900">{cfg.label}</span>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${cfg.badge} uppercase tracking-widest`}>
                      {cfg.shortLabel}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{cfg.description}</p>
                </div>
                <div className={`flex items-center gap-1.5 text-[10px] font-bold ${cfg.text} mt-auto`}>
                  <span>Submit Request</span>
                  <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* === Request Form Modal === */}
      {activeForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="border-b border-slate-100 px-6 py-4 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                {(() => {
                  const cfg = REQUEST_TYPES[activeForm];
                  const Icon = cfg.icon;
                  return (
                    <>
                      <div className={`w-8 h-8 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${cfg.text}`} />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">ESS Request</span>
                        <span className="text-sm font-extrabold text-slate-900">{cfg.label}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
              <button
                onClick={closeForm}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Approval Notice */}
            <div className="px-6 pt-5 pb-0">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/55 border border-amber-100/50">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-850 font-semibold leading-relaxed">
                  This request will be sent to <strong>HR</strong>, <strong>Admin</strong>, and your <strong>Manager</strong> for review and approval.
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" /> Start Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={today}
                    value={form.startDate}
                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl bg-slate-55 focus:outline-none focus:border-amber-450 focus:bg-white transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" /> End Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={form.startDate || today}
                    value={form.endDate}
                    onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    className="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl bg-slate-55 focus:outline-none focus:border-amber-450 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Location fields */}
              {activeForm === "WFH" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Work Location (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Home – Bangalore, Karnataka"
                    value={form.workLocation}
                    onChange={e => setForm(f => ({ ...f, workLocation: e.target.value }))}
                    className="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl bg-slate-55 focus:outline-none focus:border-amber-450 focus:bg-white transition-all"
                  />
                </div>
              )}
              {activeForm === "WFO" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Office Location (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., HRA Groups – Hyderabad HQ"
                    value={form.officeLocation}
                    onChange={e => setForm(f => ({ ...f, officeLocation: e.target.value }))}
                    className="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl bg-slate-55 focus:outline-none focus:border-emerald-450 focus:bg-white transition-all"
                  />
                </div>
              )}

              {/* Reason */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Reason / Justification <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder={`Briefly describe why you need ${activeForm === "WFH" ? "to work from home" : "to come to the office"}...`}
                  value={form.reason}
                  onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  className="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl bg-slate-55 focus:outline-none focus:border-amber-450 focus:bg-white transition-all resize-none"
                />
              </div>

              {/* Messages */}
              {errorMsg && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-100">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <p className="text-[10px] font-bold text-rose-700">{errorMsg}</p>
                </div>
              )}
              {successMsg && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-bold text-emerald-700">{successMsg}</p>
                </div>
              )}

              {/* Footer Buttons */}
              <div className="flex justify-end gap-3 pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !!successMsg}
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                    activeForm === "WFH" ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  {isLoading ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* === Request History === */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4 bg-slate-50/50 flex justify-between items-center">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-extrabold text-amber-600 bg-amber-50 border border-amber-100/50 px-2 py-0.5 rounded w-fit uppercase tracking-wider">
              Request History
            </span>
            <h3 className="font-bold text-slate-900 text-sm mt-1">My ESS Request Log</h3>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            {requests.length} record{requests.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {isFetching ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-amber-600 animate-spin" />
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-slate-300" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-slate-700">No ESS requests yet</span>
                <span className="text-xs text-slate-400 font-medium">
                  Submit a WFH or WFO request above to get started.
                </span>
              </div>
            </div>
          ) : (
            requests.map((req) => {
              const cfg = REQUEST_TYPES[req.requestType] || REQUEST_TYPES.WFH;
              const Icon = cfg.icon;
              const startStr = req.startDate ? new Date(req.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
              const endStr = req.endDate ? new Date(req.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
              const submittedStr = req.createdAt ? new Date(req.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

              return (
                <div
                  key={req.id || req._id}
                  onClick={() => setDetailRequest(req)}
                  className="flex items-start sm:items-center justify-between gap-4 px-6 py-4 hover:bg-slate-50/70 transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-9 h-9 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center shrink-0 mt-0.5`}>
                      <Icon className={`w-4.5 h-4.5 ${cfg.text}`} />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900">{cfg.label}</span>
                        <StatusBadge status={req.status} />
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {startStr} → {endStr}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">
                        Submitted {submittedStr}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* === Detail Modal === */}
      {detailRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="border-b border-slate-100 px-6 py-4 bg-slate-50 flex justify-between items-center">
              {(() => {
                const cfg = REQUEST_TYPES[detailRequest.requestType] || REQUEST_TYPES.WFH;
                const Icon = cfg.icon;
                return (
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${cfg.text}`} />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">ESS Request Detail</span>
                      <span className="text-sm font-extrabold text-slate-900">{cfg.label}</span>
                    </div>
                  </div>
                );
              })()}
              <button onClick={() => setDetailRequest(null)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 cursor-pointer transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <StatusBadge status={detailRequest.status} />
                <span className="text-[9px] font-bold text-slate-400 uppercase font-mono">
                  Submitted: {detailRequest.createdAt ? new Date(detailRequest.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                </span>
              </div>

              <div className="flex flex-col gap-3 bg-slate-55 rounded-xl p-4 border border-slate-100">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Start Date</span>
                    <span className="text-xs font-bold text-slate-900 mt-0.5 block">
                      {detailRequest.startDate ? new Date(detailRequest.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">End Date</span>
                    <span className="text-xs font-bold text-slate-900 mt-0.5 block">
                      {detailRequest.endDate ? new Date(detailRequest.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </span>
                  </div>
                </div>

                {(detailRequest.workLocation || detailRequest.officeLocation) && (
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Location</span>
                    <span className="text-xs font-bold text-slate-900 mt-0.5 block">
                      {detailRequest.workLocation || detailRequest.officeLocation}
                    </span>
                  </div>
                )}

                <div>
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Reason</span>
                  <span className="text-xs font-medium text-slate-700 mt-0.5 block leading-relaxed">{detailRequest.reason}</span>
                </div>
              </div>

              {/* Reviewer Comments */}
              {(detailRequest.hrComments || detailRequest.adminComments || detailRequest.managerComments) && (
                <div className="flex flex-col gap-2">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Reviewer Comments</span>
                  {detailRequest.hrComments && (
                    <div className="p-3 rounded-xl bg-violet-50 border border-violet-100">
                      <span className="text-[9px] font-black text-violet-600 uppercase tracking-wider block mb-0.5">HR</span>
                      <span className="text-[11px] text-slate-700 font-medium">{detailRequest.hrComments}</span>
                    </div>
                  )}
                  {detailRequest.adminComments && (
                    <div className="p-3 rounded-xl bg-sky-50 border border-sky-100">
                      <span className="text-[9px] font-black text-sky-600 uppercase tracking-wider block mb-0.5">Admin</span>
                      <span className="text-[11px] text-slate-700 font-medium">{detailRequest.adminComments}</span>
                    </div>
                  )}
                  {detailRequest.managerComments && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                      <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider block mb-0.5">Manager</span>
                      <span className="text-[11px] text-slate-700 font-medium">{detailRequest.managerComments}</span>
                    </div>
                  )}
                </div>
              )}

              {detailRequest.reviewedBy && (
                <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase tracking-wider border-t border-slate-100 pt-3">
                  <span>Reviewed by: {detailRequest.reviewedBy} ({detailRequest.reviewedByRole})</span>
                  {detailRequest.reviewedAt && (
                    <span>{new Date(detailRequest.reviewedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 px-6 py-4 bg-slate-50 flex justify-end">
              <button
                onClick={() => setDetailRequest(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
