"use client";

import { useState } from "react";
import { ClipboardList, CheckCircle, XCircle, Search, FileClock } from "lucide-react";

export default function ManagerTimesheets() {
  const [timesheets, setTimesheets] = useState([
    { id: 1, name: "Marcus Aurelius", role: "Employee", project: "Leave Tracker UI Core", hours: "40 hrs", week: "Week 4 (May 24 - May 28)", status: "Pending" },
    { id: 2, name: "Jane Smith", role: "Intern", project: "Cybersecurity Training Syllabus", hours: "38 hrs", week: "Week 4 (May 24 - May 28)", status: "Pending" },
    { id: 3, name: "Sarah Jenkins", role: "HR Specialist", project: "Hiring Pipeline Overhaul", hours: "42 hrs", week: "Week 3 (May 17 - May 21)", status: "Approved" },
    { id: 4, name: "Elena Rostova", role: "HR Specialist", project: "Operational Handbook updates", hours: "35 hrs", week: "Week 3 (May 17 - May 21)", status: "Approved" }
  ]);

  const handleAction = (id, newStatus) => {
    setTimesheets(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
  };

  const pending = timesheets.filter(t => t.status === "Pending");
  const processed = timesheets.filter(t => t.status !== "Pending");

  return (
    <div className="flex flex-col gap-8 text-left">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Squad Timesheet Clearances</h1>
        <p className="text-xs text-slate-500">Inspect clocked hours, audit matching task codes, and submit approvals for automated payroll routing.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left: Pending Approvals (8 Columns) */}
        <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-slate-150/75 px-6 py-4.5 bg-slate-50/40">
            <h3 className="font-bold text-slate-900 text-sm">Timesheets Pending Review ({pending.length})</h3>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {pending.length > 0 ? (
              pending.map(t => (
                <div key={t.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/20 transition-all text-left">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-950 text-xs">{t.name}</span>
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">{t.role}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold mt-1">{t.week}</span>
                    <p className="text-xs font-semibold text-slate-700 mt-1">
                      Logged <span className="text-indigo-650 font-bold">{t.hours}</span> towards project <span className="italic font-bold">({t.project})</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleAction(t.id, "Approved")}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleAction(t.id, "Declined")}
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
                <span>All timesheets audited successfully!</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: History (4 Columns) */}
        <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-slate-150/75 px-6 py-4.5 bg-slate-50/40">
            <h3 className="font-bold text-slate-900 text-sm">Archived Logs ({processed.length})</h3>
          </div>

          <div className="divide-y divide-slate-100 p-6 flex flex-col gap-4 overflow-y-auto">
            {processed.map(t => (
              <div key={t.id} className="flex flex-col gap-1 text-left p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                <span className="font-bold text-xs text-slate-900">{t.name}</span>
                <span className="text-[10px] text-slate-500 font-semibold">{t.project} ({t.hours})</span>
                <div className="mt-1">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    t.status === "Approved" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"
                  }`}>
                    {t.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
