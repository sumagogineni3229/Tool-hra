"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Layers,
  LayoutDashboard,
  Users,
  GraduationCap,
  Building2,
  CreditCard,
  FileBarChart2,
  Settings as SettingsIcon,
  LogOut,
  Bell,
  Search,
  User,
  ChevronDown,
  Calendar,
  HelpCircle,
  Megaphone,
  X,
  ChevronRight
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import NotificationBell from "@/components/Common/NotificationBell";
import ProfileDropdown from "@/components/ProfileDropdown";

function AdminLayoutContent({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [userMenuOpen, setUserMenuOpen] = useState(pathname.startsWith("/admin/users"));
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Authorize & load session dynamic roles
  useEffect(() => {
    const session = apiClient.getCurrentSession();
    if (!session) {
      router.push("/login");
      return;
    }

    if (session.role !== "Admin") {
      let redirectPath = "/employee/dashboard";
      if (session.role === "HR") redirectPath = "/hr/dashboard";
      else if (session.role === "Manager") redirectPath = "/manager/dashboard";
      else if (session.role === "Intern") redirectPath = "/intern/dashboard";

      router.push(redirectPath);
      return;
    }

    setCurrentUser(session);
    setIsAuthorized(true);
  }, [router]);

  // Prefetch key administrator console routes for instantaneous client-side navigation
  useEffect(() => {
    router.prefetch("/admin/dashboard");
    router.prefetch("/admin/users");
    router.prefetch("/admin/employees");
    router.prefetch("/admin/interns");
    router.prefetch("/admin/departments");
    router.prefetch("/admin/payroll");
    router.prefetch("/admin/reports");
    router.prefetch("/admin/settings");
  }, [router]);

  const handleLogout = () => {
    apiClient.logout();
    router.push("/login");
  };

  const navItems = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Calendar", href: "/admin/calendar", icon: Calendar },
    { name: "User Management", href: "/admin/users", icon: User },
    { name: "Employees", href: "/admin/employees", icon: Users },
    { name: "Interns", href: "/admin/interns", icon: GraduationCap },
    { name: "Departments", href: "/admin/departments", icon: Building2 },
    { name: "Payroll", href: "/admin/payroll", icon: CreditCard },
    { name: "Reports", href: "/admin/reports", icon: FileBarChart2 },
    { name: "Support Hub", href: "/admin/support", icon: HelpCircle },
    { name: "Announcements", href: "/admin/announcements", icon: Megaphone },
    { name: "Settings", href: "/admin/settings", icon: SettingsIcon },
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
      <aside className={`bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 transition-all duration-300 ${sidebarOpen ? "w-64" : "w-0 overflow-hidden border-r-0"
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
                  <span className="font-bold text-xs uppercase tracking-tight text-slate-900 block">Admin</span>
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
                const isUserManagement = item.name === "User Management";

                if (isUserManagement) {
                  const currentFilter = searchParams.get("filter") || "all";
                  const currentAction = searchParams.get("action");

                  const isUserManagementActive = pathname.startsWith("/admin/users");
                  const isAllUsersActive = pathname === "/admin/users" && currentFilter === "all" && !currentAction;
                  const isCreateUserActive = pathname === "/admin/users" && currentAction === "create";
                  const isHrActive = pathname === "/admin/users" && currentFilter === "hr";
                  const isManagerActive = pathname === "/admin/users" && currentFilter === "manager";

                  return (
                    <div key={item.name} className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(!userMenuOpen);
                          router.push("/admin/users");
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all duration-100 cursor-pointer ${isUserManagementActive
                            ? "bg-slate-100 text-slate-955 border border-slate-200/50 shadow-sm"
                            : "text-slate-500 hover:text-slate-905 hover:bg-slate-100/75"
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{item.name}</span>
                        </div>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-100 ${userMenuOpen ? "rotate-180" : ""}`} />
                      </button>

                      {/* Submenu accordion */}
                      <div className={`overflow-hidden transition-all duration-150 flex flex-col gap-1 pl-6 border-l border-slate-100 ml-6 mt-1 text-left ${userMenuOpen ? "max-h-60 opacity-100 py-1" : "max-h-0 opacity-0 py-0"}`}>
                        <Link
                          href="/admin/users?filter=all"
                          className={`px-4 py-2.5 rounded-lg text-[11px] font-bold transition-all duration-100 flex items-center gap-2 ${isAllUsersActive
                              ? "bg-slate-100 text-slate-950 border border-slate-200/30 shadow-sm"
                              : "text-slate-500 hover:text-slate-950 hover:bg-slate-100/50"
                            }`}
                        >
                          <span className={`font-normal ${isAllUsersActive ? "text-slate-600" : "text-slate-300"}`}>├─</span> All Users
                        </Link>
                        <Link
                          href="/admin/users?action=create"
                          className={`px-4 py-2.5 rounded-lg text-[11px] font-bold transition-all duration-100 flex items-center gap-2 ${isCreateUserActive
                              ? "bg-slate-100 text-slate-950 border border-slate-200/30 shadow-sm"
                              : "text-slate-500 hover:text-slate-955 hover:bg-slate-100/50"
                            }`}
                        >
                          <span className={`font-normal ${isCreateUserActive ? "text-slate-600" : "text-slate-300"}`}>├─</span> Create User
                        </Link>
                        <Link
                          href="/admin/users?filter=hr"
                          className={`px-4 py-2.5 rounded-lg text-[11px] font-bold transition-all duration-100 flex items-center gap-2 ${isHrActive
                              ? "bg-slate-100 text-slate-955 border border-slate-200/30 shadow-sm"
                              : "text-slate-500 hover:text-slate-955 hover:bg-slate-100/50"
                            }`}
                        >
                          <span className={`font-normal ${isHrActive ? "text-slate-600" : "text-slate-300"}`}>├─</span> HR Accounts
                        </Link>
                        <Link
                          href="/admin/users?filter=manager"
                          className={`px-4 py-2.5 rounded-lg text-[11px] font-bold transition-all duration-100 flex items-center gap-2 ${isManagerActive
                              ? "bg-slate-100 text-slate-955 border border-slate-200/30 shadow-sm"
                              : "text-slate-500 hover:text-slate-955 hover:bg-slate-100/50"
                            }`}
                        >
                          <span className={`font-normal ${isManagerActive ? "text-slate-600" : "text-slate-300"}`}>└─</span> Manager Accounts
                        </Link>
                      </div>
                    </div>
                  );
                }

                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-100 ${isActive
                        ? "bg-slate-100 text-slate-955 border border-slate-200/50 shadow-sm"
                        : "text-slate-500 hover:text-slate-905 hover:bg-slate-100/75"
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
                placeholder="Search employee, files, tasks..."
                className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50/50 placeholder-slate-400 focus:outline-none focus:border-slate-350 transition-colors"
              />
            </div>
          </div>

          {/* Right admin metadata tools */}
          <div className="flex items-center gap-6">

            {/* Notification alert */}
            <NotificationBell currentUser={currentUser} />

            {/* Profile badge */}
            <ProfileDropdown currentUser={currentUser} badgeColorClass="bg-slate-900 text-white" />

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

export default function AdminLayout({ children }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans antialiased text-slate-800">
        <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-slate-800 animate-spin" />
      </div>
    }>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </Suspense>
  );
}
