"use client";

import { useState, useEffect } from "react";
import {
  Clock,
  Play,
  Coffee,
  Square,
  GraduationCap,
  CheckCircle,
  HelpCircle,
  MessageSquare,
  TrendingUp,
  Award,
  Star
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";

export default function InternDashboard() {
  const [currentUser, setCurrentUser] = useState(null);

  // Time Tracker State
  const [status, setStatus] = useState("Offline");
  const [seconds, setSeconds] = useState(14420); // 4h 0m 20s starting point

  // Interactive Syllabus Checkmarks
  const [tasks, setTasks] = useState([
    { id: 1, text: "Complete cybersecurity security policy handbook review", checked: true },
    { id: 2, text: "Verify GitHub operational environment setup and SSH keys", checked: true },
    { id: 3, text: "Finish Next.js advanced app router structures course", checked: false },
    { id: 4, text: "Integrate Mongoose connection fallbacks in auth routes", checked: false }
  ]);

  const [recentMentorNotes, setRecentMentorNotes] = useState([
    { id: 1, author: "Daniel Cooper", role: "Engineering Lead", text: "Great work wrapping up the database schemas so quickly. Next, let's focus on refining clean client fallback clients.", time: "2 hours ago" },
    { id: 2, author: "Sarah Jenkins", role: "HR Specialist", text: "Welcome to HRA Groups! Your onboarding documents have been fully approved. Reach out for any access permissions help.", time: "Yesterday" }
  ]);

  // Mock/Live Performance Ratings State
  const [performanceRatings, setPerformanceRatings] = useState({
    overall: 4.50,
    metrics: [
      { key: "Productivity", value: 90, color: "bg-emerald-500" },
      { key: "Quality of Work", value: 88, color: "bg-indigo-500" },
      { key: "Team Collaboration", value: 92, color: "bg-rose-500" },
      { key: "Punctuality", value: 90, color: "bg-amber-500" }
    ],
    managerReview: {
      author: "Daniel Cooper",
      role: "Engineering Lead / Mentor",
      text: "Outstanding progress on codebase onboarding. Consistently takes initiative on backend integration tasks and fallback setups.",
      date: "May 28, 2026"
    }
  });

  useEffect(() => {
    const session = apiClient.getCurrentSession();
    setCurrentUser(session);

    if (session?.email) {
      // Fetch Performance review dynamically
      fetch(`/api/performance?email=${encodeURIComponent(session.email)}`)
        .then(res => {
          if (res.ok) return res.json();
          throw new Error("Failed to fetch performance");
        })
        .then(data => {
          if (data.success && data.performance) {
            const p = data.performance;
            setPerformanceRatings({
              overall: p.overallScore || 0,
              metrics: [
                { key: "Productivity", value: p.productivity || 0, color: "bg-emerald-500" },
                { key: "Quality of Work", value: p.qualityOfWork || 0, color: "bg-indigo-500" },
                { key: "Team Collaboration", value: p.collaboration || 0, color: "bg-rose-500" },
                { key: "Punctuality", value: p.punctuality || 0, color: "bg-amber-500" }
              ],
              managerReview: {
                author: p.reviewedBy || "HR Specialist",
                role: p.reviewedByRole || "HR Manager",
                text: p.managerFeedback || "Keep up the excellent work!",
                date: new Date(p.reviewDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
              }
            });
          }
        })
        .catch(err => {
          console.warn("Could not fetch dynamic performance ratings, using standard mock fallback...", err);
          // Fallback to local cached reviews if offline
          const cachedPerf = localStorage.getItem("hra_performance");
          if (cachedPerf) {
            const parsed = JSON.parse(cachedPerf);
            const userP = parsed.find(p => p.userEmail.toLowerCase().trim() === session.email.toLowerCase().trim());
            if (userP) {
              setPerformanceRatings({
                overall: userP.overallScore || 0,
                metrics: [
                  { key: "Productivity", value: userP.productivity || 0, color: "bg-emerald-500" },
                  { key: "Quality of Work", value: userP.qualityOfWork || 0, color: "bg-indigo-500" },
                  { key: "Team Collaboration", value: userP.collaboration || 0, color: "bg-rose-500" },
                  { key: "Punctuality", value: userP.punctuality || 0, color: "bg-amber-500" }
                ],
                managerReview: {
                  author: userP.reviewedBy || "HR Specialist",
                  role: userP.reviewedByRole || "HR Manager",
                  text: userP.managerFeedback || "Keep up the excellent work!",
                  date: new Date(userP.reviewDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                }
              });
            }
          }
        });
    }
  }, []);

  useEffect(() => {
    let interval = null;
    if (status === "ClockedIn") {
      interval = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  const formatTime = (totalSecs) => {
    const hrs = Math.floor(totalSecs / 3600).toString().padStart(2, "0");
    const mins = Math.floor((totalSecs % 3600) / 60).toString().padStart(2, "0");
    const secs = (totalSecs % 60).toString().padStart(2, "0");
    return `${hrs}:${mins}:${secs}`;
  };

  const handleToggleTask = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, checked: !t.checked } : t));
  };

  const completedCount = tasks.filter(t => t.checked).length;
  const progressPct = (completedCount / tasks.length) * 100;

  return (
    <div className="flex flex-col gap-8 text-left">
      
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Internship Portal</h1>
        <p className="text-xs text-slate-500">Welcome, {currentUser?.name || "Intern"}. Log your learning hours, complete mandatory syllabus checks, and track mentor evaluations.</p>
      </div>

      {/* Split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left: Clock-In Console (6 Columns) */}
        <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm flex flex-col gap-6 text-left">
          <div className="flex flex-col gap-1">
            <h3 className="font-bold text-slate-950 text-sm">Attendance logger</h3>
            <p className="text-[11px] text-slate-400">File your internship daily operational hours.</p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 rounded-2xl bg-slate-50 border border-slate-100 mt-2">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clocked time today</span>
              <span className="text-3xl font-extrabold font-mono tracking-tight text-slate-950">
                {status === "ClockedOut" ? "Shift Complete" : formatTime(seconds)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border w-fit h-fit uppercase tracking-wider bg-white shadow-sm">
              <span className={`w-2 h-2 rounded-full ${status === "ClockedIn" ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
              <span className="text-slate-600 font-bold">{status === "ClockedIn" ? "Checked In" : status}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-2">
            <button
              onClick={() => setStatus("ClockedIn")}
              disabled={status === "ClockedIn" || status === "ClockedOut"}
              className="py-3.5 rounded-xl text-xs font-bold text-white bg-slate-950 hover:bg-slate-850 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Play className="w-4 h-4" />
              <span>Clock In</span>
            </button>

            <button
              onClick={() => setStatus(status === "ClockedIn" ? "Break" : "ClockedIn")}
              disabled={status === "Offline" || status === "ClockedOut"}
              className="py-3.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed disabled:border-transparent flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Coffee className="w-4 h-4 text-amber-500" />
              <span>{status === "Break" ? "Resume" : "Break"}</span>
            </button>

            <button
              onClick={() => setStatus("ClockedOut")}
              disabled={status === "Offline" || status === "ClockedOut"}
              className="py-3.5 rounded-xl text-xs font-bold text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-transparent flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Square className="w-4 h-4 text-rose-500" />
              <span>Clock Out</span>
            </button>
          </div>
        </div>

        {/* Right: Learning Track Checklist (6 Columns) */}
        <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm flex flex-col gap-6 text-left">
          
          <div className="flex justify-between items-center gap-4">
            <div className="flex flex-col gap-1">
              <h3 className="font-bold text-slate-950 text-sm">Learning Syllabus checkpoints</h3>
              <p className="text-[11px] text-slate-400">Complete objectives to clear review phases.</p>
            </div>
            
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-slate-900">{progressPct}% complete</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">{completedCount} / {tasks.length} Checkpoints</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 rounded-full bg-slate-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 h-full bg-amber-500 rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
          </div>

          <div className="flex flex-col gap-3 mt-1">
            {tasks.map(task => (
              <label key={task.id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50/50 transition-colors cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={task.checked}
                  onChange={() => handleToggleTask(task.id)}
                  className="w-4.5 h-4.5 rounded text-amber-500 border-slate-350 focus:ring-amber-500/20 cursor-pointer mt-0.5"
                />
                <span className={`text-xs font-semibold text-slate-700 leading-normal ${task.checked ? "line-through text-slate-400" : ""}`}>{task.text}</span>
              </label>
            ))}
          </div>

        </div>

      </div>

      {/* Mentor Feedback & Reviews section */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="border-b border-slate-150/75 px-6 py-4.5 bg-slate-50/40">
          <h3 className="font-bold text-slate-900 text-sm">Mentor Evaluation Notes</h3>
        </div>

        <div className="divide-y divide-slate-100 p-6 flex flex-col gap-6">
          {recentMentorNotes.map(note => (
            <div key={note.id} className="flex gap-4 text-left items-start">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-950 text-xs">{note.author}</span>
                  <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded uppercase tracking-wider">{note.role}</span>
                  <span className="text-[9px] text-slate-400 font-semibold uppercase whitespace-nowrap">{note.time}</span>
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed mt-0.5 bg-slate-50 p-3 rounded-xl border border-slate-100/50 italic">&ldquo;{note.text}&rdquo;</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Assessment Panel (Full Width card) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col text-left">
        <div className="border-b border-slate-150/70 px-6 py-4 bg-slate-50/50 flex justify-between items-center">
          <div className="flex flex-col gap-1 text-left">
            <span className="text-[10px] font-extrabold text-amber-600 bg-amber-50 border border-amber-100/50 px-2 py-0.5 rounded w-fit uppercase tracking-wider">Performance Audit</span>
            <h3 className="font-bold text-slate-900 text-sm mt-1.5">Periodic Performance & Core Evaluations</h3>
          </div>
          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl shadow-sm">
            <Award className="w-4 h-4 text-indigo-650 shrink-0 animate-bounce" />
            <span className="text-xs font-extrabold text-indigo-950">Active Quarter Scope</span>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Metrics scorecard (8 columns) */}
          <div className="lg:col-span-8 flex flex-col md:flex-row gap-6 items-stretch justify-between">
            {/* Stars Overall Rating Box */}
            <div className="md:w-1/3 p-6 rounded-2xl border border-slate-100 bg-slate-50/40 text-center flex flex-col items-center justify-center gap-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Evaluation Score</span>
              <span className="text-4xl font-extrabold text-slate-950 font-mono tracking-tight text-center">{performanceRatings.overall.toFixed(2)}</span>
              
              {/* Star graphics */}
              <div className="flex items-center gap-1 justify-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4.5 h-4.5 text-amber-500 fill-amber-400" />
                ))}
              </div>

              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full uppercase mt-1">
                Exceeds Expectations
              </span>
            </div>

            {/* Core Competencies bar charts */}
            <div className="md:w-2/3 flex flex-col justify-between gap-4 py-1.5">
              {performanceRatings.metrics.map((metric, i) => (
                <div key={i} className="flex flex-col gap-1.5 text-left">
                  <div className="flex justify-between text-xs font-bold text-slate-800">
                    <span>{metric.key}</span>
                    <span className="font-mono text-slate-950">{metric.value}%</span>
                  </div>
                  {/* Progress scale */}
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden relative">
                    <div className={`h-full rounded-full ${metric.color} transition-all duration-500`} style={{ width: `${metric.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Styled Speech bubble Mentor evaluation (4 columns) */}
          <div className="lg:col-span-4 border border-slate-150 p-5 rounded-2xl bg-slate-50/45 flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-900 leading-none">{performanceRatings.managerReview.author}</span>
                  <span className="text-[8px] font-bold text-indigo-600 uppercase tracking-wide mt-1 leading-none">
                    {performanceRatings.managerReview.role}
                  </span>
                </div>
              </div>

              {/* Speech bubble box */}
              <p className="text-[11px] text-slate-600 font-semibold leading-relaxed mt-2 p-3 bg-white border border-slate-100 rounded-xl relative italic shadow-sm">
                &ldquo;{performanceRatings.managerReview.text}&rdquo;
              </p>
            </div>

            <div className="flex justify-between items-center text-[8px] text-slate-400 font-bold uppercase tracking-wider font-mono">
              <span>Feedback Review</span>
              <span>{performanceRatings.managerReview.date}</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
