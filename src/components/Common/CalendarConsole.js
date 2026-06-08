"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  X,
  Trash2,
  Filter,
  AlertCircle,
  Bell,
  MoreVertical,
  Layers,
  LayoutGrid,
  Search,
  CheckCircle2
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";

export default function CalendarConsole() {
  const [userRole, setUserRole] = useState("employee");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [miniDate, setMiniDate] = useState(new Date()); // For mini-calendar navigation
  const [view, setView] = useState("month"); // month, week
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    type: "event",
    description: "",
    startTime: "",
    endTime: ""
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    // Dynamic Role Fetch from secure session portal
    const session = apiClient.getCurrentSession();
    if (session) {
      setUserRole(session.role.toLowerCase());
    }
    fetchEvents();
  }, []);

  const isAdmin = userRole === "admin" || userRole === "hr" || userRole === "manager";

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/calendar");
      const data = await res.json();
      if (res.ok) {
        setEvents(data.events || []);
        if (typeof window !== "undefined") {
          localStorage.setItem("hra_calendar_events_combined_cache", JSON.stringify(data.events || []));
        }
      } else {
        fallbackToLocal();
      }
    } catch (err) {
      console.error("Failed to fetch events from database:", err);
      fallbackToLocal();
    } finally {
      setLoading(false);
    }
  };

  const fallbackToLocal = () => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("hra_calendar_events_combined_cache");
      if (cached) {
        setEvents(JSON.parse(cached));
      } else {
        // Fallback to separate local storages
        const localEvents = JSON.parse(localStorage.getItem("hra_calendar_events") || "[]");
        const localHolidays = JSON.parse(localStorage.getItem("hra_holidays") || "[]");
        const mappedHolidays = localHolidays.map(h => ({
          _id: h.id || h._id,
          title: h.name,
          date: h.date,
          type: 'holiday',
          description: `${h.type} (${h.scope})`,
          startTime: '',
          endTime: '',
          isReadOnly: true
        }));
        setEvents([...localEvents, ...mappedHolidays]);
      }
    }
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    const method = editingEvent ? "PATCH" : "POST";
    const body = editingEvent ? { id: editingEvent._id, ...formData } : formData;

    try {
      const res = await fetch("/api/calendar", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setEditingEvent(null);
        setFormData({ title: "", date: "", type: "event", description: "", startTime: "", endTime: "" });
        fetchEvents();
      } else {
        const data = await res.json();
        alert(data.message || "Operation failed");
      }
    } catch (err) {
      alert("Operation failed");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    try {
      const res = await fetch(`/api/calendar?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setIsModalOpen(false);
        setEditingEvent(null);
        fetchEvents();
      }
    } catch (err) {
      alert("Delete failed");
    }
  };

  // Shared Logic
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

  // Navigation
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const prevMiniMonth = () => setMiniDate(new Date(miniDate.getFullYear(), miniDate.getMonth() - 1, 1));
  const nextMiniMonth = () => setMiniDate(new Date(miniDate.getFullYear(), miniDate.getMonth() + 1, 1));

  const filteredEvents = useMemo(() => {
    return events.filter(e => filterType === "all" || e.type === filterType);
  }, [events, filterType]);

  const getEventsForDay = (day, month, year) => {
    const d = new Date(year, month, day);
    d.setHours(0, 0, 0, 0);
    return filteredEvents.filter(e => {
      const eDate = new Date(e.date);
      eDate.setHours(0, 0, 0, 0);
      return eDate.getTime() === d.getTime();
    });
  };

  const typeColorClasses = {
    holiday: "bg-emerald-500",
    event: "bg-blue-600",
    deadline: "bg-rose-500"
  };

  const upcomingEvents = useMemo(() => {
    return [...events]
      .filter(e => new Date(e.date) >= new Date().setHours(0, 0, 0, 0))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 4);
  }, [events]);

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-stretch h-auto lg:h-full bg-slate-50 p-4 lg:p-8 rounded-[2rem] lg:rounded-[3rem] overflow-y-auto lg:overflow-hidden border border-slate-100 shadow-2xl shadow-slate-200/50 text-left">

      {/* SIDEBAR - LEFT PANEL */}
      <aside className="w-full lg:w-80 flex flex-col gap-10 shrink-0">

        {/* Date Selection Card */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col gap-8">
          <header className="flex justify-between items-center px-2">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">{monthNames[miniDate.getMonth()]} {miniDate.getFullYear()}</h3>
            <div className="flex gap-2">
              <button onClick={prevMiniMonth} className="p-2 hover:bg-slate-50 rounded-xl transition-all text-slate-400 hover:text-slate-900 active:scale-90 cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={nextMiniMonth} className="p-2 hover:bg-slate-50 rounded-xl transition-all text-slate-400 hover:text-slate-900 active:scale-90 cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </header>

          {/* Mini Grid */}
          <div className="grid grid-cols-7 gap-y-2 text-center text-[10px] font-black uppercase tracking-widest text-slate-300">
            {days.map(d => <div key={d}>{d[0]}</div>)}
            {[...Array(getFirstDayOfMonth(miniDate.getMonth(), miniDate.getFullYear()))].map((_, i) => (
              <div key={`mini-empty-${i}`} />
            ))}
            {[...Array(getDaysInMonth(miniDate.getMonth(), miniDate.getFullYear()))].map((_, i) => {
              const day = i + 1;
              const isSelected = day === currentDate.getDate() && miniDate.getMonth() === currentDate.getMonth() && miniDate.getFullYear() === currentDate.getFullYear();
              return (
                <button
                  key={day}
                  onClick={() => setCurrentDate(new Date(miniDate.getFullYear(), miniDate.getMonth(), day))}
                  className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all active:scale-90 text-[11px] font-bold cursor-pointer
                      ${isSelected ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Categories */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2 px-2">
            <Filter className="w-3 h-3" /> Filters
          </p>
          <div className="flex flex-wrap gap-2">
            {["all", "event", "holiday", "deadline"].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer
                   ${filterType === type ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Impending Missions List */}
        <div className="flex-1 overflow-hidden flex flex-col gap-6">
          <header className="flex justify-between items-end px-2">
            <h4 className="text-xl font-black text-slate-900 tracking-tight leading-none">Agenda</h4>
            <button className="text-[9px] font-black uppercase tracking-widest text-blue-600 hover:underline cursor-pointer">View All</button>
          </header>

          <div className="space-y-4 overflow-y-auto no-scrollbar pb-10">
            {upcomingEvents.length === 0 ? (
              <div className="py-10 text-center text-slate-400 italic text-xs">No pending directives</div>
            ) : upcomingEvents.map((event, i) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                key={event._id}
                className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-50 group hover:shadow-xl hover:shadow-slate-200/50 transition-all cursor-pointer"
              >
                <div className="flex gap-4">
                  <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${typeColorClasses[event.type]}`} />
                  <div className="min-w-0 flex-1">
                    <h5 className="font-black text-slate-900 text-sm mb-1 truncate group-hover:text-blue-600 transition-colors uppercase">{event.title}</h5>
                    <div className="flex items-center gap-3 text-slate-400 text-[10px] font-bold">
                      <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {new Date(event.date).toLocaleDateString()}</span>
                      <span className="opacity-30">•</span>
                      <span>{event.startTime || "All Day"}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT - RIGHT PANEL */}
      <main className="flex-1 flex flex-col gap-8 min-w-0">

        {/* Toolbar & View Toggles */}
        <header className="bg-white rounded-[1.8rem] sm:rounded-[2.5rem] p-4 sm:p-6 lg:px-10 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-row items-center justify-between w-full md:w-auto gap-4 sm:gap-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight uppercase leading-none">
              {monthNames[currentDate.getMonth()]} <span className="text-slate-300">{currentDate.getFullYear()}</span>
            </h2>
            <div className="flex items-center bg-slate-50 rounded-2xl p-1 border border-slate-100">
              <button onClick={prevMonth} className="p-2 sm:p-3 text-slate-400 hover:text-slate-900 transition-all hover:bg-white rounded-xl active:scale-95 cursor-pointer"><ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" /></button>
              <button onClick={nextMonth} className="p-2 sm:p-3 text-slate-400 hover:text-slate-900 transition-all hover:bg-white rounded-xl active:scale-95 cursor-pointer"><ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" /></button>
            </div>
          </div>

          <div className="flex flex-row items-center justify-between w-full md:w-auto gap-4">
            <div className="flex items-center bg-slate-50 rounded-2xl p-1 border border-slate-100">
              <button onClick={() => setView("month")} className={`px-4 py-2 sm:px-6 sm:py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${view === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Month</button>
              <button onClick={() => setView("week")} className={`px-4 py-2 sm:px-6 sm:py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${view === 'week' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Week</button>
            </div>

            {isAdmin && (
              <button
                onClick={() => { setEditingEvent(null); setFormData({ title: "", date: "", type: "event", description: "", startTime: "", endTime: "" }); setIsModalOpen(true); }}
                className="px-4 py-2.5 sm:px-8 sm:py-4 bg-blue-600 text-white rounded-xl sm:rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-900 transition-all shadow-xl shadow-blue-100 active:scale-95 flex items-center gap-2 sm:gap-3 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Request Sync</span>
              </button>
            )}
          </div>
        </header>

        {/* Calendar Grid Interior */}
        <div className="flex-1 bg-white rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col min-h-0">
          {view === "month" ? (
            <>
              {/* Day Names Row */}
              <div className="grid grid-cols-7 border-b border-slate-100">
                {days.map(d => (
                  <div key={d} className="py-6 text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{d}</div>
                ))}
              </div>

              {/* Grid Cells */}
              <div className="flex-1 grid grid-cols-7 grid-rows-6 gap-px bg-slate-100 h-full overflow-y-auto no-scrollbar">
                {[...Array(getFirstDayOfMonth(currentDate.getMonth(), currentDate.getFullYear()))].map((_, i) => (
                  <div key={`empty-${i}`} className="bg-white/60" />
                ))}

                {[...Array(getDaysInMonth(currentDate.getMonth(), currentDate.getFullYear()))].map((_, i) => {
                  const day = i + 1;
                  const dayEvents = getEventsForDay(day, currentDate.getMonth(), currentDate.getFullYear());
                  const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
                  const isSelected = day === currentDate.getDate() && currentDate.getMonth() === currentDate.getMonth() && currentDate.getFullYear() === currentDate.getFullYear() && !isToday;

                  return (
                    <div key={day} className={`bg-white p-1.5 sm:p-4 transition-all group relative hover:bg-blue-50/10 min-h-[65px] sm:min-h-[90px] flex flex-col gap-1 sm:gap-2 ${isToday ? 'z-10 bg-blue-50/20' : ''}`}>
                      <div className="flex justify-between items-center">
                        <span className={`text-sm sm:text-xl font-black tracking-tight leading-none ${isToday ? 'text-blue-600' : isSelected ? 'text-slate-900' : 'text-slate-300 group-hover:text-slate-600 transition-colors'}`}>
                          {day < 10 ? `0${day}` : day}
                        </span>
                        {isToday && (
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)] animate-pulse" />
                        )}
                      </div>

                      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-1 sm:gap-1.5 pb-1 sm:pb-2">
                        {dayEvents.map(event => (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            key={event._id}
                            onClick={() => {
                              if (isAdmin && event.type !== 'holiday' && !event.isReadOnly) {
                                setEditingEvent(event);
                                setFormData({ ...event, date: new Date(event.date).toISOString().split('T')[0] });
                                setIsModalOpen(true);
                              }
                            }}
                            className={`px-1 py-1 sm:px-3 sm:py-2 rounded-md sm:rounded-xl text-[9px] font-black uppercase tracking-wider text-white ${typeColorClasses[event.type]} shadow-sm cursor-pointer hover:brightness-110 active:scale-95 transition-all truncate flex items-center justify-center sm:justify-start gap-1 sm:gap-2 group/item`}
                          >
                            <div className="w-1 h-1 rounded-full bg-white opacity-40 shrink-0 hidden sm:block" />
                            <span className="hidden sm:inline">{event.title}</span>
                            <span className="inline sm:hidden w-1.5 h-1.5 rounded-full bg-white opacity-90 mx-auto" />
                            {isAdmin && event.type !== 'holiday' && !event.isReadOnly && (
                              <MoreVertical className="w-3 h-3 ml-auto hidden sm:block opacity-0 group-hover/item:opacity-100 transition-opacity" />
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {[...Array(Math.max(0, 42 - (getFirstDayOfMonth(currentDate.getMonth(), currentDate.getFullYear()) + getDaysInMonth(currentDate.getMonth(), currentDate.getFullYear()))))].map((_, i) => (
                  <div key={`pad-${i}`} className="bg-white/60" />
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-6">
              <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200">
                <LayoutGrid className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Week View Calibration</h3>
                <p className="text-slate-400 font-light italic text-sm mt-2">Temporal weekly synchronization is currently under development.</p>
              </div>
              <button onClick={() => setView("month")} className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all cursor-pointer">Return to Month View</button>
            </div>
          )}
        </div>
      </main>

      {/* MODAL - ADD/EDIT ENTRY */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 z-[200]">
            <motion.div initial={{ scale: 0.9, y: 40, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 40, opacity: 0 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="bg-white rounded-[2rem] sm:rounded-[3.5rem] p-6 sm:p-12 max-w-2xl w-full shadow-2xl relative overflow-hidden border border-white text-left max-h-[90vh] overflow-y-auto">
              {/* Modal Background Decor */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-50 rounded-full blur-[80px] opacity-60" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-rose-50 rounded-full blur-[80px] opacity-60" />

              <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 sm:top-10 sm:right-10 text-slate-300 hover:text-slate-900 transition-all p-2 sm:p-3 bg-slate-50/50 rounded-full active:scale-90 hover:shadow-sm cursor-pointer"><X className="w-5 h-5 sm:w-6 sm:h-6" /></button>

              <div className="flex items-center gap-4 sm:gap-8 mb-6 sm:mb-12 relative">
                <div className="w-12 h-12 sm:w-20 sm:h-20 bg-blue-600 text-white rounded-xl sm:rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-200 shrink-0"><CalendarIcon className="w-6 h-6 sm:w-10 sm:h-10" /></div>
                <div className="flex-1">
                  <h3 className="text-2xl sm:text-4xl font-black text-slate-900 leading-none mb-2 sm:mb-3 tracking-tight">{editingEvent ? "Calibrate Entry" : "Initiate Directives"}</h3>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] sm:text-[10px] leading-none opacity-60 px-0.5">Global Synchronization Framework</p>
                </div>
              </div>

              <form onSubmit={handleCreateOrUpdate} className="space-y-8 relative">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Mission Header</label>
                    <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-100 rounded-[1.8rem] px-8 py-5 outline-none font-black text-slate-900 text-lg placeholder:text-slate-200 focus:bg-white transition-all shadow-inner" placeholder="e.g. Strategic Synergy" />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Temporal Node</label>
                    <input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-100 rounded-[1.5rem] px-8 py-4 outline-none font-bold text-slate-900 focus:bg-white transition-all shadow-inner" />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Classification</label>
                    <div className="relative">
                      <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-100 rounded-[1.5rem] px-8 py-4 outline-none font-black text-slate-900 focus:bg-white transition-all appearance-none cursor-pointer shadow-inner">
                        <option value="event">Official Event</option>
                        <option value="holiday">Public Holiday</option>
                        <option value="deadline">Critical Deadline</option>
                      </select>
                      <Layers className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Epoch Start</label>
                    <input type="time" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-100 rounded-[1.5rem] px-8 py-4 outline-none font-bold text-slate-900 focus:bg-white transition-all shadow-inner" />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Epoch End</label>
                    <input type="time" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-100 rounded-[1.5rem] px-8 py-4 outline-none font-bold text-slate-900 focus:bg-white transition-all shadow-inner" />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Mission Parameters (Log)</label>
                  <textarea rows="3" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-100 rounded-[2rem] px-8 py-6 outline-none font-medium text-slate-900 focus:bg-white transition-all leading-relaxed shadow-inner" placeholder="Detailed objectives..." />
                </div>                 <div className="flex gap-4 pt-6">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 sm:py-6 bg-slate-100 text-slate-400 rounded-3xl font-black uppercase tracking-widest hover:bg-slate-200 hover:text-slate-900 transition-all active:scale-95 leading-none cursor-pointer">Scrub</button>
                  {editingEvent && (
                    <button type="button" onClick={() => handleDelete(editingEvent._id)} className="px-6 py-4 sm:px-8 sm:py-6 bg-rose-50 text-rose-500 rounded-3xl hover:bg-rose-500 hover:text-white transition-all active:scale-95 shadow-lg shadow-rose-100 cursor-pointer">
                      <Trash2 className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                  )}
                  <button type="submit" disabled={formLoading} className="flex-[2] py-4 sm:py-6 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-[0.3em] hover:bg-blue-600 shadow-2xl shadow-slate-300 transition-all active:scale-[0.98] leading-none flex items-center justify-center gap-4 cursor-pointer text-xs sm:text-sm">
                    {formLoading ? "Synchronizing..." : <><CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" /> Authorize</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
