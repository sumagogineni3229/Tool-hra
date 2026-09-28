"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  ShieldAlert,
  Send,
  LogOut,
  Phone,
  Calendar,
  MapPin,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  User
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import Home from "@/app/page";

export default function ProfileCompletionPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  // Form inputs
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [userPhoto, setUserPhoto] = useState("");
  const [aadhaarPhoto, setAadhaarPhoto] = useState("");

  const handleAadhaarChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // Keep only digits
    if (value.length <= 12) {
      // Format as groups of 4 digits: "XXXX XXXX XXXX"
      const formatted = value.replace(/(\d{4})(?=\d)/g, "$1 ");
      setAadhaarNumber(formatted);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // limit 2MB for base64 storage
        alert("Image size should be less than 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserPhoto(reader.result); // Base64 Data URL
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAadhaarPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // limit 2MB for base64 storage
        alert("Image size should be less than 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAadhaarPhoto(reader.result); // Base64 Data URL
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const session = apiClient.getCurrentSession();
    if (!session) {
      router.push("/login");
      return;
    }

    // Dynamic Database Sync
    async function syncSession() {
      try {
        const latest = await apiClient.getUsers({ id: session.id || session._id });
        if (latest) {
          const sessionPayload = { ...latest };
          delete sessionPayload.password;
          localStorage.setItem("currentUser", JSON.stringify(sessionPayload));
          
          setCurrentUser(sessionPayload);
          setPhone(sessionPayload.phone || "");
          setDob(sessionPayload.dob || "");
          setAddress(sessionPayload.address || "");
          setEmergencyContactName(sessionPayload.emergencyContactName || "");
          setEmergencyContactPhone(sessionPayload.emergencyContactPhone || "");
          setAadhaarNumber(sessionPayload.aadhaarNumber || "");
          setUserPhoto(sessionPayload.userPhoto || "");
          setAadhaarPhoto(sessionPayload.aadhaarPhoto || "");

          if (sessionPayload.verificationStatus === "Approved") {
            let redirectPath = "/employee/dashboard";
            if (sessionPayload.role === "HR") redirectPath = "/hr/dashboard";
            else if (sessionPayload.role === "Manager") redirectPath = "/manager/dashboard";
            else if (sessionPayload.role === "Intern") redirectPath = "/intern/dashboard";
            else if (sessionPayload.role === "Admin") redirectPath = "/admin/dashboard";
            router.push(redirectPath);
          }
        } else {
          initializeFormFields(session);
        }
      } catch (err) {
        console.warn("Failed to sync session with MongoDB, using LocalStorage state:", err);
        initializeFormFields(session);
      } finally {
        setIsLoading(false);
      }
    }

    function initializeFormFields(s) {
      setCurrentUser(s);
      setPhone(s.phone || "");
      setDob(s.dob || "");
      setAddress(s.address || "");
      setEmergencyContactName(s.emergencyContactName || "");
      setEmergencyContactPhone(s.emergencyContactPhone || "");
      setAadhaarNumber(s.aadhaarNumber || "");
      setUserPhoto(s.userPhoto || "");
      setAadhaarPhoto(s.aadhaarPhoto || "");
    }

    syncSession();
  }, [router]);

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setNotification(null);

    // Validate Aadhaar format
    const cleanAadhaar = aadhaarNumber.replace(/\s+/g, "");
    if (cleanAadhaar.length !== 12 || !/^\d{12}$/.test(cleanAadhaar)) {
      setNotification({
        type: "error",
        text: "Please provide a valid 12-digit Aadhaar Card number."
      });
      setIsSubmitting(false);
      return;
    }

    if (!userPhoto) {
      setNotification({
        type: "error",
        text: "Please upload your headshot verification photo."
      });
      setIsSubmitting(false);
      return;
    }

    if (!aadhaarPhoto) {
      setNotification({
        type: "error",
        text: "Please upload your Aadhaar Card document photo."
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await apiClient.submitProfile(currentUser.id || currentUser._id, {
        phone,
        dob,
        address,
        emergencyContactName,
        emergencyContactPhone,
        aadhaarNumber,
        userPhoto,
        aadhaarPhoto
      });

      if (result.success) {
        // Reload session data locally to update state to 'Pending'
        const updatedSession = apiClient.getCurrentSession();
        setCurrentUser(updatedSession);
        setNotification({
          type: "success",
          text: "Profile details submitted successfully! Your account access is now pending HR verification."
        });
      } else {
        setNotification({
          type: "error",
          text: result.message || "Failed to submit profile details. Please try again."
        });
      }
    } catch (err) {
      console.error(err);
      setNotification({
        type: "error",
        text: "Communication failure. Please verify system connection."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    apiClient.logout();
    router.push("/login");
  };

  if (isLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans antialiased text-slate-800">
        <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-slate-800 animate-spin" />
      </div>
    );
  }

  const isPending = currentUser.verificationStatus === "Pending";
  const isRejected = currentUser.verificationStatus === "Rejected";

  return (
    <>
      {/* Background Static Mockup */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none select-none z-0">
        <Home />
      </div>

      {/* Main Glassmorphic Layout Layer */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-md overflow-y-auto animate-backdrop">
        <div className="relative w-full max-w-2xl flex flex-col gap-6 animate-modal my-8">
          
          {/* Top Branding Badge */}
          <Link href="/" className="flex items-center gap-3 justify-center bg-white/95 backdrop-blur-md border border-white/80 px-5 py-2.5 rounded-2xl shadow-xl shadow-slate-950/5 w-fit mx-auto animate-fade-in hover:opacity-90 transition-opacity cursor-pointer">
            <div className="relative h-9 w-24 flex items-center">
              <Image
                src="/logo.png"
                alt="HRA Groups Logo"
                fill
                priority
                className="object-contain object-left"
              />
            </div>
            <div className="border-l border-slate-200 pl-3">
              <span className="font-bold text-[10px] uppercase tracking-wider text-slate-700 block">Connect</span>
              <span className="block text-[8px] text-slate-400 font-bold tracking-widest uppercase -mt-0.5">Verification Portal</span>
            </div>
          </Link>

          {/* Core Content Card */}
          <div className="bg-white border border-slate-200/80 shadow-2xl rounded-3xl p-6 sm:p-8 flex flex-col gap-6 text-left max-h-[90vh] overflow-y-auto scrollbar-thin">
            
            {isPending ? (
              /* VIEW 1: Pending Verification Screen */
              <div className="flex flex-col gap-6 text-center py-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 mx-auto animate-pulse">
                  <ShieldCheck className="w-8 h-8" />
                </div>

                <div className="flex flex-col gap-2">
                  <h2 className="text-xl font-bold tracking-tight text-slate-950">Verification Underway</h2>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    Hello <span className="font-bold text-slate-800">{currentUser.name}</span>. Your workspace details have been submitted and are undergoing secure credential verification by HRA Operations.
                  </p>
                </div>

                {/* Submitted Details Review Grid */}
                <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl text-left flex flex-col md:flex-row gap-5 items-start">
                  
                  {/* Photo Display if present */}
                  <div className="flex flex-row md:flex-col gap-3 mx-auto md:mx-0 shrink-0">
                    {userPhoto && (
                      <div className="flex flex-col items-center gap-1">
                        <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
                          <img 
                            src={userPhoto} 
                            alt="Submitted headshot" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-[8px] uppercase tracking-wider text-slate-400 font-extrabold">Profile Photo</span>
                      </div>
                    )}
                    
                    {aadhaarPhoto && (
                      <div className="flex flex-col items-center gap-1">
                        <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
                          <img 
                            src={aadhaarPhoto} 
                            alt="Submitted Aadhaar Card" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-[8px] uppercase tracking-wider text-slate-400 font-extrabold">Aadhaar Doc</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col gap-3 w-full">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-200/60 pb-1.5 mb-1 block">
                      Submitted Operational Profile
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Workplace Role</span>
                        <span className="text-slate-800">{currentUser.role} ({currentUser.department})</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Contact Number</span>
                        <span className="text-slate-800">{phone}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Date of Birth</span>
                        <span className="text-slate-800">{dob}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Aadhaar Card Details</span>
                        <span className="text-slate-800 tracking-wider font-mono">{aadhaarNumber || 'Not provided'}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Emergency Contact</span>
                        <span className="text-slate-800">{emergencyContactName} ({emergencyContactPhone})</span>
                      </div>
                      <div className="flex flex-col gap-0.5 sm:col-span-2">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Residential Address</span>
                        <span className="text-slate-800 leading-relaxed">{address}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3.5 border-t border-slate-100 pt-5 mt-2">
                  <button
                    onClick={handleLogout}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Cancel & Logout</span>
                  </button>
                </div>
              </div>
            ) : (
              /* VIEW 2: Detail Submission Form */
              <div className="flex flex-col gap-6">
                <div className="flex items-start gap-4 border-b border-slate-100 pb-4">
                  <div className={`w-12 h-12 rounded-2xl ${
                    isRejected ? 'bg-rose-50 border border-rose-100 text-rose-600' : 'bg-indigo-50 border border-indigo-100 text-indigo-600'
                  } flex items-center justify-center shrink-0`}>
                    {isRejected ? <ShieldAlert className="w-6 h-6 animate-bounce" /> : <UserCheck className="w-6 h-6" />}
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">Complete Security Profile</h2>
                    <p className="text-xs text-slate-500 leading-normal">
                      Welcome, <span className="font-bold text-slate-800">{currentUser.name}</span>. Provide your official personal details to request operational clearance for HRA Connect.
                    </p>
                  </div>
                </div>

                {/* Rejected Toast Notification */}
                {isRejected && (
                  <div className="p-4 rounded-xl text-xs font-semibold leading-relaxed flex items-start gap-2.5 border bg-rose-50 text-rose-800 border-rose-100/70 animate-pulse">
                    <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold">Clearance Rejected By HR</span>
                      <span>Your previously submitted details were rejected. Please verify and resubmit the form below.</span>
                    </div>
                  </div>
                )}

                {notification && (
                  <div className={`p-4 rounded-xl text-xs font-semibold leading-relaxed flex items-start gap-2.5 border animate-fade-in ${
                    notification.type === "success"
                      ? "bg-emerald-50/70 text-emerald-800 border-emerald-100"
                      : "bg-rose-50/70 text-rose-800 border-rose-100"
                  }`}>
                    {notification.type === "success" ? (
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <span>{notification.text}</span>
                  </div>
                )}

                <form onSubmit={handleSubmitProfile} className="flex flex-col gap-4">
                  {/* Read-Only Identity Section */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-150/75">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Assigned Identity</span>
                      <span className="text-xs font-bold text-slate-800">{currentUser.name}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Operational Clearance</span>
                      <span className="text-xs font-bold text-indigo-650">{currentUser.role} ({currentUser.department})</span>
                    </div>
                  </div>

                  {/* Phone & Date of Birth Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Contact Number */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Contact Number</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                          <Phone className="w-4 h-4" />
                        </span>
                        <input
                          required
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="e.g. +91 9876543210"
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-slate-950/5 focus:border-slate-950 focus:outline-none transition-all font-semibold"
                        />
                      </div>
                    </div>

                    {/* DOB */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Date of Birth</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                          <Calendar className="w-4 h-4" />
                        </span>
                        <input
                          required
                          type="date"
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-slate-950/5 focus:border-slate-950 focus:outline-none transition-all font-semibold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact Name & Phone Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Contact Name */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Emergency Contact Name</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                          <User className="w-4 h-4" />
                        </span>
                        <input
                          required
                          type="text"
                          value={emergencyContactName}
                          onChange={(e) => setEmergencyContactName(e.target.value)}
                          placeholder="e.g. Alexander Green (Father)"
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-slate-950/5 focus:border-slate-950 focus:outline-none transition-all font-semibold"
                        />
                      </div>
                    </div>

                    {/* Contact Phone */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Emergency Contact Phone</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                          <Phone className="w-4 h-4" />
                        </span>
                        <input
                          required
                          type="tel"
                          value={emergencyContactPhone}
                          onChange={(e) => setEmergencyContactPhone(e.target.value)}
                          placeholder="e.g. +91 9876543219"
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-slate-950/5 focus:border-slate-950 focus:outline-none transition-all font-semibold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Aadhaar Details Row */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Aadhaar Card Number</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                        <ShieldCheck className="w-4 h-4 text-slate-400" />
                      </span>
                      <input
                        required
                        type="text"
                        value={aadhaarNumber}
                        onChange={handleAadhaarChange}
                        placeholder="e.g. 1234 5678 9012"
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-slate-950/5 focus:border-slate-950 focus:outline-none transition-all font-semibold tracking-wider font-mono"
                      />
                    </div>
                  </div>

                  {/* Aadhaar Photo Selector Row */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Aadhaar Card Document Photo</label>
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border border-dashed border-slate-250 rounded-xl bg-slate-50/50">
                      
                      {/* Photo Preview Container */}
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 bg-white shrink-0 shadow-inner flex items-center justify-center text-slate-400">
                        {aadhaarPhoto ? (
                          <img 
                            src={aadhaarPhoto} 
                            alt="Aadhaar Preview" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ShieldCheck className="w-8 h-8 text-slate-350" />
                        )}
                      </div>

                      {/* Photo Upload Controls */}
                      <div className="flex flex-col gap-1 text-left flex-1 w-full">
                        <span className="text-[11px] font-bold text-slate-700">Upload official Aadhaar Card photo</span>
                        <span className="text-[9px] text-slate-400">Supported formats: JPG, PNG. Maximum size: 2MB.</span>
                        
                        <div className="flex items-center gap-3 mt-2">
                          <label className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-all shadow-sm shadow-indigo-600/10 cursor-pointer select-none">
                            <span>Browse File</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleAadhaarPhotoChange}
                              className="hidden"
                              required={!aadhaarPhoto}
                            />
                          </label>
                          {aadhaarPhoto && (
                            <button
                              type="button"
                              onClick={() => setAadhaarPhoto("")}
                              className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                            >
                              Remove Photo
                            </button>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* User Photo Selector Row */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Verification Photo</label>
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border border-dashed border-slate-250 rounded-xl bg-slate-50/50">
                      
                      {/* Photo Preview Container */}
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 bg-white shrink-0 shadow-inner flex items-center justify-center text-slate-400">
                        {userPhoto ? (
                          <img 
                            src={userPhoto} 
                            alt="Verification Preview" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-8 h-8 text-slate-350" />
                        )}
                      </div>

                      {/* Photo Upload Controls */}
                      <div className="flex flex-col gap-1 text-left flex-1 w-full">
                        <span className="text-[11px] font-bold text-slate-700">Upload official headshot photo</span>
                        <span className="text-[9px] text-slate-400">Supported formats: JPG, PNG. Maximum size: 2MB.</span>
                        
                        <div className="flex items-center gap-3 mt-2">
                          <label className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-all shadow-sm shadow-indigo-600/10 cursor-pointer select-none">
                            <span>Browse File</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handlePhotoChange}
                              className="hidden"
                              required={!userPhoto}
                            />
                          </label>
                          {userPhoto && (
                            <button
                              type="button"
                              onClick={() => setUserPhoto("")}
                              className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                            >
                              Remove Photo
                            </button>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Residential Address</label>
                    <div className="relative">
                      <span className="absolute top-3 left-3.5 text-slate-400 pointer-events-none">
                        <MapPin className="w-4 h-4" />
                      </span>
                      <textarea
                        required
                        rows={3}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Provide your complete current residential address details..."
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-slate-950/5 focus:border-slate-950 focus:outline-none transition-all font-semibold resize-none"
                      />
                    </div>
                  </div>

                  {/* Form buttons */}
                  <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100 mt-2">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-55/40 border border-slate-200 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                    
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-all shadow-md shadow-indigo-650/15 cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit For Verification</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>

          {/* Secure Audit Notice */}
          <div className="flex items-center gap-1.5 justify-center text-[10px] text-white/85 leading-normal max-w-sm mx-auto drop-shadow-sm font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Profile validations are securely logged for system compliance auditing.</span>
          </div>

        </div>
      </div>
    </>
  );
}
