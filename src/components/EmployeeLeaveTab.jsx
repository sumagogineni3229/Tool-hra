"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import LeaveRequestModal from "@/components/LeaveRequestModal";

export default function EmployeeLeaveTab() {
  const [leaves, setLeaves] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchLeaves = async () => {
    setIsLoading(true);
    try {
      const currentUser = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("currentUser") || "null") : null;
      const emailParam = currentUser ? `?email=${encodeURIComponent(currentUser.email)}` : "";
      
      const res = await fetch(`/api/leave${emailParam}`);
      const data = await res.json();
      if (res.ok) {
        setLeaves(data.leaves || []);
      } else {
        throw new Error("Failed to fetch leaves");
      }
    } catch (err) {
      console.warn("Failed to fetch leaves via API, loading local fallback...", err);
      const currentUser = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("currentUser") || "null") : null;
      if (currentUser?.email) {
        const cached = localStorage.getItem("hra_leaves");
        if (cached) {
          const parsed = JSON.parse(cached);
          const filtered = parsed.filter(l => l.userEmail?.toLowerCase().trim() === currentUser.email.toLowerCase().trim());
          setLeaves(filtered);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  return (
    <div className="space-y-12">
      {/* Title Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Leave Management</h2>
          <p className="text-slate-500 font-light text-lg italic tracking-wide">Track your balance and request official absence periods.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-slate-200 hover:bg-blue-600 transition-all active:scale-95 flex items-center gap-3 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Apply for Leave
        </button>
      </header>

      {/* Leave Balances Grid (Gauges) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-2">
        {[
          { label: "Paid Leave", key: "paid", total: 10, colors: ["#10b981", "#059669"], dbType: "Annual" },
          { label: "Casual Leave", key: "casual", total: 15, colors: ["#6366f1", "#4f46e5"], dbType: "Casual" },
          { label: "Sick Leave", key: "sick", total: 12, colors: ["#ef4444", "#dc2626"], dbType: "Sick" },
        ].map((item) => {
          const approvedDays = leaves
            .filter(l => l.leaveType === item.dbType && l.status === "approved")
            .reduce((acc, curr) => acc + curr.daysCount, 0);

          const available = Math.max(item.total - approvedDays, 0);
          const used = approvedDays;
          const percentage = (available / item.total) * 100;

          // SVG Circle Constants
          const radius = 54;
          const circumference = 2 * Math.PI * radius;
          const offset = circumference - (percentage / 100) * circumference;

          return (
            <motion.div
              key={item.key}
              whileHover={{ y: -4, scale: 1.01 }}
              className="bg-white border border-slate-100 p-8 rounded-[3rem] shadow-xl shadow-slate-200/30 relative flex flex-col items-center overflow-hidden transition-all"
            >
              <div className="w-full flex justify-between items-center mb-10">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">
                  {item.label}
                </h4>
                <div className="w-2 h-2 rounded-full" style={{ background: `linear-gradient(to tr, ${item.colors[0]}, ${item.colors[1]})` }} />
              </div>

              <div className="relative flex items-center justify-center mb-10">
                {/* SVG Radial Progress Tracker */}
                <svg className="w-40 h-40 transform -rotate-90">
                  <defs>
                    <linearGradient id={`grad-${item.key}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={item.colors[0]} />
                      <stop offset="100%" stopColor={item.colors[1]} />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    stroke="#f1f5f9"
                    strokeWidth="5"
                    fill="transparent"
                  />
                  <motion.circle
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 2, ease: "circOut" }}
                    cx="80"
                    cy="80"
                    r={radius}
                    stroke={`url(#grad-${item.key})`}
                    strokeWidth="5"
                    strokeDasharray={circumference}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1">Available</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{available}</span>
                    <span className="text-xl font-bold text-slate-200">/{item.total}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer Breakdown */}
              <div className="w-full flex justify-between px-2">
                <div className="text-left">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Used Days</p>
                  <p className="text-lg font-black text-slate-900 leading-none">{used}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Quota Used</p>
                  <p className="text-lg font-black text-slate-900 leading-none">{Math.round((used / item.total) * 100 || 0)}%</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Absence History Log */}
      <div className="bg-white border border-slate-100 p-10 rounded-[3.5rem] shadow-xl shadow-slate-200/30">
        <div className="flex justify-between items-center mb-10">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase">Absence Log</h3>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{leaves.length} Total Entries</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] text-left">
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Period</th>
                <th className="px-6 py-4">Days</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Reason</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="py-20 text-center text-slate-400 font-black uppercase tracking-widest animate-pulse">Syncing Log...</td>
                </tr>
              ) : leaves.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-20 text-center text-slate-300 font-light italic">No absence records detected in the registry.</td>
                </tr>
              ) : (
                leaves.map((leave) => (
                  <tr key={leave._id || leave.id} className="group hover:bg-slate-50 transition-all rounded-2xl overflow-hidden">
                    <td className="px-6 py-6 font-black text-slate-900 uppercase text-xs tracking-tight">{leave.leaveType}</td>
                    <td className="px-6 py-6">
                      <span className="text-slate-500 font-medium text-sm">
                        {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-6 font-black text-slate-900">{leave.daysCount}</td>
                    <td className="px-6 py-6">
                      <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border
                        ${leave.status === "approved" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                          leave.status === "pending" ? "bg-amber-50 text-amber-600 border-amber-100" :
                            "bg-rose-50 text-rose-600 border-rose-100"}`}>
                        {leave.status}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <p className="text-sm font-light max-w-xs truncate">
                        <span className="text-slate-400 italic">{leave.reason}</span>
                        {leave.status === 'rejected' && leave.adminComments && (
                          <span className="block mt-1 text-[10px] uppercase font-black tracking-widest text-rose-500 truncate" title={leave.adminComments}>REASON: {leave.adminComments}</span>
                        )}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <LeaveRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRefresh={fetchLeaves}
      />
    </div>
  );
}
