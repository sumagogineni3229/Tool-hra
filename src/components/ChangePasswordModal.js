"use client";

import { useState } from "react";
import { X, Lock, Eye, EyeOff, CheckCircle2, AlertTriangle } from "lucide-react";
import { apiClient } from "@/lib/apiClient";

export default function ChangePasswordModal({ isOpen, onClose, currentUser }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotification(null);

    if (newPassword !== confirmPassword) {
      setNotification({
        type: "error",
        message: "New passwords do not match. Please verify your typing."
      });
      return;
    }

    if (newPassword.length < 6) {
      setNotification({
        type: "error",
        message: "For maximum security, your password must be at least 6 characters."
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await apiClient.changePassword(
        currentUser.email,
        currentPassword,
        newPassword
      );

      if (result.success) {
        setNotification({
          type: "success",
          message: "Password changed successfully! You can continue using the portal."
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        
        // Auto close after 2 seconds
        setTimeout(() => {
          onClose();
          setNotification(null);
        }, 2000);
      } else {
        setNotification({
          type: "error",
          message: result.message || "Failed to update your password."
        });
      }
    } catch (err) {
      setNotification({
        type: "error",
        message: "An unexpected error occurred while communicating with the security server."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xl animate-slide-up flex flex-col gap-5 text-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-650">
              <Lock className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base text-slate-900 leading-none">Security Center</span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1">Change Account Password</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning Notification or Success Banner */}
        {notification && (
          <div
            className={`p-3.5 rounded-xl text-xs font-semibold leading-relaxed flex items-start gap-2.5 border transition-all animate-fade-in ${
              notification.type === "success"
                ? "bg-emerald-50 border-emerald-100 text-emerald-850"
                : "bg-rose-50 border-rose-100 text-rose-800"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4.5 h-4.5 text-rose-500 shrink-0 mt-0.5" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Inputs */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Current Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Current Password</label>
            <div className="relative">
              <input
                required
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-slate-900/5 focus:border-slate-950 focus:outline-none transition-all duration-150"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="border-b border-slate-100 my-1" />

          {/* New Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">New Password</label>
            <div className="relative">
              <input
                required
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Create secure new password"
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-slate-900/5 focus:border-slate-950 focus:outline-none transition-all duration-150"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Confirm New Password</label>
            <div className="relative">
              <input
                required
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-slate-900/5 focus:border-slate-950 focus:outline-none transition-all duration-150"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-650 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl text-xs font-semibold text-white bg-slate-950 hover:bg-slate-850 active:bg-black transition-all shadow-md shadow-slate-950/10 cursor-pointer flex items-center justify-center gap-1.5 disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
