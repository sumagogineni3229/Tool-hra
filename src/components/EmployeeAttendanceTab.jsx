"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Clock,
    MapPin,
    Camera,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Calendar,
    Search,
    Zap,
    TrendingUp,
    CreditCard,
    AlertCircle,
    Download,
    History
} from "lucide-react";
import AttendanceWebcam from "@/app/employee/attendance/AttendanceWebcam";
import { apiClient } from "@/lib/apiClient";

const STATUS_CONFIG = {
    "present": { color: "bg-emerald-500", label: "Present", bg: "bg-emerald-50/70", border: "border-emerald-250", text: "text-emerald-800 font-bold" },
    "late": { color: "bg-blue-500", label: "Late", bg: "bg-blue-50/70", border: "border-blue-200", text: "text-blue-800 font-bold" },
    "absent": { color: "bg-rose-500", label: "Absent", bg: "bg-rose-50/70", border: "border-rose-200", text: "text-rose-800 font-bold" },
    "leave": { color: "bg-purple-500", label: "Leave", bg: "bg-purple-50/70", border: "border-purple-200", text: "text-purple-800 font-bold" },
    "holiday": { color: "bg-amber-400", label: "Holiday", bg: "bg-amber-50/70", border: "border-amber-250", text: "text-amber-850 font-bold" },
};

