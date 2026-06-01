"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  Users,
  Search,
  Plus,
  ArrowUpRight,
  MoreVertical,
  Link as LinkIcon,
  CheckCircle2,
  Clock,
  XCircle,
  Mail,
  Phone,
  Calendar,
  ExternalLink,
  MessageSquare,
  Video,
  ChevronRight,
  Filter,
  Check,
  Download,
  X,
  Target,
  Trophy,
  Activity,
  UserCheck,
  Globe,
  Loader2,
  Sparkles,
  ClipboardList,
  ChevronLeft
} from "lucide-react";

const STAGES = ["Applied", "Screening", "Shortlisted", "Interview", "Offered", "Rejected", "Selected"];

const STAGE_COLORS = {
  "Applied": "bg-slate-100 text-slate-600 border-slate-200",
  "Screening": "bg-blue-50 text-blue-600 border-blue-100",
  "Shortlisted": "bg-indigo-50 text-indigo-600 border-indigo-100",
  "Interview": "bg-purple-50 text-purple-600 border-purple-100",
  "Offered": "bg-emerald-50 text-emerald-600 border-emerald-100",
  "Rejected": "bg-rose-50 text-rose-600 border-rose-100",
  "Selected": "bg-slate-900 text-white border-slate-950 shadow-md",
};

