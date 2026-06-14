"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Clock,
  Play,
  Coffee,
  Square,
  GraduationCap,
  Award,
  Star,
  Camera,
  Loader2,
  Sparkles,
  MapPin,
  Briefcase,
  CheckSquare,
  FileText,
  UserCheck,
  MessageSquare,
  Home,
  Building2
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import AttendanceWebcam from "@/app/employee/attendance/AttendanceWebcam";

export default function InternDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [essRequests, setEssRequests] = useState([]);

  // Real-Time Clock
  const [currentDateTime, setCurrentDateTime] = useState(null);

  // Attendance Tracker States
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState("");
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const [status, setStatus] = useState("Offline"); // Offline, ClockedIn, Break, ClockedOut
  const [seconds, setSeconds] = useState(0);
  const [breakSecs, setBreakSecs] = useState(0);

  // Five Core Dashboard Stats
  const [stats, setStats] = useState({
    attendancePercentage: 0,
    activeProjects: 0,
    pendingTasks: 0,
    reportsSubmitted: 0,
    trainingProgress: 0,
  });

  const [performanceRatings, setPerformanceRatings] = useState({
    overall: 4.50,
    metrics: [
      { key: "Productivity", value: 90, color: "bg-emerald-500" },
      { key: "Quality of Work", value: 88, color: "bg-indigo-500" },
      { key: "Team Collaboration", value: 92, color: "bg-rose-500" },
      { key: "Punctuality", value: 90, color: "bg-amber-500" }
    ],
    managerReview: {
      author: "Daniel Cooper",
      role: "Engineering Lead / Mentor",
      text: "Outstanding progress on codebase onboarding. Consistently takes initiative on backend integration tasks and fallback setups.",
      date: "May 28, 2026"
    }
  });

  // Load user session on mount
  useEffect(() => {
    const session = apiClient.getCurrentSession();
    setCurrentUser(session);

    // Initialize/ticking clock
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

  // Fetch stats and today's attendance when user changes
  const fetchDashboardStats = useCallback(async (email) => {
    if (!email) return;

    try {
      // 1. Fetch Attendance logs to calculate Attendance Percentage
      let attendancePercentage = 0;
      try {
        const res = await fetch(`/api/attendance?email=${encodeURIComponent(email)}&t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const attendanceList = data.attendance || [];

          const now = new Date();
          const month = now.getMonth();
          const year = now.getFullYear();

          const monthAtt = attendanceList.filter(a => {
            const d = new Date(a.date);
            return d.getMonth() === month && d.getFullYear() === year;
          });

          const presentCount = monthAtt.length;
          let workingDaysSoFar = 0;
          const endDay = now.getDate();
          for (let d = 1; d <= endDay; d++) {
            const checkDate = new Date(year, month, d);
            if (checkDate.getDay() !== 0 && checkDate.getDay() !== 6) workingDaysSoFar++;
          }
          attendancePercentage = Math.round((presentCount / (workingDaysSoFar || 1)) * 100);
        }
      } catch (err) {
        console.warn("Could not fetch attendance stats", err);
      }

      // 2. Fetch Projects to calculate Active Projects (status !== Completed)
      let activeProjects = 0;
      try {
        const res = await fetch(`/api/projects?email=${encodeURIComponent(email)}`);
        if (res.ok) {
          const data = await res.json();
          const projectsList = data.projects || [];
          activeProjects = projectsList.filter(p => p.status !== "Completed").length;
        }
      } catch (err) {
        console.warn("Could not fetch projects stats", err);
      }

      // 3. Fetch Tasks to calculate Pending Tasks (status !== Completed)
      let pendingTasks = 0;
      try {
        const res = await fetch(`/api/tasks?email=${encodeURIComponent(email)}`);
        if (res.ok) {
          const data = await res.json();
          const tasksList = data.tasks || [];
          pendingTasks = tasksList.filter(t => t.status !== "completed" && t.status !== "Completed").length;
        }
      } catch (err) {
        console.warn("Could not fetch tasks stats", err);
      }

      // 4. Fetch Reports to calculate Reports Submitted (status !== Draft)
      let reportsSubmitted = 0;
      try {
        const res = await fetch(`/api/reports?email=${encodeURIComponent(email)}`);
        if (res.ok) {
          const data = await res.json();
          const reportsList = data.reports || [];
          reportsSubmitted = reportsList.filter(r => r.status !== "Draft").length;
        }
      } catch (err) {
        console.warn("Could not fetch reports stats", err);
      }

      // 5. Fetch Training progress (average completion percentage of training assignments)
      let trainingProgress = 0;
      try {
        const res = await fetch(`/api/trainings/assign?internEmail=${encodeURIComponent(email)}`);
        if (res.ok) {
          const assignmentsList = await res.json();
          if (assignmentsList && assignmentsList.length > 0) {
            const totalCompletion = assignmentsList.reduce((sum, item) => sum + (item.completionPercentage || 0), 0);
            trainingProgress = Math.round(totalCompletion / assignmentsList.length);
          }
        }
      } catch (err) {
        console.warn("Could not fetch trainings stats", err);
      }

      // Fallbacks
      if (attendancePercentage === 0) {
        const cached = localStorage.getItem("hra_attendance");
        if (cached) {
          const attendanceList = JSON.parse(cached).filter(a => a.userEmail?.toLowerCase() === email.toLowerCase());
          const now = new Date();
          const month = now.getMonth();
          const year = now.getFullYear();
          const monthAtt = attendanceList.filter(a => {
            const d = new Date(a.date);
            return d.getMonth() === month && d.getFullYear() === year;
          });
          const presentCount = monthAtt.length;
          let workingDaysSoFar = 0;
          const endDay = now.getDate();
          for (let d = 1; d <= endDay; d++) {
            const checkDate = new Date(year, month, d);
            if (checkDate.getDay() !== 0 && checkDate.getDay() !== 6) workingDaysSoFar++;
          }
          attendancePercentage = Math.round((presentCount / (workingDaysSoFar || 1)) * 100);
        }
      }

      if (activeProjects === 0) {
        const cached = localStorage.getItem("hra_projects");
        if (cached) {
          const projectsList = JSON.parse(cached).filter(p =>
            p.assignedMembers && p.assignedMembers.some(m => m.email.toLowerCase() === email.toLowerCase())
          );
          activeProjects = projectsList.filter(p => p.status !== "Completed").length;
        }
      }

      if (pendingTasks === 0) {
        const cached = localStorage.getItem("hra_tasks");
        if (cached) {
          const tasksList = JSON.parse(cached).filter(t => t.assignedTo?.toLowerCase() === email.toLowerCase() || t.assignedTo === "all");
          pendingTasks = tasksList.filter(t => t.status !== "completed" && t.status !== "Completed").length;
        }
      }

      if (reportsSubmitted === 0) {
        const cached = localStorage.getItem("hra_reports");
        if (cached) {
          const reportsList = JSON.parse(cached).filter(r => r.employeeEmail?.toLowerCase() === email.toLowerCase());
          reportsSubmitted = reportsList.filter(r => r.status !== "Draft").length;
        }
      }

      if (trainingProgress === 0) {
        const cached = localStorage.getItem("hra_training_assignments");
        if (cached) {
          const assignmentsList = JSON.parse(cached).filter(a => a.internEmail?.toLowerCase() === email.toLowerCase());
          if (assignmentsList.length > 0) {
            const totalCompletion = assignmentsList.reduce((sum, item) => sum + (item.completionPercentage || 0), 0);
            trainingProgress = Math.round(totalCompletion / assignmentsList.length);
          }
        }
      }

      setStats({
        attendancePercentage,
        activeProjects,
        pendingTasks,
        reportsSubmitted,
        trainingProgress
      });

    } catch (error) {
      console.error("Error fetching dashboard statistics:", error);
    }
  }, []);

  const fetchTodayAttendance = useCallback(async (email) => {
    if (!email) return;
    try {
      const res = await fetch(`/api/attendance/today?email=${encodeURIComponent(email)}&t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setTodayAttendance(data.attendance);

        // Get break seconds from localStorage
        const todayDate = new Date();
        const todayDateStr = `${todayDate.getFullYear()}-${todayDate.getMonth() + 1}-${todayDate.getDate()}`;
        const breakActiveKey = `break_active_${email}_${todayDateStr}`;
        const breakSecsKey = `break_seconds_${email}_${todayDateStr}`;
        const breakStartKey = `break_start_${email}_${todayDateStr}`;

        const isBreakActive = localStorage.getItem(breakActiveKey) === "true";
        let storedBreakSecs = parseInt(localStorage.getItem(breakSecsKey) || "0", 10);
        if (isBreakActive) {
          const breakStart = parseInt(localStorage.getItem(breakStartKey) || "0", 10);
          if (breakStart > 0) {
            storedBreakSecs += Math.floor((Date.now() - breakStart) / 1000);
          }
        }
        setBreakSecs(storedBreakSecs);

        let totalMs = 0;
        if (data.attendance?.sessions) {
          data.attendance.sessions.forEach(s => {
            if (s.checkIn) {
              const start = new Date(s.checkIn).getTime();
              const end = s.checkOut ? new Date(s.checkOut).getTime() : Date.now();
              totalMs += Math.max(end - start, 0);
            }
          });
        }
        setSeconds(Math.max(Math.floor(totalMs / 1000) - storedBreakSecs, 0));

        // Sync local clock status matching backend active session
        const activeSession = data.attendance?.sessions?.find(s => !s.checkOut);
        if (activeSession) {
          if (isBreakActive) {
            setStatus("Break");
          } else {
            setStatus("ClockedIn");
          }
        } else if (data.attendance?.sessions && data.attendance.sessions.length > 0) {
          setStatus(prev => prev === "Break" ? "Break" : "ClockedOut");
        } else {
          setStatus("Offline");
        }
      } else {
        setStatus("Offline");
        setSeconds(0);
      }
    } catch (err) {
      console.error("Failed to fetch today's attendance:", err);
    }
  }, []);

  // Set up statistics and today's attendance logs
  useEffect(() => {
    if (currentUser?.email) {
      const todayDate = new Date();
      const todayDateStr = `${todayDate.getFullYear()}-${todayDate.getMonth() + 1}-${todayDate.getDate()}`;
      const breakActiveKey = `break_active_${currentUser.email}_${todayDateStr}`;
      const breakSecsKey = `break_seconds_${currentUser.email}_${todayDateStr}`;
      const breakStartKey = `break_start_${currentUser.email}_${todayDateStr}`;

      const isBreakActive = localStorage.getItem(breakActiveKey) === "true";
      let storedBreakSecs = parseInt(localStorage.getItem(breakSecsKey) || "0", 10);
      if (isBreakActive) {
        const breakStart = parseInt(localStorage.getItem(breakStartKey) || "0", 10);
        if (breakStart > 0) {
          storedBreakSecs += Math.floor((Date.now() - breakStart) / 1000);
        }
        setStatus("Break");
      }
      setBreakSecs(storedBreakSecs);

      fetchDashboardStats(currentUser.email);
      fetchTodayAttendance(currentUser.email);

      // Fetch Performance ratings
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

      // Fetch ESS Requests
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

      // Poll attendance status
      const interval = setInterval(() => {
        fetchTodayAttendance(currentUser.email);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [currentUser?.email, fetchDashboardStats, fetchTodayAttendance]);

  // Active ticking stopwatch if checked in
  useEffect(() => {
    let interval = null;
    if (status === "ClockedIn") {
      interval = setInterval(() => {
        if (todayAttendance) {
          let totalMs = 0;
          todayAttendance.sessions.forEach(s => {
            if (s.checkIn) {
              const start = new Date(s.checkIn).getTime();
              const end = s.checkOut ? new Date(s.checkOut).getTime() : Date.now();
              totalMs += Math.max(end - start, 0);
            }
          });
          setSeconds(Math.max(Math.floor(totalMs / 1000) - breakSecs, 0));
        } else {
          setSeconds(prev => prev + 1);
        }
      }, 1000);
    } else if (status === "Break") {
      interval = setInterval(() => {
        setBreakSecs(prev => {
          const next = prev + 1;
          if (currentUser?.email) {
            const todayDate = new Date();
            const todayDateStr = `${todayDate.getFullYear()}-${todayDate.getMonth() + 1}-${todayDate.getDate()}`;
            localStorage.setItem(`break_seconds_${currentUser.email}_${todayDateStr}`, next.toString());
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status, todayAttendance, breakSecs, currentUser?.email]);

  const formatTime = (totalSecs) => {
    const hrs = Math.floor(totalSecs / 3600).toString().padStart(2, "0");
    const mins = Math.floor((totalSecs % 3600) / 60).toString().padStart(2, "0");
    const secs = (totalSecs % 60).toString().padStart(2, "0");
    return `${hrs}:${mins}:${secs}`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

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
            image: capturedImage,
            breakDuration: activeSession ? breakSecs * 1000 : undefined
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setTodayAttendance(data.attendance);

          let totalMs = 0;
          data.attendance.sessions.forEach(s => {
            if (s.checkIn) {
              const start = new Date(s.checkIn).getTime();
              const end = s.checkOut ? new Date(s.checkOut).getTime() : Date.now();
              totalMs += Math.max(end - start, 0);
            }
          });

          const sessionActive = data.attendance.sessions.find(s => !s.checkOut);
          let storedBreakSecs = breakSecs;
          if (sessionActive) {
            // Just clocked in! Clear break records
            const todayDate = new Date();
            const todayDateStr = `${todayDate.getFullYear()}-${todayDate.getMonth() + 1}-${todayDate.getDate()}`;
            localStorage.removeItem(`break_active_${currentUser.email}_${todayDateStr}`);
            localStorage.removeItem(`break_seconds_${currentUser.email}_${todayDateStr}`);
            localStorage.removeItem(`break_start_${currentUser.email}_${todayDateStr}`);
            setBreakSecs(0);
            storedBreakSecs = 0;
            setStatus("ClockedIn");
            setAttendanceStatus("Logged-in successfully!");
          } else {
            // Clocked out! Clear break records
            const todayDate = new Date();
            const todayDateStr = `${todayDate.getFullYear()}-${todayDate.getMonth() + 1}-${todayDate.getDate()}`;
            localStorage.removeItem(`break_active_${currentUser.email}_${todayDateStr}`);
            localStorage.removeItem(`break_seconds_${currentUser.email}_${todayDateStr}`);
            localStorage.removeItem(`break_start_${currentUser.email}_${todayDateStr}`);
            setBreakSecs(0);
            storedBreakSecs = 0;
            setStatus("ClockedOut");
            setAttendanceStatus("Logged-out successfully!");
          }
          setSeconds(Math.max(Math.floor(totalMs / 1000) - storedBreakSecs, 0));
          fetchDashboardStats(currentUser.email); // Recalculate stats like attendance percentage
        } else {
          alert(data.message || "Attendance submission failed");
        }
      } catch (err) {
        console.error(err);
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

  const handleClockIn = () => {
    setIsWebcamOpen(true);
  };

  const handleBreak = () => {
    if (!currentUser?.email) return;
    const todayDate = new Date();
    const todayDateStr = `${todayDate.getFullYear()}-${todayDate.getMonth() + 1}-${todayDate.getDate()}`;
    const breakActiveKey = `break_active_${currentUser.email}_${todayDateStr}`;
    const breakSecsKey = `break_seconds_${currentUser.email}_${todayDateStr}`;
    const breakStartKey = `break_start_${currentUser.email}_${todayDateStr}`;

    if (status === "ClockedIn") {
      setStatus("Break");
      localStorage.setItem(breakActiveKey, "true");
      localStorage.setItem(breakStartKey, Date.now().toString());
    } else if (status === "Break") {
      setStatus("ClockedIn");
      localStorage.setItem(breakActiveKey, "false");
      const start = parseInt(localStorage.getItem(breakStartKey) || "0", 10);
      if (start > 0) {
        const elapsed = Math.floor((Date.now() - start) / 1000);
        const currentAccumulated = parseInt(localStorage.getItem(breakSecsKey) || "0", 10);
        localStorage.setItem(breakSecsKey, (currentAccumulated + elapsed).toString());
      }
      localStorage.removeItem(breakStartKey);
    }
  };

  const handleClockOut = () => {
    setStatus("ClockedOut");
    setIsWebcamOpen(true);
  };

  // Dynamic Shift Progress Calculations
  const shiftGoalSecs = 8 * 3600; // 8-hour shift goal
  const shiftPercent = Math.min(((seconds / shiftGoalSecs) * 100), 100);
  const remainingSecs = Math.max(shiftGoalSecs - seconds, 0);

  // SVG circular properties
  const radius = 35;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (shiftPercent / 100) * circumference;

  return (
    <div className="flex flex-col gap-8 text-left">

      {/* 1. Dynamic Greeting Header with Real-Time Clock */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col gap-1 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 capitalize">
              {getGreeting()}, {currentUser?.name || "Intern"}!
            </h1>
            <Sparkles className="w-5 h-5 text-amber-500 fill-amber-100 shrink-0" />
            {currentUser?.employeeId && (
              <span className="text-[10px] font-extrabold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-mono shrink-0">
                {currentUser.employeeId}
              </span>
            )}
            {currentUser?.designation && (
              <span className="text-[10px] font-bold text-amber-755 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded shrink-0">
                {currentUser.designation}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Welcome to your internship portal dashboard. Keep track of your metrics, attendance, and tasks.
          </p>
        </div>

        {/* Real-Time ticking clock card */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 shadow-inner self-start md:self-auto">
          <Clock className="w-4 h-4 text-indigo-655 shrink-0" />
          <div className="flex flex-col items-start min-w-[160px]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">System Clock</span>
            <span className="text-xs font-bold text-slate-900 font-mono mt-1">
              {currentDateTime || "Loading clock..."}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Top Section: Attendance Console (Full Width) */}
      <div className="w-full bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between gap-6">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded w-fit uppercase tracking-wider">Attendance Console</span>
          <h3 className="font-bold text-slate-955 text-sm mt-1.5 font-sans">Shift Attendance & Time Metrics</h3>
          <p className="text-[11px] text-slate-400 font-medium font-sans">Track your presence, active breaks, and review periodic averages.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Today presence details */}
          <div className="lg:col-span-6 flex flex-col gap-4 border border-slate-100 p-5 rounded-2xl bg-slate-50/50">
            <div className="flex justify-between items-center">
              <span className="text-xs font-extrabold text-slate-800 font-sans">Today's Status</span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${status === "ClockedIn"
                ? "bg-emerald-50 text-emerald-800 border-emerald-100"
                : status === "Break"
                  ? "bg-amber-50 text-amber-800 border-amber-100"
                  : "bg-slate-100 text-slate-500 border-slate-200"
                }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status === "ClockedIn" ? "bg-emerald-500 animate-pulse" : status === "Break" ? "bg-amber-500 animate-pulse" : "bg-slate-400"
                  }`} />
                {status === "ClockedIn" ? "Present" : status === "Break" ? "On Break" : status}
              </span>
            </div>

            {/* Progress SVG Ring */}
            <div className="flex items-center gap-4 py-2 justify-center">
              <div className="relative w-20 h-20">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                  <circle
                    cx="40"
                    cy="40"
                    r={radius}
                    className="text-slate-100"
                    strokeWidth={strokeWidth}
                    stroke="currentColor"
                    fill="transparent"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r={radius}
                    className="text-indigo-650 transition-all duration-500"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-900">
                  <span className="text-sm font-extrabold font-mono leading-none">{Math.round(shiftPercent)}%</span>
                  <span className="text-[7px] text-slate-400 font-extrabold uppercase mt-0.5">Shift</span>
                </div>
              </div>

              <div className="flex flex-col text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clocked In Shift</span>
                <span className="text-xl font-extrabold text-slate-950 font-mono tracking-tight mt-0.5 font-sans">
                  {formatTime(seconds)}
                </span>
                {status === "Break" && (
                  <span className="text-[9px] font-bold text-amber-605 flex items-center gap-1 mt-1 font-sans">
                    <Coffee className="w-3 h-3 shrink-0" />
                    <span>Break: {formatTime(breakSecs)}</span>
                  </span>
                )}
                {status === "ClockedIn" && seconds < shiftGoalSecs && (
                  <span className="text-[9px] font-bold text-rose-500 mt-1 font-sans">
                    Time left: {formatTime(remainingSecs)}
                  </span>
                )}
              </div>
            </div>

            {/* Control Action Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleClockIn}
                disabled={status === "ClockedIn" || isAttendanceLoading}
                className="py-2.5 rounded-xl text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1 shadow-md cursor-pointer transition-all"
                title="Login to Shift"
              >
                {isAttendanceLoading && status === "Offline" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                <span>Login</span>
              </button>

              <button
                type="button"
                onClick={handleBreak}
                disabled={(status !== "ClockedIn" && status !== "Break") || isAttendanceLoading}
                className="py-2.5 rounded-xl text-[10px] font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1 cursor-pointer transition-all"
                title="Pause Shift"
              >
                {isAttendanceLoading && status === "Break" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Coffee className="w-3.5 h-3.5 text-amber-500" />}
                <span>{status === "Break" ? "Resume" : "Break"}</span>
              </button>

              <button
                type="button"
                onClick={handleClockOut}
                disabled={status !== "ClockedIn" || isAttendanceLoading}
                className="py-2.5 rounded-xl text-[10px] font-bold text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-transparent flex flex-col items-center justify-center gap-1 cursor-pointer transition-all"
                title="Logout from Shift"
              >
                {isAttendanceLoading && status === "ClockedIn" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Square className="w-3.5 h-3.5 text-rose-500" />}
                <span>Logout</span>
              </button>
            </div>

            {attendanceStatus && (
              <p className="text-[10px] text-indigo-650 font-bold italic tracking-wide text-center uppercase animate-pulse mt-2">
                {attendanceStatus}
              </p>
            )}
          </div>

          {/* Quick Metrics Grid */}
          <div className="lg:col-span-6 grid grid-cols-2 gap-4">
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
      </div>

      {/* 3. 5 Core Dashboard Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Card 1: Attendance Percentage */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide font-sans">Monthly</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attendance Rate</span>
            <span className="text-2xl font-black text-slate-950 mt-1">{stats.attendancePercentage}%</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
            <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${stats.attendancePercentage}%` }} />
          </div>
        </div>

        {/* Card 2: Active Projects */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-655">
              <Briefcase className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide font-sans">Assigned</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">Active Projects</span>
            <span className="text-2xl font-black text-slate-950 mt-1">{stats.activeProjects}</span>
          </div>
          <div className="text-[9px] font-bold text-indigo-600 mt-2 bg-indigo-50 px-2 py-0.5 rounded w-fit">
            Ongoing work
          </div>
        </div>

        {/* Card 3: Pending Tasks */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <CheckSquare className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide font-sans">Todo</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">Pending Tasks</span>
            <span className="text-2xl font-black text-slate-950 mt-1">{stats.pendingTasks}</span>
          </div>
          <div className="text-[9px] font-bold text-amber-600 mt-2 bg-amber-50 px-2 py-0.5 rounded w-fit">
            Awaiting completion
          </div>
        </div>

        {/* Card 4: Reports Submitted */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-605">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide font-sans">Sent</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">Reports Submitted</span>
            <span className="text-2xl font-black text-slate-950 mt-1">{stats.reportsSubmitted}</span>
          </div>
          <div className="text-[9px] font-bold text-emerald-650 mt-2 bg-emerald-50 px-2 py-0.5 rounded w-fit font-sans">
            Verified updates
          </div>
        </div>

        {/* Card 5: Training Progress */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-purple-555 uppercase tracking-wide font-sans">Learning</span>
          </div>
          <div className="flex flex-col font-sans">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Training Progress</span>
            <span className="text-2xl font-black text-slate-950 mt-1">{stats.trainingProgress}%</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1 font-sans">
            <div className="bg-purple-600 h-full rounded-full transition-all duration-500" style={{ width: `${stats.trainingProgress}%` }} />
          </div>
        </div>
      </div>

      {/* Performance Assessment Panel (Full Width card) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col text-left">
        <div className="border-b border-slate-150/70 px-6 py-4 bg-slate-50/50 flex justify-between items-center">
          <div className="flex flex-col gap-1 text-left">
            <span className="text-[10px] font-extrabold text-amber-600 bg-amber-50 border border-amber-100/50 px-2 py-0.5 rounded w-fit uppercase tracking-wider">Performance Audit</span>
            <h3 className="font-bold text-slate-900 text-sm mt-1.5 font-sans">Periodic Performance & Core Evaluations</h3>
          </div>
          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl shadow-sm">
            <Award className="w-4 h-4 text-indigo-655 shrink-0 animate-bounce" />
            <span className="text-xs font-extrabold text-indigo-950 font-sans">Active Quarter Scope</span>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

          {/* Metrics scorecard (8 columns) */}
          <div className="lg:col-span-8 flex flex-col md:flex-row gap-6 items-stretch justify-between">
            {/* Stars Overall Rating Box */}
            <div className="md:w-1/3 p-6 rounded-2xl border border-slate-100 bg-slate-50/40 text-center flex flex-col items-center justify-center gap-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Evaluation Score</span>
              <span className="text-4xl font-extrabold text-slate-950 font-mono tracking-tight text-center">{performanceRatings.overall.toFixed(2)}</span>

              {/* Star graphics */}
              <div className="flex items-center gap-1 justify-center">
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
                  <div className="flex justify-between text-xs font-bold text-slate-800 font-sans">
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

          {/* Styled Speech bubble Mentor evaluation (4 columns) */}
          <div className="lg:col-span-4 border border-slate-150 p-5 rounded-2xl bg-slate-50/45 flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-900 leading-none font-sans">{performanceRatings.managerReview.author}</span>
                  <span className="text-[8px] font-bold text-indigo-600 uppercase tracking-wide mt-1 leading-none">
                    {performanceRatings.managerReview.role}
                  </span>
                </div>
              </div>

              {/* Speech bubble box */}
              <p className="text-[11px] text-slate-605 font-semibold leading-relaxed mt-2 p-3 bg-white border border-slate-100 rounded-xl relative italic shadow-sm">
                &ldquo;{performanceRatings.managerReview.text}&rdquo;
              </p>
            </div>

            <div className="flex justify-between items-center text-[8px] text-slate-400 font-bold uppercase tracking-wider font-mono">
              <span>Feedback Review</span>
              <span>{performanceRatings.managerReview.date}</span>
            </div>
          </div>

        </div>
      </div>

      {/* Employee Self Service (ESS) Section */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col gap-5 text-left mt-8">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-extrabold text-amber-600 bg-amber-50 border border-amber-100/50 px-2 py-0.5 rounded w-fit uppercase tracking-wider">Employee Self Service</span>
            <h3 className="font-bold text-slate-950 text-sm mt-1.5 font-sans">Self Service Requests</h3>
            <p className="text-[11px] text-slate-405 font-medium">Manage WFH / WFO scheduling requests. Requests go to HR, Admin, and Manager for approval.</p>
          </div>
          <a
            href="/intern/self-service"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
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
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${req.requestType === "WFH" ? "bg-amber-50 text-amber-700 border border-amber-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                      }`}>
                      {req.requestType === "WFH" ? <Home className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">{req.requestType === "WFH" ? "Work From Home" : "Work From Office"}</span>
                      <span className="text-[10px] text-slate-400 font-medium block">{startStr} - {endStr}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${req.status === "approved" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
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

      {isWebcamOpen && (
        <AttendanceWebcam
          onClose={() => setIsWebcamOpen(false)}
          onCapture={submitAttendance}
        />
      )}

    </div>
  );
}