export default function EmployeeAttendanceTab({ user: propUser }) {
    const [user, setUser] = useState(propUser || null);
    const [attendance, setAttendance] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [todayAttendance, setTodayAttendance] = useState(null);
    const [isAttendanceLoading, setIsAttendanceLoading] = useState(false);
    const [attendanceStatus, setAttendanceStatus] = useState("");
    const [isWebcamOpen, setIsWebcamOpen] = useState(false);
    const [activeSubTab, setActiveSubTab] = useState("overview"); // "overview" or "detailed"
    const [searchQuery, setSearchQuery] = useState("");

    // Load session if not provided via props
    useEffect(() => {
        if (!propUser) {
            setUser(apiClient.getCurrentSession());
        }
    }, [propUser]);

    const fetchAttendance = useCallback(async () => {
        if (!user?.email) return;
        try {
            const res = await fetch(`/api/attendance?email=${encodeURIComponent(user.email)}&t=${Date.now()}`, { cache: 'no-store' });
            const data = await res.json();
            if (res.ok) setAttendance(data.attendance || []);
        } catch (err) { console.error(err); }
    }, [user?.email]);

    const fetchTodayAttendance = useCallback(async () => {
        if (!user?.email) return;
        try {
            const res = await fetch(`/api/attendance/today?email=${encodeURIComponent(user.email)}&t=${Date.now()}`, { cache: 'no-store' });
            const data = await res.json();
            if (res.ok) setTodayAttendance(data.attendance);
        } catch (err) { console.error(err); }
    }, [user?.email]);

    const fetchLeaves = useCallback(async () => {
        if (!user?.email) return;
        try {
            const res = await fetch(`/api/leave?email=${encodeURIComponent(user.email)}`);
            const data = await res.json();
            if (res.ok) setLeaves(data.leaves || []);
        } catch (err) { console.error(err); }
    }, [user?.email]);

    useEffect(() => {
        if (!user?.email) return;
        const fetchData = async () => {
            setLoading(true);
            await Promise.all([fetchAttendance(), fetchTodayAttendance(), fetchLeaves()]);
            setLoading(false);
        };
        fetchData();

        const interval = setInterval(() => {
            fetchTodayAttendance();
        }, 10000);
        return () => clearInterval(interval);
    }, [user?.email, fetchAttendance, fetchTodayAttendance, fetchLeaves]);

    const formatDuration = (ms) => {
        if (!ms) return "0h 0m";
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    // Advanced Stats Calculation
    const stats = useMemo(() => {
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();

        const monthAtt = attendance.filter(a => {
            const d = new Date(a.date);
            return d.getMonth() === month && d.getFullYear() === year;
        });

        const present = monthAtt.length;
        const totalDurationMs = monthAtt.reduce((acc, curr) => acc + (curr.totalDuration || 0), 0);

        let workingDaysSoFar = 0;
        const endDay = now.getDate();
        for (let d = 1; d <= endDay; d++) {
            const checkDate = new Date(year, month, d);
            if (checkDate.getDay() !== 0 && checkDate.getDay() !== 6) workingDaysSoFar++;
        }

        const attendancePercentage = Math.round((present / (workingDaysSoFar || 1)) * 100);
        const dailyGoalMs = 8 * 60 * 60 * 1000;
        const todayProgress = Math.min(100, Math.round(((todayAttendance?.totalDuration || 0) / dailyGoalMs) * 100));

        return {
            attendancePercentage,
            monthTotalHours: (totalDurationMs / (1000 * 60 * 60)).toFixed(1),
            workingDaysSoFar,
            todayProgress,
            present
        };
    }, [attendance, todayAttendance]);

    const calendarDays = useMemo(() => {
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        const totalDays = new Date(year, month + 1, 0).getDate();
        const startOffset = new Date(year, month, 1).getDay();
        const days = [];
        
        // Helper to format date as YYYY-MM-DD in local time
        const formatLocalYYYYMMDD = (d) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const dayNum = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${dayNum}`;
        };

        for (let i = 0; i < startOffset; i++) days.push(null);
        for (let i = 1; i <= totalDays; i++) {
            const date = new Date(year, month, i);
            const dateStr = formatLocalYYYYMMDD(date);
            let status = null;
            const att = attendance.find(a => formatLocalYYYYMMDD(new Date(a.date)) === dateStr);
            const leave = leaves.find(l => {
                const start = formatLocalYYYYMMDD(new Date(l.startDate));
                const end = formatLocalYYYYMMDD(new Date(l.endDate));
                return dateStr >= start && dateStr <= end && l.status === "approved";
            });
            if (leave) status = "leave";
            else if (att) status = att.status || "present";
            else if (date.getDay() === 0 || date.getDay() === 6) status = "holiday";
            else if (date < new Date().setHours(0, 0, 0, 0)) status = "absent";
            days.push({ day: i, status, record: att });
        }
        return days;
    }, [currentDate, attendance, leaves]);

    const submitAttendance = async (capturedImage) => {
        if (!user?.email) return;
        setIsAttendanceLoading(true);

        const performSubmit = async (lat = 0, lng = 0, resolvedAddress = null) => {
            try {
                const activeSession = todayAttendance?.sessions?.find(s => !s.checkOut);
                const res = await fetch("/api/attendance", {
                    method: !activeSession ? "POST" : "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: user.email,
                        location: { lat, lng, address: resolvedAddress },
                        image: capturedImage
                    }),
                });
                const data = await res.json();
                if (res.ok) {
                    setTodayAttendance(data.attendance);
                    fetchAttendance();
                    setAttendanceStatus(!activeSession ? "Clocked-in successfully" : "Clocked-out successfully");
                } else {
                    alert(data.message || "Attendance submission failed");
                }
            } catch (err) {
                console.error(err);
                alert("Server error submitting attendance");
            } finally {
                setIsAttendanceLoading(false);
                setTimeout(() => setAttendanceStatus(""), 3000);
            }
        };

        const fallbackToIPGeolocation = async () => {
            try {
                console.log("Attempting IP-based Geolocation fallback...");
                const ipRes = await fetch("https://ipapi.co/json/");
                if (ipRes.ok) {
                    const ipData = await ipRes.json();
                    if (ipData.latitude && ipData.longitude) {
                        const city = ipData.city || "";
                        const region = ipData.region || "";
                        const country = ipData.country_name || "";
                        const addressStr = city && region ? `${city}, ${region}, ${country}` : `${city}, ${country}`;
                        console.log("IP Geolocation success:", addressStr);
                        performSubmit(ipData.latitude, ipData.longitude, addressStr);
                        return;
                    }
                }
            } catch (err) {
                console.warn("IP Geolocation fallback failed:", err.message);
            }
            // Absolute fallback
            performSubmit(0, 0, "Virtual Check-In / Remote");
        };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    performSubmit(position.coords.latitude, position.coords.longitude);
                },
                (error) => {
                    console.warn("Browser GPS failed, falling back to IP Geolocation:", error.message);
                    fallbackToIPGeolocation();
                },
                { timeout: 6000, enableHighAccuracy: true }
            );
        } else {
            console.warn("Browser Geolocation unsupported, falling back to IP Geolocation");
            fallbackToIPGeolocation();
        }
    };

    if (!user || loading) return <div className="h-96 flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-slate-300" /></div>;

    return (
        <div className="space-y-12">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2 uppercase">Operational Command</h2>
                    <p className="text-slate-500 font-light text-lg italic tracking-wide">Protocol tracking for personnel <span className="text-slate-900 font-bold">{user?.name}</span>.</p>
                </div>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                    <button
                        type="button"
                        onClick={() => setActiveSubTab("overview")}
                        className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeSubTab === "overview" ? "bg-white text-slate-900 shadow-xl" : "text-slate-400 hover:text-slate-650"}`}
                    >
                        Registry Console
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveSubTab("detailed")}
                        className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeSubTab === "detailed" ? "bg-white text-slate-900 shadow-xl" : "text-slate-400 hover:text-slate-650"}`}
                    >
                        Historical Log
                    </button>
                </div>
            </header>

            <AnimatePresence mode="wait">
                {activeSubTab === "overview" ? (
                    <motion.div
                        key="split-view"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-10 text-left"
                    >
                        {/* LEFT SIDE: COMMAND & STATS */}
                        <div className="lg:col-span-5 space-y-10">
                            {/* Mission Console */}
                            <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-all">
                                    <Clock className="w-24 h-24 text-blue-400" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center border border-blue-500/20">
                                            <Zap className="w-6 h-6" />
                                        </div>
                                        <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${todayAttendance?.sessions?.find(s => !s.checkOut) ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-800 text-slate-500 border-slate-700"}`}>
                                            {todayAttendance?.sessions?.find(s => !s.checkOut) ? "Protocol Active" : "Operational Idle"}
                                        </div>
                                    </div>

                                    <div className="mb-10">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Live Log Duration</p>
                                        <h3 className="text-5xl font-black text-white tracking-tighter">
                                            {formatDuration(todayAttendance?.totalDuration || 0)}
                                        </h3>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setIsWebcamOpen(true)}
                                        disabled={isAttendanceLoading}
                                        className="w-full py-5 bg-white text-slate-900 rounded-[1.8rem] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-blue-400 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-4 disabled:opacity-50 cursor-pointer"
                                    >
                                        {isAttendanceLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                                        {todayAttendance?.sessions?.find(s => !s.checkOut) ? "Secure Out" : "Initiate Signal"}
                                    </button>
                                    {attendanceStatus && <p className="mt-4 text-center text-[9px] font-black text-blue-400 uppercase tracking-widest italic">{attendanceStatus}</p>}
                                </div>
                            </div>

                            {/* High Density Stats */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-xl shadow-slate-200/30 flex flex-col items-center">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-6">Attendance Integrity</p>
                                    <div className="relative w-28 h-28 flex items-center justify-center">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="56" cy="56" r="50" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-50" />
                                            <circle cx="56" cy="56" r="50" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="314.159" strokeDashoffset={314.159 - (314.159 * stats.attendancePercentage) / 100} strokeLinecap="round" className="text-blue-600 transition-all duration-1000" />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-2xl font-black text-slate-900 leading-none">{stats.attendancePercentage}%</span>
                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Verified</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-xl shadow-slate-200/30">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Monthly Accrual</p>
                                    <div className="space-y-4">
                                        <div>
                                            <h5 className="text-3xl font-black text-slate-900 tracking-tighter">{stats.monthTotalHours}h</h5>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest italic">Total Payload Hours</p>
                                        </div>
                                        <div className="pt-4 border-t border-slate-50">
                                            <h5 className="text-xl font-black text-slate-900 tracking-tight">{stats.present} / {stats.workingDaysSoFar}</h5>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest italic">Valid Connections</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="sm:col-span-2 p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-xl shadow-slate-200/30">
                                    <div className="flex justify-between items-center mb-6">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Daily Protocol Alignment</p>
                                            <h5 className="text-xl font-black text-slate-900 tracking-tight italic">8h Standard Shift</h5>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-blue-600">{stats.todayProgress}%</p>
                                        </div>
                                    </div>
                                    <div className="w-full bg-slate-50 h-3 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${stats.todayProgress}%` }}
                                            className="h-full bg-slate-900 rounded-full"
                                        />
                                    </div>
                                    <div className="flex justify-between items-center mt-3 px-1">
                                        <span className="text-[8px] font-bold text-slate-300 uppercase italic">Initialization</span>
                                        <span className="text-[8px] font-bold text-slate-300 uppercase italic">Quota Reached</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* MONTHLY REGISTRY */}
                        <div className="lg:col-span-7 bg-white/80 backdrop-blur-2xl p-10 rounded-[4rem] border border-white shadow-xl shadow-slate-200/30 h-fit">
                            <div className="flex justify-between items-center mb-10">
                                <div className="flex items-center gap-6">
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">Personnel Registry</h3>
                                    <div className="flex bg-slate-100 p-1 rounded-xl">
                                        <button type="button" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} className="p-2 hover:bg-white rounded-lg transition-all cursor-pointer"><ChevronLeft className="w-4 h-4 text-slate-500" /></button>
                                        <button type="button" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} className="p-2 hover:bg-white rounded-lg transition-all cursor-pointer"><ChevronRight className="w-4 h-4 text-slate-500" /></button>
                                    </div>
                                </div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </p>
                            </div>

                            <div className="grid grid-cols-7 gap-4">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                    <div key={d} className="text-center text-[9px] font-black text-slate-300 uppercase tracking-widest py-2 italic">{d}</div>
                                ))}
                                {calendarDays.map((day, idx) => (
                                    <div key={idx} className="aspect-square relative flex items-center justify-center">
                                        {day ? (
                                            <div className={`w-full h-full rounded-2xl border flex flex-col items-center justify-center transition-all relative hover:scale-105 duration-200
                                                ${day.status 
                                                    ? `${STATUS_CONFIG[day.status].bg} ${STATUS_CONFIG[day.status].border}` 
                                                    : "bg-white border-slate-50 text-slate-300"
                                                }
                                            `}>
                                                <span className={`text-sm font-black ${
                                                    day.status 
                                                        ? STATUS_CONFIG[day.status].text 
                                                        : "text-slate-350"
                                                }`}>{day.day}</span>
                                                {day.status && (
                                                    <div className={`absolute bottom-2.5 w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[day.status].color}`} />
                                                )}
                                            </div>
                                        ) : (
                                            <div className="w-full h-full" />
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="mt-10 flex flex-wrap gap-4 pt-8 border-t border-slate-100">
                                {Object.values(STATUS_CONFIG).map(s => (
                                    <div key={s.label} className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${s.color}`} />
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">{s.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="detailed"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/80 backdrop-blur-2xl p-10 rounded-[4rem] border border-white shadow-xl shadow-slate-200/30 text-left"
                    >
                        <div className="flex justify-between items-center mb-10">
                            <div className="flex-1 max-w-md relative">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search mission parameters..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                                />
                            </div>
                            <button type="button" className="flex items-center gap-2 px-6 py-4 bg-slate-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 cursor-pointer">
                                <Download className="w-4 h-4" /> Export Matrix
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full border-separate border-spacing-y-4">
                                <thead>
                                    <tr className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-left">
                                        <th className="px-8 py-2">Mission Chronology</th>
                                        <th className="px-8 py-2">Integrity Status</th>
                                        <th className="px-8 py-2">Signal Streams</th>
                                        <th className="px-8 py-2 text-right">Payload Density</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendance
                                        .filter(a =>
                                            new Date(a.date).toLocaleDateString().includes(searchQuery) ||
                                            (a.status || "present").includes(searchQuery.toLowerCase())
                                        )
                                        .map((record) => (
                                            <tr key={record._id} className="group hover:bg-slate-50/50 transition-all">
                                                <td className="px-8 py-8 rounded-l-[2rem] bg-slate-50/30 border-y border-l border-slate-50 font-black text-slate-900">{new Date(record.date).toLocaleDateString()}</td>
                                                <td className="px-8 py-8 bg-slate-50/30 border-y border-slate-50">
                                                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${STATUS_CONFIG[record.status || "present"].color} text-white`}>
                                                        {STATUS_CONFIG[record.status || "present"].label}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-8 bg-slate-50/30 border-y border-slate-50">
                                                    <div className="flex flex-wrap gap-2">
                                                        {record.sessions.map((s, si) => (
                                                            <div key={si} className="px-3 py-1 bg-white border border-slate-100 rounded-lg text-[9px] font-bold text-slate-400">
                                                                {new Date(s.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {s.checkOut ? new Date(s.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Active"}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-8 rounded-r-[2rem] bg-slate-50/30 border-y border-r border-slate-50 font-black text-slate-900 text-right">{formatDuration(record.totalDuration)}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {isWebcamOpen && (
                <AttendanceWebcam
                    onClose={() => setIsWebcamOpen(false)}
                    onCapture={submitAttendance}
                />
            )}
        </div>
    );
}
