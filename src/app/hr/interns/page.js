"use client";

import { useState, useEffect, Fragment, useMemo } from "react";
import { 
  Users, 
  Search, 
  GraduationCap, 
  Award, 
  Phone, 
  Calendar, 
  MapPin, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  XCircle, 
  Plus, 
  Edit, 
  BookOpen, 
  FileText, 
  CheckCircle, 
  Download, 
  Trash2, 
  Clock, 
  PlusCircle, 
  User, 
  Send,
  Building,
  UserCheck,
  TrendingUp,
  FileSpreadsheet
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";

export default function HRInternsDashboard() {
  // Data states
  const [interns, setInterns] = useState([]);
  const [teams, setTeams] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Modal / Selection states
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  const [editingIntern, setEditingIntern] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const [assignTargetIntern, setAssignTargetIntern] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  
  const [isCreateTrainingOpen, setIsCreateTrainingOpen] = useState(false);
  const [isAssignTrainingOpen, setIsAssignTrainingOpen] = useState(false);

  // Sub-data modals (when viewing profile)
  const [activeTab, setActiveTab] = useState("personal"); // personal, internship, performance
  const [viewingAttendance, setViewingAttendance] = useState(null); // intern email for attendance view
  const [viewingProjects, setViewingProjects] = useState(null); // intern email
  const [viewingReports, setViewingReports] = useState(null); // intern email
  const [internAttendanceRecords, setInternAttendanceRecords] = useState([]);

  // Training assignment form states
  const [assignTrainingId, setAssignTrainingId] = useState("");
  const [assignToType, setAssignToType] = useState("all"); // all, team, department, individual
  const [assignToValue, setAssignToValue] = useState("");
  const [assignDueDate, setAssignDueDate] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  // New Training Module form states
  const [newTrainingName, setNewTrainingName] = useState("");
  const [newTrainingDesc, setNewTrainingDesc] = useState("");
  const [newTrainingCategory, setNewTrainingCategory] = useState("Onboarding");
  const [newTrainingDuration, setNewTrainingDuration] = useState("2 hours");
  const [learningMaterials, setLearningMaterials] = useState([]);
  const [materialName, setMaterialName] = useState("");
  const [materialType, setMaterialType] = useState("PDF");
  const [materialUrl, setMaterialUrl] = useState("");
  const [isCreatingTraining, setIsCreatingTraining] = useState(false);

  // Certificate modal
  const [selectedCertificate, setSelectedCertificate] = useState(null);

  // Fetch initial data
  const loadData = async () => {
    try {
      setIsLoading(true);
      const allUsers = await apiClient.getUsers();
      const resolvedInterns = allUsers.filter(u => u.role === "Intern");
      setInterns(resolvedInterns);

      const allTeams = await apiClient.getTeams();
      setTeams(allTeams);

      const allTrainings = await apiClient.getTrainings();
      setTrainings(allTrainings);

      const allAssignments = await apiClient.getTrainingAssignments();
      setAssignments(allAssignments);

      // Try fetching reports
      const reportsRes = await fetch("/api/reports");
      if (reportsRes.ok) {
        const rData = await reportsRes.json();
        setReports(rData);
      }
      
      // Try fetching projects
      const projectsRes = await fetch("/api/projects");
      if (projectsRes.ok) {
        const pData = await projectsRes.json();
        setProjects(pData);
      }
    } catch (err) {
      console.error("Error loading intern page data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Helper: Find assigned team and manager from MDB teams list
  const resolveInternTeamAndManager = (internId, internEmail) => {
    const team = teams.find(t => 
      t.members?.some(m => m.id === internId || m._id === internId || m.email === internEmail)
    );
    return {
      teamName: team ? team.name : "Not Assigned",
      managerName: team?.managerId ? (team.managerId.name || team.managerId) : "Not Assigned"
    };
  };

  // Helper: calculate internship duration in weeks/months
  const calculateDuration = (start, end) => {
    if (!start || !end) return "Not Set";
    const sDate = new Date(start);
    const eDate = new Date(end);
    const diffTime = Math.abs(eDate - sDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 30) {
      const months = Math.round(diffDays / 30);
      return `${months} Month${months > 1 ? "s" : ""}`;
    }
    const weeks = Math.round(diffDays / 7);
    return `${weeks} Week${weeks > 1 ? "s" : ""}`;
  };

  // Statistics Left Section (Intern Details Dashboard)
  const statsLeft = useMemo(() => {
    const total = interns.length;
    const active = interns.filter(i => i.status === "Active").length;
    const completed = interns.filter(i => i.status === "Completed").length;
    
    // Upcoming completions (Active status and endDate within next 30 days)
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const upcoming = interns.filter(i => {
      if (i.status !== "Active" || !i.endDate) return false;
      const end = new Date(i.endDate);
      return end >= today && end <= thirtyDaysFromNow;
    }).length;

    // Average duration calculation in months
    let totalMonths = 0;
    let validCount = 0;
    interns.forEach(i => {
      if (i.startDate && i.endDate) {
        const s = new Date(i.startDate);
        const e = new Date(i.endDate);
        const diffTime = Math.abs(e - s);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        totalMonths += diffDays / 30;
        validCount++;
      }
    });
    const avgDuration = validCount > 0 ? (totalMonths / validCount).toFixed(1) : "3.0";

    return { total, active, completed, upcoming, avgDuration: `${avgDuration} Months` };
  }, [interns]);

  // Statistics Right Section (Training Dashboard)
  const statsRight = useMemo(() => {
    const totalModules = trainings.length;
    const totalAssigned = assignments.length;
    const completed = assignments.filter(a => a.status === "Completed").length;
    const pending = assignments.filter(a => a.status !== "Completed").length;
    return { totalModules, totalAssigned, completed, pending };
  }, [trainings, assignments]);

  // Handle Search and filters for Interns List
  const filteredInterns = interns.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase()) || i.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Dept filter
    const matchesDept = filterDept === "all" || i.department === filterDept;

    // Status filter
    const matchesStatus = filterStatus === "all" || i.status === filterStatus;

    return matchesSearch && matchesDept && matchesStatus;
  });

  // Extract unique departments for dropdown filter
  const departments = useMemo(() => {
    const depts = new Set(interns.map(i => i.department).filter(Boolean));
    return Array.from(depts);
  }, [interns]);

  // Edit Intern Form submit handler
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingIntern) return;

    try {
      const res = await apiClient.updateUserInternInfo(editingIntern.id || editingIntern._id, {
        name: editingIntern.name,
        phone: editingIntern.phone,
        college: editingIntern.college,
        course: editingIntern.course,
        startDate: editingIntern.startDate,
        endDate: editingIntern.endDate,
        status: editingIntern.status,
        department: editingIntern.department
      });

      if (res.success) {
        setIsEditModalOpen(false);
        setEditingIntern(null);
        await loadData();
        alert("Intern details updated successfully!");
      } else {
        alert("Failed to update intern details: " + res.message);
      }
    } catch (err) {
      console.error(err);
      alert("Error editing intern.");
    }
  };

  // Add learning material to state list during creation
  const addMaterialToList = () => {
    if (!materialName || !materialUrl) {
      alert("Please fill in both material name and link/url");
      return;
    }
    setLearningMaterials(prev => [...prev, { name: materialName, type: materialType, url: materialUrl }]);
    setMaterialName("");
    setMaterialUrl("");
  };

  // Submit training module creation
  const handleCreateTraining = async (e) => {
    e.preventDefault();
    if (!newTrainingName) {
      alert("Training Name is required");
      return;
    }

    setIsCreatingTraining(true);
    try {
      const res = await apiClient.createTraining({
        name: newTrainingName,
        description: newTrainingDesc,
        category: newTrainingCategory,
        duration: newTrainingDuration,
        status: "Active",
        materials: learningMaterials
      });

      if (res.success) {
        setNewTrainingName("");
        setNewTrainingDesc("");
        setNewTrainingCategory("Onboarding");
        setNewTrainingDuration("2 hours");
        setLearningMaterials([]);
        setIsCreateTrainingOpen(false);
        await loadData();
        alert("Training module created successfully!");
      } else {
        alert("Failed to create training: " + res.message);
      }
    } catch (err) {
      console.error(err);
      alert("Error creating training module");
    } finally {
      setIsCreatingTraining(false);
    }
  };

  // Assign training submit
  const handleAssignTraining = async (e) => {
    e.preventDefault();
    if (!assignTrainingId || !assignDueDate) {
      alert("Please select a training module and due date");
      return;
    }

    setIsAssigning(true);
    try {
      const payload = {
        trainingId: assignTrainingId,
        assignedToType: assignToType,
        assignedToValue: assignToType === "all" ? "all" : assignToValue,
        dueDate: assignDueDate
      };

      const res = await apiClient.assignTraining(payload);
      if (res.success) {
        setAssignTrainingId("");
        setAssignToType("all");
        setAssignToValue("");
        setAssignDueDate("");
        setIsAssignTrainingOpen(false);
        setIsAssignModalOpen(false);
        await loadData();
        alert(res.message);
      } else {
        alert("Assignment failed: " + res.message);
      }
    } catch (err) {
      console.error(err);
      alert("Error assigning training module");
    } finally {
      setIsAssigning(false);
    }
  };

  // Open Assign Training for a specific individual intern
  const openAssignForIndividual = (intern) => {
    setAssignToType("individual");
    setAssignToValue(intern.email);
    setAssignTargetIntern(intern);
    setIsAssignModalOpen(true);
  };

  // View Attendance Modal trigger
  const triggerViewAttendance = async (intern) => {
    setViewingAttendance(intern);
    setInternAttendanceRecords([]);
    try {
      const res = await fetch(`/api/attendance?email=${encodeURIComponent(intern.email)}`);
      if (res.ok) {
        const data = await res.json();
        setInternAttendanceRecords(data.attendance || []);
      }
    } catch (err) {
      console.warn("Failed to retrieve attendance logs", err);
    }
  };

  // Fetch performance indicators for profile details modal
  const resolvePerformanceStats = (internEmail) => {
    const totalAssigned = assignments.filter(a => a.internEmail === internEmail).length;
    const completedAssigned = assignments.filter(a => a.internEmail === internEmail && a.status === "Completed").length;
    const completionRate = totalAssigned > 0 ? Math.round((completedAssigned / totalAssigned) * 100) : 0;

    const internProjects = projects.filter(p => p.assignedMembers?.some(m => m.email === internEmail));
    const internReports = reports.filter(r => r.employeeEmail === internEmail);

    return {
      trainingCompletionRate: `${completionRate}%`,
      assignedProjectsCount: internProjects.length,
      submittedReportsCount: internReports.length
    };
  };

  return (
    <div className="flex flex-col gap-8 text-left max-w-[1600px] mx-auto font-sans antialiased text-slate-800">
      
      {/* Title Header Section */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Intern Management Console</h1>
        <p className="text-xs text-slate-500">Supervise interns directory records, delegate training schedules, and review learning progressions.</p>
      </div>

      {/* Main Core Columns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: TRAINING & LEARNING SECTION (4 Columns)                     */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Quick Action Buttons */}
          <div className="flex gap-3">
            <button 
              onClick={() => setIsCreateTrainingOpen(true)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-105 cursor-pointer transition-all shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              Create Module
            </button>
            <button 
              onClick={() => setIsAssignTrainingOpen(true)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer transition-all shadow-sm border border-emerald-600"
            >
              <Send className="w-3.5 h-3.5" />
              Assign Training
            </button>
          </div>
          
          {/* Training dashboard statistics */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col gap-4 text-left">
            <h3 className="font-bold text-slate-900 text-sm">Training Hub Overview</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-center">
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Total Modules</span>
                <span className="block text-xl font-black text-slate-800 mt-1">{statsRight.totalModules}</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-center">
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Assignments</span>
                <span className="block text-xl font-black text-slate-800 mt-1">{statsRight.totalAssigned}</span>
              </div>
              <div className="bg-emerald-50/50 border border-emerald-100/70 rounded-xl p-3.5 text-center">
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-emerald-600">Completed</span>
                <span className="block text-xl font-black text-emerald-800 mt-1">{statsRight.completed}</span>
              </div>
              <div className="bg-indigo-50/40 border border-indigo-100/60 rounded-xl p-3.5 text-center">
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-indigo-650">Pending</span>
                <span className="block text-xl font-black text-indigo-800 mt-1">{statsRight.pending}</span>
              </div>
            </div>
          </div>

          {/* Training Modules List */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col text-left">
            <div className="border-b border-slate-150/75 px-5 py-4 bg-slate-50/40 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-xs">Training Modules</h3>
              <span className="text-[9px] font-bold bg-slate-200 px-2 py-0.5 rounded text-slate-600">{trainings.length} Modules</span>
            </div>
            <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
              {trainings.map(t => (
                <div key={t.id || t._id} className="p-4 hover:bg-slate-50/30 transition-all text-xs flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 truncate max-w-[200px]">{t.name}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">{t.category}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">{t.description}</p>
                  <div className="flex items-center justify-between mt-2 text-[9px] font-bold text-slate-500">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-400" /> {t.duration}</span>
                    <span>{t.materials?.length || 0} Materials</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assigned Training Progress Tracking */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col text-left">
            <div className="border-b border-slate-150/75 px-5 py-4 bg-slate-50/40">
              <h3 className="font-bold text-slate-900 text-xs">Intern Syllabus Tracking</h3>
            </div>
            <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
              {assignments.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-semibold">No active training logs assigned yet.</div>
              ) : (
                assignments.map(a => (
                  <div key={a.id || a._id} className="p-4 hover:bg-slate-50/30 transition-all text-xs flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-805 leading-tight">{a.internName}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">{a.trainingName}</span>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold border ${
                        a.status === "Completed"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : a.status === "In Progress"
                          ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}>
                        {a.status}
                      </span>
                    </div>
                    {/* Progress slider bar */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${a.completionPercentage}%` }} />
                      </div>
                      <span className="text-[9px] font-black text-slate-500 shrink-0">{a.completionPercentage}%</span>
                    </div>
                    {/* Certificate download triggers */}
                    {a.status === "Completed" && (
                      <button 
                        onClick={() => setSelectedCertificate(a)}
                        className="mt-1.5 inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-755 hover:underline text-left cursor-pointer"
                      >
                        <Award className="w-3.5 h-3.5" />
                        View/Download Syllabus Certificate
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: INTERN DETAILS SECTION (8 Columns)                          */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Intern List Table Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            
            {/* Table Filters Toolbar */}
            <div className="border-b border-slate-100 px-6 py-4.5 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="font-bold text-slate-900 text-sm">Active Interns Directory</h3>
              
              <div className="flex flex-wrap items-center gap-3">
                
                {/* Search Inputs */}
                <div className="relative w-full sm:w-56">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <Search className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search interns by name..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-slate-350 text-slate-800"
                  />
                </div>

                {/* Filter Department */}
                <select
                  value={filterDept}
                  onChange={e => setFilterDept(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none cursor-pointer font-bold text-slate-700"
                >
                  <option value="all">All Depts</option>
                  {departments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                {/* Filter Status */}
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none cursor-pointer font-bold text-slate-700"
                >
                  <option value="all">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Terminated">Terminated</option>
                </select>

              </div>
            </div>

            {/* Core Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                    <th className="px-5 py-4">Intern Info</th>
                    <th className="px-5 py-4">Department & Team</th>
                    <th className="px-5 py-4">Mentor Manager</th>
                    <th className="px-5 py-4">Start / End Date</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {isLoading ? (
                    <tr>
                      <td colSpan="6" className="py-20 text-center text-slate-400 font-bold">Querying intern databases...</td>
                    </tr>
                  ) : filteredInterns.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-16 text-center text-slate-400 font-semibold">No interns matching filter queries.</td>
                    </tr>
                  ) : (
                    filteredInterns.map(intern => {
                      const rel = resolveInternTeamAndManager(intern.id || intern._id, intern.email);
                      return (
                        <tr key={intern.id || intern._id} className="hover:bg-slate-50/40 transition-colors">
                          
                          {/* Intern Photo & Name */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              {intern.userPhoto ? (
                                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-slate-200 shrink-0 shadow-inner bg-slate-100">
                                  <img src={intern.userPhoto} alt={intern.name} className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${intern.badgeColor || 'bg-amber-600 text-white'}`}>
                                  {intern.initials || "IN"}
                                </div>
                              )}
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900 leading-tight">{intern.name}</span>
                                <span className="text-[10px] text-slate-400 mt-0.5">{intern.email}</span>
                              </div>
                            </div>
                          </td>

                          {/* Dept / Team */}
                          <td className="px-5 py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800">{intern.department}</span>
                              <span className="text-[10px] text-slate-400 mt-0.5">Team: {rel.teamName}</span>
                            </div>
                          </td>

                          {/* Manager */}
                          <td className="px-5 py-4">
                            <span className="font-semibold text-slate-600">{rel.managerName}</span>
                          </td>

                          {/* Start/End */}
                          <td className="px-5 py-4">
                            <div className="flex flex-col text-[10px] font-semibold text-slate-600">
                              <span>S: {intern.startDate || "Not set"}</span>
                              <span className="mt-0.5">E: {intern.endDate || "Not set"}</span>
                              <span className="text-[9px] text-slate-400 font-extrabold mt-0.5">Duration: {calculateDuration(intern.startDate, intern.endDate)}</span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                              intern.status === "Active"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-100"
                                : intern.status === "Completed"
                                ? "bg-amber-50 text-amber-800 border-amber-100"
                                : "bg-rose-50 text-rose-800 border-rose-100"
                            }`}>
                              {intern.status || "Active"}
                            </span>
                          </td>

                          {/* Action drop buttons */}
                          <td className="px-5 py-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button 
                                onClick={() => {
                                  setSelectedIntern(intern);
                                  setIsProfileModalOpen(true);
                                  setActiveTab("personal");
                                }}
                                className="px-2 py-1 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold hover:bg-slate-100 transition-colors"
                              >
                                Profile
                              </button>
                              <button 
                                onClick={() => {
                                  setEditingIntern(intern);
                                  setIsEditModalOpen(true);
                                }}
                                className="p-1 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                                title="Edit Details"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => openAssignForIndividual(intern)}
                                className="p-1 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
                                title="Assign Training"
                              >
                                <GraduationCap className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* MODAL: INTERN PROFILE VIEWER                                              */}
      {/* ========================================================================= */}
      {isProfileModalOpen && selectedIntern && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-left">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col animate-fade-in">
            {/* Header */}
            <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Intern Profile Dossier</h3>
              </div>
              <button onClick={() => setIsProfileModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            {/* Info tabs */}
            <div className="flex border-b border-slate-100 text-xs font-bold text-slate-500 px-6 bg-slate-50/20">
              <button 
                onClick={() => setActiveTab("personal")}
                className={`py-3 px-4 border-b-2 transition-all ${activeTab === "personal" ? "border-emerald-600 text-emerald-700" : "border-transparent hover:text-slate-800"}`}
              >
                Personal Details
              </button>
              <button 
                onClick={() => setActiveTab("internship")}
                className={`py-3 px-4 border-b-2 transition-all ${activeTab === "internship" ? "border-emerald-600 text-emerald-700" : "border-transparent hover:text-slate-800"}`}
              >
                Internship Details
              </button>
              <button 
                onClick={() => setActiveTab("performance")}
                className={`py-3 px-4 border-b-2 transition-all ${activeTab === "performance" ? "border-emerald-600 text-emerald-700" : "border-transparent hover:text-slate-800"}`}
              >
                Performance Metrics
              </button>
            </div>
            {/* Tab contents */}
            <div className="p-6 overflow-y-auto max-h-[50vh] text-xs">
              {activeTab === "personal" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-semibold text-slate-650">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Full Name</span>
                    <span className="text-slate-900 font-bold">{selectedIntern.name}</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Email Address</span>
                    <span className="text-slate-900 font-bold">{selectedIntern.email}</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Phone Number</span>
                    <span>{selectedIntern.phone || "Not provided"}</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">College / University</span>
                    <span>{selectedIntern.college || "Not set"}</span>
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Course / Degree</span>
                    <span>{selectedIntern.course || "Not set"}</span>
                  </div>
                </div>
              )}

              {activeTab === "internship" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-semibold text-slate-650">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Department</span>
                    <span className="text-slate-900 font-bold">{selectedIntern.department}</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Assigned Team</span>
                    <span>{resolveInternTeamAndManager(selectedIntern.id || selectedIntern._id, selectedIntern.email).teamName}</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Mentor Manager</span>
                    <span>{resolveInternTeamAndManager(selectedIntern.id || selectedIntern._id, selectedIntern.email).managerName}</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Syllabus Status</span>
                    <span className="font-bold text-slate-900">{selectedIntern.status}</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Start Date</span>
                    <span>{selectedIntern.startDate || "Not set"}</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">End Date</span>
                    <span>{selectedIntern.endDate || "Not set"}</span>
                  </div>
                </div>
              )}

              {activeTab === "performance" && (
                <div className="flex flex-col gap-6">
                  {/* Grid values */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-center">
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Attendance</span>
                      <span className="block text-base font-black text-slate-800 mt-1">96%</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-center">
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Projects</span>
                      <span className="block text-base font-black text-slate-800 mt-1">{resolvePerformanceStats(selectedIntern.email).assignedProjectsCount}</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-center">
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Reports</span>
                      <span className="block text-base font-black text-slate-800 mt-1">{resolvePerformanceStats(selectedIntern.email).submittedReportsCount}</span>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100/70 rounded-xl p-3.5 text-center">
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-emerald-700">Trainings Completed</span>
                      <span className="block text-base font-black text-emerald-800 mt-1">{resolvePerformanceStats(selectedIntern.email).trainingCompletionRate}</span>
                    </div>
                  </div>
                  {/* Actions buttons inside profile */}
                  <div className="border-t border-slate-100 pt-5 flex flex-wrap gap-3">
                    <button 
                      onClick={() => triggerViewAttendance(selectedIntern)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-150/70 transition-colors cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      View Attendance Records
                    </button>
                    <button 
                      onClick={() => setViewingProjects(selectedIntern)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-150/70 transition-colors cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                      View Assigned Projects
                    </button>
                    <button 
                      onClick={() => setViewingReports(selectedIntern)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-150/70 transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      View Submitted Reports
                    </button>
                  </div>
                </div>
              )}
            </div>
            {/* Footer */}
            <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 flex justify-end">
              <button 
                onClick={() => setIsProfileModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer text-xs"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT INTERN DETAILS                                                */}
      {/* ========================================================================= */}
      {isEditModalOpen && editingIntern && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-left">
          <form onSubmit={handleEditSubmit} className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl flex flex-col animate-fade-in">
            <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Edit className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Edit Intern Details</h3>
              </div>
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4 text-xs overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-700">Full Name</label>
                  <input 
                    type="text" 
                    value={editingIntern.name || ""} 
                    onChange={e => setEditingIntern(prev => ({ ...prev, name: e.target.value }))}
                    className="p-2 border border-slate-250 rounded-xl focus:outline-none focus:border-slate-350"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-700">Phone</label>
                  <input 
                    type="text" 
                    value={editingIntern.phone || ""} 
                    onChange={e => setEditingIntern(prev => ({ ...prev, phone: e.target.value }))}
                    className="p-2 border border-slate-250 rounded-xl focus:outline-none focus:border-slate-350"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-700">College / University</label>
                  <input 
                    type="text" 
                    value={editingIntern.college || ""} 
                    onChange={e => setEditingIntern(prev => ({ ...prev, college: e.target.value }))}
                    className="p-2 border border-slate-250 rounded-xl focus:outline-none focus:border-slate-350"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-700">Course / Degree</label>
                  <input 
                    type="text" 
                    value={editingIntern.course || ""} 
                    onChange={e => setEditingIntern(prev => ({ ...prev, course: e.target.value }))}
                    className="p-2 border border-slate-250 rounded-xl focus:outline-none focus:border-slate-350"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-700">Start Date</label>
                  <input 
                    type="date" 
                    value={editingIntern.startDate || ""} 
                    onChange={e => setEditingIntern(prev => ({ ...prev, startDate: e.target.value }))}
                    className="p-2 border border-slate-250 rounded-xl focus:outline-none focus:border-slate-350"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-700">End Date</label>
                  <input 
                    type="date" 
                    value={editingIntern.endDate || ""} 
                    onChange={e => setEditingIntern(prev => ({ ...prev, endDate: e.target.value }))}
                    className="p-2 border border-slate-250 rounded-xl focus:outline-none focus:border-slate-350"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-700">Department</label>
                  <input 
                    type="text" 
                    value={editingIntern.department || ""} 
                    onChange={e => setEditingIntern(prev => ({ ...prev, department: e.target.value }))}
                    className="p-2 border border-slate-250 rounded-xl focus:outline-none focus:border-slate-350"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-700">Status</label>
                  <select 
                    value={editingIntern.status || "Active"} 
                    onChange={e => setEditingIntern(prev => ({ ...prev, status: e.target.value }))}
                    className="p-2 border border-slate-250 rounded-xl focus:outline-none focus:border-slate-350"
                  >
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 bg-emerald-650 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer text-xs"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ASSIGN TRAINING (QUICK FORM FOR INDIVIDUAL INTERN)                */}
      {/* ========================================================================= */}
      {isAssignModalOpen && assignTargetIntern && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-left">
          <form onSubmit={handleAssignTraining} className="bg-white border border-slate-200 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col animate-fade-in">
            <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Assign Training to {assignTargetIntern.name}</h3>
              <button type="button" onClick={() => setIsAssignModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-700">Select Training Module</label>
                <select
                  value={assignTrainingId}
                  onChange={e => setAssignTrainingId(e.target.value)}
                  className="p-2 border border-slate-250 rounded-xl focus:outline-none focus:border-slate-350"
                  required
                >
                  <option value="">-- Choose Module --</option>
                  {trainings.map(t => (
                    <option key={t.id || t._id} value={t._id || t.id}>{t.name} ({t.duration})</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-700">Due Date</label>
                <input
                  type="date"
                  value={assignDueDate}
                  onChange={e => setAssignDueDate(e.target.value)}
                  className="p-2 border border-slate-250 rounded-xl focus:outline-none focus:border-slate-350"
                  required
                />
              </div>
            </div>
            <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setIsAssignModalOpen(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={isAssigning}
                className="px-4 py-2 bg-emerald-650 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer text-xs disabled:opacity-50"
              >
                {isAssigning ? "Assigning..." : "Assign Module"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE TRAINING MODULE                                             */}
      {/* ========================================================================= */}
      {isCreateTrainingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-left">
          <form onSubmit={handleCreateTraining} className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl flex flex-col animate-fade-in">
            <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Create Syllabus Training Module</h3>
              </div>
              <button type="button" onClick={() => setIsCreateTrainingOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4 text-xs overflow-y-auto max-h-[60vh]">
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-700">Module Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. React Hook Basics"
                  value={newTrainingName}
                  onChange={e => setNewTrainingName(e.target.value)}
                  className="p-2 border border-slate-250 rounded-xl focus:outline-none focus:border-slate-350"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-700">Category</label>
                  <select
                    value={newTrainingCategory}
                    onChange={e => setNewTrainingCategory(e.target.value)}
                    className="p-2 border border-slate-250 rounded-xl focus:outline-none focus:border-slate-350"
                  >
                    <option value="Onboarding">Onboarding</option>
                    <option value="Ethics">Ethics</option>
                    <option value="Development">Development</option>
                    <option value="Design">Design</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-700">Duration</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 2 hours"
                    value={newTrainingDuration}
                    onChange={e => setNewTrainingDuration(e.target.value)}
                    className="p-2 border border-slate-250 rounded-xl focus:outline-none focus:border-slate-350"
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-700">Module Description</label>
                <textarea 
                  placeholder="Provide module overview..."
                  value={newTrainingDesc}
                  onChange={e => setNewTrainingDesc(e.target.value)}
                  rows="3"
                  className="p-2 border border-slate-250 rounded-xl focus:outline-none focus:border-slate-350 resize-none"
                />
              </div>
              
              {/* Learning materials builder */}
              <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
                <h4 className="font-bold text-slate-800 text-xs">Add Learning Materials / Attachments</h4>
                
                {/* Temp materials list */}
                {learningMaterials.length > 0 && (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col gap-2">
                    {learningMaterials.map((lm, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px] font-semibold text-slate-650 bg-white border border-slate-150 p-2 rounded-lg">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          <span>{lm.name} ({lm.type})</span>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setLearningMaterials(prev => prev.filter((_, i) => i !== idx))}
                          className="text-rose-600 hover:text-rose-800 font-extrabold cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-slate-500 text-[10px]">Material Title</span>
                    <input 
                      type="text" 
                      placeholder="e.g. Intern Handbook"
                      value={materialName}
                      onChange={e => setMaterialName(e.target.value)}
                      className="p-1.5 border border-slate-250 rounded-lg text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-slate-500 text-[10px]">Type</span>
                    <select
                      value={materialType}
                      onChange={e => setMaterialType(e.target.value)}
                      className="p-1.5 border border-slate-250 rounded-lg text-xs"
                    >
                      <option value="PDF">PDF File</option>
                      <option value="PPT">PPT Presentation</option>
                      <option value="Video">Video File</option>
                      <option value="Document">Word Document</option>
                      <option value="Link">External Link</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-slate-500 text-[10px]">Resource URL / Link</span>
                    <input 
                      type="text" 
                      placeholder="e.g. https://domain/doc.pdf"
                      value={materialUrl}
                      onChange={e => setMaterialUrl(e.target.value)}
                      className="p-1.5 border border-slate-250 rounded-lg text-xs"
                    />
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={addMaterialToList}
                  className="w-fit self-end px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-200 cursor-pointer text-[10px]"
                >
                  Attach Material
                </button>
              </div>

            </div>
            <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setIsCreateTrainingOpen(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isCreatingTraining}
                className="px-4 py-2 bg-emerald-650 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer text-xs disabled:opacity-50"
              >
                {isCreatingTraining ? "Saving..." : "Create Module"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ASSIGN TRAINING (PORTAL BROADCAST TO GROUPS)                       */}
      {/* ========================================================================= */}
      {isAssignTrainingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-left">
          <form onSubmit={handleAssignTraining} className="bg-white border border-slate-200 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col animate-fade-in">
            <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Send className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Delegate Syllabus Module</h3>
              </div>
              <button type="button" onClick={() => setIsAssignTrainingOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4 text-xs">
              
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-700">Select Training Module</label>
                <select
                  value={assignTrainingId}
                  onChange={e => setAssignTrainingId(e.target.value)}
                  className="p-2 border border-slate-250 rounded-xl focus:outline-none focus:border-slate-350"
                  required
                >
                  <option value="">-- Choose Module --</option>
                  {trainings.map(t => (
                    <option key={t.id || t._id} value={t._id || t.id}>{t.name} ({t.duration})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-700">Assign To (Group Type)</label>
                  <select
                    value={assignToType}
                    onChange={e => {
                      setAssignToType(e.target.value);
                      setAssignToValue("");
                    }}
                    className="p-2 border border-slate-250 rounded-xl focus:outline-none focus:border-slate-350"
                  >
                    <option value="all">All Interns</option>
                    <option value="team">Specific Team</option>
                    <option value="department">Specific Department</option>
                    <option value="individual">Individual Intern</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-700">Due Date</label>
                  <input
                    type="date"
                    value={assignDueDate}
                    onChange={e => setAssignDueDate(e.target.value)}
                    className="p-2 border border-slate-250 rounded-xl focus:outline-none focus:border-slate-350"
                    required
                  />
                </div>
              </div>

              {assignToType !== "all" && (
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-700">Enter Value / Scope</label>
                  {assignToType === "team" ? (
                    <select
                      value={assignToValue}
                      onChange={e => setAssignToValue(e.target.value)}
                      className="p-2 border border-slate-250 rounded-xl focus:outline-none focus:border-slate-350"
                      required
                    >
                      <option value="">-- Choose Team --</option>
                      {teams.map(t => (
                        <option key={t.id || t._id} value={t._id || t.id}>{t.name}</option>
                      ))}
                    </select>
                  ) : assignToType === "department" ? (
                    <input 
                      type="text" 
                      placeholder="e.g. Design"
                      value={assignToValue}
                      onChange={e => setAssignToValue(e.target.value)}
                      className="p-2 border border-slate-250 rounded-xl focus:outline-none focus:border-slate-350"
                      required
                    />
                  ) : (
                    <select
                      value={assignToValue}
                      onChange={e => setAssignToValue(e.target.value)}
                      className="p-2 border border-slate-250 rounded-xl focus:outline-none focus:border-slate-350"
                      required
                    >
                      <option value="">-- Select Intern --</option>
                      {interns.map(i => (
                        <option key={i.id || i._id} value={i.email}>{i.name} ({i.email})</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

            </div>
            <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setIsAssignTrainingOpen(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={isAssigning}
                className="px-4 py-2 bg-emerald-650 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer text-xs disabled:opacity-50"
              >
                {isAssigning ? "Assigning..." : "Assign training"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-MODAL: INTERN ATTENDANCE LOGS                                         */}
      {/* ========================================================================= */}
      {viewingAttendance && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 text-left">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col animate-fade-in">
            <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Attendance logs: {viewingAttendance.name}</h3>
              <button onClick={() => setViewingAttendance(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[50vh] text-xs">
              {internAttendanceRecords.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-semibold">No attendance sheets uploaded for this intern.</div>
              ) : (
                <div className="flex flex-col gap-3">
                  {internAttendanceRecords.map(r => (
                    <div key={r._id} className="bg-slate-50 border border-slate-150 rounded-xl p-3 flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{new Date(r.date).toLocaleDateString()}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">Sessions: {r.sessions?.length || 0} checks</span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border ${
                        r.status === "present"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-100"
                          : "bg-rose-50 text-rose-805 border-rose-100"
                      }`}>
                        {r.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 flex justify-end">
              <button onClick={() => setViewingAttendance(null)} className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer text-xs">
                Back to Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-MODAL: INTERN PROJECTS LOGS                                           */}
      {/* ========================================================================= */}
      {viewingProjects && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 text-left">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col animate-fade-in">
            <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Assigned Projects: {viewingProjects.name}</h3>
              <button onClick={() => setViewingProjects(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[50vh] text-xs">
              {projects.filter(p => p.assignedMembers?.some(m => m.email === viewingProjects.email)).length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-semibold">No active projects assigned to this intern.</div>
              ) : (
                <div className="flex flex-col gap-3">
                  {projects.filter(p => p.assignedMembers?.some(m => m.email === viewingProjects.email)).map(p => (
                    <div key={p.id || p._id} className="bg-slate-50 border border-slate-150 rounded-xl p-4 flex flex-col gap-2">
                      <div className="flex items-start justify-between">
                        <span className="font-bold text-slate-800">{p.name}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold border ${
                          p.status === "Completed"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-100"
                            : "bg-indigo-50 text-indigo-800 border-indigo-100"
                        }`}>
                          {p.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-450">{p.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${p.progress}%` }} />
                        </div>
                        <span className="text-[9px] font-extrabold text-slate-550">{p.progress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 flex justify-end">
              <button onClick={() => setViewingProjects(null)} className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer text-xs">
                Back to Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-MODAL: INTERN REPORTS LOGS                                            */}
      {/* ========================================================================= */}
      {viewingReports && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 text-left">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl flex flex-col animate-fade-in">
            <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Syllabus Reports: {viewingReports.name}</h3>
              <button onClick={() => setViewingReports(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[50vh] text-xs">
              {reports.filter(r => r.employeeEmail === viewingReports.email).length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-semibold">No daily status reports submitted.</div>
              ) : (
                <div className="flex flex-col gap-3">
                  {reports.filter(r => r.employeeEmail === viewingReports.email).map(r => (
                    <div key={r.id || r._id} className="bg-slate-50 border border-slate-150 rounded-xl p-4 flex flex-col gap-2">
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                        <span>Report Date: {new Date(r.reportDate).toLocaleDateString()}</span>
                        <span className={`px-1.5 py-0.5 rounded border ${
                          r.status === "Approved" ? "bg-emerald-50 text-emerald-800 border-emerald-100" : "bg-amber-50 text-amber-800 border-amber-100"
                        }`}>{r.status}</span>
                      </div>
                      <div className="flex flex-col gap-1 mt-1 text-slate-650">
                        <span className="font-bold text-slate-700">Work Completed:</span>
                        <p className="text-[11px] leading-relaxed">{r.workCompleted}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 flex justify-end">
              <button onClick={() => setViewingReports(null)} className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer text-xs">
                Back to Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SYLLABUS CERTIFICATE VIEWER & DOWNLOAD                              */}
      {/* ========================================================================= */}
      {selectedCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 text-center">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col animate-fade-in">
            {/* Header */}
            <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">Syllabus Achievement Certificate</span>
              <button onClick={() => setSelectedCertificate(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            {/* Body (styled like a real certificate) */}
            <div className="p-8 bg-slate-50">
              <div className="bg-white border-8 border-double border-emerald-800 p-8 flex flex-col items-center justify-center text-center shadow-inner relative overflow-hidden">
                {/* Watermark badge icon */}
                <div className="absolute opacity-[0.03] pointer-events-none transform scale-[5] text-emerald-950">
                  <GraduationCap className="w-12 h-12" />
                </div>
                
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-850">Certificate of Completion</span>
                
                <h2 className="text-xl font-bold tracking-tight text-slate-800 mt-5">This is proudly presented to</h2>
                <h1 className="text-2xl font-black text-emerald-950 underline decoration-double decoration-slate-400 mt-2 font-serif">{selectedCertificate.internName}</h1>
                
                <p className="text-xs text-slate-500 font-semibold max-w-md leading-relaxed mt-5">
                  for successfully clearing all modules, milestones, and syllabus syllabus tasks under the training:
                </p>
                <h3 className="text-base font-bold text-slate-850 tracking-wide uppercase mt-3">"{selectedCertificate.trainingName}"</h3>
                
                <div className="flex justify-between w-full border-t border-slate-100 pt-6 mt-8 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  <div className="flex flex-col items-center">
                    <span className="text-slate-650 font-bold">{new Date(selectedCertificate.completedAt || Date.now()).toLocaleDateString()}</span>
                    <span className="border-t border-slate-200 mt-1 pt-1 w-20">Date Awarded</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="h-6 w-16 bg-slate-100 flex items-center justify-center rounded border border-slate-200">
                      <span className="text-[8px] text-emerald-700 font-serif font-black italic">HRA GROUPS</span>
                    </div>
                    <span className="border-t border-slate-200 mt-1 pt-1 w-24">Authorized Registrar</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Footer */}
            <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 flex justify-end gap-3 text-xs">
              <button 
                onClick={() => setSelectedCertificate(null)}
                className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  window.print();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-650 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer transition-all shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                Print / Save Certificate
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
