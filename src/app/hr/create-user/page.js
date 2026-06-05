"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Search,
  CheckCircle,
  AlertCircle,
  User,
  Mail,
  Lock,
  History,
  ShieldCheck,
  Users
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";

export default function HRCreateUserPage() {
  const router = useRouter();
  const [usersList, setUsersList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Form State for creating a user (specifically for Employee or Intern roles)
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("Employee");
  const [newDepartment, setNewDepartment] = useState("Operation");
  const [newPermissions, setNewPermissions] = useState("Read/Write");
  const [newStatus, setNewStatus] = useState("Active");

  // Load recently created users and departments
  async function loadData() {
    setIsLoading(true);
    try {
      const [users, depts] = await Promise.all([
        apiClient.getUsers(),
        apiClient.getDepartments()
      ]);
      // Filter list to only show Employee and Intern accounts in HR context
      const filtered = users.filter(u => u.role === "Employee" || u.role === "Intern");
      setUsersList(filtered);
      setDepartments(depts || []);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setNotification(null);

    // Strict guard check to guarantee only Employee or Intern roles are provisioned by HR
    if (newRole !== "Employee" && newRole !== "Intern") {
      setNotification({
        type: "error",
        text: "Security Breach Prevention: HR Specialists can only provision Employee or Intern credentials."
      });
      return;
    }

    try {
      const result = await apiClient.createUser({
        name: newName,
        email: newEmail,
        password: newPassword,
        role: newRole,
        department: newDepartment,
        permissions: newPermissions,
        status: newStatus
      });

      if (result.success) {
        // Refresh the list immediately
        await loadData();

        // Reset the form state
        setNewName("");
        setNewEmail("");
        setNewPassword("");
        setNewRole("Employee");
        setNewDepartment("Operation");
        setNewPermissions("Read/Write");
        setNewStatus("Active");

        // Set success notification
        setNotification({
          type: "success",
          text: `Successfully provisioned credentials for ${result.user.name} as ${result.user.role}!`
        });

        // Auto clear toast after 5 seconds
        setTimeout(() => {
          setNotification(null);
        }, 5000);
      } else {
        setNotification({
          type: "error",
          text: "Registration Error: " + (result.message || "Failed to provision user.")
        });
      }
    } catch (err) {
      console.error(err);
      setNotification({
        type: "error",
        text: "Failed to connect to the session portal."
      });
    }
  };

  return (
    <div className="flex flex-col gap-8">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-left">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Provision Personnel Account
          </h1>
          <p className="text-xs text-slate-500">
            HR portal to securely configure employee and intern access credentials, department groups, and clearances.
          </p>
        </div>
      </div>

      {/* Main Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Account Creation Form (7 Columns) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col gap-6 text-left">
          
          <div className="flex flex-col gap-1.5 border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-600" />
              <span>Provisioning Controls</span>
            </h2>
            <p className="text-xs text-slate-400 leading-normal">
              Enter official workspace details. System clearances are restricted to employees and interns.
            </p>
          </div>

          {/* Toast/Notification Banner */}
          {notification && (
            <div className={`p-4 rounded-xl text-xs font-semibold leading-relaxed flex items-start gap-2.5 border animate-fade-in ${
              notification.type === "success"
                ? "bg-emerald-50/70 text-emerald-800 border-emerald-100/70"
                : "bg-rose-50/70 text-rose-800 border-rose-100/70"
            }`}>
              {notification.type === "success" ? (
                <CheckCircle className="w-4.5 h-4.5 text-emerald-650 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4.5 h-4.5 text-rose-650 shrink-0 mt-0.5" />
              )}
              <span>{notification.text}</span>
            </div>
          )}

          <form onSubmit={handleCreateUser} className="flex flex-col gap-5">
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                  <User className="w-4 h-4" />
                </span>
                <input
                  required
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Kira Nerys"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-slate-950/5 focus:border-slate-950 focus:outline-none transition-all duration-200 font-semibold"
                />
              </div>
            </div>

            {/* Workplace Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Workplace Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  required
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="kira@hraconnect.com"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-slate-950/5 focus:border-slate-950 focus:outline-none transition-all duration-200 font-semibold"
                />
              </div>
            </div>

            {/* Initial Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Initial Passcode / Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  required
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-slate-950/5 focus:border-slate-950 focus:outline-none transition-all duration-200 font-semibold"
                />
              </div>
            </div>

            {/* Role & Department Row */}
            <div className="grid grid-cols-2 gap-4">
              
              {/* System Role Selection (Strictly Restricted to Employee & Intern) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">System Assignment</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-slate-950/5 focus:border-slate-950 focus:outline-none transition-all cursor-pointer font-bold"
                >
                  <option value="Employee">Employee</option>
                  <option value="Intern">Intern</option>
                </select>
              </div>

              {/* Role Selection (maps to department field) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Role</label>
                <select
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-slate-950/5 focus:border-slate-950 focus:outline-none transition-all cursor-pointer font-bold text-slate-700"
                >
                  <option value="Human Resource">Human Resource</option>
                  <option value="Team Manager">Team Manager</option>
                  <option value="Engineer">Engineer</option>
                  <option value="Finance">Finance</option>
                  <option value="Operation">Operation</option>
                </select>
              </div>

            </div>

            {/* Clearance Scope */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Clearance Scope</label>
              <select
                value={newPermissions}
                onChange={(e) => setNewPermissions(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-slate-950/5 focus:border-slate-950 focus:outline-none transition-all cursor-pointer font-bold"
              >
                <option value="Read/Write">Read/Write</option>
                <option value="Read Only">Read Only</option>
                <option value="Full Access">Full Access</option>
              </select>
            </div>

            {/* Account Clearance Status */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Security State</label>
              <div className="flex gap-6 mt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="radio"
                    name="status"
                    value="Active"
                    checked={newStatus === "Active"}
                    onChange={() => setNewStatus("Active")}
                    className="w-4 h-4 rounded-full text-indigo-650 border-slate-350 focus:ring-indigo-650/5 cursor-pointer"
                  />
                  <span>Active Clearance</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="radio"
                    name="status"
                    value="Suspended"
                    checked={newStatus === "Suspended"}
                    onChange={() => setNewStatus("Suspended")}
                    className="w-4 h-4 rounded-full text-indigo-650 border-slate-350 focus:ring-indigo-650/5 cursor-pointer"
                  />
                  <span>Suspended Scope</span>
                </label>
              </div>
            </div>

            {/* Submission Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 mt-2">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-all shadow-md shadow-indigo-600/10 cursor-pointer flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Provision User Profile</span>
              </button>
            </div>

          </form>

        </div>

        {/* Right Column: Last Created User History (5 Columns) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col gap-6 text-left">
          
          <div className="flex flex-col gap-1.5 border-b border-slate-100 pb-4">
            <h3 className="text-sm font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Created History Stream</span>
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Chronological log of newly provisioned employees and interns within the system index.
            </p>
          </div>

          {/* History stream list */}
          <div className="flex flex-col gap-3.5 overflow-y-auto max-h-[500px] pr-1 scrollbar-thin">
            {usersList.slice(0, 5).map((user) => (
              <div 
                key={user.id || user.email}
                className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl flex items-start gap-3 hover:border-slate-350 transition-all duration-300 group"
              >
                {/* Badge Avatar */}
                <div className={`w-9.5 h-9.5 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-300 ${user.badgeColor || 'bg-indigo-600 text-white'}`}>
                  {user.initials || 'U'}
                </div>
                
                {/* Meta details */}
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 text-xs truncate group-hover:text-indigo-950 transition-colors">
                      {user.name}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8.5px] font-extrabold border shrink-0 ${
                      user.role === "Employee"
                        ? "bg-indigo-50 text-indigo-850 border-indigo-100"
                        : "bg-amber-50 text-amber-850 border-amber-100"
                    }`}>
                      {user.role}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                    {user.email}
                  </span>
                  
                  <div className="flex items-center gap-1.5 mt-2.5 text-[9px] font-bold text-slate-500">
                    <span className="bg-slate-200/60 px-1.5 py-0.5 rounded text-[8.5px] uppercase tracking-tight">{user.department || 'Operations'}</span>
                    <span className="text-slate-350">•</span>
                    <span className="text-indigo-600 font-semibold">{user.permissions || 'Read/Write'}</span>
                    <span className="text-slate-350">•</span>
                    <span className={`inline-flex items-center gap-0.5 ${
                      user.status === "Active" ? "text-emerald-600" : "text-rose-600"
                    }`}>
                      {user.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {usersList.length === 0 && (
              <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 text-slate-400 text-xs font-semibold px-4 flex flex-col items-center justify-center gap-2">
                <Users className="w-8 h-8 text-slate-300 animate-pulse" />
                <span>No employee or intern profiles registered in system context.</span>
              </div>
            )}
          </div>

          {/* Secure Audit Log Note */}
          <div className="mt-auto pt-4 border-t border-slate-100 text-[10px] font-semibold text-slate-400 leading-normal flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>Audit trails are encrypted, fully immutable, and recorded under active HR sessions.</span>
          </div>

        </div>

      </div>

    </div>
  );
}
