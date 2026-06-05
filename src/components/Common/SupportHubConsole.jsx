"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
   BarChart3,
   MessageSquare,
   Clock,
   Shield,
   Star,
   AlertCircle,
   MoreVertical,
   ChevronRight,
   Plus,
   ArrowUpRight,
   Search,
   CheckCircle2,
   X,
   Send,
   Loader2,
   ArrowUpCircle,
   Eye,
   Ticket,
   CornerDownRight,
   Paperclip,
   RefreshCw
} from "lucide-react";
import {
   PieChart,
   Pie,
   Cell,
   Tooltip,
   ResponsiveContainer
} from "recharts";

const STATUS_COLORS = {
   "Pending": "bg-amber-50 text-amber-600 border-amber-100/50",
   "In Review": "bg-blue-50 text-blue-600 border-blue-100/50",
   "Resolved": "bg-emerald-50 text-emerald-600 border-emerald-100/50",
};

const PRIORITY_COLORS = {
   "Low": "bg-slate-50 text-slate-500",
   "Medium": "bg-blue-50 text-blue-600",
   "High": "bg-orange-50 text-orange-600",
   "Critical": "bg-rose-50 text-rose-600 border-rose-100/50 shadow-sm",
};

const SENTIMENT_COLORS = {
   "Positive": "bg-emerald-550 text-white shadow-emerald-100",
   "Neutral": "bg-slate-200 text-slate-600",
   "Negative": "bg-rose-600 text-white shadow-rose-100",
};

const RATING_LABELS = {
  jobSatisfaction: "Job Satisfaction",
  workEnvironment: "Environment",
  managementSupport: "Leadership Support",
  growthOpportunities: "Career Projection"
};

const CATEGORIES = [
  "Work Environment",
  "Management / Leadership",
  "Salary & Benefits",
  "Work-Life Balance",
  "Team Collaboration",
  "Facilities / Infrastructure",
  "Others",
];

