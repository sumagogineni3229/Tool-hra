"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckSquare,
  Clock,
  Calendar,
  AlertCircle,
  X,
  FileText,
  TrendingUp,
  CheckCircle2,
  ListTodo,
  Search
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";

export default function EmployeeTasksPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search/Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'pending' | 'in_progress' | 'completed'

  // Update modal state
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [status, setStatus] = useState("pending");
  const [progress, setProgress] = useState(0);
  const [completionNotes, setCompletionNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const session = apiClient.getCurrentSession();
      setCurrentUser(session);
      const email = session?.email || "";

      const fetchedTasks = await apiClient.getTasks({ email });
      setTasks(fetchedTasks || []);
    } catch (error) {
      console.error("Failed to load employee tasks dataset:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Stats computation
  const stats = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter(t => t.status === "pending").length;
    const inProgress = tasks.filter(t => t.status === "in_progress").length;
    const completed = tasks.filter(t => t.status === "completed").length;

    return { total, pending, inProgress, completed };
  }, [tasks]);

  // Filtered tasks list
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchesSearch =
        t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.assignedByEmail?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tasks, searchQuery, statusFilter]);

  const handleOpenUpdateModal = (task) => {
    setSelectedTask(task);
    setStatus(task.status || "pending");
    setProgress(task.progress || 0);
    setCompletionNotes(task.completionNotes || "");
    setErrorMsg("");
    setUpdateModalOpen(true);
  };

  // Sync progress if status is changed to completed
  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    if (newStatus === "completed") {
      setProgress(100);
    } else if (newStatus === "pending") {
      setProgress(0);
    }
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");

    try {
      const taskId = selectedTask.id || selectedTask._id;
      const res = await apiClient.updateTask(taskId, {
        status,
        progress: Number(progress),
        completionNotes: completionNotes.trim()
      });

      if (res.success) {
        setUpdateModalOpen(false);
        // Refresh task list
        const updated = await apiClient.getTasks({ email: currentUser?.email });
        setTasks(updated);
      } else {
        setErrorMsg(res.message || "Failed to update task");
      }
    } catch (err) {
      setErrorMsg("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "in_progress":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 text-slate-500 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 rounded-full border-2 border-slate-100 border-t-rose-500"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="absolute w-10 h-10 rounded-full border border-slate-250 border-b-indigo-500"
          />
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-semibold tracking-widest text-slate-800 uppercase animate-pulse">Syncing Task List</span>
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Establishing secure data channels...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 w-full max-w-none text-left">
      
      {/* Title Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">My Tasks</h2>
          <p className="text-slate-500 font-light text-lg italic tracking-wide">Monitor tasks assigned to you by your lead manager.</p>
        </div>
      </header>

      {/* Leave Balances Grid style for Tasks Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 py-2">
        {[
          { label: "Total Assigned Tasks", count: stats.total, icon: ListTodo, bg: "from-blue-50/50 to-indigo-50/10 border-blue-100/50 text-blue-650" },
          { label: "Tasks In Progress", count: stats.inProgress, icon: Clock, bg: "from-indigo-50/50 to-purple-50/10 border-indigo-100/50 text-indigo-650" },
          { label: "Pending Tasks", count: stats.pending, icon: AlertCircle, bg: "from-amber-50/50 to-orange-50/10 border-amber-100/50 text-amber-650" },
          { label: "Completed Tasks", count: stats.completed, icon: CheckCircle2, bg: "from-emerald-50/50 to-teal-50/10 border-emerald-100/50 text-emerald-650" }
        ].map((item, idx) => (
          <motion.div
            key={idx}
            whileHover={{ y: -4, scale: 1.01 }}
            className="bg-white border border-slate-100 p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/30 relative flex flex-col justify-between overflow-hidden transition-all text-left"
          >
            <div className="w-full flex justify-between items-center mb-6">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                {item.label}
              </span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-tr ${item.bg} border`}>
                <item.icon className="w-4.5 h-4.5" />
              </div>
            </div>
            
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">{item.count}</span>
              <span className="text-[9px] font-extrabold text-slate-350 uppercase tracking-widest ml-1">Tasks</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Task List Panel */}
      <div className="bg-white border border-slate-100 p-8 md:p-10 rounded-[3.5rem] shadow-xl shadow-slate-200/30 space-y-8">
        
        {/* Toolbar controls */}
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6 pb-4 border-b border-slate-100">
          
          {/* Tab Selector Buttons */}
          <div className="flex bg-slate-100 border border-slate-200/60 p-1 rounded-xl w-fit">
            {[
              { id: "all", label: "All", badge: tasks.length, color: "bg-slate-400" },
              { id: "pending", label: "Pending", badge: stats.pending, color: "bg-amber-500" },
              { id: "in_progress", label: "In Progress", badge: stats.inProgress, color: "bg-indigo-500" },
              { id: "completed", label: "Completed", badge: stats.completed, color: "bg-emerald-500" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                  statusFilter === tab.id
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-900"
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge > 0 && (
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-black text-white ${tab.color} leading-none`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Dynamic search registry input */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks, descriptions, managers..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white outline-none font-semibold text-slate-800 placeholder-slate-400 text-xs transition-all shadow-inner focus:border-rose-500"
            />
          </div>

        </div>

        {/* List of task rows */}
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-2">
                <CheckSquare className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-extrabold text-slate-900 tracking-tight leading-none uppercase">Clearance Completed</h4>
              <p className="text-slate-400 font-medium italic text-xs max-w-xs mx-auto">No tasks match the current active filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <motion.div
                  key={task.id || task._id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-slate-200/80 p-6 rounded-2xl hover:border-rose-350 transition-all text-left flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shadow-sm"
                >
                  {/* Task primary details */}
                  <div className="space-y-2.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-extrabold text-slate-900 tracking-tight leading-none">
                        {task.title}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-extrabold uppercase text-[8px] tracking-widest leading-none border select-none">
                        From Manager: {task.assignedByEmail || "Management"}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2" title={task.description}>
                      {task.description || "No instruction summary provided."}
                    </p>

                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-450 select-none pt-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No Due Date"}</span>
                      </div>
                      <span className="text-slate-250">|</span>
                      <span>Assigned: {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : "Offline seed"}</span>
                    </div>
                  </div>

                  {/* Task progress metrics in center of row */}
                  <div className="w-full lg:w-48 shrink-0 flex flex-col gap-2">
                    <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-400 leading-none select-none">
                      <span className="uppercase tracking-wider">My Progress</span>
                      <span className="text-slate-800">{task.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/60">
                      <div
                        className="bg-rose-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${task.progress || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Task Status & Action */}
                  <div className="flex items-center gap-3.5 shrink-0 w-full lg:w-auto justify-between lg:justify-end border-t border-slate-100 lg:border-t-0 pt-4 lg:pt-0">
                    <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border leading-none select-none ${
                      getStatusBadge(task.status)
                    }`}>
                      {task.status?.replace("_", " ")}
                    </span>

                    <button
                      onClick={() => handleOpenUpdateModal(task)}
                      className="px-6 py-3 bg-slate-900 hover:bg-rose-600 text-white rounded-2xl font-black uppercase tracking-[0.15em] text-[9px] shadow-lg shadow-slate-100 hover:shadow-rose-100 transition-all active:scale-95 flex items-center gap-2 cursor-pointer font-bold"
                    >
                      Update Work
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* UPDATE STATUS & PROGRESS MODAL */}
      <AnimatePresence>
        {updateModalOpen && selectedTask && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-6 overflow-y-auto select-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setUpdateModalOpen(false)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-xl"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="relative w-full max-w-lg bg-white rounded-3xl p-6 md:p-10 shadow-2xl border border-slate-150 overflow-hidden flex flex-col gap-6 z-10 text-left"
            >
              <div className="flex justify-between items-center pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0 shadow-sm">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 tracking-tight leading-none truncate max-w-[250px]">{selectedTask.title}</h3>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mt-1.5 block">Log progress update</span>
                  </div>
                </div>
                <button
                  onClick={() => setUpdateModalOpen(false)}
                  className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-150 hover:bg-slate-100 text-slate-400 hover:text-slate-800 cursor-pointer active:scale-95 transition-all shrink-0"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {errorMsg && (
                <div className="p-4 bg-rose-50 border border-rose-200/60 rounded-xl flex items-center gap-3 text-rose-700 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleUpdateTask} className="space-y-5 text-left">
                {selectedTask.description && (
                  <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl text-xs text-slate-650 leading-relaxed max-h-24 overflow-y-auto">
                    <span className="text-[8.5px] font-black uppercase text-slate-400 block tracking-wide mb-1">Instruction Details</span>
                    {selectedTask.description}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2 text-left">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Work Status</label>
                    <select
                      value={status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500/10 cursor-pointer transition-all"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2 text-left">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Due Date</label>
                    <div className="w-full bg-slate-100 border border-slate-200 text-slate-500 font-bold text-xs rounded-xl px-4 py-3 select-none">
                      {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : "No Due Date"}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Milestone progress</label>
                    <span className="text-xs font-extrabold text-slate-800">{progress}%</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={progress}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setProgress(val);
                        if (val === 100) setStatus("completed");
                        else if (val === 0) setStatus("pending");
                        else setStatus("in_progress");
                      }}
                      className="w-full h-2 bg-slate-150 rounded-lg appearance-none cursor-pointer accent-rose-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Completion / Update Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Log deliverables details, references, issues faced..."
                    value={completionNotes}
                    onChange={(e) => setCompletionNotes(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs bg-slate-50/50 placeholder-slate-400 focus:outline-none focus:border-rose-500/25 focus:ring-2 focus:ring-rose-500/10 transition-all font-semibold text-slate-850 resize-none"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setUpdateModalOpen(false)}
                    className="px-5 py-3 rounded-xl border border-slate-250 bg-white hover:bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500 cursor-pointer active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-[10px] font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95"
                  >
                    {submitting ? "Updating..." : "Save Progress"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
