"use client";

import { useState } from "react";
import { ClipboardList, Plus, CheckCircle, Clock } from "lucide-react";

export default function InternTimesheet() {
  const [logs, setLogs] = useState([
    { id: 1, week: "Week 4 (May 24 - May 28)", learningSummary: "Finished setting up MongoDB connections and Mongoose mock fallbacks.", hours: 38, status: "Pending" },
    { id: 2, week: "Week 3 (May 17 - May 21)", learningSummary: "Reviewed cybersecurity checklist and verified Git SSH parameters.", hours: 40, status: "Approved" }
  ]);

  const [learningSummary, setLearningSummary] = useState("");
  const [hours, setHours] = useState("");
  const [week, setWeek] = useState("Week 4 (May 24 - May 28)");
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!learningSummary || !hours) return;

    const newLog = {
      id: Date.now(),
      week,
      learningSummary,
      hours: Number(hours),
      status: "Pending"
    };

    setLogs(prev => [newLog, ...prev]);
    setLearningSummary("");
    setHours("");
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="flex flex-col gap-8 text-left">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Internship Timesheet Logging</h1>
        <p className="text-xs text-slate-500">Record weekly learning hours, list training syllabus chapters completed, and submit to your mentor.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Side: Submit hours form (5 Columns) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm flex flex-col gap-6 text-left h-fit">
          <div className="flex flex-col gap-1">
            <h3 className="font-bold text-slate-950 text-sm">Submit Weekly Log</h3>
            <p className="text-[11px] text-slate-400">File learning goals to your Engineering lead.</p>
          </div>

          {success && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Intern timesheet logged and sent!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Target Week slot</label>
              <select
                value={week}
                onChange={e => setWeek(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:outline-none cursor-pointer font-bold text-slate-700"
              >
                <option value="Week 4 (May 24 - May 28)">Week 4 (May 24 - May 28)</option>
                <option value="Week 5 (May 31 - Jun 04)">Week 5 (May 31 - Jun 04)</option>
                <option value="Week 6 (Jun 07 - Jun 11)">Week 6 (Jun 07 - Jun 11)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Hours logged</label>
              <input
                required
                type="number"
                min="1"
                max="80"
                value={hours}
                onChange={e => setHours(e.target.value)}
                placeholder="e.g. 40"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-800 focus:border-slate-950 focus:ring-1 focus:ring-slate-950/5"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Weekly Learning summary</label>
              <textarea
                required
                value={learningSummary}
                onChange={e => setLearningSummary(e.target.value)}
                placeholder="Details of skills acquired, git code repositories pushed, and lectures attended..."
                rows="4"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-800 focus:border-slate-950 focus:ring-1 focus:ring-slate-950/5 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl text-xs font-bold text-white bg-slate-950 hover:bg-slate-850 active:bg-black shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Log Internship Hours</span>
            </button>
          </form>
        </div>

        {/* Right Side: Log summary list (7 Columns) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-slate-150/75 px-6 py-4.5 bg-slate-50/40">
            <h3 className="font-bold text-slate-900 text-sm">Syllabus Logging history</h3>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {logs.map(log => (
              <div key={log.id} className="px-6 py-4.5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-slate-50/30 transition-colors text-left">
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-slate-950 text-xs">{log.week}</span>
                  <span className="text-[9px] text-slate-400 font-semibold mt-1">Logged hours: {log.hours} hours recorded</span>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-semibold mt-1">{log.learningSummary}</p>
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
