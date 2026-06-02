"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Pin, X, Clock, User, Megaphone, CheckCheck, AlertCircle } from "lucide-react";
import { apiClient } from "@/lib/apiClient";

export default function NotificationBell({ currentUser }) {
  const [announcements, setAnnouncements] = useState([]);
  const [readIds, setReadIds] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  
  const dropdownRef = useRef(null);

  // Load announcements and read status on mount
  useEffect(() => {
    if (!currentUser) return;
    
    // Load read announcements tracking for this user from localStorage
    const storedRead = localStorage.getItem(`hra_read_announcements_${currentUser.email}`);
    if (storedRead) {
      setReadIds(JSON.parse(storedRead));
    }

    async function loadData() {
      try {
        const list = await apiClient.getAnnouncements();
        
        // Filter based on targetRole AND optionally targetUserEmail
        const filtered = list.filter((a) => {
          // If scoped to a specific user email, only show to that user
          if (a.targetUserEmail && a.targetUserEmail !== "") {
            return a.targetUserEmail.toLowerCase().trim() === currentUser.email.toLowerCase().trim();
          }
          // Otherwise filter by role
          if (a.targetRole === "All" || !a.targetRole) return true;
          if (currentUser.role === "Admin" || currentUser.role === "HR") return true;
          return a.targetRole === currentUser.role;
        });

        setAnnouncements(filtered);
      } catch (err) {
        console.warn("Failed to load announcements for bell indicator:", err);
      }
    }

    loadData();

    // Set up standard polling to check for new announcements every 20 seconds
    const interval = setInterval(loadData, 20000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Click outside detection to auto-close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const visibleUnread = announcements.filter(
    (a) => !readIds.includes(a.id) && !readIds.includes(a._id)
  );

  const handleMarkAllRead = () => {
    const updatedRead = [...readIds];
    announcements.forEach((a) => {
      const id = a.id || a._id;
      if (id && !updatedRead.includes(id)) {
        updatedRead.push(id);
      }
    });
    setReadIds(updatedRead);
    localStorage.setItem(
      `hra_read_announcements_${currentUser.email}`,
      JSON.stringify(updatedRead)
    );
  };

  const handleSelectAnnouncement = (announcement) => {
    setSelectedAnnouncement(announcement);
    setIsOpen(false); // Close dropdown
    
    // Mark as read immediately
    const id = announcement.id || announcement._id;
    if (id && !readIds.includes(id)) {
      const updatedRead = [...readIds, id];
      setReadIds(updatedRead);
      localStorage.setItem(
        `hra_read_announcements_${currentUser.email}`,
        JSON.stringify(updatedRead)
      );
    }
  };

  const getCategoryStyles = (category) => {
    switch (category) {
      case "Urgent":
        return "bg-rose-50 text-rose-700 border-rose-100";
      case "Policy":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "Event":
        return "bg-purple-50 text-purple-700 border-purple-100";
      case "Payroll":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      default:
        return "bg-blue-50 text-blue-700 border-blue-100";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Notification Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all duration-200 cursor-pointer ${
          isOpen ? "bg-slate-100 text-slate-800" : ""
        }`}
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 transition-transform duration-200 hover:rotate-12" />
        {visibleUnread.length > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white animate-pulse">
            {visibleUnread.length}
          </span>
        )}
      </button>

      {/* Slide-Down Notifications Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-3.5 w-[380px] origin-top-right rounded-2xl border border-slate-200/80 bg-white shadow-2xl ring-1 ring-black/5 focus:outline-none z-50 overflow-hidden transform scale-100 opacity-100 transition-all duration-150 divide-y divide-slate-100">
          
          {/* Header */}
          <div className="px-5 py-4 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Announcements Feed</h3>
            </div>
            {visibleUnread.length > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List Section */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100/60 custom-scrollbar">
            {announcements.length === 0 ? (
              <div className="py-12 px-6 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-3 border border-slate-100/50">
                  <Bell className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-700">All Quiet Here</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
                  No bulletins published yet. You're fully up to date!
                </p>
              </div>
            ) : (
              announcements.map((item) => {
                const itemId = item.id || item._id;
                const isUnread = !readIds.includes(itemId);
                return (
                  <div
                    key={itemId}
                    onClick={() => handleSelectAnnouncement(item)}
                    className={`relative p-4 text-left transition-colors duration-100 cursor-pointer hover:bg-slate-50/80 flex gap-3 ${
                      isUnread ? "bg-indigo-50/20" : ""
                    } ${item.pinned ? "border-l-2 border-l-indigo-600" : ""}`}
                  >
                    {/* Highlight Dot for Unread */}
                    {isUnread && (
                      <span className="absolute top-5 right-4 w-2 h-2 rounded-full bg-indigo-600 shadow-sm" />
                    )}

                    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                      {/* Badge / Metadata */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getCategoryStyles(
                            item.category
                          )}`}
                        >
                          {item.category}
                        </span>
                        {item.pinned && (
                          <span className="flex items-center gap-0.5 text-[9px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                            <Pin className="w-2.5 h-2.5" />
                            Pinned
                          </span>
                        )}
                        <span className="text-[9px] font-medium text-slate-400 flex items-center gap-1 ml-auto">
                          <Clock className="w-2.5 h-2.5" />
                          {formatDate(item.createdAt)}
                        </span>
                      </div>

                      {/* Title */}
                      <h4
                        className={`text-xs text-slate-900 truncate leading-snug ${
                          isUnread ? "font-bold" : "font-semibold"
                        }`}
                      >
                        {item.title}
                      </h4>

                      {/* Content Snippet */}
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {item.content}
                      </p>

                      {/* Author */}
                      <div className="flex items-center gap-1.5 mt-0.5 text-[9px] font-medium text-slate-400">
                        <User className="w-2.5 h-2.5" />
                        <span>By {item.createdByName}</span>
                        <span className="text-slate-300">•</span>
                        <span className="uppercase text-[8px] font-bold tracking-wider text-slate-400">
                          {item.createdByRole}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer View All Page shortcut */}
          <div className="px-5 py-3 text-center bg-slate-50/20">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Stay connected with HRA HQ
            </span>
          </div>

        </div>
      )}

      {/* Premium Announcement Modal View */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          
          {/* Modal Box */}
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200/80 bg-white shadow-2xl z-[101] overflow-hidden flex flex-col p-6 animate-scale-up">
            
            {/* Close trigger */}
            <button
              onClick={() => setSelectedAnnouncement(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex flex-col gap-2.5 text-left pr-8 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getCategoryStyles(
                    selectedAnnouncement.category
                  )}`}
                >
                  {selectedAnnouncement.category}
                </span>
                {selectedAnnouncement.priority === "High" && (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-rose-50 text-rose-700 border-rose-100 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    High Priority
                  </span>
                )}
                {selectedAnnouncement.pinned && (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-100 flex items-center gap-1">
                    <Pin className="w-3 h-3" />
                    Pinned Announcement
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-slate-900 leading-snug">
                {selectedAnnouncement.title}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Published by:{" "}
                    <strong className="text-slate-800 font-semibold">
                      {selectedAnnouncement.createdByName}
                    </strong>{" "}
                    ({selectedAnnouncement.createdByRole})
                  </span>
                </div>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formatDate(selectedAnnouncement.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Modal Scrollable Content Body */}
            <div className="py-5 text-left text-xs leading-relaxed text-slate-600 font-medium max-h-[300px] overflow-y-auto custom-scrollbar break-words whitespace-pre-wrap">
              {selectedAnnouncement.content}
            </div>

            {/* Modal Actions Footer */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedAnnouncement(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-md transition-all duration-150 cursor-pointer"
              >
                Close Bulletin
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
