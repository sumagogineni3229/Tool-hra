"use client";

import { useState } from "react";
import { Clock, CheckCircle, XCircle, Search, UserCheck } from "lucide-react";

export default function ManagerAttendance() {
  const [squad, setSquad] = useState([
    { id: 1, name: "Marcus Aurelius", role: "Employee", timeIn: "08:58 AM", breakStatus: "Active", totalHrs: "6.5 hrs", location: "Remote (IP Validated)" },
    { id: 2, name: "Jane Smith", role: "Intern", timeIn: "09:05 AM", breakStatus: "On Break", totalHrs: "5.2 hrs", location: "Office (Desk 4B)" },
    { id: 3, name: "Sarah Jenkins", role: "HR Specialist", timeIn: "09:00 AM", breakStatus: "Offline", totalHrs: "8.5 hrs", location: "Office (Cabin 2)" }
  ]);

  return (
    <div className="flex flex-col gap-8 text-left">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Live Team Attendance</h1>
        <p className="text-xs text-slate-500">Monitor active session logins, checked-in geo-validations, break states, and daily logged shifts.</p>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="border-b border-slate-150/75 px-6 py-4.5 bg-slate-50/40">
          <h3 className="font-bold text-slate-900 text-sm">Squad Attendance Board</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-55/20">
                <th className="px-6 py-4">Direct Report</th>
                <th className="px-6 py-4">Shift Clock-In</th>
                <th className="px-6 py-4">Logged Time</th>
                <th className="px-6 py-4">Physical Node Location</th>
                <th className="px-6 py-4">Operational Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {squad.map(member => (
                <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-800">
                        {member.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 text-xs">{member.name}</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{member.role}</span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-xs font-bold text-slate-700">
                    {member.timeIn}
                  </td>

                  <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                    {member.totalHrs}
                  </td>

                  <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                    {member.location}
                  </td>

                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold border ${
                      member.breakStatus === "Active"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-100"
                        : member.breakStatus === "On Break"
                        ? "bg-amber-50 text-amber-800 border-amber-100"
                        : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        member.breakStatus === "Active" ? "bg-emerald-500" : member.breakStatus === "On Break" ? "bg-amber-400 animate-pulse" : "bg-slate-400"
                      }`} />
                      <span>{member.breakStatus}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
