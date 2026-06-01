"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Mail,
  ArrowRight,
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  Terminal,
  ShieldCheck
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";

export default function ForgotPasswordPage() {
  const router = useRouter();

  // Step states: 1 = Email submission, 2 = Code and new password entry
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // For sandbox local verification support
  const [sandboxCode, setSandboxCode] = useState(null);

  // Handler for Step 1: Request Recovery Code
  const handleRequestCode = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await apiClient.requestPasswordCode(email);

      if (result.success) {
        setSuccessMessage("Account verified. A secure 6-digit recovery code has been generated.");
        setSandboxCode(result.code); // Store the code for our luxury developer alert console
        setStep(2); // Progress to reset password step
      } else {
        setErrorMessage(result.message || "No registered workspace found with that email.");
      }
    } catch (err) {
      setErrorMessage("Network failed. Unable to query the security registry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for Step 2: Verification Code & Apply New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please verify your typing.");
      setIsSubmitting(false);
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage("For security reasons, your new password must be at least 6 characters.");
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await apiClient.resetPassword(email, code, newPassword);

      if (result.success) {
        setSuccessMessage("Your password has been reset successfully! Redirecting to login portal...");
        setSandboxCode(null); // Clear code
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setErrorMessage(result.message || "Failed to reset password. Verify your 6-digit code.");
      }
    } catch (err) {
      setErrorMessage("Network error. Unable to synchronize credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans antialiased text-slate-800">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex flex-col gap-5 px-4 sm:px-0">
      
          {/* Back to sign in */}
          <Link 
            href="/login" 
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors w-fit group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to sign in</span>
          </Link>

          {/* Brand logo & Header branding */}
          <div className="flex items-center gap-3 justify-center mb-2 select-none">
            <div className="relative h-12 w-32 flex items-center">
              <Image
                src="/logo.png"
                alt="HRA Groups Logo"
                fill
                priority
                className="object-contain object-left"
              />
            </div>
            <div className="border-l border-slate-200 pl-3">
              <span className="font-bold text-sm tracking-tight text-slate-900 block">Connect</span>
              <span className="block text-[9px] text-slate-400 font-bold tracking-widest uppercase -mt-0.5">People Portal</span>
            </div>
          </div>

          {/* Reset Card (Pure White with Crisp Shadows) */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-8 shadow-xl shadow-slate-100/60 flex flex-col gap-6 w-full sm:max-w-md">
            
            <div className="flex flex-col gap-1.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                {step === 1 ? "Recover Password" : "Verify Reset Code"}
              </h1>
              <p className="text-xs text-slate-500">
                {step === 1 
                  ? "Provide your official workplace email address, and we will dispatch a secure password reset verification code."
                  : `A secure verification code has been dispatched to ${email}. Provide it below to complete password updates.`
                }
              </p>
            </div>

            {/* Error Message Box */}
            {errorMessage && (
              <div className="p-4 rounded-xl text-xs font-semibold leading-relaxed flex items-start gap-2.5 border bg-rose-50 border-rose-100 text-rose-800 animate-fade-in">
                <AlertTriangle className="w-4.5 h-4.5 text-rose-500 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Message Box */}
            {successMessage && (
              <div className="p-4 rounded-xl text-xs font-semibold leading-relaxed flex items-start gap-2.5 border bg-emerald-50 border-emerald-100 text-emerald-850 animate-fade-in">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Form Step 1: Requesting code */}
            {step === 1 && (
              <form onSubmit={handleRequestCode} className="flex flex-col gap-4">
                
                {/* Email Input */}
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
                      placeholder="e.g. employee@hraconnect.com"
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 text-sm bg-white placeholder-slate-400 focus:ring-2 focus:ring-slate-950/5 focus:border-slate-950 focus:outline-none transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Recover Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl text-sm font-semibold text-white bg-slate-950 hover:bg-slate-850 active:bg-black focus:outline-none shadow-md shadow-slate-950/15 hover:translate-y-[-1px] active:translate-y-[0px] transition-all duration-200 flex items-center justify-center gap-2 disabled:bg-slate-400 disabled:cursor-not-allowed disabled:transform-none mt-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4.5 h-4.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>Verifying account...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Recovery Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

              </form>
            )}

            {/* Form Step 2: Verification Code & Password change */}
            {step === 2 && (
              <form onSubmit={handleResetPassword} className="flex flex-col gap-4 animate-fade-in">
                
                {/* 6-digit Code */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Verification Code</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                      <ShieldCheck className="w-4.5 h-4.5" />
                    </span>
                    <input
                      required
                      type="text"
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 text-sm bg-white tracking-widest font-mono placeholder-slate-400 focus:ring-2 focus:ring-slate-950/5 focus:border-slate-950 focus:outline-none transition-all duration-200"
                    />
                  </div>
                </div>

                {/* New Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Secure New Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                      <Lock className="w-4.5 h-4.5" />
                    </span>
                    <input
                      required
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-12 pr-10 py-3 rounded-xl border border-slate-200 text-sm bg-white placeholder-slate-400 focus:ring-2 focus:ring-slate-950/5 focus:border-slate-950 focus:outline-none transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700"
                    >
                      {showNew ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Confirm New Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                      <Lock className="w-4.5 h-4.5" />
                    </span>
                    <input
                      required
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full pl-12 pr-10 py-3 rounded-xl border border-slate-200 text-sm bg-white placeholder-slate-400 focus:ring-2 focus:ring-slate-950/5 focus:border-slate-950 focus:outline-none transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700"
                    >
                      {showConfirm ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>

                {/* Reset Actions */}
                <div className="flex items-center gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-650 hover:bg-slate-50 transition-colors cursor-pointer text-center"
                  >
                    Change Email
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-2 py-3 rounded-xl text-xs font-semibold text-white bg-slate-950 hover:bg-slate-850 active:bg-black transition-all shadow-md shadow-slate-950/10 cursor-pointer flex items-center justify-center gap-1.5 disabled:bg-slate-400 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <span>Update Password</span>
                    )}
                  </button>
                </div>

              </form>
            )}

          </div>

          {/* Sandbox Local Verification Alert Console (LUXURY DEVELOPER & DEMO HELPER) */}
          {sandboxCode && (
            <div className="w-full sm:max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl text-slate-200 flex flex-col gap-3 animate-slide-up border-l-4 border-l-amber-500">
              <div className="flex items-center gap-2 text-amber-400">
                <Terminal className="w-4 h-4 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">Connect Secure Sandbox Mailer Console</span>
              </div>
              <p className="text-[10.5px] leading-relaxed text-slate-400">
                In a production system, HRA Connect dispatches an automated secure verification link to your workplace mailbox. Since this is a local sandbox development instance, you can grab the secure 6-digit recovery code directly below to test the password reset flow:
              </p>
              <div className="flex items-center justify-between bg-slate-950 rounded-xl px-4 py-3 border border-slate-800/80 font-mono mt-1">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] uppercase tracking-wider text-slate-550 font-bold">Secure Reset Code</span>
                  <span className="text-lg font-black tracking-widest text-white">{sandboxCode}</span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(sandboxCode);
                    setSuccessMessage("Reset code copied to clipboard!");
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-[10px] font-bold text-slate-300 hover:text-white transition-all cursor-pointer border border-slate-800"
                >
                  Copy Code
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
