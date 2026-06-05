"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  ArrowRight,
  Clock,
  Calendar,
  Layers,
  FileText,
  FileSpreadsheet,
  ClipboardList
} from "lucide-react";
import LoadingSplash from "@/components/Common/LoadingSplash";
import ThemeToggle from "@/components/Common/ThemeToggle";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [fadeExit, setFadeExit] = useState(false);

  useEffect(() => {
    // Highly responsive timing for the portal loading transition
    const timer = setTimeout(() => {
      setFadeExit(true);
      const exitTimer = setTimeout(() => {
        setLoading(false);
      }, 150); // matches the opacity fade-out transition
      return () => clearTimeout(exitTimer);
    }, 150);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-screen">
      {/* Blurred Loading Overlay */}
      {loading && <LoadingSplash fadeExit={fadeExit} />}

      {/* Main Corporate Home Page */}
      <div className="min-h-screen bg-white flex flex-col font-sans antialiased text-slate-800 selection:bg-indigo-100 selection:text-indigo-900 animate-backdrop">

        {/* Top Professional Security Banner */}
        <div className="bg-slate-900 text-slate-300 text-[11px] py-2.5 px-6 text-center font-medium tracking-wide flex items-center justify-center gap-2 border-b border-slate-800">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Authorized personnel access only. Active security session logging enabled.</span>
        </div>

        {/* Corporate Header */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all duration-300">
          <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">

            {/* Logo / Branding */}
            <div className="flex items-center gap-2.5">
              <div className="relative h-10 w-28 flex items-center justify-start">
                <Image
                  src="/logo.png"
                  alt="HRA Groups Logo"
                  fill
                  priority
                  className="object-contain object-left"
                />
              </div>
              <div className="border-l border-slate-200 pl-2.5">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-700 block">Connect</span>
                <span className="block text-[9px] text-slate-400 font-bold tracking-widest uppercase -mt-0.5">People Portal</span>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-500">
              <a href="#features" className="hover:text-slate-900 transition-colors">System Modules</a>
              <a href="#workflow" className="hover:text-slate-900 transition-colors">Workflow</a>
              <a href="#support" className="hover:text-slate-900 transition-colors">Support</a>
            </nav>

            {/* Action Button & Theme Toggle */}
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link
                href="/login"
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-950 hover:bg-slate-800 transition-all shadow-md shadow-slate-950/10 cursor-pointer"
              >
                Portal Login
              </Link>
            </div>

          </div>
        </header>

        {/* Main Container */}
        <main className="flex-1 max-w-7xl mx-auto px-6 py-12 md:py-20 flex flex-col gap-24">

          {/* Hero Section */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Left Column: Context & Hero Details */}
            <div className="lg:col-span-6 flex flex-col gap-6 text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 w-fit">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-900" />
                <span>Enterprise Operations Workspace</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                The operational brain of HRA Groups.
              </h1>

              <p className="text-base md:text-lg leading-relaxed text-slate-500 max-w-xl">
                A premium, highly secure ecosystem designed to streamline human resource lifecycles. Manage employee profiles, intern paths, real-time attendance, leaves, interactive timesheets, and payroll in a single modern architecture.
              </p>

              {/* Quick Metrics */}
              <div className="grid grid-cols-3 gap-6 pt-4 border-t border-slate-100">
                <div>
                  <span className="block text-2xl md:text-3xl font-bold text-slate-900">100%</span>
                  <span className="text-xs text-slate-500 font-medium">Digital Workflow</span>
                </div>
                <div>
                  <span className="block text-2xl md:text-3xl font-bold text-slate-900">Real-Time</span>
                  <span className="text-xs text-slate-500 font-medium">Tracking</span>
                </div>
                <div>
                  <span className="block text-2xl md:text-3xl font-bold text-slate-900">0-Paper</span>
                  <span className="text-xs text-slate-500 font-medium">Green Operations</span>
                </div>
              </div>

              {/* Action CTAs */}
              <div className="flex flex-wrap gap-4 pt-4">
                <Link
                  href="/login"
                  className="px-7 py-3.5 rounded-xl text-sm font-bold text-white bg-slate-950 hover:bg-slate-800 shadow-lg shadow-slate-950/15 flex items-center gap-2 hover:translate-y-[-1px] active:translate-y-[0px] transition-all duration-200 cursor-pointer"
                >
                  Sign In to Portal <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#features"
                  className="px-7 py-3.5 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 flex items-center gap-2 hover:translate-y-[-1px] transition-all duration-200"
                >
                  Explore Modules
                </a>
              </div>
            </div>

            {/* Right Column: Sleek Browser Mockup Frame */}
            <div className="lg:col-span-6 relative flex justify-center">
              {/* Ambient Background Glow */}
              <div className="absolute -inset-4 bg-gradient-to-tr from-slate-200/20 to-slate-300/10 rounded-3xl blur-2xl -z-10" />

              {/* Elegant Mockup Container */}
              <div className="bg-white border border-slate-200/80 shadow-2xl shadow-slate-200/60 rounded-2xl overflow-hidden max-w-lg w-full transition-transform duration-500 hover:scale-[1.01]">
                {/* Browser bar */}
                <div className="bg-slate-50 border-b border-slate-200/80 px-4 py-3 flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-slate-200" />
                  <div className="w-3 h-3 rounded-full bg-slate-200" />
                  <div className="w-3 h-3 rounded-full bg-slate-200" />
                  <div className="bg-white border border-slate-200 rounded-md text-[10px] text-slate-400 font-semibold px-4 py-0.5 mx-auto w-1/2 text-center select-none truncate font-mono">
                    connect.hra.net/portal
                  </div>
                </div>
                {/* Graphic Mockup Image */}
                <div className="relative aspect-square w-full bg-slate-100 flex items-center justify-center overflow-hidden">
                  <Image
                    src="/dashboard_mockup.png"
                    alt="HRA Connect Dashboard Preview"
                    fill
                    priority
                    className="object-cover object-top hover:scale-[1.01] transition-transform duration-700 ease-out"
                  />
                </div>
              </div>
            </div>

          </section>

          {/* Feature Cards Grid (HRA Workflow Modules) */}
          <section id="features" className="flex flex-col gap-12 border-t border-slate-100 pt-16">
            <div className="text-center max-w-xl mx-auto flex flex-col gap-4">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                One central portal. Fully integrated.
              </h2>
              <p className="text-sm md:text-base text-slate-500">
                Every stage of the human resource operations lifecycle configured in clean, modular structures designed for corporate excellence.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

              {/* Card 1: Attendance */}
              <div className="bg-white border border-slate-200/80 shadow-sm shadow-slate-100/50 rounded-2xl p-6 hover:shadow-md hover:border-slate-300/80 hover:translate-y-[-2px] transition-all duration-300 flex flex-col gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900">
                  <Clock className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Clock-In & Attendance</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    Secure real-time break tracking, automated geolocation validation, and instant manager time records.
                  </p>
                </div>
              </div>

              {/* Card 2: Timesheet & Tasks */}
              <div className="bg-white border border-slate-200/80 shadow-sm shadow-slate-100/50 rounded-2xl p-6 hover:shadow-md hover:border-slate-300/80 hover:translate-y-[-2px] transition-all duration-300 flex flex-col gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900">
                  <ClipboardList className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Smart Timesheets</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    Log operational task hours on daily grids, submit directly to management, and review real-time approvals.
                  </p>
                </div>
              </div>

              {/* Card 3: Leaves & Holidays */}
              <div className="bg-white border border-slate-200/80 shadow-sm shadow-slate-100/50 rounded-2xl p-6 hover:shadow-md hover:border-slate-300/80 hover:translate-y-[-2px] transition-all duration-300 flex flex-col gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900">
                  <Calendar className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Leaves & Absences</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    Apply for sick leaves or personal leaves, track real-time dynamic balance updates, and view published holidays.
                  </p>
                </div>
              </div>

              {/* Card 4: Reports & Analytics */}
              <div className="bg-white border border-slate-200/80 shadow-sm shadow-slate-100/50 rounded-2xl p-6 hover:shadow-md hover:border-slate-300/80 hover:translate-y-[-2px] transition-all duration-300 flex flex-col gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900">
                  <FileSpreadsheet className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Analytical Reports</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    Export structured sheets on employee attendance history, performance analytics, leaves, and training metrics.
                  </p>
                </div>
              </div>

            </div>
          </section>

          {/* Corporate Workflow Showcase Section */}
          <section id="workflow" className="flex flex-col gap-12 border-t border-slate-100 pt-16">

            <div className="text-center max-w-xl mx-auto flex flex-col gap-4">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                The complete master workflow
              </h2>
              <p className="text-sm md:text-base text-slate-500">
                A comprehensive system mapping from profile creation through employee timesheets and holiday publications.
              </p>
            </div>

            <div className="relative grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">

              {/* Step 1 */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 flex flex-col gap-4">
                <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full w-fit">01 / LOGIN</span>
                <h4 className="font-bold text-slate-900 text-sm">Role Authentication</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Dynamic gateway validation routing employees, interns, and admins directly to their authorized custom dashboards.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 flex flex-col gap-4">
                <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full w-fit">02 / PROFILE</span>
                <h4 className="font-bold text-slate-900 text-sm">Account & Documents</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Automated document upload triggers, complete profile status checkers, and dynamic validation steps.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 flex flex-col gap-4">
                <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full w-fit">03 / TRACKING</span>
                <h4 className="font-bold text-slate-900 text-sm">Attendance & Logs</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Daily real-time attendance, customizable break trackers, timesheets, and easy task records for active hours.
                </p>
              </div>

              {/* Step 4 */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 flex flex-col gap-4">
                <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full w-fit">04 / TASKS</span>
                <h4 className="font-bold text-slate-900 text-sm">Trainings & Reviews</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Self assessments, direct manager reviews, mandatory training completions, and certificates.
                </p>
              </div>

              {/* Step 5 */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 flex flex-col gap-4">
                <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full w-fit">05 / AUDITS</span>
                <h4 className="font-bold text-slate-900 text-sm">Approvals & Payroll</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Management console approvals for leave, timesheets, automated payroll, and custom generated analytics.
                </p>
              </div>

            </div>
          </section>

        </main>

        {/* Footer */}
        <footer id="support" className="bg-white border-t border-slate-100 py-12 mt-20">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">

            <div className="flex flex-col gap-4 col-span-2">
              <div className="flex items-center gap-3">
                <div className="relative h-8 w-24">
                  <Image
                    src="/logo.png"
                    alt="HRA Groups Logo"
                    fill
                    className="object-contain object-left"
                  />
                </div>
                <div className="border-l border-slate-200 pl-2.5">
                  <span className="font-bold text-xs tracking-tight text-slate-950">Connect</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
                An enterprise operations dashboard designed specifically for HRA Groups employee lifecycles, internship routes, and payroll calculation.
              </p>
              <span className="text-[10px] text-slate-400 font-medium">© 2026 HRA Groups, Inc. All rights reserved.</span>
            </div>

            <div className="flex flex-col gap-3">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Operational Portals</h4>
              <div className="flex flex-col gap-2 text-xs text-slate-500 font-semibold">
                <Link href="/login" className="hover:text-slate-900 transition-colors">Employee Portal</Link>
                <Link href="/login" className="hover:text-slate-900 transition-colors">Internship Portal</Link>
                <Link href="/login" className="hover:text-slate-900 transition-colors">Administrator Panel</Link>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">System Assistance</h4>
              <div className="flex flex-col gap-2 text-xs text-slate-500 font-semibold">
                <span className="text-slate-400">HQ Support: support@hraconnect.com</span>
                <span className="text-slate-400">Emergency Admin: admin.ops@hraconnect.com</span>
                <a href="#" className="hover:text-slate-900 transition-colors">Developer API Documentation</a>
              </div>
            </div>

          </div>
        </footer>

      </div>
    </div>
  );
}
