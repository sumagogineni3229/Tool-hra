"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  GraduationCap,
  CalendarDays,
  LogOut,
  Bell,
  Search,
  Calendar,
  X,
  ChevronRight
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import NotificationBell from "@/components/Common/NotificationBell";
import ProfileDropdown from "@/components/ProfileDropdown";

function InternLayoutContent({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const session = apiClient.getCurrentSession();
    if (!session) {
      router.push("/login");
      return;
    }

    async function verifyAndAuthorize() {
      try {
        const users = await apiClient.getUsers();
        const latest = users.find(u => u.email.toLowerCase().trim() === session.email.toLowerCase().trim());
        if (latest) {
          const sessionPayload = { ...latest };
          delete sessionPayload.password;
          localStorage.setItem("currentUser", JSON.stringify(sessionPayload));
          
          if (sessionPayload.verificationStatus !== "Approved") {
            router.push("/profile-completion");
            return;
          }
          
          // Role authorization checks
          if (sessionPayload.role !== "Intern" && sessionPayload.role !== "Admin") {
            let redirectPath = "/employee/dashboard";
            if (sessionPayload.role === "HR") redirectPath = "/hr/dashboard";
            else if (sessionPayload.role === "Manager") redirectPath = "/manager/dashboard";
            
            router.push(redirectPath);
            return;
          }
          
          setCurrentUser(sessionPayload);
          setIsAuthorized(true);
        } else {
          // Fallback to local session
          if (session.verificationStatus !== "Approved") {
            router.push("/profile-completion");
            return;
          }
          setCurrentUser(session);
          setIsAuthorized(true);
        }
      } catch (err) {
        console.warn("MongoDB sync failed on layout mount, using offline state:", err);
        if (session.verificationStatus !== "Approved") {
          router.push("/profile-completion");
          return;
        }
        setCurrentUser(session);
        setIsAuthorized(true);
      }
    }

    verifyAndAuthorize();
  }, [router]);

  const handleLogout = () => {
    apiClient.logout();
    router.push("/login");
  };

  const navItems = [
    { name: "My Dashboard", href: "/intern/dashboard", icon: LayoutDashboard },
    { name: "Calendar", href: "/intern/calendar", icon: Calendar },
    { name: "Submit Timesheet", href: "/intern/timesheet", icon: ClipboardList },
    { name: "Training Console", href: "/intern/training", icon: GraduationCap },
    { name: "Leave approvals", href: "/intern/leaves", icon: CalendarDays }
  ];

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans antialiased text-slate-800">
        <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-slate-800 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans antialiased text-slate-800">

      {/* Sidebar Navigation */}
      <aside className={`bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 transition-all duration-300 ${
        sidebarOpen ? "w-64" : "w-0 overflow-hidden border-r-0"
      }`}>
        <div className="w-64 flex flex-col justify-between h-full">
          <div className="flex flex-col gap-8 py-6">

            {/* Header Branding with Close trigger */}
            <div className="flex items-center justify-between px-6">
              <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity cursor-pointer">
                <div className="relative h-10 w-28 flex items-center">
                  <Image
                    src="/logo.png"
                    alt="HRA Groups Logo"
                    fill
                    priority
                    className="object-contain object-left"
                  />
                </div>
                <div className="border-l border-slate-200 pl-2.5 text-left">
                  <span className="font-bold text-xs uppercase tracking-tight text-slate-900 block">Intern</span>
                  <span className="block text-[8px] text-slate-400 font-bold tracking-widest uppercase -mt-0.5">HQ Console</span>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                title="Collapse Sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Menu Items */}
            <nav className="flex flex-col gap-1 px-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-100 ${
                      isActive
                        ? "bg-amber-50 text-amber-900 border border-amber-100/50 shadow-sm"
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/75"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            
          </div>

          {/* Footer Logout Button */}
          <div className="p-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50/50 hover:text-rose-700 transition-all duration-100 cursor-pointer"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Logout Session</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200/80 h-16 px-8 flex items-center justify-between shrink-0">

          {/* Left search tool / sidebar trigger */}
          <div className="flex items-center gap-4">
            {!sidebarOpen && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all cursor-pointer flex items-center justify-center animate-pulse"
                title="Open Sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            <div className="relative w-64">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search trainings, syllabus, hours..."
                className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50/50 placeholder-slate-400 focus:outline-none focus:border-slate-350 transition-colors"
              />
            </div>
          </div>

          {/* Right metadata tools */}
          <div className="flex items-center gap-6">

            {/* Notification alert */}
            <NotificationBell currentUser={currentUser} />

            {/* Profile badge */}
            <ProfileDropdown currentUser={currentUser} badgeColorClass="bg-amber-650" />

          </div>

        </header>

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-8 w-full mx-auto max-w-none">
          {children}
        </main>

      </div>

    </div>
  );
}

export default function InternLayout({ children }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans antialiased text-slate-800">
        <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-slate-800 animate-spin" />
      </div>
    }>
      <InternLayoutContent>{children}</InternLayoutContent>
    </Suspense>
  );
}
