"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  Search,
  Filter,
  Calendar,
  AlertCircle,
  Eye,
  Check,
  X,
  Paperclip,
  MessageSquare,
  Send,
  User,
  Users,
  CheckCircle2,
  Download,
  Clock,
  TrendingUp,
  FileText,
  Upload
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";

export default function InternProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  // Modals
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  // Detail Modal interaction states
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  
  // Deliverable upload
  const [isUploadingDeliverable, setIsUploadingDeliverable] = useState(false);

  // Load projects assigned to user
  const loadData = async () => {
    setLoading(true);
    try {
      const session = apiClient.getCurrentSession();
      if (session) {
        setCurrentUser(session);
        const fetchedProjects = await apiClient.getProjects({ email: session.email });
        setProjects(fetchedProjects || []);
      }
    } catch (error) {
      console.error("Failed to load intern projects:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "All" || p.status === statusFilter;
      const matchesPriority = priorityFilter === "All" || p.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [projects, searchQuery, statusFilter, priorityFilter]);

  // Open Details Modal
  const handleOpenDetails = (project) => {
    setSelectedProject(project);
    setIsDetailsModalOpen(true);
  };

  // Update own contribution progress
  const handleContributionChange = async (val) => {
    if (!selectedProject || !currentUser) return;
    const projId = selectedProject.id || selectedProject._id;
    try {
      const res = await apiClient.updateProject(projId, {
        memberEmail: currentUser.email,
        contributionProgress: val,
        updaterEmail: currentUser.email
      });
      if (res.success) {
        setProjects(prev => prev.map(p => (p.id === projId || p._id === projId) ? res.project : p));
        setSelectedProject(res.project);
      }
    } catch (err) {
      console.error("Failed to update contribution progress:", err);
    }
  };

  // Update overall progress percentage
  const handleOverallProgressChange = async (val) => {
    if (!selectedProject || !currentUser) return;
    const projId = selectedProject.id || selectedProject._id;
    try {
      const res = await apiClient.updateProject(projId, {
        progress: val,
        updaterEmail: currentUser.email
      });
      if (res.success) {
        setProjects(prev => prev.map(p => (p.id === projId || p._id === projId) ? res.project : p));
        setSelectedProject(res.project);
      }
    } catch (err) {
      console.error("Failed to update overall progress:", err);
    }
  };

  // Add Comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedProject || !currentUser) return;
    setIsSubmittingComment(true);
    const projId = selectedProject.id || selectedProject._id;
    try {
      const res = await apiClient.updateProject(projId, {
        comment: {
          author: currentUser.name || "Intern",
          email: currentUser.email,
          text: newComment.trim()
        },
        updaterEmail: currentUser.email
      });
      if (res.success) {
        setProjects(prev => prev.map(p => (p.id === projId || p._id === projId) ? res.project : p));
        setSelectedProject(res.project);
        setNewComment("");
      }
    } catch (err) {
      console.error("Failed to add comment:", err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Upload Deliverable
  const handleUploadDeliverable = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0 || !selectedProject || !currentUser) return;
    const file = files[0];
    if (file.size > 5 * 1024 * 1024) {
      alert("File exceeds 5MB size limit.");
      return;
    }

    setIsUploadingDeliverable(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const projId = selectedProject.id || selectedProject._id;
      const deliverableData = {
        name: file.name,
        url: reader.result,
        size: file.size,
        submittedBy: currentUser.email,
        submittedAt: new Date().toISOString()
      };

      try {
        const res = await apiClient.updateProject(projId, {
          deliverable: deliverableData,
          updaterEmail: currentUser.email
        });
        if (res.success) {
          setProjects(prev => prev.map(p => (p.id === projId || p._id === projId) ? res.project : p));
          setSelectedProject(res.project);
        }
      } catch (err) {
        console.error("Failed to upload deliverable:", err);
      } finally {
        setIsUploadingDeliverable(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Find own contribution progress in project
  const getOwnContribution = (project) => {
    if (!currentUser) return 0;
    const member = project.assignedMembers?.find(
      m => m.email?.toLowerCase().trim() === currentUser.email?.toLowerCase().trim()
    );
    return member ? member.contributionProgress || 0 : 0;
  };

  // Badge CSS classes
  const getStatusBadge = (status) => {
    switch (status) {
      case "Completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-250/60";
      case "In Progress":
        return "bg-blue-50 text-blue-700 border-blue-200/50";
      case "On Hold":
        return "bg-amber-50 text-amber-700 border-amber-200/50";
      default:
        return "bg-slate-100 text-slate-650 border-slate-200/80";
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "High":
        return "bg-rose-50 text-rose-700 border-rose-200/50";
      case "Medium":
        return "bg-amber-50 text-amber-700 border-amber-200/50";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200/60";
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 text-slate-500 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 rounded-full border-2 border-slate-100 border-t-amber-500"
          />
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-semibold tracking-widest text-slate-800 uppercase animate-pulse">Syncing My Projects</span>
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Establishing secure data channels...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans antialiased text-slate-800 animate-fade-in pb-12 text-left select-none">

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-[0.03] bg-gradient-to-l from-amber-650 to-transparent pointer-events-none" />
        <div className="space-y-2 text-left">
          <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-[10px] font-bold border border-amber-100">
            <Briefcase className="w-3 h-3 text-amber-650" />
            My Assigned Projects
          </div>
          <h1 className="text-2xl font-bold text-slate-900">My Projects</h1>
          <p className="text-xs font-medium text-slate-405 max-w-xl">
            View active directives assigned by your managers. Submit deliverable uploads, record progress metrics, and collaborate with team members.
          </p>
        </div>
      </div>

      {/* 👥 PROJECTS MAIN AREA */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <Briefcase className="w-4 h-4 text-amber-600" />
          <h2 className="text-sm font-bold text-slate-900">My Assignments</h2>
          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
            {filteredProjects.length}
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-4 w-full lg:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 lg:w-72">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search my projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:outline-none focus:border-amber-500 focus:bg-white transition-all font-semibold text-slate-800"
            />
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 cursor-pointer focus:outline-none focus:border-amber-500"
            >
              <option value="All">All Statuses</option>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Priority Dropdown */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 cursor-pointer focus:outline-none focus:border-amber-500"
            >
              <option value="All">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Projects */}
      <div className="w-full">
        {filteredProjects.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center shadow-sm space-y-4">
            <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mx-auto border border-slate-100/50">
              <Briefcase className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-700">No Projects Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                You do not have any projects assigned that match the filter criteria.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id || project._id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4 hover:shadow-md transition-all group text-left relative overflow-hidden"
              >
                {/* Header: Title and Badges */}
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-slate-900 text-sm tracking-tight truncate flex-1 text-left group-hover:text-amber-600 transition-colors" title={project.name}>
                    {project.name}
                  </h4>
                  <div className="flex gap-1.5 items-center shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border leading-none select-none ${getStatusBadge(project.status)}`}>
                      {project.status}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border leading-none select-none ${getPriorityBadge(project.priority)}`}>
                      {project.priority}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-505 font-medium leading-relaxed text-left line-clamp-3 min-h-[54px]">
                  {project.description || "No description provided."}
                </p>

                {/* Assigned By */}
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold border-t border-slate-100 pt-3 text-left">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Assigned by: <span className="text-slate-700">{project.assignedByEmail}</span></span>
                </div>

                {/* Timeline */}
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold text-left">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Timeline: {project.startDate ? new Date(project.startDate).toLocaleDateString([], { month: "short", day: "numeric" }) : "TBD"} - {project.dueDate ? new Date(project.dueDate).toLocaleDateString([], { month: "short", day: "numeric" }) : "TBD"}
                  </span>
                </div>

                {/* Overall Progress bar */}
                <div className="space-y-2 pt-1 text-left">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                    <span>Overall Project Progress</span>
                    <span className="text-slate-800 font-black">{project.progress || 0}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                    <div
                      style={{ width: `${project.progress || 0}%` }}
                      className="h-full bg-amber-500 rounded-full transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Personal contribution progress */}
                <div className="space-y-2 pt-1 text-left bg-amber-50/20 border border-amber-100/30 p-3 rounded-xl">
                  <div className="flex justify-between items-center text-[9px] font-bold text-amber-800 uppercase tracking-wide">
                    <span>My Contribution</span>
                    <span className="text-amber-955 font-black">{getOwnContribution(project)}%</span>
                  </div>
                  <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${getOwnContribution(project)}%` }}
                      className="h-full bg-amber-500 rounded-full transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Actions buttons */}
                <div className="pt-3 border-t border-slate-100 mt-1">
                  <button
                    onClick={() => handleOpenDetails(project)}
                    className="w-full bg-amber-50 hover:bg-amber-600 border border-amber-100 hover:border-amber-600 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-amber-700 hover:text-white cursor-pointer active:scale-95 transition-all text-center flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Project Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 🔴 PROJECT DETAILS MODAL */}
      <AnimatePresence>
        {isDetailsModalOpen && selectedProject && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="relative w-full max-w-4xl bg-white rounded-3xl p-6 md:p-10 shadow-2xl border border-slate-150 overflow-hidden flex flex-col justify-between gap-6 h-fit max-h-[90vh] z-10 text-left"
            >
              {/* Header */}
              <div className="flex justify-between items-start pb-5 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0 shadow-inner">
                    <Briefcase className="w-5.5 h-5.5" />
                  </div>
                  <div className="min-w-0 text-left">
                    <h3 className="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight leading-none truncate" title={selectedProject.name}>
                      {selectedProject.name}
                    </h3>
                    <div className="flex items-center flex-wrap gap-2 mt-2 text-[10px] font-bold text-slate-400">
                      <span>Assigned by {selectedProject.assignedByEmail}</span>
                      <span>&bull;</span>
                      <span>Timeline: {selectedProject.startDate ? new Date(selectedProject.startDate).toLocaleDateString() : "TBD"} - {selectedProject.dueDate ? new Date(selectedProject.dueDate).toLocaleDateString() : "TBD"}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-150 hover:bg-slate-100 text-slate-400 hover:text-slate-800 cursor-pointer active:scale-95 transition-all shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Columns Grid */}
              <div className="flex-1 overflow-y-auto max-h-[60vh] pr-2 grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left side: Project Specs, Contribution, Progress (7 columns) */}
                <div className="lg:col-span-7 space-y-6 text-left">
                  {/* Status & Priority Badge Panel */}
                  <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl flex items-center justify-between flex-wrap gap-4">
                    <div className="flex flex-col gap-1 text-left">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Project Status</span>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border leading-none mt-1.5 select-none w-fit block ${getStatusBadge(selectedProject.status)}`}>
                        {selectedProject.status}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 items-end">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Priority</span>
                      <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border leading-none mt-1.5 select-none ${getPriorityBadge(selectedProject.priority)}`}>
                        {selectedProject.priority}
                      </span>
                    </div>
                  </div>

                  {/* Summary Description */}
                  <div className="space-y-2 text-left">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Project Description</h5>
                    <div className="p-4 bg-slate-50 border border-slate-250/50 rounded-xl text-xs text-slate-700 leading-relaxed max-h-36 overflow-y-auto">
                      {selectedProject.description || "No description provided."}
                    </div>
                  </div>

                  {/* My Contribution progress updater */}
                  <div className="space-y-3.5 text-left bg-amber-50/20 border border-amber-100 p-5 rounded-2xl">
                    <div className="flex justify-between items-center text-[10px] font-black text-amber-800 uppercase tracking-wider">
                      <span>My Contribution Progress</span>
                      <span className="text-amber-955 text-sm font-black">{getOwnContribution(selectedProject)}%</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={getOwnContribution(selectedProject)}
                        onChange={(e) => handleContributionChange(Number(e.target.value))}
                        className="flex-1 accent-amber-500 h-1.5 bg-amber-100/50 rounded-lg cursor-pointer"
                      />
                      <span className="text-[10px] text-amber-700 font-bold">Slide to update contribution</span>
                    </div>
                  </div>

                  {/* Overall Progress Slider */}
                  <div className="space-y-3 text-left bg-slate-50 border border-slate-200/60 p-5 rounded-2xl">
                    <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      <span>Overall Project Progress</span>
                      <span className="text-slate-900 text-sm font-black">{selectedProject.progress || 0}%</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={selectedProject.progress || 0}
                        onChange={(e) => handleOverallProgressChange(Number(e.target.value))}
                        className="flex-1 accent-slate-700 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                      />
                      <span className="text-[10px] text-slate-450 font-bold">Slide to update overall</span>
                    </div>
                  </div>

                  {/* Team Members List */}
                  <div className="space-y-3 text-left">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      Assigned Team Members & Contributions
                    </h5>
                    
                    {selectedProject.assignedMembers && selectedProject.assignedMembers.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {selectedProject.assignedMembers.map((member) => (
                          <div key={member.email} className="p-3.5 border border-slate-200 rounded-xl bg-white shadow-sm flex flex-col justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center text-[9px] font-black">
                                {member.name?.split(" ").map(n => n[0]).join("") || "E"}
                              </div>
                              <div className="flex flex-col text-left min-w-0">
                                <span className="font-bold text-slate-800 leading-tight truncate">{member.name}</span>
                                <span className="text-[9px] text-slate-400 leading-tight truncate">{member.email}</span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-[9px] font-bold text-slate-450 uppercase">
                                <span>Contribution</span>
                                <span>{member.contributionProgress || 0}%</span>
                              </div>
                              <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  style={{ width: `${member.contributionProgress || 0}%` }}
                                  className="h-full bg-amber-500 rounded-full"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 rounded-xl border text-center text-xs text-slate-400 italic font-medium">
                        No assigned team members.
                      </div>
                    )}
                  </div>

                  {/* Activity Timeline */}
                  <div className="space-y-3 text-left">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                      Activity Timeline
                    </h5>
                    
                    {selectedProject.activityTimeline && selectedProject.activityTimeline.length > 0 ? (
                      <div className="border-l-2 border-slate-100 pl-4 space-y-4 max-h-56 overflow-y-auto">
                        {selectedProject.activityTimeline.map((log, idx) => (
                          <div key={idx} className="relative text-xs leading-normal">
                            <span className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-amber-500" />
                            <div className="flex flex-col text-left">
                              <p className="font-bold text-slate-800">{log.text}</p>
                              <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-slate-400 font-bold">
                                <span>{log.user}</span>
                                <span>&bull;</span>
                                <span>{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull; {new Date(log.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 rounded-xl border text-center text-xs text-slate-400 italic font-medium">
                        No activity logged yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: Deliverables, Attachments & Comments (5 columns) */}
                <div className="lg:col-span-5 space-y-6 text-left border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-6">
                  {/* Upload Deliverable Panel */}
                  <div className="bg-amber-50/20 border border-amber-100 p-5 rounded-2xl space-y-3">
                    <h5 className="text-[10px] font-black text-amber-800 uppercase tracking-widest leading-none flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-amber-600" />
                      Submit Deliverable
                    </h5>
                    <p className="text-[9.5px] text-slate-450 font-bold leading-normal">
                      Upload your project file updates or progress reports here. Limit file size to 5MB.
                    </p>
                    <label className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-amber-300 bg-white text-xs font-bold text-amber-700 hover:bg-amber-50 transition-all cursor-pointer shadow-sm select-none">
                      {isUploadingDeliverable ? (
                        <>
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-amber-500/30 border-t-amber-600 animate-spin" />
                          <span>Uploading File...</span>
                        </>
                      ) : (
                        <>
                          <Paperclip className="w-4 h-4 text-amber-500" />
                          <span>Browse Deliverable File</span>
                        </>
                      )}
                      <input
                        type="file"
                        onChange={handleUploadDeliverable}
                        className="hidden"
                        disabled={isUploadingDeliverable}
                      />
                    </label>
                  </div>

                  {/* Deliverables List */}
                  <div className="space-y-3 text-left">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                      Submitted Deliverables
                    </h5>
                    
                    {selectedProject.deliverables && selectedProject.deliverables.length > 0 ? (
                      <div className="space-y-2 max-h-36 overflow-y-auto">
                        {selectedProject.deliverables.map((file, idx) => (
                          <div key={idx} className="p-2.5 bg-emerald-50/20 border border-emerald-100 rounded-xl text-xs font-semibold shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                              <div className="flex flex-col min-w-0 text-left">
                                <span className="truncate text-slate-800 font-bold" title={file.name}>{file.name}</span>
                                <span className="text-[8px] text-slate-455 leading-tight">By {file.submittedBy} &bull; {new Date(file.submittedAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[8px] text-slate-400">({formatSize(file.size)})</span>
                              <a
                                href={file.url}
                                download={file.name}
                                className="text-emerald-600 hover:text-emerald-700 p-1 cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 rounded-xl border text-center text-xs text-slate-400 italic font-medium">
                        No deliverables uploaded yet.
                      </div>
                    )}
                  </div>

                  {/* File Attachments (from manager) */}
                  <div className="space-y-3 text-left">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                      Attached Project Files
                    </h5>

                    {selectedProject.attachedFiles && selectedProject.attachedFiles.length > 0 ? (
                      <div className="space-y-2 max-h-36 overflow-y-auto">
                        {selectedProject.attachedFiles.map((file, idx) => (
                          <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                              <span className="truncate text-slate-850 font-bold" title={file.name}>{file.name}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[8px] text-slate-400">({formatSize(file.size)})</span>
                              <a
                                href={file.url}
                                download={file.name}
                                className="text-amber-600 hover:text-amber-700 p-1 cursor-pointer"
                                title="Download File"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 rounded-xl border text-center text-xs text-slate-400 italic font-medium">
                        No files attached.
                      </div>
                    )}
                  </div>

                  {/* Comments Thread */}
                  <div className="space-y-3 text-left pt-2">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                      Comments & Updates
                    </h5>

                    {/* Thread Box */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-4 max-h-64 overflow-y-auto">
                      {selectedProject.comments && selectedProject.comments.length > 0 ? (
                        <div className="space-y-3">
                          {selectedProject.comments.map((cmt, idx) => (
                            <div key={idx} className="bg-white border border-slate-150 p-3 rounded-xl shadow-sm text-left">
                              <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 border-b border-slate-100 pb-1 mb-1.5">
                                <span>{cmt.author}</span>
                                <span>{new Date(cmt.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })} {new Date(cmt.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                              </div>
                              <p className="text-xs text-slate-750 font-medium leading-relaxed break-words">{cmt.text}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-xs text-slate-400 italic font-medium">
                          No comments posted yet.
                        </div>
                      )}

                      {/* Add Comment Field */}
                      <form onSubmit={handleAddComment} className="flex gap-2 pt-2 border-t border-slate-200">
                        <input
                          required
                          type="text"
                          placeholder="Type an update or comment..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="flex-1 bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-amber-500"
                        />
                        <button
                          type="submit"
                          disabled={isSubmittingComment || !newComment.trim()}
                          className="w-9 h-9 rounded-xl bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center cursor-pointer active:scale-95 transition-all shrink-0 disabled:opacity-50"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
