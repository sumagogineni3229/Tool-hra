"use client";

import { useState, useEffect } from "react";
import {
  Clock,
  Play,
  Coffee,
  Square,
  Calendar,
  Sparkles,
  TrendingUp,
  FileCheck,
  CheckCircle,
  HelpCircle,
  Award,
  MessageSquare,
  Star,
  X,
  ChevronRight,
  GraduationCap,
  Megaphone,
  UserCheck,
  Plus,
  Camera,
  MapPin,
  Loader2,
  Home,
  Building2
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import AttendanceWebcam from "@/app/employee/attendance/AttendanceWebcam";

export default function EmployeeDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [dbLeaves, setDbLeaves] = useState([]);
  const [dbHolidays, setDbHolidays] = useState([]);
  const [dbAnnouncements, setDbAnnouncements] = useState([]);
  const [activeInsurance, setActiveInsurance] = useState(null);
  const [essRequests, setEssRequests] = useState([]);

  // Today's attendance from database
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState("");
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);

  // Live ticking date and clock
  const [currentDateTime, setCurrentDateTime] = useState(null);

  // Time Tracker State
  const [status, setStatus] = useState("Offline"); // Offline, ClockedIn, Break, ClockedOut
  const [seconds, setSeconds] = useState(0); 
  const [breakSecs, setBreakSecs] = useState(0);

  // Interactive Tasks Checklist (persisted in localStorage by email)
  const [tasks, setTasks] = useState([
    { id: 1, text: "Audit and approve weekly operations logs", checked: true },
    { id: 2, text: "Complete mandatory HR security compliance refresher", checked: false },
    { id: 3, text: "Update quarterly individual goal metrics", checked: false },
    { id: 4, text: "Verify GitHub deployment keys and local fallbacks", checked: true }
  ]);

  // Selected Training & Announcement Modal state
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  // Mock Trainings Dataset
  const trainings = [
    {
      id: 1,
      name: "Corporate CyberSecurity 2.0",
      category: "Compliance",
      duration: "1.5 hours",
      status: "Completed",
      progress: 100,
      description: "Advanced guidelines on remote connection keys, multi-factor setups, and secure client-side mock data standards.",
      syllabus: [
        "Session 1: The Threat Landscape (Completed)",
        "Session 2: Access Management & SSH Keys (Completed)",
        "Session 3: Incident Response Reporting (Completed)"
      ]
    },
    {
      id: 2,
      name: "Agile Development Paradigms",
      category: "Technical",
      duration: "3 hours",
      status: "Completed",
      progress: 100,
      description: "Best practices for daily team syncs, sprint planning pipelines, and Git merge conflict resolution tactics.",
      syllabus: [
        "Session 1: Agile Manifesto Overview (Completed)",
        "Session 2: Story Pointing & Estimating (Completed)",
        "Session 3: Efficient Pull Request Audits (Completed)"
      ]
    },
    {
      id: 3,
      name: "Advanced Next.js Architecture",
      category: "Technical",
      duration: "5 hours",
      status: "In Progress",
      progress: 75,
      description: "Deep dive into Server Component rendering cycles, layout configurations, and resilient data hydration strategies.",
      syllabus: [
        "Session 1: React Server Components Streams (Completed)",
        "Session 2: Incremental Static Regeneration (Completed)",
        "Session 3: Fallback APIs & Offline Sync (Pending)"
      ]
    },
    {
      id: 4,
      name: "System Design & Scaling",
      category: "Technical",
      duration: "4 hours",
      status: "Locked",
      progress: 0,
      description: "Creating fault-tolerant database designs, fallback APIs, cache clusters, and multi-region network failovers.",
      syllabus: [
        "Session 1: Microservices vs Monoliths (Locked)",
        "Session 2: Redis Caching Scopes (Locked)",
        "Session 3: Database Sharding Benchmarks (Locked)"
      ]
    }
  ];

  // Mock/Live Performance Ratings State
  const [performanceRatings, setPerformanceRatings] = useState({
    overall: 4.85,
    metrics: [
      { key: "Productivity", value: 95, color: "bg-emerald-500" },
      { key: "Quality of Work", value: 92, color: "bg-indigo-500" },
      { key: "Team Collaboration", value: 98, color: "bg-rose-500" },
      { key: "Punctuality", value: 94, color: "bg-amber-500" }
    ],
    managerReview: {
      author: "Daniel Cooper",
      role: "Engineering Lead / Manager",
      text: "Consistently delivers outstanding architectural quality. His proactive response to client layouts and resilient API connectors significantly enhanced workspace stability this quarter.",
      date: "May 25, 2026"
    }
  });

  useEffect(() => {
    // Current User Session
    const session = apiClient.getCurrentSession();
    setCurrentUser(session);

    // Initial ticking time
    const updateDateTime = () => {
      const now = new Date();
      const options = { weekday: "short", day: "2-digit", month: "short", year: "numeric" };
      const dateStr = now.toLocaleDateString("en-US", options);
      const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
      setCurrentDateTime(`${dateStr} — ${timeStr}`);
    };
    updateDateTime();
    const timer = setInterval(updateDateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch today's attendance details and sync stopwatch seconds
  const fetchTodayAttendance = async (email) => {
    try {
      const res = await fetch(`/api/attendance/today?email=${encodeURIComponent(email)}&t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.attendance) {
        const record = data.attendance;
        setTodayAttendance(record);

        // Sum up completed duration in seconds
        let totalMs = 0;
        record.sessions.forEach(s => {
          if (s.checkIn) {
            const start = new Date(s.checkIn).getTime();
            const end = s.checkOut ? new Date(s.checkOut).getTime() : Date.now();
            totalMs += Math.max(end - start, 0);
          }
        });
        setSeconds(Math.floor(totalMs / 1000));

        // Sync Clock status
        const activeSession = record.sessions.find(s => !s.checkOut);
        if (activeSession) {
          setStatus("ClockedIn");
        } else if (record.sessions.length > 0) {
          // If clocked out but sessions exist, they are either clocked out or on break
          setStatus(prev => prev === "Break" ? "Break" : "ClockedOut");
        } else {
          setStatus("Offline");
        }
      } else {
        setTodayAttendance(null);
        setStatus("Offline");
        setSeconds(0);
      }
    } catch (err) {
      console.warn("Could not fetch today's attendance details:", err);
    }
  };

  // Fetch Leaves, Holidays, and Announcements
  useEffect(() => {
    if (currentUser?.email) {
      // 1. Fetch User Leaves
      fetch(`/api/leave?email=${encodeURIComponent(currentUser.email)}`)
        .then(res => {
          if (res.ok) return res.json();
          throw new Error("Failed to fetch leaves");
        })
        .then(data => {
          setDbLeaves(data.leaves || []);
        })
        .catch(err => {
          console.warn("Could not fetch leaves dynamically, loading cached storage...", err);
          const cached = localStorage.getItem("hra_leaves");
          if (cached) {
            const parsed = JSON.parse(cached);
            setDbLeaves(parsed.filter(l => l.userEmail.toLowerCase().trim() === currentUser.email.toLowerCase().trim()));
          }
        });

      // 2. Fetch Corporate Holidays
      fetch(`/api/holidays`)
        .then(res => {
          if (res.ok) return res.json();
          throw new Error("Failed to fetch holidays");
        })
        .then(data => {
          setDbHolidays(data || []);
        })
        .catch(err => {
          console.warn("Could not fetch corporate holidays dynamically, using default list...", err);
          // Fallback realistic static list
          setDbHolidays([
            { name: "Labor Day break", date: "2026-06-01", type: "Corporate Break", scope: "Global" },
            { name: "Independence Day", date: "2026-08-15", type: "National Holiday", scope: "Global" },
            { name: "Thanksgiving closure", date: "2026-11-26", type: "Corporate Break", scope: "Global" }
          ]);
        });

      // 3. Fetch Bulletins / Announcements
      fetch(`/api/announcements`)
        .then(res => {
          if (res.ok) return res.json();
          throw new Error("Failed to fetch announcements");
        })
        .then(data => {
          setDbAnnouncements(data.announcements || []);
        })
        .catch(err => {
          console.warn("Could not fetch announcements dynamically, fallback cached...", err);
        });

      // 4. Setup Tasks checklist from LocalStorage if exists
      const savedTasks = localStorage.getItem(`employee_tasks_${currentUser.email}`);
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks));
      }

      // 5. Fetch Performance review dynamically
      fetch(`/api/performance?email=${encodeURIComponent(currentUser.email)}`)
        .then(res => {
          if (res.ok) return res.json();
          throw new Error("Failed to fetch performance");
        })
        .then(data => {
          if (data.success && data.performance) {
            const p = data.performance;
            setPerformanceRatings({
              overall: p.overallScore || 0,
              metrics: [
                { key: "Productivity", value: p.productivity || 0, color: "bg-emerald-500" },
                { key: "Quality of Work", value: p.qualityOfWork || 0, color: "bg-indigo-500" },
                { key: "Team Collaboration", value: p.collaboration || 0, color: "bg-rose-500" },
                { key: "Punctuality", value: p.punctuality || 0, color: "bg-amber-500" }
              ],
              managerReview: {
                author: p.reviewedBy || "HR Specialist",
                role: p.reviewedByRole || "HR Manager",
                text: p.managerFeedback || "Keep up the excellent work!",
                date: new Date(p.reviewDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
              }
            });
          }
        })
        .catch(err => {
          console.warn("Could not fetch dynamic performance ratings, using standard mock fallback...", err);
          // Fallback to local cached reviews if offline
          const cachedPerf = localStorage.getItem("hra_performance");
          if (cachedPerf) {
            const parsed = JSON.parse(cachedPerf);
            const userP = parsed.find(p => p.userEmail.toLowerCase().trim() === currentUser.email.toLowerCase().trim());
            if (userP) {
              setPerformanceRatings({
                overall: userP.overallScore || 0,
                metrics: [
                  { key: "Productivity", value: userP.productivity || 0, color: "bg-emerald-500" },
                  { key: "Quality of Work", value: userP.qualityOfWork || 0, color: "bg-indigo-500" },
                  { key: "Team Collaboration", value: userP.collaboration || 0, color: "bg-rose-500" },
                  { key: "Punctuality", value: userP.punctuality || 0, color: "bg-amber-500" }
                ],
                managerReview: {
                  author: userP.reviewedBy || "HR Specialist",
                  role: userP.reviewedByRole || "HR Manager",
                  text: userP.managerFeedback || "Keep up the excellent work!",
                  date: new Date(userP.reviewDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                }
              });
            }
          }
        });

      // 5. Initial Attendance fetch & periodic polling
      fetchTodayAttendance(currentUser.email);
      const poll = setInterval(() => {
        fetchTodayAttendance(currentUser.email);
      }, 10000);

      // 6. Fetch Insurance Policy
      const emailToQuery = currentUser.role === "Admin" ? "employee@hraconnect.com" : currentUser.email;
      fetch(`/api/insurance?email=${encodeURIComponent(emailToQuery)}`)
        .then(res => {
          if (res.ok) return res.json();
          throw new Error("Failed to fetch insurance");
        })
        .then(data => {
          if (data.success && data.insurance && data.insurance.length > 0) {
            const list = data.insurance;
            const active = list.find(p => p.status === "Active" || p.status === "Expiring Soon") || list[0];
            setActiveInsurance(active);
          }
        })
        .catch(err => {
          console.warn("Could not fetch insurance policy on dashboard mount:", err);
        });

      // 7. Fetch ESS Requests
      fetch(`/api/ess-requests?email=${encodeURIComponent(currentUser.email)}`)
        .then(res => {
          if (res.ok) return res.json();
          throw new Error("Failed to fetch ESS requests");
        })
        .then(data => {
          setEssRequests(data.requests || []);
        })
        .catch(err => {
          console.warn("Could not fetch ESS requests for dashboard:", err);
        });

      return () => clearInterval(poll);
    }
  }, [currentUser?.email]);

  // Active Stopwatch intervals for active shifts or breaks
  useEffect(() => {
    let interval = null;
    if (status === "ClockedIn") {
      interval = setInterval(() => {
        // Ticking logic
        if (todayAttendance) {
          let totalMs = 0;
          todayAttendance.sessions.forEach(s => {
            if (s.checkIn) {
              const start = new Date(s.checkIn).getTime();
              const end = s.checkOut ? new Date(s.checkOut).getTime() : Date.now();
              totalMs += Math.max(end - start, 0);
            }
          });
          setSeconds(Math.floor(totalMs / 1000));
        } else {
          setSeconds(prev => prev + 1);
        }
      }, 1000);
    } else if (status === "Break") {
      interval = setInterval(() => {
        setBreakSecs(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status, todayAttendance]);

  const formatTime = (totalSecs) => {
    const hrs = Math.floor(totalSecs / 3600).toString().padStart(2, "0");
    const mins = Math.floor((totalSecs % 3600) / 60).toString().padStart(2, "0");
    const secs = (totalSecs % 60).toString().padStart(2, "0");
    return `${hrs}:${mins}:${secs}`;
  };

  // Submit base64 webcam attendance capture with coordinates geocoding
  const submitAttendance = async (capturedImage) => {
    if (!currentUser?.email) return;
    setIsAttendanceLoading(true);

    const performSubmit = async (lat = 0, lng = 0, resolvedAddress = null) => {
      try {
        const activeSession = todayAttendance?.sessions?.find(s => !s.checkOut);
        const res = await fetch("/api/attendance", {
          method: !activeSession ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: currentUser.email,
            location: { lat, lng, address: resolvedAddress },
            image: capturedImage
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setTodayAttendance(data.attendance);
          
          // Force update states
          let totalMs = 0;
          data.attendance.sessions.forEach(s => {
            if (s.checkIn) {
              const start = new Date(s.checkIn).getTime();
              const end = s.checkOut ? new Date(s.checkOut).getTime() : Date.now();
              totalMs += Math.max(end - start, 0);
            }
          });
          setSeconds(Math.floor(totalMs / 1000));

          // Set status matching trigger
          const sessionActive = data.attendance.sessions.find(s => !s.checkOut);
          if (sessionActive) {
            setStatus("ClockedIn");
            setAttendanceStatus("Logged-in successfully!");
          } else {
            // Check if break was triggered locally
            setStatus(prev => prev === "Break" ? "Break" : "ClockedOut");
            setAttendanceStatus("Logged-out successfully!");
          }
        } else {
          alert(data.message || "Attendance submission failed");
        }
      } catch (err) {
        console.error("Attendance API submission failed:", err);
        alert("Server error submitting attendance");
      } finally {
        setIsAttendanceLoading(false);
        setTimeout(() => setAttendanceStatus(""), 3000);
      }
    };

    const fallbackToIPGeolocation = async () => {
      try {
        console.log("Attempting IP-based Geolocation fallback...");
        const ipRes = await fetch("https://ipapi.co/json/");
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          if (ipData.latitude && ipData.longitude) {
            const city = ipData.city || "";
            const region = ipData.region || "";
            const country = ipData.country_name || "";
            const addressStr = city && region ? `${city}, ${region}, ${country}` : `${city}, ${country}`;
            console.log("IP Geolocation success:", addressStr);
            performSubmit(ipData.latitude, ipData.longitude, addressStr);
            return;
          }
        }
      } catch (err) {
        console.warn("IP Geolocation fallback failed:", err.message);
      }
      performSubmit(0, 0, "Virtual Check-In / Remote");
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          performSubmit(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.warn("Browser GPS failed, falling back to IP Geolocation:", error.message);
          fallbackToIPGeolocation();
        },
        { timeout: 6000, enableHighAccuracy: true }
      );
    } else {
      console.warn("Browser Geolocation unsupported, falling back to IP Geolocation");
      fallbackToIPGeolocation();
    }
  };

  // Clock In triggers camera verification
  const handleClockIn = () => {
    setIsWebcamOpen(true);
  };

  // Break ends current active session, toggles local status
  const handleBreak = () => {
    if (status === "ClockedIn") {
      setStatus("Break");
      setIsWebcamOpen(true); // End session first
    } else if (status === "Break") {
      setStatus("ClockedIn");
      setIsWebcamOpen(true); // Start new session
    }
  };

  // Clock Out ends current active session, flags shift complete
  const handleClockOut = () => {
    setStatus("ClockedOut");
    setIsWebcamOpen(true);
  };

  const parseDuration = (durStr) => {
    if (!durStr) return 0;
    const match = durStr.match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  const calculateUsedLeaves = (typeLabel) => {
    const currentYear = new Date().getFullYear();
    const approvedLeavesOfType = dbLeaves.filter(l => {
      const leaveYear = new Date(l.startDate).getFullYear();
      return (
        l.type.toLowerCase().trim() === typeLabel.toLowerCase().trim() &&
        l.status.toLowerCase().trim() === "approved" &&
        leaveYear === currentYear
      );
    });
    return approvedLeavesOfType.reduce((acc, curr) => acc + parseDuration(curr.duration), 0);
  };

  const leaves = [
    { type: "Earned Leaves", used: calculateUsedLeaves("Earned Leave"), limit: 15, color: "bg-emerald-500", raw: "bg-emerald-100/50" },
    { type: "Sick Leaves", used: calculateUsedLeaves("Sick Leave"), limit: 5, color: "bg-rose-500", raw: "bg-rose-100/50" },
    { type: "Emergency Leave", used: calculateUsedLeaves("Emergency Leave"), limit: 1, color: "bg-amber-500", raw: "bg-amber-100/50" },
    { type: "Optional / Festival", used: calculateUsedLeaves("Optional Leave"), limit: null, color: "bg-violet-500", raw: "bg-violet-100/50" },
    { type: "Maternity / Paternity", used: calculateUsedLeaves("Maternity Leave"), limit: null, color: "bg-pink-500", raw: "bg-pink-100/50" },
  ];

  // Dynamic Shift Progress Calculations
  const shiftGoalSecs = 9 * 3600; // 9-hour shift
  const shiftPercent = Math.min(((seconds / shiftGoalSecs) * 100), 100);
  const remainingSecs = Math.max(shiftGoalSecs - seconds, 0);

  // SVG circular properties
  const radius = 35;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (shiftPercent / 100) * circumference;

  // Toggle tasks and save in localStorage
  const handleToggleTask = (id) => {
    const updated = tasks.map(t => t.id === id ? { ...t, checked: !t.checked } : t);
    setTasks(updated);
    if (currentUser?.email) {
      localStorage.setItem(`employee_tasks_${currentUser.email}`, JSON.stringify(updated));
    }
  };

  // Add a task interactively
  const handleAddTask = () => {
    const val = prompt("Enter a new checkpoint operational task:");
    if (val && val.trim()) {
      const updated = [...tasks, { id: Date.now(), text: val.trim(), checked: false }];
      setTasks(updated);
      if (currentUser?.email) {
        localStorage.setItem(`employee_tasks_${currentUser.email}`, JSON.stringify(updated));
      }
    }
  };

  const completedTasks = tasks.filter(t => t.checked).length;
  const taskProgressPercent = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  // Dynamic Pending Actions Info
  const pendingLeavesCount = dbLeaves.filter(l => l.status.toLowerCase().trim() === "pending").length;

  return (
    <div className="flex flex-col gap-8 text-left">
      
      {/* 1. Dynamic Header with Real-Time Clock */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col gap-1 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {currentUser?.name || "Staff Member"}!
            </h1>
            <Sparkles className="w-5 h-5 text-amber-500 fill-amber-100 shrink-0" />
            {currentUser?.employeeId && (
              <span className="text-[10px] font-extrabold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-mono shrink-0">
                {currentUser.employeeId}
              </span>
            )}
            {currentUser?.designation && (
              <span className="text-[10px] font-bold text-indigo-755 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded shrink-0">
                {currentUser.designation}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {pendingLeavesCount > 0 
              ? `You have ${pendingLeavesCount} leave request${pendingLeavesCount > 1 ? "s" : ""} pending approval.` 
              : "All employee shifts, assigned trainings, and calendar slots are up-to-date."}
          </p>
        </div>

        {/* Real-Time ticking clock card */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 shadow-inner self-start md:self-auto">
          <Clock className="w-4 h-4 text-indigo-655 shrink-0" />
          <div className="flex flex-col items-start min-w-[160px]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Current System Clock</span>
            <span className="text-xs font-bold text-slate-900 font-mono mt-1">
              {currentDateTime || "Loading time..."}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Top Grid: Attendance Console (7 columns) & Tasks Tracker (5 columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Attendance Dashboard Card (Today console + Metrics list) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between gap-6">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded w-fit uppercase tracking-wider">Attendance Console</span>
            <h3 className="font-bold text-slate-950 text-sm mt-1.5 font-sans">Shift Attendance & Time Metrics</h3>
            <p className="text-[11px] text-slate-400 font-medium">Track your presence, active breaks, and review periodic averages.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
            {/* Today presence details */}
            <div className="sm:col-span-6 flex flex-col gap-4 border border-slate-100 p-5 rounded-2xl bg-slate-50/50">
              <div className="flex justify-between items-center">
                <span className="text-xs font-extrabold text-slate-800">Today's Status</span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                  status === "ClockedIn" 
                    ? "bg-emerald-50 text-emerald-800 border-emerald-100" 
                    : status === "Break" 
                    ? "bg-amber-50 text-amber-800 border-amber-100"
                    : "bg-slate-100 text-slate-500 border-slate-200"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    status === "ClockedIn" ? "bg-emerald-500 animate-pulse" : status === "Break" ? "bg-amber-500 animate-pulse" : "bg-slate-400"
                  }`} />
                  {status === "ClockedIn" ? "Present" : status === "Break" ? "On Break" : status}
                </span>
              </div>

              {/* Progress SVG Ring */}
              <div className="flex items-center gap-4 py-2 justify-center">
                <div className="relative w-20 h-20">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                    {/* Background Circle */}
                    <circle
                      cx="40"
                      cy="40"
                      r={radius}
                      className="text-slate-100"
                      strokeWidth={strokeWidth}
                      stroke="currentColor"
                      fill="transparent"
                    />
                    {/* Progress Circle */}
                    <circle
                      cx="40"
                      cy="40"
                      r={radius}
                      className="text-indigo-600 transition-all duration-500"
                      strokeWidth={strokeWidth}
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                    />
                  </svg>
                  {/* Inside Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-900">
                    <span className="text-sm font-extrabold font-mono leading-none">{Math.round(shiftPercent)}%</span>
                    <span className="text-[7px] text-slate-400 font-extrabold uppercase mt-0.5">Shift</span>
                  </div>
                </div>

                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clocked In Shift</span>
                  <span className="text-xl font-extrabold text-slate-950 font-mono tracking-tight mt-0.5">
                    {formatTime(seconds)}
                  </span>
                  {status === "Break" && (
                    <span className="text-[9px] font-bold text-amber-600 flex items-center gap-1 mt-1">
                      <Coffee className="w-3 h-3 shrink-0" />
                      <span>Break: {formatTime(breakSecs)}</span>
                    </span>
                  )}
                  {status === "ClockedIn" && seconds < shiftGoalSecs && (
                    <span className="text-[9px] font-bold text-rose-500 mt-1">
                      Time left: {formatTime(remainingSecs)}
                    </span>
                  )}
                </div>
              </div>

              {/* Control Action Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={handleClockIn}
                  disabled={status === "ClockedIn" || isAttendanceLoading}
                  className="py-2.5 rounded-xl text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1 shadow-md cursor-pointer transition-all"
                  title="Login to Shift"
                >
                  {isAttendanceLoading && status === "Offline" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                  <span>Login</span>
                </button>

                <button
                  onClick={handleBreak}
                  disabled={(status !== "ClockedIn" && status !== "Break") || isAttendanceLoading}
                  className="py-2.5 rounded-xl text-[10px] font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1 cursor-pointer transition-all"
                  title="Pause Shift"
                >
                  {isAttendanceLoading && status === "Break" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Coffee className="w-3.5 h-3.5 text-amber-500" />}
                  <span>{status === "Break" ? "Resume" : "Break"}</span>
                </button>

                <button
                  onClick={handleClockOut}
                  disabled={status !== "ClockedIn" || isAttendanceLoading}
                  className="py-2.5 rounded-xl text-[10px] font-bold text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1 cursor-pointer transition-all"
                  title="Logout from Shift"
                >
                  {isAttendanceLoading && status === "ClockedIn" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Square className="w-3.5 h-3.5 text-rose-500" />}
                  <span>Logout</span>
                </button>
              </div>

              {attendanceStatus && (
                <p className="text-[10px] text-indigo-600 font-bold italic tracking-wide text-center uppercase animate-pulse mt-2">
                  {attendanceStatus}
                </p>
              )}
            </div>

            {/* Quick Metrics Grid */}
            <div className="sm:col-span-6 grid grid-cols-2 gap-4">
              {/* Avg Hours */}
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/20 hover:shadow-sm hover:translate-y-[-1px] transition-all text-left">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-indigo-600" />
                </div>
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-2.5">Average hours</span>
                <span className="block text-sm font-bold text-slate-900 font-mono mt-0.5">8h 15mins</span>
              </div>

              {/* On-Time Arrival */}
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/20 hover:shadow-sm hover:translate-y-[-1px] transition-all text-left">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-2.5">On-time arrival</span>
                <span className="block text-sm font-bold text-slate-900 font-mono mt-0.5">97.80 %</span>
              </div>

              {/* Avg Check-in */}
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/20 hover:shadow-sm hover:translate-y-[-1px] transition-all text-left">
                <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center">
                  <Play className="w-4 h-4 text-rose-600 rotate-90" />
                </div>
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-2.5">Average check-in</span>
                <span className="block text-sm font-bold text-slate-900 font-mono mt-0.5">09:12 AM</span>
              </div>

              {/* Avg Check-out */}
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/20 hover:shadow-sm hover:translate-y-[-1px] transition-all text-left">
                <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Square className="w-4 h-4 text-amber-600" />
                </div>
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-2.5">Average check-out</span>
                <span className="block text-sm font-bold text-slate-900 font-mono mt-0.5">18:15 PM</span>
              </div>
            </div>
          </div>
        </div>        {/* Right side: Tasks Tracker (5 columns) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Tasks Checklist Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between gap-5 text-left flex-1">
            <div className="flex justify-between items-start gap-4">
              <div className="flex flex-col gap-1 text-left">
                <span className="text-[10px] font-extrabold text-amber-600 bg-amber-50 border border-amber-100/50 px-2 py-0.5 rounded w-fit uppercase tracking-wider">Task Objectives</span>
                <h3 className="font-bold text-slate-950 text-sm mt-1.5 font-sans">Syllabus & Daily Checklist</h3>
                <p className="text-[11px] text-slate-400 font-medium">Clear milestones to sync operational criteria.</p>
              </div>
              <button
                onClick={handleAddTask}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center justify-center cursor-pointer shrink-0"
                title="Add task objective"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex flex-col gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800">{taskProgressPercent}% Completed</span>
                <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100/30 px-2 py-0.5 rounded tracking-wide font-mono">
                  {completedTasks} / {tasks.length} Checkpoints
                </span>
              </div>
              {/* Progress bar container */}
              <div className="w-full h-2 rounded-full bg-slate-150 relative overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${taskProgressPercent}%` }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[175px] pr-1">
              {tasks.map(task => (
                <label
                  key={task.id}
                  className="flex items-start gap-3 p-3 rounded-xl border border-slate-100/80 bg-white hover:bg-slate-50/50 hover:border-slate-200 transition-all duration-150 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={task.checked}
                    onChange={() => handleToggleTask(task.id)}
                    className="w-4.5 h-4.5 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500/25 cursor-pointer mt-0.5"
                  />
                  <span className={`text-[11px] font-bold text-slate-700 leading-normal ${
                    task.checked ? "line-through text-slate-400" : ""
                  }`}>
                    {task.text}
                  </span>
                </label>
              ))}
              {tasks.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-xs font-semibold">
                  No checkpoints logged today.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* 4. Leave Balance Progress Bars (Full Width Grid) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col gap-5 text-left">
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-extrabold text-rose-600 bg-rose-50 border border-rose-100/50 px-2 py-0.5 rounded w-fit uppercase tracking-wider">Leave Balance</span>
            <h3 className="font-bold text-slate-950 text-sm mt-1.5 font-sans">My Annual Leave Entitlements</h3>
            <p className="text-[11px] text-slate-400 font-medium">Current cycle: Jan 1 – Dec 31, {new Date().getFullYear()} &nbsp;&bull;&nbsp; Balances reset each calendar year.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {leaves.map((leave, i) => {
            const isPolicy = leave.limit === null;
            const daysLeft = isPolicy ? null : Math.max(leave.limit - leave.used, 0);
            const pct = isPolicy ? 100 : Math.min((daysLeft / leave.limit) * 100, 100);
            return (
              <div key={i} className="p-5 rounded-2xl border border-slate-150/60 bg-slate-50/20 hover:shadow-sm hover:translate-y-[-1px] transition-all text-left flex flex-col gap-3.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-900">{leave.type}</span>
                  <span className="text-[10px] font-extrabold text-slate-500 font-mono">
                    {isPolicy ? "Policy" : `${daysLeft} / ${leave.limit} Left`}
                  </span>
                </div>

                {/* Progress bar */}
                <div className={`w-full h-2.5 rounded-full ${leave.raw} overflow-hidden relative`}>
                  <div
                    className={`h-full rounded-full ${leave.color} transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  <span>Used: {leave.used} days</span>
                  <span>{isPolicy ? "As per policy" : `Limit: ${leave.limit}d`}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Employee Self Service (ESS) Section */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col gap-5 text-left">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-extrabold text-rose-600 bg-rose-50 border border-rose-100/50 px-2 py-0.5 rounded w-fit uppercase tracking-wider">Employee Self Service</span>
            <h3 className="font-bold text-slate-950 text-sm mt-1.5 font-sans">Self Service Requests</h3>
            <p className="text-[11px] text-slate-405 font-medium">Manage WFH / WFO scheduling requests. Requests go to HR, Admin, and Manager for approval.</p>
          </div>
          <a
            href="/employee/self-service"
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            Go to Self Service Portal
          </a>
        </div>

        {essRequests.length === 0 ? (
          <div className="p-6 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400 font-medium">
            No active Self Service requests.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {essRequests.slice(0, 2).map((req, idx) => {
              const startStr = req.startDate ? new Date(req.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "";
              const endStr = req.endDate ? new Date(req.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "";
              return (
                <div key={req._id || idx} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl bg-slate-50/40">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      req.requestType === "WFH" ? "bg-amber-50 text-amber-700 border border-amber-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                    }`}>
                      {req.requestType === "WFH" ? <Home className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">{req.requestType === "WFH" ? "Work From Home" : "Work From Office"}</span>
                      <span className="text-[10px] text-slate-400 font-medium block">{startStr} - {endStr}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                    req.status === "approved" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                    req.status === "rejected" ? "bg-rose-50 text-rose-700 border-rose-100" :
                    "bg-amber-50 text-amber-700 border-amber-100"
                  }`}>
                    {req.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Split Bottom Grid: Calendar/Holidays (4 columns) & Announcements (4 columns) & Trainings (4 columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Holidays Board (4 columns) */}
        <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between gap-5 text-left">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-extrabold text-sky-600 bg-sky-50 border border-sky-100/50 px-2 py-0.5 rounded w-fit uppercase tracking-wider">Holidays Calendar</span>
            <h3 className="font-bold text-slate-950 text-sm mt-1.5 font-sans">Upcoming Corporate Holidays</h3>
            <p className="text-[11px] text-slate-400 font-medium">Plan leaves around corporate breaks and national events.</p>
          </div>

          <div className="flex flex-col gap-3.5 overflow-y-auto max-h-[265px] pr-1">
            {dbHolidays.map((h, i) => {
              const hDate = new Date(h.date);
              const options = { month: "short", day: "2-digit" };
              const dateStr = isNaN(hDate) ? String(h.date) : hDate.toLocaleDateString("en-US", options);
              const weekdayStr = isNaN(hDate) ? "Holiday" : hDate.toLocaleDateString("en-US", { weekday: "long" });

              return (
                <div
                  key={i}
                  className="flex justify-between items-center gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 transition-all duration-150 text-left"
                >
                  <div className="flex flex-col text-left gap-1">
                    <span className="font-bold text-[11px] text-slate-900 leading-tight">{h.name}</span>
                    <span className="text-[8px] text-indigo-600 font-extrabold uppercase tracking-widest bg-indigo-50 border border-indigo-100/30 px-1.5 py-0.5 rounded w-fit">
                      {h.type}
                    </span>
                  </div>
                  <div className="flex flex-col items-end shrink-0 text-right">
                    <span className="font-extrabold text-xs text-slate-900 font-mono">{dateStr}</span>
                    <span className="text-[9px] font-semibold text-slate-400 mt-0.5 leading-none">{weekdayStr}</span>
                  </div>
                </div>
              );
            })}
            {dbHolidays.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs font-semibold">
                No corporate holidays scheduled.
              </div>
            )}
          </div>
        </div>

        {/* Announcements Bulletin (4 columns) */}
        <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between gap-5 text-left">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-extrabold text-emerald-650 bg-emerald-50 border border-emerald-100/50 px-2 py-0.5 rounded w-fit uppercase tracking-wider">Company Bulletins</span>
            <h3 className="font-bold text-slate-950 text-sm mt-1.5 font-sans">Recent Bulletins & News</h3>
            <p className="text-[11px] text-slate-400 font-medium">Stay updated on administrative policies and corporate announcements.</p>
          </div>

          <div className="flex flex-col gap-3.5 overflow-y-auto max-h-[265px] pr-1">
            {dbAnnouncements.map((ann, i) => {
              const annDate = new Date(ann.createdAt);
              const formattedDate = isNaN(annDate) ? "Recent" : annDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
              const isHighPriority = ann.priority === "High" || ann.priority === "Critical";

              return (
                <div
                  key={ann.id || i}
                  onClick={() => setSelectedAnnouncement(ann)}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all duration-150 cursor-pointer text-left flex flex-col gap-2"
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-bold text-[11px] text-slate-950 leading-tight line-clamp-1">{ann.title}</span>
                    <span className={`shrink-0 text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                      isHighPriority 
                        ? "bg-rose-50 text-rose-700 border border-rose-100" 
                        : "bg-slate-100 text-slate-500 border border-slate-200"
                    }`}>
                      {ann.priority}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-500 font-semibold line-clamp-2 leading-relaxed">
                    {ann.content}
                  </p>

                  <div className="flex items-center justify-between text-[8px] text-slate-400 font-extrabold uppercase mt-1 border-t border-slate-100/60 pt-1.5">
                    <span className="flex items-center gap-1">
                      <Megaphone className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                      <span>{ann.createdByName || "HR Desk"}</span>
                    </span>
                    <span>{formattedDate}</span>
                  </div>
                </div>
              );
            })}
            {dbAnnouncements.length === 0 && (
              <div className="text-center py-10 flex flex-col items-center justify-center gap-2 border border-dashed border-slate-200 rounded-2xl">
                <Megaphone className="w-6 h-6 text-slate-300" />
                <span className="text-slate-400 text-xs font-semibold">No operational updates published yet.</span>
              </div>
            )}
          </div>
        </div>

        {/* Trainings Syllabus (4 columns) */}
        <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between gap-5 text-left">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded w-fit uppercase tracking-wider">Training Hub</span>
            <h3 className="font-bold text-slate-950 text-sm mt-1.5 font-sans">Active Learning Tracks</h3>
            <p className="text-[11px] text-slate-400 font-medium">Complete assigned lessons and advance your professional skills.</p>
          </div>

          <div className="flex flex-col gap-3.5 overflow-y-auto max-h-[265px] pr-1">
            {trainings.map(t => (
              <div
                key={t.id}
                onClick={() => setSelectedTraining(t)}
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-350 hover:shadow-sm transition-all duration-150 cursor-pointer text-left flex flex-col gap-2.5"
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="font-bold text-[11px] text-slate-900 leading-tight line-clamp-1">{t.name}</span>
                  <span className={`shrink-0 text-[8px] font-extrabold px-1.5 py-0.5 rounded border uppercase ${
                    t.status === "Completed" 
                      ? "bg-emerald-50 text-emerald-800 border-emerald-100" 
                      : t.status === "In Progress" 
                      ? "bg-indigo-50 text-indigo-850 border-indigo-150"
                      : "bg-slate-100 text-slate-400 border-slate-200"
                  }`}>
                    {t.status}
                  </span>
                </div>

                {t.status !== "Locked" ? (
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[8px] text-slate-400 font-extrabold uppercase">
                      <span>Course Progress</span>
                      <span>{t.progress}%</span>
                    </div>
                    {/* Tiny Progress Indicator */}
                    <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${t.progress}%` }} />
                    </div>
                  </div>
                ) : (
                  <span className="text-[9px] text-slate-400 font-semibold italic">Requires completion of Module 3</span>
                )}

                <div className="flex items-center justify-between text-[8px] font-extrabold text-slate-400 uppercase border-t border-slate-100 pt-1.5">
                  <span className="flex items-center gap-1">
                    <GraduationCap className="w-3 h-3 text-indigo-600" />
                    <span>{t.category}</span>
                  </span>
                  <span>{t.duration}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 6. Performance Assessment Panel (Full Width card) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col text-left">
        <div className="border-b border-slate-150/70 px-6 py-4 bg-slate-50/50 flex justify-between items-center">
          <div className="flex flex-col gap-1 text-left">
            <span className="text-[10px] font-extrabold text-amber-600 bg-amber-50 border border-amber-100/50 px-2 py-0.5 rounded w-fit uppercase tracking-wider">Performance Audit</span>
            <h3 className="font-bold text-slate-900 text-sm mt-1.5">Periodic Performance & Core Evaluations</h3>
          </div>
          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl shadow-sm">
            <Award className="w-4 h-4 text-indigo-650 shrink-0 animate-bounce" />
            <span className="text-xs font-extrabold text-indigo-950">Active Quarter Scope</span>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Metrics scorecard (8 columns) */}
          <div className="lg:col-span-8 flex flex-col md:flex-row gap-6 items-stretch justify-between">
            {/* Stars Overall Rating Box */}
            <div className="md:w-1/3 p-6 rounded-2xl border border-slate-100 bg-slate-50/40 text-center flex flex-col items-center justify-center gap-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Evaluation Score</span>
              <span className="text-4xl font-extrabold text-slate-950 font-mono tracking-tight">{performanceRatings.overall.toFixed(2)}</span>
              
              {/* Star graphics */}
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4.5 h-4.5 text-amber-500 fill-amber-400" />
                ))}
              </div>

              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full uppercase mt-1">
                Exceeds Expectations
              </span>
            </div>

            {/* Core Competencies bar charts */}
            <div className="md:w-2/3 flex flex-col justify-between gap-4 py-1.5">
              {performanceRatings.metrics.map((metric, i) => (
                <div key={i} className="flex flex-col gap-1.5 text-left">
                  <div className="flex justify-between text-xs font-bold text-slate-800">
                    <span>{metric.key}</span>
                    <span className="font-mono text-slate-950">{metric.value}%</span>
                  </div>
                  {/* Progress scale */}
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden relative">
                    <div className={`h-full rounded-full ${metric.color} transition-all duration-500`} style={{ width: `${metric.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Styled Speech bubble Manager evaluation (4 columns) */}
          <div className="lg:col-span-4 border border-slate-150 p-5 rounded-2xl bg-slate-50/45 flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-900 leading-none">{performanceRatings.managerReview.author}</span>
                  <span className="text-[8px] font-bold text-indigo-600 uppercase tracking-wide mt-1 leading-none">
                    {performanceRatings.managerReview.role}
                  </span>
                </div>
              </div>

              {/* Speech bubble box */}
              <p className="text-[11px] text-slate-600 font-semibold leading-relaxed mt-2 p-3 bg-white border border-slate-100 rounded-xl relative italic shadow-sm">
                &ldquo;{performanceRatings.managerReview.text}&rdquo;
              </p>
            </div>

            <div className="flex justify-between items-center text-[8px] text-slate-400 font-bold uppercase tracking-wider">
              <span>Feedback Review</span>
              <span>{performanceRatings.managerReview.date}</span>
            </div>
          </div>

        </div>
      </div>

      {/* 7. Insurance Coverage Details (Full Width Card at the very bottom) */}
      {activeInsurance && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col gap-5 text-left animate-fade-in">
          <div className="flex justify-between items-center">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-extrabold text-rose-600 bg-rose-50 border border-rose-100/50 px-2 py-0.5 rounded w-fit uppercase tracking-wider">
                My Insurance
              </span>
              <h3 className="font-bold text-slate-950 text-sm mt-1.5 font-sans">
                Active Policy & Coverage Details
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Review your health plan coverage, policy numbers, and validity periods.
              </p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
              activeInsurance.status === "Active"
                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                : activeInsurance.status === "Expiring Soon"
                ? "bg-amber-50 text-amber-700 border-amber-100"
                : "bg-rose-50 text-rose-700 border-rose-100"
            }`}>
              {activeInsurance.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl border border-slate-150/60 bg-slate-50/20 flex flex-col gap-2">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Insurance Provider</span>
              <span className="text-sm font-bold text-slate-900">{activeInsurance.providerName}</span>
            </div>
            <div className="p-5 rounded-2xl border border-slate-150/60 bg-slate-50/20 flex flex-col gap-2">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Policy Number</span>
              <span className="text-sm font-mono font-bold text-slate-900">{activeInsurance.policyNumber}</span>
            </div>
            <div className="p-5 rounded-2xl border border-slate-150/60 bg-slate-50/20 flex flex-col gap-2">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Coverage Amount</span>
              <span className="text-sm font-bold text-slate-900">₹{Number(activeInsurance.coverageAmount).toLocaleString("en-IN")}</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs font-bold text-slate-450 border-t border-slate-100 pt-4">
            <span>Valid Till: {new Date(activeInsurance.expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
            <a
              href="/employee/insurance"
              className="flex items-center gap-1 text-rose-600 hover:text-rose-750 font-bold transition-all"
            >
              View Detailed Policy Document <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}


      {/* --- INTERACTIVE MODAL OVERLAYS --- */}

      {/* A. Trainings Detail Modal */}
      {selectedTraining && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-backdrop">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-modal">
            
            {/* Header branding */}
            <div className="border-b border-slate-100 px-6 py-4.5 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <GraduationCap className="w-5 h-5 text-indigo-600 shrink-0" />
                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded leading-none">
                  {selectedTraining.category} Course Details
                </span>
              </div>
              <button
                onClick={() => setSelectedTraining(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 flex flex-col gap-5 text-left">
              <div className="flex flex-col gap-1">
                <h3 className="text-base font-extrabold text-slate-950 leading-snug">{selectedTraining.name}</h3>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">Estimated Time: {selectedTraining.duration}</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Description</span>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 border border-slate-100 p-3.5 rounded-xl font-medium">
                  {selectedTraining.description}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Modular Syllabus</span>
                <div className="flex flex-col gap-1.5">
                  {selectedTraining.syllabus.map((syl, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-slate-50 bg-slate-50/20 text-xs">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                        syl.includes("(Completed)") 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                          : syl.includes("(Locked)")
                          ? "bg-slate-100 text-slate-350"
                          : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                      }`}>
                        <CheckCircle className="w-3 h-3" />
                      </div>
                      <span className={`text-[10px] font-bold ${
                        syl.includes("(Completed)") ? "text-slate-500 font-medium" : "text-slate-800"
                      }`}>
                        {syl}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer actions */}
            <div className="border-t border-slate-100 px-6 py-4.5 bg-slate-50 flex justify-end gap-2.5">
              <button
                onClick={() => setSelectedTraining(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Close
              </button>
              {selectedTraining.status === "In Progress" && (
                <button
                  onClick={() => {
                    alert("Launching Video Training Console Stream panel...");
                    setSelectedTraining(null);
                  }}
                  className="px-4.5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-700 shadow-sm cursor-pointer transition-colors"
                >
                  Resume Course
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* B. Announcement Detail Modal */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-backdrop">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-modal">
            
            {/* Header */}
            <div className="border-b border-slate-100 px-6 py-4.5 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Bulletin Inspector
                </span>
              </div>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 flex flex-col gap-5 text-left">
              <div className="flex flex-col gap-2">
                <span className={`text-[8px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider w-fit border ${
                  selectedAnnouncement.priority === "High" || selectedAnnouncement.priority === "Critical"
                    ? "bg-rose-50 text-rose-700 border border-rose-100" 
                    : "bg-slate-100 text-slate-500 border border-slate-200"
                }`}>
                  Priority: {selectedAnnouncement.priority}
                </span>
                <h3 className="text-base font-extrabold text-slate-950 leading-snug">{selectedAnnouncement.title}</h3>
              </div>

              <div className="flex flex-col gap-1.5 mt-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Bulletin Content</span>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 border border-slate-100 p-4 rounded-xl font-medium whitespace-pre-wrap">
                  {selectedAnnouncement.content}
                </p>
              </div>

              {/* Publisher info */}
              <div className="flex justify-between items-center bg-slate-50/50 p-3 rounded-xl border border-slate-100/50 text-[10px] mt-1">
                <div className="flex items-center gap-2 text-slate-650">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center font-bold text-emerald-700">
                    {selectedAnnouncement.createdByName ? selectedAnnouncement.createdByName.charAt(0) : "H"}
                  </div>
                  <span className="font-bold">{selectedAnnouncement.createdByName || "HR Specialist"}</span>
                </div>
                <span className="text-slate-400 font-extrabold uppercase font-mono">
                  {new Date(selectedAnnouncement.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 px-6 py-4 bg-slate-50 flex justify-end gap-2.5">
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="px-4.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm cursor-pointer transition-colors"
              >
                Close Bulletin
              </button>
            </div>

          </div>
        </div>
      )}

      {/* C. Webcam Verification Modal */}
      {isWebcamOpen && (
        <AttendanceWebcam
          onClose={() => setIsWebcamOpen(false)}
          onCapture={submitAttendance}
        />
      )}

    </div>
  );
}
