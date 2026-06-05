"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Star, 
  Send, 
  User, 
  Shield, 
  MessageSquare, 
  Info, 
  AlertCircle,
  CheckCircle2,
  Plus,
  Paperclip,
  X,
  Loader2,
  Ticket,
  CornerDownRight,
  Inbox,
  Clock,
  ThumbsUp,
  ChevronRight,
  Search
} from "lucide-react";

// ==========================================
// 1. REUSABLE PREMIUM FEEDBACK FORM COMPONENT
// ==========================================
function FeedbackForm({ user, onSuccess }) {
  const CATEGORIES = [
    "Work Environment",
    "Management / Leadership",
    "Salary & Benefits",
    "Work-Life Balance",
    "Team Collaboration",
    "Facilities / Infrastructure",
    "Others",
  ];

  const PRIORITIES = ["Low", "Medium", "High", "Critical"];

  const [formData, setFormData] = useState({
    isAnonymous: false,
    category: "",
    subject: "",
    content: "",
    suggestions: "",
    ratings: {
      jobSatisfaction: 0,
      workEnvironment: 0,
      managementSupport: 0,
      growthOpportunities: 0
    },
    priority: "Medium",
    allowHRContact: false,
    employeeDetails: {
      name: user?.name || "",
      employeeId: user?.employeeId || "",
      department: user?.department || "Operations",
      role: user?.role || "Staff",
      workLocation: "Office"
    },
    attachments: []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // Sync and auto-populate employee details once user session is loaded
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        employeeDetails: {
          ...prev.employeeDetails,
          name: prev.employeeDetails.name || user.name || "",
          employeeId: prev.employeeDetails.employeeId || user.employeeId || user.id || "",
          department: prev.employeeDetails.department === "Operations" ? (user.department || "Operations") : prev.employeeDetails.department,
          role: prev.employeeDetails.role === "Staff" ? (user.role || "Staff") : prev.employeeDetails.role
        }
      }));
    }
  }, [user]);

  const handleRating = (key, value) => {
    setFormData(prev => ({
      ...prev,
      ratings: { ...prev.ratings, [key]: value }
    }));
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (formData.attachments.length + files.length > 3) {
      setError("Maximum 3 attachments allowed.");
      return;
    }

    const validFiles = files.filter(file => {
      const isValidType = ["application/pdf", "image/jpeg", "image/png"].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      return isValidType && isValidSize;
    });

    if (validFiles.length < files.length) {
      setError("Some files were rejected. Only PDF, JPG, PNG under 5MB are allowed.");
    }

    try {
      const readPromises = validFiles.map(file => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              name: file.name,
              type: file.type,
              url: reader.result // Base64 data URL
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      const newAttachments = await Promise.all(readPromises);

      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...newAttachments]
      }));
    } catch (err) {
      setError("Failed to read file contents.");
    }
  };

  const removeAttachment = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category) { setError("Please select a category."); return; }
    
    setIsSubmitting(true);
    setError("");

    const email = user?.email || "";
    let apiSuccess = false;
    let errorMessage = "";

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, email }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        apiSuccess = true;
      } else {
        errorMessage = data.message || "Failed to broadcast signal to database.";
      }
    } catch (err) {
      console.warn("MongoDB post failed, falling back to LocalStorage:", err);
      apiSuccess = false;
    }

    if (apiSuccess) {
      setIsSubmitting(false);
      setSubmitted(true);
      if (onSuccess) {
        onSuccess();
      }
    } else {
      if (errorMessage) {
        setError(errorMessage);
        setIsSubmitting(false);
      } else {
        // Genuine offline or connection error fallback
        const localTicket = {
          _id: `local-${Date.now()}`,
          id: Date.now(),
          userId: user?.id || user?._id || null,
          userEmail: user?.email || email || null,
          ticketId: "#TKT-" + Math.floor(100000 + Math.random() * 900000),
          createdAt: new Date().toISOString(),
          date: new Date().toISOString().split("T")[0],
          category: formData.category,
          subject: formData.subject,
          content: formData.content,
          suggestions: formData.suggestions,
          ratings: formData.ratings,
          priority: formData.priority,
          sentiment: "Neutral",
          isAnonymous: formData.isAnonymous,
          status: "Pending",
          replies: [],
          employeeDetails: formData.employeeDetails,
          attachments: formData.attachments
        };

        const localTickets = JSON.parse(localStorage.getItem("hra_feedback_tickets") || "[]");
        localStorage.setItem("hra_feedback_tickets", JSON.stringify([localTicket, ...localTickets]));

        setIsSubmitting(false);
        setSubmitted(true);
        if (onSuccess) {
          onSuccess();
        }
      }
    }
  };

  if (submitted) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/80 backdrop-blur-2xl rounded-[3rem] p-12 border border-white shadow-2xl flex flex-col items-center text-center space-y-6 max-w-2xl mx-auto"
      >
        <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-100">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">Ticket Submitted Successfully.</h3>
        <p className="text-slate-500 font-medium leading-relaxed italic">Your support ticket has been submitted successfully. You can monitor its progress in the Ticket Tracking section.</p>
        <button 
          type="button"
          onClick={() => setSubmitted(false)}
          className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-blue-600 transition-all active:scale-95 shadow-xl shadow-slate-200"
        >
          Raise Another Ticket
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10 w-full pb-20">
      {/* 1. Basic Details */}
      <section className="bg-white/95 backdrop-blur-2xl rounded-[3rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/40 space-y-8 text-left">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
            <Ticket className="w-5 h-5 text-indigo-600" />
            1. Ticket Submitter Details
          </h3>
          <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
            <Shield className="w-4 h-4 text-slate-400" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Anonymous Protocol</span>
            <button 
              type="button"
              onClick={() => setFormData(p => ({ ...p, isAnonymous: !p.isAnonymous }))}
              className={`w-10 h-5 rounded-full transition-all relative ${formData.isAnonymous ? "bg-indigo-600" : "bg-slate-300"}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${formData.isAnonymous ? "right-1" : "left-1"}`} />
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!formData.isAnonymous ? (
            <motion.div 
              key="identified"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden"
            >
              {[
                { label: "Full Name", val: formData.employeeDetails.name, key: "name" },
                { label: "Employee ID", val: formData.employeeDetails.employeeId, key: "employeeId" },
                { label: "Department", val: formData.employeeDetails.department, key: "department" },
                { label: "Work Location", val: formData.employeeDetails.workLocation, key: "workLocation" },
              ].map(field => (
                <div key={field.key} className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">{field.label}</label>
                  <input 
                    type="text" 
                    value={field.val}
                    onChange={e => setFormData(p => ({ ...p, employeeDetails: { ...p.employeeDetails, [field.key]: e.target.value } }))}
                    className="w-full h-12 px-6 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-mono"
                    placeholder={`Enter ${field.label}`}
                  />
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="anonymous"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 bg-slate-900 rounded-3xl border border-white/10 flex items-center gap-6"
            >
              <div className="w-12 h-12 bg-white/10 text-white rounded-2xl flex items-center justify-center shadow-inner">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-black text-white uppercase tracking-widest mb-1">Stealth Mode Activated</p>
                <p className="text-xs text-slate-400 italic">Identity parameters have been purged. Only the ticket payload will be visible to receivers.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* 2. Category */}
      <section className="bg-white/95 backdrop-blur-2xl rounded-[3rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/40 space-y-8 text-left">
        <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest flex items-center gap-3 pb-4 border-b border-slate-100">
           <Plus className="w-5 h-5 text-indigo-650" />
           2. Ticket Category
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setFormData(p => ({ ...p, category: cat }))}
              className={`p-5 rounded-2xl text-[10px] font-black uppercase tracking-wider text-left transition-all border cursor-pointer ${
                formData.category === cat 
                  ? "bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-200" 
                  : "bg-slate-50 text-slate-400 border-slate-100 hover:bg-white hover:border-slate-300 hover:text-slate-900"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* 3. Content */}
      <section className="bg-white/95 backdrop-blur-2xl rounded-[3rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/40 space-y-8 text-left">
        <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest flex items-center gap-3 pb-4 border-b border-slate-100">
          <MessageSquare className="w-5 h-5 text-indigo-600" />
          3. Ticket Details
        </h3>
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Ticket Subject</label>
            <input 
              type="text" 
              required
              value={formData.subject}
              onChange={e => setFormData(p => ({ ...p, subject: e.target.value }))}
              className="w-full h-12 px-6 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all shadow-inner"
              placeholder="Enter the subject of your ticket..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Detailed Description</label>
            <textarea 
              required
              rows={5}
              value={formData.content}
              onChange={e => setFormData(p => ({ ...p, content: e.target.value }))}
              className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-none italic"
              placeholder="Provide a detailed explanation of the ticket issue..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Proposed Solution / Suggestions (Optional)</label>
            <textarea 
              rows={3}
              value={formData.suggestions}
              onChange={e => setFormData(p => ({ ...p, suggestions: e.target.value }))}
              className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-none italic"
              placeholder="Provide any recommendations or suggested optimizations..."
            />
          </div>
        </div>
      </section>

      <section className="bg-white/95 backdrop-blur-2xl rounded-[3rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/40 space-y-8 text-left">
        <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest flex items-center gap-3 pb-4 border-b border-slate-100">
          <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
          4. Sentiment & Ratings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { id: "jobSatisfaction", label: "Job Satisfaction" },
            { id: "workEnvironment", label: "Environment" },
            { id: "managementSupport", label: "Leadership Support" },
            { id: "growthOpportunities", label: "Career Projection" },
          ].map(item => (
            <div key={item.id} className="flex flex-col p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:bg-white transition-all text-left">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 group-hover:text-indigo-650">{item.label}</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRating(item.id, star)}
                    className={`transition-all cursor-pointer ${formData.ratings[item.id] >= star ? "text-amber-500 scale-110 drop-shadow-md" : "text-slate-200"}`}
                  >
                    <Star className="w-7 h-7 fill-current" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Priority & Attachments */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 text-left">
        <section className="lg:col-span-4 bg-white/95 backdrop-blur-2xl rounded-[3rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/40 space-y-8">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3 pb-4 border-b border-slate-100 leading-none">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            Priority level
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {PRIORITIES.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, priority: p }))}
                className={`w-full py-4 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-between px-6 border transition-all cursor-pointer ${
                  formData.priority === p 
                    ? (p === "Critical" ? "bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-200" : "bg-slate-900 text-white border-slate-900 shadow-lg")
                    : "bg-slate-50 text-slate-400 border-slate-100"
                }`}
              >
                {p}
                {formData.priority === p && <CheckCircle2 className="w-3 h-3" />}
              </button>
            ))}
          </div>
        </section>

        <section className="lg:col-span-8 bg-white/95 backdrop-blur-2xl rounded-[3rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/40 space-y-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform text-slate-900">
             <Paperclip className="w-40 h-40" />
          </div>
          <h3 className="text-lg font-black uppercase tracking-widest flex items-center gap-3 pb-6 border-b border-slate-100 mb-8 leading-none text-slate-900">
            <Paperclip className="w-5 h-5 text-slate-450" />
            Attachments Hub
          </h3>
          <div className="space-y-6 relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               {formData.attachments.map((file, idx) => (
                  <div key={idx} className="bg-slate-50 rounded-2xl p-4 flex flex-col justify-between h-32 border border-slate-100 group/file">
                     <div className="flex justify-between items-start">
                        <div className="w-8 h-8 bg-white border border-slate-100 rounded-lg flex items-center justify-center">
                           <Ticket className="w-4 h-4 text-slate-500" />
                        </div>
                        <button type="button" onClick={() => removeAttachment(idx)} className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
                     </div>
                     <p className="text-[9px] font-bold text-slate-700 uppercase truncate tracking-widest">{file.name}</p>
                  </div>
               ))}
               {formData.attachments.length < 3 && (
                  <label className="bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-2xl h-32 flex flex-col items-center justify-center hover:bg-slate-50 hover:border-slate-350 transition-all cursor-pointer group/add">
                     <input type="file" multiple onChange={handleFileChange} className="hidden" accept=".pdf,.jpg,.png" />
                     <Plus className="w-8 h-8 text-slate-400 group-hover/add:text-slate-600 mb-2" />
                     <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 group-hover/add:text-slate-700 text-center px-4">Attach PDF, JPG, PNG (Max 5MB)</p>
                  </label>
               )}
            </div>
            
            <div className="pt-6 flex justify-between items-center text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 italic">
               <p>Max: 3 Files</p>
               <p>{formData.attachments.length}/3 Utilized</p>
            </div>
          </div>
        </section>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="p-6 bg-rose-50 text-rose-600 rounded-[2rem] border border-rose-100 flex items-center gap-4 text-xs font-black uppercase tracking-widest shadow-xl shadow-rose-100/20">
          <AlertCircle className="w-5 h-5" />
          {error}
        </motion.div>
      )}

      {/* Footer / Submit */}
      <div className="flex items-center justify-between pt-10 border-t border-slate-200">
        <div>
           <div className="flex items-center gap-3 px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100 text-slate-400">
              <Shield className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Secure Encrypted Ticket Submission Active</span>
           </div>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-14 py-6 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-xs shadow-[0_32px_60px_-15px_rgba(0,0,0,0.3)] hover:bg-blue-600 transition-all active:scale-[0.98] flex items-center gap-6 disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Submit Ticket
              <Send className="w-5 h-5 shadow-inner" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// =====================================
// 2. MAIN FEEDBACK PORTAL WRAPPER
// =====================================
export default function EmployeeFeedbackTab() {
  const [activeTab, setActiveTab] = useState("logs"); // Default to logs (Ticket Tracking)
  const [tickets, setTickets] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [lightboxImage, setLightboxImage] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("currentUser");
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    }
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    let dbTickets = [];
    try {
      let emailParam = "";
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("currentUser");
        if (stored) {
          const user = JSON.parse(stored);
          if (user?.email) {
            emailParam = `?email=${encodeURIComponent(user.email)}`;
          }
        }
      }
      const response = await fetch(`/api/feedback${emailParam}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          dbTickets = data.feedbacks || [];
        }
      }
    } catch (error) {
      console.warn("MongoDB fetch failed, using LocalStorage fallback logs:", error);
    }

    if (typeof window !== "undefined") {
      const localTickets = JSON.parse(localStorage.getItem("hra_feedback_tickets") || "[]");
      const myLocalTickets = localTickets.filter(lt => {
        if (lt.userEmail && currentUser?.email) {
          return lt.userEmail.toLowerCase().trim() === currentUser.email.toLowerCase().trim();
        }
        if (lt.userId && (currentUser?.id || currentUser?._id)) {
          const currentUserId = String(currentUser.id || currentUser._id);
          return String(lt.userId) === currentUserId;
        }
        if (lt.employeeDetails?.employeeId && currentUser?.employeeId) {
          return lt.employeeDetails.employeeId === currentUser.employeeId;
        }
        if (lt.employeeDetails?.name && currentUser?.name) {
          return lt.employeeDetails.name.toLowerCase().trim() === currentUser.name.toLowerCase().trim();
        }
        return false;
      });
      const merged = [...dbTickets];
      myLocalTickets.forEach(lt => {
        if (!merged.some(mt => mt._id === lt._id || mt.id === lt.id)) {
          merged.push(lt);
        }
      });
      // Sort chronologically descending
      merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setTickets(merged);
    } else {
      setTickets(dbTickets);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (currentUser) {
      fetchTickets();
    }
  }, [currentUser]);

  // Form Success Callback
  const handleFormSuccess = () => {
    fetchTickets();
  };

  // Filter logs by search query
  const filteredTickets = tickets.filter(t => {
    const query = searchQuery.toLowerCase().trim();
    return (
      (t.category || "").toLowerCase().includes(query) ||
      (t.subject || "").toLowerCase().includes(query) ||
      (t.content || "").toLowerCase().includes(query) ||
      (t.status || "").toLowerCase().includes(query) ||
      (t.ticketId || "").toLowerCase().includes(query)
    );
  });

  const STATUS_COLORS = {
     "Pending": "bg-amber-50 text-amber-600 border-amber-100/50",
     "In Review": "bg-blue-50 text-blue-600 border-blue-100/50",
     "Resolved": "bg-emerald-50 text-emerald-600 border-emerald-100/50",
  };

  const PRIORITY_COLORS = {
     "Low": "bg-slate-50 text-slate-500",
     "Medium": "bg-blue-50 text-blue-600",
     "High": "bg-orange-50 text-orange-600",
     "Critical": "bg-rose-50 text-rose-600 border-rose-100/50 shadow-sm",
  };

  return (
    <div className="space-y-12">
      {/* Title Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Secure Support Ticket Hub</h2>
          <p className="text-slate-500 font-light text-lg italic tracking-wide">Raise support tickets, suggest workspace optimizations, or track ticket resolutions.</p>
        </div>
        {activeTab === "logs" && (
          <button
            type="button"
            onClick={() => setActiveTab("broadcast")}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest hover:bg-indigo-750 shadow-lg shadow-indigo-100 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Raise Ticket
          </button>
        )}
      </header>

      {/* Tabs Selector */}
      <div className="flex gap-4 p-1.5 bg-slate-100 rounded-3xl border border-slate-200/40 select-none max-w-md mx-auto">
        <button
          type="button"
          onClick={() => setActiveTab("broadcast")}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-2xl transition-all cursor-pointer ${
            activeTab === "broadcast"
              ? "bg-slate-900 text-white shadow-lg"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Raise Ticket
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("logs")}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-2xl transition-all cursor-pointer ${
            activeTab === "logs"
              ? "bg-slate-900 text-white shadow-lg"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Ticket Tracking ({tickets.length})
        </button>
      </div>

      {/* Content Render */}
      <AnimatePresence mode="wait">
        {activeTab === "broadcast" ? (
          <motion.div
            key="broadcast-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            <FeedbackForm user={currentUser} onSuccess={handleFormSuccess} />
          </motion.div>
        ) : (
          <motion.div
            key="logs-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6 w-full"
          >
            {/* Search Controls */}
            <div className="bg-white border border-slate-100 p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/20 flex items-center justify-between gap-4">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-355 pointer-events-none">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter logs by subject, category, ticket ID or description..."
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white outline-none font-semibold text-slate-800 placeholder-slate-400 text-xs transition-all shadow-inner"
                />
              </div>
              <button 
                type="button"
                onClick={fetchTickets}
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-600 rounded-xl transition-all cursor-pointer active:scale-95"
                title="Reload Tickets"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> : <Ticket className="w-4 h-4" />}
              </button>
            </div>

            {/* List Activity Items */}
            <div className="space-y-6">
              {loading ? (
                <div className="py-24 text-center flex flex-col items-center justify-center gap-4 text-slate-400">
                  <Loader2 className="w-12 h-12 animate-spin text-slate-350" />
                  <span className="text-xs font-black uppercase tracking-widest animate-pulse">Loading support tickets...</span>
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="bg-white border border-slate-100 py-24 rounded-[3.5rem] text-center flex flex-col items-center justify-center gap-4 text-slate-300 shadow-xl shadow-slate-200/20">
                  <Inbox className="w-12 h-12" />
                  <span className="text-sm font-light italic">No support tickets found.</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab("broadcast")}
                    className="mt-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-indigo-600 transition-all cursor-pointer animate-pulse"
                  >
                    Raise Your First Ticket
                  </button>
                </div>
              ) : (
                filteredTickets.map((ticket) => {
                  return (
                    <motion.div
                      key={ticket._id || ticket.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white border border-slate-100 p-8 rounded-[3.5rem] shadow-xl shadow-slate-200/25 transition-all flex flex-col justify-between items-stretch gap-4 text-left"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="space-y-3.5 flex-1 min-w-0">
                          {/* Top Header Card info */}
                          <div className="flex items-center flex-wrap gap-2.5">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">{ticket.ticketId || "#TKT-XXXX"}</span>
                            <span className="font-black text-slate-900 text-base tracking-tight leading-none">{ticket.subject}</span>
                            <span className={`px-2.5 py-0.5 rounded bg-slate-50 border border-slate-100 text-[8px] font-black uppercase tracking-wider text-slate-500`}>
                              {ticket.category}
                            </span>
                            {ticket.isAnonymous && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-slate-900 text-white text-[8px] font-black leading-none uppercase tracking-wider">
                                <Shield className="w-2.5 h-2.5 text-white" />
                                Stealth Protocol
                              </span>
                            )}
                          </div>

                          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">
                            Submitted: {new Date(ticket.createdAt).toLocaleString()}
                          </div>

                          {/* Message Body */}
                          <div className="p-4 bg-slate-50 border border-slate-100/50 rounded-2xl relative max-w-3xl">
                            <p className="text-xs text-slate-650 font-medium leading-relaxed italic">
                              &ldquo;{ticket.content}&rdquo;
                            </p>
                          </div>

                          {/* Attachments Section */}
                          {ticket.attachments && ticket.attachments.length > 0 && (
                            <div className="space-y-2.5 mt-4">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Attachments</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
                                {ticket.attachments.map((file, idx) => {
                                  const isImage = file.type?.startsWith("image/") || file.url?.startsWith("data:image/");
                                  return (
                                    <div 
                                      key={idx} 
                                      className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex flex-col gap-2 shadow-sm hover:border-slate-350 transition-all"
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 truncate">
                                          <Paperclip className="w-3.5 h-3.5 text-indigo-650 shrink-0" />
                                          <span className="text-[10px] font-bold text-slate-700 truncate" title={file.name}>{file.name}</span>
                                        </div>
                                        <a 
                                          href={file.url} 
                                          download={file.name} 
                                          className="text-[9px] font-black uppercase text-indigo-650 hover:text-indigo-800"
                                        >
                                          Download
                                        </a>
                                      </div>
                                      {isImage && (
                                        <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-white group/img aspect-video flex justify-center items-center max-h-32">
                                          <img 
                                            src={file.url} 
                                            alt={file.name} 
                                            className="object-contain w-full h-full max-h-32 transition-transform duration-300 group-hover/img:scale-105"
                                          />
                                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                            <button 
                                              type="button"
                                              onClick={() => setLightboxImage(file)}
                                              className="px-3 py-1.5 bg-white text-slate-900 rounded-lg text-[8px] font-black uppercase tracking-wider hover:scale-105 transition-transform cursor-pointer"
                                            >
                                              View
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {ticket.suggestions && (
                            <div className="p-4 bg-indigo-50/20 border border-indigo-100/30 rounded-2xl max-w-3xl">
                              <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1.5">Proposed Solution</p>
                              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                {ticket.suggestions}
                              </p>
                            </div>
                          )}

                          {/* Ticket Progress Tracker */}
                          <div className="mt-6 pt-6 border-t border-slate-100/80">
                            <p className="text-[9px] font-black text-slate-450 uppercase tracking-widest mb-4">Ticket Status Tracking</p>
                            <div className="flex items-center justify-between max-w-xl relative py-2">
                              {/* Background line */}
                              <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 z-0" />
                              {/* Active line */}
                              <div 
                                className="absolute top-1/2 left-0 h-1 bg-indigo-600 -translate-y-1/2 z-0 transition-all duration-500"
                                style={{ 
                                  width: ticket.status === "Pending" ? "0%" : ticket.status === "In Review" ? "50%" : "100%" 
                                }}
                              />
                              
                              {/* Steps */}
                              {[
                                { label: "Submitted", statusKey: "Pending", desc: "Ticket registered" },
                                { label: "In Review", statusKey: "In Review", desc: "Under review" },
                                { label: "Resolved", statusKey: "Resolved", desc: "Issue resolved" }
                              ].map((step, idx) => {
                                const isCompleted = 
                                  (ticket.status === "Pending" && idx === 0) ||
                                  (ticket.status === "In Review" && idx <= 1) ||
                                  (ticket.status === "Resolved");
                                  
                                return (
                                  <div key={step.label} className="flex flex-col items-center z-10 relative">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                      isCompleted 
                                        ? "bg-indigo-600 border-indigo-650 text-white shadow-md animate-pulse" 
                                        : "bg-white border-slate-200 text-slate-400"
                                    }`}>
                                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-wider mt-2 ${
                                      isCompleted ? "text-slate-900" : "text-slate-400"
                                    }`}>
                                      {step.label}
                                    </span>
                                    <span className="text-[8px] text-slate-400 font-medium italic mt-0.5">{step.desc}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Status / Urgency */}
                        <div className="shrink-0 flex sm:flex-col gap-2.5 items-end pt-0.5">
                          <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider border select-none
                            ${STATUS_COLORS[ticket.status] || "bg-slate-50 border-slate-100 text-slate-500"}`}>
                            {ticket.status}
                          </span>
                          <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider shadow-inner ${PRIORITY_COLORS[ticket.priority] || "bg-slate-50 text-slate-500"}`}>
                            {ticket.priority} Urgency
                          </span>
                        </div>
                      </div>

                      {/* Replies Thread */}
                      {ticket.replies && ticket.replies.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Response Thread ({ticket.replies.length})</div>
                          <div className="space-y-3.5">
                            {ticket.replies.map((reply, ridx) => (
                              <div key={reply._id || ridx} className="flex items-start gap-2.5 text-left">
                                <CornerDownRight className="w-4 h-4 text-slate-355 shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                                  <div className="flex justify-between items-center gap-2 mb-1.5">
                                    <span className="text-[10px] font-black text-slate-800 leading-none">
                                      {reply.userName}{" "}
                                      <span className="text-[8px] font-bold text-indigo-500 uppercase px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-100/30 ml-1">
                                        {reply.userRole}
                                      </span>
                                    </span>
                                    <span className="text-[8px] text-slate-400 font-bold uppercase">
                                      {new Date(reply.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-600 font-medium leading-relaxed italic">
                                    &ldquo;{reply.message}&rdquo;
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {lightboxImage && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center pointer-events-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLightboxImage(null)}
              className="absolute inset-0 bg-slate-950/85 backdrop-blur-md pointer-events-auto cursor-zoom-out"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-[90vw] max-h-[90vh] pointer-events-auto z-10 flex flex-col items-center gap-4"
            >
              <img 
                src={lightboxImage.url} 
                alt={lightboxImage.name} 
                className="object-contain max-w-full max-h-[80vh] rounded-2xl border border-white/10 shadow-2xl"
              />
              <div className="flex gap-4">
                <a 
                  href={lightboxImage.url} 
                  download={lightboxImage.name}
                  className="px-6 py-3 bg-white text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-colors shadow-lg flex items-center gap-2"
                >
                  <Paperclip className="w-4 h-4" />
                  Download File
                </a>
                <button
                  type="button"
                  onClick={() => setLightboxImage(null)}
                  className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  Close Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
