"use client";

import { useState, useEffect } from "react";
import { 
  Megaphone, 
  Pin, 
  Send, 
  Trash2, 
  Eye, 
  Filter, 
  AlertCircle, 
  Plus, 
  Sparkles,
  CheckCircle2,
  Users,
  Clock,
  ShieldAlert
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";

export default function AdminAnnouncementsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [toast, setToast] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "General",
    priority: "Medium",
    targetRole: "All",
    pinned: false
  });

  // Filter States
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [audienceFilter, setAudienceFilter] = useState("All");

  // Load user session and announcements list
  useEffect(() => {
    const session = apiClient.getCurrentSession();
    setCurrentUser(session);

    async function loadAnnouncements() {
      try {
        const list = await apiClient.getAnnouncements();
        setAnnouncements(list);
      } catch (err) {
        showToast("error", "Failed to retrieve corporate announcements.");
      } finally {
        setLoading(false);
      }
    }

    loadAnnouncements();
  }, []);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      showToast("error", "Please provide both a Title and Content description.");
      return;
    }

    setPublishing(true);
    try {
      const payload = {
        ...formData,
        email: currentUser?.email // passed down for programmatic fallback lookups
      };

      const result = await apiClient.createAnnouncement(payload);

      if (result.success) {
        setAnnouncements((prev) => [result.announcement, ...prev]);
        setFormData({
          title: "",
          content: "",
          category: "General",
          priority: "Medium",
          targetRole: "All",
          pinned: false
        });
        showToast(
          "success",
          result.offline 
            ? "Announcement buffered locally (offline)." 
            : "Announcement published successfully to all staff."
        );
      } else {
        showToast("error", result.message || "Failed to create announcement.");
      }
    } catch (err) {
      showToast("error", "An unexpected service error occurred.");
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to retract and delete this announcement bulletin?")) {
      return;
    }

    try {
      const result = await apiClient.deleteAnnouncement(id);
      if (result.success) {
        setAnnouncements((prev) => prev.filter((a) => a.id !== id && a._id !== id));
        showToast(
          "success",
          result.offline
            ? "Announcement removed locally (offline)."
            : "Announcement retracted and deleted successfully."
        );
      } else {
        showToast("error", result.message || "Failed to retract announcement.");
      }
    } catch (err) {
      showToast("error", "Failed to contact database endpoint.");
    }
  };

  // Filter logic
  const filteredAnnouncements = announcements.filter((a) => {
    const matchesCategory = categoryFilter === "All" || a.category === categoryFilter;
    const matchesAudience = audienceFilter === "All" || a.targetRole === audienceFilter;
    return matchesCategory && matchesAudience;
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "bg-rose-50 text-rose-700 border-rose-100";
      case "Medium":
        return "bg-amber-50 text-amber-700 border-amber-100";
      default:
        return "bg-blue-50 text-blue-700 border-blue-100";
    }
  };

  const getCategoryStyles = (category) => {
    switch (category) {
      case "Urgent":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "Policy":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Event":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Payroll":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      default:
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="space-y-8 font-sans antialiased text-slate-800 animate-fade-in pb-12">
      
      {/* Toast Alert Box */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border transition-all duration-300 animate-slide-in bg-white max-w-sm">
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <p className="text-xs font-bold text-slate-900 leading-snug">{toast.message}</p>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-[0.03] bg-gradient-to-l from-indigo-650 to-transparent pointer-events-none" />
        <div className="space-y-2 text-left">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-bold border border-indigo-100">
            <Sparkles className="w-3 h-3" />
            Corporate Communications
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Announcements Hub</h1>
          <p className="text-xs font-medium text-slate-405 max-w-xl">
            Publish official HRA Groups corporate bulletins, broadcast urgent news, and target visibility to specific user roles.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: publisher form & live dropdown preview */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Publication Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                <Plus className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 text-left">Publish New Bulletin</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Q3 Strategic Planning Offsite"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition-all font-semibold"
                  required
                />
              </div>

              {/* Category & Priority Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 bg-white transition-all font-semibold"
                  >
                    <option value="General">General</option>
                    <option value="Event">Event</option>
                    <option value="Policy">Policy</option>
                    <option value="Payroll">Payroll</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Priority</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 bg-white transition-all font-semibold"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              {/* Target Audience */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Audience</label>
                <select
                  name="targetRole"
                  value={formData.targetRole}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 bg-white transition-all font-semibold"
                >
                  <option value="All">All Staff Roles</option>
                  <option value="Employee">Employees Only</option>
                  <option value="Manager">Managers Only</option>
                  <option value="Intern">Interns Only</option>
                  <option value="HR">HR Colleagues</option>
                  <option value="Admin">System Administrators</option>
                </select>
              </div>

              {/* Pin Checkbox */}
              <div className="flex items-center gap-2.5 py-2.5 border-y border-slate-100">
                <input
                  type="checkbox"
                  id="pinned"
                  name="pinned"
                  checked={formData.pinned}
                  onChange={handleInputChange}
                  className="w-4 h-4 rounded text-indigo-650 border-slate-350 focus:ring-indigo-500 focus:ring-2 cursor-pointer"
                />
                <label htmlFor="pinned" className="text-xs font-bold text-slate-700 select-none cursor-pointer flex items-center gap-1.5">
                  <Pin className="w-3.5 h-3.5 text-indigo-500" />
                  Pin this announcement to top of feed
                </label>
              </div>

              {/* Content */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Message Details</label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  rows={5}
                  placeholder="Write the full announcement details..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition-all font-medium resize-y"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={publishing}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 shadow-lg shadow-indigo-100 hover:shadow-xl hover:shadow-indigo-200 active:scale-98 transition-all cursor-pointer"
              >
                {publishing ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Publish Bulletin
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Live Preview Widget */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-bold text-slate-600">Bell Dropdown Preview</h3>
              </div>
              <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider">Visual Sync</span>
            </div>

            <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 text-left relative overflow-hidden">
              <span className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse shadow-sm" />
              
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getCategoryStyles(formData.category)}`}>
                    {formData.category}
                  </span>
                  {formData.pinned && (
                    <span className="flex items-center gap-0.5 text-[9px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                      <Pin className="w-2.5 h-2.5" />
                      Pinned
                    </span>
                  )}
                  <span className="text-[9px] font-medium text-slate-400 flex items-center gap-1 ml-auto">
                    <Clock className="w-2.5 h-2.5" />
                    Just now
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-900 leading-snug">
                  {formData.title || "Announcement Title"}
                </h4>
                
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed break-words whitespace-pre-wrap">
                  {formData.content || "The message preview will display dynamically here as you type. Adjust priority and categorization inputs above."}
                </p>

                <div className="flex items-center gap-1.5 pt-1 text-[9px] font-medium text-slate-400 border-t border-slate-100/50 mt-1">
                  <span className="font-bold text-slate-800">By {currentUser?.name || "HR Officer"}</span>
                  <span className="text-slate-350">•</span>
                  <span className="uppercase text-[8px] font-bold text-indigo-600">{currentUser?.role || "HR"}</span>
                  <span className="text-slate-350">•</span>
                  <span className="text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded text-[8px]">
                    To: {formData.targetRole === "All" ? "All Staff" : `${formData.targetRole}s`}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: bulletin list history & filters */}
        <div className="lg:col-span-7 space-y-6 text-left">
          
          {/* History header with filters */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="flex items-center gap-2 shrink-0">
              <Megaphone className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">Bulletin Board History</h2>
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                {announcements.length}
              </span>
            </div>

            {/* Filter group */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filter:</span>
              </div>

              {/* Category selector */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-indigo-400 bg-white font-semibold cursor-pointer"
              >
                <option value="All">All Categories</option>
                <option value="General">General</option>
                <option value="Event">Event</option>
                <option value="Policy">Policy</option>
                <option value="Payroll">Payroll</option>
                <option value="Urgent">Urgent</option>
              </select>

              {/* Target Audience selector */}
              <select
                value={audienceFilter}
                onChange={(e) => setAudienceFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-indigo-400 bg-white font-semibold cursor-pointer"
              >
                <option value="All">All Audiences</option>
                <option value="All">All Staff Roles</option>
                <option value="Employee">Employees</option>
                <option value="Manager">Managers</option>
                <option value="Intern">Interns</option>
                <option value="HR">HR</option>
                <option value="Admin">Administrators</option>
              </select>
            </div>

          </div>

          {/* List display */}
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-sm">
              <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-slate-800 animate-spin mx-auto mb-4" />
              <p className="text-xs font-semibold text-slate-400">Loading published announcements...</p>
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center shadow-sm space-y-4">
              <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mx-auto border border-slate-100/50">
                <Megaphone className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-700">No Bulletins Matched</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  No published announcements match the selected filter criteria. Clear filters or create a new corporate announcement.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAnnouncements.map((item) => {
                const itemId = item.id || item._id;
                return (
                  <div
                    key={itemId}
                    className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4 hover:shadow-md transition-all group text-left relative overflow-hidden ${
                      item.pinned ? "border-l-4 border-l-indigo-600" : ""
                    }`}
                  >
                    
                    {/* Top Meta info */}
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getCategoryStyles(item.category)}`}>
                        {item.category}
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getPriorityColor(item.priority)}`}>
                        {item.priority} Priority
                      </span>
                      {item.pinned && (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                          <Pin className="w-3 h-3" />
                          Pinned
                        </span>
                      )}
                      
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium ml-auto">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                    </div>

                    {/* Announcement Title */}
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                      {item.title}
                    </h3>

                    {/* Announcement Content Description */}
                    <p className="text-xs text-slate-500 font-medium leading-relaxed break-words words-break whitespace-pre-wrap">
                      {item.content}
                    </p>

                    {/* Footer Row */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      
                      <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Published by: <strong>{item.createdByName}</strong> ({item.createdByRole})</span>
                        </div>
                        <span className="text-slate-200">•</span>
                        <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded text-[10px] text-slate-500 font-bold border border-slate-100">
                          <Users className="w-3 h-3 text-slate-400" />
                          <span>Audience: {item.targetRole === "All" ? "All Staff" : `${item.targetRole}s`}</span>
                        </div>
                      </div>

                      {/* Action buttons (only HR or Admin can delete) */}
                      {(currentUser?.role === "Admin" || currentUser?.role === "HR") && (
                        <button
                          type="button"
                          onClick={() => handleDelete(itemId)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all font-bold text-[10px] cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Retract
                        </button>
                      )}

                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