export default function RecruitmentManagement() {
  const [activeView, setActiveView] = useState("jobs"); // "jobs" or "applications"
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJobId, setSelectedJobId] = useState(null);
  
  // Custom Dynamic Questions state
  const [questionInput, setQuestionInput] = useState("");

  // New Job State
  const [newJob, setNewJob] = useState({
    title: "",
    department: "",
    type: "Full-Time",
    location: "Remote",
    description: "",
    requirements: "",
    customQuestions: []
  });

  const [toast, setToast] = useState(null);

  // Fetch Data with robust offline fallback support
  const fetchData = async () => {
    try {
      const [jobsRes, appsRes] = await Promise.all([
        fetch("/api/hiring/jobs"),
        fetch("/api/hiring/applications")
      ]);

      if (jobsRes.ok && appsRes.ok) {
        const jobsData = await jobsRes.json();
        const appsData = await appsRes.json();
        
        const jobsList = jobsData.jobs || [];
        const appsList = appsData.applications || [];
        
        setJobs(jobsList);
        setApplications(appsList);

        // Sync with LocalStorage
        localStorage.setItem("hra_jobs", JSON.stringify(jobsList));
        localStorage.setItem("hra_applications", JSON.stringify(appsList));
      } else {
        throw new Error("API call failed.");
      }
    } catch (err) {
      console.warn("MongoDB API unreachable. Reverting recruitment to LocalStorage fallback...", err);
      // Read from LocalStorage cache
      const storedJobs = JSON.parse(localStorage.getItem("hra_jobs") || "[]");
      const storedApps = JSON.parse(localStorage.getItem("hra_applications") || "[]");
      
      setJobs(storedJobs);
      setApplications(storedApps);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // Filtered Vacancies Board
  const filteredJobs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return jobs.filter(j => 
      j.title.toLowerCase().includes(q) || 
      j.department.toLowerCase().includes(q) ||
      j.location.toLowerCase().includes(q)
    );
  }, [jobs, searchQuery]);

  // Filtered Talent Pipeline
  const filteredApps = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return applications.filter(a => {
      const matchesSearch = a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q);
      
      // Handle matching jobId whether it's an object (_id) or loose string
      const appId = a.jobId?._id || a.jobId?.id || a.jobId;
      const matchesJob = !selectedJobId || appId === selectedJobId;
      return matchesSearch && matchesJob;
    });
  }, [applications, searchQuery, selectedJobId]);

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!newJob.title || !newJob.department || !newJob.description) {
      showToast("error", "Please specify title, department, and description.");
      return;
    }

    try {
      const formattedJob = {
        ...newJob,
        requirements: newJob.requirements.split("\n").filter(r => r.trim() !== "")
      };

      const res = await fetch("/api/hiring/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formattedJob)
      });

      if (res.ok) {
        setIsJobModalOpen(false);
        fetchData();
        setNewJob({ title: "", department: "", type: "Full-Time", location: "Remote", description: "", requirements: "", customQuestions: [] });
        showToast("success", "Vacancy successfully published!");
      } else {
        const err = await res.json();
        throw new Error(err.message || "Failed.");
      }
    } catch (err) {
      console.warn("API creation failed, adding job locally...", err);
      // Offline support fallback creation
      const localJobs = JSON.parse(localStorage.getItem("hra_jobs") || "[]");
      const localNewJob = {
        _id: `local-job-${Date.now()}`,
        id: `local-job-${Date.now()}`,
        title: newJob.title,
        department: newJob.department,
        type: newJob.type,
        location: newJob.location,
        description: newJob.description,
        requirements: newJob.requirements.split("\n").filter(r => r.trim() !== ""),
        customQuestions: newJob.customQuestions,
        status: "Open",
        applicantCount: 0,
        createdAt: new Date().toISOString()
      };
      
      localJobs.unshift(localNewJob);
      localStorage.setItem("hra_jobs", JSON.stringify(localJobs));
      setJobs(localJobs);
      
      setIsJobModalOpen(false);
      setNewJob({ title: "", department: "", type: "Full-Time", location: "Remote", description: "", requirements: "", customQuestions: [] });
      showToast("success", "Vacancy buffered locally (offline).");
    }
  };

  const handleUpdateStatus = async (appId, updates) => {
    try {
      const res = await fetch("/api/hiring/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: appId, ...updates })
      });

      if (res.ok) {
        const data = await res.json();
        
        // Refresh local items
        setApplications((prev) => prev.map((a) => (a._id === appId || a.id === appId ? data.application : a)));
        if (selectedApplication?._id === appId || selectedApplication?.id === appId) {
          setSelectedApplication(data.application);
        }
        
        // Resync cache
        const storedApps = JSON.parse(localStorage.getItem("hra_applications") || "[]");
        const idx = storedApps.findIndex(a => a._id === appId || a.id === appId);
        if (idx !== -1) {
          storedApps[idx] = data.application;
          localStorage.setItem("hra_applications", JSON.stringify(storedApps));
        }
      } else {
        throw new Error("Update failed.");
      }
    } catch (err) {
      console.warn("MongoDB API offline. Syncing status update locally...", err);
      // Local sync update
      const storedApps = JSON.parse(localStorage.getItem("hra_applications") || "[]");
      const idx = storedApps.findIndex(a => a._id === appId || a.id === appId);
      if (idx !== -1) {
        const updated = { ...storedApps[idx], ...updates };
        storedApps[idx] = updated;
        localStorage.setItem("hra_applications", JSON.stringify(storedApps));
        setApplications(storedApps);
        if (selectedApplication?._id === appId || selectedApplication?.id === appId) {
          setSelectedApplication(updated);
        }
        showToast("success", "Candidate coordinated locally (offline).");
      }
    }
  };

  const copyJobLink = (id) => {
    const link = `${window.location.origin}/hiring/${id}`;
    navigator.clipboard.writeText(link);
    showToast("success", "Public Vacancy Link copied to clipboard!");
  };

  const addCustomQuestion = () => {
    if (!questionInput.trim()) return;
    setNewJob((prev) => ({
      ...prev,
      customQuestions: [...prev.customQuestions, questionInput.trim()]
    }));
    setQuestionInput("");
  };

  const removeCustomQuestion = (index) => {
    setNewJob((prev) => ({
      ...prev,
      customQuestions: prev.customQuestions.filter((_, i) => i !== index)
    }));
  };

  const formatUrl = (url) => {
    if (!url) return "";
    let s = url.trim();
    s = s.replace(/^www\.(https?)/i, '$1');
    s = s.replace(/^(https?):?\/*\/*/i, '$1://');
    if (!s.match(/^[a-zA-Z]+:\/\//)) {
      s = "https://" + s;
    }
    return s;
  };

  if (loading && jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 font-sans text-slate-800">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Initializing Recruiting Desk...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans antialiased text-slate-800 pb-16 text-left">
      
      {/* Toast alert box */}
      {toast && (
        <div className="fixed top-4 right-4 z-[200] flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border transition-all duration-300 animate-slide-in bg-white max-w-sm">
          <CheckCircle2 className={`w-5 h-5 ${toast.type === "success" ? "text-emerald-600" : "text-rose-600"} shrink-0`} />
          <p className="text-xs font-bold text-slate-900 leading-snug">{toast.message}</p>
        </div>
      )}

      {/* Header section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-[0.03] bg-gradient-to-l from-indigo-650 to-transparent pointer-events-none" />
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-bold border border-indigo-100">
            <Sparkles className="w-3 h-3" />
            Applicant Tracking Console
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-none uppercase">
            Recruitment & Hiring
          </h2>
          <p className="text-xs font-semibold text-slate-400 italic">
            Manage corporate openings, inspect talent pipelines, copy shareable public application forms, and coordinate candidate stages.
          </p>
        </div>

        <button 
          onClick={() => setIsJobModalOpen(true)}
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Vacancy
        </button>
      </header>

      {/* Navigation tabs with search bar */}
      <div className="flex flex-wrap items-center justify-between gap-6 border-b border-slate-200 pb-0 bg-white px-6 rounded-t-2xl border-x border-t">
        <div className="flex items-center gap-2">
          {[
            { id: "jobs", label: "Active Openings", icon: Briefcase },
            { id: "applications", label: "Talent Pipeline", icon: Users }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`relative flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer
                ${activeView === tab.id ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-900'}`}
            >
              <tab.icon className="w-4 h-4 shrink-0" />
              {tab.label}
              {activeView === tab.id && (
                <motion.div layoutId="activeTabRec" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 py-2 ml-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input 
              type="text"
              placeholder="Search talent, opening..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition-all w-64 font-semibold"
            />
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeView === "jobs" ? (
          <motion.div 
            key="jobs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {filteredJobs.length === 0 ? (
              <div className="col-span-full py-16 bg-white border border-slate-200/80 rounded-2xl text-center space-y-3">
                <ClipboardList className="w-10 h-10 text-slate-350 mx-auto" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No vacancy signals matching description</p>
              </div>
            ) : filteredJobs.map(job => (
              <motion.div 
                key={job._id || job.id}
                whileHover={{ y: -3 }}
                className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md relative overflow-hidden flex flex-col justify-between min-h-[220px]"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${
                      job.status === 'Open' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}>
                      {job.status}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => copyJobLink(job._id || job.id)} 
                        className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:text-indigo-600 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-100 transition-all cursor-pointer" 
                        title="Copy Public Link"
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => { setSelectedJobId(job._id || job.id); setActiveView("applications"); }} 
                        className="p-2 bg-slate-900 text-white rounded-lg hover:bg-indigo-650 transition-all cursor-pointer" 
                        title="View Pipeline"
                      >
                        <Users className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-4 space-y-1">
                    <p className="text-[9px] font-bold text-indigo-650 uppercase tracking-widest leading-none">{job.department}</p>
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight leading-snug uppercase">{job.title}</h3>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Applicants</span>
                    <span className="text-base font-black text-slate-900 leading-none">{job.applicantCount || 0}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Contract / Location</span>
                    <span className="text-[10px] font-bold text-slate-650 leading-none uppercase truncate block">{job.type} • {job.location}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            key="apps"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Candidate flow pipeline</h3>
                {selectedJobId && (
                  <button 
                    onClick={() => setSelectedJobId(null)} 
                    className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full text-[9px] font-bold uppercase transition-all cursor-pointer"
                  >
                    Clear Vacancy Filter <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Candidate Information</th>
                    <th className="px-6 py-4">Applied Role</th>
                    <th className="px-6 py-4">Stage</th>
                    <th className="px-6 py-4">Date Applied</th>
                    <th className="px-6 py-4 text-right">Dossier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold">
                  {filteredApps.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        No candidate applications match selection criteria.
                      </td>
                    </tr>
                  ) : filteredApps.map(app => (
                    <tr 
                      key={app._id || app.id} 
                      onClick={() => setSelectedApplication(app)} 
                      className="group hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-sm font-bold border border-indigo-100">
                            {app.name[0]?.toUpperCase()}
                          </div>
                          <div className="text-left">
                            <span className="text-slate-900 block leading-tight">{app.name}</span>
                            <span className="text-[10px] font-medium text-slate-400 block">{app.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-750 block uppercase truncate leading-none mb-1">
                          {app.jobId?.title || "Programmer / Specialist"}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          {app.jobId?.department || "Operations"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${STAGE_COLORS[app.status]}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-medium">
                        {new Date(app.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all ml-auto" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Candidate Evaluation Dossier modal */}
      <AnimatePresence>
        {selectedApplication && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white rounded-3xl w-full max-w-6xl h-[85vh] overflow-hidden flex flex-col md:flex-row relative shadow-2xl border border-slate-200/80"
            >
              {/* Close trigger */}
              <button 
                onClick={() => setSelectedApplication(null)}
                className="absolute top-6 right-6 p-2 bg-slate-950 text-white rounded-xl hover:bg-rose-600 transition-all z-20 shadow-md active:scale-95 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* LEFT COLUMN:Identity & Actions */}
              <aside className="w-full md:w-[340px] bg-slate-50 border-r border-slate-100 p-8 flex flex-col justify-between overflow-y-auto shrink-0">
                <div className="space-y-8">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-2xl bg-indigo-50 border border-indigo-150 flex items-center justify-center text-3xl font-black text-indigo-650 mb-4 shadow-sm">
                      {selectedApplication.name[0]?.toUpperCase()}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight leading-none mb-1">{selectedApplication.name}</h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-100/50 text-indigo-700 text-[9px] font-bold uppercase tracking-wider">
                      Talent Applicant
                    </span>
                  </div>

                  <div className="space-y-6 pt-2">
                    <div className="grid grid-cols-1 gap-3.5">
                      <DossierBadge icon={Mail} value={selectedApplication.email} label="Email Contact" />
                      <DossierBadge icon={Phone} value={selectedApplication.phone} label="Phone Line" />
                      <DossierBadge icon={Calendar} value={new Date(selectedApplication.createdAt).toLocaleDateString()} label="Date Applied" />
                    </div>

                    <div className="space-y-2 text-left pt-2 border-t border-slate-200/60">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block leading-none ml-1">Documents Dossier</span>
                      <div className="grid grid-cols-1 gap-2">
                        <a 
                          href={formatUrl(selectedApplication.resume)} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center items-stretch rounded-xl overflow-hidden border border-slate-200 shadow-xs hover:border-rose-300 transition-all"
                        >
                          <div className="p-3 bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-all"><Download className="w-4 h-4" /></div>
                          <div className="flex-1 p-3 bg-white text-[10px] font-bold uppercase tracking-wider text-slate-800 flex items-center">Download/View Resume</div>
                        </a>
                        {selectedApplication.portfolio && (
                          <a 
                            href={formatUrl(selectedApplication.portfolio)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="group flex items-center items-stretch rounded-xl overflow-hidden border border-slate-200 shadow-xs hover:border-indigo-300 transition-all"
                          >
                            <div className="p-3 bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all"><Globe className="w-4 h-4" /></div>
                            <div className="flex-1 p-3 bg-white text-[10px] font-bold uppercase tracking-wider text-slate-800 flex items-center">View Portfolio</div>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-200/60 mt-8">
                  <a 
                    href="https://meet.google.com/landing" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-indigo-650 rounded-2xl p-5 text-white relative overflow-hidden group/meet shadow-lg cursor-pointer transition-transform active:scale-95 block"
                  >
                    <div className="relative z-10 flex flex-col items-center text-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center"><Video className="w-5 h-5" /></div>
                      <div className="space-y-0.5">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider">Meet Interview</h4>
                        <p className="text-[9px] font-medium text-indigo-200 tracking-wide">Enter the Video Interview Portal</p>
                      </div>
                    </div>
                  </a>
                </div>
              </aside>

              {/* RIGHT CONTENT: Intelligence & Stage pipeline coordination */}
              <div className="flex-1 p-8 lg:p-10 overflow-y-auto text-left">
                <div className="space-y-12 animate-fade-in">
                  
                  {/* Status pipeline stages */}
                  <div className="space-y-6">
                    <div>
                      <p className="text-[9px] font-bold text-indigo-650 uppercase tracking-[0.2em] mb-2">Talent Workflow</p>
                      <h4 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">
                        Status Coordination
                      </h4>
                    </div>

                    <div className="relative pt-6 pb-2 text-center">
                      {/* Gray Line */}
                      <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-[18px] rounded-full overflow-hidden" />

                      {/* Stage nodes */}
                      <div className="relative flex justify-between flex-wrap sm:flex-nowrap gap-4 sm:gap-0">
                        {STAGES.map((stage, idx) => {
                          const isActive = selectedApplication.status === stage;
                          const isCompleted = STAGES.indexOf(selectedApplication.status) >= idx;
                          return (
                            <div key={stage} className="flex flex-col items-center gap-2 flex-1">
                              <button 
                                onClick={() => handleUpdateStatus(selectedApplication._id || selectedApplication.id, { status: stage })}
                                className={`w-8 h-8 rounded-lg relative z-10 flex items-center justify-center transition-all duration-300 cursor-pointer
                                  ${isActive ? 'bg-indigo-650 text-white shadow-lg scale-110 ring-4 ring-indigo-50' : 
                                    isCompleted ? 'bg-white border border-indigo-600 text-indigo-600' : 'bg-white border border-slate-200 text-slate-350'}`}
                              >
                                {isCompleted && !isActive ? <Check className="w-4 h-4" /> : <span className="text-[9px] font-bold">{idx + 1}</span>}
                              </button>
                              <span className={`text-[9px] font-bold uppercase tracking-wider
                                ${isActive ? 'text-indigo-600 font-black' : 'text-slate-400 opacity-80'}`}>
                                {stage}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
                    
                    {/* Career Statement letter */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Target className="w-3.5 h-3.5 text-slate-400" />
                        <h5 className="text-[10px] font-bold uppercase tracking-wider">Cover Letter</h5>
                      </div>
                      <div className="p-6 bg-white border border-slate-250/70 rounded-2xl text-xs font-semibold text-slate-500 leading-relaxed italic relative overflow-hidden break-words whitespace-pre-wrap">
                        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-200" />
                        {selectedApplication.coverLetter || "Candidate did not provide cover letter details."}
                      </div>
                    </div>

                    {/* Dynamic answers evaluations */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Activity className="w-3.5 h-3.5 text-slate-400" />
                        <h5 className="text-[10px] font-bold uppercase tracking-wider">Evaluation Responses</h5>
                      </div>
                      <div className="space-y-3">
                        {selectedApplication.answers && selectedApplication.answers.length > 0 ? (
                          selectedApplication.answers.map((ans, i) => (
                            <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 leading-none">{ans.question}</p>
                              <p className="text-xs font-bold text-slate-900 leading-snug">{ans.answer}</p>
                            </div>
                          ))
                        ) : (
                          <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center">
                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">No dynamic custom answers recorded</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Administrative dossier notes feedback */}
                    <div className="col-span-full space-y-3">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                        <h5 className="text-[10px] font-bold uppercase tracking-wider">Administrative Comments</h5>
                      </div>
                      <div className="relative">
                        <textarea 
                          rows={4} 
                          value={selectedApplication.notes || ""} 
                          onChange={(e) => handleUpdateStatus(selectedApplication._id || selectedApplication.id, { notes: e.target.value })}
                          className="w-full bg-white border border-slate-250/70 rounded-2xl px-6 py-6 focus:ring-4 focus:ring-indigo-50 focus:outline-none font-medium text-slate-900 leading-relaxed shadow-xs transition-all text-xs" 
                          placeholder="Input dossier review summaries, background logs..." 
                        />
                        <div className="absolute bottom-4 right-6 flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-lg border border-slate-100">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                          <span className="text-[8px] font-bold text-slate-450 uppercase tracking-wider">Sync Saving Active</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Deploy vacancy Modal */}
      <AnimatePresence>
        {isJobModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
            <motion.div 
              initial={{ scale: 0.97, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.97, opacity: 0 }} 
              className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-8 relative shadow-2xl text-left"
            >
              <button 
                onClick={() => setIsJobModalOpen(false)} 
                className="absolute top-6 right-6 p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-4 mb-8 pb-4 border-b border-slate-100">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center"><Plus className="w-6 h-6" /></div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Deploy Vacancy Protocol</h3>
                  <p className="text-xs font-semibold text-slate-400">Specify core specs, details, and dynamic questions.</p>
                </div>
              </div>

              <form onSubmit={handleCreateJob} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Job Title *</label>
                    <input 
                      required 
                      value={newJob.title} 
                      onChange={e => setNewJob({...newJob, title: e.target.value})} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:bg-white focus:outline-none focus:border-indigo-400 transition-all text-xs font-semibold text-slate-900" 
                      placeholder="e.g. Senior Software Architect" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Department *</label>
                    <select 
                      required 
                      value={newJob.department} 
                      onChange={e => setNewJob({...newJob, department: e.target.value})} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:bg-white focus:outline-none focus:border-indigo-400 transition-all text-xs font-semibold text-slate-900 cursor-pointer"
                    >
                      <option value="">Select Department</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Design">Design</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Sales">Sales</option>
                      <option value="Human Resources">Human Resources</option>
                      <option value="Operations">Operations</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contract Type</label>
                    <select 
                      value={newJob.type} 
                      onChange={e => setNewJob({...newJob, type: e.target.value})} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:bg-white focus:outline-none focus:border-indigo-400 transition-all text-xs font-semibold text-slate-900 cursor-pointer"
                    >
                      <option value="Full-Time">Full-Time (Node Permanent)</option>
                      <option value="Contract">B2B / Contract</option>
                      <option value="Internship">Internship / Seed</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Location</label>
                    <input 
                      value={newJob.location} 
                      onChange={e => setNewJob({...newJob, location: e.target.value})} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:bg-white focus:outline-none focus:border-indigo-400 transition-all text-xs font-semibold text-slate-900" 
                      placeholder="e.g. San Francisco / Remote" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Job Mission Narrative *</label>
                  <textarea 
                    required 
                    rows={4} 
                    value={newJob.description} 
                    onChange={e => setNewJob({...newJob, description: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 focus:bg-white focus:outline-none focus:border-indigo-400 transition-all text-xs font-semibold text-slate-900 leading-relaxed resize-y" 
                    placeholder="Describe the mission and impact of this role..." 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Requirements (One per line)</label>
                  <textarea 
                    rows={3} 
                    value={newJob.requirements} 
                    onChange={e => setNewJob({...newJob, requirements: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 focus:bg-white focus:outline-none focus:border-indigo-400 transition-all text-xs font-semibold text-slate-900 leading-relaxed resize-y" 
                    placeholder="5+ years of React experience&#10;Architecture design knowledge..." 
                  />
                </div>

                {/* Custom evaluation questions composer */}
                <div className="space-y-3 border-t border-slate-100 pt-4">
                  <span className="text-[10px] font-bold text-indigo-650 uppercase tracking-widest block leading-none">Job Specific Evaluation Questions</span>
                  
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={questionInput}
                      onChange={(e) => setQuestionInput(e.target.value)}
                      placeholder="e.g. What is your experience with CI/CD?"
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-400 transition-all"
                    />
                    <button
                      type="button"
                      onClick={addCustomQuestion}
                      className="px-4 py-2 bg-indigo-50 border border-indigo-150 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
                    >
                      Add Question
                    </button>
                  </div>

                  {newJob.customQuestions.length > 0 && (
                    <div className="space-y-2 bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 max-h-[160px] overflow-y-auto">
                      {newJob.customQuestions.map((q, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-4 p-2 bg-white rounded-lg border border-slate-100 shadow-xs">
                          <span className="text-xs font-semibold text-slate-700 truncate">{q}</span>
                          <button
                            type="button"
                            onClick={() => removeCustomQuestion(idx)}
                            className="p-1 rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer shrink-0"
                            title="Remove Question"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <button 
                    type="submit" 
                    className="w-full py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    Deploy Vacancy Signals
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

function DossierBadge({ icon: Icon, value, label }) {
  return (
    <div className="flex items-center gap-3 group text-left">
      <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all shrink-0">
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 overflow-hidden">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-xs font-bold text-slate-800 truncate leading-none">{value}</p>
      </div>
    </div>
  );
}
