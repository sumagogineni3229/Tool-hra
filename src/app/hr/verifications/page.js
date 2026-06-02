"use client";

import { useState, useEffect } from "react";
import {
  ShieldCheck,
  UserCheck,
  XCircle,
  Mail,
  Phone,
  Calendar,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Users
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";

export default function HRVerificationsPage() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [actioningId, setActioningId] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  async function loadPendingUsers() {
    setIsLoading(true);
    try {
      const pending = await apiClient.getUsers({ verificationStatus: "Pending", includePhotos: true });
      setPendingUsers(pending);
    } catch (err) {
      console.error("Failed to load pending verifications:", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const handleApprove = async (id, name, email) => {
    setActioningId(id);
    setNotification(null);

    try {
      const result = await apiClient.approveProfile(id, email);
      if (result.success) {
        setNotification({
          type: "success",
          text: `Successfully verified and approved profile credentials for ${name}. They now have full portal access.`
        });
        await loadPendingUsers();
      } else {
        setNotification({
          type: "error",
          text: result.message || `Failed to approve profile for ${name}.`
        });
      }
    } catch (err) {
      console.error(err);
      setNotification({
        type: "error",
        text: "Failed to connect to the session portal."
      });
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (id, name, email) => {
    setActioningId(id);
    setNotification(null);

    try {
      const result = await apiClient.rejectProfile(id, email);
      if (result.success) {
        setNotification({
          type: "warning",
          text: `Rejected profile details for ${name}. They will be prompted to resubmit details upon their next access.`
        });
        await loadPendingUsers();
      } else {
        setNotification({
          type: "error",
          text: result.message || `Failed to reject profile for ${name}.`
        });
      }
    } catch (err) {
      console.error(err);
      setNotification({
        type: "error",
        text: "Failed to connect to the session portal."
      });
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      
      {/* Page Header */}
      <div className="flex flex-col gap-1 text-left">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Pending Profile Verifications
        </h1>
        <p className="text-xs text-slate-500">
          Inspect personal operational details submitted by employees and interns to authorize security access clearances.
        </p>
      </div>

      {/* Toast Notification Banner */}
      {notification && (
        <div className={`p-4 rounded-xl text-xs font-semibold leading-relaxed flex items-start gap-2.5 border animate-fade-in text-left ${
          notification.type === "success"
            ? "bg-emerald-50 text-emerald-800 border-emerald-100"
            : notification.type === "warning"
            ? "bg-amber-50 text-amber-800 border-amber-100"
            : "bg-rose-50 text-rose-800 border-rose-100"
        }`}>
          {notification.type === "success" ? (
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className={`w-4.5 h-4.5 shrink-0 mt-0.5 ${
              notification.type === "warning" ? "text-amber-600" : "text-rose-600"
            }`} />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-slate-800 animate-spin" />
        </div>
      ) : (
        /* Workspace Main Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {pendingUsers.map((user) => (
            <div 
              key={user.id || user.email}
              className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col hover:shadow-md hover:border-slate-300 transition-all duration-300 text-left group"
            >
              {/* Header profile stripe */}
              <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Badge or Photo Avatar */}
                  {user.userPhoto ? (
                    <div className="relative w-9.5 h-9.5 rounded-full overflow-hidden border border-slate-200/80 shrink-0 shadow-inner bg-slate-100 group-hover:scale-105 transition-transform duration-300">
                      <img 
                        src={user.userPhoto} 
                        alt={user.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className={`w-9.5 h-9.5 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-300 ${user.badgeColor || 'bg-indigo-600 text-white'}`}>
                      {user.initials || 'U'}
                    </div>
                  )}
                  
                  {/* Identity metadata */}
                  <div className="flex flex-col min-w-0 text-left">
                    <span className="font-bold text-slate-900 text-xs truncate">{user.name}</span>
                    <span className="text-[10px] text-slate-400 truncate mt-0.5 leading-none">{user.email}</span>
                  </div>
                </div>

                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8.5px] font-extrabold border shrink-0 ${
                  user.role === "Employee"
                    ? "bg-indigo-50 text-indigo-800 border-indigo-100"
                    : "bg-amber-50 text-amber-800 border-amber-100"
                }`}>
                  {user.role}
                </span>
              </div>

              {/* Submitted Details Grid */}
              <div className="p-5 flex flex-col sm:flex-row gap-5 flex-1 items-start">
                
                {/* Image Attachments Preview Column */}
                <div className="flex flex-row sm:flex-col gap-3 mx-auto sm:mx-0 shrink-0">
                  {/* User Photo headshot */}
                  {user.userPhoto && (
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm bg-slate-50 hover:shadow-md transition-shadow cursor-zoom-in">
                        <img 
                          src={user.userPhoto} 
                          alt="Verification Headshot" 
                          className="w-full h-full object-cover"
                          onClick={() => setSelectedPhoto(user.userPhoto)}
                        />
                      </div>
                      <span className="text-[7.5px] uppercase tracking-wider text-slate-400 font-extrabold">Profile Photo</span>
                    </div>
                  )}

                  {/* Aadhaar Photo document */}
                  {user.aadhaarPhoto && (
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm bg-slate-50 hover:shadow-md transition-shadow cursor-zoom-in">
                        <img 
                          src={user.aadhaarPhoto} 
                          alt="Aadhaar Card document" 
                          className="w-full h-full object-cover"
                          onClick={() => setSelectedPhoto(user.aadhaarPhoto)}
                        />
                      </div>
                      <span className="text-[7.5px] uppercase tracking-wider text-slate-400 font-extrabold">Aadhaar Doc</span>
                    </div>
                  )}
                </div>

                {/* Details list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold text-slate-700 flex-1 text-left">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <Phone className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-[8px] uppercase tracking-wider text-slate-400 font-extrabold">Phone Number</span>
                      <span className="text-slate-800 truncate">{user.phone || 'Not provided'}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 min-w-0">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-[8px] uppercase tracking-wider text-slate-400 font-extrabold">Date of Birth</span>
                      <span className="text-slate-800 truncate">{user.dob || 'Not provided'}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 min-w-0 sm:col-span-2 border-t border-slate-100 pt-2 pb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-[8px] uppercase tracking-wider text-slate-400 font-extrabold">Aadhaar Card Number</span>
                      <span className="text-slate-800 tracking-wider font-mono">{user.aadhaarNumber || 'Not provided'}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 min-w-0 sm:col-span-2 border-t border-slate-100 pt-2 pb-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-[8px] uppercase tracking-wider text-slate-400 font-extrabold">Emergency Contact Info</span>
                      <span className="text-slate-800 truncate">
                        {user.emergencyContactName || 'None'} ({user.emergencyContactPhone || 'N/A'})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 min-w-0 sm:col-span-2 border-t border-slate-100 pt-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-[8px] uppercase tracking-wider text-slate-400 font-extrabold">Residential Address</span>
                      <span className="text-slate-800 leading-normal line-clamp-2">
                        {user.address || 'Address details missing.'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons panel */}
              <div className="bg-slate-50 border-t border-slate-100 p-4 flex items-center justify-end gap-3 mt-auto">
                <button
                  type="button"
                  disabled={actioningId === user.id}
                  onClick={() => handleReject(user.id || user._id, user.name, user.email)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-transparent transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Profile</span>
                </button>
                
                <button
                  type="button"
                  disabled={actioningId === user.id}
                  onClick={() => handleApprove(user.id || user._id, user.name, user.email)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-all shadow-md shadow-indigo-600/15 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actioningId === user.id ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>Authorizing...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>Verify & Approve</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          ))}

          {pendingUsers.length === 0 && (
            <div className="col-span-1 md:col-span-2 text-center py-20 border-2 border-dashed border-slate-200 rounded-3xl bg-white text-slate-400 text-xs font-semibold px-4 flex flex-col items-center justify-center gap-3 shadow-inner">
              <ShieldCheck className="w-10 h-10 text-slate-300 animate-pulse" />
              <div className="flex flex-col gap-1">
                <span className="font-bold text-slate-850 text-sm">Validations Completed</span>
                <span>There are currently no employee or intern profiles pending verification in the secure index.</span>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Lightbox / Zoom Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-lg max-h-[80vh] rounded-3xl overflow-hidden border border-white/20 shadow-2xl bg-slate-900 flex items-center justify-center animate-modal">
            <img 
              src={selectedPhoto} 
              alt="Enlarged Headshot" 
              className="w-full h-full object-contain"
            />
            <button 
              type="button" 
              className="absolute top-4 right-4 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors cursor-pointer"
              onClick={() => setSelectedPhoto(null)}
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
