"use client";

import { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  X,
  Paperclip,
  Briefcase,
  ChevronDown,
  RefreshCw,
  MessageSquare,
  BarChart3,
  ThumbsUp,
  ThumbsDown,
  Search,
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";

const STATUS_CONFIG = {
  "Draft":          { color: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",      dot: "bg-slate-400" },
  "Pending Review": { color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50",       dot: "bg-amber-400" },
  "Approved":       { color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50", dot: "bg-emerald-400" },
  "Rejected":       { color: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50",          dot: "bg-rose-400" },
};

export default function AdminReportsPage() {
  const [currentUser, setCurrentUser]       = useState(null);
  const [reports, setReports]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [submitting, setSubmitting]         = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [feedback, setFeedback]             = useState("");
  const [successMsg, setSuccessMsg]         = useState("");
  const [errorMsg, setErrorMsg]             = useState("");

  // Filters
  const [searchQuery, setSearchQuery]       = useState("");
  const [statusFilter, setStatusFilter]     = useState("all");

  const loadData = async () => {
    setLoading(true);
    try {
      const session = apiClient.getCurrentSession();
      setCurrentUser(session);
      const email = session?.email || "";
      const fetchedReports = await apiClient.getReports({ email });
      setReports(fetchedReports || []);
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const stats = useMemo(() => ({
    total:    reports.length,
    pending:  reports.filter(r => r.status === "Pending Review").length,
    approved: reports.filter(r => r.status === "Approved").length,
    rejected: reports.filter(r => r.status === "Rejected").length,
  }), [reports]);

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const employeeNameMatch = r.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
      const projectNameMatch = r.projectName?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
      const workCompletedMatch = r.workCompleted?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
      
      const matchesSearch = employeeNameMatch || projectNameMatch || workCompletedMatch;
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [reports, searchQuery, statusFilter]);

  const openDetails = (report) => {
    setSelectedReport(report);
    setFeedback(report.managerFeedback || "");
    setErrorMsg("");
  };

  const handleAction = async (action) => {
    if (!selectedReport) return;
    setSubmitting(true);
    setErrorMsg("");
    try {
      const id = selectedReport._id || selectedReport.id;
      const result = await apiClient.updateReport({
        id,
        status: action === "approve" ? "Approved" : action === "reject" ? "Rejected" : undefined,
        managerFeedback: feedback,
        reviewerEmail: currentUser?.email,
        reviewerName: currentUser?.name,
      });
      if (result.success) {
        setSuccessMsg(action === "approve" ? "Report approved!" : action === "reject" ? "Report rejected." : "Feedback saved!");
        setTimeout(() => setSuccessMsg(""), 3000);
        setSelectedReport(null);
        loadData();
      } else {
        setErrorMsg(result.message || "Action failed.");
      }
    } catch (err) {
      setErrorMsg("An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";
  const formatTime = (d) => d ? new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-slate-205 border-t-indigo-650 animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Loading organization reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left animate-fade-in">

      {/* Success Banner */}
      {successMsg && (
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-100 text-emerald-700 text-sm font-semibold shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />{successMsg}
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-100 border border-slate-200">
              <TrendingUp className="w-5 h-5 text-slate-700" />
            </div>
            Company-wide Personnel Reports
          </h1>
          <p className="text-sm text-slate-400 mt-1 font-medium">Review and audit daily work reports from all company employees and interns</p>
        </div>
        <button onClick={loadData} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-605 hover:bg-slate-50 transition-colors cursor-pointer">
          <RefreshCw className="w-4 h-4" />Refresh
        </button>
      </div>

      {/* KPI Stats */}
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

      {/* Reports Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex-wrap gap-3">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-slate-500" />
            All System Reports
          </h2>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input type="text" placeholder="Search employee, project..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-4 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-655 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 w-52" />
            </div>
            {/* Status Filter */}
            <div className="relative">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none appearance-none pr-7 cursor-pointer">
                <option value="all">All Statuses</option>
                {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {filteredReports.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
              <FileText className="w-7 h-7 text-slate-305" />
            </div>
            <p className="text-sm font-bold text-slate-600">No reports found</p>
            <p className="text-xs text-slate-400">No daily status reports have been registered.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {["Employee", "Date", "Project", "Status", "Progress", "Hours", "Submitted", "Actions"].map(h => (
                    <th key={h} className="px-5 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-[10px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredReports.map(report => {
                  const sc = STATUS_CONFIG[report.status] || STATUS_CONFIG["Draft"];
                  const id = report._id || report.id;
                  return (
                    <tr key={id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">
                            {report.employeeName?.slice(0, 2).toUpperCase() || "U"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-700">{report.employeeName}</p>
                            <p className="text-slate-400 text-[10px]">{report.employeeRole}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-600">{formatDate(report.reportDate)}</td>
                      <td className="px-5 py-4 text-slate-500 max-w-[130px] truncate">{report.projectName || <span className="text-slate-300 italic">—</span>}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${sc.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{report.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-emerald-400" style={{ width: `${report.progressPercentage || 0}%` }} />
                          </div>
                          <span className="text-slate-500 font-semibold">{report.progressPercentage || 0}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-500">{report.hoursWorked}h</td>
                      <td className="px-5 py-4 text-slate-400">{formatTime(report.createdAt)}</td>
                      <td className="px-5 py-4">
                        <button onClick={() => openDetails(report)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer">
                          <Eye className="w-3 h-3" />Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Report Review Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

            {/* Modal Header */}
            <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                  {selectedReport.employeeName?.slice(0, 2).toUpperCase() || "U"}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-905">{selectedReport.employeeName}</h2>
                  <p className="text-xs text-slate-400">{selectedReport.employeeRole} · {formatDate(selectedReport.reportDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {(() => { const sc = STATUS_CONFIG[selectedReport.status] || STATUS_CONFIG["Draft"]; return (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold ${sc.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{selectedReport.status}
                  </span>
                ); })()}
                <button onClick={() => setSelectedReport(null)} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-55 transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto p-6 space-y-5 flex-1">
              {errorMsg && (
                <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-50/80 border border-rose-100 text-rose-700 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />{errorMsg}
                </div>
              )}

              {/* Project & Stats */}
              <div className="grid grid-cols-3 gap-3">
                {selectedReport.projectName && (
                  <div className="col-span-3 flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-600">Project: {selectedReport.projectName}</span>
                  </div>
                )}
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                  <p className="text-xl font-bold text-emerald-600">{selectedReport.progressPercentage || 0}%</p>
                  <p className="text-[10px] text-slate-505 font-semibold">Progress</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <p className="text-xl font-bold text-slate-700">{selectedReport.hoursWorked || 0}h</p>
                  <p className="text-[10px] text-slate-500 font-semibold">Hours Worked</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <p className="text-xl font-bold text-slate-700">{formatDate(selectedReport.reportDate)}</p>
                  <p className="text-[10px] text-slate-500 font-semibold">Report Date</p>
                </div>
              </div>

              {/* Work Completed */}
              <div className="text-left">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Work Completed</h3>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">{selectedReport.workCompleted}</p>
                </div>
              </div>

              {/* Challenges */}
              {selectedReport.challenges && (
                <div className="text-left">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Challenges Faced</h3>
                  <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100">
                    <p className="text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">{selectedReport.challenges}</p>
                  </div>
                </div>
              )}

              {/* Tomorrow's Plan */}
              {selectedReport.tomorrowPlan && (
                <div className="text-left">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Tomorrow's Plan</h3>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">{selectedReport.tomorrowPlan}</p>
                  </div>
                </div>
              )}

              {/* Attachment */}
              {selectedReport.attachment?.name && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <Paperclip className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-655">{selectedReport.attachment.name}</span>
                </div>
              )}

              {/* Manager Feedback Input */}
              <div className="text-left">
                <label className="block text-xs font-bold text-slate-707 mb-1.5 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                  Admin / Manager Feedback
                </label>
                <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={3}
                  placeholder="Add feedback for the employee..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-900 resize-none placeholder-slate-300" />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 shrink-0 bg-slate-50/30">
              <button onClick={() => setSelectedReport(null)} className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
                Close
              </button>
              <div className="flex items-center gap-3">
                {/* Save feedback only */}
                <button onClick={() => handleAction("feedback")} disabled={submitting || !feedback.trim()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 text-slate-755 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-40">
                  <MessageSquare className="w-3.5 h-3.5" />Save Feedback
                </button>
                {/* Reject */}
                {selectedReport.status === "Pending Review" && (
                  <button onClick={() => handleAction("reject")} disabled={submitting}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-100 transition-colors cursor-pointer disabled:opacity-50">
                    {submitting ? <div className="w-3.5 h-3.5 border-2 border-rose-200 border-t-rose-600 rounded-full animate-spin" /> : <ThumbsDown className="w-3.5 h-3.5" />}
                    Reject
                  </button>
                )}
                {/* Approve */}
                {selectedReport.status === "Pending Review" && (
                  <button onClick={() => handleAction("approve")} disabled={submitting}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-md transition-all cursor-pointer disabled:opacity-50">
                    {submitting ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ThumbsUp className="w-3.5 h-3.5" />}
                    Approve
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