export default function SupportHubConsole({ portalType }) {
   const [feedbacks, setFeedbacks] = useState([]);
   const [loading, setLoading] = useState(true);
   const [selectedFeedback, setSelectedFeedback] = useState(null);
   const [reply, setReply] = useState("");
   const [updatingId, setUpdatingId] = useState(null);
   const [searchQuery, setSearchQuery] = useState("");
   const [filterCategory, setFilterCategory] = useState("all");
   const [lightboxImage, setLightboxImage] = useState(null);

   const fetchFeedbacks = async () => {
      setLoading(true);
      let dbFeedbacks = [];
      try {
         let emailParam = "";
         if (typeof window !== "undefined") {
            const stored = localStorage.getItem("currentUser");
            if (stored) {
               const user = JSON.parse(stored);
               if (user?.email) {
                  emailParam = `?email=${encodeURIComponent(user.email)}`;
               }
            }
         }
         const res = await fetch(`/api/feedback${emailParam}`);
         if (res.ok) {
            const data = await res.json();
            if (data.success) {
               dbFeedbacks = data.feedbacks || [];
            }
         }
      } catch (err) {
         console.warn("Failed to fetch feedbacks via API, using LocalStorage fallback:", err);
      }

      if (typeof window !== "undefined") {
         const localTickets = JSON.parse(localStorage.getItem("hra_feedback_tickets") || "[]");
         const merged = [...dbFeedbacks];
         localTickets.forEach(lt => {
            if (!merged.some(mt => mt._id === lt._id || mt.id === lt.id)) {
               merged.push(lt);
            }
         });
         merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
         setFeedbacks(merged);
      } else {
         setFeedbacks(dbFeedbacks);
      }
      setLoading(false);
   };

   useEffect(() => {
      fetchFeedbacks();
   }, []);

   const handleUpdate = async (id, updates) => {
      setUpdatingId(id);
      let activeUser = null;
      let email = "";
      if (typeof window !== "undefined") {
         const stored = localStorage.getItem("currentUser");
         if (stored) {
            activeUser = JSON.parse(stored);
            email = activeUser?.email || "";
         }
      }

      let apiSuccess = false;
      try {
         const res = await fetch("/api/feedback", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, ...updates, email }),
         });
         if (res.ok) {
            const data = await res.json();
            if (data.success) {
               apiSuccess = true;
               setFeedbacks(prev => prev.map(f => f._id === id ? data.feedback : f));
               if (selectedFeedback && (selectedFeedback._id === id || selectedFeedback.id === id)) {
                  setSelectedFeedback(data.feedback);
               }
               if (updates.response) setReply("");
            }
         }
      } catch (err) {
         console.warn("Failed to patch feedback ticket via API, falling back to LocalStorage:", err);
      }

      if (!apiSuccess && typeof window !== "undefined") {
         const localTickets = JSON.parse(localStorage.getItem("hra_feedback_tickets") || "[]");
         const updated = localTickets.map(t => {
            if (t._id === id || t.id === id) {
               const updatedTicket = { ...t };
               if (updates.markSeen) {
                  updatedTicket.isSeen = true;
               }
               if (updates.status) {
                  updatedTicket.status = updates.status;
               }
               if (updates.escalationLevel !== undefined) {
                  updatedTicket.escalationLevel = updates.escalationLevel;
               }
               if (updates.response) {
                  if (!updatedTicket.replies) updatedTicket.replies = [];
                  updatedTicket.replies.push({
                     _id: `reply-${Date.now()}`,
                     userId: activeUser?.id || activeUser?._id || "local-admin",
                     userName: activeUser?.name || "HR Officer",
                     userRole: activeUser?.role || "HR",
                     message: updates.response.trim(),
                     createdAt: new Date().toISOString()
                  });
               }
               return updatedTicket;
            }
            return t;
         });
         localStorage.setItem("hra_feedback_tickets", JSON.stringify(updated));

         const match = updated.find(t => t._id === id || t.id === id);
         if (match) {
            setFeedbacks(prev => prev.map(f => (f._id === id || f.id === id) ? match : f));
            if (selectedFeedback && (selectedFeedback._id === id || selectedFeedback.id === id)) {
               setSelectedFeedback(match);
            }
         }
         if (updates.response) setReply("");
      }

      setUpdatingId(null);
   };

   const openFeedback = (feedback) => {
      setSelectedFeedback(feedback);
      if (!feedback.isSeen) {
         handleUpdate(feedback._id || feedback.id, { markSeen: true });
      }
   };

   const filteredFeedbacks = useMemo(() => {
      const query = (searchQuery || "").toLowerCase().trim();
      return feedbacks.filter(f => {
         const subject = (f.subject || "").toLowerCase();
         const content = (f.content || "").toLowerCase();
         const ticketId = (f.ticketId || "").toLowerCase();
         const matchesSearch = subject.includes(query) || content.includes(query) || ticketId.includes(query);
         const matchesCategory = filterCategory === "all" || f.category === filterCategory;
         return matchesSearch && matchesCategory;
      });
   }, [feedbacks, searchQuery, filterCategory]);

   const statsData = useMemo(() => {
      const categories = {};
      feedbacks.forEach(f => {
         categories[f.category] = (categories[f.category] || 0) + 1;
      });
      return Object.keys(categories).map(name => ({
         name,
         count: categories[name],
      }));
   }, [feedbacks]);

   const sentimentData = useMemo(() => {
      const sentiments = { Positive: 0, Neutral: 0, Negative: 0 };
      feedbacks.forEach(f => {
         sentiments[f.sentiment || "Neutral"]++;
      });
      return Object.keys(sentiments).map(name => ({
         name,
         value: sentiments[name],
         color: name === "Positive" ? "#10b981" : name === "Negative" ? "#e11d48" : "#94a3b8"
      }));
   }, [feedbacks]);

   return (
      <div className="space-y-12 pb-20 font-sans antialiased text-slate-800 text-left">
         <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 bg-white/40 backdrop-blur-xl p-12 rounded-[3.5rem] border border-white shadow-2xl shadow-slate-200/20">
            <div className="flex-1">
               <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
                     <Ticket className="w-6 h-6 animate-pulse" />
                  </div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight">Support Tickets Hub</h2>
               </div>
               <p className="text-slate-500 font-medium italic max-w-2xl px-2 leading-relaxed">
                  Operational dashboard for managing support tickets, resolving issues, and monitoring employee sentiment.
               </p>
            </div>
            <div className="flex gap-6 w-full lg:w-auto items-center">
               <button
                  onClick={fetchFeedbacks}
                  className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-wider text-slate-600 hover:text-slate-900 hover:border-slate-350 transition-all cursor-pointer shadow-sm active:scale-95"
               >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-650" : ""}`} />
                  Reload tickets
               </button>
               <div className="flex items-center gap-3 bg-white/60 backdrop-blur-3xl border border-slate-100 p-2 pr-8 rounded-full shadow-xl shadow-slate-200/50 hover:border-rose-250 transition-all group/pill cursor-default">
                  <div className="w-14 h-14 rounded-full bg-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-200 group-hover/pill:scale-110 transition-transform relative">
                     <span className="text-xl font-black leading-none">
                        {feedbacks.filter(f => f.status !== 'Resolved').length}
                     </span>
                     <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center border border-rose-100 shadow-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                     </div>
                  </div>
                  <div>
                     <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest leading-none mb-0.5">Alert Hub</p>
                     <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">Unresolved</p>
                  </div>
               </div>
            </div>
         </header>

         {/* Analytics Row */}
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Category Distribution Chart */}
            <div className="lg:col-span-12 bg-white rounded-[3rem] p-12 border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
               <div className="flex justify-between items-center mb-10">
                  <div>
                     <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1 uppercase flex items-center gap-3">
                        <BarChart3 className="w-5 h-5 text-blue-600 animate-pulse" />
                        Ticket Categories Distribution
                     </h3>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">Live categorical load analysis</p>
                  </div>
                  <div className="flex gap-4">
                     <div className="h-14 px-8 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-xs font-black uppercase tracking-widest shadow-xl shadow-slate-200">
                        {feedbacks.length} Total Tickets
                     </div>
                  </div>
               </div>
               <div className="space-y-8 mt-12 px-4">
                  {statsData.length === 0 ? (
                     <p className="text-sm font-light text-slate-400 italic text-center py-6">No submission load data available.</p>
                  ) : (
                     statsData.map((entry, index) => {
                        const colors = [
                           "from-blue-600 to-indigo-650",
                           "from-slate-800 to-slate-950",
                           "from-indigo-450 to-violet-650",
                           "from-sky-400 to-blue-600"
                        ];
                        const bgColors = [
                           "bg-blue-50/50",
                           "bg-slate-50/50",
                           "bg-indigo-50/50",
                           "bg-sky-50/50"
                        ];
                        const percentage = feedbacks.length > 0 ? Math.round((entry.count / feedbacks.length) * 100) : 0;
                        
                        return (
                           <motion.div 
                              key={index}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="group"
                           >
                              <div className="flex justify-between items-center mb-3 px-2">
                                 <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-black text-slate-300 tracking-widest italic">{String(index + 1).padStart(2, '0')}</span>
                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-[0.15em]">{entry.name}</h4>
                                 </div>
                                 <div className="flex items-center gap-6">
                                    <span className="text-xl font-black text-slate-900 tracking-tighter italic">{percentage}%</span>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-l border-slate-200 pl-4">{entry.count} ACTIVE</span>
                                 </div>
                              </div>
                              
                              <div className={`h-6 ${bgColors[index % bgColors.length]} rounded-full p-1 border border-slate-100/50 shadow-inner relative overflow-hidden group-hover:border-blue-200 transition-all`}>
                                 <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ duration: 2, ease: "circOut", delay: index * 0.1 }}
                                    className={`h-full rounded-full bg-gradient-to-r ${colors[index % colors.length]} relative shadow-lg shadow-blue-200/20`}
                                 >
                                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-full bg-white/40 blur-sm" />
                                 </motion.div>
                              </div>
                           </motion.div>
                        );
                     })
                  )}
               </div>
            </div>
         </div>

         {/* Atmosphere & Critical Row */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="bg-white rounded-[3rem] p-12 border border-slate-100 shadow-xl shadow-slate-200/40">
               <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-10 text-center">Organizational Sentiment Analysis</h4>
               <div className="h-[250px] w-full relative">
                  {feedbacks.length === 0 ? (
                     <div className="absolute inset-0 flex items-center justify-center text-sm italic text-slate-400">
                        No sentiment records discovered.
                     </div>
                  ) : (
                     <>
                        <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                              <Pie
                                 data={sentimentData}
                                 innerRadius={60}
                                 outerRadius={80}
                                 paddingAngle={10}
                                 dataKey="value"
                                 stroke="none"
                              >
                                 {sentimentData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                 ))}
                              </Pie>
                              <Tooltip
                                 contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }}
                              />
                           </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                           <span className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                              {feedbacks.length > 0 ? Math.round((sentimentData.find(s => s.name === "Positive")?.value || 0) / feedbacks.length * 100) : 0}%
                           </span>
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Positive</span>
                        </div>
                     </>
                  )}
               </div>
               <div className="flex justify-center gap-10 mt-6 flex-wrap">
                  {sentimentData.map(s => (
                     <div key={s.name} className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{s.name} ({s.value})</span>
                     </div>
                  ))}
               </div>
            </div>

            <div className="bg-rose-600 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden group flex flex-col justify-between">
               <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:rotate-45 transition-transform duration-700">
                  <ArrowUpCircle className="w-48 h-48" />
               </div>
               <div>
                  <div className="flex items-center gap-3 mb-8">
                     <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center"><AlertCircle className="w-6 h-6" /></div>
                     <h4 className="text-xl font-black uppercase tracking-tight">Critical Escalation Pool</h4>
                  </div>
                  <p className="text-3xl font-black tracking-tight leading-none mb-6">
                     {feedbacks.filter(f => f.priority === 'Critical' && f.status !== 'Resolved').length} High-Risk Tickets
                  </p>
                  <p className="text-sm font-medium text-rose-100 italic leading-relaxed max-w-xs text-left">
                     Immediate review initiated for these tickets. Ensure appropriate priority and attention is given to resolve them rapidly.
                  </p>
               </div>
               <button className="mt-10 w-full py-5 bg-white text-rose-600 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-rose-900/40 hover:scale-[1.02] transition-all active:scale-95 cursor-pointer">
                  View Critical Tickets
               </button>
            </div>
         </div>

         {/* Main Registry List */}
         <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
            <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-8 bg-slate-50/10">
               <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase px-4 border-l-8 border-slate-900">Support Tickets List</h3>
               <div className="flex flex-col sm:flex-row items-center gap-6 flex-1 w-full max-w-2xl justify-end">
                  <div className="relative w-full sm:max-w-xs">
                     <Search className="w-4 h-4 text-slate-350 absolute left-4 top-1/2 -translate-y-1/2" />
                     <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search ticket subject, description, ID..."
                        className="w-full h-14 pl-10 pr-6 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all shadow-inner"
                     />
                  </div>
                  <select
                     value={filterCategory}
                     onChange={e => setFilterCategory(e.target.value)}
                     className="h-14 w-full sm:w-auto px-8 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm cursor-pointer"
                  >
                     <option value="all">Global categories</option>
                     {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                     ))}
                  </select>
               </div>
            </div>

            <div className="overflow-x-auto min-h-[500px]">
               {loading ? (
                  <div className="flex flex-col items-center justify-center py-48 space-y-6">
                     <Loader2 className="w-12 h-12 text-slate-300 animate-spin" />
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse italic">Connecting to Support Tickets Hub...</p>
                  </div>
               ) : filteredFeedbacks.length === 0 ? (
                  <div className="text-center py-48 font-light italic text-slate-300 text-lg">No support tickets found.</div>
               ) : (
                  <table className="w-full border-separate border-spacing-0">
                     <thead>
                        <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-left border-b border-slate-100">
                           <th className="px-12 py-6">Employee / Ticket ID</th>
                           <th className="px-12 py-6">Subject</th>
                           <th className="px-12 py-6">Priority</th>
                           <th className="px-12 py-6">Sentiment</th>
                           <th className="px-12 py-6">Status</th>
                           <th className="px-12 py-6 text-right">Action</th>
                        </tr>
                     </thead>
                     <tbody>
                        {filteredFeedbacks.map((f) => (
                           <tr key={f._id || f.id} className="group hover:bg-slate-50 transition-all border-b border-slate-50 relative">
                              <td className="px-12 py-8 relative">
                                 {!f.isSeen && <div className="absolute top-1/2 left-4 -translate-y-1/2 w-2 h-8 bg-blue-600 rounded-full shadow-lg shadow-blue-200" />}
                                 <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-md font-black shadow-lg ${f.isAnonymous ? "bg-slate-900 text-white" : "bg-white border border-slate-100 text-indigo-650"}`}>
                                       {f.isAnonymous ? <Shield className="w-6 h-6" /> : (f.employeeDetails?.name?.charAt(0).toUpperCase() || "E")}
                                    </div>
                                    <div className="leading-tight">
                                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-1">{f.ticketId || "#TKT-0000"}</p>
                                       <p className="text-sm font-black text-slate-900">{f.isAnonymous ? "Protected Submitter" : (f.employeeDetails?.name || f.userName)}</p>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-12 py-8">
                                 <p className="text-sm font-black text-slate-900 max-w-[240px] truncate mb-1">{f.subject}</p>
                                 <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{f.category}</span>
                                    {f.attachments?.length > 0 && <span className="px-2 py-0.5 bg-slate-900 text-white rounded text-[8px] font-bold">PDF+{f.attachments.length}</span>}
                                 </div>
                              </td>
                              <td className="px-12 py-8">
                                 <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm ${PRIORITY_COLORS[f.priority] || "bg-slate-50 text-slate-500"}`}>
                                    {f.priority}
                                 </span>
                              </td>
                              <td className="px-12 py-8">
                                 <span className={`px-4 py-1.5 rounded-[1.2rem] text-[9px] font-black uppercase tracking-widest shadow-lg ${SENTIMENT_COLORS[f.sentiment || "Neutral"]}`}>
                                    {f.sentiment || "Neutral"}
                                 </span>
                              </td>
                              <td className="px-12 py-8">
                                 <div className="flex flex-col gap-2">
                                    <span className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest border text-center ${STATUS_COLORS[f.status] || "bg-slate-50 border-slate-100 text-slate-500"}`}>
                                       {f.status}
                                    </span>
                                    {f.escalationLevel > 0 && (
                                       <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1">
                                          <Plus className="w-2.5 h-2.5" />
                                          Escalated Level {f.escalationLevel}
                                       </span>
                                    )}
                                 </div>
                              </td>
                              <td className="px-12 py-8 text-right">
                                 <button
                                    onClick={() => openFeedback(f)}
                                    className="px-8 py-4 bg-white border border-slate-200 text-slate-900 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-200/50 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all active:scale-95 flex items-center justify-center gap-3 float-right group-hover:bg-slate-900 group-hover:text-white cursor-pointer"
                                 >
                                    Open Ticket
                                    <ArrowUpRight className="w-4 h-4" />
                                 </button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               )}
            </div>
         </div>

         {/* FEEDBACK DETAIL MODAL (ENTERPRISE UPGRADE) */}
         <AnimatePresence>
            {selectedFeedback && (
               <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
                  <motion.div
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     onClick={() => setSelectedFeedback(null)}
                     className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl pointer-events-auto"
                  />
                  <motion.div
                     initial={{ opacity: 0, scale: 0.95, y: 40 }}
                     animate={{ opacity: 1, scale: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.95, y: 40 }}
                     className="relative w-full max-w-5xl max-h-[92vh] bg-white rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden pointer-events-auto flex flex-col border border-white/20"
                  >
                     {/* Modal Header */}
                     <div className="p-12 border-b border-slate-100 flex justify-between items-start bg-slate-50/40 relative">
                        <div className="flex gap-8 relative z-10 text-left">
                           <div className={`w-20 h-20 rounded-[2.5rem] flex items-center justify-center text-3xl font-black shadow-2xl relative ${selectedFeedback.isAnonymous ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-indigo-650"}`}>
                              {selectedFeedback.isAnonymous ? <Shield className="w-10 h-10" /> : (selectedFeedback.employeeDetails?.name?.charAt(0).toUpperCase() || selectedFeedback.userName?.charAt(0).toUpperCase() || "E")}
                              <div className={`absolute -bottom-2 -right-2 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-xl ${SENTIMENT_COLORS[selectedFeedback.sentiment || "Neutral"]}`}>
                                 {selectedFeedback.sentiment || "Neutral"}
                              </div>
                           </div>
                           <div>
                              <div className="flex flex-wrap items-center gap-3 mb-2">
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">{selectedFeedback.ticketId}</span>
                                 <h4 className="text-3xl font-black text-slate-900 tracking-tight">{selectedFeedback.isAnonymous ? "Anonymous Ticket Submitter" : (selectedFeedback.employeeDetails?.name || selectedFeedback.userName)}</h4>
                                 <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm ${PRIORITY_COLORS[selectedFeedback.priority] || "bg-slate-50 text-slate-500"}`}>
                                    {selectedFeedback.priority}
                                 </span>
                              </div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.25em] italic flex items-center gap-4">
                                 <span>Category: {selectedFeedback.category}</span>
                                 <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                 <span>Ticket Submitted: {new Date(selectedFeedback.createdAt).toLocaleString()}</span>
                              </p>
                           </div>
                        </div>
                        <div className="flex gap-3 relative z-10">
                           <button 
                              className="h-14 px-6 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest gap-3 hover:bg-rose-650 hover:text-white transition-all shadow-xl shadow-rose-100/20 active:scale-95 border border-rose-100 cursor-pointer" 
                              onClick={() => handleUpdate(selectedFeedback._id || selectedFeedback.id, { escalationLevel: ((selectedFeedback.escalationLevel || 0) + 1) % 3 })}
                           >
                              <ArrowUpCircle className={`w-5 h-5 ${selectedFeedback.escalationLevel > 0 ? "animate-bounce" : ""}`} />
                              {selectedFeedback.escalationLevel === 0 ? "Apply Escalation" : `Level ${selectedFeedback.escalationLevel} Active`}
                           </button>
                           <button 
                              onClick={() => setSelectedFeedback(null)} 
                              className="w-14 h-14 bg-white rounded-3xl flex items-center justify-center text-slate-400 hover:text-rose-600 shadow-2xl border border-slate-100 hover:rotate-90 transition-all duration-300 cursor-pointer"
                           >
                              <X className="w-7 h-7" />
                           </button>
                        </div>
                     </div>

                     {/* Modal Content */}
                     <div className="flex-1 overflow-y-auto p-12 space-y-16 custom-scrollbar bg-white relative">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                           
                           {/* Main Content description */}
                           <div className="lg:col-span-12 space-y-6 text-left">
                              <div className="flex items-center gap-3 px-2">
                                 <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400"><MessageSquare className="w-4 h-4" /></div>
                                 <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Ticket Description</h5>
                              </div>
                              <div className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100 relative group">
                                 <p className="italic font-bold text-slate-800 leading-relaxed text-xl tracking-wide selection:bg-blue-100 selection:text-blue-600 first-letter:text-4xl first-letter:font-black first-letter:text-slate-400">
                                    {selectedFeedback.content}
                                 </p>
                                 <div className="absolute -top-4 -right-4 p-4 bg-white rounded-2xl shadow-2xl border border-slate-100 opacity-0 group-hover:opacity-100 transition-all pointer-events-none">
                                    <p className="text-[9px] font-black uppercase text-slate-400">Detected Emotion: <span className="text-slate-900">{selectedFeedback.sentiment || "Neutral"}</span></p>
                                 </div>
                              </div>
                           </div>

                           {/* Solution proposed optimizations */}
                           {selectedFeedback.suggestions && (
                              <div className="lg:col-span-12 space-y-6 text-left">
                                 <div className="flex items-center gap-3 px-2">
                                    <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-400"><Plus className="w-4 h-4" /></div>
                                    <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Proposed Solution / Suggestions</h5>
                                 </div>
                                 <div className="p-10 bg-indigo-50/30 rounded-[3rem] border border-indigo-100/50 text-slate-700 font-semibold tracking-wide text-lg relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><CheckCircle2 className="w-32 h-32" /></div>
                                    {selectedFeedback.suggestions}
                                 </div>
                              </div>
                           )}

                           {/* Ratings details */}
                           {selectedFeedback.ratings && (
                              <div className="lg:col-span-5 space-y-8 text-left">
                                 <div className="flex items-center gap-3 px-2">
                                    <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500"><Star className="w-4 h-4 fill-amber-500" /></div>
                                    <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Ratings & Sentiment</h5>
                                 </div>
                                 <div className="grid grid-cols-1 gap-4">
                                    {Object.entries(selectedFeedback.ratings).map(([key, val]) => (
                                       <div key={key} className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-[2rem] hover:bg-white transition-all shadow-sm">
                                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{RATING_LABELS[key] || key}</span>
                                          <div className="flex gap-1">
                                             {[1, 2, 3, 4, 5].map(star => (
                                                <Star key={star} className={`w-4 h-4 ${Number(val) >= star ? "text-amber-500 fill-amber-500 scale-110 drop-shadow-md" : "text-slate-200"}`} />
                                             ))}
                                          </div>
                                       </div>
                                    ))}
                                 </div>
                              </div>
                           )}

                           {/* Evidence Hub attachments */}
                           {selectedFeedback.attachments && selectedFeedback.attachments.length > 0 && (
                              <div className="lg:col-span-7 space-y-6 text-left">
                                 <div className="flex items-center gap-3 px-2">
                                    <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-slate-450"><Paperclip className="w-4 h-4" /></div>
                                    <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Attachments</h5>
                                 </div>
                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {selectedFeedback.attachments.map((file, idx) => {
                                       const isImage = file.type?.startsWith("image/") || file.url?.startsWith("data:image/");
                                       return (
                                          <div 
                                             key={idx} 
                                             className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-3 shadow-sm hover:border-slate-300 transition-all"
                                          >
                                             <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-indigo-50 text-indigo-650 rounded-lg flex items-center justify-center shadow-inner shrink-0">
                                                   <Ticket className="w-4 h-4" />
                                                </div>
                                                <div className="truncate flex-1">
                                                   <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest truncate" title={file.name}>{file.name}</p>
                                                   <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{file.type || "ATTACHMENT"}</p>
                                                </div>
                                                <a 
                                                   href={file.url} 
                                                   download={file.name} 
                                                   className="w-8 h-8 bg-white border border-slate-150 hover:bg-slate-900 hover:text-white rounded-lg flex items-center justify-center text-slate-500 transition-colors shrink-0"
                                                   title={`Download ${file.name}`}
                                                >
                                                   <Paperclip className="w-3.5 h-3.5" />
                                                </a>
                                             </div>
                                             {isImage && (
                                                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-white group/img aspect-video flex justify-center items-center">
                                                   <img 
                                                      src={file.url} 
                                                      alt={file.name} 
                                                      className="object-contain w-full h-full max-h-40 transition-transform duration-300 group-hover/img:scale-105"
                                                   />
                                                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                                      <button 
                                                         type="button"
                                                         onClick={() => setLightboxImage(file)}
                                                         className="px-4 py-2 bg-white text-slate-900 rounded-xl text-[9px] font-black uppercase tracking-wider hover:scale-105 transition-transform cursor-pointer"
                                                      >
                                                         View Full Image
                                                      </button>
                                                   </div>
                                                </div>
                                             )}
                                          </div>
                                       );
                                    })}
                                 </div>
                              </div>
                           )}

                        </div>

                        {/* Status Toggle Actions */}
                        <div className="space-y-6 text-left">
                           <div className="flex items-center gap-3 px-2">
                              <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500"><CheckCircle2 className="w-4 h-4" /></div>
                              <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Ticket Resolution State</h5>
                           </div>
                           <div className="flex flex-wrap gap-4 pt-2">
                              {["Pending", "In Review", "Resolved"].map((s) => (
                                 <button
                                    key={s}
                                    disabled={updatingId !== null}
                                    onClick={() => handleUpdate(selectedFeedback._id || selectedFeedback.id, { status: s })}
                                    className={`flex-1 min-w-[120px] py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border cursor-pointer ${
                                       selectedFeedback.status === s
                                          ? (s === "Resolved" ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100" : s === "In Review" ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100" : "bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-100")
                                          : "bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100 hover:text-slate-800"
                                    }`}
                                 >
                                    {s}
                                 </button>
                              ))}
                           </div>
                        </div>

                        {/* Replies Thread Feed */}
                        <div className="space-y-6 pt-6 border-t border-slate-100 text-left">
                           <div className="flex items-center gap-3 px-2">
                              <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500"><MessageSquare className="w-4 h-4 animate-pulse" /></div>
                              <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Discussion & Replies ({selectedFeedback.replies?.length || 0})</h5>
                           </div>
                           
                           <div className="bg-slate-50/50 border border-slate-100 rounded-[2rem] p-6 max-h-[300px] overflow-y-auto space-y-4 shadow-inner">
                              
                              {/* Original report */}
                              <div className="p-5 bg-white border border-slate-150 rounded-2xl text-left shadow-sm">
                                 <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                                       {selectedFeedback.isAnonymous ? "Protected Submitter" : (selectedFeedback.employeeDetails?.name || selectedFeedback.userName)}
                                       <span className="text-[8px] font-bold text-slate-400 uppercase ml-2 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">Submitter</span>
                                    </span>
                                 </div>
                                 <p className="text-xs text-slate-650 italic font-medium leading-relaxed">&ldquo;{selectedFeedback.content}&rdquo;</p>
                              </div>

                              {/* Nested replies */}
                              {selectedFeedback.replies && selectedFeedback.replies.map((reply, ridx) => (
                                 <div key={reply._id || ridx} className="flex items-start gap-2 text-left pl-6">
                                    <CornerDownRight className="w-4 h-4 text-slate-350 shrink-0 mt-1" />
                                    <div className="flex-1 p-4 bg-white border border-slate-150 rounded-2xl shadow-sm">
                                       <div className="flex justify-between items-center mb-1.5">
                                          <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                                             {reply.userName}{" "}
                                             <span className="text-[8px] font-bold text-indigo-650 uppercase px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-100/30 ml-2">
                                                {reply.userRole}
                                             </span>
                                          </span>
                                          <span className="text-[8px] text-slate-400 font-bold uppercase">
                                             {reply.createdAt ? new Date(reply.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "Recently"}
                                          </span>
                                       </div>
                                       <p className="text-xs text-slate-650 italic font-medium leading-relaxed">&ldquo;{reply.message}&rdquo;</p>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>

                        {/* Reply draft Form */}
                        <form
                           onSubmit={(e) => {
                              e.preventDefault();
                              if (!reply.trim()) return;
                              handleUpdate(selectedFeedback._id || selectedFeedback.id, { response: reply });
                           }}
                           className="space-y-4 pt-4 border-t border-slate-100 text-left"
                        >
                           <div className="relative">
                              <textarea
                                 required
                                 value={reply}
                                 onChange={(e) => setReply(e.target.value)}
                                 placeholder={`Draft encrypted response to submitter as ${portalType}...`}
                                 rows="3"
                                 className="w-full p-6 bg-slate-50 border border-slate-150 focus:bg-white focus:border-slate-350 outline-none rounded-[2rem] text-xs font-semibold leading-relaxed transition-all resize-none shadow-inner"
                              />
                           </div>
                           <button
                              type="submit"
                              disabled={updatingId !== null || !reply.trim()}
                              className="w-full py-5 bg-slate-900 hover:bg-indigo-650 disabled:opacity-50 text-white rounded-[1.8rem] font-black uppercase tracking-[0.25em] text-[10px] shadow-lg shadow-slate-200 transition-all flex items-center justify-center gap-3 cursor-pointer"
                           >
                              {updatingId !== null ? (
                                 <Loader2 className="w-4 h-4 animate-spin text-white" />
                              ) : (
                                 <>
                                    <Send className="w-3.5 h-3.5" />
                                    Broadcast Response
                                 </>
                              )}
                           </button>
                        </form>

                     </div>

                  </motion.div>
               </div>
            )}
         </AnimatePresence>

         <AnimatePresence>
            {lightboxImage && (
               <div className="fixed inset-0 z-[120] flex items-center justify-center pointer-events-none">
                  <motion.div
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     onClick={() => setLightboxImage(null)}
                     className="absolute inset-0 bg-slate-950/85 backdrop-blur-md pointer-events-auto cursor-zoom-out"
                  />
                  <motion.div
                     initial={{ opacity: 0, scale: 0.9 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.9 }}
                     className="relative max-w-[90vw] max-h-[90vh] pointer-events-auto z-10 flex flex-col items-center gap-4"
                  >
                     <img 
                        src={lightboxImage.url} 
                        alt={lightboxImage.name} 
                        className="object-contain max-w-full max-h-[80vh] rounded-2xl border border-white/10 shadow-2xl"
                     />
                     <div className="flex gap-4">
                        <a 
                           href={lightboxImage.url} 
                           download={lightboxImage.name}
                           className="px-6 py-3 bg-white text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-colors shadow-lg flex items-center gap-2"
                        >
                           <Paperclip className="w-4 h-4" />
                           Download File
                        </a>
                        <button
                           type="button"
                           onClick={() => setLightboxImage(null)}
                           className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors shadow-lg flex items-center gap-2 cursor-pointer"
                        >
                           <X className="w-4 h-4" />
                           Close Preview
                        </button>
                     </div>
                  </motion.div>
               </div>
            )}
         </AnimatePresence>
      </div>
   );
}
