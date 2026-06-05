"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Clock,
  CalendarDays,
  LogOut,
  Bell,
  Search,
  Calendar,
  X,
  ChevronRight,
  Users,
  CheckSquare,
  Briefcase,
  TrendingUp
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import NotificationBell from "@/components/Common/NotificationBell";
import ProfileDropdown from "@/components/ProfileDropdown";
import ThemeToggle from "@/components/Common/ThemeToggle";

function ManagerLayoutContent({ children }) {
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

    if (session.role !== "Manager" && session.role !== "Admin") {
      let redirectPath = "/employee/dashboard";
      if (session.role === "HR") redirectPath = "/hr/dashboard";
      else if (session.role === "Intern") redirectPath = "/intern/dashboard";
      
      router.push(redirectPath);
      return;
    }

    setCurrentUser(session);
    setIsAuthorized(true);
  }, [router]);

  const handleLogout = () => {
    apiClient.logout();
    router.push("/login");
  };

  const navItems = [
    { name: "Dashboard", href: "/manager/dashboard", icon: LayoutDashboard },
    { name: "Team Management", href: "/manager/team-management", icon: Users },
    { name: "Attendance management", href: "/manager/attendance", icon: Clock },
    { name: "Leave Management", href: "/manager/leaves", icon: CalendarDays },
    { name: "Calendar", href: "/manager/calendar", icon: Calendar },
    { name: "Task Management", href: "/manager/task-management", icon: CheckSquare },
    { name: "Projects", href: "/manager/projects", icon: Briefcase },
    { name: "Reports", href: "/manager/reports", icon: TrendingUp }
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
                  <span className="font-bold text-xs uppercase tracking-tight text-slate-900 block">Manager</span>
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
                        ? "bg-emerald-50 text-emerald-900 border border-emerald-100/50 shadow-sm"
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
                placeholder="Search team, logs, tasks..."
                className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50/50 placeholder-slate-400 focus:outline-none focus:border-slate-350 transition-colors"
              />
            </div>
          </div>

          {/* Right metadata tools */}
          <div className="flex items-center gap-6">

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notification alert */}
            <NotificationBell currentUser={currentUser} />

            {/* Profile badge */}
            <ProfileDropdown currentUser={currentUser} badgeColorClass="bg-emerald-650" />

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

export default function ManagerLayout({ children }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans antialiased text-slate-800">
        <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-slate-800 animate-spin" />
      </div>
    }>
      <ManagerLayoutContent>{children}</ManagerLayoutContent>
    </Suspense>
  );
}
