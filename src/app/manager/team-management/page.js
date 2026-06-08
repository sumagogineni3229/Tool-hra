"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Clock,
  CalendarDays,
  UserCheck,
  Search,
  Layers,
  Calendar,
  X,
  Mail,
  Phone,
  MapPin,
  Shield,
  AlertCircle,
  Briefcase,
  ArrowRight
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";

const getLocalDateString = (dateObj) => {
  if (!dateObj) return "";
  const d = new Date(dateObj);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function TeamManagementPage() {
  // Global Data states
  const [departments, setDepartments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);

  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Selector states
  const [activeTeam, setActiveTeam] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  // Modal / Detail states
  const [selectedMember, setSelectedMember] = useState(null);
  const [modalType, setModalType] = useState(null); // 'profile' | 'attendance' | 'leaves' | null
  const [fetchingProfile, setFetchingProfile] = useState(false);

  // Fetch all org data concurrently
  const loadData = async () => {
    setLoading(true);
    try {
      const [
        fetchedUsers,
        fetchedDepts,
        fetchedTeams,
        attRes,
        leaveRes
      ] = await Promise.all([
        apiClient.getUsers({ includePhotos: "true" }),
        apiClient.getDepartments(),
        apiClient.getTeams(),
        fetch(`/api/attendance?t=${Date.now()}`, { cache: 'no-store' }).catch(e => { console.warn("Muted attendance fetch error:", e); return null; }),
        fetch(`/api/leave?t=${Date.now()}`, { cache: 'no-store' }).catch(e => { console.warn("Muted leave fetch error:", e); return null; }),
      ]);

      setUsers(fetchedUsers || []);
      setDepartments(fetchedDepts || []);
      setTeams(fetchedTeams || []);

      if (attRes && attRes.ok) {
        const attData = await attRes.json().catch(() => ({}));
        setAttendance(attData.attendance || []);
      }

      if (leaveRes && leaveRes.ok) {
        const leaveData = await leaveRes.json().catch(() => ({}));
        setLeaves(leaveData.leaves || []);
      }

    } catch (error) {
      console.error("Failed to load team management dataset:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const session = apiClient.getCurrentSession();
      setCurrentUser(session);
    }
    loadData();
  }, []);

  // Filter teams managed by this user
  const managedTeams = useMemo(() => {
    if (!currentUser) return [];
    const currentUserId = currentUser.id || currentUser._id;

    // Admins and HR see all teams
    if (currentUser.role === "Admin" || currentUser.role === "HR") {
      return teams;
    }

    return teams.filter((t) => {
      const tMgrId = t.managerId?.id || t.managerId?._id || t.managerId;
      return tMgrId?.toString() === currentUserId?.toString();
    });
  }, [teams, currentUser]);

  // Set default active team once loaded
  useEffect(() => {
    if (managedTeams.length > 0 && !activeTeam) {
      setActiveTeam(managedTeams[0]);
    }
  }, [managedTeams, activeTeam]);

  // Handle Team switching
  const handleTeamChange = (teamId) => {
    const selected = managedTeams.find(t => t.id === teamId || t._id === teamId);
    if (selected) {
      setActiveTeam(selected);
      setSelectedMember(null);
      setModalType(null);
    }
  };

  const handleMemberActionClick = async (key, member) => {
    setSelectedMember(member);
    setModalType(key);
    if (key === "profile") {
      setFetchingProfile(true);
      try {
        const memberId = member.id || member._id;
        const res = await fetch(`/api/users?id=${memberId}`);
        if (res.ok) {
          const fullData = await res.json();
          setSelectedMember(fullData);
        }
      } catch (e) {
        console.warn("Failed to fetch full user profile:", e);
      } finally {
        setFetchingProfile(false);
      }
    }
  };

  // Resolve member full data based on user directory
  const resolvedMembers = useMemo(() => {
    if (!activeTeam) return [];
    
    // Create map for rapid users lookup
    const userMap = new Map();
    users.forEach((u) => {
      const id = u.id || u._id;
      if (id) userMap.set(id.toString(), u);
    });

    const todayStr = getLocalDateString(new Date());

    // Create map for today's attendance lookup
    const todayAttendanceMap = new Map();
    attendance.forEach((a) => {
      const attUserId = a.userId?._id || a.userId?.id || a.userId;
      const checkDate = a.date ? getLocalDateString(a.date) : "";
      if (attUserId && checkDate === todayStr) {
        todayAttendanceMap.set(attUserId.toString(), a);
      }
    });

    // Create map for today's approved leaves lookup
    const todayLeaveMap = new Map();
    leaves.forEach((l) => {
      const leaveUserId = l.userId?._id || l.userId?.id || l.userId;
      if (leaveUserId && l.status === "approved") {
        const start = l.startDate ? getLocalDateString(l.startDate) : "";
        const end = l.endDate ? getLocalDateString(l.endDate) : "";
        if (todayStr >= start && todayStr <= end) {
          todayLeaveMap.set(leaveUserId.toString(), l);
        }
      }
    });

    return (activeTeam.members || []).map((m) => {
      const mId = (m.id || m._id || m).toString();
      const fullUser = userMap.get(mId);

      // Compute status for today
      let todayStatus = "Offline";
      let attendanceRecord = null;

      // Match attendance
      const att = todayAttendanceMap.get(mId);
      if (att) {
        attendanceRecord = att;
        const hasActiveSession = att.sessions?.some((s) => !s.checkOut);
        todayStatus = hasActiveSession ? "Clocked In" : "Clocked Out";
      }

      // Match approved leaves
      const activeLeave = todayLeaveMap.get(mId);
      if (activeLeave) {
        todayStatus = "On Leave";
      }

      return {
        ...(fullUser || m),
        todayStatus,
        attendanceRecord,
        activeLeave
      };
    });
  }, [activeTeam, users, attendance, leaves]);

  // Filtered members list based on UI controls
  const filteredMembers = useMemo(() => {
    return resolvedMembers.filter((m) => {
      const matchesSearch =
        m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "All" || m.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [resolvedMembers, searchQuery, roleFilter]);

  // Aggregate Stats Calculations
  const stats = useMemo(() => {
    const total = resolvedMembers.length;
    const employees = resolvedMembers.filter(m => m.role === "Employee").length;
    const interns = resolvedMembers.filter(m => m.role === "Intern").length;
    const present = resolvedMembers.filter(m => m.todayStatus === "Clocked In" || m.todayStatus === "Clocked Out").length;
    const active = resolvedMembers.filter(m => m.todayStatus === "Clocked In").length;
    const onLeave = resolvedMembers.filter(m => m.todayStatus === "On Leave").length;

    return {
      total,
      employees,
      interns,
      present,
      active,
      onLeave,
    };
  }, [resolvedMembers]);

  // Retrieve attendance log for specific selected member
  const selectedMemberAttendance = useMemo(() => {
    if (!selectedMember) return [];
    const mId = selectedMember.id || selectedMember._id || selectedMember;
    return attendance.filter((a) => {
      const attUserId = a.userId?._id || a.userId?.id || a.userId;
      return attUserId?.toString() === mId?.toString();
    });
  }, [selectedMember, attendance]);

  // Retrieve leaves log for specific selected member
  const selectedMemberLeaves = useMemo(() => {
    if (!selectedMember) return [];
    const mId = selectedMember.id || selectedMember._id || selectedMember;
    return leaves.filter((l) => {
      const leaveUserId = l.userId?._id || l.userId?.id || l.userId;
      return leaveUserId?.toString() === mId?.toString();
    });
  }, [selectedMember, leaves]);

  // Get status configs
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Clocked In":
        return "bg-emerald-50 text-emerald-700 border-emerald-250/60";
      case "Clocked Out":
        return "bg-slate-100 text-slate-600 border-slate-200";
      case "On Leave":
        return "bg-purple-50 text-purple-700 border-purple-250/60";
      default:
        return "bg-amber-50 text-amber-600 border-amber-200/50";
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 text-slate-500 relative overflow-hidden">
        {/* Background atmospheric glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative flex items-center justify-center">
          {/* Animated concentric rings */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 rounded-full border-2 border-slate-100 border-t-emerald-500"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="absolute w-10 h-10 rounded-full border border-slate-250 border-b-indigo-500"
          />
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-semibold tracking-widest text-slate-800 uppercase animate-pulse">Syncing Squad Registry</span>
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Establishing secure data channels...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full max-w-none text-left select-none animate-fade-in">

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-[0.03] bg-gradient-to-l from-emerald-650 to-transparent pointer-events-none" />
        <div className="space-y-2 text-left">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold border border-emerald-100">
            <Users className="w-3 h-3 text-emerald-650" />
            Team Operations
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Team Management Hub</h1>
          <p className="text-xs font-medium text-slate-405 max-w-xl">
            Oversee active schedules, audit leave requests, and track attendance signals for employees and interns assigned to your squads.
          </p>
        </div>

        {/* Managed Teams Dropdown Selector */}
        {managedTeams.length > 0 && (
          <div className="flex flex-col gap-1 bg-slate-50 border border-slate-200 rounded-xl p-3 w-full md:w-64 text-left shadow-sm">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 leading-none">
              <Briefcase className="w-3 h-3 text-emerald-650" /> Selected Squad
            </label>
            <div className="relative mt-1">
              <select
                value={activeTeam?.id || activeTeam?._id || ""}
                onChange={(e) => handleTeamChange(e.target.value)}
                className="w-full bg-white text-slate-850 font-bold text-xs border border-slate-200 rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer appearance-none transition-all"
              >
                {managedTeams.map((t) => (
                  <option key={t.id || t._id} value={t.id || t._id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                <ArrowRight className="w-3.5 h-3.5 rotate-90" />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ⚠️ ZERO TEAMS ASSIGNED FALLBACK */}
      {managedTeams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center shadow-sm max-w-xl mx-auto flex flex-col items-center gap-6">
          <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-700">No Teams Assigned</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              You are currently logged in as a Manager, but no teams or departments are assigned to you in the registry.
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl max-w-md text-xs text-slate-500 leading-relaxed text-center">
            Please contact the HR team or Administrator to map you as the lead manager for your department's teams.
          </div>
        </div>
      ) : (
        <>
          {/* 📊 KPI CARDS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Total Headcount",
                val: stats.total,
                desc: `${stats.employees} Employees • ${stats.interns} Interns`,
                color: "from-teal-50/50 via-emerald-50/10 to-transparent",
                border: "border-teal-100 hover:border-teal-200/80 hover:shadow-teal-100/20",
                glow: "group-hover:bg-teal-500/5",
                text: "text-slate-450",
                numColor: "text-teal-650 font-black",
                iconBg: "bg-teal-50 text-teal-600 border-teal-100/80",
                icon: Users
              },
              {
                title: "Active Clock-ins Today",
                val: stats.active,
                desc: `${stats.present - stats.active} Clocked out today`,
                color: "from-indigo-50/50 via-blue-50/10 to-transparent",
                border: "border-indigo-100 hover:border-indigo-200/80 hover:shadow-indigo-100/20",
                glow: "group-hover:bg-indigo-500/5",
                text: "text-slate-450",
                numColor: "text-indigo-650 font-black",
                iconBg: "bg-indigo-50 text-indigo-600 border-indigo-100/80",
                icon: Clock
              },
              {
                title: "On Leave Today",
                val: stats.onLeave,
                desc: "Official absence periods",
                color: "from-purple-50/50 via-violet-50/10 to-transparent",
                border: "border-purple-100 hover:border-purple-200/80 hover:shadow-purple-100/20",
                glow: "group-hover:bg-purple-500/5",
                text: "text-slate-450",
                numColor: "text-purple-650 font-black",
                iconBg: "bg-purple-50 text-purple-600 border-purple-100/80",
                icon: CalendarDays
              },
              {
                title: "Present Today",
                val: stats.present,
                desc: `${stats.total - stats.present - stats.onLeave} Absent / Unaccounted`,
                color: "from-amber-50/50 via-orange-50/10 to-transparent",
                border: "border-amber-100 hover:border-amber-200/80 hover:shadow-amber-100/20",
                glow: "group-hover:bg-amber-500/5",
                text: "text-slate-450",
                numColor: "text-amber-650 font-black",
                iconBg: "bg-amber-50 text-amber-600 border-amber-100/80",
                icon: UserCheck
              }
            ].map((card, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -6, scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`relative group bg-white border ${card.border} rounded-2xl p-6 shadow-sm flex items-center justify-between overflow-hidden cursor-default transition-all`}
              >
                {/* Background soft glow card */}
                <div className={`absolute inset-0 bg-gradient-to-tr ${card.color} transition-all duration-300`} />
                <div className={`absolute inset-0 transition-all duration-300 blur-[30px] opacity-0 group-hover:opacity-100 ${card.glow}`} />
                
                <div className="space-y-2 relative z-10 text-left">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none block">{card.title}</span>
                  <span className={`text-4xl font-extrabold ${card.numColor} tracking-tighter leading-none block`}>{card.val}</span>
                  <span className="text-[10px] font-bold text-slate-450 uppercase leading-none block mt-1">{card.desc}</span>
                </div>
                <div className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center shrink-0 shadow-sm border relative z-10 transition-transform duration-300 group-hover:scale-110`}>
                  <card.icon className="w-5 h-5" />
                </div>
              </motion.div>
            ))}
          </div>

          {/* 👥 DIRECTORY TOOLBAR */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col text-left">
              <h2 className="text-sm font-bold text-slate-900 leading-tight">{activeTeam?.name} Directory</h2>
              <span className="text-[10px] text-slate-450 font-extrabold uppercase tracking-widest mt-1">
                {activeTeam?.departmentId?.name || "Operations"} Department
              </span>
            </div>

            <div className="flex items-center flex-wrap gap-4 w-full lg:w-auto">
              {/* Search Box */}
              <div className="relative flex-1 lg:w-72">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/50 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-semibold text-slate-800"
                />
              </div>

              {/* Segmented Sliders filter buttons */}
              <div className="flex bg-slate-100 p-1 border border-slate-200/60 rounded-xl shrink-0 select-none relative">
                {["All", "Employee", "Intern"].map((role) => {
                  const isActive = roleFilter === role;
                  return (
                    <button
                      key={role}
                      onClick={() => setRoleFilter(role)}
                      className="relative px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer z-10 border-0 bg-transparent"
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeRoleTab"
                          className="absolute inset-0 bg-white rounded-lg shadow-sm border border-slate-250/20 -z-10"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      <span className={isActive ? "text-emerald-700 font-extrabold" : "text-slate-500 font-bold"}>
                        {role}s
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 👥 MEMBER CARDS GRID */}
          {filteredMembers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center shadow-sm w-full flex flex-col items-center gap-6">
              <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-700">No Members Found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  No squad members matched the selected role filter or search query.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMembers.map((member) => (
                <motion.div
                  key={member.id || member._id}
                  whileHover={{ y: -4, scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4 hover:shadow-md hover:border-slate-350 transition-all flex flex-col justify-between group"
                >
                  {/* Top Profile / Meta Segment */}
                  <div className="flex justify-between items-start gap-4 text-left">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative">
                        {member.userPhoto ? (
                          <div className="w-12 h-12 rounded-xl overflow-hidden shadow-inner border border-white relative z-10 bg-slate-50">
                            <img src={member.userPhoto} alt={member.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-black shadow-inner border border-white relative z-10 ${
                            member.badgeColor || 'bg-slate-100 text-slate-655'
                          }`}>
                            {member.initials || member.name?.split(" ").map(n => n[0]).join("") || "E"}
                          </div>
                        )}
                        <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center shadow-sm z-20 ${
                          member.todayStatus === "Clocked In" ? "bg-emerald-500" :
                          member.todayStatus === "On Leave" ? "bg-purple-500" : "bg-slate-405"
                        }`}>
                          {member.todayStatus === "Clocked In" && <span className="absolute w-2 h-2 rounded-full bg-emerald-300 animate-ping" />}
                        </span>
                      </div>
                      
                      <div className="flex flex-col min-w-0 text-left">
                        <span className="font-extrabold text-slate-905 text-sm tracking-tight truncate max-w-[150px] group-hover:text-emerald-700 transition-colors">
                          {member.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold truncate leading-none mt-1" title={member.email}>
                          {member.email}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 items-end shrink-0">
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border select-none ${
                        member.role === 'Intern' 
                          ? 'bg-amber-50 text-amber-700 border-amber-100' 
                          : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                      }`}>
                        {member.role}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border leading-none mt-1 select-none ${
                        getStatusBadgeClass(member.todayStatus)
                      }`}>
                        {member.todayStatus}
                      </span>
                    </div>
                  </div>

                  {/* Detail Segment */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">Emergency Contact</span>
                      <span className="font-bold text-slate-700 tracking-tight leading-none text-right truncate max-w-[150px]">
                        {member.emergencyContactName || member.emergencyContactPhone ? (
                          `${member.emergencyContactName || "Self"} (${member.emergencyContactPhone || ""})`
                        ) : (
                          <span className="text-slate-350 italic font-semibold">Not Completed</span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs border-t border-slate-200/60 pt-3">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">Verification Status</span>
                      <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md leading-none border ${
                        member.verificationStatus === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-150' :
                        member.verificationStatus === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-150' :
                        'bg-rose-50 text-rose-700 border-rose-150'
                      }`}>
                        {member.verificationStatus || "Unverified"}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="grid grid-cols-3 gap-2.5 pt-1">
                    {[
                      { label: "Profile", key: "profile", icon: Users },
                      { label: "Attendance", key: "attendance", icon: Clock },
                      { label: "Leaves", key: "leaves", icon: CalendarDays }
                    ].map((btn) => (
                      <button
                        key={btn.key}
                        onClick={() => handleMemberActionClick(btn.key, member)}
                        className="bg-slate-50 hover:bg-slate-900 border border-slate-200 hover:border-slate-900 p-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider text-slate-500 hover:text-white cursor-pointer active:scale-95 transition-all text-center flex items-center justify-center gap-1 shadow-sm"
                      >
                        <btn.icon className="w-3 h-3 animate-none" />
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* 🔴 DRILL-DOWN DRAWERS / MODALS */}
      <AnimatePresence>
        {selectedMember && modalType && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-6 select-none overflow-y-auto">
            
            {/* Backdrop with elegant deep glass blurring */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSelectedMember(null);
                setModalType(null);
              }}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-xl"
            />

            {/* Dialog Drawer container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl p-6 md:p-10 shadow-2xl border border-slate-150 overflow-hidden flex flex-col justify-between gap-6 h-fit max-h-[90vh] z-10"
            >
              {/* Header card details */}
              <div className="flex justify-between items-start pb-5 border-b border-slate-100">
                <div className="flex items-center gap-4 text-left min-w-0">
                  {selectedMember.userPhoto ? (
                    <div className="w-12 h-12 rounded-xl overflow-hidden shadow-inner border border-slate-200 shrink-0 bg-slate-50">
                      <img src={selectedMember.userPhoto} alt={selectedMember.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-black shadow-inner shrink-0 ${selectedMember.badgeColor || 'bg-slate-100 text-slate-700'}`}>
                      {selectedMember.initials || selectedMember.name?.split(" ").map(n => n[0]).join("") || "E"}
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <h3 className="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight leading-none truncate">{selectedMember.name}</h3>
                    <span className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-wider leading-none mt-2 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5" />
                      {selectedMember.role} &bull; {activeTeam?.name} ({activeTeam?.departmentId?.name || "Operations"})
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedMember(null);
                    setModalType(null);
                  }}
                  className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-150 hover:bg-slate-100 text-slate-400 hover:text-slate-800 cursor-pointer active:scale-95 transition-all shrink-0"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Scrollable Modal Content */}
              <div className="flex-1 overflow-y-auto max-h-[55vh] pr-2 text-left space-y-4">
                {/* 1️⃣ PROFILE TYPE MODAL */}
                {modalType === "profile" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { label: "Personal Email", val: selectedMember.email, icon: Mail },
                        { label: "Phone Connection", val: selectedMember.phone || "Not Set", icon: Phone },
                        { label: "Emergency Contact", val: selectedMember.emergencyContactName || "Not Set", icon: UserCheck },
                        { label: "Emergency Phone", val: selectedMember.emergencyContactPhone || "Not Set", icon: Phone },
                        { label: "Aadhaar Card Number", val: selectedMember.aadhaarNumber || "Not Completed", icon: Shield },
                        { label: "Date of Birth", val: selectedMember.dob || "Not Filled", icon: Calendar },
                        { label: "Residential Address", val: selectedMember.address || "Not Set", icon: MapPin },
                      ].map((item, idx) => (
                        <div key={idx} className="bg-slate-50 hover:bg-slate-100/60 border border-slate-200/80 p-4 rounded-xl flex items-start gap-3 transition-colors duration-250">
                          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 text-slate-500 shadow-sm">
                            <item.icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex flex-col min-w-0 text-left">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none mb-1">{item.label}</span>
                            <span className="text-xs font-bold text-slate-800 leading-normal truncate" title={item.val}>{item.val}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Aadhaar Image verification audit block if available */}
                    {selectedMember.verificationStatus !== "Unsubmitted" && (
                      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-white space-y-4">
                        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                          <Shield className="w-4 h-4 text-indigo-400" />
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-300">Identity Evidence Audit</span>
                        </div>
                        {fetchingProfile ? (
                          <div className="aspect-[1.58] w-full rounded-xl bg-white/5 border border-slate-850 flex items-center justify-center min-h-[150px]">
                            <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-emerald-500 animate-spin" />
                          </div>
                        ) : selectedMember.aadhaarPhoto ? (
                          <div className="aspect-[1.58] w-full rounded-xl overflow-hidden bg-white/5 border border-slate-850 relative group">
                            <img
                              src={selectedMember.aadhaarPhoto}
                              alt="Aadhaar Verification"
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          </div>
                        ) : (
                          <div className="aspect-[1.58] w-full rounded-xl bg-white/5 border border-slate-850 flex items-center justify-center min-h-[150px] text-xs text-slate-400 font-bold">
                            No Aadhaar document uploaded.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 2️⃣ ATTENDANCE DETAILS LOG */}
                {modalType === "attendance" && (
                  <div className="space-y-6">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-650" />
                      Attendance Chronology Registry
                    </h4>

                    {selectedMemberAttendance.length === 0 ? (
                      <div className="py-16 text-center text-slate-450 italic text-xs font-medium bg-slate-50 rounded-2xl border border-slate-200/50">
                        No attendance connection logs resolved for this member.
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-1">
                        {selectedMemberAttendance.map((record) => (
                          <div
                            key={record._id || record.id}
                            className="bg-slate-50/50 hover:bg-slate-50 border border-slate-200 p-5 rounded-2xl flex flex-col sm:flex-row justify-between gap-4 transition-colors"
                          >
                            <div className="space-y-3.5 flex-1 min-w-0 text-left">
                              <div className="flex items-center gap-3">
                                <span className="font-extrabold text-slate-900 text-xs">{new Date(record.date).toLocaleDateString()}</span>
                                <span className={`px-2.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider border leading-none ${
                                  record.status === 'present' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                  record.status === 'late' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                  'bg-rose-50 text-rose-600 border-rose-100'
                                }`}>
                                  {record.status}
                                </span>
                              </div>

                              {/* Session timings list */}
                              <div className="flex flex-wrap gap-2">
                                {(record.sessions || []).map((session, si) => (
                                  <div key={si} className="bg-white border border-slate-200/60 rounded-xl p-2.5 flex flex-col gap-1 text-[9px] font-bold text-slate-500 shadow-sm min-w-[100px] text-left">
                                    <span className="leading-none text-[8px] font-extrabold uppercase text-slate-400">Stream {si + 1}</span>
                                    <span className="leading-none mt-1">In: {new Date(session.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    <span className="leading-none mt-0.5">Out: {session.checkOut ? new Date(session.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : <span className="text-emerald-500 font-extrabold">Active</span>}</span>
                                  </div>
                                ))}
                              </div>

                              {/* Location Geocoded details */}
                              <div className="flex flex-col gap-1 text-[9px] font-bold text-slate-400">
                                {record.sessions?.map((s, si) => (
                                  <div key={si} className="flex items-start gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                    <span className="truncate max-w-sm" title={s.checkInLocation?.address || s.checkOutLocation?.address}>
                                      Loc {si + 1}: {s.checkInLocation?.address || s.checkOutLocation?.address || "Virtual Check-In / Remote"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Verification webcam images if captured */}
                            <div className="flex gap-2 shrink-0 self-center">
                              {record.sessions?.map((s, si) => (
                                <div key={si} className="flex flex-col gap-1 items-center bg-white border border-slate-200 p-1.5 rounded-xl shadow-sm hover:scale-105 transition-transform duration-250">
                                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 relative shrink-0">
                                    <img
                                      src={s.checkInImage || "https://ui-avatars.com/api/?name=V&background=f1f5f9"}
                                      alt="Check-In verification"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <span className="text-[7.5px] font-black text-slate-400 uppercase leading-none mt-1">Sig {si + 1}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 3️⃣ LEAVES REGISTRY DETAILS */}
                {modalType === "leaves" && (
                  <div className="space-y-6">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-purple-650" />
                      Absence Request Logs
                    </h4>

                    {selectedMemberLeaves.length === 0 ? (
                      <div className="py-16 text-center text-slate-450 italic text-xs font-medium bg-slate-50 rounded-2xl border border-slate-200/50">
                        No absence break records resolved for this member.
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-1">
                        {selectedMemberLeaves.map((record) => (
                          <div
                            key={record._id || record.id}
                            className="bg-slate-50/50 border border-slate-200 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start gap-4 transition-colors"
                          >
                            <div className="space-y-2.5 flex-1 min-w-0 text-left">
                              <div className="flex items-center gap-2.5">
                                <span className="font-extrabold text-slate-900 text-xs">{record.leaveType || record.type}</span>
                                <span className="text-[9px] font-black bg-slate-150 text-slate-500 border border-slate-200 px-2 py-0.5 rounded leading-none uppercase">
                                  {record.daysCount} Day{record.daysCount > 1 ? "s" : ""}
                                </span>
                              </div>

                              <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider leading-none">
                                Scheduled Period: {record.dates || `${new Date(record.startDate).toLocaleDateString()} - ${new Date(record.endDate).toLocaleDateString()}`}
                              </p>

                              <div className="text-xs text-slate-650 leading-relaxed italic bg-white border border-slate-150 p-3 rounded-xl flex items-start gap-1">
                                <span className="text-slate-300 text-lg leading-none font-serif">&ldquo;</span>
                                <p className="flex-1">{record.reason}</p>
                                <span className="text-slate-300 text-lg leading-none font-serif">&rdquo;</span>
                              </div>
                            </div>

                            <div className="shrink-0 pt-0.5 flex flex-col items-end gap-2 self-center sm:self-start">
                              <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider border leading-none
                                ${record.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                record.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                {record.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom footer dismissal */}
              <div className="pt-5 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => {
                    setSelectedMember(null);
                    setModalType(null);
                  }}
                  className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider active:scale-95 transition-all cursor-pointer leading-none shadow-md"
                >
                  Dismiss Drawer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
