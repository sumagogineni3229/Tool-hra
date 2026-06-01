"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, FileText, Send, AlertCircle, Loader2 } from "lucide-react";

export default function LeaveRequestModal({ isOpen, onClose, onRefresh }) {
  const [formData, setFormData] = useState({
    leaveType: "Annual",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const leaveTypes = [
    { label: "Paid Leave", val: "Annual" },
    { label: "Sick Leave", val: "Sick" },
    { label: "Casual Leave", val: "Casual" }
  ];

  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const diffTime = Math.abs(new Date(end) - new Date(start));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const daysCount = calculateDays(formData.startDate, formData.endDate);
    if (daysCount <= 0) {
      setError("End date must be after or on start date.");
      setLoading(false);
      return;
    }

    // Retrieve local session user details for request body fallback and LocalStorage offline sync
    const currentUser = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("currentUser") || "null") : null;
    const userEmail = currentUser ? currentUser.email : "";

    try {
      const res = await fetch("/api/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...formData, 
          daysCount,
          email: userEmail
        }),
      });

      if (res.ok) {
        onRefresh();
        onClose();
        setFormData({ leaveType: "Annual", startDate: "", endDate: "", reason: "" });
      } else {
        const data = await res.json();
        throw new Error(data.message || "Failed to submit request");
      }
    } catch (err) {
      console.warn("MongoDB API submission failed, attempting LocalStorage fallback...", err);
      
      if (userEmail) {
        // LocalStorage fallback creation
        const localLeaves = JSON.parse(localStorage.getItem("hra_leaves") || "[]");
        const newLeave = {
          _id: `local-leave-${Date.now()}`,
          id: `local-leave-${Date.now()}`,
          userId: currentUser?.id || currentUser?._id || `local-user-${Date.now()}`,
          userEmail: userEmail,
          leaveType: formData.leaveType,
          type: `${formData.leaveType} Leave`,
          startDate: formData.startDate,
          endDate: formData.endDate,
          dates: `${formData.startDate} - ${formData.endDate}`,
          daysCount,
          duration: `${daysCount} Day${daysCount > 1 ? "s" : ""}`,
          reason: formData.reason,
          status: "pending",
          createdAt: new Date().toISOString()
        };

        localLeaves.unshift(newLeave);
        localStorage.setItem("hra_leaves", JSON.stringify(localLeaves));

        // Sync globally for HR audits offline
        const localAllLeaves = JSON.parse(localStorage.getItem("hra_all_leaves") || "[]");
        localAllLeaves.unshift({
          ...newLeave,
          name: currentUser?.name || "Self",
          role: currentUser?.role || "Employee"
        });
        localStorage.setItem("hra_all_leaves", JSON.stringify(localAllLeaves));

        onRefresh();
        onClose();
        setFormData({ leaveType: "Annual", startDate: "", endDate: "", reason: "" });
      } else {
        setError("User session context missing. Please try logging in again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-[3rem] p-8 md:p-12 shadow-[0_32px_64px_rgba(0,0,0,0.2)] overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 blur-[100px] -z-10 rounded-full translate-x-1/2 -translate-y-1/2" />

            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm shadow-indigo-100">
                  <Calendar className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Request Leave</h3>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2 italic">Official Absence Protocol</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all active:scale-90"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {error}
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 leading-none">
                    Leave Category
                  </label>
                  <select
                    value={formData.leaveType}
                    onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 focus:bg-white outline-none font-bold text-slate-900 transition-all appearance-none cursor-pointer"
                  >
                    {leaveTypes.map((t) => (
                      <option key={t.val} value={t.val}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 leading-none">
                    Duration Breakdown
                  </label>
                  <div className="h-[62px] bg-indigo-50/50 border border-indigo-100/50 rounded-2xl px-6 py-5 flex items-center justify-between">
                    <span className="text-sm font-bold text-indigo-600 uppercase tracking-widest">Total Days</span>
                    <span className="text-2xl font-black text-indigo-600 tracking-tight">
                      {calculateDays(formData.startDate, formData.endDate)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 leading-none">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 focus:bg-white outline-none font-bold text-slate-900 transition-all"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 leading-none">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 focus:bg-white outline-none font-bold text-slate-900 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 leading-none">Reason / Payload</label>
                <div className="relative">
                  <textarea
                    rows="4"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] px-6 py-6 focus:bg-white outline-none font-medium text-slate-900 leading-relaxed transition-all"
                    placeholder="Briefly describe the context for this absence request..."
                  />
                  <FileText className="absolute right-6 top-6 w-5 h-5 text-slate-300" />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-6 font-black text-slate-400 bg-slate-50 rounded-2xl hover:text-slate-900 transition-all active:scale-[0.98] leading-none uppercase tracking-widest text-[10px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] py-6 bg-slate-900 text-white rounded-[1.8rem] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-200 hover:bg-blue-600 transition-all active:scale-[0.98] leading-none flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
