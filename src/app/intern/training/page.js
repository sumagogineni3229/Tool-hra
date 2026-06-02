"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  GraduationCap, 
  Award, 
  CheckCircle, 
  FileText, 
  Play, 
  ExternalLink, 
  Lock, 
  BookOpen, 
  Download, 
  XCircle,
  Clock
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";

export default function DynamicInternTrainingConsole() {
  const [sessionUser, setSessionUser] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [activeModuleDetails, setActiveModuleDetails] = useState(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const session = apiClient.getCurrentSession();
      if (!session) return;
      setSessionUser(session);

      // Fetch all trainings to resolve details (duration, desc, materials)
      const allTrainings = await apiClient.getTrainings();
      setTrainings(allTrainings);

      // Fetch assignments specifically for this logged in intern email
      const myAssignments = await apiClient.getTrainingAssignments({ internEmail: session.email });
      setAssignments(myAssignments);
    } catch (err) {
      console.error("Failed to load intern training data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Enrich assignments with training definition details
  const enrichedAssignments = useMemo(() => {
    return assignments.map(a => {
      const match = trainings.find(t => t._id === a.trainingId || t.id === a.trainingId);
      return {
        ...a,
        description: match ? match.description : "No description provided.",
        category: match ? match.category : "General",
        duration: match ? match.duration : "1 hour",
        materials: match ? match.materials : []
      };
    });
  }, [assignments, trainings]);

  // Handle launching a module
  const startModule = async (assignmentId) => {
    try {
      const res = await apiClient.updateTrainingProgress(assignmentId, {
        status: "In Progress",
        completionPercentage: 25
      });
      if (res.success) {
        // Refresh local state
        setAssignments(prev => prev.map(a => (a._id === assignmentId || a.id === assignmentId) ? res.assignment : a));
        // Find matching enriched assignment to display materials modal
        const enriched = enrichedAssignments.find(ea => ea._id === assignmentId || ea.id === assignmentId);
        setActiveModuleDetails(enriched);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle completing a module
  const completeModule = async (assignmentId) => {
    try {
      const res = await apiClient.updateTrainingProgress(assignmentId, {
        status: "Completed",
        completionPercentage: 100
      });
      if (res.success) {
        setAssignments(prev => prev.map(a => (a._id === assignmentId || a.id === assignmentId) ? res.assignment : a));
        setActiveModuleDetails(null);
        alert("Congratulations! You completed this training module.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Achievements milestones calculation based on completed modules
  const achievements = useMemo(() => {
    const list = [];
    const completedList = enrichedAssignments.filter(ea => ea.status === "Completed");
    
    // Default achievements unlocked dynamically
    if (completedList.length > 0) {
      list.push({
        title: "Security Cadet",
        desc: `Cleared "${completedList[0].trainingName}"`,
        icon: Award,
        color: "text-amber-600 bg-amber-50 border-amber-100"
      });
    }
    
    if (completedList.length >= 3) {
      list.push({
        title: "Syllabus Master",
        desc: `Completed ${completedList.length} total training chapters`,
        icon: GraduationCap,
        color: "text-emerald-700 bg-emerald-50 border-emerald-100"
      });
    } else {
      const inProgress = enrichedAssignments.find(ea => ea.status === "In Progress");
      if (inProgress) {
        list.push({
          title: "Fast Learner",
          desc: `Working on: ${inProgress.trainingName}`,
          icon: GraduationCap,
          color: "text-indigo-650 bg-indigo-50 border-indigo-100 animate-pulse"
        });
      }
    }

    return list;
  }, [enrichedAssignments]);

  return (
    <div className="flex flex-col gap-8 text-left font-sans antialiased text-slate-800">
      
      {/* Header section */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Internship Training Hub</h1>
        <p className="text-xs text-slate-500">Track your learning track modules, unlock technical achievements, and review course documentations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch font-sans">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: SYLLABUS LESSONS TIMELINE (8 Columns)                         */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-slate-150/75 px-6 py-4.5 bg-slate-50/40">
            <h3 className="font-bold text-slate-900 text-sm">Learning Track Syllabus</h3>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {isLoading ? (
              <div className="py-24 text-center text-xs text-slate-400 font-bold">Retrieving assigned trainings...</div>
            ) : enrichedAssignments.length === 0 ? (
              <div className="py-20 text-center text-xs text-slate-400 font-bold flex flex-col gap-2 items-center justify-center">
                <BookOpen className="w-8 h-8 text-slate-300" />
                <span>No training modules have been assigned by HR yet.</span>
              </div>
            ) : (
              enrichedAssignments.map(mod => (
                <div key={mod.id || mod._id} className="p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-slate-50/20 transition-all text-left">
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-950 text-xs">{mod.trainingName}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{mod.category}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold mt-0.5">Estimated study: {mod.duration} • Due: {mod.dueDate}</span>
                    <p className="text-[10px] text-slate-500 leading-normal font-semibold mt-1 max-w-2xl">{mod.description}</p>
                    
                    {/* Render attachment materials links if in progress or completed */}
                    {mod.status !== "Not Started" && mod.materials?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {mod.materials.map((mat, idx) => (
                          <a 
                            key={idx} 
                            href={mat.url || "#"} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-200 text-slate-600 rounded text-[9px] font-bold hover:bg-slate-100 transition-colors"
                          >
                            <FileText className="w-3 h-3 text-slate-400" />
                            <span>{mat.name} ({mat.type})</span>
                            <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-2.5 mt-2 sm:mt-0">
                    {/* Status Badge */}
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold border ${
                      mod.status === "Completed"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-100"
                        : mod.status === "In Progress"
                        ? "bg-indigo-50 text-indigo-800 border-indigo-100"
                        : "bg-slate-100 text-slate-400 border-transparent"
                    }`}>
                      {mod.status}
                    </span>
                    
                    {/* Play/Complete Actions */}
                    {mod.status === "Not Started" && (
                      <button
                        onClick={() => startModule(mod.id || mod._id)}
                        className="p-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
                        title="Start Module"
                      >
                        <Play className="w-3.5 h-3.5 shrink-0 fill-white" />
                      </button>
                    )}

                    {mod.status === "In Progress" && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setActiveModuleDetails(mod);
                          }}
                          className="px-2 py-1 bg-indigo-600 text-white rounded text-[9px] font-bold hover:bg-indigo-700 transition-all cursor-pointer shadow-sm"
                          title="Open Syllabus materials"
                        >
                          Study
                        </button>
                        <button
                          onClick={() => completeModule(mod.id || mod._id)}
                          className="p-1 rounded-lg bg-emerald-50 border border-emerald-150 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                          title="Mark Complete"
                        >
                          <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                        </button>
                      </div>
                    )}

                    {mod.status === "Completed" && (
                      <button
                        onClick={() => setSelectedCertificate(mod)}
                        className="p-1 rounded-lg bg-amber-50 border border-amber-100 text-amber-600 hover:bg-amber-100 transition-colors cursor-pointer"
                        title="View Certificate"
                      >
                        <Award className="w-3.5 h-3.5 shrink-0" />
                      </button>
                    )}

                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: ACHIEVEMENTS & MILESTONES (4 Columns)                      */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm flex flex-col gap-6 text-left h-fit">
          <div className="flex flex-col gap-1">
            <h3 className="font-bold text-slate-950 text-sm">Learning Achievements</h3>
            <p className="text-[11px] text-slate-400">Certifications unlocked on syllabus clearance.</p>
          </div>

          <div className="flex flex-col gap-4 mt-2">
            {achievements.length === 0 ? (
              <div className="text-center p-6 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 text-xs font-semibold flex items-center justify-center gap-1.5">
                <Lock className="w-4 h-4 text-slate-350" />
                <span>Complete your first module to unlock badges!</span>
              </div>
            ) : (
              achievements.map((ach, idx) => {
                const IconComp = ach.icon;
                return (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${ach.color}`}>
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-xs text-slate-900 leading-none">{ach.title}</span>
                      <span className="text-[9px] text-slate-400 font-semibold mt-1">{ach.desc}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* MODAL: SYLLABUS DETAILS & LEARNING MATERIALS REVIEW                       */}
      {/* ========================================================================= */}
      {activeModuleDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-left">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col animate-fade-in">
            <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-650" />
                <span className="font-bold text-slate-900 text-sm">Study: {activeModuleDetails.trainingName}</span>
              </div>
              <button onClick={() => setActiveModuleDetails(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-4 text-xs">
              <div className="flex items-center gap-3 bg-indigo-50/40 border border-indigo-100 rounded-xl p-3.5">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span className="font-bold text-indigo-850">Required Duration: {activeModuleDetails.duration}</span>
              </div>
              
              <div className="flex flex-col gap-2 mt-2">
                <span className="font-bold text-slate-700 text-xs">Syllabus Overview</span>
                <p className="text-slate-500 leading-relaxed font-semibold">{activeModuleDetails.description}</p>
              </div>

              <div className="flex flex-col gap-2 mt-3">
                <span className="font-bold text-slate-700 text-xs">Learning Materials</span>
                {activeModuleDetails.materials?.length === 0 ? (
                  <span className="text-slate-400 font-semibold italic">No material resources added for this chapter.</span>
                ) : (
                  <div className="flex flex-col gap-2 bg-slate-50 border border-slate-100 rounded-xl p-3">
                    {activeModuleDetails.materials.map((mat, idx) => (
                      <a 
                        key={idx} 
                        href={mat.url || "#"} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center justify-between bg-white border border-slate-150 p-2.5 rounded-lg hover:border-slate-300 transition-all font-bold text-slate-750"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <span>{mat.name}</span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[9px] bg-slate-100 border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded">
                          {mat.type} <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 flex justify-between items-center text-xs">
              <button 
                onClick={() => setActiveModuleDetails(null)}
                className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>
              <button 
                onClick={() => completeModule(activeModuleDetails.id || activeModuleDetails._id)}
                className="px-4 py-2 bg-emerald-650 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer"
              >
                Mark Module Completed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ACHIEVEMENTS DYNAMIC CERTIFICATE VIEW                              */}
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
            {/* Body */}
            <div className="p-8 bg-slate-50">
              <div className="bg-white border-8 border-double border-emerald-800 p-8 flex flex-col items-center justify-center text-center shadow-inner relative overflow-hidden">
                <div className="absolute opacity-[0.03] pointer-events-none transform scale-[5] text-emerald-950">
                  <GraduationCap className="w-12 h-12" />
                </div>
                
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-850">Certificate of Completion</span>
                
                <h2 className="text-xl font-bold tracking-tight text-slate-800 mt-5">This is proudly presented to</h2>
                <h1 className="text-2xl font-black text-emerald-950 underline decoration-double decoration-slate-400 mt-2 font-serif">{sessionUser?.name}</h1>
                
                <p className="text-xs text-slate-500 font-semibold max-w-md leading-relaxed mt-5">
                  for successfully clearing all modules, milestones, and syllabus tasks under the training:
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
