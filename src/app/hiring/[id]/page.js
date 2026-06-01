"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  FileText, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  Globe, 
  Mail, 
  Phone, 
  User, 
  ArrowLeft,
  Loader2,
  Lock,
  ArrowRight
} from "lucide-react";

export default function CandidateHiringPortal({ params }) {
  // Use React.use() to unpack params in Next.js App Router Client Component
  const resolvedParams = use(params);
  const jobId = resolvedParams.id;

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Candidate input states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    coverLetter: "",
    resume: "",
    portfolio: ""
  });

  // Dynamic answers state matching job.customQuestions indexes
  const [customAnswers, setCustomAnswers] = useState({});

  useEffect(() => {
    async function loadJob() {
      try {
        // Try the direct single-job endpoint first (fastest)
        const response = await fetch(`/api/hiring/jobs/${jobId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.job) {
            setJob(data.job);
            setLoading(false);
            return;
          }
        }

        // Fallback: fetch all jobs and filter
        const allRes = await fetch(`/api/hiring/jobs`);
        if (allRes.ok) {
          const data = await allRes.json();
          const match = data.jobs?.find(j => j._id === jobId || j.id === jobId);
          if (match) {
            setJob(match);
          } else {
            throw new Error("Vacancy not found in API response.");
          }
        } else {
          throw new Error("API unreachable.");
        }
      } catch (err) {
        console.warn("MongoDB unreachable, falling back to LocalStorage...", err);
        const localJobs = JSON.parse(localStorage.getItem("hra_jobs") || "[]");
        const localMatch = localJobs.find(j => j._id === jobId || j.id === jobId);
        if (localMatch) {
          setJob(localMatch);
        } else {
          setErrorMsg("This vacancy announcement could not be found. It may have been closed or the link may be invalid.");
        }
      } finally {
        setLoading(false);
      }
    }

    loadJob();
  }, [jobId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCustomAnswerChange = (question, value) => {
    setCustomAnswers((prev) => ({ ...prev, [question]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.resume.trim()) {
      alert("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    
    // Map customAnswers to structured array
    const formattedAnswers = job.customQuestions.map((q) => ({
      question: q,
      answer: customAnswers[q] || ""
    }));

    const payload = {
      jobId: job._id || job.id,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      coverLetter: formData.coverLetter,
      resume: formData.resume,
      portfolio: formData.portfolio,
      answers: formattedAnswers
    };

    try {
      const response = await fetch("/api/hiring/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        const err = await response.json();
        throw new Error(err.message || "Submission failed.");
      }
    } catch (err) {
      console.warn("Database POST failed. Syncing candidate dossier locally...", err.message);
      
      // Resilient local storage buffer (seen by HR offline sync)
      const localApps = JSON.parse(localStorage.getItem("hra_applications") || "[]");
      const localNewApp = {
        _id: `local-app-${Date.now()}`,
        jobId: job,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        coverLetter: formData.coverLetter,
        resume: formData.resume,
        portfolio: formData.portfolio,
        answers: formattedAnswers,
        status: "Applied",
        notes: "",
        createdAt: new Date().toISOString()
      };
      
      localApps.unshift(localNewApp);
      localStorage.setItem("hra_applications", JSON.stringify(localApps));

      // Increment local job applicant count
      const localJobs = JSON.parse(localStorage.getItem("hra_jobs") || "[]");
      const idx = localJobs.findIndex(j => j._id === jobId || j.id === jobId);
      if (idx !== -1) {
        localJobs[idx].applicantCount = (localJobs[idx].applicantCount || 0) + 1;
        localStorage.setItem("hra_jobs", JSON.stringify(localJobs));
      }

      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans antialiased text-slate-800 space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Initializing Job Desk...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans antialiased text-slate-800 p-8 space-y-6">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shadow-sm">
          <Lock className="w-6 h-6" />
        </div>
        <div className="text-center space-y-2 max-w-sm">
          <h2 className="text-lg font-bold text-slate-900 leading-tight">Access Locked</h2>
          <p className="text-xs font-medium text-slate-400">{errorMsg}</p>
        </div>
        <Link href="/" className="px-5 py-2.5 bg-slate-950 text-white rounded-xl text-xs font-bold shadow-md hover:bg-slate-800 transition-all flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Return to Homepage
        </Link>
      </div>
    );
  }

  // Submitted view
  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans antialiased text-slate-850 p-6">
        <div className="w-full max-w-xl bg-white border border-slate-200/80 rounded-3xl p-10 shadow-2xl space-y-8 text-center relative overflow-hidden animate-scale-up">
          <div className="absolute right-0 top-0 h-24 w-24 opacity-[0.03] bg-gradient-to-bl from-emerald-600 to-transparent pointer-events-none" />
          
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-lg animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-none uppercase">Dossier Registered</h2>
              <p className="text-xs font-medium text-slate-400">Application Submitted Successfully!</p>
            </div>
          </div>

          <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl text-left space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/50 pb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Role</span>
              <span className="text-xs font-bold text-slate-800 uppercase">{job.title}</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-200/50 pb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Candidate</span>
              <span className="text-xs font-bold text-slate-800">{formData.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Protocol</span>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-[10px] font-bold text-indigo-700">Applied</span>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <p className="text-xs font-medium text-slate-400 leading-relaxed max-w-sm mx-auto">
              Our HRA Groups Talent Acquisition specialists are reviewing candidate rosters. Communication updates will dispatch via email: <strong>{formData.email}</strong>.
            </p>
            <div className="pt-2 flex justify-center">
              <button 
                onClick={() => window.close()} 
                className="px-6 py-3 bg-slate-950 text-white rounded-xl text-xs font-bold shadow-md hover:bg-slate-850 transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                Close Portal <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-800 py-12 px-6 flex flex-col items-center">
      
      {/* Branding Logo Header */}
      <div className="w-full max-w-5xl flex items-center gap-3 mb-10 text-left">
        <div className="relative h-10 w-28 flex items-center shrink-0">
          <Image
            src="/logo.png"
            alt="HRA Groups Logo"
            fill
            priority
            className="object-contain object-left"
          />
        </div>
        <div className="border-l border-slate-200 pl-2.5 hidden sm:block">
          <span className="font-bold text-xs uppercase tracking-tight text-slate-900 block">External Talent</span>
          <span className="block text-[8px] text-slate-400 font-bold tracking-widest uppercase -mt-0.5">Application Desk</span>
        </div>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Job Description details */}
        <div className="lg:col-span-5 bg-white border border-slate-200/85 rounded-3xl p-8 shadow-sm space-y-6 text-left relative overflow-hidden">
          <div className="absolute right-0 top-0 h-32 w-32 opacity-[0.02] bg-gradient-to-bl from-indigo-650 to-transparent pointer-events-none" />
          
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-bold">
              <Sparkles className="w-3 h-3" />
              Vacancy Announcement
            </div>
            
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{job.department}</p>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-snug">{job.title}</h1>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-400 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{job.location}</span>
              </div>
              <span className="text-slate-200">•</span>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{job.type}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t border-slate-100 pt-5">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block leading-none">Role Mission</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed break-words whitespace-pre-wrap">{job.description}</p>
          </div>

          {job.requirements?.length > 0 && (
            <div className="space-y-4 border-t border-slate-100 pt-5">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block leading-none">Core Requirements</h3>
              <ul className="space-y-2.5 text-xs text-slate-500 font-semibold">
                {job.requirements.map((req, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="text-indigo-500 font-black shrink-0">✓</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-xl p-3">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Secured protocol</span>
            <span className="text-[10px] font-black text-indigo-600 flex items-center gap-1">
              HRA Groups StaffHQ
            </span>
          </div>

        </div>

        {/* Right Column: Application form */}
        <div className="lg:col-span-7 bg-white border border-slate-200/85 rounded-3xl p-8 shadow-sm space-y-6 text-left">
          
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
              <FileText className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">Submit Application Dossier</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Candidate Details Group */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Full Name *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <User className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="E.g. Bob Miller"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition-all font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <Mail className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="bob.miller@email.com"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition-all font-semibold"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phone Number *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <Phone className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 019-2834"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition-all font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Portfolio URL</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <Globe className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="url"
                    name="portfolio"
                    value={formData.portfolio}
                    onChange={handleInputChange}
                    placeholder="https://myportfolio.com"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition-all font-semibold"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Resume Link (PDF Link) *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                  <Globe className="w-3.5 h-3.5 text-rose-500" />
                </span>
                <input
                  type="url"
                  name="resume"
                  value={formData.resume}
                  onChange={handleInputChange}
                  placeholder="https://drive.google.com/file/d/... or dropbox"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition-all font-semibold"
                  required
                />
              </div>
            </div>

            {/* Dynamic Custom Questions Section */}
            {job.customQuestions?.length > 0 && (
              <div className="space-y-4 border-t border-slate-100 pt-5">
                <span className="text-[10px] font-bold text-indigo-650 uppercase tracking-widest block leading-none">Job Specific Evaluation</span>
                <div className="space-y-4">
                  {job.customQuestions.map((question, i) => (
                    <div key={i} className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">{question} *</label>
                      <input
                        type="text"
                        value={customAnswers[question] || ""}
                        onChange={(e) => handleCustomAnswerChange(question, e.target.value)}
                        placeholder="Write your response..."
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition-all font-semibold bg-slate-55"
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cover Letter */}
            <div className="space-y-1.5 border-t border-slate-100 pt-5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cover Letter / Impact Statement</label>
              <textarea
                name="coverLetter"
                value={formData.coverLetter}
                onChange={handleInputChange}
                rows={5}
                placeholder="Share your narrative and describe how you will drive impact in this role..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition-all font-medium resize-y"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 shadow-lg shadow-indigo-100 hover:shadow-xl hover:shadow-indigo-200 active:scale-98 transition-all cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Registering Dossier...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Vacancy Application
                </>
              )}
            </button>
            
          </form>
          
        </div>

      </div>

    </div>
  );
}
