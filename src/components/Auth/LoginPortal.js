"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  BadgeAlert,
  ArrowLeft,
  X
} from "lucide-react";
import Home from "@/app/page";
import { apiClient } from "@/lib/apiClient";
import CEOInsightsSplash from "./CEOInsightsSplash";

export default function LoginPortal() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginMessage, setLoginMessage] = useState(null);
  const [showSplash, setShowSplash] = useState(false);
  const [redirectPath, setRedirectPath] = useState("");

  useEffect(() => {
    const session = apiClient.getCurrentSession();
    if (session && session.role) {
      let path = "/employee/dashboard";
      if (session.role === "Admin") {
        path = "/admin/dashboard";
      } else if (session.role === "HR") {
        path = "/hr/dashboard";
      } else if (session.role === "Manager") {
        path = "/manager/dashboard";
      } else if (session.role === "Intern") {
        path = "/intern/dashboard";
      }

      if ((session.role === "Employee" || session.role === "Intern") && !session.profileCompleted) {
        path = "/profile-completion";
      }

      // Display the beautiful CEO Welcome splash screen before navigating to active session dashboard
      setRedirectPath(path);
      setShowSplash(true);
    }
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLoginMessage(null);

    try {
      const result = await apiClient.login(email, password);
      setIsSubmitting(false);

      if (result.success) {
        const user = result.user;
        const role = user.role;

        let path = "/employee/dashboard";
        let roleDisplay = "Employee / Staff";

        if (role === "Admin") {
          path = "/admin/dashboard";
          roleDisplay = "Administrator";
        } else if (role === "HR") {
          path = "/hr/dashboard";
          roleDisplay = "HR Specialist";
        } else if (role === "Manager") {
          path = "/manager/dashboard";
          roleDisplay = "Operations Manager";
        } else if (role === "Intern") {
          path = "/intern/dashboard";
          roleDisplay = "Intern";
        }

        setLoginMessage({
          type: "success",
          text: `Authenticated successfully as ${roleDisplay}! Welcome to HRA Connect.`
        });

        // Store target path and trigger CEO Insights welcome slide transition
        setRedirectPath(path);
        setTimeout(() => {
          setShowSplash(true);
        }, 800);
      } else {
        setLoginMessage({
          type: "error",
          text: result.message || "Invalid secure credentials. Please verify your password and try again."
        });
      }
    } catch (error) {
      setIsSubmitting(false);
      setLoginMessage({
        type: "error",
        text: "System communication failure. Please verify your connection parameters."
      });
    }
  };

  return (
    <>
      {/* Home page static background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none select-none z-0">
        <Home />
      </div>

      {showSplash ? (
        <CEOInsightsSplash
          redirectPath={redirectPath}
          onComplete={() => router.push(redirectPath)}
        />
      ) : (
        /* Backdrop blurred overlay modal */
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md overflow-y-auto animate-backdrop">
          {/* Click background to close */}
          <div className="absolute inset-0 cursor-default" onClick={() => router.push("/")} />

          <div className="relative z-10 w-full sm:max-w-md flex flex-col gap-6 animate-modal">

            {/* Back button */}
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/80 hover:text-white drop-shadow-sm transition-colors w-fit group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to homepage</span>
            </Link>

            {/* Brand logo & Header branding */}
            <div className="flex items-center gap-3 justify-center mb-2 bg-white/95 backdrop-blur-md border border-white/80 px-5 py-2.5 rounded-2xl shadow-xl shadow-slate-950/5 w-fit mx-auto animate-fade-in">
              <div className="relative h-10 w-28 flex items-center">
                <Image
                  src="/logo.png"
                  alt="HRA Groups Logo"
                  fill
                  priority
                  className="object-contain object-left"
                />
              </div>
              <div className="border-l border-slate-200 pl-3">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-700 block">Connect</span>
                <span className="block text-[9px] text-slate-400 font-bold tracking-widest uppercase -mt-0.5">People Portal</span>
              </div>
            </div>

            {/* Login Card (Pure White with Crisp Shadows) */}
            <div className="relative bg-white border border-slate-200/85 rounded-2xl p-8 shadow-2xl shadow-slate-950/15 flex flex-col gap-6 w-full">

              {/* Close (X) Button */}
              <button
                type="button"
                onClick={() => router.push("/")}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all duration-200 cursor-pointer"
                aria-label="Close login portal"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col gap-1.5">
                <h1 className="text-2xl font-bold tracking-tight text-slate-950">System Sign In</h1>
                <p className="text-xs text-slate-500">Provide your official credentials to access the operational brain.</p>
              </div>

              {/* Notification Box */}
              {loginMessage && (
                <div className={`p-4 rounded-xl text-xs font-semibold leading-relaxed flex items-start gap-2.5 border animate-fade-in ${loginMessage.type === "success"
                  ? "bg-emerald-50/70 text-emerald-800 border-emerald-100"
                  : "bg-rose-50/70 text-rose-800 border-rose-100"
                  }`}>
                  {loginMessage.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <BadgeAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span>{loginMessage.text}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLogin} className="flex flex-col gap-4">

                {/* Workplace Email Input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Workplace Email</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                      <Mail className="w-4.5 h-4.5" />
                    </span>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. name@hraconnect.com"
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white placeholder-slate-400 focus:ring-2 focus:ring-slate-950/5 focus:border-slate-950 focus:outline-none transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Secure Password</label>
                    <Link
                      href="/forgot-password"
                      className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                      <Lock className="w-4.5 h-4.5" />
                    </span>
                    <input
                      required
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-12 pr-11 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white placeholder-slate-400 focus:ring-2 focus:ring-slate-950/5 focus:border-slate-950 focus:outline-none transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>

                {/* Keep Logged In Checkbox */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-slate-900 border-slate-300 focus:ring-slate-900/10 cursor-pointer"
                    />
                    <span className="text-xs text-slate-600 font-medium">Keep me authenticated on this device</span>
                  </label>
                </div>

                {/* Authenticate Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl text-sm font-semibold text-white bg-slate-950 hover:bg-slate-850 active:bg-black focus:outline-none shadow-md shadow-slate-950/15 hover:translate-y-[-1px] active:translate-y-[0px] transition-all duration-200 flex items-center justify-center gap-2 disabled:bg-slate-400 disabled:cursor-not-allowed disabled:transform-none mt-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4.5 h-4.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>Verifying Session...</span>
                    </>
                  ) : (
                    <>
                      <span>Authenticate Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

              </form>

            </div>

            {/* Security logging warning info */}
            <div className="flex flex-col gap-1.5 text-center text-[11px] text-white/70 leading-normal max-w-sm mx-auto drop-shadow-sm">
              <div className="flex items-center gap-1.5 justify-center font-medium text-white/90">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Active security session logging enabled.</span>
              </div>
              <span>All system accesses are securely audited under ISO operational parameters.</span>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
