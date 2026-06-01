"use client";

import { useState } from "react";
import { CalendarDays, CheckCircle, XCircle, FileClock } from "lucide-react";

export default function ManagerLeaves() {
  const [requests, setRequests] = useState([
    { id: 1, name: "Marcus Aurelius", role: "Employee", type: "Sick Leave", duration: "3 Days", dates: "Jun 02 - Jun 04", reason: "Severe migraine and doctor recommended bed rest.", status: "Pending" },
    { id: 2, name: "Jane Smith", role: "Intern", type: "Exam Leave", duration: "2 Days", dates: "Jun 10 - Jun 11", reason: "End of semester computer science practical examinations.", status: "Pending" }
  ]);

  const handleAction = (id, newStatus) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
  };

  const pending = requests.filter(r => r.status === "Pending");
  const processed = requests.filter(r => r.status !== "Pending");

  return (
    <div className="flex flex-col gap-8 text-left">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Direct Reports Leave Review</h1>
        <p className="text-xs text-slate-500">Audit sick leaves, casual breaks, and test clearances for team alignment before HR routing.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Side: Pending (8 Columns) */}
        <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-slate-150/75 px-6 py-4.5 bg-slate-50/40">
            <h3 className="font-bold text-slate-900 text-sm">Squad Leaves Applications ({pending.length})</h3>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {pending.length > 0 ? (
              pending.map(leave => (
                <div key={leave.id} className="p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-slate-50/20 transition-all text-left">
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-950 text-xs">{leave.name}</span>
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">{leave.role}</span>
                    </div>
                    <div className="text-xs text-slate-600 font-semibold mt-1">
                      <span className="text-indigo-650 font-bold">{leave.type}</span> — {leave.duration} ({leave.dates})
                    </div>
                    <p className="text-[10px] text-slate-400 italic font-semibold mt-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">&ldquo;{leave.reason}&rdquo;</p>
                  </div>

                  <div className="flex sm:flex-col items-end gap-2 shrink-0">
                    <button
                      onClick={() => handleAction(leave.id, "Approved")}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleAction(leave.id, "Declined")}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-100 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center text-slate-400 text-xs font-semibold bg-slate-50/10 flex flex-col items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />
                <span>All direct report leave requests processed.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: History (4 Columns) */}
        <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-slate-150/75 px-6 py-4.5 bg-slate-50/40">
            <h3 className="font-bold text-slate-900 text-sm">Archived Leaves ({processed.length})</h3>
          </div>

          <div className="divide-y divide-slate-100 p-6 flex flex-col gap-4 overflow-y-auto">
            {processed.length > 0 ? (
              processed.map(leave => (
                <div key={leave.id} className="flex flex-col gap-1 text-left p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                  <span className="font-bold text-xs text-slate-900">{leave.name}</span>
                  <span className="text-[10px] text-slate-500 font-semibold">{leave.type} ({leave.duration})</span>
                  
                  <div className="flex items-center gap-1 mt-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      leave.status === "Approved" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"
                    }`}>
                      {leave.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 text-[10px] font-semibold bg-slate-50/10">No archived leaves this week.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
