"use client";

import {
  Users,
  GraduationCap,
  CalendarDays,
  FileCheck,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Briefcase
} from "lucide-react";

export default function AdminDashboardPage() {
  const stats = [
    { name: "Active Employees", value: "134", change: "+4.2%", icon: Users, color: "slate" },
    { name: "Registered Interns", value: "28", change: "+12.5%", icon: GraduationCap, color: "slate" },
    { name: "Pending Approvals", value: "5 Action Items", change: "Requires Review", icon: FileCheck, color: "indigo" },
    { name: "Operational Cost", value: "$42,000", change: "+1.8%", icon: Briefcase, color: "slate" }
  ];

  const pendingApprovals = [
    { id: 1, employee: "Sarah Jenkins", role: "UI Designer", module: "Leave Tracker", detail: "Sick Leave (3 days)", date: "Today" },
    { id: 2, employee: "Daniel Cooper", role: "Software Intern", module: "Timesheet Approval", detail: "Task Logging Week 4 (40 hrs)", date: "Today" },
    { id: 3, employee: "Elena Rostova", role: "HR Specialist", module: "Leave Tracker", detail: "Annual Vacation (5 days)", date: "Yesterday" },
    { id: 4, employee: "Arjun Mehta", role: "QA Engineer", module: "Timesheet Approval", detail: "Task Logging Week 4 (38 hrs)", date: "Yesterday" }
  ];

  const activeEmployeeActivity = [
    { id: 1, name: "Marcus Aurelius", action: "Completed mandatory cybersecurity training", time: "10 mins ago" },
    { id: 2, name: "Jessica Alba", action: "Submitted document verification for profile completion", time: "1 hour ago" },
    { id: 3, name: "Bill Gates", action: "Checked out of workspace (8.5 hours recorded)", time: "2 hours ago" },
    { id: 4, name: "Satya Nadella", action: "Registered internship account profile", time: "Yesterday" }
  ];

  return (
    <div className="flex flex-col gap-8">
      
      {/* Welcome header info */}
      <div className="flex flex-col gap-1 text-left">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Global Dashboard | Overview</h1>
        <p className="text-xs text-slate-500">Welcome back, Super Admin. Here is the operational summary for today.</p>
      </div>

      {/* Stats row grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div 
              key={i} 
              className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between gap-4 hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{stat.name}</span>
                <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700">
                  <Icon className="w-4.5 h-4.5" />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-2xl font-extrabold tracking-tight text-slate-950">{stat.value}</span>
                <div className="flex items-center gap-1">
                  <TrendingUp className={`w-3.5 h-3.5 ${stat.color === "indigo" ? "text-indigo-500" : "text-emerald-500"}`} />
                  <span className={`text-[10px] font-bold ${stat.color === "indigo" ? "text-indigo-600" : "text-emerald-600"}`}>{stat.change}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action lists split split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Side: Pending Operational Approvals (7 Columns) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-slate-150/75 px-6 py-4.5 flex justify-between items-center bg-slate-50/40">
            <h3 className="font-bold text-slate-900 text-sm">Pending Operations Approvals</h3>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full uppercase">
              Action Required
            </span>
          </div>

          <div className="flex-1 divide-y divide-slate-100">
            {pendingApprovals.map((approval) => (
              <div key={approval.id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50/30 transition-colors">
                <div className="flex flex-col gap-1 text-left min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-950 text-xs truncate">{approval.employee}</span>
                    <span className="text-[10px] font-semibold text-slate-400">({approval.role})</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="font-bold text-slate-700">{approval.module}:</span>
                    <span className="truncate">{approval.detail}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-semibold text-slate-400 whitespace-nowrap">{approval.date}</span>
                  
                  {/* Approval Actions Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button 
                      type="button" 
                      onClick={() => alert("Approved successfully")}
                      className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 transition-colors cursor-pointer"
                      title="Approve"
                    >
                      <CheckCircle className="w-4.5 h-4.5" />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => alert("Declined successfully")}
                      className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors cursor-pointer"
                      title="Decline"
                    >
                      <XCircle className="w-4.5 h-4.5" />
                    </button>
                  </div>

                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Recent Activity Feed (5 Columns) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-slate-150/75 px-6 py-4.5 bg-slate-50/40">
            <h3 className="font-bold text-slate-900 text-sm">Recent Activity Logs</h3>
          </div>

          <div className="flex-1 p-6 flex flex-col gap-6">
            {activeEmployeeActivity.map((activity) => (
              <div key={activity.id} className="flex gap-3 text-left">
                <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                  <Clock className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-xs text-slate-600 leading-normal">
                    <span className="font-bold text-slate-900">{activity.name}</span> {activity.action}
                  </p>
                  <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
