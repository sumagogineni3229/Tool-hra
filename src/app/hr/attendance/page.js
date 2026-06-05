"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ShieldCheck,
    Users,
    Search,
    Calendar,
    Download,
    Filter,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    Clock,
    ChevronRight,
    MapPin,
    Eye,
    BarChart3,
    Loader2,
    UserCheck,
    UserMinus,
    AlertTriangle,
    X,
    Trash2,
    ArrowUpRight,
    ArrowDownRight,
    CalendarDays,
    Settings2,
    Briefcase,
    Activity,
    Info
} from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";

const STATUS_THEMES = {
    "present": {
        bg: "bg-emerald-50/50",
        text: "text-emerald-700",
        border: "border-emerald-100",
        dot: "bg-emerald-500",
        glow: "shadow-emerald-100"
    },
    "late": {
        bg: "bg-amber-50/50",
        text: "text-amber-700",
        border: "border-amber-100",
        dot: "bg-amber-500",
        glow: "shadow-amber-100"
    },
    "absent": {
        bg: "bg-rose-50/50",
        text: "text-rose-700",
        border: "border-rose-100",
        dot: "bg-rose-500",
        glow: "shadow-rose-100"
    },
};

export default function HRAttendance() {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [totalUsers, setTotalUsers] = useState(0);

    const fetchRecords = async () => {
        try {
            const [attRes, userRes] = await Promise.all([
                fetch(`/api/attendance?t=${Date.now()}`, { cache: 'no-store' }),
                fetch(`/api/users?t=${Date.now()}`, { cache: 'no-store' })
            ]);

            const attData = await attRes.json();
            const userData = await userRes.json();

            if (attRes.ok) setRecords(attData.attendance || []);
            if (userRes.ok) {
                // Support both format arrays directly or nested in .users
                const usersList = Array.isArray(userData) ? userData : (userData.users || []);
                const eligibleUsers = usersList.filter(u =>
                    u.status !== "Suspended" &&
                    (u.role?.toLowerCase() === "employee" || u.role?.toLowerCase() === "manager" || u.role?.toLowerCase() === "intern")
                ) || [];
                setTotalUsers(eligibleUsers.length);
            }
        } catch (err) {
            console.error("Failed to fetch dashboard data", err);
        } finally {
            setLoading(false);
        }
    };

    const deleteAttendance = async (id) => {
        if (!window.confirm("Are you sure you want to delete this record? This action cannot be undone.")) return;

        try {
            const res = await fetch(`/api/attendance?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                setRecords(prev => prev.filter(r => r._id !== id));
            } else {
                const data = await res.json();
                alert(data.message || "Failed to delete record");
            }
        } catch (err) {
            console.error("Delete Error:", err);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    const filteredRecords = useMemo(() => {
        const query = (searchQuery || "").toLowerCase();
        return records.filter(r => {
            const name = (r.userId?.name || "").toLowerCase();
            const empId = (r.userId?.employeeId || "").toLowerCase();
            const matchesSearch = name.includes(query) || empId.includes(query);
            const matchesStatus = selectedStatus === "all" || r.status?.toLowerCase() === selectedStatus.toLowerCase();
            const matchesDate = !selectedDate || (r.date && r.date.startsWith(selectedDate));
            return matchesSearch && matchesStatus && matchesDate;
        });
    }, [records, searchQuery, selectedStatus, selectedDate]);

    const analytics = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];

        const onPremises = records.filter(r => {
            const lastSession = r.sessions?.[r.sessions.length - 1];
            return lastSession && !lastSession.checkOut;
        }).length;

        const late = filteredRecords.filter(r => r.status?.toLowerCase() === "late").length;

        const todayRecords = records.filter(r => {
            return r.date === todayStr;
        });
        const absent = Math.max(0, totalUsers - todayRecords.length);

        const critical = filteredRecords.filter(r => {
            const lastSession = r.sessions?.[r.sessions.length - 1];
            if (lastSession && !lastSession.checkOut) {
                const duration = Date.now() - new Date(lastSession.checkIn).getTime();
                return duration > 10 * 60 * 60 * 1000;
            }
            return false;
        }).length;

        const trends = {};
        records.slice(0, 30).forEach(r => {
            const d = new Date(r.date).toLocaleDateString('en-US', { weekday: 'short' });
            trends[d] = (trends[d] || 0) + 1;
        });

        const trendData = Object.keys(trends).map(name => ({ name, count: trends[name] }));

        return { onPremises, late, absent, critical, trendData };
    }, [records, filteredRecords, totalUsers]);

    const exportToCSV = () => {
        const headers = ["Employee Name", "ID", "Date", "Check-in", "Check-out", "Duration", "Status"];
        const rows = (filteredRecords || []).map(r => {
            const sessions = r.sessions || [];
            const checkInTime = sessions.length > 0 && sessions[0]?.checkIn
                ? new Date(sessions[0].checkIn).toLocaleTimeString()
                : "-";
            const checkOutTime = sessions.length > 0 && sessions[sessions.length - 1]?.checkOut
                ? new Date(sessions[sessions.length - 1].checkOut).toLocaleTimeString()
                : "-";
            const duration = typeof r.totalDuration === 'number'
                ? (r.totalDuration / (1000 * 60 * 60)).toFixed(2) + "h"
                : "-";
            const dateStr = r.date ? new Date(r.date).toLocaleDateString() : "-";
            
            return [
                r.userId?.name || "-",
                r.userId?.employeeId || "-",
                dateStr,
                checkInTime,
                checkOutTime,
                duration,
                r.status || "-"
            ];
        });

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Attendance_Report_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
                    <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin" />
                </div>
                <p className="text-sm font-medium text-slate-500 animate-pulse">Synchronizing Intelligence...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-20">
            {/* --- PREMIUM HEADER --- */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-left">
                <div>
                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-[0.2em] mb-2">
                        <Activity className="w-3 h-3" />
                        Live Operations
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Attendance Analytics</h1>
                    <p className="text-slate-500 text-sm mt-1">Monitor organizational presence and session integrity in real-time.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={exportToCSV}
                        className="h-11 px-5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm active:scale-95 cursor-pointer"
                    >
                        <Download className="w-4 h-4" />
                        Download Report
                    </button>
                </div>
            </header>

            {/* --- ANALYTICS CARDS --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
                {[
                    { label: "Active Presence", val: analytics.onPremises, total: totalUsers, icon: UserCheck, color: "indigo", desc: "Currently on-site" },
                    { label: "Punctuality Alert", val: analytics.late, total: filteredRecords.length, icon: Clock, color: "amber", desc: "Late arrivals today" },
                    { label: "Estimated Absent", val: analytics.absent, total: totalUsers, icon: UserMinus, color: "rose", desc: "Awaiting check-in" },
                    { label: "Extended Shift", val: analytics.critical, total: filteredRecords.length, icon: AlertTriangle, color: "orange", desc: "Over 10h sessions" },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="group relative bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden hover:border-indigo-100 transition-all"
                    >
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 rounded-[0.8rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-900 group-hover:bg-white group-hover:shadow-md transition-all">
                                    <stat.icon className="w-5 h-5" />
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
                                </div>
                            </div>

                            <div className="flex items-end gap-2 mb-2">
                                <h3 className="text-3xl font-black text-slate-900 leading-none">{stat.val}</h3>
                                <span className="text-xs font-bold text-slate-400 pb-0.5">/ {stat.total}</span>
                            </div>

                            <p className="text-[10px] text-slate-400 font-medium italic">{stat.desc}</p>

                            <div className="mt-4 h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(stat.val / (stat.total || 1)) * 100}%` }}
                                    className="h-full bg-indigo-600 rounded-full"
                                />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
                {/* --- MAIN LOGS TABLE --- */}
                <div className="lg:col-span-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50/20">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg"><Briefcase className="w-5 h-5" /></div>
                            <div>
                                <h2 className="text-lg font-black text-slate-900 leading-tight">Attendance Registry</h2>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{selectedDate || "Real-time Stream"}</p>
                            </div>
                        </div>

                        {/* Roster search input */}
                        <div className="relative w-56 sm:w-64">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                                <Search className="w-3.5 h-3.5" />
                            </span>
                            <input
                                type="text"
                                placeholder="Search staff or ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-white placeholder-slate-400 focus:outline-none focus:border-slate-350 transition-colors text-slate-800"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto min-h-[500px]">
                        {filteredRecords.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-96 text-center px-10">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-4">
                                    <Info className="w-8 h-8" />
                                </div>
                                <h4 className="text-lg font-bold text-slate-400">Zero matches found</h4>
                                <p className="text-sm text-slate-400 mt-1 italic">No telemetry data matches your current filter parameters.</p>
                                <button
                                    type="button"
                                    onClick={() => { setSelectedDate(""); setSelectedStatus("all"); setSearchQuery(""); }}
                                    className="mt-6 text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                                >
                                    Reset all selection parameters
                                </button>
                            </div>
                        ) : (
                            <table className="w-full border-separate border-spacing-0">
                                <thead>
                                    <tr className="bg-slate-50/30 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 text-left">
                                        <th className="px-8 py-5 border-b border-slate-50">Personnel Information</th>
                                        <th className="px-8 py-5 border-b border-slate-50">Entry Vector</th>
                                        <th className="px-8 py-5 border-b border-slate-50">Exit Vector</th>
                                        <th className="px-8 py-5 border-b border-slate-50">Classification</th>
                                        <th className="px-8 py-5 border-b border-slate-50 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRecords.map((r) => (
                                        <tr key={r._id} className="group hover:bg-slate-50/50 transition-all">
                                            <td className="px-8 py-6 border-b border-slate-50">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-[0.8rem] bg-white border border-slate-100 shadow-sm flex items-center justify-center text-sm font-black text-indigo-600 group-hover:scale-110 transition-transform">
                                                        {r.userId?.name?.charAt(0) || "U"}
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{r.userId?.employeeId || "AGENT-ID"}</p>
                                                        <p className="text-sm font-black text-slate-900 leading-none">{r.userId?.name || "Unknown Identity"}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 border-b border-slate-50">
                                                {r.sessions?.[0] ? (
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative flex-shrink-0">
                                                            <img
                                                                src={r.sessions[0].checkInImage || "https://ui-avatars.com/api/?name=V&background=f1f5f9"}
                                                                className="w-10 h-10 rounded-lg object-cover border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform"
                                                                alt="Entry"
                                                                onClick={() => setSelectedRecord(r)}
                                                            />
                                                        </div>
                                                         <div className="leading-tight">
                                                             <p className="text-xs font-bold text-slate-900">{new Date(r.sessions[0].checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                             <span className="block text-[8px] text-indigo-500 font-extrabold truncate max-w-[150px] mt-0.5" title={r.sessions[0].checkInLocation?.address || "Live location"}>
                                                                 📍 {r.sessions[0].checkInLocation?.address || "Live Location"}
                                                             </span>
                                                         </div>
                                                    </div>
                                                ) : <span className="text-[10px] font-medium text-slate-300 italic">No entry vector</span>}
                                            </td>
                                            <td className="px-8 py-6 border-b border-slate-50">
                                                {r.sessions?.[r.sessions.length - 1]?.checkOut ? (
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative flex-shrink-0">
                                                            <img
                                                                src={r.sessions[r.sessions.length - 1].checkOutImage || "https://ui-avatars.com/api/?name=E&background=f1f5f9"}
                                                                className="w-10 h-10 rounded-lg object-cover border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform"
                                                                alt="Exit"
                                                                onClick={() => setSelectedRecord(r)}
                                                            />
                                                        </div>
                                                         <div className="leading-tight">
                                                             <p className="text-xs font-bold text-slate-900">{new Date(r.sessions[r.sessions.length - 1].checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                             <span className="block text-[8px] text-rose-500 font-extrabold truncate max-w-[150px] mt-0.5" title={r.sessions[r.sessions.length - 1].checkOutLocation?.address || "Live location"}>
                                                                 📍 {r.sessions[r.sessions.length - 1].checkOutLocation?.address || "Live Location"}
                                                             </span>
                                                         </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-glow shadow-emerald-200" />
                                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest italic">Live Session</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-8 py-6 border-b border-slate-50">
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${STATUS_THEMES[r.status?.toLowerCase() || "present"]?.bg || STATUS_THEMES.present.bg} ${STATUS_THEMES[r.status?.toLowerCase() || "present"]?.border || STATUS_THEMES.present.border}`}>
                                                    <div className={`w-1 h-1 rounded-full ${STATUS_THEMES[r.status?.toLowerCase() || "present"]?.dot || STATUS_THEMES.present.dot}`} />
                                                    <span className={`text-[9px] font-black uppercase tracking-widest ${STATUS_THEMES[r.status?.toLowerCase() || "present"]?.text || STATUS_THEMES.present.text}`}>
                                                        {r.status || "present"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 border-b border-slate-50 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteAttendance(r._id)}
                                                        className="w-9 h-9 border border-slate-100 bg-white text-rose-500 rounded-lg flex items-center justify-center hover:bg-rose-50 hover:border-rose-100 transition-all active:scale-90 cursor-pointer"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedRecord(r)}
                                                        className="h-9 px-4 bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 cursor-pointer"
                                                    >
                                                        Review Session
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* --- RIGHT COLUMN: CONTROLS & INSIGHTS --- */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Filter Card */}
                    <div className="bg-white rounded-xl p-2 text-slate-900 border border-slate-100 flex items-center gap-2">
                        <div className="flex-shrink-0">
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="h-8 bg-slate-50 border border-slate-100 rounded-lg px-2 text-[9px] font-bold text-slate-900 focus:outline-none appearance-none w-[100px]"
                            />
                        </div>
                        <div className="w-[1px] h-4 bg-slate-100 mx-1" />
                        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 custom-scrollbar">
                            {[
                                { id: "all", label: "All", icon: Activity },
                                { id: "present", label: "Prs", icon: UserCheck },
                                { id: "late", label: "Lat", icon: Clock },
                                { id: "absent", label: "Abs", icon: UserMinus }
                            ].map(s => (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => setSelectedStatus(s.id)}
                                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter transition-all border whitespace-nowrap cursor-pointer
                                        ${selectedStatus === s.id 
                                            ? "bg-slate-900 text-white border-slate-900" 
                                            : "bg-white text-slate-400 border-slate-100 hover:border-slate-300"}`}
                                >
                                    <s.icon className="w-2.5 h-2.5" />
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Chart Card */}
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-2xl shadow-slate-200/40">
                        <div className="flex items-center justify-between mb-8">
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Presence Velocity</h4>
                            <CalendarDays className="w-4 h-4 text-slate-300" />
                        </div>

                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={analytics.trendData}>
                                    <defs>
                                        <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 800, fill: '#94a3b8' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 800, fill: '#94a3b8' }} dx={-10} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }}
                                        cursor={{ stroke: '#4f46e5', strokeWidth: 1 }}
                                    />
                                    <Area type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorTrend)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="mt-8 p-4 bg-slate-50 rounded-2xl flex items-start gap-3">
                            <Info className="w-4 h-4 text-indigo-600 mt-0.5 animate-pulse" />
                            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">Trends indicate an 8% increase in overall organizational presence this week compared to last. Optimal density reached on Wednesday.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- FOCUS VIEW MODAL --- */}
            <AnimatePresence>
                {selectedRecord && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedRecord(null)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-white"
                        >
                            {/* Modal Header */}
                            <div className="p-8 border-b border-slate-50 flex justify-between items-start bg-slate-50/10">
                                <div className="flex gap-6">
                                    <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-white text-2xl font-black shadow-xl">
                                        {selectedRecord.userId?.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{selectedRecord.userId?.employeeId}</p>
                                        <h4 className="text-2xl font-black text-slate-900 tracking-tight">{selectedRecord.userId?.name}</h4>
                                        <div className="flex items-center gap-3 mt-2">
                                            <div className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${STATUS_THEMES[selectedRecord.status?.toLowerCase() || "present"]?.bg || STATUS_THEMES.present.bg} ${STATUS_THEMES[selectedRecord.status?.toLowerCase() || "present"]?.border || STATUS_THEMES.present.border} ${STATUS_THEMES[selectedRecord.status?.toLowerCase() || "present"]?.text || STATUS_THEMES.present.text}`}>
                                                {selectedRecord.status}
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 italic">Position: {selectedRecord.userId?.position}</span>
                                        </div>
                                    </div>
                                </div>
                                <button type="button" onClick={() => setSelectedRecord(null)} className="w-11 h-11 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 hover:rotate-90 transition-all shadow-sm cursor-pointer">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {selectedRecord.sessions.map((session, i) => (
                                        <div key={i} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col gap-6">
                                            <div className="flex justify-between items-center border-b border-white pb-4">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Intelligence Stream 0{i + 1}</span>
                                                <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-glow" />
                                            </div>

                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-3">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Primary Vector</label>
                                                    <div className="relative group">
                                                        <img src={session.checkInImage} className="w-full h-32 object-cover rounded-2xl shadow-lg border border-white" alt="Entry" />
                                                        <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-slate-900 leading-none">{new Date(session.checkIn).toLocaleTimeString()}</p>
                                                        <p className="text-[8px] font-bold text-indigo-500 mt-1 uppercase tracking-tight">Check-In Node</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Successor Vector</label>
                                                    {session.checkOut ? (
                                                        <>
                                                            <div className="relative group">
                                                                <img src={session.checkOutImage} className="w-full h-32 object-cover rounded-2xl shadow-lg border border-white" alt="Exit" />
                                                                <div className="absolute inset-0 bg-rose-600/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-black text-slate-900 leading-none">{new Date(session.checkOut).toLocaleTimeString()}</p>
                                                                <p className="text-[8px] font-bold text-rose-500 mt-1 uppercase tracking-tight">Check-Out Node</p>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="w-full h-32 bg-white/50 border border-white rounded-2xl flex flex-col items-center justify-center text-center p-4">
                                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mb-2 shadow-glow shadow-emerald-200" />
                                                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest italic">Signal Broad-casting...</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {(session.checkInLocation || session.checkOutLocation) && (
                                                <div className="pt-4 border-t border-white grid grid-cols-2 gap-4">
                                                     {session.checkInLocation && (
                                                         <a
                                                             href={`https://www.google.com/maps?q=${session.checkInLocation.lat},${session.checkInLocation.lng}`}
                                                             target="_blank"
                                                             className="flex items-center gap-2 p-2 bg-white rounded-xl border border-white shadow-sm hover:border-indigo-100 transition-all cursor-pointer min-w-0"
                                                         >
                                                             <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                                                 <MapPin className="w-3 h-3" />
                                                             </div>
                                                             <div className="flex flex-col text-left min-w-0">
                                                                 <span className="text-[8px] font-black text-indigo-600 uppercase tracking-wide">Entry Address</span>
                                                                 <span className="text-[9px] font-bold text-slate-500 truncate max-w-[140px]" title={session.checkInLocation.address || "View Map"}>
                                                                     {session.checkInLocation.address || "Entry Location"}
                                                                 </span>
                                                             </div>
                                                         </a>
                                                     )}
                                                     {session.checkOutLocation && (
                                                         <a
                                                             href={`https://www.google.com/maps?q=${session.checkOutLocation.lat},${session.checkOutLocation.lng}`}
                                                             target="_blank"
                                                             className="flex items-center gap-2 p-2 bg-white rounded-xl border border-white shadow-sm hover:border-indigo-100 transition-all cursor-pointer min-w-0"
                                                         >
                                                             <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
                                                                 <MapPin className="w-3 h-3" />
                                                             </div>
                                                             <div className="flex flex-col text-left min-w-0">
                                                                 <span className="text-[8px] font-black text-rose-600 uppercase tracking-wide">Exit Address</span>
                                                                 <span className="text-[9px] font-bold text-slate-500 truncate max-w-[140px]" title={session.checkOutLocation.address || "View Map"}>
                                                                     {session.checkOutLocation.address || "Exit Location"}
                                                                 </span>
                                                             </div>
                                                         </a>
                                                     )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
