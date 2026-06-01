"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, AlertTriangle, Loader2 } from "lucide-react";

export default function HRLeaveDeclineModal({ isOpen, onClose, onSubmit, leave }) {
  const [adminComments, setAdminComments] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!adminComments.trim()) return;
    setLoading(true);
    await onSubmit(leave.id, adminComments);
    setLoading(false);
    setAdminComments("");
    onClose();
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
            className="relative w-full max-w-lg bg-white rounded-[3rem] p-8 md:p-12 shadow-[0_32px_64px_rgba(0,0,0,0.2)] overflow-hidden text-left"
          >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-rose-50/50 blur-[80px] -z-10 rounded-full translate-x-1/3 -translate-y-1/3" />

            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shadow-sm shadow-rose-100">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Decline Request</h3>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mt-1.5 italic">Protocol rejection log</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all active:scale-90 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Staff Application</div>
              <div className="font-bold text-slate-900 text-sm leading-tight">{leave?.name}</div>
              <div className="text-xs text-slate-500 font-semibold mt-1">{leave?.leaveType || leave?.type} — {leave?.daysCount || leave?.duration}</div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 leading-none">Rejection Comments / Context</label>
                <div className="relative">
                  <textarea
                    rows="3"
                    value={adminComments}
                    onChange={(e) => setAdminComments(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-100 rounded-[1.8rem] px-5 py-5 focus:bg-white outline-none font-medium text-slate-900 leading-relaxed transition-all"
                    placeholder="Provide specific feedback or context for declining this request..."
                  />
                  <FileText className="absolute right-5 top-5 w-4 h-4 text-slate-300" />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-5 font-black text-slate-400 bg-slate-50 rounded-2xl hover:text-slate-900 transition-all active:scale-[0.98] leading-none uppercase tracking-widest text-[9px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !adminComments.trim()}
                  className="flex-[2] py-5 bg-rose-600 text-white rounded-[1.8rem] font-black uppercase tracking-[0.2em] shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all active:scale-[0.98] leading-none flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Decline Review"
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
