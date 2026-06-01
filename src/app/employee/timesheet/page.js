"use client";

import { useState } from "react";
import { ClipboardList, Plus, CheckCircle, Clock } from "lucide-react";

export default function EmployeeTimesheet() {
  const [logs, setLogs] = useState([
    { id: 1, date: "2026-05-28", project: "Leave Tracker UI Core", category: "Dev", hours: 8, notes: "Integrated Lucide icons and refactored layout panels.", status: "Pending" },
    { id: 2, date: "2026-05-27", project: "Leave Tracker UI Core", category: "Design", hours: 6, notes: "Configured CSS variables and responsive glassmorphism styles.", status: "Approved" }
  ]);

  const [project, setProject] = useState("");
  const [category, setCategory] = useState("Dev");
  const [hours, setHours] = useState("");
  const [notes, setNotes] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!project || !hours) return;

    const newLog = {
      id: Date.now(),
      date: new Date().toISOString().split("T")[0],
      project,
      category,
      hours: Number(hours),
      notes,
      status: "Pending"
    };

    setLogs(prev => [newLog, ...prev]);
    setProject("");
    setHours("");
    setNotes("");
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="flex flex-col gap-8 text-left">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Task Timesheet Logger</h1>
        <p className="text-xs text-slate-500">Record hourly contributions, tag associated modules, and submit directly for manager reviews.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Side: Submit hours form (5 Columns) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm flex flex-col gap-6 text-left h-fit">
          <div className="flex flex-col gap-1">
            <h3 className="font-bold text-slate-950 text-sm">Log Work Session</h3>
            <p className="text-[11px] text-slate-400">File task logs to your manager.</p>
          </div>

          {success && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Timesheet hours logged successfully!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Project / Module Name</label>
              <input
                required
                type="text"
                value={project}
                onChange={e => setProject(e.target.value)}
                placeholder="e.g. Leave Tracker API integration"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-800 focus:border-slate-950 focus:ring-1 focus:ring-slate-950/5"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:outline-none cursor-pointer font-bold text-slate-700"
                >
                  <option value="Dev">Development</option>
                  <option value="Design">UI Design</option>
                  <option value="Admin">Admin Tasks</option>
                  <option value="Support">Support Ops</option>
                  <option value="Meeting">Sync Meeting</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Hours logged</label>
                <input
                  required
                  type="number"
                  min="1"
                  max="24"
                  value={hours}
                  onChange={e => setHours(e.target.value)}
                  placeholder="e.g. 8"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-800 focus:border-slate-950 focus:ring-1 focus:ring-slate-950/5"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Detailed description</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Details of tasks achieved during this log slot..."
                rows="3"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-800 focus:border-slate-950 focus:ring-1 focus:ring-slate-950/5 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl text-xs font-bold text-white bg-slate-950 hover:bg-slate-850 active:bg-black shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Log Task Hours</span>
            </button>
          </form>
        </div>

        {/* Right Side: Log summary list (7 Columns) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-slate-150/75 px-6 py-4.5 bg-slate-50/40">
            <h3 className="font-bold text-slate-900 text-sm">Timesheet Log Entries</h3>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {logs.map(log => (
              <div key={log.id} className="px-6 py-4.5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-slate-50/30 transition-colors text-left">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-950 text-xs">{log.project}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">{log.category}</span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-semibold mt-1">Logged on: {log.date} — {log.hours} Hours recorded</span>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-semibold mt-1">{log.notes}</p>
                </div>

                <div className="shrink-0">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold border ${
                    log.status === "Approved"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-100"
                      : "bg-amber-50 text-amber-800 border-amber-100"
                  }`}>
                    {log.status === "Approved" ? (
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Clock className="w-3 h-3 text-amber-600" />
                    )}
                    <span>{log.status}</span>
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
