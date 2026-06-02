"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  Plus,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Edit3,
  Trash2,
  Eye,
  X,
  Paperclip,
  CalendarDays,
  Briefcase,
  ChevronDown,
  Send,
  Save,
  RefreshCw,
  MessageSquare,
  BarChart3,
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";

const STATUS_CONFIG = {
  "Draft":          { color: "bg-slate-100 text-slate-600 border-slate-200",     dot: "bg-slate-400",   icon: FileText },
  "Pending Review": { color: "bg-amber-50 text-amber-700 border-amber-200",      dot: "bg-amber-400",   icon: Clock },
  "Approved":       { color: "bg-emerald-50 text-emerald-700 border-emerald-200",dot: "bg-emerald-400", icon: CheckCircle2 },
  "Rejected":       { color: "bg-rose-50 text-rose-700 border-rose-200",         dot: "bg-rose-400",    icon: XCircle },
};

const EMPTY_FORM = {
  projectId: "",
  projectName: "",
  reportDate: new Date().toISOString().slice(0, 10),
  workCompleted: "",
  challenges: "",
  progressPercentage: 0,
  tomorrowPlan: "",
  hoursWorked: 8,
  attachment: null,
};

export default function InternReportsPage() {
  const [currentUser, setCurrentUser]     = useState(null);
  const [reports, setReports]             = useState([]);
  const [projects, setProjects]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [submitting, setSubmitting]       = useState(false);
  const [errorMsg, setErrorMsg]           = useState("");
  const [successMsg, setSuccessMsg]       = useState("");
  const [formOpen, setFormOpen]           = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [viewReport, setViewReport]       = useState(null);
  const [form, setForm]                   = useState(EMPTY_FORM);
  const [statusFilter, setStatusFilter]   = useState("all");

  const loadData = async () => {
    setLoading(true);
    try {
      const session = apiClient.getCurrentSession();
      setCurrentUser(session);
      const email = session?.email || "";
      const [fetchedReports, fetchedProjects] = await Promise.all([
        apiClient.getReports({ email }),
        apiClient.getProjects({ email }),
      ]);
      setReports(fetchedReports || []);
      setProjects(fetchedProjects || []);
    } catch (err) {
      console.error("Failed to load reports data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const stats = useMemo(() => ({
    total:    reports.length,
    draft:    reports.filter(r => r.status === "Draft").length,
    pending:  reports.filter(r => r.status === "Pending Review").length,
    approved: reports.filter(r => r.status === "Approved").length,
    rejected: reports.filter(r => r.status === "Rejected").length,
  }), [reports]);

  const filteredReports = useMemo(() =>
    statusFilter === "all" ? reports : reports.filter(r => r.status === statusFilter),
  [reports, statusFilter]);

  const openNewForm = () => {
    setEditingReport(null);
    setForm({ ...EMPTY_FORM, reportDate: new Date().toISOString().slice(0, 10) });
    setErrorMsg("");
    setFormOpen(true);
  };

  const openEditForm = (report) => {
    setEditingReport(report);
    setForm({
      projectId: report.projectId || "",
      projectName: report.projectName || "",
      reportDate: report.reportDate ? new Date(report.reportDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      workCompleted: report.workCompleted || "",
      challenges: report.challenges || "",
      progressPercentage: report.progressPercentage || 0,
      tomorrowPlan: report.tomorrowPlan || "",
      hoursWorked: report.hoursWorked || 8,
      attachment: report.attachment || null,
    });
    setErrorMsg("");
    setFormOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(prev => ({ ...prev, attachment: { name: file.name, url: reader.result, size: file.size } }));
    };
    reader.readAsDataURL(file);
  };

  const handleProjectChange = (e) => {
    const projectId = e.target.value;
    const selected = projects.find(p => (p._id || p.id) === projectId);
    setForm(prev => ({ ...prev, projectId, projectName: selected?.name || "" }));
  };

  const handleSubmit = async (submitStatus) => {
    if (!form.workCompleted.trim()) { setErrorMsg("Work Completed is required."); return; }
    setSubmitting(true);
    setErrorMsg("");
    try {
      const payload = {
        ...form,
        employeeEmail: currentUser?.email,
        employeeName: currentUser?.name,
        employeeRole: currentUser?.role || "Intern",
        status: submitStatus,
      };
      const result = editingReport
        ? await apiClient.updateReport({ id: editingReport._id || editingReport.id, ...payload })
        : await apiClient.submitReport(payload);

      if (result.success) {
        setFormOpen(false);
        setSuccessMsg(submitStatus === "Draft" ? "Report saved as draft." : "Report submitted for review!");
        setTimeout(() => setSuccessMsg(""), 3500);
        loadData();
      } else {
        setErrorMsg(result.message || "Failed to save report.");
      }
    } catch (err) {
      setErrorMsg("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm("Delete this draft report?")) return;
    const res = await apiClient.deleteReport(reportId);
    if (res.success) loadData();
    else alert("Failed to delete report.");
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";
  const formatTime = (d) => d ? new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-amber-100 border-t-amber-500 animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {successMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-semibold shadow-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 border border-amber-100">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            My Reports
          </h1>
          <p className="text-sm text-slate-400 mt-1 font-medium">Submit and track your daily work reports</p>
        </div>
        <button onClick={openNewForm}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 shadow-md hover:shadow-lg transition-all duration-150 cursor-pointer">
          <Plus className="w-4 h-4" />
          New Report
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Reports",  value: stats.total,    color: "bg-slate-50 border-slate-200",      icon: FileText,     iconColor: "text-slate-600" },
          { label: "Pending Review", value: stats.pending,  color: "bg-amber-50 border-amber-100",      icon: Clock,        iconColor: "text-amber-600" },
          { label: "Approved",       value: stats.approved, color: "bg-emerald-50 border-emerald-100",  icon: CheckCircle2, iconColor: "text-emerald-600" },
          { label: "Rejected",       value: stats.rejected, color: "bg-rose-50 border-rose-100",        icon: XCircle,      iconColor: "text-rose-600" },
        ].map(({ label, value, color, icon: Icon, iconColor }) => (
          <div key={label} className={`rounded-2xl border p-5 flex items-center gap-4 ${color}`}>
            <div className={`p-2.5 rounded-xl bg-white border border-white/60 shadow-sm ${iconColor}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Report Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex-wrap gap-3">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-slate-500" />
            Report History
          </h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none appearance-none pr-7 cursor-pointer">
                <option value="all">All Statuses</option>
                {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <button onClick={loadData} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {filteredReports.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
              <FileText className="w-7 h-7 text-slate-300" />
            </div>
            <p className="text-sm font-bold text-slate-600">No reports yet</p>
            <p className="text-xs text-slate-400">Submit your first daily report to get started.</p>
            <button onClick={openNewForm} className="mt-2 px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors cursor-pointer">
              Submit Report
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {["Date", "Project", "Status", "Progress", "Hours", "Submitted", "Feedback", "Actions"].map(h => (
                    <th key={h} className="px-5 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-[10px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredReports.map(report => {
                  const sc = STATUS_CONFIG[report.status] || STATUS_CONFIG["Draft"];
                  const canEdit = report.status === "Draft" || report.status === "Pending Review";
                  const id = report._id || report.id;
                  return (
                    <tr key={id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4 font-semibold text-slate-700">{formatDate(report.reportDate)}</td>
                      <td className="px-5 py-4 text-slate-500 max-w-[150px] truncate">{report.projectName || <span className="text-slate-300 italic">No project</span>}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${sc.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {report.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-amber-400" style={{ width: `${report.progressPercentage || 0}%` }} />
                          </div>
                          <span className="text-slate-500 font-semibold">{report.progressPercentage || 0}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-500">{report.hoursWorked}h</td>
                      <td className="px-5 py-4 text-slate-400">{formatTime(report.createdAt)}</td>
                      <td className="px-5 py-4 max-w-[160px]">
                        {report.managerFeedback
                          ? <span className="flex items-center gap-1 text-indigo-600 font-semibold"><MessageSquare className="w-3 h-3" /><span className="truncate">{report.managerFeedback}</span></span>
                          : <span className="text-slate-300 italic">—</span>}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setViewReport(report)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"><Eye className="w-3.5 h-3.5" /></button>
                          {canEdit && <button onClick={() => openEditForm(report)} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"><Edit3 className="w-3.5 h-3.5" /></button>}
                          {report.status === "Draft" && <button onClick={() => handleDelete(id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Submit / Edit Modal */}
      <AnimatePresence>
        {formOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
                <div>
                  <h2 className="text-base font-bold text-slate-900">{editingReport ? "Edit Report" : "Submit Daily Report"}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Fill in your work details</p>
                </div>
                <button onClick={() => setFormOpen(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
              </div>
              <div className="overflow-y-auto p-6 space-y-5 flex-1">
                {errorMsg && (
                  <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0" />{errorMsg}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Report Date</label>
                    <div className="relative">
                      <CalendarDays className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input type="date" value={form.reportDate} onChange={e => setForm(p => ({ ...p, reportDate: e.target.value }))}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-100" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Project</label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <select value={form.projectId} onChange={handleProjectChange}
                        className="w-full pl-9 pr-7 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-slate-50 focus:outline-none appearance-none cursor-pointer">
                        <option value="">Select Project (Optional)</option>
                        {projects.map(p => <option key={p._id || p.id} value={p._id || p.id}>{p.name}</option>)}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Work Completed Today <span className="text-rose-500">*</span></label>
                  <textarea value={form.workCompleted} onChange={e => setForm(p => ({ ...p, workCompleted: e.target.value }))} rows={4}
                    placeholder="Describe what you completed today..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-100 resize-none placeholder-slate-300" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Challenges Faced</label>
                  <textarea value={form.challenges} onChange={e => setForm(p => ({ ...p, challenges: e.target.value }))} rows={2}
                    placeholder="Any blockers or challenges..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-100 resize-none placeholder-slate-300" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Progress: <span className="text-amber-600">{form.progressPercentage}%</span></label>
                    <input type="range" min={0} max={100} value={form.progressPercentage}
                      onChange={e => setForm(p => ({ ...p, progressPercentage: Number(e.target.value) }))}
                      className="w-full h-2 rounded-full accent-amber-500 cursor-pointer" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Hours Worked</label>
                    <input type="number" min={0} max={24} value={form.hoursWorked}
                      onChange={e => setForm(p => ({ ...p, hoursWorked: Number(e.target.value) }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-100" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Tomorrow's Plan</label>
                  <textarea value={form.tomorrowPlan} onChange={e => setForm(p => ({ ...p, tomorrowPlan: e.target.value }))} rows={2}
                    placeholder="What do you plan to work on tomorrow..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-100 resize-none placeholder-slate-300" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Attachment (Optional)</label>
                  <label className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-slate-200 hover:border-amber-300 hover:bg-amber-50/30 transition-colors cursor-pointer group">
                    <Paperclip className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
                    <span className="text-xs text-slate-500 font-medium">{form.attachment ? form.attachment.name : "Click to upload file"}</span>
                    <input type="file" className="hidden" onChange={handleFileChange} />
                  </label>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 shrink-0 bg-slate-50/30">
                <button onClick={() => setFormOpen(false)} className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">Cancel</button>
                <button onClick={() => handleSubmit("Draft")} disabled={submitting}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50">
                  <Save className="w-3.5 h-3.5" />Save Draft
                </button>
                <button onClick={() => handleSubmit("Pending Review")} disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 shadow-md transition-all cursor-pointer disabled:opacity-50">
                  {submitting ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Submit Report
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Modal */}
      <AnimatePresence>
        {viewReport && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Report Details</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{formatDate(viewReport.reportDate)}</p>
                </div>
                <div className="flex items-center gap-3">
                  {(() => { const sc = STATUS_CONFIG[viewReport.status] || STATUS_CONFIG["Draft"]; return (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold ${sc.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{viewReport.status}
                    </span>
                  ); })()}
                  <button onClick={() => setViewReport(null)} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
                </div>
              </div>
              <div className="overflow-y-auto p-6 space-y-4 flex-1">
                {viewReport.projectName && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-600">Project: {viewReport.projectName}</span>
                  </div>
                )}
                <div>
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Work Completed</h3>
                  <p className="text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">{viewReport.workCompleted}</p>
                </div>
                {viewReport.challenges && (
                  <div>
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Challenges</h3>
                    <p className="text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">{viewReport.challenges}</p>
                  </div>
                )}
                {viewReport.tomorrowPlan && (
                  <div>
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Tomorrow's Plan</h3>
                    <p className="text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">{viewReport.tomorrowPlan}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <p className="text-lg font-bold text-amber-600">{viewReport.progressPercentage || 0}%</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Progress</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <p className="text-lg font-bold text-slate-700">{viewReport.hoursWorked || 0}h</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Hours Worked</p>
                  </div>
                </div>
                {viewReport.attachment?.name && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <Paperclip className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-600">{viewReport.attachment.name}</span>
                  </div>
                )}
                {viewReport.managerFeedback && (
                  <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                    <h3 className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />Manager Feedback
                    </h3>
                    <p className="text-sm text-indigo-800 font-medium leading-relaxed">{viewReport.managerFeedback}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 shrink-0">
                {(viewReport.status === "Draft" || viewReport.status === "Pending Review") && (
                  <button onClick={() => { setViewReport(null); openEditForm(viewReport); }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
                    <Edit3 className="w-3.5 h-3.5" />Edit
                  </button>
                )}
                <button onClick={() => setViewReport(null)} className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer">Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
