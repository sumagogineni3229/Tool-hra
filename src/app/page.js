"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

import {
  ShieldCheck,
  ArrowRight,
  Clock,
  Calendar,
  ClipboardList,
  FileSpreadsheet,
  Menu,
  X,
  Users,
  Briefcase,
  BarChart3,
  Sparkles,
} from "lucide-react";

import LoadingSplash from "@/components/Common/LoadingSplash";
import ThemeToggle from "@/components/Common/ThemeToggle";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [fadeExit, setFadeExit] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeExit(true);

      const exitTimer = setTimeout(() => {
        setLoading(false);
      }, 150);

      return () => clearTimeout(exitTimer);
    }, 150);

    return () => clearTimeout(timer);
  }, []);

  const features = [
    {
      icon: Clock,
      title: "Attendance Tracking",
      text: "Track employee clock-ins, breaks, attendance history, and productivity logs in real time.",
    },
    {
      icon: ClipboardList,
      title: "Smart Timesheets",
      text: "Employees and interns can manage tasks, submit work logs, and receive approvals instantly.",
    },
    {
      icon: Calendar,
      title: "Leave Management",
      text: "Apply, approve, and monitor leave balances with automated holiday calendars.",
    },
    {
      icon: FileSpreadsheet,
      title: "Reports & Analytics",
      text: "Generate advanced reports for attendance, payroll, employee activity, and performance.",
    },
    {
      icon: Users,
      title: "Employee Profiles",
      text: "Maintain complete employee and intern records with secure document management.",
    },
    {
      icon: Briefcase,
      title: "HR Operations",
      text: "Simplify onboarding, verification, internal workflows, and operational approvals.",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-white">

      {/* Loading Overlay */}
      {loading && <LoadingSplash fadeExit={fadeExit} />}

      {/* Main Wrapper */}
      <div className="min-h-screen flex flex-col text-slate-800 font-sans antialiased">

        {/* Security Banner */}
        <div className="bg-slate-950 text-slate-300 text-[10px] sm:text-[11px] py-2.5 px-4 sm:px-6 flex items-center justify-center gap-2 border-b border-slate-800 text-center">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />

          <span className="leading-relaxed">
            Authorized personnel access only. Active
            enterprise-grade security monitoring enabled.
          </span>
        </div>

        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">

          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-[74px] flex items-center justify-between">

            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-3">

              <div className="relative h-8 sm:h-10 w-24 sm:w-28">
                <Image
                  src="/logo.png"
                  alt="HRA Groups Logo"
                  fill
                  priority
                  className="object-contain object-left"
                />
              </div>

              <div className="border-l border-slate-200 pl-2.5">
                <span className="block font-bold text-[10px] sm:text-xs uppercase tracking-wider text-slate-700">
                  Connect
                </span>

                <span className="block text-[8px] sm:text-[9px] text-slate-400 uppercase tracking-[2px] font-bold">
                  People Portal
                </span>
              </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-500">

              <a
                href="#features"
                className="hover:text-slate-900 transition-colors"
              >
                Features
              </a>

              <a
                href="#workflow"
                className="hover:text-slate-900 transition-colors"
              >
                Workflow
              </a>

              <a
                href="#support"
                className="hover:text-slate-900 transition-colors"
              >
                Support
              </a>
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-4">

              <ThemeToggle />

              <Link
                href="/login"
                className="hidden sm:flex items-center justify-center px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-950 hover:bg-slate-800 transition-all shadow-lg shadow-slate-950/10"
              >
                Portal Login
              </Link>

              {/* Mobile Menu */}
              <button
                onClick={() =>
                  setMobileMenuOpen(!mobileMenuOpen)
                }
                className="md:hidden p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Nav */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-white border-t border-slate-100 px-4 py-4 flex flex-col gap-4 shadow-xl animate-backdrop">

              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-semibold text-slate-600 hover:text-slate-900"
              >
                Features
              </a>

              <a
                href="#workflow"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-semibold text-slate-600 hover:text-slate-900"
              >
                Workflow
              </a>

              <a
                href="#support"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-semibold text-slate-600 hover:text-slate-900"
              >
                Support
              </a>

              <Link
                href="/login"
                className="w-full text-center px-5 py-3 rounded-xl text-sm font-bold text-white bg-slate-950 hover:bg-slate-800 transition-all"
              >
                Portal Login
              </Link>
            </div>
          )}
        </header>

        {/* Main */}
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20 flex flex-col gap-24">

          {/* Hero */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Left */}
            <div className="lg:col-span-6 flex flex-col gap-6 text-center lg:text-left">

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 w-fit mx-auto lg:mx-0">
                <Sparkles className="w-3.5 h-3.5 text-slate-900" />
                <span>Enterprise HR Management Platform</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.05]">
                Transform workforce operations with HRA Connect.
              </h1>

              <p className="text-sm sm:text-base md:text-lg text-slate-500 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                HRA Connect is a modern enterprise workforce
                management platform built to simplify
                attendance, employee lifecycle management,
                HR approvals, payroll operations, timesheets,
                intern tracking, reporting, and analytics —
                all within one secure digital ecosystem.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-5 border-t border-slate-100">

                <div>
                  <span className="block text-xl sm:text-3xl font-bold text-slate-900">
                    100%
                  </span>

                  <span className="text-[10px] sm:text-xs text-slate-500 font-medium">
                    Digital Workflow
                  </span>
                </div>

                <div>
                  <span className="block text-xl sm:text-3xl font-bold text-slate-900">
                    Real-Time
                  </span>

                  <span className="text-[10px] sm:text-xs text-slate-500 font-medium">
                    Tracking
                  </span>
                </div>

                <div>
                  <span className="block text-xl sm:text-3xl font-bold text-slate-900">
                    Secure
                  </span>

                  <span className="text-[10px] sm:text-xs text-slate-500 font-medium">
                    Cloud Platform
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">

                <Link
                  href="/login"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-sm font-bold text-white bg-slate-950 hover:bg-slate-800 shadow-lg shadow-slate-950/15 flex items-center justify-center gap-2 transition-all"
                >
                  Access Portal
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="#features"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center gap-2 transition-all"
                >
                  Explore Features
                </a>
              </div>
            </div>

            {/* Right */}
            <div className="lg:col-span-6 relative flex justify-center">

              <div className="absolute -inset-4 bg-gradient-to-tr from-slate-200/20 to-slate-300/10 rounded-3xl blur-2xl -z-10" />

              <div className="w-full max-w-md sm:max-w-lg bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl">

                {/* Browser Bar */}
                <div className="bg-slate-50 border-b border-slate-200 px-3 sm:px-4 py-3 flex items-center gap-1.5">

                  <div className="w-3 h-3 rounded-full bg-slate-200" />
                  <div className="w-3 h-3 rounded-full bg-slate-200" />
                  <div className="w-3 h-3 rounded-full bg-slate-200" />

                  <div className="mx-auto bg-white border border-slate-200 rounded-md px-3 py-0.5 text-[9px] sm:text-[10px] text-slate-400 font-mono truncate w-[60%] text-center">
                    connect.hra.net/dashboard
                  </div>
                </div>

                {/* Image */}
                <div className="relative aspect-[4/3] sm:aspect-square bg-slate-100 overflow-hidden">

                  <Image
                    src="/dashboard_mockup.png"
                    alt="Dashboard Preview"
                    fill
                    priority
                    className="object-cover object-top hover:scale-[1.02] transition-transform duration-700"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Features */}
          <section
            id="features"
            className="flex flex-col gap-12"
          >

            <div className="text-center max-w-2xl mx-auto flex flex-col gap-4">

              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                Powerful modules designed for modern enterprises.
              </h2>

              <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
                Every workflow is carefully engineered to
                improve employee productivity, HR efficiency,
                transparency, and operational excellence.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">

              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col gap-4"
                >

                  <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900">
                    <feature.icon className="w-5 h-5" />
                  </div>

                  <div className="flex flex-col gap-2">

                    <h3 className="text-base font-bold text-slate-900">
                      {feature.title}
                    </h3>

                    <p className="text-sm text-slate-500 leading-relaxed">
                      {feature.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Workflow */}
          <section
            id="workflow"
            className="flex flex-col gap-12"
          >

            <div className="text-center max-w-2xl mx-auto flex flex-col gap-4">

              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900">
                Smart workflow automation.
              </h2>

              <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
                HRA Connect automates the complete employee
                lifecycle from onboarding to payroll approvals
                with centralized workflow management.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

              {[
                "Employee Onboarding",
                "Attendance & Tracking",
                "Timesheet Management",
                "Payroll & Reporting",
              ].map((step, index) => (
                <div
                  key={index}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col gap-4"
                >

                  <div className="w-10 h-10 rounded-full bg-slate-950 text-white flex items-center justify-center text-sm font-bold">
                    0{index + 1}
                  </div>

                  <h3 className="font-bold text-slate-900">
                    {step}
                  </h3>

                  <p className="text-sm text-slate-500 leading-relaxed">
                    Streamlined operational flow designed for
                    speed, transparency, and security.
                  </p>
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer
          id="support"
          className="border-t border-slate-100 bg-slate-50 py-12 mt-10"
        >

          <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-4 gap-10">

            <div className="md:col-span-2 flex flex-col gap-4">

              <div className="flex items-center gap-3">

                <div className="relative h-8 w-24">
                  <Image
                    src="/logo.png"
                    alt="Logo"
                    fill
                    className="object-contain object-left"
                  />
                </div>

                <div className="border-l border-slate-200 pl-2.5">
                  <span className="font-bold text-xs tracking-tight text-slate-950">
                    Connect
                  </span>
                </div>
              </div>

              <p className="text-sm text-slate-500 leading-relaxed max-w-md">
                HRA Connect is an enterprise-grade HR and
                workforce management platform developed to
                modernize employee operations, attendance,
                reporting, and organizational workflows.
              </p>

              <span className="text-xs text-slate-400">
                © 2026 HRA Groups. All rights reserved.
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <h4 className="font-bold text-slate-900 text-sm">
                Quick Links
              </h4>

              <Link
                href="/login"
                className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
              >
                Employee Portal
              </Link>

              <Link
                href="/login"
                className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
              >
                Internship Portal
              </Link>

              <Link
                href="/login"
                className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
              >
                Administrator Access
              </Link>
            </div>

            <div className="flex flex-col gap-3">
              <h4 className="font-bold text-slate-900 text-sm">
                Support
              </h4>

              <span className="text-sm text-slate-500">
                support@hragroups.com
              </span>

              <span className="text-sm text-slate-500">
                admin@hragroups.com
              </span>

              <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium pt-2">
                <BarChart3 className="w-4 h-4" />
                Enterprise System Active
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}