"use client";

import { useState } from "react";
import { CalendarDays, Plus, CheckCircle, Clock } from "lucide-react";

export default function InternLeaves() {
  const [requests, setRequests] = useState([
    { id: 1, date: "2026-05-29", type: "Exam Leave", duration: "2 Days", dates: "Jun 10 - Jun 11", reason: "End of semester computer science practical examinations.", status: "Pending" }
  ]);

  const [type, setType] = useState("Exam Leave");
  const [duration, setDuration] = useState("");
  const [dates, setDates] = useState("");
  const [reason, setReason] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!duration || !dates || !reason) return;

    const newReq = {
      id: Date.now(),
      date: new Date().toISOString().split("T")[0],
      type,
      duration: `${duration} Day${Number(duration) > 1 ? "s" : ""}`,
      dates,
      reason,
      status: "Pending"
    };

    setRequests(prev => [newReq, ...prev]);
    setDuration("");
    setDates("");
    setReason("");
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="flex flex-col gap-8 text-left">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Internship Leave Approvals</h1>
        <p className="text-xs text-slate-500">Submit requests for exam closures, medical breaks, or personal breaks. Track evaluation status details.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left: Request Form (5 Columns) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm flex flex-col gap-6 text-left h-fit">
          <div className="flex flex-col gap-1">
            <h3 className="font-bold text-slate-950 text-sm">Apply for Leave</h3>
            <p className="text-[11px] text-slate-400">File leave requests for coordinator audits.</p>
          </div>

          {success && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Leave request filed and sent successfully!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Leave Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:outline-none cursor-pointer font-bold text-slate-700"
              >
                <option value="Exam Leave">Exam Leave</option>
                <option value="Sick Leave">Sick Leave</option>
                <option value="Casual Leave">Casual Break</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Duration (Days)</label>
                <input
                  required
                  type="number"
                  min="1"
                  max="10"
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  placeholder="e.g. 2"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-800 focus:border-slate-950 focus:ring-1 focus:ring-slate-950/5"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Dates Range</label>
                <input
                  required
                  type="text"
                  value={dates}
                  onChange={e => setDates(e.target.value)}
                  placeholder="e.g. Jun 10 - Jun 11"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-800 focus:border-slate-950 focus:ring-1 focus:ring-slate-950/5"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Reason for absence</label>
              <textarea
                required
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="List practical or medical explanation for break..."
                rows="3"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-800 focus:border-slate-950 focus:ring-1 focus:ring-slate-950/5 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl text-xs font-bold text-white bg-slate-950 hover:bg-slate-850 active:bg-black shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Submit Leave Request</span>
            </button>
          </form>
        </div>

        {/* Right: History List (7 Columns) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-slate-150/75 px-6 py-4.5 bg-slate-50/40">
            <h3 className="font-bold text-slate-900 text-sm">Filed Leave applications</h3>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {requests.map(req => (
              <div key={req.id} className="px-6 py-4.5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-slate-50/30 transition-colors text-left">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-950 text-xs">{req.type}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">{req.duration}</span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-semibold mt-1">Request Date: {req.date} — Scheduled: {req.dates}</span>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-semibold mt-1 bg-slate-50 p-2 rounded border border-slate-100/50">&ldquo;{req.reason}&rdquo;</p>
                </div>

                <div className="shrink-0">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold border ${
                    req.status === "Approved"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-100"
                      : "bg-amber-50 text-amber-800 border-amber-100"
                  }`}>
                    {req.status === "Approved" ? (
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Clock className="w-3 h-3 text-amber-600" />
                    )}
                    <span>{req.status}</span>
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
