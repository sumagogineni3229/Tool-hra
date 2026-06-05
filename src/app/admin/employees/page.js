"use client";

import { useState, useEffect, Fragment } from "react";
import { 
  Users, 
  Search, 
  GraduationCap, 
  Award, 
  Phone, 
  Calendar, 
  MapPin, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  XCircle, 
  Info,
  Building
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";

export default function AdminEmployeesDirectory() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const list = await apiClient.getUsers();
        setUsers(list);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleExpandClick = async (userId) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      return;
    }
    setExpandedUserId(userId);

    // Fetch full user details dynamically if photos aren't loaded yet
    const userObj = users.find(u => u.id === userId);
    if (userObj && !userObj.aadhaarPhoto && !userObj.userPhoto) {
      try {
        const res = await fetch(`/api/users?id=${userId}`);
        if (res.ok) {
          const fullData = await res.json();
          setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...fullData } : u));
        }
      } catch (e) {
        console.warn("Failed to fetch full user profile:", e);
      }
    }
  };

  const filtered = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || u.role.toLowerCase() === filterRole.toLowerCase();
    return matchesSearch && matchesRole;
  });

  const empCount = users.filter(u => u.role === "Employee").length;
  const internCount = users.filter(u => u.role === "Intern").length;
  const managersCount = users.filter(u => u.role === "Manager").length;

  const getStatusBadge = (status) => {
    switch (status) {
      case "Approved":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border bg-emerald-50 text-emerald-800 border-emerald-100">
            Approved
          </span>
        );
      case "Pending":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border bg-amber-50 text-amber-800 border-amber-100">
            Pending
          </span>
        );
      case "Rejected":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border bg-rose-50 text-rose-800 border-rose-100">
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border bg-slate-100 text-slate-600 border-slate-200">
            Unsubmitted
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-8 text-left">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Personnel & Corporate Directory</h1>
        <p className="text-xs text-slate-500">View active employee records, verification details, and secure database credentials.</p>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Employees</span>
            <span className="text-2xl font-extrabold tracking-tight text-slate-950">{empCount} Users</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registered Interns</span>
            <span className="text-2xl font-extrabold tracking-tight text-slate-950">{internCount} Users</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Staff Managers</span>
            <span className="text-2xl font-extrabold tracking-tight text-slate-950">{managersCount} Users</span>
          </div>
        </div>
      </div>

      {/* Directory Table Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Table Filters */}
        <div className="border-b border-slate-100 px-6 py-4 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="font-bold text-slate-900 text-sm">HRA Groups Personnel</h3>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative w-52 sm:w-60">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                placeholder="Search staff details..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:border-slate-350 text-slate-800"
              />
            </div>

            {/* Filter */}
            <select
              value={filterRole}
              onChange={e => setFilterRole(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none cursor-pointer font-bold text-slate-700"
            >
              <option value="all">All Roles</option>
              <option value="Employee">Employees</option>
              <option value="Intern">Interns</option>
              <option value="Manager">Managers</option>
              <option value="HR">HR Specialist</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
        </div>

        {/* Table directory */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-20 text-center text-xs text-slate-400 font-bold">Querying system databases...</div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="px-6 py-4">Employee Details</th>
                  <th className="px-6 py-4">Role / Title</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Security Clearance</th>
                  <th className="px-6 py-4">Verification Status</th>
                  <th className="px-6 py-4">Operational Status</th>
                  <th className="px-6 py-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length > 0 ? (
                  filtered.map((user) => (
                    <Fragment key={user.id}>
                      <tr className={`hover:bg-slate-55/10 transition-colors ${expandedUserId === user.id ? "bg-indigo-50/30" : ""}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {user.userPhoto ? (
                              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-slate-200 shrink-0 shadow-inner bg-slate-100">
                                <img 
                                  src={user.userPhoto} 
                                  alt={user.name} 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${user.badgeColor || 'bg-slate-900 text-white'}`}>
                                {user.initials}
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900 text-xs">{user.name}</span>
                              <span className="text-[10px] text-slate-400 mt-0.5">{user.email}</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-xs font-bold text-slate-800">{user.role}</span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-xs text-slate-500 font-semibold">{user.department}</span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{user.permissions}</span>
                        </td>

                        <td className="px-6 py-4">
                          {getStatusBadge(user.verificationStatus)}
                        </td>

                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            user.status === "Active"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-100"
                              : "bg-rose-50 text-rose-800 border-rose-100"
                          }`}>
                            {user.status}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleExpandClick(user.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold tracking-wide uppercase transition-all bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 active:bg-slate-100 hover:border-slate-350 shadow-sm cursor-pointer"
                          >
                            <span>{expandedUserId === user.id ? "Hide" : "Details"}</span>
                            {expandedUserId === user.id ? (
                              <ChevronUp className="w-3 h-3 text-slate-500" />
                            ) : (
                              <ChevronDown className="w-3 h-3 text-slate-500" />
                            )}
                          </button>
                        </td>
                      </tr>
                      {expandedUserId === user.id && (
                        <tr className="bg-slate-50/40 animate-fade-in border-b border-slate-150/50">
                          <td colSpan="7" className="px-6 py-5">
                            {user.verificationStatus === "Unsubmitted" ? (
                              <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200/80 bg-white shadow-sm max-w-2xl text-left">
                                <Info className="w-4 h-4 text-slate-400 shrink-0" />
                                <div className="flex flex-col">
                                  <span className="font-bold text-xs text-slate-700">Verification Profile Pending</span>
                                  <span className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">This employee has not completed their account verification process. Personal credentials and documents will populate once submitted.</span>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-inner flex flex-col md:flex-row gap-6 items-start text-left max-w-4xl">
                                
                                {/* Photo Attachments Column */}
                                {user.verificationStatus !== "Unsubmitted" && (
                                  <div className="flex flex-row md:flex-col gap-4 shrink-0 mx-auto md:mx-0">
                                    {(!user.userPhoto && !user.aadhaarPhoto) ? (
                                      <div className="flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-xl border border-slate-200/80 bg-slate-50 animate-pulse min-h-[96px] min-w-[96px]">
                                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 border-t-slate-800 animate-spin" />
                                      </div>
                                    ) : (
                                      <>
                                        {user.userPhoto && (
                                          <div className="flex flex-col items-center gap-1.5">
                                            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50 hover:shadow-md hover:scale-102 transition-all cursor-zoom-in">
                                              <img 
                                                src={user.userPhoto} 
                                                alt="Headshot" 
                                                className="w-full h-full object-cover"
                                                onClick={() => setSelectedPhoto(user.userPhoto)}
                                              />
                                            </div>
                                            <span className="text-[8px] uppercase tracking-wider text-slate-400 font-extrabold">Profile Photo</span>
                                          </div>
                                        )}

                                        {user.aadhaarPhoto && (
                                          <div className="flex flex-col items-center gap-1.5">
                                            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50 hover:shadow-md hover:scale-102 transition-all cursor-zoom-in">
                                              <img 
                                                src={user.aadhaarPhoto} 
                                                alt="Aadhaar" 
                                                className="w-full h-full object-cover"
                                                onClick={() => setSelectedPhoto(user.aadhaarPhoto)}
                                              />
                                            </div>
                                            <span className="text-[8px] uppercase tracking-wider text-slate-400 font-extrabold">Aadhaar Doc</span>
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </div>
                                )}

                                {/* Information Details Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-700 flex-1 w-full">
                                  <div className="flex items-start gap-2.5 min-w-0">
                                    <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                    <div className="flex flex-col gap-0.5 min-w-0">
                                      <span className="text-[8px] uppercase tracking-wider text-slate-400 font-extrabold">Phone Number</span>
                                      <span className="text-slate-800 font-bold">{user.phone || "Not provided"}</span>
                                    </div>
                                  </div>

                                  <div className="flex items-start gap-2.5 min-w-0">
                                    <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                    <div className="flex flex-col gap-0.5 min-w-0">
                                      <span className="text-[8px] uppercase tracking-wider text-slate-400 font-extrabold">Date of Birth</span>
                                      <span className="text-slate-800 font-bold">{user.dob || "Not provided"}</span>
                                    </div>
                                  </div>

                                  <div className="flex items-start gap-2.5 min-w-0 sm:col-span-2 border-t border-slate-100 pt-3">
                                    <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                    <div className="flex flex-col gap-0.5 min-w-0">
                                      <span className="text-[8px] uppercase tracking-wider text-slate-400 font-extrabold">Aadhaar Card Number</span>
                                      <span className="text-slate-800 font-mono tracking-wider font-extrabold text-[13px]">
                                        {user.aadhaarNumber || "Not provided"}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-start gap-2.5 min-w-0 sm:col-span-2 border-t border-slate-100 pt-3">
                                    <Users className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                    <div className="flex flex-col gap-0.5 min-w-0">
                                      <span className="text-[8px] uppercase tracking-wider text-slate-400 font-extrabold">Emergency Contact Info</span>
                                      <span className="text-slate-800 font-bold">
                                        {user.emergencyContactName ? (
                                          `${user.emergencyContactName} (${user.emergencyContactPhone || "N/A"})`
                                        ) : (
                                          "None provided"
                                        )}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-start gap-2.5 min-w-0 sm:col-span-2 border-t border-slate-100 pt-3">
                                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                    <div className="flex flex-col gap-0.5 min-w-0">
                                      <span className="text-[8px] uppercase tracking-wider text-slate-400 font-extrabold">Residential Address</span>
                                      <span className="text-slate-800 leading-normal font-bold">
                                        {user.address || "Address details missing."}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-start gap-2.5 min-w-0 sm:col-span-2 border-t border-slate-100 pt-3">
                                    <Building className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                    <div className="flex flex-col gap-0.5 min-w-0">
                                      <span className="text-[8px] uppercase tracking-wider text-slate-400 font-extrabold">Disbursement Bank details</span>
                                      <span className="text-slate-800 leading-normal font-bold">
                                        {user.bankName ? (
                                          `${user.bankName} | A/C: ${user.bankAccountNumber || "N/A"} | IFSC: ${user.bankIfscCode || "N/A"} | Branch: ${user.bankBranch || "N/A"}`
                                        ) : (
                                          "None registered / default"
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-slate-400 text-xs font-semibold bg-slate-55/10">
                      No active personnel records match your selection parameters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

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
