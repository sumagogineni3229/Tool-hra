"use client";

import { useState, useRef, useEffect } from "react";
import { KeyRound, LogOut, ChevronDown, User, ShieldCheck, Camera } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import ChangePasswordModal from "./ChangePasswordModal";
import EditProfilePicModal from "./EditProfilePicModal";

export default function ProfileDropdown({ currentUser, badgeColorClass = "bg-rose-650" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isProfilePicModalOpen, setIsProfilePicModalOpen] = useState(false);
  const [user, setUser] = useState(currentUser);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setUser(currentUser);
  }, [currentUser]);

  const handleLogout = () => {
    apiClient.logout();
    window.location.href = "/login";
  };

  const currentBadgeColor = user?.badgeColor || badgeColorClass;
  const userInitials = user?.initials || 
    user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 
    "EE";

  return (
    <div className="relative" ref={dropdownRef}>
      
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 pl-4 border-l border-slate-200/80 hover:opacity-90 active:scale-98 transition-all cursor-pointer text-left focus:outline-none"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <div className="w-8 h-8 rounded-full overflow-hidden shadow-sm shrink-0 border border-slate-200/60 bg-slate-50 flex items-center justify-center">
          {user?.userPhoto ? (
            <img src={user.userPhoto} alt={user?.name || "Profile"} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full flex items-center justify-center text-white text-xs font-extrabold ${currentBadgeColor}`}>
              {userInitials}
            </div>
          )}
        </div>
        <div className="hidden sm:flex flex-col select-none">
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-slate-900 leading-none truncate max-w-[120px]">
              {user?.name || "Portal User"}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
          </div>
          <span className="text-[9px] text-slate-400 font-semibold tracking-wide uppercase mt-0.5">
            {user?.role || "Staff Member"}
          </span>
        </div>
      </button>

      {/* Elegant Dropdown Card Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-60 bg-white border border-slate-200/80 rounded-2xl shadow-xl shadow-slate-100/60 z-50 p-1.5 flex flex-col gap-1.5 animate-slide-up origin-top-right text-slate-800">
          
          {/* User Details Header */}
          <div className="p-3 flex items-center gap-3 bg-slate-50/50 rounded-xl border border-slate-100/60">
            <div className="relative shrink-0 select-none">
              <button 
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsProfilePicModalOpen(true);
                }}
                className="relative w-11 h-11 rounded-full overflow-hidden shadow-sm border border-slate-200 bg-slate-50 flex items-center justify-center cursor-pointer group hover:opacity-95 active:scale-95 transition-all focus:outline-none"
                title="Manage profile photo"
              >
                {user?.userPhoto ? (
                  <img src={user.userPhoto} alt={user?.name || "Profile"} className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center text-white text-xs font-black ${currentBadgeColor}`}>
                    {userInitials}
                  </div>
                )}
                
                {/* Camera Overlay on Hover */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <Camera className="w-4 h-4 text-white" />
                </div>
              </button>

              {/* Small edit/camera badge overlay in bottom-right corner */}
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-indigo-600 border border-white flex items-center justify-center text-white shadow-sm pointer-events-none">
                <Camera className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="flex flex-col overflow-hidden text-left">
              <span className="text-xs font-bold text-slate-900 truncate">{user?.name || "Portal User"}</span>
              <span className="text-[9.5px] text-slate-500 font-medium truncate mt-0.5">{user?.email}</span>
              {user?.employeeId && (
                <span className="text-[9.5px] text-slate-400 font-bold font-mono tracking-tight mt-0.5">
                  ID: {user.employeeId}
                </span>
              )}
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[8px] font-extrabold uppercase bg-slate-100/85 text-slate-655 rounded border border-slate-200/30 w-fit">
                  {user?.role || "Staff Member"}
                </span>
                {user?.designation && (
                  <span className="text-[9.5px] text-slate-500 font-semibold truncate max-w-[100px]" title={user.designation}>
                    {user.designation}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="border-b border-slate-100 my-0.5 mx-2" />

          {/* Action 1: Change Password */}
          <button
            onClick={() => {
              setIsOpen(false);
              setIsPasswordModalOpen(true);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50/80 active:bg-slate-100 rounded-xl transition-all cursor-pointer text-left focus:outline-none"
          >
            <KeyRound className="w-4 h-4 text-slate-400" />
            <span>Change Password</span>
          </button>

          {/* Action 3: Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 active:bg-rose-100/80 rounded-xl transition-all cursor-pointer text-left focus:outline-none"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Logout Session</span>
          </button>

        </div>
      )}

      {/* Floating Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        currentUser={user}
      />

      {/* Floating Edit Profile Pic Modal */}
      <EditProfilePicModal
        isOpen={isProfilePicModalOpen}
        onClose={() => setIsProfilePicModalOpen(false)}
        currentUser={user}
        onSuccess={(updatedUser) => {
          setUser(updatedUser);
        }}
      />

    </div>
  );
}
