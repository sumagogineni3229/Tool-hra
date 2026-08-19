"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Menu,
  X,
  LogOut
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import NotificationBell from "@/components/Common/NotificationBell";
import ProfileDropdown from "@/components/ProfileDropdown";
import ThemeToggle from "@/components/Common/ThemeToggle";

function OfferManagementLayoutContent({ children }) {
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

    // Allow Offer_Specialist, Admin, and HR
    const allowedRoles = ["Offer_Specialist", "Offer Specialist", "Admin", "HR"];
    if (!allowedRoles.includes(session.role)) {
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
    { name: "Offer Operations Hub", href: "/offer-management", icon: LayoutDashboard },
  ];

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans antialiased text-slate-800">
        <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans antialiased text-slate-800">
      {/* Sidebar Navigation */}
      <aside
        className={`bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 transition-all duration-300 fixed inset-y-0 left-0 z-50 lg:static lg:translate-x-0 ${
          sidebarOpen
            ? "w-64 translate-x-0 shadow-2xl lg:shadow-none"
            : "w-64 -translate-x-full lg:w-0 lg:overflow-hidden lg:border-r-0"
        }`}
      >
        <div className="w-64 flex flex-col justify-between h-full">
          <div className="flex flex-col gap-8 py-6">
            {/* Header Branding */}
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
                <div className="border-l border-indigo-200 pl-2.5 text-left">
                  <span className="font-bold text-xs uppercase tracking-tight text-indigo-950 block">Offer Desk</span>
                  <span className="block text-[8px] text-indigo-500 font-bold tracking-widest uppercase -mt-0.5">Specialist Hub</span>
                </div>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition-colors"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation links */}
            <nav className="flex flex-col gap-1.5 px-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1 block text-left">
                Offer Letter Suite
              </span>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group relative cursor-pointer ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                        : "text-slate-600 hover:bg-indigo-50/60 hover:text-indigo-900"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-600"
                      }`}
                    />
                    <span>{item.name}</span>
                    {isActive && (
                      <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User profile footer card */}
          <div className="p-4 border-t border-slate-100 flex flex-col gap-3">
            <div className="p-3 bg-indigo-50/70 rounded-2xl border border-indigo-100/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                  {currentUser?.initials || "OD"}
                </div>
                <div className="flex flex-col min-w-0 text-left">
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {currentUser?.name || "Offer Desk Specialist"}
                  </span>
                  <span className="text-[9px] text-indigo-600 font-bold uppercase tracking-wider truncate">
                    Offer Operations
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex flex-col text-left">
              <span className="font-bold text-sm text-slate-900">Offer Management Dashboard</span>
              <span className="text-[10px] text-slate-400 font-medium">HRA Connect Corporate Suite</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <NotificationBell currentUser={currentUser} />
            <ProfileDropdown user={currentUser} />
          </div>
        </header>

        {/* Page Content - Fullscreen width for editor and management */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function OfferManagementLayout({ children }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin" />
        </div>
      }
    >
      <OfferManagementLayoutContent>{children}</OfferManagementLayoutContent>
    </Suspense>
  );
}