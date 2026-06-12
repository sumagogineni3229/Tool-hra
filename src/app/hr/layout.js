"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Calendar,
  FileSpreadsheet,
  Settings as SettingsIcon,
  LogOut,
  Bell,
  Search,
  ChevronDown,
  UserPlus,
  ShieldCheck,
  ShieldPlus,
  CreditCard,
  Clock,
  HelpCircle,
  Megaphone,
  Briefcase,
  X,
  ChevronRight,
  Award,
  Network,
  GraduationCap,
  Menu,
  FileText
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import NotificationBell from "@/components/Common/NotificationBell";
import ProfileDropdown from "@/components/ProfileDropdown";
import ThemeToggle from "@/components/Common/ThemeToggle";

function HRLayoutContent({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [pathname]);

  useEffect(() => {
    const session = apiClient.getCurrentSession();
    if (!session) {
      router.push("/login");
      return;
    }

    if (session.role !== "HR" && session.role !== "Admin") {
      let redirectPath = "/employee/dashboard";
      if (session.role === "Manager") redirectPath = "/manager/dashboard";
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
    { name: "HR Dashboard", href: "/hr/dashboard", icon: LayoutDashboard },
    { name: "Org Management", href: "/hr/org-management", icon: Network },
    { name: "Create User", href: "/hr/create-user", icon: UserPlus },
    { name: "Employees Directory", href: "/hr/employees", icon: Users },
    { name: "Intern Management", href: "/hr/interns", icon: GraduationCap },
    { name: "Insurance Management", href: "/hr/insurance", icon: ShieldPlus },
    { name: "Profile Verifications", href: "/hr/verifications", icon: ShieldCheck },
    { name: "Attendance Manage", href: "/hr/attendance", icon: Clock },
    { name: "Leave Approvals", href: "/hr/leaves", icon: CalendarDays },
    { name: "Employee Self Service Request", href: "/hr/self-service", icon: FileSpreadsheet },
    { name: "Calendar", href: "/hr/calendar", icon: Calendar },
    { name: "Payroll Console", href: "/hr/payroll", icon: CreditCard },
    { name: "Holidays Publisher", href: "/hr/holidays", icon: FileSpreadsheet },
    { name: "Support Hub", href: "/hr/support", icon: HelpCircle },
    { name: "Announcements", href: "/hr/announcements", icon: Megaphone },
    { name: "Recruitment & Hiring", href: "/hr/recruitment", icon: Briefcase },
    { name: "Create Offer", href: "/hr/create-offer", icon: FileText },
    { name: "Performance Management", href: "/hr/performance", icon: Award }
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
      <aside className={`bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 transition-all duration-300 fixed inset-y-0 left-0 z-50 lg:static lg:translate-x-0 ${sidebarOpen ? "w-64 translate-x-0 shadow-2xl lg:shadow-none" : "w-64 -translate-x-full lg:w-0 lg:overflow-hidden lg:border-r-0"
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
                  <span className="font-bold text-xs uppercase tracking-tight text-slate-900 block">HR Ops</span>
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
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-100 ${isActive
                      ? "bg-indigo-50 text-indigo-900 border border-indigo-100/50 shadow-sm"
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

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-955/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200/80 h-16 px-4 sm:px-8 flex items-center justify-between shrink-0">

          {/* Left search tool / sidebar trigger */}
          <div className="flex items-center gap-4">
            {!sidebarOpen && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all cursor-pointer flex items-center justify-center lg:hidden"
                title="Open Menu"
              >
                <Menu className="w-4.5 h-4.5" />
              </button>
            )}
            {!sidebarOpen && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all cursor-pointer hidden lg:flex items-center justify-center animate-pulse"
                title="Open Sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            <div className="relative w-40 sm:w-64">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search employee, leaves, calendar..."
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
            <ProfileDropdown currentUser={currentUser} badgeColorClass="bg-indigo-650" />

          </div>

        </header>
        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 w-full mx-auto max-w-none">
          {children}
        </main>

      </div>

    </div>
  );
}

export default function HRLayout({ children }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans antialiased text-slate-800">
        <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-slate-800 animate-spin" />
      </div>
    }>
      <HRLayoutContent>{children}</HRLayoutContent>
    </Suspense>
  );
}
