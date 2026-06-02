"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  Calendar,
  AlertCircle,
  Trash2,
  Edit3,
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
  ChevronRight,
  TrendingUp,
  FileText
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";

export default function ManagerProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  // Form states (Create / Edit)
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [formPriority, setFormPriority] = useState("Medium");
  const [formAssignedMembers, setFormAssignedMembers] = useState([]); // Array of emails
  const [formFiles, setFormFiles] = useState([]); // Array of { name, url, size }

  // Details Modal interaction states
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Load portal data
  const loadData = async () => {
    setLoading(true);
    try {
      const session = apiClient.getCurrentSession();
      if (session) {
        setCurrentUser(session);
        const [fetchedProjects, fetchedUsers, fetchedTeams] = await Promise.all([
          apiClient.getProjects({ email: session.email }),
          apiClient.getUsers(),
          apiClient.getTeams()
        ]);
        setProjects(fetchedProjects || []);
        setUsers(fetchedUsers || []);
        setTeams(fetchedTeams || []);
      }
    } catch (error) {
      console.error("Failed to load projects dataset:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter team members managed by this manager
  const managedTeamMembers = useMemo(() => {
    if (!currentUser) return [];
    const currentUserId = currentUser.id || currentUser._id;

    // Filter teams led by this manager
    const ledTeams = teams.filter(t => {
      const tMgrId = t.managerId?.id || t.managerId?._id || t.managerId;
      return tMgrId?.toString() === currentUserId?.toString();
    });

    // Gather all team member IDs
    const memberIds = new Set();
    ledTeams.forEach(t => {
      t.members?.forEach(m => {
        const id = m.id || m._id || m;
        if (id) memberIds.add(id.toString());
      });
    });

    // Resolve details for these members
    return users.filter(u => {
      const id = u.id || u._id;
      return id && memberIds.has(id.toString()) && (u.role === "Employee" || u.role === "Intern");
    });
  }, [users, teams, currentUser]);

  // Handle file browsing and conversion to Base64
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds the 5MB size limit.`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormFiles(prev => [...prev, {
          name: file.name,
          url: reader.result,
          size: file.size,
          uploadedBy: currentUser?.email || "Manager",
          uploadedAt: new Date().toISOString()
        }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = ""; // Reset input
  };

  const removeFormFile = (index) => {
    setFormFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingProject(null);
    setFormName("");
    setFormDescription("");
    setFormStartDate("");
    setFormDueDate("");
    setFormPriority("Medium");
    setFormAssignedMembers([]);
    setFormFiles([]);
    setIsCreateModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (project) => {
    setEditingProject(project);
    setFormName(project.name);
    setFormDescription(project.description || "");
    setFormStartDate(project.startDate ? project.startDate.split("T")[0] : "");
    setFormDueDate(project.dueDate ? project.dueDate.split("T")[0] : "");
    setFormPriority(project.priority || "Medium");
    setFormAssignedMembers(project.assignedMembers?.map(m => m.email) || []);
    setFormFiles(project.attachedFiles || []);
    setIsCreateModalOpen(true);
  };

  // Submit Create or Edit Project
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert("Project name is required.");
      return;
    }

    const assignedObjects = formAssignedMembers.map(email => {
      const userObj = users.find(u => u.email.toLowerCase().trim() === email.toLowerCase().trim());
      // Preserve existing contribution progress if editing
      let prevProgress = 0;
      if (editingProject) {
        const existing = editingProject.assignedMembers?.find(m => m.email.toLowerCase().trim() === email.toLowerCase().trim());
        if (existing) prevProgress = existing.contributionProgress || 0;
      }
      return {
        user: userObj ? (userObj.id || userObj._id) : null,
        email: email,
        name: userObj ? userObj.name : email.split("@")[0],
        contributionProgress: prevProgress
      };
    });

    const projectData = {
      name: formName.trim(),
      description: formDescription.trim(),
      startDate: formStartDate || null,
      dueDate: formDueDate || null,
      priority: formPriority,
      assignedMembers: assignedObjects,
      attachedFiles: formFiles,
      managerEmail: currentUser?.email
    };

    try {
      if (editingProject) {
        // Edit existing project
        const projId = editingProject.id || editingProject._id;
        const res = await apiClient.updateProject(projId, {
          ...projectData,
          updaterEmail: currentUser?.email
        });
        if (res.success) {
          setProjects(prev => prev.map(p => (p.id === projId || p._id === projId) ? res.project : p));
          setIsCreateModalOpen(false);
        } else {
          alert(res.message || "Failed to update project.");
        }
      } else {
        // Create new project
        const res = await apiClient.createProject(projectData);
        if (res.success) {
          setProjects(prev => [res.project, ...prev]);
          setIsCreateModalOpen(false);
        } else {
          alert(res.message || "Failed to create project.");
        }
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during project operation.");
    }
  };

  // Delete Project
  const handleDeleteProject = async (id) => {
    if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) return;
    try {
      const res = await apiClient.deleteProject(id);
      if (res.success) {
        setProjects(prev => prev.filter(p => p.id !== id && p._id !== id));
        if (selectedProject && (selectedProject.id === id || selectedProject._id === id)) {
          setIsDetailsModalOpen(false);
          setSelectedProject(null);
        }
      } else {
        alert(res.message || "Failed to delete project.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete project.");
    }
  };

  // Open Details Modal
  const handleOpenDetails = (project) => {
    setSelectedProject(project);
    setIsDetailsModalOpen(true);
  };

  // Change Project Status directly in Details Modal
  const handleStatusChange = async (newStatus) => {
    if (!selectedProject) return;
    const projId = selectedProject.id || selectedProject._id;
    try {
      const res = await apiClient.updateProject(projId, {
        status: newStatus,
        updaterEmail: currentUser?.email
      });
      if (res.success) {
        setProjects(prev => prev.map(p => (p.id === projId || p._id === projId) ? res.project : p));
        setSelectedProject(res.project);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Change Project Overall Progress slider directly in Details Modal
  const handleOverallProgressChange = async (val) => {
    if (!selectedProject) return;
    const projId = selectedProject.id || selectedProject._id;
    try {
      const res = await apiClient.updateProject(projId, {
        progress: val,
        updaterEmail: currentUser?.email
      });
      if (res.success) {
        setProjects(prev => prev.map(p => (p.id === projId || p._id === projId) ? res.project : p));
        setSelectedProject(res.project);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Change Member Contribution directly in Details Modal
  const handleMemberContributionChange = async (memberEmail, val) => {
    if (!selectedProject) return;
    const projId = selectedProject.id || selectedProject._id;
    try {
      const res = await apiClient.updateProject(projId, {
        memberEmail,
        contributionProgress: val,
        updaterEmail: currentUser?.email
      });
      if (res.success) {
        setProjects(prev => prev.map(p => (p.id === projId || p._id === projId) ? res.project : p));
        setSelectedProject(res.project);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Comment in Details Modal
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedProject) return;
    setIsSubmittingComment(true);
    const projId = selectedProject.id || selectedProject._id;
    try {
      const res = await apiClient.updateProject(projId, {
        comment: {
          author: currentUser?.name || "Manager",
          email: currentUser?.email,
          text: newComment.trim()
        },
        updaterEmail: currentUser?.email
      });
      if (res.success) {
        setProjects(prev => prev.map(p => (p.id === projId || p._id === projId) ? res.project : p));
        setSelectedProject(res.project);
        setNewComment("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // File Upload directly in Details Modal
  const handleDetailFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0 || !selectedProject) return;
    const file = files[0];
    if (file.size > 5 * 1024 * 1024) {
      alert("File exceeds 5MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const projId = selectedProject.id || selectedProject._id;
      const fileData = {
        name: file.name,
        url: reader.result,
        size: file.size,
        uploadedBy: currentUser?.email,
        uploadedAt: new Date().toISOString()
      };
      
      const updatedFilesList = [...(selectedProject.attachedFiles || []), fileData];
      try {
        const res = await apiClient.updateProject(projId, {
          attachedFiles: updatedFilesList,
          updaterEmail: currentUser?.email
        });
        if (res.success) {
          setProjects(prev => prev.map(p => (p.id === projId || p._id === projId) ? res.project : p));
          setSelectedProject(res.project);
        }
      } catch (err) {
        console.error(err);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Toggle assigned member check state in form
  const toggleFormMember = (email) => {
    setFormAssignedMembers(prev => 
      prev.includes(email) ? prev.filter(m => m !== email) : [...prev, email]
    );
  };

  // Filtered projects list based on search/dropdown queries
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "All" || p.status === statusFilter;
      const matchesPriority = priorityFilter === "All" || p.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [projects, searchQuery, statusFilter, priorityFilter]);

  // Aggregate project statistics
  const stats = useMemo(() => {
    const total = projects.length;
    const completed = projects.filter(p => p.status === "Completed").length;
    const inProgress = projects.filter(p => p.status === "In Progress").length;
    const onHold = projects.filter(p => p.status === "On Hold").length;
    const notStarted = projects.filter(p => p.status === "Not Started").length;

    return { total, completed, inProgress, onHold, notStarted };
  }, [projects]);

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
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 rounded-full border-2 border-slate-100 border-t-emerald-500"
          />
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-semibold tracking-widest text-slate-800 uppercase animate-pulse">Syncing Project Pipeline</span>
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Establishing secure data channels...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans antialiased text-slate-800 animate-fade-in pb-12 text-left select-none">

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-[0.03] bg-gradient-to-l from-emerald-650 to-transparent pointer-events-none" />
        <div className="space-y-2 text-left">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold border border-emerald-100">
            <Briefcase className="w-3 h-3 text-emerald-650" />
            Project Operations
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Project Board</h1>
          <p className="text-xs font-medium text-slate-405 max-w-xl">
            Create objectives, assign members from your department's teams, audit overall contributions, and track milestones in real time.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="z-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-3 rounded-xl flex items-center justify-center gap-2.5 shadow-md shadow-emerald-100 hover:shadow-xl hover:shadow-emerald-200 transition-all cursor-pointer active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3px]" />
          CREATE PROJECT
        </button>
      </div>

      {/* 📊 KPI CARDS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          { label: "Total Projects", val: stats.total, color: "text-slate-900", bg: "bg-white", border: "border-slate-200" },
          { label: "Not Started", val: stats.notStarted, color: "text-slate-500", bg: "bg-slate-50", border: "border-slate-200/60" },
          { label: "In Progress", val: stats.inProgress, color: "text-blue-650", bg: "bg-blue-50/20", border: "border-blue-100" },
          { label: "On Hold", val: stats.onHold, color: "text-amber-650", bg: "bg-amber-50/20", border: "border-amber-100" },
          { label: "Completed", val: stats.completed, color: "text-emerald-650", bg: "bg-emerald-50/20", border: "border-emerald-100" }
        ].map((card, i) => (
          <div key={i} className={`p-5 rounded-2xl border ${card.border} ${card.bg} shadow-sm text-left flex flex-col justify-between h-24`}>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{card.label}</span>
            <span className={`text-3xl font-black ${card.color} tracking-tighter leading-none`}>{card.val}</span>
          </div>
        ))}
      </div>

      {/* 👥 PROJECTS MAIN AREA */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <Briefcase className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm font-bold text-slate-900">Project Pipeline</h2>
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
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-semibold text-slate-800"
            />
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 cursor-pointer focus:outline-none focus:border-emerald-500"
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
              className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 cursor-pointer focus:outline-none focus:border-emerald-500"
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
                No projects match the selected filter criteria. Clear filters or create a new project.
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
                  <h4 className="font-bold text-slate-900 text-sm tracking-tight truncate flex-1 text-left group-hover:text-emerald-700 transition-colors" title={project.name}>
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
                <p className="text-xs text-slate-500 font-medium leading-relaxed text-left line-clamp-3 min-h-[54px]">
                  {project.description || "No description provided."}
                </p>

                {/* Timeline & Files info */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {project.startDate ? new Date(project.startDate).toLocaleDateString([], { month: "short", day: "numeric" }) : "TBD"} - {project.dueDate ? new Date(project.dueDate).toLocaleDateString([], { month: "short", day: "numeric" }) : "TBD"}
                    </span>
                  </div>
                  {project.attachedFiles?.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Paperclip className="w-3 h-3 text-slate-400" />
                      <span>{project.attachedFiles.length} file(s)</span>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                <div className="space-y-2 pt-1 text-left">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                    <span>Overall Progress</span>
                    <span className="text-slate-800 font-black">{project.progress || 0}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                    <div
                      style={{ width: `${project.progress || 0}%` }}
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Assigned Avatars Row */}
                <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-450">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Assigned</span>
                  </div>
                  <div className="flex -space-x-2.5 overflow-hidden">
                    {project.assignedMembers && project.assignedMembers.length > 0 ? (
                      project.assignedMembers.map((member, mIdx) => (
                        <div
                          key={member.email}
                          title={`${member.name} (${member.email}) - ${member.contributionProgress || 0}%`}
                          className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-extrabold shadow-sm bg-gradient-to-br from-emerald-500 to-indigo-650 text-white shrink-0 cursor-default"
                        >
                          {member.name?.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() || "M"}
                        </div>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-350 italic font-semibold">None</span>
                    )}
                  </div>
                </div>

                {/* Actions buttons */}
                <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-slate-100 mt-1">
                  <button
                    onClick={() => handleOpenDetails(project)}
                    className="flex items-center justify-center gap-1 p-2 rounded-lg text-slate-650 hover:bg-slate-50 border border-slate-200/60 font-bold text-[10px] cursor-pointer transition-all active:scale-95"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View
                  </button>
                  <button
                    onClick={() => handleOpenEdit(project)}
                    className="flex items-center justify-center gap-1 p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 border border-transparent font-bold text-[10px] cursor-pointer transition-all active:scale-95"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteProject(project.id || project._id)}
                    className="flex items-center justify-center gap-1 p-2 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent font-bold text-[10px] cursor-pointer transition-all active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 🔴 CREATE / EDIT PROJECT MODAL */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl p-6 md:p-10 shadow-2xl border border-slate-150 overflow-hidden flex flex-col justify-between gap-6 h-fit max-h-[90vh] z-10 text-left"
            >
              <div className="flex justify-between items-start pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 shadow-inner">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight leading-none">
                      {editingProject ? "Edit Project" : "Create Project"}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">
                      {editingProject ? "Update settings & timeline" : "Assign and launch new targets"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-150 hover:bg-slate-100 text-slate-400 hover:text-slate-800 cursor-pointer active:scale-95 transition-all shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto max-h-[60vh] pr-2 space-y-5">
                {/* Project Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Project Name *</label>
                  <input
                    required
                    type="text"
                    placeholder="Enter project title..."
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:outline-none transition-all font-semibold"
                  />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Enter project summary and targets..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:outline-none transition-all font-semibold resize-none"
                  />
                </div>

                {/* Dates Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Start Date</label>
                    <input
                      type="date"
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:outline-none transition-all font-semibold"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Due Date</label>
                    <input
                      type="date"
                      value={formDueDate}
                      onChange={(e) => setFormDueDate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:outline-none transition-all font-semibold"
                    />
                  </div>
                </div>

                {/* Priority Selection */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Priority</label>
                  <div className="grid grid-cols-3 gap-3">
                    {["Low", "Medium", "High"].map((p) => {
                      const isActive = formPriority === p;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setFormPriority(p)}
                          className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                            isActive
                              ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                              : "bg-slate-50 text-slate-500 hover:text-slate-800 hover:bg-slate-100/60 border-slate-200"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Assign Members Multi-select */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Assign Team Members</label>
                  {managedTeamMembers.length === 0 ? (
                    <div className="p-4 rounded-xl border bg-slate-50 text-xs text-slate-400 italic text-center font-medium">
                      No members registered in your managed teams. Assign squad members in Team Management first.
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-slate-100 bg-slate-50/20">
                      {managedTeamMembers.map((member) => {
                        const isAssigned = formAssignedMembers.includes(member.email);
                        return (
                          <div
                            key={member.email}
                            onClick={() => toggleFormMember(member.email)}
                            className="flex items-center justify-between p-3.5 hover:bg-slate-100/50 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${member.badgeColor || "bg-slate-200 text-slate-700"}`}>
                                {member.initials || member.name?.split(" ").map(n => n[0]).join("") || "E"}
                              </div>
                              <div className="flex flex-col text-left">
                                <span className="text-xs font-bold text-slate-800 leading-tight">{member.name}</span>
                                <span className="text-[9px] text-slate-450 leading-tight mt-0.5">{member.email} ({member.role})</span>
                              </div>
                            </div>
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                              isAssigned
                                ? "bg-emerald-500 border-emerald-500 text-white"
                                : "border-slate-300 bg-white"
                            }`}>
                              {isAssigned && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* File Attachment */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Attached Files (Optional)</label>
                  <div className="flex flex-col gap-3 p-4 border border-dashed border-slate-250 rounded-xl bg-slate-50/30">
                    <label className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-650 hover:bg-slate-50 hover:text-slate-800 transition-all cursor-pointer shadow-sm">
                      <Paperclip className="w-4 h-4 text-slate-400" />
                      <span>Browse Files</span>
                      <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>

                    {/* Attached list */}
                    {formFiles.length > 0 && (
                      <div className="space-y-2 mt-2">
                        {formFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold shadow-sm">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                              <span className="truncate text-slate-800" title={file.name}>{file.name}</span>
                              <span className="text-[9px] text-slate-400 shrink-0">({formatSize(file.size)})</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFormFile(idx)}
                              className="text-rose-600 hover:text-rose-700 p-1 cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </form>

              <div className="flex items-center justify-between pt-5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-850 hover:bg-slate-50 border border-slate-200 cursor-pointer active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleFormSubmit}
                  className="px-6 py-2.5 rounded-xl text-xs font-extrabold text-white bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-550/15 cursor-pointer active:scale-95 transition-all"
                >
                  {editingProject ? "Update Project" : "Create Project"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 shadow-inner">
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
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => handleDeleteProject(selectedProject.id || selectedProject._id)}
                    className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-150 hover:bg-rose-100 text-rose-500 hover:text-rose-700 flex items-center justify-center cursor-pointer active:scale-95 transition-all shrink-0"
                    title="Delete Project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsDetailsModalOpen(false)}
                    className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-150 hover:bg-slate-100 text-slate-400 hover:text-slate-800 cursor-pointer active:scale-95 transition-all shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Scrollable Columns Grid */}
              <div className="flex-1 overflow-y-auto max-h-[60vh] pr-2 grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left side: Metadata & Contributions (7 columns) */}
                <div className="lg:col-span-7 space-y-6 text-left">
                  {/* Status, Priority Controls */}
                  <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl flex items-center justify-between flex-wrap gap-4">
                    <div className="flex flex-col gap-1 text-left">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Project Status</span>
                      <select
                        value={selectedProject.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 cursor-pointer mt-1 focus:outline-none"
                      >
                        <option value="Not Started">Not Started</option>
                        <option value="In Progress">In Progress</option>
                        <option value="On Hold">On Hold</option>
                        <option value="Completed">Completed</option>
                      </select>
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

                  {/* Overall Progress Slider */}
                  <div className="space-y-3 text-left bg-slate-50 border border-slate-200/60 p-5 rounded-2xl">
                    <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      <span>Overall Progress</span>
                      <span className="text-slate-900 text-sm font-black">{selectedProject.progress || 0}%</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={selectedProject.progress || 0}
                        onChange={(e) => handleOverallProgressChange(Number(e.target.value))}
                        className="flex-1 accent-emerald-500 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                      />
                      <span className="text-[10px] text-slate-400 font-bold">Slide to update</span>
                    </div>
                  </div>

                  {/* Member Contributions */}
                  <div className="space-y-3 text-left">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      Assignees & Contributions
                    </h5>
                    
                    {selectedProject.assignedMembers && selectedProject.assignedMembers.length > 0 ? (
                      <div className="space-y-3.5">
                        {selectedProject.assignedMembers.map((member) => (
                          <div key={member.email} className="p-4 border border-slate-200 rounded-xl bg-white space-y-3 shadow-sm">
                            <div className="flex justify-between items-center text-xs">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center text-[9px] font-black">
                                  {member.name?.split(" ").map(n => n[0]).join("") || "E"}
                                </div>
                                <div className="flex flex-col text-left">
                                  <span className="font-bold text-slate-800 leading-tight">{member.name}</span>
                                  <span className="text-[9px] text-slate-400 leading-tight">{member.email}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-slate-500">Contribution:</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={member.contributionProgress || 0}
                                  onChange={(e) => handleMemberContributionChange(member.email, Math.min(100, Math.max(0, Number(e.target.value))))}
                                  className="w-14 px-1.5 py-1 border border-slate-200 rounded-lg text-center font-black text-slate-800 text-xs focus:outline-none focus:border-emerald-500"
                                />
                                <span className="font-extrabold text-slate-800">%</span>
                              </div>
                            </div>
                            {/* Member progress bar */}
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                              <div
                                style={{ width: `${member.contributionProgress || 0}%` }}
                                className="h-full bg-indigo-500 rounded-full"
                              />
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
                            <span className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-emerald-500" />
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

                {/* Right side: Attachments, Deliverables & Comments (5 columns) */}
                <div className="lg:col-span-5 space-y-6 text-left border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-6">
                  {/* File Attachments */}
                  <div className="space-y-3 text-left">
                    <div className="flex justify-between items-center">
                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none flex items-center gap-1.5">
                        <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                        Attached Files
                      </h5>
                      <label className="text-[9px] font-black uppercase text-emerald-600 hover:text-emerald-700 cursor-pointer flex items-center gap-0.5">
                        <Plus className="w-3 h-3 stroke-[2.5px]" />
                        <span>Add File</span>
                        <input
                          type="file"
                          onChange={handleDetailFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {selectedProject.attachedFiles && selectedProject.attachedFiles.length > 0 ? (
                      <div className="space-y-2 max-h-36 overflow-y-auto">
                        {selectedProject.attachedFiles.map((file, idx) => (
                          <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                              <span className="truncate text-slate-800" title={file.name}>{file.name}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[8px] text-slate-400">({formatSize(file.size)})</span>
                              <a
                                href={file.url}
                                download={file.name}
                                className="text-emerald-600 hover:text-emerald-700 p-1 cursor-pointer"
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
                                <span className="text-[8px] text-slate-450 leading-tight">By {file.submittedBy} &bull; {new Date(file.submittedAt).toLocaleDateString()}</span>
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
                          className="flex-1 bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          type="submit"
                          disabled={isSubmittingComment || !newComment.trim()}
                          className="w-9 h-9 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center cursor-pointer active:scale-95 transition-all shrink-0 disabled:opacity-50"
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
