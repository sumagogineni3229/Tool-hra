"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckSquare,
  Plus,
  Clock,
  Calendar,
  AlertCircle,
  X,
  User,
  Trash2,
  ListTodo,
  TrendingUp,
  UserCheck,
  CheckCircle2,
  Search,
  Briefcase,
  ArrowRight,
  RefreshCw,
  Edit2
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";

export default function ManagerTaskManagementPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'pending' | 'in_progress' | 'completed'

  // Form Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Form Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignType, setAssignType] = useState("all"); // 'all' | 'employee' | 'intern'
  const [selectedAssignee, setSelectedAssignee] = useState(""); // email of selected user
  const [dueDate, setDueDate] = useState("");

  // Details Modal State
  const [selectedTask, setSelectedTask] = useState(null);

  // Edit Form Fields
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editAssignType, setEditAssignType] = useState("all");
  const [editSelectedAssignee, setEditSelectedAssignee] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editErrorMsg, setEditErrorMsg] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const session = apiClient.getCurrentSession();
      setCurrentUser(session);
      const email = session?.email || "";

      const [fetchedUsers, fetchedTeams, fetchedTasks] = await Promise.all([
        apiClient.getUsers(),
        apiClient.getTeams(),
        apiClient.getTasks({ email })
      ]);

      setUsers(fetchedUsers || []);
      setTeams(fetchedTeams || []);
      setTasks(fetchedTasks || []);
    } catch (error) {
      console.error("Failed to load tasks datasets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter team members managed by this manager
  const managedTeamMembers = useMemo(() => {
    if (!currentUser || teams.length === 0) return [];
    const currentUserId = currentUser.id || currentUser._id;
    const myTeams = teams.filter(t => {
      const tMgrId = t.managerId?.id || t.managerId?._id || t.managerId;
      return tMgrId?.toString() === currentUserId?.toString();
    });

    const memberIds = myTeams.flatMap(t => t.members || []).map(m => (m.id || m._id || m).toString());
    return users.filter(u => {
      const uId = (u.id || u._id)?.toString();
      return memberIds.includes(uId);
    });
  }, [teams, users, currentUser]);

  // Dropdown list matching assignee choices
  const assigneeOptions = useMemo(() => {
    if (assignType === "employee") {
      return managedTeamMembers.filter(m => m.role === "Employee");
    }
    if (assignType === "intern") {
      return managedTeamMembers.filter(m => m.role === "Intern");
    }
    return [];
  }, [managedTeamMembers, assignType]);

  const editAssigneeOptions = useMemo(() => {
    if (editAssignType === "employee") {
      return managedTeamMembers.filter(m => m.role === "Employee");
    }
    if (editAssignType === "intern") {
      return managedTeamMembers.filter(m => m.role === "Intern");
    }
    return [];
  }, [managedTeamMembers, editAssignType]);

  // Sync selected assignee when type or options change
  useEffect(() => {
    if (assigneeOptions.length > 0) {
      setSelectedAssignee(assigneeOptions[0].email);
    } else {
      setSelectedAssignee("");
    }
  }, [assigneeOptions]);

  useEffect(() => {
    if (editModalOpen && editAssigneeOptions.length > 0) {
      const hasCurrent = editAssigneeOptions.some(o => o.email.toLowerCase().trim() === editSelectedAssignee?.toLowerCase().trim());
      if (!hasCurrent) {
        setEditSelectedAssignee(editAssigneeOptions[0].email);
      }
    } else if (editModalOpen) {
      setEditSelectedAssignee("");
    }
  }, [editAssigneeOptions, editModalOpen]);

  // Stats computation
  const stats = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter(t => t.status === "pending").length;
    const inProgress = tasks.filter(t => t.status === "in_progress").length;
    const completed = tasks.filter(t => t.status === "completed").length;
    const avgProgress = total > 0 ? Math.round(tasks.reduce((sum, t) => sum + (t.progress || 0), 0) / total) : 0;

    return { total, pending, inProgress, completed, avgProgress };
  }, [tasks]);

  // Searched and filtered tasks list
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchesSearch =
        t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.assignedTo?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tasks, searchQuery, statusFilter]);

  const handleOpenModal = () => {
    setTitle("");
    setDescription("");
    setAssignType("all");
    setSelectedAssignee("");
    setDueDate("");
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleAssignTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Task title is required");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const taskPayload = {
        title: title.trim(),
        description: description.trim(),
        assignedTo: assignType === "all" ? "all" : selectedAssignee,
        assigneeRole: assignType === "all" ? "All" : (assignType === "employee" ? "Employee" : "Intern"),
        dueDate: dueDate || null,
        managerEmail: currentUser?.email
      };

      const res = await apiClient.createTask(taskPayload);
      if (res.success) {
        setModalOpen(false);
        // Refresh task list
        const updated = await apiClient.getTasks({ email: currentUser?.email });
        setTasks(updated);
      } else {
        setErrorMsg(res.message || "Failed to create task");
      }
    } catch (err) {
      setErrorMsg("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditModal = (task, e) => {
    if (e) e.stopPropagation();
    setEditingTask(task);
    setEditTitle(task.title || "");
    setEditDescription(task.description || "");
    
    let type = "all";
    if (task.assignedTo && task.assignedTo !== "all") {
      if (task.assigneeRole === "Employee") {
        type = "employee";
      } else if (task.assigneeRole === "Intern") {
        type = "intern";
      } else {
        const user = users.find(u => u.email.toLowerCase().trim() === task.assignedTo.toLowerCase().trim());
        if (user) {
          type = user.role.toLowerCase();
        }
      }
    }
    setEditAssignType(type);
    setEditSelectedAssignee(task.assignedTo === "all" ? "" : task.assignedTo);
    
    let formattedDate = "";
    if (task.dueDate) {
      const d = new Date(task.dueDate);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toISOString().split("T")[0];
      }
    }
    setEditDueDate(formattedDate);
    setEditErrorMsg("");
    setEditModalOpen(true);
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!editTitle.trim()) {
      setEditErrorMsg("Task title is required");
      return;
    }

    setEditSubmitting(true);
    setEditErrorMsg("");

    const taskId = editingTask.id || editingTask._id;

    try {
      const taskPayload = {
        title: editTitle.trim(),
        description: editDescription.trim(),
        assignedTo: editAssignType === "all" ? "all" : editSelectedAssignee,
        assigneeRole: editAssignType === "all" ? "All" : (editAssignType === "employee" ? "Employee" : "Intern"),
        dueDate: editDueDate || null,
      };

      const res = await apiClient.updateTask(taskId, taskPayload);
      if (res.success) {
        setEditModalOpen(false);
        setEditingTask(null);
        // Refresh task list
        const updated = await apiClient.getTasks({ email: currentUser?.email });
        setTasks(updated);
        
        if (selectedTask && (selectedTask.id === taskId || selectedTask._id === taskId)) {
          setSelectedTask(res.task);
        }
      } else {
        setEditErrorMsg(res.message || "Failed to update task");
      }
    } catch (err) {
      setEditErrorMsg("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await apiClient.deleteTask(taskId);
      if (res.success) {
        setTasks(prev => prev.filter(t => (t.id !== taskId && t._id !== taskId)));
        if (selectedTask && (selectedTask.id === taskId || selectedTask._id === taskId)) {
          setSelectedTask(null);
        }
      } else {
        alert("Failed to delete task");
      }
    } catch (error) {
      console.error("Delete task failed:", error);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "in_progress":
        return "bg-indigo-50 text-indigo-700 border-indigo-100";
      default:
        return "bg-amber-50 text-amber-700 border-amber-100";
    }
  };

  const getAssigneeLabel = (task) => {
    if (task.assignedTo === "all") {
      return `Entire Team (${task.assigneeRole}s)`;
    }
    const user = users.find(u => u.email.toLowerCase().trim() === task.assignedTo?.toLowerCase().trim());
    return user ? `${user.name} (${user.role})` : task.assignedTo;
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 text-slate-500 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative flex items-center justify-center">
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
          <span className="text-sm font-semibold tracking-widest text-slate-800 uppercase animate-pulse">Syncing Task Board</span>
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Loading project backlogs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 w-full max-w-none text-left">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-[0.03] bg-gradient-to-l from-emerald-600 to-transparent pointer-events-none" />
        
        <div className="space-y-2 text-left">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold border border-emerald-100">
            <CheckSquare className="w-3 h-3 text-emerald-600" />
            Task Console Live
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Task Management Hub</h1>
          <p className="text-xs font-medium text-slate-405 max-w-xl">
            Create, delegate, and monitor task status and milestone progress for employees and interns across your managed teams.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 text-left">
          <button
            onClick={loadData}
            className="px-5 py-3.5 bg-slate-50 hover:bg-slate-900 border border-slate-200 hover:border-slate-900 text-slate-600 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 self-stretch sm:self-auto font-bold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reload Board
          </button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleOpenModal}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer border border-emerald-500/10 self-stretch sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Assign New Task
          </motion.button>
        </div>
      </div>

      {/* 📊 KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Total Allocated Tasks",
            count: stats.total,
            icon: ListTodo,
            bg: "from-blue-50/50 to-indigo-50/10 border-blue-100/50 text-blue-600"
          },
          {
            label: "Active Workloads",
            count: stats.inProgress,
            icon: Clock,
            bg: "from-indigo-50/50 to-purple-50/10 border-indigo-100/50 text-indigo-600"
          },
          {
            label: "Avg Squad Completion",
            count: `${stats.avgProgress}%`,
            icon: TrendingUp,
            bg: "from-emerald-50/50 to-teal-50/10 border-emerald-100/50 text-emerald-600"
          },
          {
            label: "Pending Assignment",
            count: stats.pending,
            icon: UserCheck,
            bg: "from-amber-50/50 to-orange-50/10 border-amber-100/50 text-amber-600"
          }
        ].map((item, idx) => (
          <motion.div
            key={idx}
            whileHover={{ y: -4, scale: 1.01 }}
            className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm relative flex flex-col justify-between overflow-hidden transition-all text-left"
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

      {/* 👥 TASKS TOOLBAR */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 text-left">
        {/* Tab Selector Buttons */}
        <div className="flex bg-slate-100 border border-slate-200/60 p-1 rounded-xl w-fit">
          {[
            { id: "all", label: "All Tasks", badge: tasks.length, color: "bg-slate-400" },
            { id: "pending", label: "Pending", badge: stats.pending, color: "bg-amber-500" },
            { id: "in_progress", label: "In Progress", badge: stats.inProgress, color: "bg-indigo-500" },
            { id: "completed", label: "Completed", badge: stats.completed, color: "bg-emerald-500" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-4 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-450 hover:text-slate-900"
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
            placeholder="Search tasks, descriptions, assignees..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white outline-none font-semibold text-slate-805 placeholder-slate-400 text-xs transition-all shadow-inner focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Dynamic tasks list stacked vertically in rows */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-405 mb-2">
              <CheckSquare className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-extrabold text-slate-900 tracking-tight leading-none uppercase">No Tasks Resolved</h4>
            <p className="text-slate-400 font-medium italic text-xs max-w-xs mx-auto">No squad tasks match the current search filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <motion.div
                key={task.id || task._id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedTask(task)}
                className="bg-white border border-slate-200/80 p-6 rounded-2xl hover:border-slate-350 transition-all text-left flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shadow-sm cursor-pointer group"
              >
                {/* Task primary details */}
                <div className="space-y-2.5 flex-1 min-w-0 text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-extrabold text-slate-900 tracking-tight leading-none group-hover:text-emerald-700 transition-colors">
                      {task.title}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-extrabold uppercase text-[8px] tracking-widest leading-none border select-none">
                      Assignee: {getAssigneeLabel(task)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-505 font-medium leading-relaxed line-clamp-2" title={task.description}>
                    {task.description || "No instruction summary provided."}
                  </p>

                  <div className="flex items-center gap-4 text-[10px] font-bold text-slate-450 select-none pt-1">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 animate-none" />
                      <span>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No Due Date"}</span>
                    </div>
                    <span className="text-slate-250">|</span>
                    <span>Assigned: {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : "Offline seed"}</span>
                  </div>
                </div>

                {/* Task progress metrics in center of row */}
                <div className="w-full lg:w-48 shrink-0 flex flex-col gap-2">
                  <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-400 leading-none select-none">
                    <span className="uppercase tracking-wider">Squad Progress</span>
                    <span className="text-slate-800">{task.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-105 h-2 rounded-full overflow-hidden border border-slate-200/60">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${task.progress || 0}%` }}
                    />
                  </div>
                </div>

                {/* Task Status & Actions */}
                <div className="flex items-center gap-3.5 shrink-0 w-full lg:w-auto justify-between lg:justify-end border-t border-slate-105 lg:border-t-0 pt-4 lg:pt-0">
                  <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border leading-none select-none ${
                    getStatusBadge(task.status)
                  }`}>
                    {task.status?.replace("_", " ")}
                  </span>

                  <button
                    onClick={(e) => handleOpenEditModal(task, e)}
                    className="p-2.5 bg-slate-50 hover:bg-slate-900 text-slate-500 hover:text-white border border-slate-200 hover:border-slate-900 rounded-xl cursor-pointer transition-all active:scale-95"
                    title="Edit Task"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => handleDeleteTask(task.id || task._id, e)}
                    className="p-2.5 bg-rose-50 hover:bg-rose-600 text-rose-555 hover:text-white border border-rose-100 hover:border-rose-600 rounded-xl cursor-pointer transition-all active:scale-95"
                    title="Delete Task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ASSIGN TASK MODAL */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-6 overflow-y-auto select-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
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
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 shadow-sm">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 tracking-tight leading-none">Assign New Task</h3>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mt-1.5 block">Define squad deliverables</span>
                  </div>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
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

              <form onSubmit={handleAssignTask} className="space-y-5 text-left">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Task Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Design Landing Page wireframes"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs bg-slate-50/50 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all font-semibold text-slate-850"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Task Description</label>
                  <textarea
                    rows={3}
                    placeholder="Add detailed task instructions, check-ins, or dependencies..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs bg-slate-50/50 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all font-semibold text-slate-850 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2 text-left">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Assign Target</label>
                    <select
                      value={assignType}
                      onChange={(e) => setAssignType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 cursor-pointer transition-all"
                    >
                      <option value="all">Entire Team</option>
                      <option value="employee">Specific Employee</option>
                      <option value="intern">Specific Intern</option>
                    </select>
                  </div>

                  {assignType !== "all" && (
                    <div className="flex flex-col gap-2 text-left">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Select Assignee</label>
                      {assigneeOptions.length === 0 ? (
                        <div className="px-4 py-3 text-slate-450 border border-slate-200 bg-slate-50 text-xs font-semibold rounded-xl select-none truncate">
                          No {assignType}s in squad
                        </div>
                      ) : (
                        <select
                          value={selectedAssignee}
                          onChange={(e) => setSelectedAssignee(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 cursor-pointer transition-all"
                        >
                          {assigneeOptions.map(option => (
                            <option key={option.id || option._id} value={option.email}>
                              {option.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}

                  {assignType === "all" && (
                    <div className="flex flex-col gap-2 text-left">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Team Filter</label>
                      <select
                        disabled
                        className="w-full bg-slate-100 border border-slate-200 text-slate-400 font-bold text-xs rounded-xl px-4 py-3 select-none"
                      >
                        <option>All Squad Members</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all font-semibold text-slate-850"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-5 py-3 rounded-xl border border-slate-250 bg-white hover:bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500 cursor-pointer active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || (assignType !== "all" && assigneeOptions.length === 0)}
                    className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-[10px] font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95"
                  >
                    {submitting ? "Assigning..." : "Assign Task"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TASK DETAILS MODAL */}
      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-6 overflow-y-auto select-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTask(null)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-xl"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="relative w-full max-w-xl bg-white rounded-3xl p-6 md:p-10 shadow-2xl border border-slate-150 overflow-hidden flex flex-col gap-6 z-10 text-left"
            >
              <div className="flex justify-between items-start pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 shadow-sm">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 tracking-tight leading-none truncate max-w-[300px]">{selectedTask.title}</h3>
                    <span className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-wider mt-1.5 block">Task Audits</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-150 hover:bg-slate-100 text-slate-400 hover:text-slate-800 cursor-pointer active:scale-95 transition-all shrink-0"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <div className="space-y-6 flex-1 text-left">
                <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-5 space-y-4">
                  <div className="space-y-1.5 text-left">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Instructions</span>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedTask.description || "No description provided."}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-slate-200/60 pt-4">
                    <div className="space-y-1 text-left">
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Target Assignee</span>
                      <span className="text-xs font-bold text-slate-800 block truncate">{getAssigneeLabel(selectedTask)}</span>
                    </div>

                    <div className="space-y-1 text-left">
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Due Date</span>
                      <span className="text-xs font-bold text-slate-800 block">
                        {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : "No Due Date"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-5 space-y-3.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Execution Progress</span>
                    <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider border leading-none ${
                      getStatusBadge(selectedTask.status)
                    }`}>
                      {selectedTask.status?.replace("_", " ")}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden border border-slate-300/35">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${selectedTask.progress || 0}%` }}
                      />
                    </div>
                    <span className="text-xs font-extrabold text-slate-850 shrink-0">{selectedTask.progress || 0}%</span>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-5 space-y-2 text-left">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Assignee Notes</span>
                  <div className="bg-white border border-slate-200 rounded-xl p-3.5 min-h-[70px] text-xs text-slate-600 leading-relaxed">
                    {selectedTask.completionNotes || (
                      <span className="italic text-slate-350 font-semibold">No notes have been added by the assignee yet.</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  onClick={(e) => {
                    handleOpenEditModal(selectedTask, e);
                    setSelectedTask(null);
                  }}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95"
                >
                  Edit Task Details
                </button>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95"
                >
                  Close Drawer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT TASK MODAL */}
      <AnimatePresence>
        {editModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-6 overflow-y-auto select-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setEditModalOpen(false);
                setEditingTask(null);
              }}
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
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 shadow-sm">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 tracking-tight leading-none">Modify Assigned Task</h3>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mt-1.5 block">Update task execution requirements</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEditModalOpen(false);
                    setEditingTask(null);
                  }}
                  className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-150 hover:bg-slate-100 text-slate-400 hover:text-slate-800 cursor-pointer active:scale-95 transition-all shrink-0"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {editErrorMsg && (
                <div className="p-4 bg-rose-50 border border-rose-200/60 rounded-xl flex items-center gap-3 text-rose-700 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editErrorMsg}</span>
                </div>
              )}

              <form onSubmit={handleUpdateTask} className="space-y-5 text-left">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Task Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Design Landing Page wireframes"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs bg-slate-50/50 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all font-semibold text-slate-850"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Task Description</label>
                  <textarea
                    rows={3}
                    placeholder="Add detailed task instructions, check-ins, or dependencies..."
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs bg-slate-50/50 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all font-semibold text-slate-850 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2 text-left">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Assign Target</label>
                    <select
                      value={editAssignType}
                      onChange={(e) => setEditAssignType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 cursor-pointer transition-all"
                    >
                      <option value="all">Entire Team</option>
                      <option value="employee">Specific Employee</option>
                      <option value="intern">Specific Intern</option>
                    </select>
                  </div>

                  {editAssignType !== "all" && (
                    <div className="flex flex-col gap-2 text-left">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Select Assignee</label>
                      {editAssigneeOptions.length === 0 ? (
                        <div className="px-4 py-3 text-slate-450 border border-slate-200 bg-slate-50 text-xs font-semibold rounded-xl select-none truncate">
                          No {editAssignType}s in squad
                        </div>
                      ) : (
                        <select
                          value={editSelectedAssignee}
                          onChange={(e) => setEditSelectedAssignee(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 cursor-pointer transition-all"
                        >
                          {editAssigneeOptions.map(option => (
                            <option key={option.id || option._id} value={option.email}>
                              {option.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}

                  {editAssignType === "all" && (
                    <div className="flex flex-col gap-2 text-left">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Team Filter</label>
                      <select
                        disabled
                        className="w-full bg-slate-100 border border-slate-200 text-slate-400 font-bold text-xs rounded-xl px-4 py-3 select-none"
                      >
                        <option>All Squad Members</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Due Date</label>
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all font-semibold text-slate-850"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setEditModalOpen(false);
                      setEditingTask(null);
                    }}
                    className="px-5 py-3 rounded-xl border border-slate-250 bg-white hover:bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500 cursor-pointer active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editSubmitting || (editAssignType !== "all" && editAssigneeOptions.length === 0)}
                    className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-[10px] font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95"
                  >
                    {editSubmitting ? "Saving..." : "Save Changes"}
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
