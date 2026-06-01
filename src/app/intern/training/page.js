"use client";

import { GraduationCap, Award, CheckCircle, FileText, Play } from "lucide-react";

export default function InternTrainingConsole() {
  const modules = [
    { id: 1, name: "Module 1: Corporate Cybersecurity Onboarding", duration: "1.5 hours", status: "Completed", desc: "Basic parameters regarding secure login scopes, ISO audits, and local storage safety." },
    { id: 2, name: "Module 2: Version Control & Code Deployments", duration: "3 hours", status: "Completed", desc: "Setting up SSH keys, resolving git tree conflicts, and understanding corporate branches." },
    { id: 3, name: "Module 3: Advanced Next.js App Router Paradigms", duration: "5 hours", status: "In Progress", desc: "Understanding Server Component rendering streams and client layouts permission guards." },
    { id: 4, name: "Module 4: Resilient Database Architecture Fallbacks", duration: "4 hours", status: "Locked", desc: "Developing bulletproof API route connectors coupled with seamless local storage mocks." }
  ];

  return (
    <div className="flex flex-col gap-8 text-left">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Internship Training Hub</h1>
        <p className="text-xs text-slate-500">Track your learning track modules, unlock technical achievements, and review course documentations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch font-sans">
        
        {/* Left Side: Active modules timeline (8 Columns) */}
        <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-slate-150/75 px-6 py-4.5 bg-slate-50/40">
            <h3 className="font-bold text-slate-900 text-sm">Learning Track Syllabus</h3>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {modules.map(mod => (
              <div key={mod.id} className="p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-slate-50/20 transition-all text-left">
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-slate-950 text-xs">{mod.name}</span>
                  <span className="text-[10px] text-slate-400 font-semibold mt-0.5">Estimated study: {mod.duration}</span>
                  <p className="text-[10px] text-slate-500 leading-normal font-semibold mt-1">{mod.desc}</p>
                </div>

                <div className="shrink-0 flex items-center gap-2 mt-2 sm:mt-0">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold border ${
                    mod.status === "Completed"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-100"
                      : mod.status === "In Progress"
                      ? "bg-indigo-50 text-indigo-800 border-indigo-100"
                      : "bg-slate-150 text-slate-400 border-transparent"
                  }`}>
                    {mod.status}
                  </span>
                  
                  {mod.status === "In Progress" && (
                    <button
                      onClick={() => alert("Launching Next.js Video syllabus panel...")}
                      className="p-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
                      title="Resume course video"
                    >
                      <Play className="w-3.5 h-3.5 shrink-0 fill-white" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Achievements milestones (4 Columns) */}
        <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm flex flex-col gap-6 text-left h-fit">
          <div className="flex flex-col gap-1">
            <h3 className="font-bold text-slate-950 text-sm">Learning achievements</h3>
            <p className="text-[11px] text-slate-400">Certifications unlocked on syllabus clearance.</p>
          </div>

          <div className="flex flex-col gap-4 mt-2">
            <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xs text-slate-900 leading-none">Security Cadet</span>
                <span className="text-[9px] text-slate-400 font-semibold mt-1">Cleared Module 1</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 animate-pulse">
                <GraduationCap className="w-5 h-5 text-indigo-650" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xs text-slate-900 leading-none">Next.js Novice</span>
                <span className="text-[9px] text-slate-400 font-semibold mt-1">Module 3 in progress</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
