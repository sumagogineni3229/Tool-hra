"use client";

import { useState, useEffect } from "react";
import {
  Users,
  ClipboardList,
  Clock,
  CalendarDays,
  CheckCircle,
  TrendingUp,
  FileCheck,
  Award
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";

export default function ManagerDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [squadMembers, setSquadMembers] = useState([]);
  const [loadingSquad, setLoadingSquad] = useState(true);

  const [pendingTimesheets, setPendingTimesheets] = useState([
    { id: 1, name: "Marcus Aurelius", role: "Employee", project: "Leave Tracker UI", hours: "40 hrs", week: "Week 4 (May 24 - May 28)" },
    { id: 2, name: "Jane Smith", role: "Intern", project: "Cybersecurity Course", hours: "38 hrs", week: "Week 4 (May 24 - May 28)" }
  ]);

  const loadSquadData = async (managerSession) => {
    setLoadingSquad(true);
    try {
      const [teamsData, usersData] = await Promise.all([
        apiClient.getTeams(),
        apiClient.getUsers()
      ]);

      const managerId = managerSession.id || managerSession._id;
      const managerEmail = managerSession.email;

      // Find teams managed by this manager
      const managedTeams = teamsData.filter(team => {
        const tMgrId = team.managerId?.id || team.managerId?._id || team.managerId;
        const tMgrEmail = team.managerId?.email;
        return (tMgrId === managerId || tMgrEmail === managerEmail);
      });

      if (managedTeams.length > 0) {
        // Collect all member IDs/objects across their managed teams
        const memberRefs = [];
        managedTeams.forEach(team => {
          if (Array.isArray(team.members)) {
            memberRefs.push(...team.members);
          }
        });

        // Resolve unique members details from user directory
        const resolvedMembersMap = new Map();
        memberRefs.forEach(m => {
          const mId = m.id || m._id || m;
          if (!mId) return;

          let details = null;
          if (typeof m === "object" && m !== null) {
            details = m;
          } else {
            details = usersData.find(u => u.id === mId || u._id === mId);
          }

          if (details) {
            resolvedMembersMap.set(details.email || mId, details);
          }
        });

        const resolvedMembers = Array.from(resolvedMembersMap.values());
        
        // Map resolved members to squad tracker feed list structure
        const mappedMembers = resolvedMembers.map(m => {
          const isOnline = m.session === "Online";
          return {
            id: m.id || m._id || Math.random().toString(),
            name: m.name,
            status: isOnline ? "Active Working" : "Offline",
            details: `Role: ${m.role} | Department: ${m.department || 'Engineering'}`,
            badge: isOnline ? "bg-emerald-50 text-emerald-800 border-emerald-100" : "bg-slate-100 text-slate-600 border-slate-200",
            initials: m.initials || m.name.split(" ").map(n => n[0]).join("")
          };
        });

        setSquadMembers(mappedMembers);
      } else {
        setSquadMembers([]);
      }
    } catch (err) {
      console.error("Failed to load manager's squad data:", err);
    } finally {
      setLoadingSquad(false);
    }
  };

  useEffect(() => {
    const session = apiClient.getCurrentSession();
    setCurrentUser(session);
    if (session) {
      loadSquadData(session);
    }
  }, []);

  const handleApproveTimesheet = (id) => {
    setPendingTimesheets(prev => prev.filter(t => t.id !== id));
  };

  // Dynamically count Direct reports and set stats array
  const stats = [
    { 
      name: "Team Active Staff", 
      value: squadMembers.length > 0 ? `${squadMembers.length} ${squadMembers.length === 1 ? 'Member' : 'Members'}` : "0 Members", 
      icon: Users, 
      change: "Direct reports", 
      color: "emerald" 
    },
    { name: "Team Logged Hours", value: "118 Hrs", icon: ClipboardList, change: "This week logs", color: "indigo" },
    { name: "Live Attendance Rate", value: squadMembers.length > 0 ? `${(squadMembers.filter(m => m.status === "Active Working").length / squadMembers.length * 100).toFixed(0)}%` : "0%", icon: Clock, change: "Highly active", color: "emerald" },
    { name: "Pending Approvals", value: `${pendingTimesheets.length} Items`, icon: CalendarDays, change: "Timesheets requires review", color: "amber" }
  ];

  return (
    <div className="flex flex-col gap-8 text-left">

      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Operations Control Room</h1>
        <p className="text-xs text-slate-500">Welcome back, {currentUser?.name || "Manager"}. Monitor your engineering squad, timesheet submissions, and daily operational milestones.</p>
      </div>

      {/* Stats Cards */}
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
                <span className="text-[10px] text-slate-400 font-bold">{stat.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

        {/* Left Side: Pending Timesheet approvals (7 Columns) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-slate-150/75 px-6 py-4.5 flex justify-between items-center bg-slate-50/40">
            <h3 className="font-bold text-slate-900 text-sm">Timesheets Awaiting Approvals</h3>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full uppercase">
              Action Required
            </span>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {pendingTimesheets.length > 0 ? (
              pendingTimesheets.map(t => (
                <div key={t.id} className="p-6 flex items-center justify-between gap-4 hover:bg-slate-55/10 transition-all text-left">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-slate-950 text-xs">{t.name}</span>
                    <span className="text-[10px] text-slate-500 font-semibold">{t.week}</span>
                    <div className="text-xs font-semibold text-slate-700 mt-0.5">
                      Task hours: <span className="text-indigo-655 font-bold">{t.hours}</span> logged in <span className="italic font-bold">({t.project})</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleApproveTimesheet(t.id)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Approve Log</span>
                  </button>
                </div>
              ))
            ) : (
              <div className="py-16 text-center text-slate-400 text-xs font-semibold bg-slate-50/10 flex flex-col items-center justify-center">
                <FileCheck className="w-8 h-8 text-emerald-500 mb-2" />
                <span>All squad timesheets verified! Ready for payroll.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Squad live statuses (5 Columns) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-slate-150/75 px-6 py-4.5 bg-slate-50/40">
            <h3 className="font-bold text-slate-900 text-sm">Squad Tracker Feed</h3>
          </div>

          <div className="flex-1 p-6 flex flex-col gap-6 max-h-[400px] overflow-y-auto">
            {squadMembers.length > 0 ? (
              squadMembers.map(member => (
                <div key={member.id} className="flex items-start justify-between gap-3 text-left">
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-800 shrink-0">
                      {member.initials}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-xs text-slate-900 leading-none">{member.name}</span>
                      <span className="text-[10px] text-slate-400 mt-1.5 font-semibold">{member.details}</span>
                    </div>
                  </div>

                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${member.badge}`}>
                    {member.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-16 text-center text-slate-400 text-xs font-semibold flex flex-col items-center justify-center">
                <Users className="w-8 h-8 text-slate-300 mb-2 animate-pulse" />
                <span>
                  {loadingSquad ? "Retrieving squad information..." : "No direct reports assigned to your squad."}
                </span>
                {!loadingSquad && (
                  <span className="block text-[10px] text-slate-400/80 mt-1 max-w-[200px]">
                    Ask an Admin or HR specialist to register your squad assignments in the Org Console.
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
