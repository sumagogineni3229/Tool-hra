"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Search,
  Award,
  Star,
  MessageSquare,
  TrendingUp,
  Sliders,
  ChevronRight,
  Send,
  Loader2,
  X,
  FileCheck
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";

export default function HRPerformanceManagement() {
  const [users, setUsers] = useState([]);
  const [performances, setPerformances] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeUser, setActiveUser] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    productivity: 90,
    qualityOfWork: 90,
    collaboration: 90,
    punctuality: 90,
    managerFeedback: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Users
      const usersData = await apiClient.getUsers();
      // Keep only employees and interns
      const staffList = usersData.filter(u => u.role === "Employee" || u.role === "Intern");
      setUsers(staffList);

      // 2. Fetch Performance Logs
      const perfRes = await fetch("/api/performance");
      const perfData = await perfRes.json();
      if (perfRes.ok) {
        setPerformances(perfData.performances || []);
      }
    } catch (err) {
      console.warn("MongoDB fetch failed in HR performance tab, using local fallbacks...", err);
      // Fallback staff list from local users cached
      const cachedUsers = localStorage.getItem("hra_users") || "[]";
      const staffList = JSON.parse(cachedUsers).filter(u => u.role === "Employee" || u.role === "Intern");
      setUsers(staffList);

      // Fallback performance evaluations cached
      const cachedPerf = localStorage.getItem("hra_performance") || "[]";
      setPerformances(JSON.parse(cachedPerf));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectUser = (user) => {
    setActiveUser(user);
    // Find existing performance log if any
    const existing = performances.find(p => p.userEmail.toLowerCase().trim() === user.email.toLowerCase().trim());
    if (existing) {
      setFormData({
        productivity: existing.productivity || 90,
        qualityOfWork: existing.qualityOfWork || 90,
        collaboration: existing.collaboration || 90,
        punctuality: existing.punctuality || 90,
        managerFeedback: existing.managerFeedback || ""
      });
    } else {
      setFormData({
        productivity: 85,
        qualityOfWork: 85,
        collaboration: 85,
        punctuality: 85,
        managerFeedback: ""
      });
    }
  };

  const handleFormChange = (key, val) => {
    setFormData(prev => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeUser) return;
    setIsSubmitting(true);
    setSuccessMsg("");

    const reviewer = apiClient.getCurrentSession() || { name: "HR Specialist", role: "HR Manager" };

    const payload = {
      email: activeUser.email,
      productivity: Number(formData.productivity),
      qualityOfWork: Number(formData.qualityOfWork),
      collaboration: Number(formData.collaboration),
      punctuality: Number(formData.punctuality),
      managerFeedback: formData.managerFeedback.trim(),
      reviewedBy: reviewer.name,
      reviewedByRole: reviewer.role
    };

    try {
      const res = await fetch("/api/performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Filed performance review for ${activeUser.name} successfully!`);
        fetchData();
        setTimeout(() => {
          setActiveUser(null);
          setSuccessMsg("");
        }, 2000);
      } else {
        throw new Error(data.message || "Failed to submit review");
      }
    } catch (err) {
      console.warn("API POST performance failed, applying LocalStorage sync fallback...", err);
      // Offline sync fallback
      const cachedPerf = JSON.parse(localStorage.getItem("hra_performance") || "[]");
      const avgPercent = (payload.productivity + payload.qualityOfWork + payload.collaboration + payload.punctuality) / 4;
      const overallScore = Number((avgPercent / 20).toFixed(2));

      const newRecord = {
        _id: `local-perf-${Date.now()}`,
        userId: activeUser.id || activeUser._id || `local-user-${Date.now()}`,
        userEmail: activeUser.email.toLowerCase().trim(),
        userName: activeUser.name,
        userRole: activeUser.role,
        overallScore,
        productivity: payload.productivity,
        qualityOfWork: payload.qualityOfWork,
        collaboration: payload.collaboration,
        punctuality: payload.punctuality,
        managerFeedback: payload.managerFeedback,
        reviewedBy: payload.reviewedBy,
        reviewedByRole: payload.reviewedByRole,
        reviewDate: new Date().toISOString(),
        quarter: "Q2 2026"
      };

      // Filter out old records for the same email
      const filtered = cachedPerf.filter(p => p.userEmail.toLowerCase().trim() !== activeUser.email.toLowerCase().trim());
      filtered.unshift(newRecord);
      localStorage.setItem("hra_performance", JSON.stringify(filtered));

      setSuccessMsg(`Filed performance review for ${activeUser.name} offline successfully!`);
      fetchData();
      setTimeout(() => {
        setActiveUser(null);
        setSuccessMsg("");
      }, 2000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getOverallScore = () => {
    const avg = (Number(formData.productivity) + Number(formData.qualityOfWork) + Number(formData.collaboration) + Number(formData.punctuality)) / 4;
    return (avg / 20).toFixed(2);
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-12">
      {/* Title Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="text-left">
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Performance Center</h2>
          <p className="text-slate-500 font-light text-lg italic tracking-wide">Audit competencies, submit scorecard ratings, and file manager review logs for employees & interns.</p>
        </div>
      </header>

      {/* Split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

        {/* Left Side: Employees list (7 columns) */}
        <div className={`bg-white border border-slate-200/80 rounded-[3rem] p-8 shadow-sm flex flex-col gap-6 text-left transition-all ${activeUser ? "lg:col-span-6" : "lg:col-span-12"
          }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col">
              <h3 className="font-bold text-slate-950 text-sm">Staff Directory</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Select a staff member to file their Q2 2026 performance ratings.</p>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, role, email..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:outline-none focus:border-slate-350 focus:bg-white transition-all font-semibold text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
            {filteredUsers.map(user => {
              // Find existing review
              const rev = performances.find(p => p.userEmail.toLowerCase().trim() === user.email.toLowerCase().trim());
              const isSelected = activeUser?.email === user.email;

              return (
                <div
                  key={user._id || user.id}
                  onClick={() => handleSelectUser(user)}
                  className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer text-left flex flex-col justify-between gap-4 ${isSelected
                      ? "bg-indigo-50/40 border-indigo-300 shadow-sm"
                      : "bg-slate-50/30 border-slate-100 hover:bg-slate-50 hover:border-slate-200 hover:shadow-inner"
                    }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold ${user.badgeColor || (user.role === "Intern" ? "bg-amber-600" : "bg-indigo-600")
                        }`}>
                        {user.initials || user.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold text-slate-900 leading-none">{user.name}</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">{user.role}</span>
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase border ${user.role === "Intern"
                        ? "bg-amber-50 text-amber-800 border-amber-100"
                        : "bg-indigo-50 text-indigo-800 border-indigo-100"
                      }`}>
                      {user.department}
                    </span>
                  </div>

                  {/* Rating stats preview */}
                  <div className="flex items-center justify-between border-t border-slate-100/60 pt-3 text-[10px] font-bold text-slate-500">
                    <span className="font-semibold text-slate-400">Scorecard:</span>
                    {rev ? (
                      <div className="flex items-center gap-1 text-slate-900">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />
                        <span className="font-mono">{rev.overallScore.toFixed(2)}</span>
                        <span className="text-[8px] text-slate-350">/5.00</span>
                      </div>
                    ) : (
                      <span className="text-rose-500 font-bold uppercase tracking-wider text-[8px] bg-rose-50 border border-rose-100/30 px-1.5 py-0.5 rounded">Unevaluated</span>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredUsers.length === 0 && !isLoading && (
              <div className="col-span-2 text-center py-20 text-slate-400 text-xs font-semibold">
                No matching staff records found.
              </div>
            )}
            {isLoading && (
              <div className="col-span-2 text-center py-20 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Evaluation Form Panel (5 columns) */}
        {activeUser && (
          <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-[3rem] p-8 shadow-sm flex flex-col justify-between gap-6 text-left relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50/50 blur-[80px] -z-10 rounded-full translate-x-1/3 -translate-y-1/3" />

            <div className="flex justify-between items-start gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                  <Sliders className="w-5 h-5" />
                </div>
                <div className="flex flex-col text-left">
                  <h3 className="font-bold text-slate-950 text-sm">Filing Evaluation</h3>
                  <span className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-wide">Target: {activeUser.name} ({activeUser.role})</span>
                </div>
              </div>

              <button
                onClick={() => setActiveUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-all cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {successMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-bold">
                <FileCheck className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 flex-1 flex flex-col justify-between">

              <div className="space-y-4">
                {/* 1. Productivity */}
                <div className="flex flex-col gap-2 text-left">
                  <div className="flex justify-between text-xs font-bold text-slate-800">
                    <span>Productivity Competency</span>
                    <span className="font-mono text-indigo-650">{formData.productivity}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.productivity}
                    onChange={(e) => handleFormChange("productivity", e.target.value)}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-650"
                  />
                </div>

                {/* 2. Quality of Work */}
                <div className="flex flex-col gap-2 text-left">
                  <div className="flex justify-between text-xs font-bold text-slate-800">
                    <span>Quality of Work Audit</span>
                    <span className="font-mono text-indigo-650">{formData.qualityOfWork}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.qualityOfWork}
                    onChange={(e) => handleFormChange("qualityOfWork", e.target.value)}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-650"
                  />
                </div>

                {/* 3. Collaboration */}
                <div className="flex flex-col gap-2 text-left">
                  <div className="flex justify-between text-xs font-bold text-slate-800">
                    <span>Team Collaboration Score</span>
                    <span className="font-mono text-indigo-650">{formData.collaboration}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.collaboration}
                    onChange={(e) => handleFormChange("collaboration", e.target.value)}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-650"
                  />
                </div>

                {/* 4. Punctuality */}
                <div className="flex flex-col gap-2 text-left">
                  <div className="flex justify-between text-xs font-bold text-slate-800">
                    <span>Punctuality & Presence</span>
                    <span className="font-mono text-indigo-650">{formData.punctuality}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.punctuality}
                    onChange={(e) => handleFormChange("punctuality", e.target.value)}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-650"
                  />
                </div>

                {/* 5. Overall Calculator Preview */}
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Auto calculated Q2 score</span>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
                      <span className="text-sm font-extrabold text-slate-800 font-mono tracking-tight">{getOverallScore()}</span>
                      <span className="text-[10px] text-slate-400">/ 5.00</span>
                    </div>
                  </div>

                  <span className="text-[9px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded uppercase tracking-wider">
                    {Number(getOverallScore()) >= 4.5 ? "Exceeds Expectations" : Number(getOverallScore()) >= 3.5 ? "Good Standings" : "Under Review"}
                  </span>
                </div>

                {/* 6. Review comment */}
                <div className="flex flex-col gap-2 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none ml-1">Manager Feedback Speech Log</label>
                  <textarea
                    required
                    rows="3"
                    value={formData.managerFeedback}
                    onChange={(e) => handleFormChange("managerFeedback", e.target.value)}
                    placeholder="Provide specific assessment reviews (e.g. Sourav consistently delivers exceptional results...)"
                    className="w-full bg-slate-50 border border-slate-150 rounded-2xl px-4 py-3 focus:bg-white focus:border-slate-350 outline-none text-xs font-semibold text-slate-800 leading-relaxed transition-all"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setActiveUser(null)}
                  className="flex-1 py-4 font-black text-slate-400 bg-slate-50 rounded-xl hover:text-slate-800 transition-colors uppercase tracking-widest text-[9px] cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.managerFeedback.trim()}
                  className="flex-[2] py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-[0.15em] text-[9px] hover:bg-indigo-600 shadow-sm disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3 h-3" />
                      <span>Submit Audit Scorecard</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        )}

      </div>
    </div>
  );
}
